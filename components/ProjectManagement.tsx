'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { getSupabaseClient } from '@/lib/supabaseClient';

type ProjectStatus = 'idea' | 'planning' | 'in-progress' | 'waiting' | 'done' | 'cancelled';
type TaskStatus = 'pending' | 'doing' | 'done' | 'archived';
type Priority = 'low' | 'medium' | 'high' | 'urgent';

type EventRow = {
  id: string;
  name: string;
  event_date: string | null;
  payload: { meta?: { name?: string; date?: string } } | null;
};

type ProjectRow = {
  id: string;
  title: string;
  status: ProjectStatus;
  priority: Priority;
  owner: string;
  due_date: string | null;
  linked_event_id: string | null;
  description: string;
  notes: string;
  created_at: string;
  updated_at: string;
};

type TaskRow = {
  id: string;
  project_id: string | null;
  title: string;
  status: TaskStatus;
  priority: Priority;
  owner: string;
  due_date: string | null;
  linked_event_id: string | null;
  notes: string;
  checklist: string[];
  image_urls?: string[];
  created_at: string;
  updated_at: string;
};

const projectStatuses: ProjectStatus[] = ['idea', 'planning', 'in-progress', 'waiting', 'done', 'cancelled'];
const taskStatuses: TaskStatus[] = ['pending', 'doing', 'done', 'archived'];
const priorities: Priority[] = ['low', 'medium', 'high', 'urgent'];

function uid() {
  return globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function normalizeStatus(value: string | null | undefined): TaskStatus {
  if (value === 'to-do') return 'pending';
  if (value === 'waiting') return 'pending';
  if (value === 'doing' || value === 'done' || value === 'archived' || value === 'pending') return value;
  return 'pending';
}

function formatDate(value?: string | null) {
  if (!value) return 'No date';
  try {
    return new Intl.DateTimeFormat('da-DK', { day: '2-digit', month: '2-digit', year: '2-digit' }).format(new Date(value));
  } catch {
    return value;
  }
}

function nice(value: string) {
  return value.replace(/-/g, ' ').replace(/^\w/, (char) => char.toUpperCase());
}

function eventTitle(event?: EventRow) {
  if (!event) return 'No linked event';
  return event.name || event.payload?.meta?.name || 'Untitled event';
}

function blankProject(): ProjectRow {
  const now = new Date().toISOString();
  return {
    id: uid(),
    title: 'New project',
    status: 'planning',
    priority: 'medium',
    owner: '',
    due_date: null,
    linked_event_id: null,
    description: '',
    notes: '',
    created_at: now,
    updated_at: now
  };
}

function blankTask(projectId?: string | null, linkedEventId?: string | null): TaskRow {
  const now = new Date().toISOString();
  return {
    id: uid(),
    project_id: projectId || null,
    title: '',
    status: 'pending',
    priority: 'medium',
    owner: '',
    due_date: null,
    linked_event_id: linkedEventId || null,
    notes: '',
    checklist: [],
    image_urls: [],
    created_at: now,
    updated_at: now
  };
}

export default function ProjectManagement() {
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [activeProjectId, setActiveProjectId] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    projectList: true,
    taskBoard: true,
    projectDetails: false
  });
  const [editingTask, setEditingTask] = useState<TaskRow | null>(null);
  const [newSubtask, setNewSubtask] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');

  function normalizeTask(task: TaskRow): TaskRow {
    return {
      ...task,
      status: normalizeStatus(task.status),
      checklist: Array.isArray(task.checklist) ? task.checklist : [],
      image_urls: Array.isArray(task.image_urls) ? task.image_urls : []
    };
  }

  function toggleSection(section: string) {
    setOpenSections((current) => ({ ...current, [section]: !current[section] }));
  }

  function isSectionOpen(section: string) {
    return openSections[section] !== false;
  }

  const activeProject = projects.find((project) => project.id === activeProjectId) || projects[0] || null;

  async function load() {
    setLoading(true);
    setMessage('');
    const supabase = getSupabaseClient();

    if (!supabase) {
      setMessage('Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel.');
      setLoading(false);
      return;
    }

    const [projectResult, taskResult, eventResult] = await Promise.all([
      supabase.from('project_management_projects').select('*').order('updated_at', { ascending: false }),
      supabase.from('project_management_tasks').select('*').order('updated_at', { ascending: false }),
      supabase.from('event_plans').select('id,name,event_date,payload').order('event_date', { ascending: true, nullsFirst: false })
    ]);

    if (projectResult.error) {
      setMessage(projectResult.error.message);
      setLoading(false);
      return;
    }

    if (taskResult.error) {
      setMessage(taskResult.error.message);
      setLoading(false);
      return;
    }

    const nextProjects = (projectResult.data || []) as ProjectRow[];
    const nextTasks = ((taskResult.data || []) as TaskRow[]).map(normalizeTask);
    setProjects(nextProjects);
    setTasks(nextTasks);
    if (!eventResult.error) setEvents((eventResult.data || []) as EventRow[]);
    if (!activeProjectId && nextProjects[0]) setActiveProjectId(nextProjects[0].id);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function linkedEvent(id?: string | null) {
    return events.find((event) => event.id === id);
  }

  async function saveProject(project: ProjectRow) {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    const next = { ...project, updated_at: new Date().toISOString() };
    setProjects((current) => current.map((item) => item.id === project.id ? next : item));

    const { error } = await supabase.from('project_management_projects').upsert(next);
    if (error) {
      setMessage(error.message);
      load();
    } else {
      setMessage('Project saved.');
    }
  }

  async function saveTask(task: TaskRow, closeAfter = false) {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    const normalized = normalizeTask(task);
    const next = {
      ...normalized,
      title: normalized.title.trim() || 'Untitled task',
      updated_at: new Date().toISOString()
    };

    setTasks((current) => {
      const exists = current.some((item) => item.id === next.id);
      return exists ? current.map((item) => item.id === next.id ? next : item) : [next, ...current];
    });

    const { error } = await supabase.from('project_management_tasks').upsert(next);
    if (error) {
      setMessage(error.message);
      load();
      return;
    }

    setMessage('Task saved.');
    if (closeAfter) setEditingTask(null);
  }

  async function createProject() {
    const project = blankProject();
    const supabase = getSupabaseClient();
    if (!supabase) return;

    const { error } = await supabase.from('project_management_projects').insert(project);
    if (error) {
      setMessage(error.message);
      return;
    }

    setProjects((current) => [project, ...current]);
    setActiveProjectId(project.id);
    setOpenSections((current) => ({ ...current, projectList: true, projectDetails: true }));
    setMessage('Project created.');
  }

  function startNewTask() {
    const task = blankTask(activeProject?.id || null, activeProject?.linked_event_id || null);
    setEditingTask(task);
    setNewSubtask('');
    setNewImageUrl('');
    setOpenSections((current) => ({ ...current, taskBoard: true }));
  }

  async function setTaskStatus(task: TaskRow, status: TaskStatus) {
    await saveTask({ ...task, status }, false);
  }

  async function completeTask(task: TaskRow) {
    await setTaskStatus(task, task.status === 'done' ? 'pending' : 'done');
  }

  async function archiveTask(task: TaskRow) {
    await setTaskStatus(task, 'archived');
  }

  async function removeProject(id: string) {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    const { error } = await supabase.from('project_management_projects').delete().eq('id', id);
    if (error) {
      setMessage(error.message);
      return;
    }

    setProjects((current) => current.filter((project) => project.id !== id));
    setTasks((current) => current.map((task) => task.project_id === id ? { ...task, project_id: null } : task));
    if (activeProjectId === id) setActiveProjectId('');
    setMessage('Project removed.');
  }

  function patchProject(id: string, patch: Partial<ProjectRow>) {
    setProjects((current) => current.map((project) => project.id === id ? { ...project, ...patch } : project));
  }

  function patchEditingTask(patch: Partial<TaskRow>) {
    setEditingTask((current) => current ? normalizeTask({ ...current, ...patch }) : current);
  }

  function addSubtask() {
    if (!editingTask || !newSubtask.trim()) return;
    patchEditingTask({ checklist: [...(editingTask.checklist || []), newSubtask.trim()] });
    setNewSubtask('');
  }

  function removeSubtask(index: number) {
    if (!editingTask) return;
    patchEditingTask({ checklist: editingTask.checklist.filter((_, currentIndex) => currentIndex !== index) });
  }

  function addImageUrl() {
    if (!editingTask || !newImageUrl.trim()) return;
    patchEditingTask({ image_urls: [...(editingTask.image_urls || []), newImageUrl.trim()] });
    setNewImageUrl('');
  }

  function removeImageUrl(index: number) {
    if (!editingTask) return;
    patchEditingTask({ image_urls: (editingTask.image_urls || []).filter((_, currentIndex) => currentIndex !== index) });
  }

  const taskCounts = useMemo(() => {
    return taskStatuses.reduce((acc, status) => {
      acc[status] = tasks.filter((task) => task.status === status).length;
      return acc;
    }, {} as Record<TaskStatus, number>);
  }, [tasks]);

  const overdueTasks = useMemo(() => {
    const now = today();
    return tasks.filter((task) => task.due_date && task.due_date < now && task.status !== 'done' && task.status !== 'archived');
  }, [tasks]);

  const warnings = useMemo(() => {
    const list: string[] = [];
    if (!projects.length) list.push('No projects');
    if (!tasks.length) list.push('No tasks');
    if (overdueTasks.length) list.push(`${overdueTasks.length} overdue`);
    return list.slice(0, 6);
  }, [projects, tasks, overdueTasks]);

  const projectTasks = useMemo(() => {
    if (!activeProject) return tasks;
    return tasks.filter((task) => task.project_id === activeProject.id || !task.project_id);
  }, [tasks, activeProject]);

  return (
    <main className="system-shell project-page project-page-v52 no-callout min-h-dvh bg-[var(--paper)] text-[var(--ink)]">
      <div className="system-wrap">
        <div className="project-top-nav">
          <Link href="/" className="passport-button top-nav-pill min-h-[46px] rounded-full px-2 text-center backdrop-blur">
            <span className="block text-[8px] font-bold uppercase leading-none tracking-[.13em] opacity-65">System</span>
            <strong className="block text-[12.5px] font-black leading-[1.02] tracking-[-.035em]">Dashboard</strong>
          </Link>
          <Link href="/event-planner" className="passport-button top-nav-pill min-h-[46px] rounded-full px-2 text-center backdrop-blur">
            <span className="block text-[8px] font-bold uppercase leading-none tracking-[.13em] opacity-65">Open</span>
            <strong className="block text-[12.5px] font-black leading-[1.02] tracking-[-.035em]">Planner</strong>
          </Link>
          <button onClick={startNewTask} className="passport-button top-nav-pill min-h-[46px] rounded-full px-2 text-center backdrop-blur">
            <span className="block text-[8px] font-bold uppercase leading-none tracking-[.13em] opacity-65">Tap</span>
            <strong className="block text-[12.5px] font-black leading-[1.02] tracking-[-.035em]">Add task</strong>
          </button>
        </div>

        <section className="project-hero passport-card">
          <div>
            <p className="system-kicker">Project Management</p>
            <h1>Tasks</h1>
            <p>Quick task boards with reminders-style task settings.</p>
          </div>
          <div className="project-status-pill">
            <span>Open tasks</span>
            <strong>{tasks.filter((task) => task.status !== 'done' && task.status !== 'archived').length}</strong>
          </div>
        </section>

        {message && <div className="artist-message">{message}</div>}
        {loading && <div className="artist-message">Loading project management…</div>}

        <section className="module-compact-summary project-compact-summary passport-card">
          <div><span>Pending</span><strong>{taskCounts.pending || 0}</strong></div>
          <div><span>Doing</span><strong>{taskCounts.doing || 0}</strong></div>
          <div><span>Done</span><strong>{taskCounts.done || 0}</strong></div>
          <div><span>Archived</span><strong>{taskCounts.archived || 0}</strong></div>
        </section>

        {warnings.length > 0 && (
          <section className="bar-warning-row">
            {warnings.map((warning) => <span key={warning}>{warning}</span>)}
          </section>
        )}

        <section className="project-layout project-layout-v52">
          <div className={`project-panel project-collapsible-panel passport-card ${isSectionOpen('projectList') ? 'is-open' : 'is-collapsed'}`}>
            <div className="project-panel-head project-collapsible-head">
              <div className="project-section-title">Projects</div>
              <button onClick={createProject}>Add project</button>
              <button type="button" className="project-section-toggle-icon" onClick={() => toggleSection('projectList')} aria-label="Toggle project list">
                {isSectionOpen('projectList') ? '−' : '+'}
              </button>
            </div>

            {isSectionOpen('projectList') && (
              <div className="project-list">
                {projects.map((project) => (
                  <button
                    key={project.id}
                    onClick={() => setActiveProjectId(project.id)}
                    className={`project-list-card ${activeProject?.id === project.id ? 'active' : ''}`}
                  >
                    <span>{nice(project.status)} · {nice(project.priority)}</span>
                    <strong>{project.title}</strong>
                    <em>{formatDate(project.due_date)} · {eventTitle(linkedEvent(project.linked_event_id))}</em>
                  </button>
                ))}
                {!projects.length && <p className="project-empty">No projects yet.</p>}
              </div>
            )}
          </div>

          <div className="project-main-stack">
            <div className={`project-panel project-collapsible-panel passport-card ${isSectionOpen('taskBoard') ? 'is-open' : 'is-collapsed'}`}>
              <div className="project-panel-head project-collapsible-head">
                <div className="project-section-title">Task board</div>
                <button onClick={startNewTask}>Add task</button>
                <button type="button" className="project-section-toggle-icon" onClick={() => toggleSection('taskBoard')} aria-label="Toggle task board">
                  {isSectionOpen('taskBoard') ? '−' : '+'}
                </button>
              </div>

              {isSectionOpen('taskBoard') && (
                <div className="task-board task-board-v52">
                  {taskStatuses.map((status) => (
                    <section key={status} className={`task-column task-column-${status}`}>
                      <h3>{nice(status)} <span>{projectTasks.filter((task) => task.status === status).length}</span></h3>
                      {projectTasks.filter((task) => task.status === status).map((task) => (
                        <article key={task.id} className={`task-card task-card-v52 task-status-${task.status}`}>
                          <div className="task-simple-row">
                            <button type="button" className={`task-check ${task.status === 'done' ? 'checked' : ''}`} onClick={() => completeTask(task)} aria-label="Complete task" />
                            <button type="button" className="task-simple-main" onClick={() => setEditingTask(task)}>
                              <strong>{task.title || 'Untitled task'}</strong>
                              <span>
                                {task.due_date ? formatDate(task.due_date) : 'No deadline'}
                                {task.owner ? ` · ${task.owner}` : ''}
                                {task.checklist.length ? ` · ${task.checklist.length} subtasks` : ''}
                                {(task.image_urls || []).length ? ` · ${(task.image_urls || []).length} images` : ''}
                              </span>
                            </button>
                          </div>
                          <div className="task-quick-actions">
                            <button onClick={() => setTaskStatus(task, 'pending')}>Pending</button>
                            <button onClick={() => setTaskStatus(task, 'doing')}>Doing</button>
                            <button onClick={() => setTaskStatus(task, 'done')}>Done</button>
                            <button onClick={() => archiveTask(task)}>Archive</button>
                          </div>
                        </article>
                      ))}
                    </section>
                  ))}
                </div>
              )}
            </div>

            {activeProject && (
              <div className={`project-panel project-collapsible-panel passport-card ${isSectionOpen('projectDetails') ? 'is-open' : 'is-collapsed'}`}>
                <div className="project-panel-head project-collapsible-head">
                  <div className="project-section-title">{activeProject.title}</div>
                  <div className="project-panel-actions">
                    <button onClick={() => saveProject(activeProject)}>Save</button>
                    <button onClick={() => removeProject(activeProject.id)}>Remove</button>
                  </div>
                  <button type="button" className="project-section-toggle-icon" onClick={() => toggleSection('projectDetails')} aria-label="Toggle project details">
                    {isSectionOpen('projectDetails') ? '−' : '+'}
                  </button>
                </div>

                {isSectionOpen('projectDetails') && (
                  <div className="project-form-grid">
                    <label className="project-field project-field-wide">
                      <span>Project name</span>
                      <input value={activeProject.title} onChange={(event) => patchProject(activeProject.id, { title: event.target.value })} />
                    </label>
                    <label className="project-field">
                      <span>Status</span>
                      <select value={activeProject.status} onChange={(event) => patchProject(activeProject.id, { status: event.target.value as ProjectStatus })}>
                        {projectStatuses.map((status) => <option key={status} value={status}>{nice(status)}</option>)}
                      </select>
                    </label>
                    <label className="project-field">
                      <span>Priority</span>
                      <select value={activeProject.priority} onChange={(event) => patchProject(activeProject.id, { priority: event.target.value as Priority })}>
                        {priorities.map((priority) => <option key={priority} value={priority}>{nice(priority)}</option>)}
                      </select>
                    </label>
                    <label className="project-field">
                      <span>Owner</span>
                      <input value={activeProject.owner} placeholder="Owner" onChange={(event) => patchProject(activeProject.id, { owner: event.target.value })} />
                    </label>
                    <label className="project-field">
                      <span>Deadline</span>
                      <input type="date" value={activeProject.due_date || ''} onChange={(event) => patchProject(activeProject.id, { due_date: event.target.value || null })} />
                    </label>
                    <label className="project-field project-field-wide">
                      <span>Linked event</span>
                      <select value={activeProject.linked_event_id || ''} onChange={(event) => patchProject(activeProject.id, { linked_event_id: event.target.value || null })}>
                        <option value="">No linked event</option>
                        {events.map((event) => <option key={event.id} value={event.id}>{eventTitle(event)} · {formatDate(event.event_date || event.payload?.meta?.date)}</option>)}
                      </select>
                    </label>
                    <label className="project-field project-field-wide">
                      <span>Description</span>
                      <textarea rows={3} value={activeProject.description} onChange={(event) => patchProject(activeProject.id, { description: event.target.value })} />
                    </label>
                    <label className="project-field project-field-wide">
                      <span>Notes</span>
                      <textarea rows={3} value={activeProject.notes} onChange={(event) => patchProject(activeProject.id, { notes: event.target.value })} />
                    </label>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </div>

      {editingTask && (
        <div className="task-settings-backdrop">
          <section className="task-settings-modal passport-card">
            <div className="task-settings-head">
              <div>
                <p className="system-kicker">Task settings</p>
                <h2>{editingTask.title || 'New task'}</h2>
              </div>
              <button onClick={() => setEditingTask(null)}>Close</button>
            </div>

            <label className="project-field project-field-wide">
              <span>Task</span>
              <input
                autoFocus
                value={editingTask.title}
                placeholder="Task title"
                onChange={(event) => patchEditingTask({ title: event.target.value })}
              />
            </label>

            <div className="project-form-grid">
              <label className="project-field">
                <span>Status</span>
                <select value={editingTask.status} onChange={(event) => patchEditingTask({ status: event.target.value as TaskStatus })}>
                  {taskStatuses.map((status) => <option key={status} value={status}>{nice(status)}</option>)}
                </select>
              </label>
              <label className="project-field">
                <span>Priority</span>
                <select value={editingTask.priority} onChange={(event) => patchEditingTask({ priority: event.target.value as Priority })}>
                  {priorities.map((priority) => <option key={priority} value={priority}>{nice(priority)}</option>)}
                </select>
              </label>
              <label className="project-field">
                <span>Deadline</span>
                <input type="date" value={editingTask.due_date || ''} onChange={(event) => patchEditingTask({ due_date: event.target.value || null })} />
              </label>
              <label className="project-field">
                <span>Responsible</span>
                <input value={editingTask.owner} placeholder="Responsible" onChange={(event) => patchEditingTask({ owner: event.target.value })} />
              </label>
              <label className="project-field">
                <span>Project</span>
                <select value={editingTask.project_id || ''} onChange={(event) => patchEditingTask({ project_id: event.target.value || null })}>
                  <option value="">No project</option>
                  {projects.map((project) => <option key={project.id} value={project.id}>{project.title}</option>)}
                </select>
              </label>
              <label className="project-field">
                <span>Event</span>
                <select value={editingTask.linked_event_id || ''} onChange={(event) => patchEditingTask({ linked_event_id: event.target.value || null })}>
                  <option value="">No event</option>
                  {events.map((event) => <option key={event.id} value={event.id}>{eventTitle(event)}</option>)}
                </select>
              </label>
            </div>

            <label className="project-field project-field-wide">
              <span>Notes</span>
              <textarea rows={4} value={editingTask.notes} placeholder="Notes, context, links, reminders..." onChange={(event) => patchEditingTask({ notes: event.target.value })} />
            </label>

            <div className="task-settings-section">
              <div className="task-settings-section-head">
                <span>Subtasks</span>
                <strong>{editingTask.checklist.length}</strong>
              </div>
              <div className="task-add-inline">
                <input value={newSubtask} placeholder="Add subtask" onChange={(event) => setNewSubtask(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') addSubtask(); }} />
                <button onClick={addSubtask}>Add</button>
              </div>
              <div className="subtask-list">
                {editingTask.checklist.map((item, index) => (
                  <div key={`${item}-${index}`} className="subtask-row">
                    <span>{item}</span>
                    <button onClick={() => removeSubtask(index)}>Remove</button>
                  </div>
                ))}
              </div>
            </div>

            <div className="task-settings-section">
              <div className="task-settings-section-head">
                <span>Images</span>
                <strong>{(editingTask.image_urls || []).length}</strong>
              </div>
              <div className="task-add-inline">
                <input value={newImageUrl} placeholder="Paste image URL" onChange={(event) => setNewImageUrl(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') addImageUrl(); }} />
                <button onClick={addImageUrl}>Add</button>
              </div>
              <div className="task-image-list">
                {(editingTask.image_urls || []).map((url, index) => (
                  <div key={`${url}-${index}`} className="task-image-row">
                    <img src={url} alt="" />
                    <span>{url}</span>
                    <button onClick={() => removeImageUrl(index)}>Remove</button>
                  </div>
                ))}
              </div>
            </div>

            <div className="task-settings-actions">
              <button onClick={() => setEditingTask(null)}>Cancel</button>
              <button onClick={() => saveTask(editingTask, true)}>Save task</button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
