// @ts-nocheck
"use client"
import { CheckCircle2, Circle, Clock } from 'lucide-react';

interface Task {
  id: number;
  title: string;
  category: string;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
  dueDate?: string;
}

interface TaskProgressProps {
  tasks: Task[];
  isAdvanced: boolean;
}

const priorityColors = {
  high: 'bg-rose-50 text-rose-700 border-rose-200',
  medium: 'bg-amber-50 text-amber-700 border-amber-200',
  low: 'bg-slate-50 text-slate-700 border-slate-200'
};

export function TaskProgress({ tasks, isAdvanced }: TaskProgressProps) {
  const completedCount = tasks.filter(t => t.completed).length;
  const totalCount = tasks.length;
  const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <div className="bg-white rounded-xl shadow-sm p-5 border border-slate-100">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-semibold text-slate-900">Task Progress</h2>
        <div className="text-sm text-slate-600">
          <span className="font-medium text-slate-900">{completedCount}</span> of {totalCount} completed
        </div>
      </div>

      <div className="mb-5">
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-emerald-500 transition-all duration-500"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      <div className="space-y-3">
        {tasks.length === 0 ? (
          <p className="text-sm text-slate-400 py-4 text-center">No tasks yet</p>
        ) : tasks.map((task) => (
          <div 
            key={task.id} 
            className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
              task.completed ? 'bg-slate-50' : 'hover:bg-slate-50'
            }`}
          >
            {task.completed ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
            ) : (
              <Circle className="w-5 h-5 text-slate-300 flex-shrink-0 mt-0.5" />
            )}
            
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${
                task.completed ? 'text-slate-500 line-through' : 'text-slate-900'
              }`}>
                {task.title}
              </p>
              
              {isAdvanced && (
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span className="text-xs text-slate-500">{task.category}</span>
                  {task.dueDate && !task.completed && (
                    <>
                      <span className="text-slate-300">•</span>
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        <Clock className="w-3 h-3" />
                        <span>{task.dueDate}</span>
                      </div>
                    </>
                  )}
                  <span 
                    className={`px-2 py-0.5 rounded text-xs font-medium border ${priorityColors[task.priority]}`}
                  >
                    {task.priority}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
