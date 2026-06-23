'use client';

import Link from 'next/link';
import { AppShell, Badge, Button, Card, Stat } from './ui/AppShell';
import { useEventStore } from './EventStore';
import { eventTotals } from '@/lib/calculations';

const modules = [
 ['/event-planner', 'Event Planner', 'Forecast tickets, costs, staff, bar and venue terms.', 'Active'],
 ['/artist-booking', 'Artist Booking', 'Public artist submission form with image upload.', 'Public'],
 ['/artists', 'Artist Management', 'Review submissions and connect artists to events.', 'Active'],
 ['/calendar', 'Calendar / Schedule', 'Review upcoming events, timings and warnings.', 'Active'],
 ['/bar-planner', 'Bar Planner', 'Plan products, staff, menu and bar profit.', 'Active'],
 ['/project-management', 'Project Management', 'Manage projects, tasks, owners and due dates.', 'Active'],
 ['/suppliers', 'Supplier List', 'Save supplier contacts, categories, labels and notes.', 'Active'],
] as const;

const future = ['Staff planner', 'Contracts', 'Budget reports'];

export default function Dashboard() {
 const { events, artists, tasks } = useEventStore();
 const upcoming = events.filter((e) => e.meta.date).sort((a, b) => a.meta.date.localeCompare(b.meta.date))[0];
 const totals = upcoming ? eventTotals(upcoming) : null;

 return (
 <AppShell title="Operations">
 <div className="space-y-5">
 <Card className="overflow-hidden">
 <div className="flex items-start justify-between gap-4">
 <div className="max-w-[75%]">
 <p className="eos-caption eos-muted">Connected workspace</p>
 <h1 className="eos-display mt-4 text-balance">
 <span>Event</span><span className="font-bold">OS</span>
 </h1>
 </div>
 </div>

 <div className="mt-6 grid grid-cols-3 gap-2">
 <Stat label="Events" value={events.length} />
 <Stat label="Artists" value={artists.length} />
 <Stat label="Tasks" value={tasks.filter((t) => !['done', 'archived'].includes(t.status)).length} />
 </div>


 </Card>

 {upcoming && (
 <Card>
 <div className="flex items-start justify-between gap-3">
 <div>
 <p className="eos-caption eos-muted">Next review</p>
 <h2 className="eos-title mt-3">{upcoming.meta.name}</h2>
 <p className="mt-2 eos-body eos-muted">
 {upcoming.meta.date} {upcoming.meta.time} · {upcoming.meta.location || 'No location'}
 </p>
 </div>
 <Badge>{upcoming.meta.status}</Badge>
 </div>

 <div className="mt-5 grid grid-cols-2 gap-2">
 <Stat
 label="Projected"
 value={
 totals
 ? new Intl.NumberFormat('da-DK', {
 style: 'currency',
 currency: 'DKK',
 maximumFractionDigits: 0,
 }).format(totals.profit)
 : '—'
 }
 />
 <Stat
 label="Warnings"
 value={[!upcoming.meta.date, !upcoming.meta.time, !upcoming.meta.location, ...upcoming.artists.map((a) => !a.startTime || !a.fee)].filter(Boolean).length}
 />
 </div>

 <Link href="/calendar">
 <Button className="mt-4 w-full">Open readiness view</Button>
 </Link>
 </Card>
 )}

 <div className="space-y-3">
 <div className="flex items-end justify-between gap-3">
 <h2 className="eos-caption eos-muted">Modules</h2>
 <p className="eos-caption eos-muted">Workspace</p>
 </div>

 {modules.map(([href, name, desc, status]) => (
 <Link key={href} href={href} className="block">
 <Card>
 <div className="flex items-start justify-between gap-4">
 <div className="min-w-0 flex-1">
 <h3 className="eos-title">{name}</h3>
 <p className="eos-body mt-2 eos-muted">{desc}</p>
 <div className="mt-4 flex items-center gap-2">
 <span className="pill border px-2 py-0.5 eos-caption eos-muted">{status}</span>
 </div>
 </div>
 <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full border eos-border eos-panel eos-arrow eos-muted">
 →
 </div>
 </div>
 </Card>
 </Link>
 ))}
 </div>

 <Card>
 <div className="flex items-end justify-between gap-3">
 <h3 className="eos-title">Future modules</h3>
 <p className="eos-caption eos-muted">Roadmap</p>
 </div>
 <div className="mt-4 flex flex-wrap gap-2">
 {future.map((x) => (
 <Badge key={x}>{x}</Badge>
 ))}
 </div>
 </Card>
 </div>
 </AppShell>
 );
}
