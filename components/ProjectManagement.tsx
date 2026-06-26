'use client';

import { useEffect, useMemo, useState } from 'react';
import { blankProject, blankTask } from '@/lib/defaults';
import { Priority, PlannerEvent, Project, ProjectStatus, Task, TaskStatus } from '@/lib/types';
import { useEventStore } from './EventStore';
import { AppShell, Badge, Button, Card, Field, Row, Section, Stat } from './ui/AppShell';

const PROJECT_STATUSES: ProjectStatus[] = ['idea', 'planning', 'in-progress', 'waiting', 'done', 'cancelled'];
const TASK_STATUSES: TaskStatus[] = ['pending', 'doing', 'done', 'archived'];
const ACTIVE_TASK_STATUSES: TaskStatus[] = ['pending', 'doing', 'done'];
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

function TaskCard({ task, onEdit, onSave }: TaskCardProps) {
 const completedSubtasks = task.checklist.filter((item) => item.trim().startsWith('✓')).length;

 return (
 <Card className="eos-panel">
 <div className="flex items-start justify-between gap-3">
 <div>
 <h3 className="eos-title">{task.title || 'Untitled task'}</h3>
 <p className="eos-body eos-muted">{task.owner || 'No owner'} · {task.due_date || 'No deadline'}</p>
 </div>
 <Badge tone={isOverdue(task) ? 'bad' : task.priority === 'urgent' ? 'bad' : task.priority === 'high' ? 'warn' : 'neutral'}>
 {isOverdue(task) ? 'overdue' : task.priority}
 </Badge>
 </div>

 {task.notes && <p className="eos-body mt-3">{task.notes}</p>}
 {task.checklist.length > 0 && (
 <p className="eos-caption eos-muted mt-3">
 {completedSubtasks}/{task.checklist.length} subtasks marked with ✓
 </p>
 )}

 <div className="mt-3 flex flex-wrap gap-2">
 <Button kind="ghost" onClick={() => onEdit(task)}>
 Settings
 </Button>
 <Button kind="ghost" onClick={() => void onSave({ ...task, status: task.status === 'done' ? 'pending' : 'done' })}>
 {task.status === 'done' ? 'Uncomplete' : 'Complete'}
 </Button>
 <Button kind="ghost" onClick={() => void onSave({ ...task, status: task.status === 'doing' ? 'pending' : 'doing' })}>
 Doing
 </Button>
 <Button kind="danger" onClick={() => void onSave({ ...task, status: 'archived' })}>
 Archive
 </Button>
 </div>
 </Card>
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
 const archivedProjectTasks = projectTasks.filter((task) => task.status === 'archived');

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

 <Section title="Project tasks" openDefault right={<Badge>{visibleProjectTasks.length}</Badge>}>
 {visibleProjectTasks.length === 0 && <p className="eos-body eos-muted">No tasks in this project yet.</p>}
 {ACTIVE_TASK_STATUSES.map((status) => {
 const statusTasks = visibleProjectTasks.filter((task) => task.status === status);
 return (
 <Section key={status} title={status[0].toUpperCase() + status.slice(1)} openDefault={status !== 'done'} right={<Badge>{statusTasks.length}</Badge>}>
 {statusTasks.length === 0 && <p className="eos-body eos-muted">No {status} tasks.</p>}
 {statusTasks.map((task) => (
 <TaskCard key={task.id} task={task} onEdit={setTaskDraft} onSave={saveTask} />
 ))}
 </Section>
 );
 })}
 </Section>

 <Section title="Archived tasks" right={<Badge>{archivedProjectTasks.length}</Badge>}>
 {archivedProjectTasks.length === 0 && <p className="eos-body eos-muted">No archived tasks for this project.</p>}
 {archivedProjectTasks.map((task) => (
 <TaskCard key={task.id} task={task} onEdit={setTaskDraft} onSave={saveTask} />
 ))}
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
