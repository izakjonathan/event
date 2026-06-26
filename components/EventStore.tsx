'use client';

import { createContext, ReactNode, useContext, useCallback, useEffect, useMemo, useState } from 'react';
import { blankProject, blankSubmission, blankSupplier, blankTask, eventFromTemplate, hydrateEvent, now } from '@/lib/defaults';
import { supabase } from '@/lib/supabaseClient';
import { ArtistSubmission, PlannerEvent, Project, Supplier, Task } from '@/lib/types';

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
  suppliers: Supplier[];
  saveSupplier: (supplier: Supplier) => Promise<void>;
  deleteSupplier: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
};

const StoreContext = createContext<Store | null>(null);
const LOCAL_STORAGE_KEY = 'eos-v1';
type LocalData = Partial<Pick<Store, 'ownerKey' | 'events' | 'artists' | 'projects' | 'tasks' | 'suppliers' | 'currentId'>>;

function readLocal(): LocalData {
  if (typeof window === 'undefined') return {};

  try {
    const data = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '{}');
    return data && typeof data === 'object' ? data : {};
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

function scheduleLocalWrite(data: any) {
  if (typeof window === 'undefined') return () => {};

  let cancelled = false;
  const save = () => {
    if (!cancelled) writeLocal(data);
  };

  const requestIdle = (window as any).requestIdleCallback as undefined | ((callback: () => void, options?: { timeout: number }) => number);
  const cancelIdle = (window as any).cancelIdleCallback as undefined | ((id: number) => void);

  if (requestIdle && cancelIdle) {
    const id = requestIdle(save, { timeout: 600 });
    return () => {
      cancelled = true;
      cancelIdle(id);
    };
  }

  const id = window.setTimeout(save, 120);
  return () => {
    cancelled = true;
    window.clearTimeout(id);
  };
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
  const [initialLocal] = useState(readLocal);

  const [ownerKey, setOwnerKeyState] = useState(initialLocal.ownerKey || 'default-workspace');
  const [events, setEvents] = useState<PlannerEvent[]>(() => (initialLocal.events || []).map(hydrateEvent));
  const [artists, setArtists] = useState<ArtistSubmission[]>(() => initialLocal.artists || []);
  const [projects, setProjects] = useState<Project[]>(() => initialLocal.projects || []);
  const [tasks, setTasks] = useState<Task[]>(() => initialLocal.tasks || []);
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => initialLocal.suppliers || []);
  const [currentId, setCurrentId] = useState(initialLocal.currentId || '');

  useEffect(() => {
    return scheduleLocalWrite({ ownerKey, events, artists, projects, tasks, suppliers, currentId });
  }, [ownerKey, events, artists, projects, tasks, suppliers, currentId]);

  const refresh = useCallback(async () => {
    if (!supabase) {
      return;
    }

    try {
      const [eventResponse, artistResponse, projectResponse, taskResponse, supplierResponse] = await Promise.all([
        supabase.from('event_plans').select('*').eq('owner_key', ownerKey).order('event_date'),
        supabase.from('artist_submissions').select('*').order('created_at', { ascending: false }),
        supabase.from('project_management_projects').select('*').order('updated_at', { ascending: false }),
        supabase.from('project_management_tasks').select('*').order('updated_at', { ascending: false }),
        supabase.from('suppliers').select('*').eq('owner_key', ownerKey).order('updated_at', { ascending: false }),
      ]);

      if (eventResponse.error || artistResponse.error || projectResponse.error || taskResponse.error || supplierResponse.error) {
        throw eventResponse.error || artistResponse.error || projectResponse.error || taskResponse.error || supplierResponse.error;
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
      setSuppliers(supplierResponse.data || []);
    } catch {
      // Supabase is optional. Local data remains the source of truth if sync fails.
    }
  }, [ownerKey]);

  useEffect(() => {
    let cancelled = false;
    const run = () => {
      if (!cancelled) void refresh();
    };
    const requestIdle = (window as any).requestIdleCallback as undefined | ((callback: () => void, options?: { timeout: number }) => number);
    const cancelIdle = (window as any).cancelIdleCallback as undefined | ((id: number) => void);

    if (requestIdle && cancelIdle) {
      const id = requestIdle(run, { timeout: 1200 });
      return () => {
        cancelled = true;
        cancelIdle(id);
      };
    }

    const id = window.setTimeout(run, 160);
    return () => {
      cancelled = true;
      window.clearTimeout(id);
    };
  }, [refresh]);

  const setOwnerKey = useCallback((value: string) => {
    setOwnerKeyState(value || 'default-workspace');
  }, []);

  const saveEvent = useCallback(async (event: PlannerEvent) => {
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
      } catch {
        // Local optimistic save already completed.
      }
    }
  }, [ownerKey]);

  const createEvent = useCallback(async (template: string) => {
    const event = eventFromTemplate(template);
    await saveEvent(event);
    return event;
  }, [saveEvent]);

  const duplicateEvent = useCallback(async (id: string) => {
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
  }, [events, saveEvent]);

  const deleteEvent = useCallback(async (id: string) => {
    setEvents((previous) => previous.filter((event) => event.id !== id));
    if (currentId === id) setCurrentId('');
    if (supabase) await supabase.from('event_plans').delete().eq('id', id);
  }, [currentId]);

  const saveArtist = useCallback(async (artist: ArtistSubmission) => {
    const next = { ...blankSubmission(), ...artist, updated_at: now() };
    setArtists((previous) => [next, ...previous.filter((current) => current.id !== next.id)]);

    if (supabase) {
      try {
        const { error } = await supabase.from('artist_submissions').upsert(next);
        if (error) throw error;
      } catch {
        // Local optimistic save already completed.
      }
    }
  }, []);

  const createArtist = saveArtist;

  const saveProject = useCallback(async (project: Project) => {
    const next = { ...blankProject(), ...project, updated_at: now() };
    setProjects((previous) => [next, ...previous.filter((current) => current.id !== next.id)]);
    if (supabase) await supabase.from('project_management_projects').upsert(next);
  }, []);

  const deleteProject = useCallback(async (id: string) => {
    setProjects((previous) => previous.filter((project) => project.id !== id));
    setTasks((previous) => previous.filter((task) => task.project_id !== id));
    if (supabase) {
      await supabase.from('project_management_tasks').delete().eq('project_id', id);
      await supabase.from('project_management_projects').delete().eq('id', id);
    }
  }, []);

  const saveTask = useCallback(async (task: Task) => {
    const next = { ...blankTask(), ...task, updated_at: now() };
    setTasks((previous) => [next, ...previous.filter((current) => current.id !== next.id)]);
    if (supabase) await supabase.from('project_management_tasks').upsert(next);
  }, []);

  const deleteTask = useCallback(async (id: string) => {
    setTasks((previous) => previous.filter((task) => task.id !== id));
    if (supabase) await supabase.from('project_management_tasks').delete().eq('id', id);
  }, []);

  const saveSupplier = useCallback(async (supplier: Supplier) => {
    const next = { ...blankSupplier(), ...supplier, owner_key: ownerKey, updated_at: now() };
    setSuppliers((previous) => [next, ...previous.filter((current) => current.id !== next.id)]);
    if (supabase) await supabase.from('suppliers').upsert(next);
  }, [ownerKey]);

  const deleteSupplier = useCallback(async (id: string) => {
    setSuppliers((previous) => previous.filter((supplier) => supplier.id !== id));
    if (supabase) await supabase.from('suppliers').delete().eq('id', id);
  }, []);

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
      suppliers,
      saveSupplier,
      deleteSupplier,
      refresh,
    }),
    [
      ownerKey,
      current,
      events,
      artists,
      projects,
      tasks,
      suppliers,
      setOwnerKey,
      saveEvent,
      createEvent,
      duplicateEvent,
      deleteEvent,
      saveArtist,
      createArtist,
      saveProject,
      deleteProject,
      saveTask,
      deleteTask,
      saveSupplier,
      deleteSupplier,
      refresh,
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useEventStore() {
  const value = useContext(StoreContext);
  if (!value) throw new Error('Store missing');
  return value;
}
