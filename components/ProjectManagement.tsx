'use client';

import { useState } from 'react';
import { blankProject, blankTask } from '@/lib/defaults';
import { Priority, Project, ProjectStatus, Task, TaskStatus } from '@/lib/types';
import { useEventStore } from './EventStore';
import { AppShell, Badge, Button, Card, Field, Row, Section, Stat } from './ui/AppShell';

const PROJECT_STATUSES: ProjectStatus[] = ['idea', 'planning', 'in-progress', 'waiting', 'done', 'cancelled'];
const TASK_STATUSES: TaskStatus[] = ['pending', 'doing', 'done', 'archived'];
const PRIORITIES: Priority[] = ['low', 'medium', 'high', 'urgent'];

const isOverdue = (task: Task) => task.due_date && new Date(task.due_date) < new Date() && !['done', 'archived'].includes(task.status);

export default function ProjectManagement() {
 const { events, projects, tasks, saveProject, deleteProject, saveTask, deleteTask } = useEventStore();
 const [taskDraft, setTaskDraft] = useState<Task | null>(null);

 const counts = {
 pending: tasks.filter((task) => task.status === 'pending').length,
 doing: tasks.filter((task) => task.status === 'doing').length,
 overdue: tasks.filter(isOverdue).length,
 };

 const eventSelect = (value: string | null, onChange: (value: string | null) => void) => (
 <Field label="Linked event">
 <select value={value || ''} onChange={(event) => onChange(event.target.value || null)}>
 <option value="">No event</option>
 {events.map((event) => (
 <option key={event.id} value={event.id}>
 {event.meta.name}
 </option>
 ))}
 </select>
 </Field>
 );

 function ProjectEditor({ project }: { project: Project }) {
 return (
 <Section
 title={project.title}
 right={<Badge tone={project.priority === 'urgent' ? 'bad' : project.priority === 'high' ? 'warn' : 'neutral'}>{project.status}</Badge>}
 >
 <Row>
 <Field label="Title">
 <input value={project.title} onChange={(event) => saveProject({ ...project, title: event.target.value })} />
 </Field>
 <Field label="Owner">
 <input value={project.owner} onChange={(event) => saveProject({ ...project, owner: event.target.value })} />
 </Field>
 </Row>

 <Row>
 <Field label="Status">
 <select value={project.status} onChange={(event) => saveProject({ ...project, status: event.target.value as ProjectStatus })}>
 {PROJECT_STATUSES.map((status) => (
 <option key={status}>{status}</option>
 ))}
 </select>
 </Field>
 <Field label="Priority">
 <select value={project.priority} onChange={(event) => saveProject({ ...project, priority: event.target.value as Priority })}>
 {PRIORITIES.map((priority) => (
 <option key={priority}>{priority}</option>
 ))}
 </select>
 </Field>
 </Row>

 <Row>
 <Field label="Due date">
 <input type="date" value={project.due_date || ''} onChange={(event) => saveProject({ ...project, due_date: event.target.value || null })} />
 </Field>
 {eventSelect(project.linked_event_id, (linkedEventId) => saveProject({ ...project, linked_event_id: linkedEventId }))}
 </Row>

 <Field label="Description">
 <textarea value={project.description} onChange={(event) => saveProject({ ...project, description: event.target.value })} />
 </Field>
 <Field label="Notes">
 <textarea value={project.notes} onChange={(event) => saveProject({ ...project, notes: event.target.value })} />
 </Field>
 <Button kind="danger" onClick={() => deleteProject(project.id)}>
 Delete project
 </Button>
 </Section>
 );
 }

 function TaskModal() {
 if (!taskDraft) return null;

 const task = taskDraft;
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
 <Field label="Title">
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

 <Row>
 <Field label="Project">
 <select value={task.project_id || ''} onChange={(event) => setDraft({ project_id: event.target.value || null })}>
 <option value="">No project</option>
 {projects.map((project) => (
 <option key={project.id} value={project.id}>
 {project.title}
 </option>
 ))}
 </select>
 </Field>
 {eventSelect(task.linked_event_id, (linkedEventId) => setDraft({ linked_event_id: linkedEventId }))}
 </Row>

 <Field label="Notes">
 <textarea value={task.notes} onChange={(event) => setDraft({ notes: event.target.value })} />
 </Field>

 <Section title="Checklist" openDefault>
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
 saveTask(task);
 setTaskDraft(null);
 }}
 >
 Save task
 </Button>
 <Button
 kind="danger"
 onClick={() => {
 deleteTask(task.id);
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

 return (
 <AppShell>
 <div className="space-y-5">
 <Card>
 <p className="eos-body eos-muted">Operational projects and tasks</p>
 <h2 className="eos-heading mt-2">Project board</h2>
 <div className="mt-4 grid grid-cols-2 gap-2">
 <Stat label="Projects" value={projects.length} />
 <Stat label="Pending" value={counts.pending} />
 <Stat label="Doing" value={counts.doing} />
 <Stat label="Overdue" value={counts.overdue} />
 </div>
 <div className="mt-4 grid grid-cols-2 gap-2">
 <Button onClick={() => saveProject(blankProject())}>New project</Button>
 <Button kind="ghost" onClick={() => setTaskDraft(blankTask())}>
 New task
 </Button>
 </div>
 </Card>

 <Section title="Projects" openDefault>
 {projects.length === 0 && <p className="eos-body eos-muted">No projects yet.</p>}
 {projects.map((project) => (
 <ProjectEditor key={project.id} project={project} />
 ))}
 </Section>

 {TASK_STATUSES.map((status) => (
 <Section
 key={status}
 title={status[0].toUpperCase() + status.slice(1)}
 openDefault={status !== 'archived'}
 right={<Badge>{tasks.filter((task) => task.status === status).length}</Badge>}
 >
 {tasks
 .filter((task) => task.status === status)
 .map((task) => (
 <Card key={task.id} className="eos-panel">
 <div className="flex items-start justify-between gap-3">
 <div>
 <h3 className="eos-title">{task.title}</h3>
 <p className="eos-body eos-muted">{task.owner || 'No owner'} · {task.due_date || 'No deadline'}</p>
 </div>
 <Badge tone={isOverdue(task) ? 'bad' : task.priority === 'urgent' ? 'bad' : task.priority === 'high' ? 'warn' : 'neutral'}>
 {isOverdue(task) ? 'overdue' : task.priority}
 </Badge>
 </div>

 <div className="mt-3 flex flex-wrap gap-2">
 <Button kind="ghost" onClick={() => setTaskDraft(task)}>
 Settings
 </Button>
 <Button kind="ghost" onClick={() => saveTask({ ...task, status: task.status === 'done' ? 'pending' : 'done' })}>
 {task.status === 'done' ? 'Uncomplete' : 'Complete'}
 </Button>
 <Button kind="ghost" onClick={() => saveTask({ ...task, status: task.status === 'doing' ? 'pending' : 'doing' })}>
 Doing
 </Button>
 <Button kind="danger" onClick={() => saveTask({ ...task, status: 'archived' })}>
 Archive
 </Button>
 </div>
 </Card>
 ))}
 </Section>
 ))}

 <TaskModal />
 </div>
 </AppShell>
 );
}
