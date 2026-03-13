import json
import logging
import os
import random
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import create_engine, Column, String, Integer
from sqlalchemy.orm import declarative_base, sessionmaker, Session

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Collaborative Task Board API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Database Setup (SQLite) ---
SQLALCHEMY_DATABASE_URL = "sqlite:///./tasks.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# --- SQLAlchemy Model ---
class TaskDB(Base):
    __tablename__ = "tasks"

    id = Column(String, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(String, default="")
    column = Column(String, default="todo")
    priority = Column(String, default="medium")
    subtasks = Column(String, default="[]") # JSON string for subtasks array
    version = Column(Integer, default=1)
    position = Column(Integer, default=0) # New field to maintain ordering within column

class ActivityDB(Base):
    __tablename__ = "activities"

    id = Column(String, primary_key=True, index=True)
    user = Column(String)
    action = Column(String)
    timestamp = Column(String) # Storing ISO format datetime strings

Base.metadata.create_all(bind=engine)

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- Schema ---
class Task(BaseModel):
    id: str
    title: str
    description: str = ""
    column: str = "todo"
    priority: str = "medium"
    subtasks: str = "[]"
    version: int = 1
    position: int = 0

class Activity(BaseModel):
    id: str
    user: str
    action: str
    timestamp: str

# --- Data Access layer ---

def get_all_tasks(db: Session) -> List[Task]:
    tasks_db = db.query(TaskDB).all()
    # Convert SQLAlchemy models to Pydantic models
    return [Task.model_validate(task.__dict__) for task in tasks_db]

def add_new_task(db: Session, task: Task) -> Task:
    db_task = TaskDB(**task.model_dump())
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return Task.model_validate(db_task.__dict__)

def get_task_by_id(db: Session, task_id: str) -> Optional[Task]:
    db_task = db.query(TaskDB).filter(TaskDB.id == task_id).first()
    if db_task:
        return Task.model_validate(db_task.__dict__)
    return None

def delete_task_by_id(db: Session, task_id: str) -> bool:
    db_task = db.query(TaskDB).filter(TaskDB.id == task_id).first()
    if db_task:
        db.delete(db_task)
        db.commit()
        return True
    return False

def update_task_properties(db: Session, task_id: str, new_column: str, expected_version: int, position: Optional[int] = None) -> tuple[bool, str]:
    db_task = db.query(TaskDB).filter(TaskDB.id == task_id).first()
    if not db_task:
        return False, "Task not found"
        
    # Conflict Resolution: Optimistic Concurrency Control
    if db_task.version != expected_version:
        return False, f"Version mismatch. Server has v{db_task.version}, client sent v{expected_version}"
        
    db_task.column = new_column
    if position is not None:
        db_task.position = position
        
    db_task.version += 1 # Increment version on success
    db.commit()
    return True, ""

def update_task_properties_general(db: Session, task_id: str, updates: dict, expected_version: int) -> tuple[bool, str]:
    db_task = db.query(TaskDB).filter(TaskDB.id == task_id).first()
    if not db_task:
        return False, "Task not found"
        
    if db_task.version != expected_version:
        return False, f"Version mismatch. Server has v{db_task.version}, client sent v{expected_version}"
        
    # Apply allowed updates dynamically
    allowed_keys = ['title', 'description', 'priority', 'subtasks']
    for key in allowed_keys:
        if key in updates:
            setattr(db_task, key, updates[key])
            
    db_task.version += 1
    db.commit()
    return True, ""

def get_recent_activities(db: Session, limit: int = 15) -> List[Activity]:
    activities_db = db.query(ActivityDB).order_by(ActivityDB.timestamp.desc()).limit(limit).all()
    # Return in chronological order
    return [Activity.model_validate(act.__dict__) for act in reversed(activities_db)]

def add_activity(db: Session, user: str, action: str) -> Activity:
    act_id = f"act_{random.randint(10000, 99999)}_{int(datetime.now(timezone.utc).timestamp())}"
    timestamp = datetime.now(timezone.utc).isoformat()
    new_act = ActivityDB(id=act_id, user=user, action=action, timestamp=timestamp)
    db.add(new_act)
    db.commit()
    db.refresh(new_act)
    return Activity.model_validate(new_act.__dict__)

# --- WebSocket Connection Manager ---
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[WebSocket, str] = {}

    async def connect(self, websocket: WebSocket) -> str:
        await websocket.accept()
        user_id = f"User-{random.randint(1000, 9999)}"
        self.active_connections[websocket] = user_id
        logger.info(f"Client {user_id} connected. Total clients: {len(self.active_connections)}")
        return user_id

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            user_id = self.active_connections.pop(websocket)
            logger.info(f"Client {user_id} disconnected. Total clients: {len(self.active_connections)}")

    def get_active_users(self) -> List[str]:
        return list(self.active_connections.values())

    async def broadcast(self, message: dict):
        # Broadcast message to all connected clients
        for connection in self.active_connections.keys():
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.error(f"Error broadcasting to client: {e}")

manager = ConnectionManager()

async def broadcast_activities(db: Session, act: Activity):
    print(f"Activity Saved to DB: User {act.user} {act.action}")
    recent_activities = get_recent_activities(db)
    
    # Format activities as simple strings
    formatted_activities = [
        f"{a.user} {a.action} ({datetime.fromisoformat(a.timestamp).strftime('%H:%M:%S')})"
        for a in recent_activities
    ]
    
    await manager.broadcast({
        "event": "activity_update",
        "type": "activity_update",
        "data": formatted_activities
    })

# --- HTTP Endpoints ---
@app.get("/tasks", response_model=List[Task])
def read_all_tasks(db: Session = Depends(get_db)):
    """Retrieve all current tasks via HTTP"""
    return get_all_tasks(db)

# --- WebSocket Endpoint ---
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, db: Session = Depends(get_db)):
    user_id = None
    try:
        user_id = await manager.connect(websocket)
        
        initial_tasks = get_all_tasks(db)
        sync_message = {
            "type": "sync",
            "payload": [task.model_dump() for task in initial_tasks]
        }
        await websocket.send_json(sync_message)
        
        while True:
            data = await websocket.receive_text()
            print(f"Message received: {data}")
            
    except Exception as e:
        print(f"WebSocket connection failed with error: {repr(e)}")
    finally:
        if user_id:
            manager.disconnect(websocket)

if __name__ == "__main__":
    import uvicorn
    print("Server is alive and waiting for connections...")
    # Run the server on port 8000
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
