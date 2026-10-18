import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  Circle,
  Trash2,
  Clock,
  RefreshCw,
  Calendar,
  AlertCircle,
  X,
} from 'lucide-react';

export interface TaskItem {
  id: number;
  user_sub: string;
  user_email: string;
  task: string;
  due_at: string | null;
  suggested_action: string | null;
  reminder_sent: number;
  completed: number;
  created_at: string;
}

interface TaskTrayProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTask?: (task: TaskItem) => void;
}

export default function TaskTray({ isOpen, onClose, onSelectTask }: TaskTrayProps) {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('pending');

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/tasks');
      if (res.ok) {
        const data = await res.json();
        if (data?.success && Array.isArray(data.tasks)) {
          setTasks(data.tasks);
        }
      }
    } catch {
      // Ignore in unauthenticated state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchTasks();
    }
  }, [isOpen, fetchTasks]);

  const toggleComplete = async (taskId: number) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/complete`, { method: 'PATCH' });
      if (res.ok) {
        setTasks((prev) =>
          prev.map((t) => (t.id === taskId ? { ...t, completed: t.completed ? 0 : 1 } : t))
        );
      }
    } catch {
      // Handle error gracefully
    }
  };

  const deleteTask = async (taskId: number) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
      if (res.ok) {
        setTasks((prev) => prev.filter((t) => t.id !== taskId));
      }
    } catch {
      // Handle error gracefully
    }
  };

  const filteredTasks = tasks.filter((t) => {
    if (filter === 'pending') return !t.completed;
    if (filter === 'completed') return !!t.completed;
    return true;
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, x: 300 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 300 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed inset-y-0 right-0 w-full max-w-md bg-[#10141a] border-l border-[#1e2430] z-50 flex flex-col shadow-xl"
        >
          {/* Header */}
          <div className="p-4 border-b border-[#1e2430] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-400" />
              <h2 className="text-sm font-semibold text-[#f3f5f8]">SQLite Task Database</h2>
              <span className="text-xs px-2 py-0.5 rounded bg-[#1e2430] text-[#9aa2b2] font-mono">
                {tasks.length}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={fetchTasks}
                className="p-1.5 rounded text-[#9aa2b2] hover:text-[#f3f5f8] hover:bg-[#161b24] transition-colors"
                title="Refresh tasks"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={onClose}
                className="p-1.5 rounded text-[#9aa2b2] hover:text-[#f3f5f8] hover:bg-[#161b24] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="px-4 py-2.5 border-b border-[#1e2430] flex items-center gap-2">
            {(['pending', 'completed', 'all'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setFilter(mode)}
                className={`text-xs px-3 py-1 rounded-md font-medium transition-colors capitalize ${
                  filter === mode
                    ? 'bg-[#2563eb] text-white'
                    : 'text-[#9aa2b2] hover:bg-[#161b24] hover:text-[#f3f5f8]'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          {/* Task List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
            {filteredTasks.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-[#677184]">
                <AlertCircle className="w-8 h-8 mb-2 stroke-1" />
                <p className="text-xs font-medium text-[#9aa2b2]">No tasks found</p>
                <p className="text-xs text-[#677184] mt-1 max-w-xs">
                  Ask the Personal Assistant to schedule a task or reminder (e.g. "Remind me to call the dentist tomorrow at 9am").
                </p>
              </div>
            ) : (
              filteredTasks.map((task) => (
                <motion.div
                  key={task.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`p-3 rounded-lg border transition-colors flex items-start justify-between gap-3 ${
                    task.completed
                      ? 'bg-[#0d1015] border-[#181d26] opacity-60'
                      : 'bg-[#161b24] border-[#1e2430] hover:border-[#2c3547]'
                  }`}
                >
                  <button
                    onClick={() => toggleComplete(task.id)}
                    className="mt-0.5 text-[#9aa2b2] hover:text-emerald-400 transition-colors shrink-0"
                  >
                    {task.completed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Circle className="w-4 h-4" />
                    )}
                  </button>

                  <div
                    className="flex-1 cursor-pointer"
                    onClick={() => onSelectTask?.(task)}
                  >
                    <p
                      className={`text-xs font-medium leading-snug ${
                        task.completed ? 'line-through text-[#677184]' : 'text-[#f3f5f8]'
                      }`}
                    >
                      {task.task}
                    </p>

                    {task.due_at && (
                      <div className="flex items-center gap-1 mt-1 text-[11px] text-blue-400 font-mono">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(task.due_at).toLocaleString()}</span>
                      </div>
                    )}

                    {task.suggested_action && (
                      <p className="text-[11px] text-[#9aa2b2] mt-1">
                        &rarr; {task.suggested_action}
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => deleteTask(task.id)}
                    className="text-[#677184] hover:text-red-400 transition-colors p-1"
                    title="Delete task"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </motion.div>
              ))
            )}
          </div>

          {/* Footer Status */}
          <div className="p-3 border-t border-[#1e2430] bg-[#090b0e] text-[11px] text-[#677184] flex items-center justify-between">
            <span>Backed by local SQLite (`lifepilot.db`)</span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              1m cron poller
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
