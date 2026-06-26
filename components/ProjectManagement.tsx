'use client';

import { ChangeEvent, useEffect, useMemo, useState } from 'react';
import { blankProject, blankTask, now } from '@/lib/defaults';
import { Priority, PlannerEvent, Project, ProjectStatus, Task, TaskStatus } from '@/lib/types';
import { useEventStore } from './EventStore';
import { AppShell, Badge, Button, Card, Field, Row, Section, Stat } from './ui/AppShell';

const PROJECT_STATUSES: ProjectStatus[] = ['idea', 'planning', 'in-progress', 'waiting', 'done', 'cancelled'];
const TASK_STATUSES: TaskStatus[] = ['pending', 'doing', 'done', 'archived'];
const PRIORITIES: Priority[] = ['low', 'medium', 'high', 'urgent'];

const isOverdue = (task: Task) => Boolean(task.due_date && new Date(task.due_date) < new Date() && !['done', 'archived'].includes(task.status));
const percent = (value: number, total: number) => (total ? Math.round((value / total) * 100) : 0);

function projectEventName(events: PlannerEvent[], project: Project) {
 if (!project.linked_event_id) return 'No event';
 return events.find((event) => event.id === project.linked_event_id)?.meta.name || 'Missing event';
}

type EventSelectProps = {
 events: PlannerEvent[];
 value: string | null;
 onChange: (value: string | null) => void;
};

function EventSelect({ events, value, onChange }: EventSelectProps) {
 return (
 <Field label="Linked event">
 <select value={value || ''} onChange={(event) => onChange(event.target.value || null)}>
 <option value="">No event</option>
 {events.map((event) => (
 <option key={event.id} value={event.id}>
 {event.meta.name || 'Untitled event'}
 </option>
 ))}
 </select>
 </Field>
 );
}


type CsvImportResult = {
 importedProjects: number;
 importedTasks: number;
 skippedRows: number;
 message: string;
};

const normalizeHeader = (value: string) => value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
const normalizeValue = (value: string | undefined) => (value || '').trim();
const csvKey = (row: Record<string, string>, keys: string[]) => {
 for (const key of keys) {
 const value = row[key];
 if (value !== undefined && value.trim()) return value.trim();
 }
 return '';
};
const parseStatus = <T extends string>(value: string, allowed: readonly T[], fallback: T): T => {
 const normalized = normalizeHeader(value) as T;
 return allowed.includes(normalized) ? normalized : fallback;
};

function parseCsvRows(csv: string) {
 const rows: string[][] = [];
 let current = '';
 let row: string[] = [];
 let quoted = false;

 for (let index = 0; index < csv.length; index += 1) {
 const char = csv[index];
 const next = csv[index + 1];

 if (char === '"' && quoted && next === '"') {
 current += '"';
 index += 1;
 continue;
 }

 if (char === '"') {
 quoted = !quoted;
 continue;
 }

 if (char === ',' && !quoted) {
 row.push(current);
 current = '';
 continue;
 }

 if ((char === '\n' || char === '\r') && !quoted) {
 if (char === '\r' && next === '\n') index += 1;
 row.push(current);
 if (row.some((cell) => cell.trim())) rows.push(row);
 row = [];
 current = '';
 continue;
 }

 current += char;
 }

 row.push(current);
 if (row.some((cell) => cell.trim())) rows.push(row);
 return rows;
}

function parseCsv(csv: string) {
 const rows = parseCsvRows(csv);
 if (rows.length < 2) return [];
 const headers = rows[0].map(normalizeHeader);
 return rows.slice(1).map((cells) => {
 const row: Record<string, string> = {};
 headers.forEach((header, index) => {
 if (header) row[header] = normalizeValue(cells[index]);
 });
 return row;
 });
}

function PlainCollapsible({ title, count, children, openDefault = true }: { title: string; count: number; children: React.ReactNode; openDefault?: boolean }) {
 const [open, setOpen] = useState(openDefault);
 return (
 <div className="eos-task-group">
 <button type="button" onClick={() => setOpen((value) => !value)} className="eos-task-group-header">
 <span>
 <span className="eos-caption eos-text">{title}</span>
 <span className="eos-body eos-muted mt-1 block">{count} task{count === 1 ? '' : 's'}</span>
 </span>
 <span className="eos-muted flex items-center gap-2 eos-caption">
 <Badge>{count}</Badge>
 <span className="text-base">{open ? '⌃' : '⌄'}</span>
 </span>
 </button>
 {open && <div className="eos-task-list">{children}</div>}
 </div>
 );
}

type ProjectSelectorProps = {
 projects: Project[];
 selectedProjectId: string;
 onSelect: (id: string) => void;
 onCreate: () => void;
};

function ProjectSelector({ projects, selectedProjectId, onSelect, onCreate }: ProjectSelectorProps) {
 return (
 <Card>
 <div className="flex items-start justify-between gap-3">
 <div>
 <p className="eos-caption eos-muted">Project management</p>
 <h2 className="eos-heading mt-2">Projects</h2>
 </div>
 <Button onClick={onCreate}>New project</Button>
 </div>

 {projects.length > 0 ? (
 <div className="mt-4">
 <Field label="Selected project">
 <select value={selectedProjectId} onChange={(event) => onSelect(event.target.value)}>
 {projects.map((project) => (
 <option key={project.id} value={project.id}>
 {project.title || 'Untitled project'}
 </option>
 ))}
 </select>
 </Field>
 </div>
 ) : (
 <p className="eos-body eos-muted mt-4">Create a project first. Tasks are created inside a selected project.</p>
 )}
 </Card>
 );
}

type ProjectEditorProps = {
 events: PlannerEvent[];
 project: Project;
 saveProject: (project: Project) => Promise<void>;
 deleteProject: (id: string) => Promise<void>;
};

function ProjectEditor({ events, project, saveProject, deleteProject }: ProjectEditorProps) {
 const updateProject = (patch: Partial<Project>) => {
 void saveProject({ ...project, ...patch });
 };

 return (
 <Section
 title="Project details"
 openDefault
 right={<Badge tone={project.priority === 'urgent' ? 'bad' : project.priority === 'high' ? 'warn' : 'neutral'}>{project.status}</Badge>}
 >
 <Row>
 <Field label="Project name">
 <input value={project.title} onChange={(event) => updateProject({ title: event.target.value })} />
 </Field>
 <Field label="Owner">
 <input value={project.owner} onChange={(event) => updateProject({ owner: event.target.value })} />
 </Field>
 </Row>

 <Row>
 <Field label="Status">
 <select value={project.status} onChange={(event) => updateProject({ status: event.target.value as ProjectStatus })}>
 {PROJECT_STATUSES.map((status) => (
 <option key={status}>{status}</option>
 ))}
 </select>
 </Field>
 <Field label="Priority">
 <select value={project.priority} onChange={(event) => updateProject({ priority: event.target.value as Priority })}>
 {PRIORITIES.map((priority) => (
 <option key={priority}>{priority}</option>
 ))}
 </select>
 </Field>
 </Row>

 <Row>
 <Field label="Due date">
 <input type="date" value={project.due_date || ''} onChange={(event) => updateProject({ due_date: event.target.value || null })} />
 </Field>
 <EventSelect events={events} value={project.linked_event_id} onChange={(linkedEventId) => updateProject({ linked_event_id: linkedEventId })} />
 </Row>

 <Field label="Description">
 <textarea value={project.description} onChange={(event) => updateProject({ description: event.target.value })} />
 </Field>
 <Field label="Notes">
 <textarea value={project.notes} onChange={(event) => updateProject({ notes: event.target.value })} />
 </Field>
 <Button kind="danger" onClick={() => void deleteProject(project.id)}>
 Delete project and tasks
 </Button>
 </Section>
 );
}

type TaskModalProps = {
 projects: Project[];
 taskDraft: Task | null;
 selectedProjectId: string;
 setTaskDraft: (task: Task | null) => void;
 saveTask: (task: Task) => Promise<void>;
 deleteTask: (id: string) => Promise<void>;
};

function TaskModal({ projects, taskDraft, selectedProjectId, setTaskDraft, saveTask, deleteTask }: TaskModalProps) {
 if (!taskDraft) return null;

 const task = { ...taskDraft, project_id: taskDraft.project_id || selectedProjectId };
 const setDraft = (patch: Partial<Task>) => setTaskDraft({ ...task, ...patch });

 return (
 <div className="fixed inset-0 z-50 flex items-end justify-center eos-overlay p-3">
 <Card className="max-h-[88vh] w-full max-w-[430px] overflow-y-auto">
 <div className="flex items-center justify-between">
 <h3 className="eos-title">Task settings</h3>
 <Button kind="ghost" onClick={() => setTaskDraft(null)}>
 Close
 </Button>
 </div>

 <div className="mt-4 space-y-3">
 <Field label="Task title">
 <input value={task.title} onChange={(event) => setDraft({ title: event.target.value })} />
 </Field>

 <Row>
 <Field label="Status">
 <select value={task.status} onChange={(event) => setDraft({ status: event.target.value as TaskStatus })}>
 {TASK_STATUSES.map((status) => (
 <option key={status}>{status}</option>
 ))}
 </select>
 </Field>
 <Field label="Priority">
 <select value={task.priority} onChange={(event) => setDraft({ priority: event.target.value as Priority })}>
 {PRIORITIES.map((priority) => (
 <option key={priority}>{priority}</option>
 ))}
 </select>
 </Field>
 </Row>

 <Row>
 <Field label="Owner">
 <input value={task.owner} onChange={(event) => setDraft({ owner: event.target.value })} />
 </Field>
 <Field label="Deadline">
 <input type="date" value={task.due_date || ''} onChange={(event) => setDraft({ due_date: event.target.value || null })} />
 </Field>
 </Row>

 <Field label="Project">
 <select value={task.project_id || selectedProjectId} onChange={(event) => setDraft({ project_id: event.target.value })}>
 {projects.map((project) => (
 <option key={project.id} value={project.id}>
 {project.title || 'Untitled project'}
 </option>
 ))}
 </select>
 </Field>

 <Field label="Notes">
 <textarea value={task.notes} onChange={(event) => setDraft({ notes: event.target.value })} />
 </Field>

 <Section title="Checklist" openDefault>
 {task.checklist.length === 0 && <p className="eos-body eos-muted">No subtasks yet.</p>}
 {task.checklist.map((item, index) => (
 <div key={index} className="flex gap-2">
 <input value={item} onChange={(event) => setDraft({ checklist: task.checklist.map((current, i) => (i === index ? event.target.value : current)) })} />
 <Button kind="danger" onClick={() => setDraft({ checklist: task.checklist.filter((_, i) => i !== index) })}>
 ×
 </Button>
 </div>
 ))}
 <Button kind="ghost" onClick={() => setDraft({ checklist: [...task.checklist, 'New subtask'] })}>
 Add subtask
 </Button>
 </Section>

 <Section title="Image URLs">
 {task.image_urls.length === 0 && <p className="eos-body eos-muted">No image links yet.</p>}
 {task.image_urls.map((url, index) => (
 <div key={index} className="flex gap-2">
 <input value={url} onChange={(event) => setDraft({ image_urls: task.image_urls.map((current, i) => (i === index ? event.target.value : current)) })} />
 <Button kind="danger" onClick={() => setDraft({ image_urls: task.image_urls.filter((_, i) => i !== index) })}>
 ×
 </Button>
 </div>
 ))}
 <Button kind="ghost" onClick={() => setDraft({ image_urls: [...task.image_urls, ''] })}>
 Add image URL
 </Button>
 </Section>

 <div className="grid grid-cols-2 gap-2">
 <Button
 onClick={() => {
 void saveTask({ ...task, project_id: task.project_id || selectedProjectId });
 setTaskDraft(null);
 }}
 >
 Save task
 </Button>
 <Button
 kind="danger"
 onClick={() => {
 void deleteTask(task.id);
 setTaskDraft(null);
 }}
 >
 Delete
 </Button>
 </div>
 </div>
 </Card>
 </div>
 );
}

type TaskCardProps = {
 task: Task;
 onEdit: (task: Task) => void;
 onSave: (task: Task) => Promise<void>;
};

function TaskListRow({ task, onEdit, onSave }: TaskCardProps) {
 const completedSubtasks = task.checklist.filter((item) => item.trim().startsWith('✓')).length;

 return (
 <div className="eos-task-row">
 <div className="min-w-0">
 <div className="flex flex-wrap items-center gap-2">
 <h3 className="eos-title min-w-0 break-words">{task.title || 'Untitled task'}</h3>
 <Badge tone={isOverdue(task) ? 'bad' : task.priority === 'urgent' ? 'bad' : task.priority === 'high' ? 'warn' : 'neutral'}>
 {isOverdue(task) ? 'overdue' : task.priority}
 </Badge>
 </div>
 <p className="eos-body eos-muted mt-1">{task.owner || 'No owner'} · {task.due_date || 'No deadline'}</p>
 {task.notes ? <p className="eos-task-notes eos-body whitespace-pre-wrap">{task.notes}</p> : <p className="eos-body eos-muted mt-2">No notes.</p>}
 {task.checklist.length > 0 && (
 <p className="eos-caption eos-muted mt-2">
 {completedSubtasks}/{task.checklist.length} subtasks marked with ✓
 </p>
 )}
 </div>

 <div className="eos-task-actions">
 <label className="eos-task-status-label">
 <span>Status</span>
 <select className="eos-task-status-select" value={task.status} onChange={(event) => void onSave({ ...task, status: event.target.value as TaskStatus })}>
 {TASK_STATUSES.map((status) => (
 <option key={status}>{status}</option>
 ))}
 </select>
 </label>
 <Button className="eos-task-settings-button" kind="ghost" onClick={() => onEdit(task)}>
 Settings
 </Button>
 </div>
 </div>
 );
}


type CsvImportProps = {
 projects: Project[];
 events: PlannerEvent[];
 saveProject: (project: Project) => Promise<void>;
 saveTask: (task: Task) => Promise<void>;
 onSelectProject: (id: string) => void;
};

function CsvImport({ projects, events, saveProject, saveTask, onSelectProject }: CsvImportProps) {
 const [result, setResult] = useState<CsvImportResult | null>(null);
 const [busy, setBusy] = useState(false);

 const importCsv = async (event: ChangeEvent<HTMLInputElement>) => {
 const file = event.target.files?.[0];
 event.target.value = '';
 if (!file) return;

 setBusy(true);
 setResult(null);

 try {
 const rows = parseCsv(await file.text());
 const projectMap = new Map(projects.map((project) => [project.title.trim().toLowerCase(), project]));
 let firstImportedProjectId = '';
 let importedProjects = 0;
 let importedTasks = 0;
 let skippedRows = 0;

 for (const row of rows) {
 const projectTitle = csvKey(row, ['project', 'project_name', 'project_title', 'projectname']);
 const taskTitle = csvKey(row, ['task', 'task_name', 'task_title', 'taskname']);
 if (!projectTitle && !taskTitle) {
 skippedRows += 1;
 continue;
 }

 const projectKey = (projectTitle || 'Imported project').toLowerCase();
 let project = projectMap.get(projectKey);
 if (!project) {
 const linkedEventName = csvKey(row, ['event', 'linked_event', 'event_name']);
 const linkedEvent = events.find((current) => current.meta.name.trim().toLowerCase() === linkedEventName.trim().toLowerCase());
 project = {
 ...blankProject(),
 title: projectTitle || 'Imported project',
 owner: csvKey(row, ['project_owner', 'owner']),
 status: parseStatus(csvKey(row, ['project_status', 'status']), PROJECT_STATUSES, 'planning'),
 priority: parseStatus(csvKey(row, ['project_priority', 'priority']), PRIORITIES, 'medium'),
 due_date: csvKey(row, ['project_due_date', 'due_date', 'deadline']) || null,
 linked_event_id: linkedEvent?.id || null,
 description: csvKey(row, ['project_description', 'description']),
 notes: csvKey(row, ['project_notes']),
 created_at: now(),
 updated_at: now(),
 };
 await saveProject(project);
 projectMap.set(projectKey, project);
 firstImportedProjectId ||= project.id;
 importedProjects += 1;
 }

 if (taskTitle) {
 const task = {
 ...blankTask(),
 project_id: project.id,
 title: taskTitle,
 status: parseStatus(csvKey(row, ['task_status', 'status']), TASK_STATUSES, 'pending'),
 priority: parseStatus(csvKey(row, ['task_priority', 'priority']), PRIORITIES, 'medium'),
 owner: csvKey(row, ['task_owner', 'assignee', 'owner']),
 due_date: csvKey(row, ['task_due_date', 'task_deadline', 'deadline']) || null,
 notes: csvKey(row, ['task_notes', 'notes']),
 checklist: csvKey(row, ['checklist', 'subtasks'])
 .split('|')
 .map((item) => item.trim())
 .filter(Boolean),
 image_urls: csvKey(row, ['image_urls', 'images'])
 .split('|')
 .map((item) => item.trim())
 .filter(Boolean),
 };
 await saveTask(task);
 importedTasks += 1;
 }
 }

 if (firstImportedProjectId) onSelectProject(firstImportedProjectId);
 setResult({ importedProjects, importedTasks, skippedRows, message: `Imported ${importedProjects} project${importedProjects === 1 ? '' : 's'} and ${importedTasks} task${importedTasks === 1 ? '' : 's'}.` });
 } catch {
 setResult({ importedProjects: 0, importedTasks: 0, skippedRows: 0, message: 'CSV import failed. Check the file format and headers.' });
 } finally {
 setBusy(false);
 }
 };

 return (
 <Section title="CSV import" right={<Badge>Projects + tasks</Badge>}>
 <p className="eos-body eos-muted">
 Upload a CSV to create projects and tasks. Each task row must include a project name so it can be tied to the correct project.
 </p>
 <div className="eos-subcard eos-stack">
 <p className="eos-caption eos-muted">Supported headers</p>
 <p className="eos-body">
 project, task, notes, status, priority, owner, deadline, project_status, project_priority, project_description, project_notes, task_status, task_priority, task_owner, task_due_date, task_notes, checklist
 </p>
 </div>
 <Field label="CSV file">
 <input type="file" accept=".csv,text/csv" onChange={importCsv} disabled={busy} />
 </Field>
 {result && <p className="eos-body">{result.message}{result.skippedRows ? ` Skipped ${result.skippedRows} empty row${result.skippedRows === 1 ? '' : 's'}.` : ''}</p>}
 </Section>
 );
}

export default function ProjectManagement() {
 const { events, projects, tasks, saveProject, deleteProject, saveTask, deleteTask } = useEventStore();
 const [selectedProjectId, setSelectedProjectId] = useState(projects[0]?.id || '');
 const [taskDraft, setTaskDraft] = useState<Task | null>(null);

 useEffect(() => {
 if (!projects.length) {
 setSelectedProjectId('');
 return;
 }
 if (!selectedProjectId || !projects.some((project) => project.id === selectedProjectId)) {
 setSelectedProjectId(projects[0].id);
 }
 }, [projects, selectedProjectId]);

 const selectedProject = projects.find((project) => project.id === selectedProjectId) || projects[0];
 const projectTasks = useMemo(() => (selectedProject ? tasks.filter((task) => task.project_id === selectedProject.id) : []), [selectedProject, tasks]);
 const visibleProjectTasks = projectTasks.filter((task) => task.status !== 'archived');

 const stats = {
 allProjects: projects.length,
 projectTasks: visibleProjectTasks.length,
 doing: projectTasks.filter((task) => task.status === 'doing').length,
 done: projectTasks.filter((task) => task.status === 'done').length,
 overdue: projectTasks.filter(isOverdue).length,
 progress: percent(projectTasks.filter((task) => task.status === 'done').length, visibleProjectTasks.length),
 };

 const createProject = () => {
 const project = blankProject();
 setSelectedProjectId(project.id);
 void saveProject(project);
 };

 const createTask = () => {
 if (!selectedProject) return;
 setTaskDraft({ ...blankTask(), project_id: selectedProject.id });
 };

 const deleteSelectedProject = async (id: string) => {
 await Promise.all(projectTasks.map((task) => deleteTask(task.id)));
 await deleteProject(id);
 };

 return (
 <AppShell>
 <div className="space-y-5">
 <ProjectSelector projects={projects} selectedProjectId={selectedProject?.id || ''} onSelect={setSelectedProjectId} onCreate={createProject} />

 <CsvImport projects={projects} events={events} saveProject={saveProject} saveTask={saveTask} onSelectProject={setSelectedProjectId} />

 {selectedProject ? (
 <>
 <Card>
 <div className="flex items-start justify-between gap-3">
 <div>
 <p className="eos-caption eos-muted">Selected project</p>
 <h2 className="eos-heading mt-2">{selectedProject.title || 'Untitled project'}</h2>
 <p className="eos-body eos-muted mt-2">{projectEventName(events, selectedProject)} · {selectedProject.owner || 'No owner'}</p>
 </div>
 <Badge tone={selectedProject.priority === 'urgent' ? 'bad' : selectedProject.priority === 'high' ? 'warn' : 'neutral'}>{selectedProject.priority}</Badge>
 </div>

 <div className="mt-4 grid grid-cols-2 gap-2">
 <Stat label="Projects" value={stats.allProjects} />
 <Stat label="Tasks" value={stats.projectTasks} />
 <Stat label="Doing" value={stats.doing} />
 <Stat label="Done" value={`${stats.progress}%`} />
 </div>

 <div className="mt-4 grid grid-cols-2 gap-2">
 <Button onClick={createTask}>New task</Button>
 <Button kind="ghost" onClick={createProject}>New project</Button>
 </div>

 {stats.overdue > 0 && <p className="eos-caption mt-3">{stats.overdue} overdue task{stats.overdue === 1 ? '' : 's'}</p>}
 </Card>

 <ProjectEditor events={events} project={selectedProject} saveProject={saveProject} deleteProject={deleteSelectedProject} />

 <Section title="Project tasks" openDefault right={<Badge>{projectTasks.length}</Badge>}>
 {projectTasks.length === 0 && <p className="eos-body eos-muted">No tasks in this project yet.</p>}
 {TASK_STATUSES.map((status) => {
 const statusTasks = projectTasks.filter((task) => task.status === status);
 return (
 <PlainCollapsible key={status} title={status[0].toUpperCase() + status.slice(1)} count={statusTasks.length} openDefault={status !== 'archived'}>
 {statusTasks.length === 0 && <p className="eos-body eos-muted py-3">No {status} tasks.</p>}
 {statusTasks.map((task) => (
 <TaskListRow key={task.id} task={task} onEdit={setTaskDraft} onSave={saveTask} />
 ))}
 </PlainCollapsible>
 );
 })}
 </Section>
 </>
 ) : (
 <Card>
 <h2 className="eos-heading">No project selected</h2>
 <p className="eos-body eos-muted mt-2">Create a project to start adding tasks. Tasks cannot exist without a project in this workflow.</p>
 <Button className="mt-4" onClick={createProject}>Create first project</Button>
 </Card>
 )}

 <TaskModal
 projects={projects}
 taskDraft={taskDraft}
 selectedProjectId={selectedProject?.id || ''}
 setTaskDraft={setTaskDraft}
 saveTask={saveTask}
 deleteTask={deleteTask}
 />
 </div>
 </AppShell>
 );
}
