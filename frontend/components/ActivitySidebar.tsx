import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity as ActivityIcon, X } from 'lucide-react';

interface ActivitySidebarProps {
  activities: string[];
  isOpen: boolean;
  onClose: () => void;
}

export const ActivitySidebar: React.FC<ActivitySidebarProps> = ({ activities, isOpen, onClose }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <React.Fragment>
          {/* Backdrop for mobile closing */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-sm lg:hidden"
          />

          {/* Slide-out Sidebar */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 w-80 max-w-[90vw] bg-[#161b22] border-l border-slate-800 z-50 flex flex-col pt-6 font-sans"
          >
            <div className="px-6 pb-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-200">
                <ActivityIcon size={16} className="text-slate-400" />
                <h2 className="font-semibold text-sm tracking-wide">Activity Feed</h2>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 text-slate-500 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar">
              {activities.length === 0 ? (
                <div className="text-center text-slate-500 mt-10">
                  <p className="text-sm">No recent activity.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {activities.map((act, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="relative pl-6"
                    >
                      {/* Timeline Line */}
                      {index !== activities.length - 1 && (
                        <div className="absolute top-5 bottom-[-24px] left-[7px] w-px bg-slate-800" />
                      )}
                      
                      {/* Timeline Dot */}
                      <div className="absolute top-1.5 left-0 w-[15px] h-[15px] rounded-full bg-[#0d1117] border-[2px] border-slate-700" />

                      <div className="text-xs text-slate-300 leading-snug pt-0.5">
                        {act}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </React.Fragment>
      )}
    </AnimatePresence>
  );
};
