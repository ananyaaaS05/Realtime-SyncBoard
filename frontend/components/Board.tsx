import React, { useState, useMemo } from 'react';
import { DragDropContext, Droppable, DropResult } from '@hello-pangea/dnd';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, X } from 'lucide-react';
import { TaskCard } from './TaskCard';
import { TaskModal } from './TaskModal';
import { useCollabBoard, Task } from '../hooks/useCollabBoard';

const COLUMNS = [
  { id: 'backlog', title: 'Backlog', glow: 'border-t-cyan-500 shadow-cyan-500/20 text-cyan-400', dropGlow: 'bg-cyan-500/10 ring-cyan-400/30' },
  { id: 'in_progress', title: 'In Progress', glow: 'border-t-fuchsia-500 shadow-fuchsia-500/20 text-fuchsia-400', dropGlow: 'bg-fuchsia-500/10 ring-fuchsia-400/30' },
  { id: 'completed', title: 'Completed', glow: 'border-t-emerald-500 shadow-emerald-500/20 text-emerald-400', dropGlow: 'bg-emerald-500/10 ring-emerald-400/30' },
];

export const Board: React.FC = () => {
  const { tasks, moveTask, createTask, deleteTask, updateTask, activeUsers, activities } = useCollabBoard([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string | null>(null);
  const [activeTaskModal, setActiveTaskModal] = useState<Task | null>(null);

  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    // Call moveTask from our hook to update state and send to server
    // destination.index represents the final ordered position within the column
    // Wrap in requestAnimationFrame to ensure the library's drop animation finishes before React re-renders everything
    requestAnimationFrame(() => {
      moveTask(draggableId, destination.droppableId, destination.index);
    });
  };

  return (
    <div className="min-h-screen bg-[#06060c] font-sans selection:bg-fuchsia-500/30 text-slate-200 relative overflow-hidden flex flex-col pt-6 md:pt-12 px-6 md:px-12">
      {/* Animated Gradient Background Blobs */}
      <div className="absolute top-0 -left-10 w-96 h-96 bg-fuchsia-600 rounded-full mix-blend-screen filter blur-[128px] opacity-20 animate-blob pointer-events-none"></div>
      <div className="absolute top-0 -right-10 w-96 h-96 bg-cyan-600 rounded-full mix-blend-screen filter blur-[128px] opacity-20 animate-blob animation-delay-2000 pointer-events-none"></div>
      <div className="absolute -bottom-20 left-1/2 w-96 h-96 bg-indigo-600 rounded-full mix-blend-screen filter blur-[128px] opacity-20 animate-blob animation-delay-4000 pointer-events-none"></div>

      <header className="mb-8 flex flex-col md:flex-row md:items-start justify-between gap-6 relative z-10">
        <div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-white text-glow-neon">
            PROJECT<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-500">_TASKS</span>
          </h1>
          <p className="text-slate-400 text-sm mt-2 tracking-widest uppercase font-semibold opacity-80">Real-time collaborative workspace</p>
          
          <div className="mt-8 max-w-md">
            <input
              type="text"
              className="w-full px-5 py-3 text-sm rounded-xl border border-white/10 bg-[#0d1117]/80 backdrop-blur-md text-white placeholder-slate-500 focus:outline-none focus:border-fuchsia-500/50 focus:ring-1 focus:ring-fuchsia-500/50 transition-all shadow-lg"
              placeholder="What needs to be done? Press Enter to add..."
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newTaskTitle.trim()) {
                  createTask({
                    title: newTaskTitle.trim(),
                    description: '',
                    column: 'backlog',
                    priority: 'medium',
                  });
                  setNewTaskTitle('');
                }
              }}
            />
          </div>
        </div>

        {/* User Presence Bar */}
        <div className="flex items-center gap-4 bg-[#0d1117]/80 backdrop-blur-md border border-white/10 rounded-xl px-5 py-2.5 shadow-lg">
          <div className="flex -space-x-2">
            {activeUsers.map((user, idx) => {
              const bgColors = ['bg-pink-500', 'bg-indigo-500', 'bg-purple-500', 'bg-blue-500', 'bg-emerald-500', 'bg-orange-500'];
              const color = bgColors[idx % bgColors.length];
              return (
                <div 
                  key={user} 
                  className={`relative flex items-center justify-center w-7 h-7 rounded-full border border-slate-900 ${color} text-white font-medium text-xs shadow-none cursor-default`} 
                  title={user}
                >
                  {user.charAt(0).toUpperCase()}
                  <span className="absolute bottom-0 right-0 w-2 h-2 bg-[#2ea043] border border-slate-900 rounded-full"></span>
                </div>
              );
            })}
          </div>
          <div className="text-xs font-mono text-slate-400 whitespace-nowrap">
            {activeUsers.length} online
          </div>
        </div>
      </header>

      {/* --- Filters & Search Bar --- */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center border-b border-white/5 pb-5 relative z-10">
        {/* Search Input */}
        <div className="relative flex-1 max-w-sm w-full">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search size={16} className="text-slate-500" />
          </div>
          <input
            type="text"
            className="w-full pl-11 pr-4 py-2.5 text-sm rounded-xl border border-white/10 bg-[#0d1117]/80 backdrop-blur-md text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all shadow-lg"
            placeholder="Filter by title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Priority Filter Pills */}
        <div className="flex gap-2 items-center flex-wrap">
          {['High', 'Medium', 'Low'].map((p) => (
            <motion.button
              whileTap={{ scale: 0.95 }}
              key={p}
              onClick={() => setPriorityFilter(priorityFilter === p ? null : p)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase border transition-all ${
                priorityFilter === p
                  ? 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/50 shadow-[0_0_10px_rgba(217,70,239,0.3)]'
                  : 'bg-[#0d1117]/80 text-slate-400 border-white/10 hover:border-white/20'
              }`}
            >
              {p}
            </motion.button>
          ))}
          
          {(priorityFilter || searchQuery) && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setPriorityFilter(null);
                setSearchQuery('');
              }}
              className="flex items-center gap-1 px-2 py-1 ml-2 rounded text-xs font-mono bg-transparent text-slate-500 hover:text-slate-300 transition-colors"
            >
              <X size={12} /> clear
            </motion.button>
          )}
        </div>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex flex-col xl:flex-row gap-6 items-start h-full pb-8 overflow-x-auto snap-x">
          {COLUMNS.map((column) => {
            const columnTasks = tasks
              .filter((task) => task.column === column.id)
              .filter((task) => !searchQuery || task.title.toLowerCase().includes(searchQuery.toLowerCase().trim()))
              .filter((task) => !priorityFilter || task.priority.toLowerCase() === priorityFilter.toLowerCase())
              .sort((a, b) => a.position - b.position);

            return (
              <div
                key={column.id}
                className={`flex-[1_0_320px] max-w-md bg-[#0d1117]/60 backdrop-blur-xl rounded-2xl p-4 min-h-[600px] flex flex-col border border-white/5 border-t-2 shadow-2xl xl:snap-center relative z-10 ${column.glow}`}
              >
                <div className="flex items-center justify-between mb-5 px-2">
                  <h2 className={`font-black uppercase tracking-widest text-sm flex items-center gap-3 ${column.glow.split(' ').pop()}`}>
                    {column.title}
                    <span className="bg-black/50 text-white font-mono text-[10px] px-2 py-1 rounded-full border border-white/10 shadow-inner">
                      {columnTasks.length}
                    </span>
                  </h2>
                </div>

                <Droppable droppableId={column.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex-1 transition-all duration-300 rounded-xl p-1.5 ${
                        snapshot.isDraggingOver ? `${column.dropGlow} ring-1` : 'bg-transparent'
                      }`}
                    >
                      {/* Added AnimatePresence to coordinate enter/exit animations */}
                      <AnimatePresence>
                        {columnTasks.map((task, index) => (
                          <TaskCard key={task.id} task={task} index={index} onDelete={deleteTask} onUpdate={updateTask} onClick={setActiveTaskModal} />
                        ))}
                      </AnimatePresence>
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>

      <TaskModal
        task={activeTaskModal}
        isOpen={!!activeTaskModal}
        onClose={() => setActiveTaskModal(null)}
        onSave={updateTask}
      />
    </div>
  );
};
