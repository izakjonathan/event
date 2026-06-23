'use client';

import { useEffect, useMemo, useState } from 'react';
import { useEventStore } from './EventStore';
import { AppShell, Badge, Button, Card, CheckboxRow, Field, Row, Section, Stat, SubCard } from './ui/AppShell';
import { eventFromTemplate, hydrateEvent, id, line, staff, ticket } from '@/lib/defaults';
import { dkk, eventTotals, scenarioTotal } from '@/lib/calculations';
import { EventFile, PlannerEvent } from '@/lib/types';
import { fileToDataUrl } from '@/lib/utils';

const templates = ['Blank', 'Concert', 'Quiz night', 'Private party', 'DJ night', 'Football screening', 'Corporate event'];
const statuses = ['idea', 'quoted', 'confirmed', 'cancelled', 'completed'];
const modes = ['fixed', 'perTicketHolder', 'percentageOfTickets'];

function num(value: string) {
 return Number.isFinite(Number(value)) ? Number(value) : 0;
}

export default function EventPlanner() {
 const store = useEventStore();
 const [draft, setDraft] = useState<PlannerEvent>(store.current ? hydrateEvent(store.current) : eventFromTemplate('Blank'));

 useEffect(() => {
 if (store.current) {
 setDraft(hydrateEvent(store.current));
 }
 }, [store.current?.id]);

 const totals = useMemo(() => eventTotals(draft), [draft]);
 const fixed = totals.expenses + totals.staffCost + totals.artistCost;

 const warnings = [
 !draft.meta.date && 'Missing date',
 !draft.meta.time && 'Missing start time',
 !draft.meta.location && 'Missing location',
 draft.artists.some((artist) => !artist.startTime) && 'Artist time missing',
 draft.artists.some((artist) => !artist.fee) && 'Artist fee missing',
 ].filter(Boolean) as string[];

 const summaryText = `Event: ${draft.meta.name}
Date: ${draft.meta.date} ${draft.meta.time}
Location: ${draft.meta.location}
Tickets sold: ${totals.tickets.sold}
Ticket revenue: ${dkk(totals.tickets.rev)}
Bar profit: ${dkk(totals.bar.profit)}
Projected profit: ${dkk(totals.profit)}
Warnings: ${warnings.join(', ') || 'None'}`;

 const set = (patch: Partial<PlannerEvent>) => setDraft((current) => hydrateEvent({ ...current, ...patch }));

 const save = async () => {
 await store.saveEvent(draft);
 };

 const load = (eventId: string) => {
 const event = store.events.find((item) => item.id === eventId);
 if (event) {
 store.setCurrentId(eventId);
 setDraft(hydrateEvent(event));
 }
 };

 const input = (
 label: string,
 value: string | number,
 onChange: (value: string | number) => void,
 type: 'text' | 'number' | 'date' | 'time' = 'text',
 ) => (
 <Field label={label}>
 <input
 type={type}
 value={value ?? ''}
 onChange={(event) => onChange(type === 'number' ? num(event.target.value) : event.target.value)}
 />
 </Field>
 );

 return (
 <AppShell>
 <div className="space-y-5">
 <Card>
 <div className="flex items-start justify-between gap-3">
 <div>
 <p className="eos-body eos-muted">Current plan</p>
 <h2 className="eos-title mt-1">{draft.meta.name}</h2>
 <p className="eos-body eos-muted">{draft.meta.date || 'No date'} · {draft.meta.location || 'No location'}</p>
 </div>
 <Badge tone={warnings.length ? 'warn' : 'ok'}>{warnings.length ? `${warnings.length} warnings` : 'Ready'}</Badge>
 </div>

 <div className="mt-4 grid grid-cols-2 gap-2">
 <Stat label="Profit" value={dkk(totals.profit)} />
 <Stat label="Revenue" value={dkk(totals.totalIncome)} />
 <Stat label="Costs" value={dkk(totals.totalCosts)} />
 <Stat label="Margin" value={`${Math.round(totals.margin)}%`} />
 <Stat label="Tickets" value={totals.tickets.sold} sub={`${totals.tickets.cap} capacity`} />
 <Stat label="Break-even" value={totals.breakEvenGuests} sub="guests" />
 <Stat label="Bar profit" value={dkk(totals.bar.profit)} />
 <Stat label="Staff" value={dkk(totals.staffCost)} />
 </div>
 </Card>

 <Card>
 <Field label="Workspace key">
 <input value={store.ownerKey} onChange={(event) => store.setOwnerKey(event.target.value)} />
 </Field>

 <div className="mt-3 grid grid-cols-1 gap-3">
 <Field label="Load event">
 <select value={draft.id} onChange={(event) => load(event.target.value)}>
 {store.events.map((item) => (
 <option key={item.id} value={item.id}>
 {item.meta.name}
 </option>
 ))}
 </select>
 </Field>

 <Field label="Template">
 <select onChange={(event) => setDraft(eventFromTemplate(event.target.value))} defaultValue="">
 <option value="" disabled>
 Create from…
 </option>
 {templates.map((template) => (
 <option key={template}>{template}</option>
 ))}
 </select>
 </Field>
 </div>

 <div className="mt-3 grid grid-cols-3 gap-2">
 <Button kind="ghost" onClick={() => store.duplicateEvent(draft.id)}>
 Duplicate
 </Button>
 <Button kind="danger" onClick={() => store.deleteEvent(draft.id)}>
 Delete
 </Button>
 <Button onClick={save}>Save</Button>
 </div>
 </Card>

 <Section title="Basic details" openDefault>
 <input value={draft.meta.name} onChange={(event) => set({ meta: { ...draft.meta, name: event.target.value } })} />
 <Row>
 {input('Date', draft.meta.date, (value) => set({ meta: { ...draft.meta, date: String(value) } }), 'date')}
 {input('End date', draft.meta.endDate, (value) => set({ meta: { ...draft.meta, endDate: String(value) } }), 'date')}
 </Row>
 <Row>
 {input('Start time', draft.meta.time, (value) => set({ meta: { ...draft.meta, time: String(value) } }), 'time')}
 {input('End time', draft.meta.endTime, (value) => set({ meta: { ...draft.meta, endTime: String(value) } }), 'time')}
 </Row>
 {input('Location', draft.meta.location, (value) => set({ meta: { ...draft.meta, location: String(value) } }))}
 <Field label="Status">
 <select value={draft.meta.status} onChange={(event) => set({ meta: { ...draft.meta, status: event.target.value as any } })}>
 {statuses.map((status) => (
 <option key={status}>{status}</option>
 ))}
 </select>
 </Field>
 <Field label="Terms">
 <textarea value={draft.meta.terms} onChange={(event) => set({ meta: { ...draft.meta, terms: event.target.value } })} />
 </Field>
 <Field label="Notes">
 <textarea value={draft.meta.notes} onChange={(event) => set({ meta: { ...draft.meta, notes: event.target.value } })} />
 </Field>
 </Section>

 <Section title="Tickets" right={dkk(totals.tickets.rev)}>
 <div className="grid grid-cols-3 gap-2">
 <Stat label="Sold" value={totals.tickets.sold} />
 <Stat label="Capacity" value={totals.tickets.cap} />
 <Stat label="Fill" value={`${Math.round(totals.tickets.fill)}%`} />
 </div>

 <div className="space-y-3">
 {draft.tickets.map((tier) => (
 <SubCard key={tier.id}>
 <Row>
 {input('Name', tier.name, (value) => set({ tickets: draft.tickets.map((item) => (item.id === tier.id ? { ...item, name: String(value) } : item)) }))}
 {input('Price', tier.price, (value) => set({ tickets: draft.tickets.map((item) => (item.id === tier.id ? { ...item, price: num(String(value)) } : item)) }), 'number')}
 </Row>
 <Row>
 {input('Sold', tier.sold, (value) => set({ tickets: draft.tickets.map((item) => (item.id === tier.id ? { ...item, sold: num(String(value)) } : item)) }), 'number')}
 {input('Capacity', tier.capacity, (value) => set({ tickets: draft.tickets.map((item) => (item.id === tier.id ? { ...item, capacity: num(String(value)) } : item)) }), 'number')}
 </Row>
 {input('Notes', tier.notes, (value) => set({ tickets: draft.tickets.map((item) => (item.id === tier.id ? { ...item, notes: String(value) } : item)) }))}
 <Button kind="danger" className="w-fit" onClick={() => set({ tickets: draft.tickets.filter((item) => item.id !== tier.id) })}>
 Remove tier
 </Button>
 </SubCard>
 ))}
 </div>

 <Button kind="ghost" className="w-fit" onClick={() => set({ tickets: [...draft.tickets, ticket()] })}>
 Add ticket tier
 </Button>
 </Section>

 <Section title="Income and expenses">
 <div className="grid grid-cols-2 gap-2">
 <Stat label="Extra income" value={dkk(totals.extraIncome)} />
 <Stat label="Expenses" value={dkk(totals.expenses)} />
 </div>

 <div className="space-y-3">
 {draft.lines.map((moneyLine) => (
 <SubCard key={moneyLine.id}>
 <Row>
 <Field label="Kind">
 <select
 value={moneyLine.kind}
 onChange={(event) =>
 set({ lines: draft.lines.map((item) => (item.id === moneyLine.id ? { ...item, kind: event.target.value as any } : item)) })
 }
 >
 <option>income</option>
 <option>expense</option>
 </select>
 </Field>
 {input('Name', moneyLine.name, (value) => set({ lines: draft.lines.map((item) => (item.id === moneyLine.id ? { ...item, name: String(value) } : item)) }))}
 </Row>
 <Row>
 {input('Amount', moneyLine.amount, (value) => set({ lines: draft.lines.map((item) => (item.id === moneyLine.id ? { ...item, amount: num(String(value)) } : item)) }), 'number')}
 {input('Quantity', moneyLine.quantity, (value) => set({ lines: draft.lines.map((item) => (item.id === moneyLine.id ? { ...item, quantity: num(String(value)) } : item)) }), 'number')}
 </Row>
 <Field label="Mode">
 <select
 value={moneyLine.mode}
 onChange={(event) =>
 set({ lines: draft.lines.map((item) => (item.id === moneyLine.id ? { ...item, mode: event.target.value as any } : item)) })
 }
 >
 {modes.map((mode) => (
 <option key={mode}>{mode}</option>
 ))}
 </select>
 </Field>
 {input('Notes', moneyLine.notes, (value) => set({ lines: draft.lines.map((item) => (item.id === moneyLine.id ? { ...item, notes: String(value) } : item)) }))}
 <Button kind="danger" className="w-fit" onClick={() => set({ lines: draft.lines.filter((item) => item.id !== moneyLine.id) })}>
 Remove line
 </Button>
 </SubCard>
 ))}
 </div>

 <div className="grid grid-cols-2 gap-2">
 <Button kind="ghost" onClick={() => set({ lines: [...draft.lines, line('income')] })}>
 Add income
 </Button>
 <Button kind="ghost" onClick={() => set({ lines: [...draft.lines, line('expense')] })}>
 Add expense
 </Button>
 </div>
 </Section>

 <Section title="Staff costs" right={dkk(totals.staffCost)}>
 <div className="space-y-3">
 {draft.staff.map((member) => (
 <SubCard key={member.id}>
 <Row>
 {input('Role', member.role, (value) => set({ staff: draft.staff.map((item) => (item.id === member.id ? { ...item, role: String(value) } : item)) }))}
 {input('People', member.people, (value) => set({ staff: draft.staff.map((item) => (item.id === member.id ? { ...item, people: num(String(value)) } : item)) }), 'number')}
 </Row>
 <Row>
 {input('Hours', member.hours, (value) => set({ staff: draft.staff.map((item) => (item.id === member.id ? { ...item, hours: num(String(value)) } : item)) }), 'number')}
 {input('Hourly wage', member.hourlyWage, (value) => set({ staff: draft.staff.map((item) => (item.id === member.id ? { ...item, hourlyWage: num(String(value)) } : item)) }), 'number')}
 </Row>
 {input('Extra %', member.extraPercent, (value) => set({ staff: draft.staff.map((item) => (item.id === member.id ? { ...item, extraPercent: num(String(value)) } : item)) }), 'number')}
 {input('Notes', member.notes, (value) => set({ staff: draft.staff.map((item) => (item.id === member.id ? { ...item, notes: String(value) } : item)) }))}
 <Button kind="danger" className="w-fit" onClick={() => set({ staff: draft.staff.filter((item) => item.id !== member.id) })}>
 Remove staff
 </Button>
 </SubCard>
 ))}
 </div>

 <Button kind="ghost" className="w-fit" onClick={() => set({ staff: [...draft.staff, staff()] })}>
 Add staff line
 </Button>
 </Section>

 <Section title="Bar calculation" right={dkk(totals.bar.profit)}>
 <CheckboxRow label="Enable bar calculation" checked={draft.bar.enabled} onChange={(checked) => set({ bar: { ...draft.bar, enabled: checked } })} />
 <CheckboxRow label="Use ticket guests" checked={draft.bar.useTicketGuests} onChange={(checked) => set({ bar: { ...draft.bar, useTicketGuests: checked } })} />
 <Row>
 {input('Custom guests', draft.bar.customGuests, (value) => set({ bar: { ...draft.bar, customGuests: num(String(value)) } }), 'number')}
 {input('Spend per guest', draft.bar.spendPerGuest, (value) => set({ bar: { ...draft.bar, spendPerGuest: num(String(value)) } }), 'number')}
 </Row>
 {input('Stock/cost %', draft.bar.costPercent, (value) => set({ bar: { ...draft.bar, costPercent: num(String(value)) } }), 'number')}
 <div className="grid grid-cols-3 gap-2">
 <Stat label="Revenue" value={dkk(totals.bar.revenue)} />
 <Stat label="Cost" value={dkk(totals.bar.stockCost)} />
 <Stat label="Profit" value={dkk(totals.bar.profit)} />
 </div>
 <Field label="Notes">
 <textarea value={draft.bar.notes} onChange={(event) => set({ bar: { ...draft.bar, notes: event.target.value } })} />
 </Field>
 </Section>

 <Section title="Scenario planning" openDefault>
 <div className="space-y-3">
 {draft.scenarios.map((scenario) => {
 const output = scenarioTotal(scenario, fixed);
 return (
 <SubCard key={scenario.id}>
 <div className="eos-inline-input">
 <input
 value={scenario.name}
 onChange={(event) =>
 set({ scenarios: draft.scenarios.map((item) => (item.id === scenario.id ? { ...item, name: event.target.value } : item)) })
 }
 />
 <Badge tone={output.profit >= 0 ? 'ok' : 'bad'}>{dkk(output.profit)}</Badge>
 </div>
 <Row>
 {input('Tickets sold', scenario.ticketsSold, (value) => set({ scenarios: draft.scenarios.map((item) => (item.id === scenario.id ? { ...item, ticketsSold: num(String(value)) } : item)) }), 'number')}
 {input('Avg ticket', scenario.averageTicketPrice, (value) => set({ scenarios: draft.scenarios.map((item) => (item.id === scenario.id ? { ...item, averageTicketPrice: num(String(value)) } : item)) }), 'number')}
 </Row>
 <Row>
 {input('Bar spend', scenario.barSpendPerGuest, (value) => set({ scenarios: draft.scenarios.map((item) => (item.id === scenario.id ? { ...item, barSpendPerGuest: num(String(value)) } : item)) }), 'number')}
 {input('Extra expenses', scenario.extraExpenses, (value) => set({ scenarios: draft.scenarios.map((item) => (item.id === scenario.id ? { ...item, extraExpenses: num(String(value)) } : item)) }), 'number')}
 </Row>
 </SubCard>
 );
 })}
 </div>
 </Section>

 <Section title="Venue terms / profit split">
 <CheckboxRow label="Enable venue terms" checked={draft.termsPlan.enabled} onChange={(checked) => set({ termsPlan: { ...draft.termsPlan, enabled: checked } })} />
 <Row>
 {input('Organizer ticket %', draft.termsPlan.organizerTicketShare, (value) => set({ termsPlan: { ...draft.termsPlan, organizerTicketShare: num(String(value)) } }), 'number')}
 {input('Organizer bar %', draft.termsPlan.organizerBarProfitShare, (value) => set({ termsPlan: { ...draft.termsPlan, organizerBarProfitShare: num(String(value)) } }), 'number')}
 </Row>
 <Row>
 {input('Flat venue hire', draft.termsPlan.flatVenueHire, (value) => set({ termsPlan: { ...draft.termsPlan, flatVenueHire: num(String(value)) } }), 'number')}
 {input('Minimum guarantee', draft.termsPlan.minimumVenueGuarantee, (value) => set({ termsPlan: { ...draft.termsPlan, minimumVenueGuarantee: num(String(value)) } }), 'number')}
 </Row>
 <div className="grid grid-cols-2 gap-2">
 <Stat label="Organizer" value={dkk(totals.organizer)} />
 <Stat label="Venue" value={dkk(totals.venue)} />
 </div>
 <Field label="Notes">
 <textarea value={draft.termsPlan.notes} onChange={(event) => set({ termsPlan: { ...draft.termsPlan, notes: event.target.value } })} />
 </Field>
 </Section>

 <Section title="Artists" right={`${draft.artists.length} artist${draft.artists.length === 1 ? '' : 's'}`}>
 {draft.artists.length === 0 && <p className="eos-body eos-muted">No artists linked yet. Add submissions from Artist Management.</p>}

 <div className="space-y-3">
 {draft.artists.map((artist) => (
 <SubCard key={artist.id}>
 <Row>
 {input('Artist', artist.artistName, (value) => set({ artists: draft.artists.map((item) => (item.id === artist.id ? { ...item, artistName: String(value) } : item)) }))}
 {input('Fee', artist.fee, (value) => set({ artists: draft.artists.map((item) => (item.id === artist.id ? { ...item, fee: num(String(value)) } : item)) }), 'number')}
 </Row>
 <Row>
 {input('Start', artist.startTime, (value) => set({ artists: draft.artists.map((item) => (item.id === artist.id ? { ...item, startTime: String(value) } : item)) }), 'time')}
 {input('End', artist.endTime, (value) => set({ artists: draft.artists.map((item) => (item.id === artist.id ? { ...item, endTime: String(value) } : item)) }), 'time')}
 </Row>
 <Field label="Status">
 <select
 value={artist.status}
 onChange={(event) =>
 set({ artists: draft.artists.map((item) => (item.id === artist.id ? { ...item, status: event.target.value as any } : item)) })
 }
 >
 {['proposed', 'contacted', 'confirmed', 'cancelled'].map((status) => (
 <option key={status}>{status}</option>
 ))}
 </select>
 </Field>
 <Button kind="danger" className="w-fit" onClick={() => set({ artists: draft.artists.filter((item) => item.id !== artist.id) })}>
 Remove artist
 </Button>
 </SubCard>
 ))}
 </div>
 </Section>

 <Section title="Files">
 <label className="block cursor-pointer rounded-2xl border border-dashed eos-border eos-panel p-4 text-center eos-body eos-muted">
 <span>Add event files</span>
 <input
 className="sr-only"
 type="file"
 multiple
 onChange={async (event) => {
 const files = Array.from(event.target.files || []);
 const next: EventFile[] = [];
 for (const file of files) {
 next.push({
 id: id(),
 name: file.name,
 originalName: file.name,
 mimeType: file.type,
 size: file.size,
 dataUrl: await fileToDataUrl(file),
 uploadedAt: new Date().toISOString(),
 });
 }
 set({ files: [...draft.files, ...next] });
 event.currentTarget.value = '';
 }}
 />
 </label>

 <div className="space-y-3">
 {draft.files.map((file) => (
 <SubCard key={file.id}>
 <div>
 <input value={file.name} onChange={(event) => set({ files: draft.files.map((item) => (item.id === file.id ? { ...item, name: event.target.value } : item)) })} />
 <p className="mt-1 eos-caption eos-muted">{Math.round(file.size / 1024)} KB</p>
 </div>
 <div className="flex flex-wrap gap-2">
 <a download={file.originalName} href={file.dataUrl}>
 <Button kind="ghost">Download</Button>
 </a>
 <Button kind="danger" onClick={() => set({ files: draft.files.filter((item) => item.id !== file.id) })}>
 Remove
 </Button>
 </div>
 </SubCard>
 ))}
 </div>
 </Section>

 <Section title="Summary / export">
 <textarea readOnly value={summaryText} />
 <div className="grid grid-cols-2 gap-2">
 <Button kind="ghost" onClick={() => navigator.clipboard.writeText(summaryText)}>
 Copy text
 </Button>
 <Button
 kind="ghost"
 onClick={() => {
 const csv = `name,date,location,profit,revenue,costs\n${draft.meta.name},${draft.meta.date},${draft.meta.location},${totals.profit},${totals.totalIncome},${totals.totalCosts}`;
 const anchor = document.createElement('a');
 const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
 anchor.href = url;
 anchor.download = `${draft.meta.name || 'event'}-summary.csv`;
 anchor.click();
 URL.revokeObjectURL(url);
 }}
 >
 CSV
 </Button>
 </div>
 </Section>
 </div>
 </AppShell>
 );
}
