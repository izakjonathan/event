'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabaseClient';

type EventMeta = {
  name: string;
  date: string;
  location: string;
  time: string;
  terms: string;
  notes: string;
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

type PlannerEvent = {
  id: string;
  meta: EventMeta;
  tickets: TicketTier[];
  lines: MoneyLine[];
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

const STORAGE_KEY = 'event-planner-calculator-v1';
const OWNER_KEY = 'event-planner-owner-key-v1';

const fmt = new Intl.NumberFormat('da-DK', { maximumFractionDigits: 0 });
const money = (value: number) => `${fmt.format(Math.round(value || 0))} DKK`;
const uid = () => (globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : `${Date.now()}-${Math.random()}`);
const numberOrZero = (value: string) => {
  const normalised = value.replace(',', '.');
  const parsed = Number(normalised);
  return Number.isFinite(parsed) ? parsed : 0;
};

function emptyEvent(): PlannerEvent {
  const now = new Date().toISOString();
  return {
    id: uid(),
    updatedAt: now,
    meta: {
      name: 'New event',
      date: '',
      location: '',
      time: '',
      terms: '',
      notes: ''
    },
    tickets: [
      { id: uid(), name: 'Standard ticket', price: 150, sold: 100, capacity: 120, notes: '' }
    ],
    lines: [
      { id: uid(), kind: 'income', name: 'Bar spend per ticket holder', amount: 200, quantity: 1, mode: 'perTicketHolder', notes: 'Example: every ticket holder spends 200 DKK at the bar.' },
      { id: uid(), kind: 'expense', name: 'Staff', amount: 165, quantity: 20, mode: 'fixed', notes: 'Hourly wage × hours.' },
      { id: uid(), kind: 'expense', name: 'Venue / production', amount: 5000, quantity: 1, mode: 'fixed', notes: '' }
    ]
  };
}

function getOwnerKey() {
  if (typeof window === 'undefined') return '';
  const existing = localStorage.getItem(OWNER_KEY);
  if (existing) return existing;
  const next = uid();
  localStorage.setItem(OWNER_KEY, next);
  return next;
}

function lineTotal(line: MoneyLine, ticketRevenue: number, totalSold: number) {
  if (line.mode === 'perTicketHolder') return line.amount * totalSold * line.quantity;
  if (line.mode === 'percentageOfTickets') return ticketRevenue * (line.amount / 100) * line.quantity;
  return line.amount * line.quantity;
}

export default function EventPlannerApp() {
  const [events, setEvents] = useState<PlannerEvent[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const [status, setStatus] = useState('Local draft');
  const [syncEnabled, setSyncEnabled] = useState(false);
  const [showEvents, setShowEvents] = useState(false);
  const [showMeta, setShowMeta] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const starter = emptyEvent();
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as PlannerEvent[];
        if (Array.isArray(parsed) && parsed.length) {
          setEvents(parsed);
          setActiveId(parsed[0].id);
          return;
        }
      } catch {}
    }
    setEvents([starter]);
    setActiveId(starter.id);
  }, []);

  useEffect(() => {
    const client = getSupabaseClient();
    if (!client) return;
    setSyncEnabled(true);
    const ownerKey = getOwnerKey();
    client
      .from('event_plans')
      .select('*')
      .eq('owner_key', ownerKey)
      .order('updated_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          setStatus('Supabase not connected');
          return;
        }
        const remote = ((data || []) as DbEventRow[]).map((row) => row.payload).filter(Boolean);
        if (remote.length) {
          setEvents(remote);
          setActiveId(remote[0].id);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(remote));
          setStatus('Synced');
        }
      });
  }, []);

  useEffect(() => {
    if (!events.length) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => void saveToSupabase(events), 650);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [events]);

  async function saveToSupabase(nextEvents: PlannerEvent[]) {
    const client = getSupabaseClient();
    if (!client) {
      setStatus('Saved locally');
      return;
    }
    const ownerKey = getOwnerKey();
    setStatus('Saving...');
    const rows = nextEvents.map((event) => ({
      id: event.id,
      owner_key: ownerKey,
      name: event.meta.name || 'Untitled event',
      event_date: event.meta.date || null,
      payload: event,
      updated_at: event.updatedAt
    }));
    const { error } = await client.from('event_plans').upsert(rows, { onConflict: 'id' });
    setStatus(error ? 'Local saved / Supabase error' : 'Synced');
  }

  const active = events.find((event) => event.id === activeId) || events[0];

  const totals = useMemo(() => {
    if (!active) {
      return { totalSold: 0, capacity: 0, ticketRevenue: 0, income: 0, expenses: 0, profit: 0, perGuest: 0 };
    }
    const totalSold = active.tickets.reduce((sum, ticket) => sum + ticket.sold, 0);
    const capacity = active.tickets.reduce((sum, ticket) => sum + ticket.capacity, 0);
    const ticketRevenue = active.tickets.reduce((sum, ticket) => sum + ticket.sold * ticket.price, 0);
    const incomeLines = active.lines.filter((line) => line.kind === 'income').reduce((sum, line) => sum + lineTotal(line, ticketRevenue, totalSold), 0);
    const expenseLines = active.lines.filter((line) => line.kind === 'expense').reduce((sum, line) => sum + lineTotal(line, ticketRevenue, totalSold), 0);
    const income = ticketRevenue + incomeLines;
    const profit = income - expenseLines;
    return {
      totalSold,
      capacity,
      ticketRevenue,
      income,
      expenses: expenseLines,
      profit,
      perGuest: totalSold ? profit / totalSold : 0
    };
  }, [active]);

  function patchActive(patch: Partial<PlannerEvent>) {
    if (!active) return;
    setEvents((current) => current.map((event) => event.id === active.id ? { ...event, ...patch, updatedAt: new Date().toISOString() } : event));
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

  function createNewEvent() {
    const next = emptyEvent();
    next.meta.name = `Event ${events.length + 1}`;
    setEvents((current) => [next, ...current]);
    setActiveId(next.id);
    setShowEvents(false);
    setShowMeta(true);
  }

  function duplicateEvent() {
    if (!active) return;
    const copy: PlannerEvent = {
      ...active,
      id: uid(),
      updatedAt: new Date().toISOString(),
      meta: { ...active.meta, name: `${active.meta.name || 'Event'} copy` },
      tickets: active.tickets.map((ticket) => ({ ...ticket, id: uid() })),
      lines: active.lines.map((line) => ({ ...line, id: uid() }))
    };
    setEvents((current) => [copy, ...current]);
    setActiveId(copy.id);
  }

  function deleteActiveEvent() {
    if (!active) return;
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

  if (!active) return <main className="min-h-dvh bg-[var(--paper)]" />;

  return (
    <main className="no-callout min-h-dvh overflow-x-hidden bg-[var(--paper)] px-3 pb-[calc(var(--safe-bottom)+28px)] pt-[calc(var(--safe-top)+10px)] text-[var(--ink)]">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-3">
        <header className="grid grid-cols-2 gap-2 md:grid-cols-[1fr_auto_auto]">
          <button onClick={() => setShowEvents(true)} className="passport-button min-h-12 rounded-full px-4 text-left text-xs uppercase tracking-[.16em]">
            Events<br /><strong className="text-base normal-case tracking-normal">{active.meta.name || 'Untitled'}</strong>
          </button>
          <button onClick={() => setShowMeta(true)} className="passport-button min-h-12 rounded-full px-4 text-xs uppercase tracking-[.16em]">
            Details<br /><strong className="text-base normal-case tracking-normal">Edit event</strong>
          </button>
          <button onClick={() => setShowHelp(true)} className="passport-button col-span-2 min-h-12 rounded-full px-4 text-xs uppercase tracking-[.16em] md:col-span-1">
            {syncEnabled ? 'Supabase' : 'Storage'}<br /><strong className="text-base normal-case tracking-normal">{status}</strong>
          </button>
        </header>

        <section className="passport-card rounded-passport p-3 md:p-4">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[.18em] opacity-70">Event forecast</p>
              <h1 className="text-3xl font-black leading-none tracking-[-.04em] md:text-5xl">{active.meta.name || 'Untitled event'}</h1>
              <p className="mt-2 text-sm opacity-75">{[active.meta.date, active.meta.time, active.meta.location].filter(Boolean).join(' · ') || 'Add date, time and location'}</p>
            </div>
            <div className="rounded-full border-[1.5px] border-[var(--ink)] px-3 py-2 text-right text-xs uppercase tracking-[.12em]">
              Profit<br /><strong className="text-lg tracking-normal">{money(totals.profit)}</strong>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            <Stat label="Tickets sold" value={`${fmt.format(totals.totalSold)}${totals.capacity ? ` / ${fmt.format(totals.capacity)}` : ''}`} />
            <Stat label="Ticket revenue" value={money(totals.ticketRevenue)} />
            <Stat label="Total income" value={money(totals.income)} />
            <Stat label="Expenses" value={money(totals.expenses)} />
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2 md:grid-cols-4">
            <Stat label="Profit per guest" value={money(totals.perGuest)} />
            <Stat label="Break-even guests" value={totals.totalSold ? fmt.format(Math.ceil(totals.expenses / Math.max(totals.income / totals.totalSold, 1))) : '0'} />
            <Stat label="Margin" value={`${totals.income ? Math.round((totals.profit / totals.income) * 100) : 0}%`} />
            <Stat label="Fill rate" value={`${totals.capacity ? Math.round((totals.totalSold / totals.capacity) * 100) : 0}%`} />
          </div>
        </section>

        <section className="passport-card rounded-passport p-3 md:p-4">
          <SectionTop title="Tickets" subtitle="Change price or sold amount to test scenarios." action="Add ticket" onAction={() => patchActive({ tickets: [...active.tickets, { id: uid(), name: 'Ticket tier', price: 0, sold: 0, capacity: 0, notes: '' }] })} />
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
                      <div className="text-2xl font-black tracking-[-.04em]">{money(total)}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="passport-card rounded-passport p-3 md:p-4">
          <SectionTop title="Income" subtitle="Add bar spend, sponsorships, cloakroom, grants or other income." action="Add income" onAction={() => patchActive({ lines: [...active.lines, { id: uid(), kind: 'income', name: 'New income', amount: 0, quantity: 1, mode: 'fixed', notes: '' }] })} />
          <MoneyLines kind="income" lines={active.lines.filter((line) => line.kind === 'income')} ticketRevenue={totals.ticketRevenue} totalSold={totals.totalSold} patchLine={patchLine} removeLine={(id) => patchActive({ lines: active.lines.filter((line) => line.id !== id) })} />
        </section>

        <section className="passport-card rounded-passport p-3 md:p-4">
          <SectionTop title="Expenses" subtitle="Add staff, artist fees, venue, stock, marketing, security and production." action="Add expense" onAction={() => patchActive({ lines: [...active.lines, { id: uid(), kind: 'expense', name: 'New expense', amount: 0, quantity: 1, mode: 'fixed', notes: '' }] })} />
          <MoneyLines kind="expense" lines={active.lines.filter((line) => line.kind === 'expense')} ticketRevenue={totals.ticketRevenue} totalSold={totals.totalSold} patchLine={patchLine} removeLine={(id) => patchActive({ lines: active.lines.filter((line) => line.id !== id) })} />
        </section>

        <section className="passport-card rounded-passport p-3 md:p-4">
          <SectionTop title="Planning notes" subtitle="Terms, assumptions and event notes." />
          <div className="grid gap-2 md:grid-cols-2">
            <AreaField label="Terms / deal" value={active.meta.terms} onChange={(value) => patchMeta('terms', value)} placeholder="Door split, guarantee, venue terms, cancellation terms..." />
            <AreaField label="Notes" value={active.meta.notes} onChange={(value) => patchMeta('notes', value)} placeholder="Operational notes, risk, staffing plan, supplier notes..." />
          </div>
        </section>
      </div>

      {showEvents && (
        <Modal title="Events" onClose={() => setShowEvents(false)}>
          <div className="grid gap-2">
            <button onClick={createNewEvent} className="passport-button min-h-12 rounded-soft px-3 font-bold">+ Create new event</button>
            {events.map((event) => (
              <button key={event.id} onClick={() => { setActiveId(event.id); setShowEvents(false); }} className={`passport-button rounded-soft p-3 text-left ${event.id === active.id ? 'bg-[var(--ink-soft)]' : ''}`}>
                <div className="font-black">{event.meta.name || 'Untitled event'}</div>
                <div className="text-sm opacity-75">{[event.meta.date, event.meta.location].filter(Boolean).join(' · ') || 'No details yet'}</div>
              </button>
            ))}
            <div className="grid grid-cols-2 gap-2">
              <button onClick={duplicateEvent} className="passport-button min-h-12 rounded-soft px-3">Duplicate current</button>
              <button onClick={deleteActiveEvent} className="passport-button min-h-12 rounded-soft px-3">Delete current</button>
            </div>
          </div>
        </Modal>
      )}

      {showMeta && (
        <Modal title="Event details" onClose={() => setShowMeta(false)}>
          <div className="grid gap-2">
            <Field label="Name" value={active.meta.name} onChange={(value) => patchMeta('name', value)} />
            <div className="grid grid-cols-2 gap-2">
              <Field label="Date" type="date" value={active.meta.date} onChange={(value) => patchMeta('date', value)} />
              <Field label="Time" type="time" value={active.meta.time} onChange={(value) => patchMeta('time', value)} />
            </div>
            <Field label="Location" value={active.meta.location} onChange={(value) => patchMeta('location', value)} />
            <AreaField label="Terms" value={active.meta.terms} onChange={(value) => patchMeta('terms', value)} />
            <button onClick={() => setShowMeta(false)} className="passport-button mt-2 min-h-12 rounded-soft px-3 font-bold">Done</button>
          </div>
        </Modal>
      )}

      {showHelp && (
        <Modal title="Setup notes" onClose={() => setShowHelp(false)}>
          <div className="space-y-3 text-sm leading-relaxed">
            <p>This works immediately with local browser saving. Add Supabase env variables on Vercel and run the included SQL schema to enable cloud persistence.</p>
            <p><strong>Line modes:</strong> Fixed = amount × quantity. Per ticket holder = amount × tickets sold × quantity. Percentage = amount as % of ticket revenue × quantity.</p>
            <p><strong>Example:</strong> “all ticket holders use 200 DKK in the bar” should be an income line with amount 200 and mode “Per ticket holder”.</p>
          </div>
        </Modal>
      )}
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-soft border-[1.5px] border-[var(--ink)] p-3">
      <div className="text-[10px] font-bold uppercase tracking-[.16em] opacity-70">{label}</div>
      <div className="mt-1 truncate text-xl font-black tracking-[-.04em] md:text-2xl">{value}</div>
    </div>
  );
}

function SectionTop({ title, subtitle, action, onAction }: { title: string; subtitle?: string; action?: string; onAction?: () => void }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <div>
        <h2 className="text-2xl font-black leading-none tracking-[-.04em]">{title}</h2>
        {subtitle && <p className="mt-1 text-sm opacity-70">{subtitle}</p>}
      </div>
      {action && onAction && <button onClick={onAction} className="passport-button min-h-11 rounded-full px-4 text-sm font-bold">{action}</button>}
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', placeholder }: { label: string; value: string; onChange: (value: string) => void; type?: string; placeholder?: string }) {
  return (
    <label className="grid gap-1">
      <span className="text-[10px] font-bold uppercase tracking-[.16em] opacity-70">{label}</span>
      <input type={type} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} className="passport-input min-h-12 w-full px-3" />
    </label>
  );
}

function AreaField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }) {
  return (
    <label className="grid gap-1">
      <span className="text-[10px] font-bold uppercase tracking-[.16em] opacity-70">{label}</span>
      <textarea value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} rows={4} className="passport-input w-full resize-none px-3 py-3" />
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

function MoneyLines({ lines, ticketRevenue, totalSold, patchLine, removeLine }: { kind: LineKind; lines: MoneyLine[]; ticketRevenue: number; totalSold: number; patchLine: (id: string, patch: Partial<MoneyLine>) => void; removeLine: (id: string) => void }) {
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
                <div className="text-2xl font-black tracking-[-.04em]">{money(total)}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-[rgba(239,233,220,.78)] p-3 pt-[calc(var(--safe-top)+58px)]" onMouseDown={onClose}>
      <div className="passport-card mx-auto max-h-[82dvh] w-full max-w-xl overflow-auto rounded-passport p-4 scrollbar-none" onMouseDown={(event) => event.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-3xl font-black tracking-[-.05em]">{title}</h2>
          <button onClick={onClose} className="passport-button h-11 w-11 rounded-full font-black">×</button>
        </div>
        {children}
      </div>
    </div>
  );
}
