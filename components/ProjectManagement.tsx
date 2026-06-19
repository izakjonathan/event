'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { getSupabaseClient } from '@/lib/supabaseClient';

type ProjectStatus = 'idea' | 'planning' | 'in-progress' | 'waiting' | 'done' | 'cancelled';
type TaskStatus = 'to-do' | 'doing' | 'waiting' | 'done';
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
  created_at: string;
  updated_at: string;
};

const projectStatuses: ProjectStatus[] = ['idea', 'planning', 'in-progress', 'waiting', 'done', 'cancelled'];
const taskStatuses: TaskStatus[] = ['to-do', 'doing', 'waiting', 'done'];
const priorities: Priority[] = ['low', 'medium', 'high', 'urgent'];

function uid() {
  return globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
}

function today() {
  return new Date().toISOString().slice(0, 10);
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

function blankTask(projectId?: string | null): TaskRow {
  const now = new Date().toISOString();
  return {
    id: uid(),
    project_id: projectId || null,
    title: 'New task',
    status: 'to-do',
    priority: 'medium',
    owner: '',
    due_date: null,
    linked_event_id: null,
    notes: '',
    checklist: [],
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
    projectDetails: true,
    tasks: true
  });
  const [openTasks, setOpenTasks] = useState<Record<string, boolean>>({});

  function toggleSection(section: string) {
    setOpenSections((current) => ({ ...current, [section]: !current[section] }));
  }

  function isSectionOpen(section: string) {
    return openSections[section] !== false;
  }

  function toggleTaskCard(id: string) {
    setOpenTasks((current) => ({ ...current, [id]: !(current[id] ?? false) }));
  }

  function isTaskOpen(id: string) {
    return openTasks[id] ?? false;
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
    const nextTasks = (taskResult.data || []) as TaskRow[];
    setProjects(nextProjects);
    setTasks(nextTasks.map((task) => ({ ...task, checklist: Array.isArray(task.checklist) ? task.checklist : [] })));
    if (!eventResult.error) setEvents((eventResult.data || []) as EventRow[]);
    if (!activeProjectId && nextProjects[0]) setActiveProjectId(nextProjects[0].id);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

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

  async function saveTask(task: TaskRow) {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    const next = { ...task, updated_at: new Date().toISOString() };
    setTasks((current) => current.map((item) => item.id === task.id ? next : item));

    const { error } = await supabase.from('project_management_tasks').upsert(next);
    if (error) {
      setMessage(error.message);
      load();
    } else {
      setMessage('Task saved.');
    }
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
    setMessage('Project created.');
  }

  async function createTask(projectId?: string | null) {
    const task = blankTask(projectId || activeProject?.id || null);
    if (activeProject?.linked_event_id) task.linked_event_id = activeProject.linked_event_id;

    const supabase = getSupabaseClient();
    if (!supabase) return;

    const { error } = await supabase.from('project_management_tasks').insert(task);
    if (error) {
      setMessage(error.message);
      return;
    }

    setTasks((current) => [task, ...current]);
    setOpenTasks((current) => ({ ...current, [task.id]: true }));
    setOpenSections((current) => ({ ...current, tasks: true }));
    setMessage('Task created.');
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

  async function removeTask(id: string) {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    const { error } = await supabase.from('project_management_tasks').delete().eq('id', id);
    if (error) {
      setMessage(error.message);
      return;
    }

    setTasks((current) => current.filter((task) => task.id !== id));
    setMessage('Task removed.');
  }

  function patchProject(id: string, patch: Partial<ProjectRow>) {
    setProjects((current) => current.map((project) => project.id === id ? { ...project, ...patch } : project));
  }

  function patchTask(id: string, patch: Partial<TaskRow>) {
    setTasks((current) => current.map((task) => task.id === id ? { ...task, ...patch } : task));
  }

  function linkedEvent(id?: string | null) {
    return events.find((event) => event.id === id);
  }

  const projectTasks = useMemo(() => {
    if (!activeProject) return [];
    return tasks.filter((task) => task.project_id === activeProject.id);
  }, [tasks, activeProject]);

  const taskCounts = useMemo(() => {
    return taskStatuses.reduce((acc, status) => {
      acc[status] = tasks.filter((task) => task.status === status).length;
      return acc;
    }, {} as Record<TaskStatus, number>);
  }, [tasks]);

  const overdueTasks = useMemo(() => {
    const now = today();
    return tasks.filter((task) => task.due_date && task.due_date < now && task.status !== 'done');
  }, [tasks]);

  const warnings = useMemo(() => {
    const list: string[] = [];
    if (!projects.length) list.push('No projects');
    if (!tasks.length) list.push('No tasks');
    if (overdueTasks.length) list.push(`${overdueTasks.length} overdue`);
    tasks.forEach((task) => {
      if (!task.owner && task.status !== 'done') list.push(`${task.title}: no owner`);
      if (!task.due_date && task.status !== 'done') list.push(`${task.title}: no deadline`);
    });
    return list.slice(0, 6);
  }, [projects, tasks, overdueTasks]);

  return (
    <main className="system-shell project-page no-callout min-h-dvh bg-[var(--paper)] text-[var(--ink)]">
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
          <button onClick={createProject} className="passport-button top-nav-pill min-h-[46px] rounded-full px-2 text-center backdrop-blur">
            <span className="block text-[8px] font-bold uppercase leading-none tracking-[.13em] opacity-65">New</span>
            <strong className="block text-[12.5px] font-black leading-[1.02] tracking-[-.035em]">Project</strong>
          </button>
        </div>

        <section className="project-hero passport-card">
          <div>
            <p className="system-kicker">Project Management</p>
            <h1>Projects</h1>
            <p>Manage project plans, tasks, owners, deadlines and linked events.</p>
          </div>
          <div className="project-status-pill">
            <span>Open tasks</span>
            <strong>{tasks.filter((task) => task.status !== 'done').length}</strong>
          </div>
        </section>

        {message && <div className="artist-message">{message}</div>}
        {loading && <div className="artist-message">Loading project management…</div>}

        <section className="module-compact-summary project-compact-summary passport-card">
          <div>
            <span>Projects</span>
            <strong>{projects.length}</strong>
          </div>
          <div>
            <span>To do</span>
            <strong>{taskCounts['to-do'] || 0}</strong>
          </div>
          <div>
            <span>Doing</span>
            <strong>{taskCounts.doing || 0}</strong>
          </div>
          <div>
            <span>Overdue</span>
            <strong>{overdueTasks.length}</strong>
          </div>
        </section>

        {warnings.length > 0 && (
          <section className="bar-warning-row">
            {warnings.map((warning) => <span key={warning}>{warning}</span>)}
          </section>
        )}

        <section className="project-layout">
          <div className={`project-panel project-collapsible-panel passport-card ${isSectionOpen('projectList') ? 'is-open' : 'is-collapsed'}`}>
            <div className="project-panel-head project-collapsible-head">
              <div className="project-section-title">Projects</div>
              <button onClick={createProject}>Add</button>
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
            {activeProject ? (
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
            ) : (
              <div className="project-panel passport-card">
                <p className="project-empty">Create or choose a project.</p>
              </div>
            )}

            <div className={`project-panel project-collapsible-panel passport-card ${isSectionOpen('tasks') ? 'is-open' : 'is-collapsed'}`}>
              <div className="project-panel-head project-collapsible-head">
                <div className="project-section-title">Tasks</div>
                <button onClick={() => createTask(activeProject?.id)}>Add task</button>
                <button type="button" className="project-section-toggle-icon" onClick={() => toggleSection('tasks')} aria-label="Toggle tasks">
                  {isSectionOpen('tasks') ? '−' : '+'}
                </button>
              </div>

              {isSectionOpen('tasks') && (
                <div className="task-board">
                {taskStatuses.map((status) => (
                  <section key={status} className="task-column">
                    <h3>{nice(status)} <span>{tasks.filter((task) => task.status === status).length}</span></h3>
                    {tasks.filter((task) => task.status === status).map((task) => (
                      <article key={task.id} className={`task-card task-card-v51 ${isTaskOpen(task.id) ? 'is-open' : 'is-collapsed'}`}>
                        <button type="button" className="task-collapse-head" onClick={() => toggleTaskCard(task.id)}>
                          <span>{task.title || 'Untitled task'}</span>
                          <small>{nice(task.priority)} · {task.due_date ? formatDate(task.due_date) : 'No deadline'}</small>
                          <em>{isTaskOpen(task.id) ? '−' : '+'}</em>
                        </button>
                        {isTaskOpen(task.id) && (
                          <>
                        <input className="task-title-input" value={task.title} onChange={(event) => patchTask(task.id, { title: event.target.value })} onBlur={() => saveTask(task)} />
                        <div className="task-field-grid">
                          <label>
                            <span>Project</span>
                            <select value={task.project_id || ''} onChange={(event) => patchTask(task.id, { project_id: event.target.value || null })} onBlur={() => saveTask(task)}>
                              <option value="">No project</option>
                              {projects.map((project) => <option key={project.id} value={project.id}>{project.title}</option>)}
                            </select>
                          </label>
                          <label>
                            <span>Status</span>
                            <select value={task.status} onChange={(event) => saveTask({ ...task, status: event.target.value as TaskStatus })}>
                              {taskStatuses.map((nextStatus) => <option key={nextStatus} value={nextStatus}>{nice(nextStatus)}</option>)}
                            </select>
                          </label>
                          <label>
                            <span>Priority</span>
                            <select value={task.priority} onChange={(event) => saveTask({ ...task, priority: event.target.value as Priority })}>
                              {priorities.map((priority) => <option key={priority} value={priority}>{nice(priority)}</option>)}
                            </select>
                          </label>
                          <label>
                            <span>Owner</span>
                            <input value={task.owner} placeholder="Owner" onChange={(event) => patchTask(task.id, { owner: event.target.value })} onBlur={() => saveTask(task)} />
                          </label>
                          <label>
                            <span>Due</span>
                            <input type="date" value={task.due_date || ''} onChange={(event) => saveTask({ ...task, due_date: event.target.value || null })} />
                          </label>
                          <label>
                            <span>Event</span>
                            <select value={task.linked_event_id || ''} onChange={(event) => saveTask({ ...task, linked_event_id: event.target.value || null })}>
                              <option value="">No event</option>
                              {events.map((event) => <option key={event.id} value={event.id}>{eventTitle(event)}</option>)}
                            </select>
                          </label>
                        </div>
                        <textarea rows={2} value={task.notes} placeholder="Task notes" onChange={(event) => patchTask(task.id, { notes: event.target.value })} onBlur={() => saveTask(task)} />
                        <div className="task-card-footer">
                          <span>{eventTitle(linkedEvent(task.linked_event_id))}</span>
                          <button onClick={() => removeTask(task.id)}>Remove</button>
                        </div>
                          </>
                        )}
                      </article>
                    ))}
                  </section>
                ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
