import React, { memo } from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { motion } from 'framer-motion';
import { Trash2 } from 'lucide-react';
import { Task } from '../hooks/useCollabBoard';

interface TaskCardProps {
  task: Task;
  index: number;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Task>) => void;
  onClick: (task: Task) => void;
}

const priorityColors = {
  high: { bg: 'bg-fuchsia-500/10 border-fuchsia-500/30', text: 'text-fuchsia-400', strip: 'bg-fuchsia-500', shadow: 'shadow-[0_0_20px_rgba(217,70,239,0.15)] hover:shadow-[0_0_25px_rgba(217,70,239,0.3)]' },
  medium: { bg: 'bg-cyan-500/10 border-cyan-500/30', text: 'text-cyan-400', strip: 'bg-cyan-500', shadow: 'shadow-[0_0_20px_rgba(6,182,212,0.15)] hover:shadow-[0_0_25px_rgba(6,182,212,0.3)]' },
  low: { bg: 'bg-emerald-500/10 border-emerald-500/30', text: 'text-emerald-400', strip: 'bg-emerald-500', shadow: 'shadow-[0_0_20px_rgba(16,185,129,0.15)] hover:shadow-[0_0_25px_rgba(16,185,129,0.3)]' },
};

export const TaskCard: React.FC<TaskCardProps> = memo(({ task, index, onDelete, onUpdate, onClick }) => {
  const colors = priorityColors[task.priority.toLowerCase() as keyof typeof priorityColors] || priorityColors.low;
  
  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          style={{ ...provided.draggableProps.style }}
          className="mb-3"
        >
          <motion.div
            layout
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0, rotate: snapshot.isDragging ? 3 : 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -20, transition: { duration: 0.2 } }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            onClick={() => onClick(task)}
            className={`
              relative overflow-hidden p-4 mb-4 rounded-xl border backdrop-blur-md group cursor-grab active:cursor-grabbing
              transition-all duration-300 ease-out ${colors.bg} hover:${colors.shadow}
              ${snapshot.isDragging ? `shadow-2xl z-50 ${colors.shadow} scale-105` : ''}
            `}
          >
            {/* Vivid Priority Strip on left edge */}
            <div className={`absolute left-0 top-0 bottom-0 w-[3px] ${colors.strip}`} />
            
            <div className="flex justify-between items-start mb-2 pl-2">
              <h4 className="font-medium text-slate-200 text-sm leading-snug flex-1 pr-2">
                {task.title}
              </h4>
            </div>
            
            {task.description && (
              <p className="text-xs text-slate-500 line-clamp-2 mb-4 pl-2 font-sans leading-relaxed">
                {task.description}
              </p>
            )}
            
            <div className="flex items-center justify-between mt-auto pl-2">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={(e) => {
                  e.stopPropagation();
                  const cycle = { low: 'medium', medium: 'high', high: 'low' } as const;
                  const current = task.priority.toLowerCase() as keyof typeof cycle;
                  const nextPriority = cycle[current] || 'low';
                  onUpdate(task.id, { priority: nextPriority });
                }}
                className={`text-[10px] uppercase font-mono tracking-wide cursor-pointer transition-colors ${colors.text} hover:text-slate-200`}
                title="Click to change priority"
              >
                {task.priority}
              </motion.button>
              
              {/* Delete button replacing avatar placeholder */}
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(task.id);
                }}
                className="text-slate-500 hover:text-[#f85149] transition-colors p-1 rounded focus:outline-none opacity-0 group-hover:opacity-100 shrink-0"
                aria-label="Delete Task"
              >
                <Trash2 size={14} />
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </Draggable>
  );
});
