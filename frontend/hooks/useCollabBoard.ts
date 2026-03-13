import { useState, useEffect, useRef, useCallback } from 'react';

// Task schema matching the backend
export interface Task {
  id: string;
  title: string;
  description: string;
  column: string;
  priority: string;
  subtasks?: string; // JSON string payload
  version: number;
  position: number;
}
export function useCollabBoard(initialTasks: Task[] = [], wsUrl: string = 'ws://localhost:8000/ws') {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [activeUsers, setActiveUsers] = useState<string[]>([]);
  const [activities, setActivities] = useState<string[]>([]);
  const ws = useRef<WebSocket | null>(null);

  // Reference to tasks for synchronous access in callbacks without adding to dependency array
  const tasksRef = useRef<Task[]>(initialTasks);
  useEffect(() => {
    tasksRef.current = tasks;
  }, [tasks]);

  useEffect(() => {
    // Connect to the WebSocket on mount
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      console.log('Connected to WebSocket server');
    };

    ws.current.onmessage = (event: any) => {
      try {
        alert('DATA RECEIVED!');
        const message: any = JSON.parse(event.data);
        console.log('Received WebSocket Message:', message);

        // Listen for different update events from the backend
        if (message.type === 'sync' || message.type === 'sync_all_tasks' || message.event === 'sync_all_tasks') {
          console.log("SYNC RECEIVED:", message.payload || message.data);
          // Replace entire local state with the server's authoritative state on connect
          setTasks(message.payload || message.data);
        } else if (message.event === 'task_moved' || message.event === 'update' || message.event === 'sync_task') {
          if (message.event === 'sync_task') {
            console.warn('Conflict detected, syncing to authoritative state:', message.message);
          }
          setTasks((prevTasks: Task[]) =>
            prevTasks.map((t: Task) => (t.id === message.data.id ? { ...t, ...message.data } : t))
          );
        } else if (message.event === 'task_created') {
          // Add new task if it doesn't already exist locally
          setTasks((prevTasks: Task[]) => {
            if (prevTasks.some((t: Task) => t.id === message.data.id)) return prevTasks;
            return [...prevTasks, message.data];
          });
        } else if (message.event === 'task_deleted') {
          setTasks((prevTasks: Task[]) =>
            prevTasks.filter((t: Task) => t.id !== message.data.id)
          );
        } else if (message.event === 'presence_update') {
          setActiveUsers(message.data);
        } else if (message.event === 'activity_update' || message.type === 'activity_update') {
          // The backend now sends the full list of activities every time
          setActivities(message.data);
        }
      } catch (err: any) {
        console.error('Error parsing WebSocket message:', err);
      }
    };

    ws.current.onclose = () => {
      console.log('Disconnected from WebSocket server');
    };

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [wsUrl]);

  // Function to move a task to a new column
  const moveTask = useCallback((taskId: string, newColumn: string, newPosition: number) => {
    // 1. Get the current task version for optimistic concurrency control
    const task = tasksRef.current.find((t: Task) => t.id === taskId);
    if (!task) return;
    const currentVersion = task.version;

    // 2. Optimistic UI Update: Move the task instantly for the local user
    setTasks((prevTasks: Task[]) =>
      prevTasks.map((t: Task) =>
        t.id === taskId ? { ...t, column: newColumn, position: newPosition } : t
      )
    );

    // 3. Send the update securely back to the server with the version
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(
        JSON.stringify({
          action: 'move_task',
          data: {
            id: taskId,
            new_column: newColumn,
            version: currentVersion,
            position: newPosition,
          },
        })
      );
    } else {
      console.warn('WebSocket is not connected. Move update not sent to server.');
      // Note: In a production app, you might want to retry later
      // or revert the optimistic update if the server connection has failed.
    }
  }, []);

  // Function to create a task
  const createTask = useCallback((taskPayload: Omit<Task, 'id' | 'version' | 'position'> & { id?: string, version?: number, position?: number }) => {
    // If the task does not have an id, generate a simple fallback string ID avoiding crypto.randomUUID DOM lib requirements
    const fallbackId = Date.now().toString(36) + Math.random().toString(36).substring(2);
    const task = { ...taskPayload, id: taskPayload.id || fallbackId, version: 1, position: taskPayload.position || 0, subtasks: taskPayload.subtasks || "[]" };

    // Optimistic UI for create
    setTasks((prevTasks: Task[]) => [...prevTasks, task as Task]);

    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(
        JSON.stringify({
          action: 'create_task',
          data: task,
        })
      );
    }
  }, []);

  // Function to delete a task
  const deleteTask = useCallback((taskId: string) => {
    // Optimistic UI for delete
    setTasks((prevTasks: Task[]) => prevTasks.filter((t: Task) => t.id !== taskId));

    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(
        JSON.stringify({
          action: 'delete_task',
          data: { id: taskId },
        })
      );
    }
  }, []);

  // Function to update task properties
  const updateTask = useCallback((taskId: string, updates: Partial<Task>) => {
    const task = tasksRef.current.find((t: Task) => t.id === taskId);
    if (!task) return;
    const currentVersion = task.version;

    // Optimistic UI for update
    setTasks((prevTasks: Task[]) =>
      prevTasks.map((t: Task) =>
        t.id === taskId ? { ...t, ...updates } : t
      )
    );

    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(
        JSON.stringify({
          action: 'update_task',
          data: {
            id: taskId,
            ...updates,
            version: currentVersion,
          },
        })
      );
    }
  }, []);

  return { tasks, setTasks, moveTask, createTask, deleteTask, updateTask, activeUsers, activities };
}
