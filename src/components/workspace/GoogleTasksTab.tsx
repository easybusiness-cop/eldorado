import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  Square,
  Plus,
  RefreshCw,
  Trash2,
  ListTodo,
  Calendar,
  Clock,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import {
  fetchGoogleTaskLists,
  fetchGoogleTasks,
  createGoogleTask,
  updateGoogleTask,
  deleteGoogleTask,
  type GoogleTaskList,
  type GoogleTaskItem
} from '../../utils/googleTasksService';

interface GoogleTasksTabProps {
  token: string | null;
  statusMsg: string | null;
  setStatusMsg: (msg: string | null) => void;
}

export const GoogleTasksTab: React.FC<GoogleTasksTabProps> = ({
  token,
  statusMsg,
  setStatusMsg,
}) => {
  const [taskLists, setTaskLists] = useState<GoogleTaskList[]>([
    { id: '@default', title: 'My Tasks' },
    { id: 'list-workforce', title: 'Autonomous Fleet Directives' },
  ]);
  const [selectedListId, setSelectedListId] = useState<string>('@default');
  const [tasks, setTasks] = useState<GoogleTaskItem[]>([
    {
      id: 'task-seed-1',
      title: 'Review Executive AI Fleet Performance & SLA Logs',
      notes: 'Ensure latency is < 400ms across all active departmental agents.',
      status: 'needsAction',
      due: '2026-09-09T00:00:00.000Z',
    },
    {
      id: 'task-seed-2',
      title: 'Verify Google Workspace OAuth Authorization & Tasks API',
      notes: 'Scope: https://www.googleapis.com/auth/tasks enabled for user account.',
      status: 'completed',
      completed: '2026-09-08T11:00:00.000Z',
    },
    {
      id: 'task-seed-3',
      title: 'Synchronize Corporate Cascade Executive Summaries',
      notes: 'Automate post-run markdown delivery directly to workspace dashboard.',
      status: 'needsAction',
      due: '2026-09-10T00:00:00.000Z',
    },
  ]);

  const [loading, setLoading] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskNotes, setNewTaskNotes] = useState('');
  const [filter, setFilter] = useState<'all' | 'needsAction' | 'completed'>('all');

  const loadLiveTasks = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const lists = await fetchGoogleTaskLists(token);
      if (lists.length > 0) {
        setTaskLists(lists);
        const listToFetch = selectedListId === '@default' ? lists[0].id : selectedListId;
        const liveTasks = await fetchGoogleTasks(token, listToFetch);
        setTasks(liveTasks);
        setStatusMsg(`Synced ${liveTasks.length} tasks from Google Tasks!`);
      }
    } catch (err: any) {
      console.error('Error loading tasks:', err);
      setStatusMsg(`Google Tasks API: ${err.message || 'Check permissions'}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadLiveTasks();
    }
  }, [token, selectedListId]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const taskObj = {
      title: newTaskTitle.trim(),
      notes: newTaskNotes.trim() || undefined,
    };

    setLoading(true);
    try {
      if (token) {
        const created = await createGoogleTask(token, selectedListId, taskObj);
        setTasks([created, ...tasks]);
        setStatusMsg(`Task "${created.title}" added to Google Tasks!`);
      } else {
        const mockTask: GoogleTaskItem = {
          id: `task-${Date.now()}`,
          title: taskObj.title,
          notes: taskObj.notes,
          status: 'needsAction',
        };
        setTasks([mockTask, ...tasks]);
        setStatusMsg(`Local Task "${mockTask.title}" created (Sign in with Google to sync to live Google Tasks).`);
      }
      setNewTaskTitle('');
      setNewTaskNotes('');
    } catch (err: any) {
      setStatusMsg(`Failed to create task: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTaskStatus = async (task: GoogleTaskItem) => {
    const newStatus = task.status === 'completed' ? 'needsAction' : 'completed';
    const updatedTask = { ...task, status: newStatus as 'needsAction' | 'completed' };

    setTasks((prev) => prev.map((t) => (t.id === task.id ? updatedTask : t)));

    if (token) {
      try {
        await updateGoogleTask(token, selectedListId, task.id, { status: newStatus });
        setStatusMsg(`Updated task status to ${newStatus === 'completed' ? 'Completed' : 'Active'}.`);
      } catch (err: any) {
        setStatusMsg(`Failed to update task: ${err.message}`);
      }
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    if (token) {
      try {
        await deleteGoogleTask(token, selectedListId, taskId);
        setStatusMsg('Task deleted from Google Tasks.');
      } catch (err: any) {
        setStatusMsg(`Failed to delete task: ${err.message}`);
      }
    }
  };

  const filteredTasks = tasks.filter((t) => {
    if (filter === 'needsAction') return t.status === 'needsAction';
    if (filter === 'completed') return t.status === 'completed';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-[#282828] border border-[#3c3836] p-5 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#fabd2f]/10 border border-[#fabd2f]/30 flex items-center justify-center text-[#fabd2f]">
            <ListTodo className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-[#fbf1c7]">Google Tasks Sync</h3>
              {token ? (
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#b8bb26]/20 text-[#b8bb26] border border-[#b8bb26]/30">
                  LIVE GOOGLE API
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#fe8019]/20 text-[#fe8019] border border-[#fe8019]/30">
                  OFFLINE PREVIEW MODE
                </span>
              )}
            </div>
            <p className="text-xs text-[#a89984] mt-0.5">
              Read, create, edit, complete, and manage Google Tasks connected to your Workspace account.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {token && (
            <button
              onClick={loadLiveTasks}
              disabled={loading}
              className="px-3.5 py-2 bg-[#1d2021] hover:bg-[#32302f] text-[#ebdbb2] border border-[#3c3836] rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#fabd2f] ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          )}

          <a
            href="https://tasks.google.com"
            target="_blank"
            rel="noreferrer"
            className="px-3.5 py-2 bg-[#3c3836] hover:bg-[#504945] text-[#ebdbb2] rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Open Google Tasks
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Create Task Panel */}
        <div className="lg:col-span-5 bg-[#282828] border border-[#3c3836] p-5 rounded-xl space-y-4">
          <h4 className="text-sm font-bold text-[#fbf1c7] flex items-center gap-2 border-b border-[#3c3836] pb-3">
            <Plus className="w-4 h-4 text-[#fabd2f]" />
            Create Google Task
          </h4>

          <form onSubmit={handleCreateTask} className="space-y-3">
            <div>
              <label className="block text-xs text-[#a89984] mb-1">Task Title</label>
              <input
                type="text"
                placeholder="e.g., Review Q3 Autonomous Fleet SLA &amp; Security Logs"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                className="w-full bg-[#1d2021] border border-[#3c3836] focus:border-[#fabd2f] text-xs rounded-lg p-2.5 text-[#ebdbb2] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs text-[#a89984] mb-1">Task Notes / Details (Optional)</label>
              <textarea
                rows={3}
                placeholder="Detailed instructions or context for this Google Task..."
                value={newTaskNotes}
                onChange={(e) => setNewTaskNotes(e.target.value)}
                className="w-full bg-[#1d2021] border border-[#3c3836] focus:border-[#fabd2f] text-xs rounded-lg p-2.5 text-[#ebdbb2] outline-none resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !newTaskTitle.trim()}
              className="w-full py-2.5 bg-[#fabd2f] hover:bg-[#fe8019] text-[#1d2021] font-bold text-xs rounded-lg shadow flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              Add Task to Google Tasks
            </button>
          </form>
        </div>

        {/* Task List Items Panel */}
        <div className="lg:col-span-7 bg-[#282828] border border-[#3c3836] p-5 rounded-xl space-y-4">
          <div className="flex items-center justify-between border-b border-[#3c3836] pb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#fbf1c7]">Task Items</span>
              <span className="text-xs text-[#a89984] font-mono">({filteredTasks.length})</span>
            </div>

            <div className="flex items-center gap-1 bg-[#1d2021] p-1 rounded-lg border border-[#3c3836]">
              <button
                type="button"
                onClick={() => setFilter('all')}
                className={`px-2.5 py-1 text-[11px] font-medium rounded ${
                  filter === 'all' ? 'bg-[#fabd2f] text-[#1d2021] font-bold' : 'text-[#a89984] hover:text-[#ebdbb2]'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setFilter('needsAction')}
                className={`px-2.5 py-1 text-[11px] font-medium rounded ${
                  filter === 'needsAction' ? 'bg-[#fabd2f] text-[#1d2021] font-bold' : 'text-[#a89984] hover:text-[#ebdbb2]'
                }`}
              >
                Active
              </button>
              <button
                type="button"
                onClick={() => setFilter('completed')}
                className={`px-2.5 py-1 text-[11px] font-medium rounded ${
                  filter === 'completed' ? 'bg-[#fabd2f] text-[#1d2021] font-bold' : 'text-[#a89984] hover:text-[#ebdbb2]'
                }`}
              >
                Completed
              </button>
            </div>
          </div>

          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
            {filteredTasks.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#a89984]">
                No tasks found matching filter &quot;{filter}&quot;.
              </div>
            ) : (
              filteredTasks.map((t) => {
                const isCompleted = t.status === 'completed';
                return (
                  <div
                    key={t.id}
                    className={`p-3 rounded-lg border transition-all flex items-start justify-between gap-3 ${
                      isCompleted
                        ? 'bg-[#1d2021]/60 border-[#3c3836]/50 opacity-75'
                        : 'bg-[#1d2021] border-[#3c3836] hover:border-[#fabd2f]/40'
                    }`}
                  >
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <button
                        type="button"
                        onClick={() => handleToggleTaskStatus(t)}
                        className="mt-0.5 text-[#fabd2f] hover:text-[#fe8019] transition-colors cursor-pointer"
                      >
                        {isCompleted ? (
                          <CheckSquare className="w-4 h-4 text-[#b8bb26]" />
                        ) : (
                          <Square className="w-4 h-4 text-[#a89984]" />
                        )}
                      </button>

                      <div className="flex-1 min-w-0">
                        <div
                          className={`text-xs font-medium ${
                            isCompleted ? 'line-through text-[#a89984]' : 'text-[#fbf1c7]'
                          }`}
                        >
                          {t.title}
                        </div>
                        {t.notes && (
                          <div className="text-[11px] text-[#a89984] mt-1 line-clamp-2">{t.notes}</div>
                        )}
                        {t.due && (
                          <div className="text-[10px] text-[#83a598] font-mono mt-1 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Due: {new Date(t.due).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteTask(t.id)}
                      className="p-1.5 text-[#a89984] hover:text-[#fb4934] transition-colors"
                      title="Delete Task"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
