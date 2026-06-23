'use client';

import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { blankProject, blankSubmission, blankTask, eventFromTemplate, hydrateEvent, now } from '@/lib/defaults';
import { supabase, supabaseReady } from '@/lib/supabaseClient';
import { ArtistSubmission, PlannerEvent, Project, Task } from '@/lib/types';

type Store = {
 ownerKey: string;
 setOwnerKey: (value: string) => void;
 events: PlannerEvent[];
 currentId: string;
 current?: PlannerEvent;
 setCurrentId: (id: string) => void;
 saveEvent: (event: PlannerEvent) => Promise<void>;
 createEvent: (template: string) => Promise<PlannerEvent>;
 duplicateEvent: (id: string) => Promise<void>;
 deleteEvent: (id: string) => Promise<void>;
 artists: ArtistSubmission[];
 saveArtist: (artist: ArtistSubmission) => Promise<void>;
 createArtist: (artist: ArtistSubmission) => Promise<void>;
 projects: Project[];
 tasks: Task[];
 saveProject: (project: Project) => Promise<void>;
 deleteProject: (id: string) => Promise<void>;
 saveTask: (task: Task) => Promise<void>;
 deleteTask: (id: string) => Promise<void>;
 refresh: () => Promise<void>;
 alert: string;
 usingLocal: boolean;
};

const StoreContext = createContext<Store | null>(null);
const LOCAL_STORAGE_KEY = 'eos-v1';

function readLocal() {
 if (typeof window === 'undefined') return null;

 try {
 return JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '{}');
 } catch {
 return {};
 }
}

function stripStoredFiles(event: PlannerEvent): PlannerEvent {
 return {
 ...event,
 files: (event.files || []).map((file) => ({
 ...file,
 dataUrl: file.dataUrl?.startsWith('data:') ? '' : file.dataUrl,
 })),
 };
}

function safeLocalData(data: any) {
 return {
 ...data,
 events: (data.events || []).map(stripStoredFiles),
 };
}

function writeLocal(data: any) {
 if (typeof window === 'undefined') return;

 try {
 localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(safeLocalData(data)));
 } catch {
 localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(safeLocalData({ ...data, events: [] })));
 }
}

function dbToEvent(row: any) {
 return hydrateEvent({ id: row.id, ...(row.payload || {}), updatedAt: row.updated_at });
}

function eventToPayload(event: PlannerEvent) {
 const { id, updatedAt, ...payload } = stripStoredFiles(event);
 void id;
 void updatedAt;
 return payload;
}

export function EventStoreProvider({ children }: { children: ReactNode }) {
 const local = readLocal() || {};

 const [ownerKey, setOwnerKeyState] = useState(local.ownerKey || 'default-workspace');
 const [events, setEvents] = useState<PlannerEvent[]>((local.events || []).map(hydrateEvent));
 const [artists, setArtists] = useState<ArtistSubmission[]>(local.artists || []);
 const [projects, setProjects] = useState<Project[]>(local.projects || []);
 const [tasks, setTasks] = useState<Task[]>(local.tasks || []);
 const [currentId, setCurrentId] = useState(local.currentId || '');
 const [alert, setAlert] = useState('');
 const [usingLocal, setUsingLocal] = useState(!supabaseReady);

 useEffect(() => {
 writeLocal({ ownerKey, events, artists, projects, tasks, currentId });
 }, [ownerKey, events, artists, projects, tasks, currentId]);

 const refresh = async () => {
 if (!supabase) {
 setUsingLocal(true);
 return;
 }

 try {
 const [eventResponse, artistResponse, projectResponse, taskResponse] = await Promise.all([
 supabase.from('event_plans').select('*').eq('owner_key', ownerKey).order('event_date'),
 supabase.from('artist_submissions').select('*').order('created_at', { ascending: false }),
 supabase.from('project_management_projects').select('*').order('updated_at', { ascending: false }),
 supabase.from('project_management_tasks').select('*').order('updated_at', { ascending: false }),
 ]);

 if (eventResponse.error || artistResponse.error || projectResponse.error || taskResponse.error) {
 throw eventResponse.error || artistResponse.error || projectResponse.error || taskResponse.error;
 }

 setEvents((eventResponse.data || []).map(dbToEvent));
 setArtists(
 (artistResponse.data || []).map((artist: any) => ({
 ...artist,
 links: typeof artist.links === 'string' ? JSON.parse(artist.links || '{}') : artist.links || {},
 })),
 );
 setProjects(projectResponse.data || []);
 setTasks(
 (taskResponse.data || []).map((task: any) => ({
 ...task,
 checklist: task.checklist || [],
 image_urls: task.image_urls || [],
 })),
 );
 setUsingLocal(false);
 setAlert('Synced with Supabase');
 } catch (error: any) {
 setUsingLocal(true);
 setAlert(`Supabase unavailable. Local mode active. ${error?.message || ''}`);
 }
 };

 useEffect(() => {
 refresh();
 }, [ownerKey]);

 const setOwnerKey = (value: string) => {
 setOwnerKeyState(value || 'default-workspace');
 };

 const saveEvent = async (event: PlannerEvent) => {
 const next = { ...hydrateEvent(event), updatedAt: now() };
 setEvents((previous) => [next, ...previous.filter((current) => current.id !== next.id)]);
 setCurrentId(next.id);

 if (supabase) {
 try {
 const { error } = await supabase.from('event_plans').upsert({
 id: next.id,
 owner_key: ownerKey,
 name: next.meta.name,
 event_date: next.meta.date || null,
 payload: eventToPayload(next),
 updated_at: next.updatedAt,
 });

 if (error) throw error;
 setUsingLocal(false);
 setAlert('Event saved');
 } catch (error: any) {
 setUsingLocal(true);
 setAlert(`Saved locally. Supabase save failed: ${error?.message || ''}`);
 }
 }
 };

 const createEvent = async (template: string) => {
 const event = eventFromTemplate(template);
 await saveEvent(event);
 return event;
 };

 const duplicateEvent = async (id: string) => {
 const event = events.find((current) => current.id === id);
 if (!event) return;

 await saveEvent(
 hydrateEvent({
 ...event,
 id: crypto.randomUUID(),
 meta: { ...event.meta, name: `${event.meta.name} copy` },
 updatedAt: now(),
 }),
 );
 };

 const deleteEvent = async (id: string) => {
 setEvents((previous) => previous.filter((event) => event.id !== id));
 if (currentId === id) setCurrentId('');
 if (supabase) await supabase.from('event_plans').delete().eq('id', id);
 };

 const saveArtist = async (artist: ArtistSubmission) => {
 const next = { ...blankSubmission(), ...artist, updated_at: now() };
 setArtists((previous) => [next, ...previous.filter((current) => current.id !== next.id)]);

 if (supabase) {
 try {
 const { error } = await supabase.from('artist_submissions').upsert(next);
 if (error) throw error;
 setAlert('Artist saved');
 } catch (error: any) {
 setUsingLocal(true);
 setAlert(`Artist saved locally: ${error?.message || ''}`);
 }
 }
 };

 const createArtist = saveArtist;

 const saveProject = async (project: Project) => {
 const next = { ...blankProject(), ...project, updated_at: now() };
 setProjects((previous) => [next, ...previous.filter((current) => current.id !== next.id)]);
 if (supabase) await supabase.from('project_management_projects').upsert(next);
 };

 const deleteProject = async (id: string) => {
 setProjects((previous) => previous.filter((project) => project.id !== id));
 if (supabase) await supabase.from('project_management_projects').delete().eq('id', id);
 };

 const saveTask = async (task: Task) => {
 const next = { ...blankTask(), ...task, updated_at: now() };
 setTasks((previous) => [next, ...previous.filter((current) => current.id !== next.id)]);
 if (supabase) await supabase.from('project_management_tasks').upsert(next);
 };

 const deleteTask = async (id: string) => {
 setTasks((previous) => previous.filter((task) => task.id !== id));
 if (supabase) await supabase.from('project_management_tasks').delete().eq('id', id);
 };

 const current = events.find((event) => event.id === currentId) || events[0];

 const value = useMemo(
 () => ({
 ownerKey,
 setOwnerKey,
 events,
 currentId: current?.id || '',
 current,
 setCurrentId,
 saveEvent,
 createEvent,
 duplicateEvent,
 deleteEvent,
 artists,
 saveArtist,
 createArtist,
 projects,
 tasks,
 saveProject,
 deleteProject,
 saveTask,
 deleteTask,
 refresh,
 alert,
 usingLocal,
 }),
 [ownerKey, current, events, artists, projects, tasks, alert, usingLocal],
 );

 return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useEventStore() {
 const value = useContext(StoreContext);
 if (!value) throw new Error('Store missing');
 return value;
}
