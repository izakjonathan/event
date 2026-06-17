'use client';

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { getSupabaseClient } from '@/lib/supabaseClient';

type EventStatus = 'idea' | 'quoted' | 'confirmed' | 'cancelled' | 'completed';

type EventMeta = {
  name: string;
  date: string;
  endDate: string;
  location: string;
  time: string;
  endTime: string;
  terms: string;
  notes: string;
  status: EventStatus;
};

type TicketTier = {
  id: string;
  name: string;
  price: number;
  sold: number;
  capacity: number;
  notes: string;
};

type LineKind = 'income' | 'expense';
type LineMode = 'fixed' | 'perTicketHolder' | 'percentageOfTickets';

type MoneyLine = {
  id: string;
  kind: LineKind;
  name: string;
  amount: number;
  quantity: number;
  mode: LineMode;
  notes: string;
};

type StaffLine = {
  id: string;
  role: string;
  people: number;
  hours: number;
  hourlyWage: number;
  extraPercent: number;
  notes: string;
};

type BarPlan = {
  enabled: boolean;
  useTicketGuests: boolean;
  customGuests: number;
  spendPerGuest: number;
  costPercent: number;
  notes: string;
};

type Scenario = {
  id: string;
  name: string;
  ticketsSold: number;
  averageTicketPrice: number;
  barSpendPerGuest: number;
  extraExpenses: number;
  notes: string;
};

type TermsPlan = {
  enabled: boolean;
  organizerTicketShare: number;
  organizerBarProfitShare: number;
  flatVenueHire: number;
  minimumVenueGuarantee: number;
  notes: string;
};

type EventFile = {
  id: string;
  name: string;
  originalName: string;
  mimeType: string;
  size: number;
  dataUrl: string;
  uploadedAt: string;
};

type PlannerEvent = {
  id: string;
  meta: EventMeta;
  tickets: TicketTier[];
  lines: MoneyLine[];
  staff: StaffLine[];
  bar: BarPlan;
  scenarios: Scenario[];
  termsPlan: TermsPlan;
  files: EventFile[];
  updatedAt: string;
};

type DbEventRow = {
  id: string;
  owner_key: string;
  name: string;
  event_date: string | null;
  payload: PlannerEvent;
  updated_at: string;
};

type UiStudioSettings = {
  paper: string;
  ink: string;
  fontScale: number;
  typePreset: 'system' | 'rounded' | 'serif' | 'unbounded';
  headingSize: number;
  headingWeight: number;
  headingLineHeight: number;
  headingLetterSpacing: number;
  numberSize: number;
  numberWeight: number;
  numberLineHeight: number;
  numberLetterSpacing: number;
  labelSize: number;
  labelWeight: number;
  labelLineHeight: number;
  labelLetterSpacing: number;
  bodySize: number;
  bodyWeight: number;
  bodyLineHeight: number;
  bodyLetterSpacing: number;
};

const STORAGE_KEY = 'event-planner-calculator-v2';
const LEGACY_STORAGE_KEY = 'event-planner-calculator-v1';
const WORKSPACE_STORAGE_KEY = 'event-planner-workspace-v2';
const DEFAULT_WORKSPACE = 'main-workspace';
const UI_STUDIO_STORAGE_KEY = 'event-planner-ui-studio-v1';
const TYPE_PRESET_LABELS: Record<UiStudioSettings['typePreset'], string> = { system: 'System', rounded: 'Rounded', serif: 'Serif', unbounded: 'Unbounded' };

const fmt = new Intl.NumberFormat('da-DK', { maximumFractionDigits: 0 });
const pct = new Intl.NumberFormat('da-DK', { maximumFractionDigits: 1 });
const money = (value: number) => `${fmt.format(Math.round(value || 0))} DKK`;
const uid = () => (globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : `${Date.now()}-${Math.random()}`);
const numberOrZero = (value: string) => {
  const parsed = Number(value.replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : 0;
};
const safeSlug = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48) || DEFAULT_WORKSPACE;

function hexToRgb(hex: string) {
  const clean = hex.replace('#', '');
  const full = clean.length === 3 ? clean.split('').map((char) => char + char).join('') : clean;
  const int = parseInt(full, 16);
  return { r: (int >> 16) & 255, g: (int >> 8) & 255, b: int & 255 };
}

function rgbaFromHex(hex: string, alpha: number) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function defaultUiStudio(): UiStudioSettings {
  return {
    paper: '#efe9dc',
    ink: '#244cdd',
    fontScale: 1,
    typePreset: 'system',
    headingSize: 1,
    headingWeight: 900,
    headingLineHeight: 0.92,
    headingLetterSpacing: -0.055,
    numberSize: 1,
    numberWeight: 900,
    numberLineHeight: 0.95,
    numberLetterSpacing: -0.055,
    labelSize: 1,
    labelWeight: 700,
    labelLineHeight: 1.2,
    labelLetterSpacing: 0.16,
    bodySize: 1,
    bodyWeight: 400,
    bodyLineHeight: 1.38,
    bodyLetterSpacing: -0.01
  };
}

function fontStackForPreset(preset: UiStudioSettings['typePreset']) {
  if (preset === 'rounded') return '"SF Pro Rounded", "Avenir Next", ui-rounded, "Nunito Sans", system-ui, sans-serif';
  if (preset === 'serif') return 'Iowan Old Style, Georgia, ui-serif, serif';
  if (preset === 'unbounded') return 'Unbounded, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';
  return '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", Inter, system-ui, sans-serif';
}

function defaultBarPlan(): BarPlan {
  return {
    enabled: true,
    useTicketGuests: true,
    customGuests: 100,
    spendPerGuest: 200,
    costPercent: 30,
    notes: 'Example: every ticket holder spends 200 DKK at the bar.'
  };
}

function defaultTermsPlan(): TermsPlan {
  return {
    enabled: true,
    organizerTicketShare: 100,
    organizerBarProfitShare: 0,
    flatVenueHire: 0,
    minimumVenueGuarantee: 0,
    notes: 'Adjust this for door split, bar split, venue hire or guarantee deals.'
  };
}

function defaultScenarios(ticketSold = 100, ticketPrice = 150, barSpend = 200, expenses = 8000): Scenario[] {
  return [
    { id: uid(), name: 'Low', ticketsSold: Math.round(ticketSold * 0.6), averageTicketPrice: ticketPrice, barSpendPerGuest: Math.round(barSpend * 0.75), extraExpenses: expenses, notes: '' },
    { id: uid(), name: 'Expected', ticketsSold: ticketSold, averageTicketPrice: ticketPrice, barSpendPerGuest: barSpend, extraExpenses: expenses, notes: '' },
    { id: uid(), name: 'Best', ticketsSold: Math.round(ticketSold * 1.3), averageTicketPrice: ticketPrice, barSpendPerGuest: Math.round(barSpend * 1.25), extraExpenses: expenses, notes: '' }
  ];
}

function emptyEvent(template: TemplateKey = 'blank'): PlannerEvent {
  const now = new Date().toISOString();
  const base: PlannerEvent = {
    id: uid(),
    updatedAt: now,
    meta: {
      name: '',
      date: '',
      endDate: '',
      location: '',
      time: '',
      endTime: '',
      terms: '',
      notes: '',
      status: 'idea'
    },
    tickets: [
      { id: uid(), name: 'Standard ticket', price: 150, sold: 100, capacity: 120, notes: '' }
    ],
    lines: [],
    staff: [
      { id: uid(), role: 'Bartender', people: 2, hours: 7, hourlyWage: 165, extraPercent: 12.5, notes: '' }
    ],
    bar: defaultBarPlan(),
    scenarios: defaultScenarios(),
    termsPlan: defaultTermsPlan(),
    files: []
  };
  return applyTemplate(base, template);
}

function hydrateEvent(raw: Partial<PlannerEvent>): PlannerEvent {
  const fallback = emptyEvent();
  const sold = raw.tickets?.reduce((sum, ticket) => sum + (ticket.sold || 0), 0) || 100;
  const avgTicket = sold && raw.tickets?.length ? raw.tickets.reduce((sum, ticket) => sum + (ticket.sold || 0) * (ticket.price || 0), 0) / sold : 150;
  const event: PlannerEvent = {
    ...fallback,
    ...raw,
    meta: { ...fallback.meta, ...(raw.meta || {}) },
    tickets: raw.tickets?.length ? raw.tickets : fallback.tickets,
    lines: raw.lines || fallback.lines,
    staff: raw.staff?.length ? raw.staff : fallback.staff,
    bar: { ...fallback.bar, ...(raw.bar || {}) },
    termsPlan: { ...fallback.termsPlan, ...(raw.termsPlan || {}) },
    files: raw.files || fallback.files,
    scenarios: raw.scenarios?.length ? raw.scenarios : defaultScenarios(sold, Math.round(avgTicket), raw.bar?.spendPerGuest || 200, 8000)
  };
  return event;
}

type TemplateKey = 'blank' | 'concert' | 'quiz' | 'privateParty' | 'djNight' | 'football' | 'corporate';

const templates: { key: TemplateKey; label: string; description: string }[] = [
  { key: 'blank', label: 'Blank', description: 'Simple event with one ticket and staff row.' },
  { key: 'concert', label: 'Concert', description: 'Tickets, artist fee, sound and security.' },
  { key: 'quiz', label: 'Quiz night', description: 'Low ticket price, host fee and bar focus.' },
  { key: 'privateParty', label: 'Private party', description: 'Flat hire, staff and minimum bar spend.' },
  { key: 'djNight', label: 'DJ night', description: 'Door tickets, DJ, security and late staffing.' },
  { key: 'football', label: 'Football screening', description: 'Free or cheap entry, high bar estimate.' },
  { key: 'corporate', label: 'Corporate event', description: 'Package income, staffing and production.' }
];

function applyTemplate(event: PlannerEvent, template: TemplateKey): PlannerEvent {
  if (template === 'blank') return event;
  const makeLine = (kind: LineKind, name: string, amount: number, quantity = 1, mode: LineMode = 'fixed', notes = ''): MoneyLine => ({ id: uid(), kind, name, amount, quantity, mode, notes });
  const makeStaff = (role: string, people: number, hours: number, hourlyWage = 165, extraPercent = 12.5): StaffLine => ({ id: uid(), role, people, hours, hourlyWage, extraPercent, notes: '' });
  const next = { ...event, lines: [] as MoneyLine[], staff: [] as StaffLine[], tickets: [...event.tickets], bar: { ...event.bar }, termsPlan: { ...event.termsPlan } };
  if (template === 'concert') {
    next.meta.name = 'Concert forecast';
    next.tickets = [{ id: uid(), name: 'Presale', price: 120, sold: 80, capacity: 120, notes: '' }, { id: uid(), name: 'Door', price: 150, sold: 30, capacity: 60, notes: '' }];
    next.lines = [makeLine('expense', 'Artist fee', 6000), makeLine('expense', 'Sound / tech', 2500), makeLine('expense', 'Marketing', 1200), makeLine('expense', 'Security', 1800)];
    next.staff = [makeStaff('Bartender', 3, 8), makeStaff('Runner / floor', 1, 6)];
    next.bar.spendPerGuest = 180;
  }
  if (template === 'quiz') {
    next.meta.name = 'Quiz night forecast';
    next.tickets = [{ id: uid(), name: 'Quiz ticket', price: 50, sold: 70, capacity: 90, notes: '' }];
    next.lines = [makeLine('expense', 'Quiz host', 1500), makeLine('expense', 'Prizes', 700), makeLine('income', 'Table package', 250, 4, 'fixed')];
    next.staff = [makeStaff('Bartender', 2, 6)];
    next.bar.spendPerGuest = 220;
  }
  if (template === 'privateParty') {
    next.meta.name = 'Private party forecast';
    next.tickets = [{ id: uid(), name: 'Guest estimate', price: 0, sold: 80, capacity: 100, notes: 'Use sold as guest count.' }];
    next.lines = [makeLine('income', 'Venue hire', 7500), makeLine('expense', 'Cleaning', 900), makeLine('expense', 'Extra setup', 1200)];
    next.staff = [makeStaff('Bartender', 2, 7), makeStaff('Manager / host', 1, 5, 190)];
    next.bar.spendPerGuest = 250;
    next.termsPlan.flatVenueHire = 0;
  }
  if (template === 'djNight') {
    next.meta.name = 'DJ night forecast';
    next.tickets = [{ id: uid(), name: 'Door', price: 80, sold: 120, capacity: 160, notes: '' }];
    next.lines = [makeLine('expense', 'DJ fee', 3500), makeLine('expense', 'Security', 2400), makeLine('expense', 'Marketing', 1500)];
    next.staff = [makeStaff('Bartender', 4, 8), makeStaff('Door', 1, 7, 180)];
    next.bar.spendPerGuest = 230;
  }
  if (template === 'football') {
    next.meta.name = 'Football screening forecast';
    next.tickets = [{ id: uid(), name: 'Reservation / ticket', price: 30, sold: 100, capacity: 110, notes: '' }];
    next.lines = [makeLine('expense', 'Sport subscription / setup', 900), makeLine('expense', 'Extra screens / cable', 500)];
    next.staff = [makeStaff('Bartender', 3, 6)];
    next.bar.spendPerGuest = 260;
  }
  if (template === 'corporate') {
    next.meta.name = 'Corporate event forecast';
    next.tickets = [{ id: uid(), name: 'Guests', price: 0, sold: 60, capacity: 80, notes: 'Use sold as guest count.' }];
    next.lines = [makeLine('income', 'Event package', 450, 60, 'fixed'), makeLine('expense', 'Catering / snacks', 90, 60, 'fixed'), makeLine('expense', 'Production', 3500)];
    next.staff = [makeStaff('Bartender', 2, 6), makeStaff('Host', 1, 5, 190)];
    next.bar.spendPerGuest = 120;
    next.bar.costPercent = 35;
  }
  const totalSold = next.tickets.reduce((sum, ticket) => sum + ticket.sold, 0);
  const avgTicket = totalSold ? next.tickets.reduce((sum, ticket) => sum + ticket.sold * ticket.price, 0) / totalSold : 150;
  const expectedExpenses = next.lines.filter((line) => line.kind === 'expense').reduce((sum, line) => sum + line.amount * line.quantity, 0) + next.staff.reduce((sum, line) => sum + staffTotal(line), 0);
  next.scenarios = defaultScenarios(totalSold, Math.round(avgTicket), next.bar.spendPerGuest, expectedExpenses);
  return next;
}

function lineTotal(line: MoneyLine, ticketRevenue: number, totalSold: number) {
  if (line.mode === 'perTicketHolder') return line.amount * totalSold * line.quantity;
  if (line.mode === 'percentageOfTickets') return ticketRevenue * (line.amount / 100) * line.quantity;
  return line.amount * line.quantity;
}

function staffTotal(line: StaffLine) {
  return line.people * line.hours * line.hourlyWage * (1 + line.extraPercent / 100);
}

function getWorkspaceKey() {
  if (typeof window === 'undefined') return DEFAULT_WORKSPACE;
  const url = new URL(window.location.href);
  const fromUrl = url.searchParams.get('workspace');
  if (fromUrl) {
    const slug = safeSlug(fromUrl);
    localStorage.setItem(WORKSPACE_STORAGE_KEY, slug);
    return slug;
  }
  const stored = localStorage.getItem(WORKSPACE_STORAGE_KEY);
  if (stored) return stored;
  localStorage.setItem(WORKSPACE_STORAGE_KEY, DEFAULT_WORKSPACE);
  return DEFAULT_WORKSPACE;
}

export default function EventPlannerApp() {
  const [events, setEvents] = useState<PlannerEvent[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const [status, setStatus] = useState('Local draft');
  const [workspace, setWorkspace] = useState(DEFAULT_WORKSPACE);
  const [syncEnabled, setSyncEnabled] = useState(false);
  const [syncError, setSyncError] = useState('');
  const [showLibrary, setShowLibrary] = useState(false);
  const [libraryTab, setLibraryTab] = useState<'events' | 'templates'>('events');
  const [showSettings, setShowSettings] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [uiStudio, setUiStudio] = useState<UiStudioSettings>(defaultUiStudio());
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    forecast: true,
    details: false,
    scenarios: false,
    tickets: false,
    bar: false,
    staff: false,
    income: false,
    expenses: false,
    terms: false,
    files: false,
    notes: false,
    export: false
  });
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const key = getWorkspaceKey();
    setWorkspace(key);
    const starter = emptyEvent();
    const raw = localStorage.getItem(`${STORAGE_KEY}:${key}`) || localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as Partial<PlannerEvent>[];
        if (Array.isArray(parsed) && parsed.length) {
          const hydrated = parsed.map(hydrateEvent);
          setEvents(hydrated);
          setActiveId(hydrated[0].id);
          return;
        }
      } catch {}
    }
    setEvents([starter]);
    setActiveId(starter.id);
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem(UI_STUDIO_STORAGE_KEY);
    if (!stored) return;
    try {
      setUiStudio({ ...defaultUiStudio(), ...JSON.parse(stored) });
    } catch {}
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--paper', uiStudio.paper);
    root.style.setProperty('--ink', uiStudio.ink);
    root.style.setProperty('--ink-soft', rgbaFromHex(uiStudio.ink, 0.16));
    const inkRgb = hexToRgb(uiStudio.ink);
    root.style.setProperty('--ink-rgb', `${inkRgb.r} ${inkRgb.g} ${inkRgb.b}`);
    root.style.setProperty('--app-font', fontStackForPreset(uiStudio.typePreset));
    root.style.setProperty('--app-scale', String(uiStudio.fontScale));
    root.style.setProperty('--heading-size', String(uiStudio.headingSize));
    root.style.setProperty('--heading-weight', String(uiStudio.headingWeight));
    root.style.setProperty('--heading-line-height', String(uiStudio.headingLineHeight));
    root.style.setProperty('--heading-letter-spacing', `${uiStudio.headingLetterSpacing}em`);
    root.style.setProperty('--number-size', String(uiStudio.numberSize));
    root.style.setProperty('--number-weight', String(uiStudio.numberWeight));
    root.style.setProperty('--number-line-height', String(uiStudio.numberLineHeight));
    root.style.setProperty('--number-letter-spacing', `${uiStudio.numberLetterSpacing}em`);
    root.style.setProperty('--label-size', String(uiStudio.labelSize));
    root.style.setProperty('--label-weight', String(uiStudio.labelWeight));
    root.style.setProperty('--label-line-height', String(uiStudio.labelLineHeight));
    root.style.setProperty('--label-letter-spacing', `${uiStudio.labelLetterSpacing}em`);
    root.style.setProperty('--body-size', String(uiStudio.bodySize));
    root.style.setProperty('--body-weight', String(uiStudio.bodyWeight));
    root.style.setProperty('--body-line-height', String(uiStudio.bodyLineHeight));
    root.style.setProperty('--body-letter-spacing', `${uiStudio.bodyLetterSpacing}em`);
    root.style.fontSize = `${16 * uiStudio.fontScale}px`;
    localStorage.setItem(UI_STUDIO_STORAGE_KEY, JSON.stringify(uiStudio));
  }, [uiStudio]);

  async function loadFromSupabase(workspaceKey = workspace) {
    const client = getSupabaseClient();
    if (!client) {
      setStatus('Saved locally');
      setSyncError('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel.');
      return;
    }
    setSyncEnabled(true);
    setSyncError('');
    setStatus('Loading...');
    const { data, error } = await client
      .from('event_plans')
      .select('*')
      .eq('owner_key', workspaceKey)
      .order('updated_at', { ascending: false });
    if (error) {
      setStatus('Supabase error');
      setSyncError(error.message || 'Unknown Supabase load error.');
      return;
    }
    const remote = ((data || []) as DbEventRow[]).map((row) => hydrateEvent(row.payload)).filter(Boolean);
    if (remote.length) {
      setEvents(remote);
      setActiveId(remote[0].id);
      localStorage.setItem(`${STORAGE_KEY}:${workspaceKey}`, JSON.stringify(remote));
    }
    setStatus('Synced');
  }

  useEffect(() => {
    const key = getWorkspaceKey();
    void loadFromSupabase(key);
  }, []);

  useEffect(() => {
    if (!events.length) return;
    localStorage.setItem(`${STORAGE_KEY}:${workspace}`, JSON.stringify(events));
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => void saveToSupabase(events), 650);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [events, workspace]);

  async function saveToSupabase(nextEvents: PlannerEvent[]) {
    const client = getSupabaseClient();
    if (!client) {
      setStatus('Saved locally');
      setSyncError('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel.');
      return;
    }
    setSyncEnabled(true);
    setSyncError('');
    setStatus('Saving...');
    const rows = nextEvents.map((event) => ({
      id: event.id,
      owner_key: workspace,
      name: event.meta.name || 'Untitled event',
      event_date: event.meta.date || null,
      payload: event,
      updated_at: event.updatedAt
    }));
    const { error } = await client.from('event_plans').upsert(rows, { onConflict: 'id' });
    if (error) {
      setStatus('Local saved / Supabase error');
      setSyncError(error.message || 'Unknown Supabase save error.');
      return;
    }
    setSyncError('');
    setStatus('Synced');
  }

  async function deleteRemote(eventId: string) {
    const client = getSupabaseClient();
    if (!client) return;
    await client.from('event_plans').delete().eq('id', eventId).eq('owner_key', workspace);
  }

  const active = events.find((event) => event.id === activeId) || events[0];

  const totals = useMemo(() => calculateTotals(active), [active]);

  function patchActive(patch: Partial<PlannerEvent>) {
    if (!active) return;
    setEvents((current) => current.map((event) => event.id === active.id ? hydrateEvent({ ...event, ...patch, updatedAt: new Date().toISOString() }) : event));
  }

  function patchMeta(key: keyof EventMeta, value: string) {
    patchActive({ meta: { ...active.meta, [key]: value } });
  }

  function patchTicket(id: string, patch: Partial<TicketTier>) {
    patchActive({ tickets: active.tickets.map((ticket) => ticket.id === id ? { ...ticket, ...patch } : ticket) });
  }

  function patchLine(id: string, patch: Partial<MoneyLine>) {
    patchActive({ lines: active.lines.map((line) => line.id === id ? { ...line, ...patch } : line) });
  }

  function patchStaff(id: string, patch: Partial<StaffLine>) {
    patchActive({ staff: active.staff.map((line) => line.id === id ? { ...line, ...patch } : line) });
  }

  function patchScenario(id: string, patch: Partial<Scenario>) {
    patchActive({ scenarios: active.scenarios.map((scenario) => scenario.id === id ? { ...scenario, ...patch } : scenario) });
  }

  function createNewEvent(template: TemplateKey = 'blank') {
    const next = emptyEvent(template);
    next.meta.name = template === 'blank' ? `Event ${events.length + 1}` : next.meta.name;
    setEvents((current) => [next, ...current]);
    setActiveId(next.id);
    setShowLibrary(false);
  }

  function duplicateEvent() {
    if (!active) return;
    const copy: PlannerEvent = hydrateEvent({
      ...active,
      id: uid(),
      updatedAt: new Date().toISOString(),
      meta: { ...active.meta, name: `${active.meta.name || 'Event'} copy` },
      tickets: active.tickets.map((ticket) => ({ ...ticket, id: uid() })),
      lines: active.lines.map((line) => ({ ...line, id: uid() })),
      staff: active.staff.map((line) => ({ ...line, id: uid() })),
      scenarios: active.scenarios.map((scenario) => ({ ...scenario, id: uid() })),
      files: active.files.map((file) => ({ ...file, id: uid() }))
    });
    setEvents((current) => [copy, ...current]);
    setActiveId(copy.id);
  }

  function deleteActiveEvent() {
    if (!active) return;
    void deleteRemote(active.id);
    const remaining = events.filter((event) => event.id !== active.id);
    if (!remaining.length) {
      const fresh = emptyEvent();
      setEvents([fresh]);
      setActiveId(fresh.id);
      return;
    }
    setEvents(remaining);
    setActiveId(remaining[0].id);
  }

  function toggleSection(section: string) {
    setOpenSections((current) => ({ ...current, [section]: !current[section] }));
  }

  function setWorkspaceAndReload(nextWorkspace: string) {
    const slug = safeSlug(nextWorkspace);
    localStorage.setItem(WORKSPACE_STORAGE_KEY, slug);
    const url = new URL(window.location.href);
    url.searchParams.set('workspace', slug);
    window.location.href = url.toString();
  }

  async function addFilesToEvent(fileList: FileList | null) {
    if (!fileList?.length || !active) return;
    const loaded = await Promise.all(Array.from(fileList).map((file) => new Promise<EventFile>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve({
        id: uid(),
        name: file.name,
        originalName: file.name,
        mimeType: file.type || 'application/octet-stream',
        size: file.size,
        dataUrl: String(reader.result || ''),
        uploadedAt: new Date().toISOString()
      });
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    })));
    patchActive({ files: [...active.files, ...loaded] });
  }

  function patchFile(id: string, patch: Partial<EventFile>) {
    patchActive({ files: active.files.map((file) => file.id === id ? { ...file, ...patch } : file) });
  }

  function removeFile(id: string) {
    patchActive({ files: active.files.filter((file) => file.id !== id) });
  }

  function downloadFile(file: EventFile) {
    const a = document.createElement('a');
    a.href = file.dataUrl;
    a.download = file.name || file.originalName || 'event-file';
    a.click();
  }

  function openFile(file: EventFile) {
    const win = window.open();
    if (win) {
      win.document.write(`<iframe src="${file.dataUrl}" style="border:0;width:100vw;height:100vh"></iframe>`);
      win.document.title = file.name || file.originalName || 'Event file';
    } else {
      downloadFile(file);
    }
  }

  if (!active) return <main className="min-h-dvh bg-[var(--paper)]" />;

  const workspaceLink = typeof window === 'undefined' ? '' : `${window.location.origin}${window.location.pathname}?workspace=${workspace}`;

  return (
    <main className="no-callout min-h-dvh overflow-x-hidden bg-[var(--paper)] px-3 pb-[calc(var(--safe-bottom)+28px)] pt-[calc(var(--safe-top)+10px)] text-[var(--ink)]">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3">
        <header className="sticky top-[calc(var(--safe-top)+6px)] z-40 grid grid-cols-2 gap-2">
          <button
            onClick={() => { setLibraryTab('events'); setShowLibrary(true); }}
            className="passport-button top-nav-pill min-h-[46px] rounded-full px-2 text-center backdrop-blur"
          >
            <span className="block text-[8px] font-bold uppercase leading-none tracking-[.13em] opacity-65">Choose</span>
            <strong className="block text-[12.5px] font-black leading-[1.02] tracking-[-.035em]">Event</strong>
          </button>
          <button onClick={() => setShowSettings(true)} className="passport-button top-nav-pill min-h-[46px] rounded-full px-2 text-center backdrop-blur">
            <span className="block text-[8px] uppercase leading-none tracking-[.13em] opacity-65">Manage</span>
            <strong className="block text-[12.5px] font-black leading-[1.02] tracking-[-.035em]">Settings</strong>
          </button>
        </header>


        <Collapsible title="Forecast" subtitle="Live event overview" open={openSections.forecast} onToggle={() => toggleSection('forecast')} featured>
          <div className="forecast-top">
            <button onClick={() => toggleSection('forecast')} className="forecast-title-row forecast-title-button">
              <span className="forecast-title-text">Forecast {openSections.forecast ? '−' : '+'}</span>
              <span className="forecast-status-pill">{statusLabel(active.meta.status)}</span>
            </button>

            {openSections.forecast && (
              <>
                <div className="forecast-main-block">
                  <h2 className="forecast-event-name">{active.meta.name || 'Untitled event'}</h2>
                  <div className="forecast-meta-profit-row">
                    <div className="forecast-meta-grid">
                      <div className="forecast-meta-pill">
                        <span>Date</span>
                        <strong>{formatEventDateRange(active.meta) || 'Add date'}</strong>
                      </div>
                      <div className="forecast-meta-pill">
                        <span>Time</span>
                        <strong>{formatEventTimeRange(active.meta) || 'Add time'}</strong>
                      </div>
                      <div className="forecast-meta-pill forecast-meta-wide">
                        <span>Location</span>
                        <strong>{shortText(active.meta.location) || 'Add location'}</strong>
                      </div>
                    </div>
                    <div className="profit-orb">
                      <span className="profit-kicker">Projected profit</span>
                      <strong><MoneyValue value={totals.profit} /></strong>
                      <em className="profit-sub">after costs</em>
                    </div>
                  </div>
                </div>

                <div className="forecast-terms-card mt-1">
                  <p className="text-[10px] font-bold uppercase tracking-[.16em] opacity-70">Terms</p>
                  <p className="mt-1 text-sm leading-snug opacity-85">{active.meta.terms || 'No terms added yet.'}</p>
                </div>
              </>
            )}
          </div>
          {openSections.forecast && (
            <>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            <Stat label="Tickets sold" value={`${fmt.format(totals.totalSold)}${totals.capacity ? ` / ${fmt.format(totals.capacity)}` : ''}`} />
            <Stat label="Ticket revenue" value={money(totals.ticketRevenue)} />
            <Stat label="Bar profit" value={money(totals.barProfit)} />
            <Stat label="Total income" value={money(totals.income)} />
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2 md:grid-cols-4">
            <Stat label="Expenses" value={money(totals.expenses)} />
            <Stat label="Profit per guest" value={money(totals.perGuest)} />
            <Stat label="Break-even guests" value={fmt.format(totals.breakEvenGuests)} />
            <MarginFillCard margin={totals.margin} fillRate={totals.fillRate} />
          </div>
          <div className="mt-3 grid gap-2 md:grid-cols-3">
            <ForecastInfoCard title="Break-even helper" rows={[
              ['Guests', fmt.format(totals.breakEvenGuests)],
              ['Tickets', money(totals.breakEvenTicketPrice)],
              ['Avg. bar spend', money(totals.breakEvenBarSpend)]
            ]} />
            <ForecastInfoCard title="Organizer" rows={[
              ['Organizer net', money(totals.organizerNet)],
              ['Venue net', money(totals.venueNet)],
              ['Terms', active.termsPlan.enabled ? 'On' : 'Off']
            ]} />
            <ForecastInfoCard title="Bar" rows={[
              ['Revenue', money(totals.barRevenue)],
              ['Stock cost', money(totals.barCost)],
              ['Avg. spend', money(active.bar.spendPerGuest)]
            ]} />
          </div>
          <div className="mt-3 grid grid-cols-4 gap-2">
            <button onClick={() => toggleSection('details')} className="quick-pill">Details</button>
            <button onClick={() => toggleSection('tickets')} className="quick-pill">Tickets</button>
            <button onClick={() => toggleSection('bar')} className="quick-pill">Bar</button>
            <button onClick={() => setShowQuickAdd(true)} className="quick-pill">Quick add</button>
          </div>
            </>
          )}
        </Collapsible>

        <Collapsible title="Event details" subtitle="Edit event info, schedule, location and terms." open={openSections.details} onToggle={() => toggleSection('details')}>
          <div className="event-details-grid">
            <Field label="Event name" value={active.meta.name} onChange={(value) => patchMeta('name', value)} />

            <div className="event-schedule-card">
              <p className="section-mini-label">Schedule</p>
              <div className="event-schedule-grid">
                <Field label="Start date" type="date" value={active.meta.date} onChange={(value) => patchMeta('date', value)} />
                <Field label="End date" type="date" value={active.meta.endDate} onChange={(value) => patchMeta('endDate', value)} />
                <Field label="Start time" type="time" value={active.meta.time} onChange={(value) => patchMeta('time', value)} />
                <Field label="End time" type="time" value={active.meta.endTime} onChange={(value) => patchMeta('endTime', value)} />
              </div>
            </div>

            <Field label="Location" value={active.meta.location} onChange={(value) => patchMeta('location', value)} />

            <label className="grid gap-1">
              <span className="text-[10px] font-bold uppercase tracking-[.16em] opacity-70">Status</span>
              <select value={active.meta.status} onChange={(event) => patchMeta('status', event.target.value)} className="passport-input compact-input w-full px-3">
                <option value="idea">Idea</option>
                <option value="quoted">Quoted</option>
                <option value="confirmed">Confirmed</option>
                <option value="cancelled">Cancelled</option>
                <option value="completed">Completed</option>
              </select>
            </label>

            <AreaField label="Terms" value={active.meta.terms} onChange={(value) => patchMeta('terms', value)} placeholder="Door split, guarantee, venue terms, cancellation terms..." />
          </div>
        </Collapsible>

        <Collapsible title="Scenario mode" subtitle="Low / expected / best-case planning" open={openSections.scenarios} onToggle={() => toggleSection('scenarios')}>
          <div className="grid gap-3">
            {active.scenarios.map((scenario) => {
              const row = scenarioResult(scenario, active.bar.costPercent);
              return (
                <div key={scenario.id} className="rounded-soft border-[1.5px] border-[var(--ink)] p-3">
                  <div className="grid gap-2 md:grid-cols-[1.1fr_.7fr_.8fr_.8fr_.8fr_auto] md:items-end">
                    <Field label="Scenario" value={scenario.name} onChange={(value) => patchScenario(scenario.id, { name: value })} />
                    <StepperField label="Tickets" value={scenario.ticketsSold} onChange={(value) => patchScenario(scenario.id, { ticketsSold: value })} />
                    <NumberField label="Avg ticket" value={scenario.averageTicketPrice} onChange={(value) => patchScenario(scenario.id, { averageTicketPrice: value })} />
                    <NumberField label="Bar spend" value={scenario.barSpendPerGuest} onChange={(value) => patchScenario(scenario.id, { barSpendPerGuest: value })} />
                    <NumberField label="Expenses" value={scenario.extraExpenses} onChange={(value) => patchScenario(scenario.id, { extraExpenses: value })} />
                    <button onClick={() => patchActive({ scenarios: active.scenarios.filter((item) => item.id !== scenario.id) })} className="passport-button h-12 rounded-soft px-3 text-sm">Remove</button>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4">
                    <Stat label="Ticket revenue" value={money(row.ticketRevenue)} />
                    <Stat label="Bar profit" value={money(row.barProfit)} />
                    <Stat label="Profit" value={money(row.profit)} />
                    <Stat label="Per guest" value={money(row.perGuest)} />
                  </div>
                </div>
              );
            })}
            <button onClick={() => patchActive({ scenarios: [...active.scenarios, { id: uid(), name: 'New scenario', ticketsSold: totals.totalSold, averageTicketPrice: totals.averageTicketPrice, barSpendPerGuest: active.bar.spendPerGuest, extraExpenses: totals.expenses, notes: '' }] })} className="passport-button min-h-12 rounded-soft px-3 font-bold">+ Add scenario</button>
          </div>
        </Collapsible>

        <Collapsible title="Tickets" subtitle="Change price or sold amount to test revenue." open={openSections.tickets} onToggle={() => toggleSection('tickets')} action="Add ticket" onAction={() => patchActive({ tickets: [...active.tickets, { id: uid(), name: 'Ticket tier', price: 0, sold: 0, capacity: 0, notes: '' }] })}>
          <div className="grid gap-3">
            {active.tickets.map((ticket) => {
              const total = ticket.price * ticket.sold;
              return (
                <div key={ticket.id} className="rounded-soft border-[1.5px] border-[var(--ink)] p-3">
                  <div className="grid gap-2 md:grid-cols-[1.3fr_.8fr_.8fr_.8fr_auto] md:items-end">
                    <Field label="Name" value={ticket.name} onChange={(value) => patchTicket(ticket.id, { name: value })} />
                    <NumberField label="Ticket price" value={ticket.price} onChange={(value) => patchTicket(ticket.id, { price: value })} />
                    <StepperField label="Sold" value={ticket.sold} onChange={(value) => patchTicket(ticket.id, { sold: value })} />
                    <StepperField label="Capacity" value={ticket.capacity} onChange={(value) => patchTicket(ticket.id, { capacity: value })} />
                    <button onClick={() => patchActive({ tickets: active.tickets.filter((item) => item.id !== ticket.id) })} className="passport-button h-12 rounded-soft px-3 text-sm">Remove</button>
                  </div>
                  <div className="mt-3 grid gap-2 md:grid-cols-[1fr_auto] md:items-center">
                    <Field label="Notes" value={ticket.notes} onChange={(value) => patchTicket(ticket.id, { notes: value })} />
                    <div className="rounded-soft border-[1.5px] border-[var(--ink)] px-3 py-2 text-right">
                      <div className="text-xs uppercase tracking-[.14em] opacity-70">{money(ticket.price)} × {fmt.format(ticket.sold)}</div>
                      <MoneyValue value={total} className="text-2xl font-black tracking-[-.04em]" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Collapsible>

        <Collapsible title="Bar calculator" subtitle="Estimate bar revenue, stock cost and bar profit." open={openSections.bar} onToggle={() => toggleSection('bar')}>
          <div className="grid gap-3 md:grid-cols-[1fr_1fr]">
            <div className="rounded-soft border-[1.5px] border-[var(--ink)] p-3">
              <label className="mb-3 flex items-center justify-between gap-3 text-sm font-bold">
                Include bar calculator
                <input type="checkbox" checked={active.bar.enabled} onChange={(event) => patchActive({ bar: { ...active.bar, enabled: event.target.checked } })} className="h-6 w-6 accent-black" />
              </label>
              <div className="grid gap-2">
                <label className="flex items-center justify-between gap-3 text-sm font-bold">
                  Guests = tickets sold
                  <input type="checkbox" checked={active.bar.useTicketGuests} onChange={(event) => patchActive({ bar: { ...active.bar, useTicketGuests: event.target.checked } })} className="h-6 w-6 accent-black" />
                </label>
                {!active.bar.useTicketGuests && <StepperField label="Custom guests" value={active.bar.customGuests} onChange={(value) => patchActive({ bar: { ...active.bar, customGuests: value } })} />}
                <NumberField label="Average spend per guest" value={active.bar.spendPerGuest} onChange={(value) => patchActive({ bar: { ...active.bar, spendPerGuest: value } })} />
                <NumberField label="Stock cost %" value={active.bar.costPercent} onChange={(value) => patchActive({ bar: { ...active.bar, costPercent: value } })} />
                <AreaField label="Bar notes" value={active.bar.notes} onChange={(value) => patchActive({ bar: { ...active.bar, notes: value } })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Stat label="Bar guests" value={fmt.format(totals.barGuests)} />
              <Stat label="Gross bar" value={money(totals.barRevenue)} />
              <Stat label="Stock cost" value={money(totals.barCost)} />
              <Stat label="Bar profit" value={money(totals.barProfit)} />
            </div>
          </div>
        </Collapsible>

        <Collapsible title="Staff cost calculator" subtitle="Auto-calculate wage cost including extra percentage." open={openSections.staff} onToggle={() => toggleSection('staff')} action="Add staff" onAction={() => patchActive({ staff: [...active.staff, { id: uid(), role: 'Staff', people: 1, hours: 5, hourlyWage: 165, extraPercent: 12.5, notes: '' }] })}>
          <div className="grid gap-3">
            {active.staff.map((line) => (
              <div key={line.id} className="rounded-soft border-[1.5px] border-[var(--ink)] p-3">
                <div className="grid gap-2 md:grid-cols-[1.2fr_.6fr_.6fr_.8fr_.7fr_auto] md:items-end">
                  <Field label="Role" value={line.role} onChange={(value) => patchStaff(line.id, { role: value })} />
                  <StepperField label="People" value={line.people} onChange={(value) => patchStaff(line.id, { people: value })} />
                  <NumberField label="Hours" value={line.hours} onChange={(value) => patchStaff(line.id, { hours: value })} />
                  <NumberField label="Hourly wage" value={line.hourlyWage} onChange={(value) => patchStaff(line.id, { hourlyWage: value })} />
                  <NumberField label="Extra %" value={line.extraPercent} onChange={(value) => patchStaff(line.id, { extraPercent: value })} />
                  <button onClick={() => patchActive({ staff: active.staff.filter((item) => item.id !== line.id) })} className="passport-button h-12 rounded-soft px-3 text-sm">Remove</button>
                </div>
                <div className="mt-3 grid gap-2 md:grid-cols-[1fr_auto] md:items-center">
                  <Field label="Notes" value={line.notes} onChange={(value) => patchStaff(line.id, { notes: value })} />
                  <div className="rounded-soft border-[1.5px] border-[var(--ink)] px-3 py-2 text-right">
                    <div className="text-xs uppercase tracking-[.14em] opacity-70">Staff cost</div>
                    <MoneyValue value={staffTotal(line)} className="text-2xl font-black tracking-[-.04em]" />
                  </div>
                </div>
              </div>
            ))}
            <Stat label="Total staff cost" value={money(totals.staffCost)} />
          </div>
        </Collapsible>

        <Collapsible title="Income" subtitle="Add sponsorships, cloakroom, grants or other income." open={openSections.income} onToggle={() => toggleSection('income')} action="Add income" onAction={() => patchActive({ lines: [...active.lines, { id: uid(), kind: 'income', name: 'New income', amount: 0, quantity: 1, mode: 'fixed', notes: '' }] })}>
          <MoneyLines lines={active.lines.filter((line) => line.kind === 'income')} ticketRevenue={totals.ticketRevenue} totalSold={totals.totalSold} patchLine={patchLine} removeLine={(id) => patchActive({ lines: active.lines.filter((line) => line.id !== id) })} />
        </Collapsible>

        <Collapsible title="Expenses" subtitle="Add artist fees, venue, stock, marketing, security and production." open={openSections.expenses} onToggle={() => toggleSection('expenses')} action="Add expense" onAction={() => patchActive({ lines: [...active.lines, { id: uid(), kind: 'expense', name: 'New expense', amount: 0, quantity: 1, mode: 'fixed', notes: '' }] })}>
          <MoneyLines lines={active.lines.filter((line) => line.kind === 'expense')} ticketRevenue={totals.ticketRevenue} totalSold={totals.totalSold} patchLine={patchLine} removeLine={(id) => patchActive({ lines: active.lines.filter((line) => line.id !== id) })} />
        </Collapsible>

        <Collapsible title="Venue terms / profit split" subtitle="Calculate organizer and venue outcome." open={openSections.terms} onToggle={() => toggleSection('terms')}>
          <div className="grid gap-3 md:grid-cols-[1fr_1fr]">
            <div className="rounded-soft border-[1.5px] border-[var(--ink)] p-3">
              <label className="mb-3 flex items-center justify-between gap-3 text-sm font-bold">
                Use terms calculator
                <input type="checkbox" checked={active.termsPlan.enabled} onChange={(event) => patchActive({ termsPlan: { ...active.termsPlan, enabled: event.target.checked } })} className="h-6 w-6 accent-black" />
              </label>
              <div className="grid gap-2">
                <NumberField label="Organizer ticket share %" value={active.termsPlan.organizerTicketShare} onChange={(value) => patchActive({ termsPlan: { ...active.termsPlan, organizerTicketShare: value } })} />
                <NumberField label="Organizer bar profit share %" value={active.termsPlan.organizerBarProfitShare} onChange={(value) => patchActive({ termsPlan: { ...active.termsPlan, organizerBarProfitShare: value } })} />
                <NumberField label="Flat venue hire" value={active.termsPlan.flatVenueHire} onChange={(value) => patchActive({ termsPlan: { ...active.termsPlan, flatVenueHire: value } })} />
                <NumberField label="Minimum venue guarantee" value={active.termsPlan.minimumVenueGuarantee} onChange={(value) => patchActive({ termsPlan: { ...active.termsPlan, minimumVenueGuarantee: value } })} />
                <AreaField label="Terms notes" value={active.termsPlan.notes} onChange={(value) => patchActive({ termsPlan: { ...active.termsPlan, notes: value } })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Stat label="Organizer net" value={money(totals.organizerNet)} />
              <Stat label="Venue net" value={money(totals.venueNet)} />
              <Stat label="Flat hire" value={money(active.termsPlan.flatVenueHire)} />
              <Stat label="Guarantee top-up" value={money(totals.guaranteeTopUp)} />
            </div>
          </div>
        </Collapsible>

        <Collapsible title="Files" subtitle="Upload files to this event." open={openSections.files} onToggle={() => toggleSection('files')}>
          <div className="grid gap-3">
            <label className="file-drop-card">
              <span className="text-[10px] font-bold uppercase tracking-[.16em] opacity-70">Upload files</span>
              <strong className="mt-1 block text-2xl font-black tracking-[-.05em]">Add files</strong>
              <span className="mt-1 block text-sm opacity-70">Saved inside this event. Tap files to view or download.</span>
              <input type="file" multiple onChange={(event) => void addFilesToEvent(event.target.files)} className="sr-only" />
            </label>
            {!active.files.length && (
              <div className="rounded-soft border-[1.5px] border-dashed border-[var(--ink)] p-4 text-center text-sm opacity-70">No files uploaded yet.</div>
            )}
            <div className="grid gap-2">
              {active.files.map((file) => (
                <div key={file.id} className="rounded-soft border-[1.5px] border-[var(--ink)] p-3">
                  <div className="grid gap-2 md:grid-cols-[1fr_auto_auto] md:items-end">
                    <Field label="File name" value={file.name} onChange={(value) => patchFile(file.id, { name: value })} />
                    <button onClick={() => openFile(file)} className="passport-button min-h-12 rounded-soft px-3 font-bold">Open</button>
                    <button onClick={() => downloadFile(file)} className="passport-button min-h-12 rounded-soft px-3 font-bold">Download</button>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-3 text-xs opacity-70">
                    <span>{file.mimeType || 'file'} · {formatFileSize(file.size)}</span>
                    <button onClick={() => removeFile(file.id)} className="font-bold text-[var(--danger)]">Remove</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Collapsible>

        <Collapsible title="Planning notes" subtitle="Terms, assumptions and event notes." open={openSections.notes} onToggle={() => toggleSection('notes')}>
          <div className="grid gap-2 md:grid-cols-2">
            <AreaField label="Terms / deal" value={active.meta.terms} onChange={(value) => patchMeta('terms', value)} placeholder="Door split, guarantee, venue terms, cancellation terms..." />
            <AreaField label="Notes" value={active.meta.notes} onChange={(value) => patchMeta('notes', value)} placeholder="Operational notes, risk, staffing plan, supplier notes..." />
          </div>
        </Collapsible>

        <Collapsible title="Export summary" subtitle="Copy text or download CSV." open={openSections.export} onToggle={() => toggleSection('export')}>
          <div className="grid gap-2 md:grid-cols-2">
            <button onClick={() => void navigator.clipboard.writeText(buildTextSummary(active, totals, workspaceLink)).then(() => setStatus('Summary copied'))} className="passport-button min-h-12 rounded-soft px-3 font-bold">Copy event summary</button>
            <button onClick={() => downloadCsv(active, totals)} className="passport-button min-h-12 rounded-soft px-3 font-bold">Download CSV</button>
          </div>
          <pre className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap rounded-soft border-[1.5px] border-[var(--ink)] p-3 text-xs leading-relaxed">{buildTextSummary(active, totals, workspaceLink)}</pre>
        </Collapsible>
      </div>


      {showLibrary && (
        <Modal title="Event library" onClose={() => setShowLibrary(false)}>
          <div className="grid gap-3">
            <div className="passport-card rounded-full p-1">
              <div className="grid grid-cols-2 gap-1">
                <button onClick={() => setLibraryTab('events')} className={`rounded-full px-3 py-2 text-sm font-bold ${libraryTab === 'events' ? 'bg-[var(--ink)] text-[var(--paper)]' : ''}`}>Saved events</button>
                <button onClick={() => setLibraryTab('templates')} className={`rounded-full px-3 py-2 text-sm font-bold ${libraryTab === 'templates' ? 'bg-[var(--ink)] text-[var(--paper)]' : ''}`}>Templates</button>
              </div>
            </div>

            {libraryTab === 'events' ? (
              <>
                <button onClick={() => createNewEvent('blank')} className="passport-button min-h-12 rounded-soft px-3 font-bold">Add new event</button>
                <div className="grid gap-2">
                  {events.map((event) => (
                    <button key={event.id} onClick={() => { setActiveId(event.id); setShowLibrary(false); }} className={`passport-button rounded-soft p-3 text-left ${event.id === active.id ? 'bg-[var(--ink-soft)]' : ''}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-black text-lg tracking-[-.03em]">{event.meta.name || 'Untitled event'}</div>
                          <div className="text-sm opacity-75">{statusLabel(event.meta.status)} · {[formatEventSchedule(event.meta), event.meta.location].filter(Boolean).join(' · ') || 'No details yet'}</div>
                        </div>
                        <span className="rounded-full border border-[var(--ink)]/20 px-2 py-1 text-[10px] font-bold uppercase tracking-[.14em]">Open</span>
                      </div>
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={duplicateEvent} className="passport-button min-h-12 rounded-soft px-3 font-bold">Duplicate current</button>
                  <button onClick={deleteActiveEvent} className="passport-button-danger min-h-12 rounded-soft px-3 font-bold">Delete current</button>
                </div>
              </>
            ) : (
              <div className="grid gap-2 md:grid-cols-2">
                {templates.map((template) => (
                  <button key={template.key} onClick={() => createNewEvent(template.key)} className="passport-button rounded-soft p-3 text-left">
                    <strong className="text-base">{template.label}</strong><br /><span className="text-sm opacity-70">{template.description}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </Modal>
      )}


      {showQuickAdd && (
        <Modal title="Quick add" onClose={() => setShowQuickAdd(false)}>
          <div className="grid gap-3">
            <div className="rounded-soft border-[1.5px] border-[var(--ink)] p-3">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[.16em] opacity-70">Fast rows</p>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => { patchActive({ lines: [...active.lines, { id: uid(), kind: 'income', name: 'Income', amount: 0, quantity: 1, mode: 'fixed', notes: '' }] }); setShowQuickAdd(false); }} className="passport-button min-h-12 rounded-soft px-3 font-bold">+ Income</button>
                <button onClick={() => { patchActive({ lines: [...active.lines, { id: uid(), kind: 'expense', name: 'Expense', amount: 0, quantity: 1, mode: 'fixed', notes: '' }] }); setShowQuickAdd(false); }} className="passport-button min-h-12 rounded-soft px-3 font-bold">+ Expense</button>
                <button onClick={() => { patchActive({ tickets: [...active.tickets, { id: uid(), name: 'Ticket tier', price: 0, sold: 0, capacity: 0, notes: '' }] }); setShowQuickAdd(false); }} className="passport-button min-h-12 rounded-soft px-3 font-bold">+ Ticket</button>
                <button onClick={() => { patchActive({ staff: [...active.staff, { id: uid(), role: 'Staff', people: 1, hours: 5, hourlyWage: 165, extraPercent: 12.5, notes: '' }] }); setShowQuickAdd(false); }} className="passport-button min-h-12 rounded-soft px-3 font-bold">+ Staff</button>
              </div>
            </div>
            <div className="rounded-soft border-[1.5px] border-[var(--ink)] p-3">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[.16em] opacity-70">Common event expenses</p>
              <div className="grid gap-2">
                {[
                  ['DJ fee', 3500],
                  ['Security', 2000],
                  ['Marketing', 1000],
                  ['Cleaning', 800],
                  ['Sound / tech', 2500],
                  ['Door staff', 1500]
                ].map(([name, amount]) => (
                  <button key={name} onClick={() => { patchActive({ lines: [...active.lines, { id: uid(), kind: 'expense', name: String(name), amount: Number(amount), quantity: 1, mode: 'fixed', notes: '' }] }); setShowQuickAdd(false); }} className="passport-button min-h-11 rounded-soft px-3 text-left font-bold">
                    + {name} <span className="opacity-60">· {money(Number(amount))}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {showSettings && (
        <Modal title="Settings" onClose={() => setShowSettings(false)}>
          <div className="grid gap-3">
            <div className="grid gap-2 md:grid-cols-2">
              <button onClick={duplicateEvent} className="passport-button min-h-12 rounded-soft px-3 font-bold">Duplicate current</button>
              <button onClick={() => void loadFromSupabase()} className="passport-button min-h-12 rounded-soft px-3 font-bold">Reload sync</button>
            </div>

            <div className="rounded-soft border-[1.5px] border-[var(--ink)] p-3">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[.16em] opacity-70">Storage</p>
                  <p className="text-lg font-black tracking-[-.03em]">{syncEnabled ? 'Supabase sync' : 'Local only'}</p>
                </div>
                <span className="rounded-full border border-[var(--ink)]/25 px-3 py-1.5 text-xs font-bold">{status}</span>
              </div>
              <WorkspacePanel workspace={workspace} workspaceLink={workspaceLink} status={status} onReload={() => void loadFromSupabase()} onChangeWorkspace={setWorkspaceAndReload} />
              {syncError && (
                <div className="supabase-error-card mt-3">
                  <p className="text-[10px] font-bold uppercase tracking-[.16em]">Supabase error details</p>
                  <p className="mt-2 text-sm leading-relaxed">{syncError}</p>
                </div>
              )}
            </div>

            <div className="ui-studio-card">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="ui-label">UI studio</p>
                  <p className="ui-card-title">Color + type</p>
                </div>
                <button onClick={() => setUiStudio(defaultUiStudio())} className="passport-button min-h-10 rounded-full px-3 text-sm font-bold">Reset</button>
              </div>

              <div className="ui-control-grid">
                <ColorField label="Background" value={uiStudio.paper} onChange={(value) => setUiStudio((current) => ({ ...current, paper: value }))} />
                <ColorField label="Accent" value={uiStudio.ink} onChange={(value) => setUiStudio((current) => ({ ...current, ink: value }))} />

                <label className="grid gap-1">
                  <span className="ui-label">Type preset</span>
                  <select value={uiStudio.typePreset} onChange={(event) => setUiStudio((current) => ({ ...current, typePreset: event.target.value as UiStudioSettings['typePreset'] }))} className="passport-input min-h-12 w-full px-3">
                    <option value="system">System</option>
                    <option value="rounded">Rounded</option>
                    <option value="serif">Serif</option>
                    <option value="unbounded">Unbounded</option>
                  </select>
                </label>

                <TypeScaleControl
                  label="Global scale"
                  value={uiStudio.fontScale}
                  valueLabel={`${Math.round(uiStudio.fontScale * 100)}%`}
                  min={0.85}
                  max={1.25}
                  step={0.03}
                  onChange={(value) => setUiStudio((current) => ({ ...current, fontScale: value }))}
                />
              </div>

              <div className="ui-type-roles">
                <TypeRoleControl
                  title="Headings"
                  description="Section titles and main event titles"
                  size={uiStudio.headingSize}
                  weight={uiStudio.headingWeight}
                  lineHeight={uiStudio.headingLineHeight}
                  letterSpacing={uiStudio.headingLetterSpacing}
                  onSize={(value) => setUiStudio((current) => ({ ...current, headingSize: value }))}
                  onWeight={(value) => setUiStudio((current) => ({ ...current, headingWeight: value }))}
                  onLineHeight={(value) => setUiStudio((current) => ({ ...current, headingLineHeight: value }))}
                  onLetterSpacing={(value) => setUiStudio((current) => ({ ...current, headingLetterSpacing: value }))}
                />
                <TypeRoleControl
                  title="Numbers"
                  description="Forecast totals, prices and statistics"
                  size={uiStudio.numberSize}
                  weight={uiStudio.numberWeight}
                  lineHeight={uiStudio.numberLineHeight}
                  letterSpacing={uiStudio.numberLetterSpacing}
                  onSize={(value) => setUiStudio((current) => ({ ...current, numberSize: value }))}
                  onWeight={(value) => setUiStudio((current) => ({ ...current, numberWeight: value }))}
                  onLineHeight={(value) => setUiStudio((current) => ({ ...current, numberLineHeight: value }))}
                  onLetterSpacing={(value) => setUiStudio((current) => ({ ...current, numberLetterSpacing: value }))}
                />
                <TypeRoleControl
                  title="Labels"
                  description="Small uppercase labels"
                  size={uiStudio.labelSize}
                  weight={uiStudio.labelWeight}
                  lineHeight={uiStudio.labelLineHeight}
                  letterSpacing={uiStudio.labelLetterSpacing}
                  onSize={(value) => setUiStudio((current) => ({ ...current, labelSize: value }))}
                  onWeight={(value) => setUiStudio((current) => ({ ...current, labelWeight: value }))}
                  onLineHeight={(value) => setUiStudio((current) => ({ ...current, labelLineHeight: value }))}
                  onLetterSpacing={(value) => setUiStudio((current) => ({ ...current, labelLetterSpacing: value }))}
                />
                <TypeRoleControl
                  title="Body + buttons"
                  description="Paragraphs, inputs and button text"
                  size={uiStudio.bodySize}
                  weight={uiStudio.bodyWeight}
                  lineHeight={uiStudio.bodyLineHeight}
                  letterSpacing={uiStudio.bodyLetterSpacing}
                  onSize={(value) => setUiStudio((current) => ({ ...current, bodySize: value }))}
                  onWeight={(value) => setUiStudio((current) => ({ ...current, bodyWeight: value }))}
                  onLineHeight={(value) => setUiStudio((current) => ({ ...current, bodyLineHeight: value }))}
                  onLetterSpacing={(value) => setUiStudio((current) => ({ ...current, bodyLetterSpacing: value }))}
                />
              </div>

              <div className="studio-preview mt-3">
                <p className="studio-label">Preview</p>
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-[.15em] opacity-65">Labels</p>
                    <p className="text-2xl font-black tracking-[-.05em]">Forecast style</p>
                    <p className="mt-1 text-sm opacity-70">Body text preview</p>
                  </div>
                  <div className="text-right">
                    <MoneyValue value={26401} className="text-[1.7rem] font-black tracking-[-.05em]" />
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-soft border-[1.5px] border-[var(--ink)] p-3 text-sm leading-relaxed">
              <p className="text-[10px] font-bold uppercase tracking-[.16em] opacity-70">Notes</p>
              <p className="mt-2">Open the same workspace link on another phone or computer to edit the same events. Line modes still work the same: Fixed = amount × quantity, Per ticket holder = amount × tickets sold × quantity, Percentage = % of ticket revenue × quantity.</p>
            </div>
          </div>
        </Modal>
      )}
    </main>
  );
}

function calculateTotals(active?: PlannerEvent) {
  if (!active) {
    return { totalSold: 0, capacity: 0, ticketRevenue: 0, averageTicketPrice: 0, lineIncome: 0, lineExpenses: 0, staffCost: 0, barGuests: 0, barRevenue: 0, barCost: 0, barProfit: 0, income: 0, expenses: 0, profit: 0, perGuest: 0, breakEvenGuests: 0, breakEvenTicketPrice: 0, breakEvenBarSpend: 0, margin: 0, fillRate: 0, organizerNet: 0, venueNet: 0, guaranteeTopUp: 0 };
  }
  const totalSold = active.tickets.reduce((sum, ticket) => sum + ticket.sold, 0);
  const capacity = active.tickets.reduce((sum, ticket) => sum + ticket.capacity, 0);
  const ticketRevenue = active.tickets.reduce((sum, ticket) => sum + ticket.sold * ticket.price, 0);
  const averageTicketPrice = totalSold ? ticketRevenue / totalSold : 0;
  const lineIncome = active.lines.filter((line) => line.kind === 'income').reduce((sum, line) => sum + lineTotal(line, ticketRevenue, totalSold), 0);
  const lineExpenses = active.lines.filter((line) => line.kind === 'expense').reduce((sum, line) => sum + lineTotal(line, ticketRevenue, totalSold), 0);
  const staffCost = active.staff.reduce((sum, line) => sum + staffTotal(line), 0);
  const barGuests = active.bar.enabled ? (active.bar.useTicketGuests ? totalSold : active.bar.customGuests) : 0;
  const barRevenue = active.bar.enabled ? barGuests * active.bar.spendPerGuest : 0;
  const barCost = barRevenue * (active.bar.costPercent / 100);
  const barProfit = barRevenue - barCost;
  const income = ticketRevenue + lineIncome + barRevenue;
  const expenses = lineExpenses + staffCost + barCost;
  const profit = income - expenses;
  const perGuest = totalSold ? profit / totalSold : 0;
  const avgRevenuePerGuest = totalSold ? income / totalSold : averageTicketPrice + active.bar.spendPerGuest * (1 - active.bar.costPercent / 100);
  const breakEvenGuests = avgRevenuePerGuest > 0 ? Math.ceil(expenses / avgRevenuePerGuest) : 0;
  const breakEvenTicketPrice = totalSold ? Math.ceil(expenses / totalSold) : 0;
  const breakEvenBarSpend = totalSold ? Math.max(0, (expenses - ticketRevenue - lineIncome) / totalSold / Math.max(1 - active.bar.costPercent / 100, 0.01)) : 0;
  const margin = income ? Math.round((profit / income) * 100) : 0;
  const fillRate = capacity ? Math.round((totalSold / capacity) * 100) : 0;
  let organizerNet = profit;
  let venueNet = 0;
  let guaranteeTopUp = 0;
  if (active.termsPlan.enabled) {
    const ticketToOrganizer = ticketRevenue * (active.termsPlan.organizerTicketShare / 100);
    const ticketToVenue = ticketRevenue - ticketToOrganizer;
    const barProfitToOrganizer = barProfit * (active.termsPlan.organizerBarProfitShare / 100);
    const barProfitToVenue = barProfit - barProfitToOrganizer;
    const venueBeforeGuarantee = ticketToVenue + barProfitToVenue + active.termsPlan.flatVenueHire;
    guaranteeTopUp = Math.max(0, active.termsPlan.minimumVenueGuarantee - venueBeforeGuarantee);
    venueNet = venueBeforeGuarantee + guaranteeTopUp;
    organizerNet = ticketToOrganizer + lineIncome + barProfitToOrganizer - lineExpenses - staffCost - active.termsPlan.flatVenueHire - guaranteeTopUp;
  }
  return { totalSold, capacity, ticketRevenue, averageTicketPrice, lineIncome, lineExpenses, staffCost, barGuests, barRevenue, barCost, barProfit, income, expenses, profit, perGuest, breakEvenGuests, breakEvenTicketPrice, breakEvenBarSpend, margin, fillRate, organizerNet, venueNet, guaranteeTopUp };
}

function scenarioResult(scenario: Scenario, barCostPercent: number) {
  const ticketRevenue = scenario.ticketsSold * scenario.averageTicketPrice;
  const barRevenue = scenario.ticketsSold * scenario.barSpendPerGuest;
  const barProfit = barRevenue * (1 - barCostPercent / 100);
  const profit = ticketRevenue + barProfit - scenario.extraExpenses;
  const perGuest = scenario.ticketsSold ? profit / scenario.ticketsSold : 0;
  return { ticketRevenue, barRevenue, barProfit, profit, perGuest };
}

function shortText(value: string, max = 22) {
  if (!value) return '';
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

function compactDate(value: string) {
  if (!value) return '';
  const parts = value.split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}`;
  return value;
}

function formatEventDateRange(meta: EventMeta) {
  const startDate = compactDate(meta.date);
  const endDate = compactDate(meta.endDate);
  if (startDate && endDate && endDate !== startDate) return `${startDate} → ${endDate}`;
  return startDate || endDate || '';
}

function formatEventTimeRange(meta: EventMeta) {
  const startTime = meta.time;
  const endTime = meta.endTime;
  if (startTime && endTime) return `${startTime}–${endTime}`;
  return startTime || endTime || '';
}

function formatEventSchedule(meta: EventMeta) {
  const startDate = meta.date;
  const endDate = meta.endDate;
  const startTime = meta.time;
  const endTime = meta.endTime;

  const datePart = startDate && endDate && endDate !== startDate
    ? `${startDate} → ${endDate}`
    : startDate || endDate || '';

  const timePart = startTime && endTime
    ? `${startTime}–${endTime}`
    : startTime || endTime || '';

  return [datePart, timePart].filter(Boolean).join(' · ');
}

function statusLabel(status: EventStatus) {
  return ({ idea: 'Idea', quoted: 'Quoted', confirmed: 'Confirmed', cancelled: 'Cancelled', completed: 'Completed' } as Record<EventStatus, string>)[status] || 'Idea';
}

function MarginFillCard({ margin, fillRate }: { margin: number; fillRate: number }) {
  return (
    <div className="stat-card margin-fill-card">
      <div className="text-[10px] font-bold uppercase tracking-[.16em] opacity-70">Margin / Fill</div>
      <div className="margin-fill-values">
        <div className="margin-fill-item">
          <div className="margin-fill-number"><strong>{margin}</strong><span>%</span></div>
          <em>Margin</em>
        </div>
        <div className="margin-fill-item">
          <div className="margin-fill-number"><strong>{fillRate}</strong><span>%</span></div>
          <em>Fill</em>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  const isMoney = value.endsWith(' DKK');
  return (
    <div className="stat-card">
      <div className="text-[10px] font-bold uppercase tracking-[.16em] opacity-70">{label}</div>
      <div className="mt-1.5 truncate text-xl font-black tracking-[-.05em] md:text-2xl">{isMoney ? <MoneyString text={value} /> : value.includes('%') ? <PercentString text={value} /> : value}</div>
    </div>
  );
}

function MiniPanel({ title, lines }: { title: string; lines: string[] }) {
  return (
    <div className="mini-panel">
      <h3 className="font-black tracking-[-.03em]">{title}</h3>
      <div className="mt-2 space-y-1 text-sm opacity-75">
        {lines.map((line) => <p key={line}>{line}</p>)}
      </div>
    </div>
  );
}

function ForecastInfoCard({ title, rows }: { title: string; rows: [string, string][] }) {
  return (
    <div className="forecast-info-card">
      <h3>{title}</h3>
      <div className="mt-3 grid gap-2">
        {rows.map(([label, value]) => (
          <div key={label} className="forecast-info-row">
            <span>{label}</span>
            <strong>{value.endsWith(' DKK') ? <MoneyString text={value} /> : value}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

function PercentString({ text }: { text: string }) {
  return (
    <span className="percent-inline">
      {text.split('').map((char, index) => /[0-9]/.test(char) ? <span key={index} className="percent-number">{char}</span> : <span key={index} className="percent-light">{char}</span>)}
    </span>
  );
}

function formatFileSize(bytes: number) {
  if (!bytes) return '0 KB';
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function MoneyString({ text }: { text: string }) {
  const number = text.replace(/\s*DKK$/, '');
  return <span className="money-inline"><span className="money-number">{number}</span><span className="money-currency">DKK</span></span>;
}

function MoneyValue({ value, className = '' }: { value: number; className?: string }) {
  return <span className={`money-inline ${className}`.trim()}><span className="money-number">{fmt.format(Math.round(value || 0))}</span><span className="money-currency">DKK</span></span>;
}

function TypeScaleControl({ label, value, valueLabel, min, max, step, onChange }: { label: string; value: number; valueLabel: string; min: number; max: number; step: number; onChange: (value: number) => void }) {
  const change = (direction: number) => {
    const next = Number((value + direction * step).toFixed(2));
    onChange(Math.min(max, Math.max(min, next)));
  };
  return (
    <div className="grid gap-1">
      <span className="ui-label">{label}</span>
      <div className="ui-stepper">
        <button onClick={() => change(-1)} className="passport-button rounded-soft font-black">−</button>
        <div className="passport-input grid place-items-center px-3 font-black">{valueLabel}</div>
        <button onClick={() => change(1)} className="passport-button rounded-soft font-black">+</button>
      </div>
    </div>
  );
}

function TypeRoleControl({ title, description, size, weight, lineHeight, letterSpacing, onSize, onWeight, onLineHeight, onLetterSpacing }: { title: string; description: string; size: number; weight: number; lineHeight: number; letterSpacing: number; onSize: (value: number) => void; onWeight: (value: number) => void; onLineHeight: (value: number) => void; onLetterSpacing: (value: number) => void }) {
  return (
    <div className="type-role-card">
      <div>
        <h4>{title}</h4>
        <p>{description}</p>
      </div>
      <div className="grid gap-2">
        <TypeScaleControl
          label={`Size · ${Math.round(size * 100)}%`}
          value={size}
          valueLabel={`${Math.round(size * 100)}%`}
          min={0.75}
          max={1.35}
          step={0.05}
          onChange={onSize}
        />
        <div className="grid gap-1">
          <span className="ui-label">Weight · {weight}</span>
          <div className="ui-stepper">
            <button onClick={() => onWeight(Math.max(300, weight - 100))} className="passport-button rounded-soft font-black">−</button>
            <div className="passport-input grid place-items-center px-3 font-black">{weight}</div>
            <button onClick={() => onWeight(Math.min(950, weight + 100))} className="passport-button rounded-soft font-black">+</button>
          </div>
        </div>
        <TypeScaleControl
          label={`Line height · ${lineHeight.toFixed(2)}`}
          value={lineHeight}
          valueLabel={lineHeight.toFixed(2)}
          min={0.8}
          max={1.8}
          step={0.05}
          onChange={onLineHeight}
        />
        <TypeScaleControl
          label={`Letter spacing · ${letterSpacing.toFixed(2)}em`}
          value={letterSpacing}
          valueLabel={`${letterSpacing.toFixed(2)}em`}
          min={-0.1}
          max={0.3}
          step={0.01}
          onChange={onLetterSpacing}
        />
      </div>
    </div>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-1">
      <span className="text-[10px] font-bold uppercase tracking-[.16em] opacity-70">{label}</span>
      <div className="color-field passport-input min-h-12 px-3">
        <input type="color" value={value} onChange={(event) => onChange(event.target.value)} className="h-8 w-10 cursor-pointer border-0 bg-transparent p-0" />
        <input value={value} onChange={(event) => onChange(event.target.value)} className="w-full bg-transparent text-sm font-bold outline-none" />
      </div>
    </label>
  );
}

function Collapsible({ title, subtitle, open, onToggle, action, onAction, featured, children }: { title: string; subtitle?: string; open: boolean; onToggle: () => void; action?: string; onAction?: () => void; featured?: boolean; children: ReactNode }) {
  return (
    <section className={`passport-card rounded-passport ${featured ? 'p-4 md:p-5' : 'p-3 md:p-4'}`}>
      {!(featured && title === 'Forecast') && (
        <div className="flex items-center justify-between gap-3">
          <button onClick={onToggle} className="min-w-0 flex-1 text-left">
            <h2 className={`${featured ? 'text-[2.15rem]' : 'text-[1.75rem]'} font-black leading-none tracking-[-.055em]`}>{title} <span className="text-base align-middle opacity-70">{open ? '−' : '+'}</span></h2>
            {subtitle && <p className="mt-1 text-sm opacity-70">{subtitle}</p>}
          </button>
          {action && onAction && <button onClick={onAction} className="passport-button min-h-11 rounded-full px-4 text-sm font-bold">{action}</button>}
        </div>
      )}
      {(open || (featured && title === 'Forecast')) && <div className={featured && title === 'Forecast' ? '' : 'mt-3'}>{children}</div>}
    </section>
  );
}

function Field({ label, value, onChange, type = 'text', placeholder }: { label: string; value: string; onChange: (value: string) => void; type?: string; placeholder?: string }) {
  return (
    <label className="grid gap-1">
      <span className="text-[10px] font-bold uppercase tracking-[.16em] opacity-70">{label}</span>
      <input type={type} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} className="passport-input compact-input w-full px-3" />
    </label>
  );
}

function AreaField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }) {
  return (
    <label className="grid gap-1">
      <span className="text-[10px] font-bold uppercase tracking-[.16em] opacity-70">{label}</span>
      <textarea value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} rows={3} className="passport-input w-full resize-none px-3 py-2.5" />
    </label>
  );
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <label className="grid gap-1">
      <span className="text-[10px] font-bold uppercase tracking-[.16em] opacity-70">{label}</span>
      <input inputMode="decimal" value={String(value)} onChange={(event) => onChange(numberOrZero(event.target.value))} className="passport-input min-h-12 w-full px-3 text-right font-black" />
    </label>
  );
}

function StepperField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <div className="grid gap-1">
      <span className="text-[10px] font-bold uppercase tracking-[.16em] opacity-70">{label}</span>
      <div className="grid grid-cols-[42px_1fr_42px] gap-1">
        <button onClick={() => onChange(Math.max(0, value - 1))} className="passport-button min-h-12 rounded-soft font-black">−</button>
        <input inputMode="numeric" value={String(value)} onChange={(event) => onChange(Math.max(0, Math.round(numberOrZero(event.target.value))))} className="passport-input min-h-12 w-full px-2 text-center font-black" />
        <button onClick={() => onChange(value + 1)} className="passport-button min-h-12 rounded-soft font-black">+</button>
      </div>
    </div>
  );
}

function MoneyLines({ lines, ticketRevenue, totalSold, patchLine, removeLine }: { lines: MoneyLine[]; ticketRevenue: number; totalSold: number; patchLine: (id: string, patch: Partial<MoneyLine>) => void; removeLine: (id: string) => void }) {
  if (!lines.length) return <div className="rounded-soft border-[1.5px] border-dashed border-[var(--ink)] p-4 text-center text-sm opacity-70">No rows yet.</div>;
  return (
    <div className="grid gap-3">
      {lines.map((line) => {
        const total = lineTotal(line, ticketRevenue, totalSold);
        return (
          <div key={line.id} className="rounded-soft border-[1.5px] border-[var(--ink)] p-3">
            <div className="grid gap-2 md:grid-cols-[1.3fr_.8fr_.7fr_1fr_auto] md:items-end">
              <Field label="Name" value={line.name} onChange={(value) => patchLine(line.id, { name: value })} />
              <NumberField label={line.mode === 'percentageOfTickets' ? 'Percent' : 'Amount'} value={line.amount} onChange={(value) => patchLine(line.id, { amount: value })} />
              <StepperField label="Quantity" value={line.quantity} onChange={(value) => patchLine(line.id, { quantity: value })} />
              <label className="grid gap-1">
                <span className="text-[10px] font-bold uppercase tracking-[.16em] opacity-70">Mode</span>
                <select value={line.mode} onChange={(event) => patchLine(line.id, { mode: event.target.value as LineMode })} className="passport-input min-h-12 w-full px-3">
                  <option value="fixed">Fixed</option>
                  <option value="perTicketHolder">Per ticket holder</option>
                  <option value="percentageOfTickets">% of ticket revenue</option>
                </select>
              </label>
              <button onClick={() => removeLine(line.id)} className="passport-button h-12 rounded-soft px-3 text-sm">Remove</button>
            </div>
            <div className="mt-3 grid gap-2 md:grid-cols-[1fr_auto] md:items-center">
              <Field label="Notes" value={line.notes} onChange={(value) => patchLine(line.id, { notes: value })} />
              <div className="rounded-soft border-[1.5px] border-[var(--ink)] px-3 py-2 text-right">
                <div className="text-xs uppercase tracking-[.14em] opacity-70">Row total</div>
                <MoneyValue value={total} className="text-2xl font-black tracking-[-.04em]" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function WorkspacePanel({ workspace, workspaceLink, status, onReload, onChangeWorkspace }: { workspace: string; workspaceLink: string; status: string; onReload: () => void; onChangeWorkspace: (workspace: string) => void }) {
  const [draft, setDraft] = useState(workspace);
  return (
    <div className="grid gap-3 text-sm">
      <div className="rounded-soft border-[1.5px] border-[var(--ink)] p-3">
        <p className="text-xs font-bold uppercase tracking-[.16em] opacity-70">Current workspace</p>
        <p className="mt-1 text-xl font-black">{workspace}</p>
        <p className="mt-2 opacity-75">Use this link on another device to see and edit the same events.</p>
      </div>
      <label className="grid gap-1"><span className="text-[10px] font-bold uppercase tracking-[.16em] opacity-70">Share link</span><div className="passport-input min-h-12 w-full break-all px-3 py-3 text-sm">{workspaceLink}</div></label>
      <div className="grid grid-cols-2 gap-2">
        <button onClick={() => void navigator.clipboard.writeText(workspaceLink)} className="passport-button min-h-12 rounded-soft px-3 font-bold">Copy link</button>
        <button onClick={onReload} className="passport-button min-h-12 rounded-soft px-3 font-bold">Reload sync</button>
      </div>
      <div className="rounded-soft border-[1.5px] border-[var(--ink)] p-3">
        <Field label="Change workspace" value={draft} onChange={setDraft} />
        <button onClick={() => onChangeWorkspace(draft)} className="passport-button mt-2 min-h-12 w-full rounded-soft px-3 font-bold">Open workspace</button>
      </div>
      <p className="opacity-75">Sync status: {status}</p>
    </div>
  );
}

function Modal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-[var(--paper)] p-3 pt-[calc(var(--safe-top)+58px)]" onMouseDown={onClose}>
      <div className="passport-card mx-auto max-h-[82dvh] w-full max-w-2xl overflow-auto rounded-passport p-4 scrollbar-none" onMouseDown={(event) => event.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-3xl font-black tracking-[-.05em]">{title}</h2>
          <button onClick={onClose} className="passport-button h-11 w-11 rounded-full font-black">×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function buildTextSummary(active: PlannerEvent, totals: ReturnType<typeof calculateTotals>, workspaceLink: string) {
  return [
    `${active.meta.name || 'Untitled event'} — ${statusLabel(active.meta.status)}`,
    [active.meta.date, active.meta.time, active.meta.location].filter(Boolean).join(' · '),
    '',
    `Workspace: ${workspaceLink}`,
    '',
    `Tickets sold: ${fmt.format(totals.totalSold)} / ${fmt.format(totals.capacity)}`,
    `Ticket revenue: ${money(totals.ticketRevenue)}`,
    `Bar revenue: ${money(totals.barRevenue)}`,
    `Bar cost: ${money(totals.barCost)}`,
    `Bar profit: ${money(totals.barProfit)}`,
    `Other income: ${money(totals.lineIncome)}`,
    `Staff cost: ${money(totals.staffCost)}`,
    `Other expenses: ${money(totals.lineExpenses)}`,
    `Total income: ${money(totals.income)}`,
    `Total expenses: ${money(totals.expenses)}`,
    `Profit: ${money(totals.profit)}`,
    `Profit per guest: ${money(totals.perGuest)}`,
    `Break-even guests: ${fmt.format(totals.breakEvenGuests)}`,
    '',
    `Organizer net: ${money(totals.organizerNet)}`,
    `Venue net: ${money(totals.venueNet)}`,
    '',
    active.meta.terms ? `Terms: ${active.meta.terms}` : '',
    active.meta.notes ? `Notes: ${active.meta.notes}` : ''
  ].filter((line) => line !== undefined).join('\n');
}

function downloadCsv(active: PlannerEvent, totals: ReturnType<typeof calculateTotals>) {
  const rows = [
    ['Section', 'Name', 'Amount', 'Quantity', 'Total', 'Notes'],
    ['Summary', 'Ticket revenue', '', '', String(Math.round(totals.ticketRevenue)), ''],
    ['Summary', 'Bar revenue', '', '', String(Math.round(totals.barRevenue)), ''],
    ['Summary', 'Bar cost', '', '', String(Math.round(totals.barCost)), ''],
    ['Summary', 'Staff cost', '', '', String(Math.round(totals.staffCost)), ''],
    ['Summary', 'Profit', '', '', String(Math.round(totals.profit)), ''],
    ...active.tickets.map((ticket) => ['Ticket', ticket.name, String(ticket.price), String(ticket.sold), String(Math.round(ticket.price * ticket.sold)), ticket.notes]),
    ...active.staff.map((line) => ['Staff', line.role, String(line.hourlyWage), `${line.people} people × ${line.hours} hours`, String(Math.round(staffTotal(line))), line.notes]),
    ...active.lines.map((line) => [line.kind, line.name, String(line.amount), String(line.quantity), String(Math.round(lineTotal(line, totals.ticketRevenue, totals.totalSold))), line.notes])
  ];
  const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${safeSlug(active.meta.name || 'event')}-summary.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
