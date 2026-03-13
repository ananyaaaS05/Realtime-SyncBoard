import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, Circle, Plus, ListTodo } from 'lucide-react';
import { Task } from '../hooks/useCollabBoard';

interface TaskModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskId: string, updates: Partial<Task>) => void;
}

interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export const TaskModal: React.FC<TaskModalProps> = ({ task, isOpen, onClose, onSave }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [newSubtask, setNewSubtask] = useState('');

  // Sync state when modal opens with a task
  useEffect(() => {
    if (task && isOpen) {
      setTitle(task.title);
      setDescription(task.description || '');
      try {
        setSubtasks(task.subtasks ? JSON.parse(task.subtasks) : []);
      } catch (e) {
        setSubtasks([]);
      }
    }
  }, [task, isOpen]);

  const handleClose = () => {
    if (task) {
      // Auto-save on close
      onSave(task.id, {
        title: title.trim(),
        description: description.trim(),
        subtasks: JSON.stringify(subtasks),
      });
    }
    onClose();
  };

  const addSubtask = () => {
    if (newSubtask.trim()) {
      setSubtasks([...subtasks, { id: Date.now().toString(), title: newSubtask.trim(), completed: false }]);
      setNewSubtask('');
    }
  };

  const toggleSubtask = (id: string) => {
    setSubtasks(subtasks.map(st => st.id === id ? { ...st, completed: !st.completed } : st));
  };

  const deleteSubtask = (id: string) => {
    setSubtasks(subtasks.filter(st => st.id !== id));
  };

  if (!task) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="bg-indigo-100 text-indigo-600 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                  {task.column.replace('_', ' ')}
                </span>
              </div>
              <button
                onClick={handleClose}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar flex-1">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-3xl font-extrabold text-slate-800 placeholder-slate-300 focus:outline-none mb-6 bg-transparent"
                placeholder="Task Title"
              />

              <div className="mb-8">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-3">Description</h3>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add a more detailed description..."
                  className="w-full min-h-[120px] p-4 bg-slate-50 border border-slate-200 rounded-xl resize-y text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all shadow-inner"
                />
              </div>

              <div>
                <div className="flex items-center gap-2 mb-4">
                  <ListTodo className="text-slate-400" size={18} />
                  <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Subtasks</h3>
                </div>

                {/* Subtasks List */}
                <div className="space-y-2 mb-4">
                  {subtasks.map((st) => (
                    <div key={st.id} className="group flex items-center justify-between p-3 bg-white border border-slate-100 rounded-lg hover:border-slate-300 hover:shadow-sm transition-all">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <button onClick={() => toggleSubtask(st.id)} className="shrink-0 focus:outline-none">
                          {st.completed ? (
                            <CheckCircle className="text-emerald-500" size={20} />
                          ) : (
                            <Circle className="text-slate-300 hover:text-indigo-400 transition-colors" size={20} />
                          )}
                        </button>
                        <span className={`text-slate-700 truncate ${st.completed ? 'line-through text-slate-400' : ''}`}>
                          {st.title}
                        </span>
                      </div>
                      <button
                        onClick={() => deleteSubtask(st.id)}
                        className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add Subtask Input */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newSubtask}
                    onChange={(e) => setNewSubtask(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addSubtask()}
                    placeholder="Add a new subtask..."
                    className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                  />
                  <button
                    onClick={addSubtask}
                    disabled={!newSubtask.trim()}
                    className="p-3 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Plus size={20} />
                  </button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={handleClose}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/30 transition-all hover:-translate-y-0.5"
              >
                Save & Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
