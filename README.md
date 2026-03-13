⚡ SyncBoard
Where Chaos Meets Coordination.
SyncBoard isn't your average boring productivity tool. It’s a high-energy, real-time collaborative workspace built for people who want their tools to look as sharp as their code. Think Cyberpunk aesthetics meets Silicon Valley performance.

🔥 The "Juice"
Instant Sync: Zero lag. Powered by a custom WebSocket engine that pushes updates faster than you can blink.

Neon Aesthetics: Deep space backgrounds with animated mesh gradients and high-contrast glow effects.

Liquid Motion: Cards don't just "move"—they slide, tilt, and spring into place using Framer Motion.

Smart Filter: Instantly hunt down tasks by title or priority with zero-latency client-side filtering.

🛠 The Engine Room
Frontend: React + Vite (for speed) + Tailwind CSS v4 (for style).

Backend: FastAPI (Python) - High performance, asynchronous, and lean.

Real-time: Bi-directional WebSockets for multi-user collaboration.

Database: SQLite & SQLAlchemy—because your tasks deserve to stay alive.

🕹 Quick Start
1. Fire up the Brain (Backend)

Bash
cd backend
pip install fastapi uvicorn sqlalchemy
python -m uvicorn main:app --reload
2. Light up the UI (Frontend)

Bash
cd frontend
npm install
npm run dev
🏗 The Engineering Grind
This wasn't just about making it pretty. We fought through:

The Schema War: Migrated SQLite on the fly to support complex JSON subtask structures.

The Handshake Protocol: Designed a "State-Sync" loop that prevents new users from entering an empty room.

Connection Resilience: Built a robust ConnectionManager to handle clients dropping in and out without crashing the stack.

How to update your GitHub:
Overwrite your README.md with this text.

In the terminal:

Bash
git add README.md
git commit -m "style: revamped README with energy"
git push origin main
