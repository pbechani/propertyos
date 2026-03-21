// @ts-nocheck
"use client"
import { useState, useEffect } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import {
  Calendar,
  MoreVertical,
  Plus,
  AlertCircle,
  Circle,
  Tag,
  User,
  X,
  FileText,
  StickyNote,
} from 'lucide-react';
import { agentApi, companiesApi, CompanyMember, OpenHouseRecord } from '@/lib/api-client';
import { getAccessToken, getActiveCompanyIdFromToken } from '@/lib/auth-session';

interface Task {
  id: string;
  title: string;
  description: string;
  openHouseId: string;
  itemIndex: number;
  property: string;
  dueDate: string;
  taskDueDate: string;
  status: 'todo' | 'inProgress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high';
  tags: string[];
  assignedTo: string[];
  notes: string;
  eventTiming: 'before' | 'during' | 'after' | '';
}

const columns = [
  { id: 'todo',       title: 'To Do',       headerColor: 'bg-slate-700/80',   dotColor: 'bg-slate-400'   },
  { id: 'inProgress', title: 'In Progress', headerColor: 'bg-blue-900/70',    dotColor: 'bg-blue-400'    },
  { id: 'review',     title: 'Review',      headerColor: 'bg-amber-900/60',   dotColor: 'bg-amber-400'   },
  { id: 'done',       title: 'Done',        headerColor: 'bg-emerald-900/60', dotColor: 'bg-emerald-400' },
];

const PRIORITY_BADGE: Record<string, string> = {
  high:   'bg-rose-600 text-white',
  medium: 'bg-amber-500 text-white',
  low:    'bg-slate-600 text-slate-200',
};

function buildTasks(openHouses: OpenHouseRecord[]): Task[] {
  const tasks: Task[] = [];
  for (const oh of openHouses) {
    if (!oh.preparation_checklist?.length) continue;
    for (let i = 0; i < oh.preparation_checklist.length; i++) {
      const item = oh.preparation_checklist[i] as any;
      const status: Task['status'] = item.status ?? (item.completed ? 'done' : 'todo');
      const priority: Task['priority'] = item.priority ?? 'medium';
      const tags: string[] = item.tags ?? [];
      tasks.push({
        id: `${oh.id}__${i}`,
        title: item.task,
        description: item.description ?? '',
        openHouseId: oh.id,
        itemIndex: i,
        property: oh.property_title,
        dueDate: oh.scheduled_at,
        taskDueDate: item.taskDueDate ?? '',
        priority,
        status,
        tags,
        assignedTo: Array.isArray(item.assignedTo) ? item.assignedTo : (item.assignedTo ? [item.assignedTo] : []),
        notes: item.notes ?? '',
        eventTiming: item.eventTiming ?? '',
      });
    }
  }
  return tasks;
}

export function KanbanBoard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [openHouses, setOpenHouses] = useState<OpenHouseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskOhId, setNewTaskOhId] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<Task['priority']>('medium');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [newTaskAssignedTo, setNewTaskAssignedTo] = useState<string[]>([]);
  const [newTaskNotes, setNewTaskNotes] = useState('');
  const [newTaskEventTiming, setNewTaskEventTiming] = useState<'before' | 'during' | 'after' | ''>('');
  const [newTaskTags, setNewTaskTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState('');
  const [teamMembers, setTeamMembers] = useState<CompanyMember[]>([]);

  useEffect(() => {
    async function load() {
      const token = await getAccessToken();
      if (!token) { setLoading(false); return; }
      try {
        const [data] = await Promise.all([
          agentApi.getOpenHouses(token),
          (async () => {
            const companyId = getActiveCompanyIdFromToken();
            if (companyId) {
              try {
                const members = await companiesApi.listMembers(token, companyId);
                setTeamMembers(members.filter((m: CompanyMember) => m.status === 'active'));
              } catch { /* non-critical */ }
            }
          })(),
        ]);
        setOpenHouses(data);
        setTasks(buildTasks(data));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const moveTask = async (taskId: string, newStatus: Task['status']) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task || task.status === newStatus) return;

    // Optimistic update
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));

    const oh = openHouses.find(o => o.id === task.openHouseId);
    if (!oh?.preparation_checklist) return;

    const updatedChecklist = oh.preparation_checklist.map((item, idx) =>
      idx === task.itemIndex
        ? { ...item, status: newStatus, completed: newStatus === 'done' }
        : item
    );

    const token = await getAccessToken();
    if (!token) return;
    try {
      await agentApi.updateOpenHouse(token, oh.id, { preparationChecklist: updatedChecklist });
      setOpenHouses(prev => prev.map(o =>
        o.id === oh.id ? { ...o, preparation_checklist: updatedChecklist } : o
      ));
    } catch {
      // Rollback on error
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: task.status } : t));
    }
  };

  const handleAddTask = async () => {
    if (!newTaskTitle.trim() || !newTaskOhId) return;
    const oh = openHouses.find(o => o.id === newTaskOhId);
    if (!oh) return;

    const existing = oh.preparation_checklist ?? [];
    const updatedChecklist = [
      ...existing,
      {
        task: newTaskTitle.trim(),
        description: newTaskDescription.trim(),
        completed: false,
        status: 'todo',
        priority: newTaskPriority,
        tags: newTaskTags,
        taskDueDate: newTaskDueDate,
        assignedTo: newTaskAssignedTo,
        notes: newTaskNotes.trim(),
        eventTiming: newTaskEventTiming,
      },
    ];

    const token = await getAccessToken();
    if (!token) return;
    await agentApi.updateOpenHouse(token, oh.id, { preparationChecklist: updatedChecklist });

    const updatedOHs = openHouses.map(o =>
      o.id === oh.id ? { ...o, preparation_checklist: updatedChecklist } : o
    );
    setOpenHouses(updatedOHs);
    setTasks(buildTasks(updatedOHs));
    setNewTaskTitle('');
    setNewTaskDescription('');
    setNewTaskOhId('');
    setNewTaskPriority('medium');
    setNewTaskDueDate('');
    setNewTaskAssignedTo([]);
    setNewTaskNotes('');
    setNewTaskEventTiming('');
    setNewTaskTags([]);
    setNewTagInput('');
    setShowAddTask(false);
  };

  const getTasksByStatus = (status: Task['status']) => tasks.filter(t => t.status === status);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-slate-600 border-t-slate-300 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-white">Task Board</h2>
            <p className="text-slate-400 text-sm mt-0.5">Manage real estate preparation tasks</p>
          </div>
          <button
            onClick={() => setShowAddTask(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-colors flex items-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Task
          </button>
        </div>

        {/* Kanban Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {columns.map((column) => (
            <Column
              key={column.id}
              column={column}
              tasks={getTasksByStatus(column.id as Task['status'])}
              onMoveTask={moveTask}
            />
          ))}
        </div>

        {/* Add Task Modal */}
        {showAddTask && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-2xl w-full max-w-lg mx-4 flex flex-col max-h-[90vh]">
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-700">
                <h3 className="font-semibold text-white text-base">Add Preparation Task</h3>
                <button
                  onClick={() => setShowAddTask(false)}
                  aria-label="Close modal"
                  className="p-1 hover:bg-slate-700 rounded transition-colors"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              {/* Scrollable body */}
              <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">

                {/* Task Title */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Task Title <span className="text-rose-400">*</span></label>
                  <input
                    type="text"
                    value={newTaskTitle}
                    onChange={e => setNewTaskTitle(e.target.value)}
                    placeholder="e.g. Schedule professional photography"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Description</label>
                  <textarea
                    value={newTaskDescription}
                    onChange={e => setNewTaskDescription(e.target.value)}
                    placeholder="Brief description of what this task involves…"
                    rows={2}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  />
                </div>

                {/* Priority + Due Date row */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Priority</label>
                    <div className="flex gap-1">
                      {(['high', 'medium', 'low'] as const).map(p => (
                        <button
                          key={p}
                          onClick={() => setNewTaskPriority(p)}
                          className={`flex-1 py-1.5 rounded text-xs font-semibold capitalize border transition-all ${
                            newTaskPriority === p
                              ? PRIORITY_BADGE[p] + ' border-transparent'
                              : 'bg-slate-700 text-slate-400 border-slate-600 hover:border-slate-500'
                          }`}
                        >
                          {p.charAt(0).toUpperCase() + p.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Due Date</label>
                    <input
                      type="date"
                      aria-label="Due date"
                      value={newTaskDueDate}
                      onChange={e => setNewTaskDueDate(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 scheme-dark"
                    />
                  </div>
                </div>

                {/* Assigned To */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Assigned To</label>
                  <div className="flex gap-2">
                    <select
                      aria-label="Add assignee"
                      value=""
                      onChange={e => {
                        const val = e.target.value;
                        if (val && !newTaskAssignedTo.includes(val)) {
                          setNewTaskAssignedTo([...newTaskAssignedTo, val]);
                        }
                      }}
                      className="flex-1 px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Add assignee…</option>
                      {teamMembers
                        .filter((m: CompanyMember) => {
                          const name = [m.first_name, m.last_name].filter(Boolean).join(' ') || m.email;
                          return !newTaskAssignedTo.includes(name);
                        })
                        .map((m: CompanyMember) => {
                          const name = [m.first_name, m.last_name].filter(Boolean).join(' ') || m.email;
                          return <option key={m.user_id} value={name}>{name}</option>;
                        })}
                    </select>
                  </div>
                  {newTaskAssignedTo.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {newTaskAssignedTo.map(name => (
                        <span key={name} className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-900/50 border border-indigo-700/50 text-indigo-300 rounded-full text-xs">
                          <User className="w-3 h-3" />
                          {name}
                          <button type="button" onClick={() => setNewTaskAssignedTo(newTaskAssignedTo.filter(n => n !== name))} className="ml-0.5 text-indigo-400 hover:text-white">×</button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Event Timing */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Event Timing</label>
                  <select
                    aria-label="Event timing"
                    value={newTaskEventTiming}
                    onChange={e => setNewTaskEventTiming(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select timing…</option>
                    <option value="before">Before Event</option>
                    <option value="during">During Event</option>
                    <option value="after">After Event</option>
                  </select>
                </div>

                {/* Open House */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Open House <span className="text-rose-400">*</span></label>
                  <select
                    aria-label="Open house"
                    value={newTaskOhId}
                    onChange={e => setNewTaskOhId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select an open house…</option>
                    {openHouses.filter(o => o.status !== 'cancelled').map(oh => (
                      <option key={oh.id} value={oh.id}>
                        {oh.property_title} — {new Date(oh.scheduled_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Tags</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newTagInput}
                      onChange={e => setNewTagInput(e.target.value)}
                      onKeyDown={e => {
                        if ((e.key === 'Enter' || e.key === ',') && newTagInput.trim()) {
                          e.preventDefault();
                          const tag = newTagInput.trim().replace(/,$/, '');
                          if (tag && !newTaskTags.includes(tag)) setNewTaskTags(prev => [...prev, tag]);
                          setNewTagInput('');
                        }
                      }}
                      placeholder="Type and press Enter…"
                      className="flex-1 px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      onClick={() => {
                        const tag = newTagInput.trim();
                        if (tag && !newTaskTags.includes(tag)) setNewTaskTags(prev => [...prev, tag]);
                        setNewTagInput('');
                      }}
                      disabled={!newTagInput.trim()}
                      className="px-3 py-2 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-lg text-sm text-slate-300 disabled:opacity-40 transition-colors"
                    >
                      Add
                    </button>
                  </div>
                  {newTaskTags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {newTaskTags.map(tag => (
                        <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-900/50 text-blue-300 border border-blue-800/50 rounded text-xs">
                          <Tag className="w-3 h-3" />
                          {tag}
                          <button
                            onClick={() => setNewTaskTags(prev => prev.filter(t => t !== tag))}
                            aria-label={`Remove tag ${tag}`}
                            className="ml-0.5 hover:text-white"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Notes</label>
                  <textarea
                    value={newTaskNotes}
                    onChange={e => setNewTaskNotes(e.target.value)}
                    placeholder="Any additional notes or instructions…"
                    rows={3}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  />
                </div>

              </div>

              {/* Footer */}
              <div className="flex gap-3 justify-end px-6 py-4 border-t border-slate-700">
                <button
                  onClick={() => setShowAddTask(false)}
                  className="px-4 py-2 text-slate-300 border border-slate-600 rounded-lg hover:bg-slate-700 text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddTask}
                  disabled={!newTaskTitle.trim() || !newTaskOhId}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Add Task
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DndProvider>
  );
}

interface ColumnProps {
  column: typeof columns[0];
  tasks: Task[];
  onMoveTask: (taskId: string, newStatus: Task['status']) => void;
}

function Column({ column, tasks, onMoveTask }: ColumnProps) {
  const [{ isOver }, drop] = useDrop({
    accept: 'TASK',
    drop: (item: { id: string }) => {
      onMoveTask(item.id, column.id as Task['status']);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  return (
    <div
      ref={drop}
      className={`flex flex-col rounded-2xl border transition-all ${
        isOver ? 'border-indigo-500 bg-slate-800/80' : 'border-slate-700/60 bg-slate-800/40'
      }`}
    >
      {/* Column Header */}
      <div className={`px-4 py-3.5 rounded-t-2xl ${column.headerColor}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${column.dotColor}`} />
            <h3 className="font-semibold text-white text-sm">{column.title}</h3>
          </div>
          <span className="px-2 py-0.5 bg-black/30 rounded-full text-xs font-semibold text-white/80">
            {tasks.length}
          </span>
        </div>
      </div>

      {/* Tasks */}
      <div className="flex-1 p-3 space-y-3 min-h-125 overflow-y-auto">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}
        {tasks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Circle className="w-10 h-10 text-slate-600 mb-2" />
            <p className="text-sm text-slate-500">No tasks</p>
          </div>
        )}
      </div>
    </div>
  );
}

function TaskCard({ task }: { task: Task }) {
  const [{ isDragging }, drag] = useDrag({
    type: 'TASK',
    item: { id: task.id },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const displayDate = task.taskDueDate || task.dueDate;
  const isOverdue = task.status !== 'done' && new Date(displayDate) < new Date();
  const isDueToday = new Date(displayDate).toDateString() === new Date().toDateString();

  return (
    <div
      ref={drag}
      className={`bg-slate-800 border border-slate-700/80 rounded-xl p-4 cursor-move hover:border-slate-600 hover:shadow-lg hover:shadow-black/30 transition-all ${
        isDragging ? 'opacity-50 rotate-2 scale-95' : 'opacity-100'
      }`}
    >
      {/* Priority badge + 3-dot menu */}
      <div className="flex items-center justify-between mb-3">
        <span className={`px-2.5 py-1 rounded text-xs font-semibold ${PRIORITY_BADGE[task.priority]}`}>
          {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
        </span>
        <button aria-label="Task options" className="p-1 hover:bg-slate-700 rounded transition-colors">
          <MoreVertical className="w-4 h-4 text-slate-500" />
        </button>
      </div>

      {/* Task Title */}
      <h4 className={`font-semibold text-base leading-snug mb-2 line-clamp-2 ${
        task.status === 'done' ? 'text-slate-500 line-through' : 'text-white'
      }`}>
        {task.title}
      </h4>

      {/* Property pill + event timing */}
      <div className="flex flex-wrap items-center gap-1.5 mb-3">
        <span className="px-2.5 py-1 bg-slate-700/60 rounded text-xs text-slate-300">
          {task.property}
        </span>
        {task.eventTiming && (
          <span className={`px-2.5 py-1 rounded text-xs font-medium ${
            task.eventTiming === 'before' ? 'bg-violet-900/50 text-violet-300 border border-violet-800/50' :
            task.eventTiming === 'during' ? 'bg-cyan-900/50 text-cyan-300 border border-cyan-800/50' :
            'bg-teal-900/50 text-teal-300 border border-teal-800/50'
          }`}>
            {{ before: 'Before Event', during: 'During Event', after: 'After Event' }[task.eventTiming]}
          </span>
        )}
      </div>

      {/* Tags */}
      {task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {task.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-900/50 text-blue-300 border border-blue-800/50 rounded text-xs"
            >
              <Tag className="w-3 h-3" />
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Due Date */}
      <div className="flex items-center gap-1.5 text-xs mb-3">
        {isOverdue ? (
          <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
        ) : (
          <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
        )}
        <span className={isOverdue ? 'text-rose-400' : isDueToday ? 'text-amber-400' : 'text-slate-400'}>
          {new Date(displayDate).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          })}
        </span>
        {isOverdue && <span className="font-semibold text-rose-400">(Overdue)</span>}
        {isDueToday && !isOverdue && <span className="font-semibold text-amber-400">(Today)</span>}
      </div>

      {/* Description */}
      {task.description && (
        <p className="text-xs text-slate-400 mb-3 line-clamp-2 leading-relaxed">{task.description}</p>
      )}

      {/* Assignees */}
      <div className="flex items-start gap-2">
        <User className="w-3.5 h-3.5 text-slate-600 mt-0.5 shrink-0" />
        {task.assignedTo.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {task.assignedTo.map(name => (
              <span key={name} className="inline-flex items-center px-2 py-0.5 bg-indigo-900/40 border border-indigo-700/40 text-indigo-300 rounded-full text-xs">{name}</span>
            ))}
          </div>
        ) : (
          <span className="text-xs text-slate-600">Unassigned</span>
        )}
      </div>

      {/* Notes */}
      {task.notes && (
        <div className="flex items-start gap-1.5 mt-2">
          <StickyNote className="w-3.5 h-3.5 text-slate-600 mt-0.5 shrink-0" />
          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{task.notes}</p>
        </div>
      )}
    </div>
  );
}
