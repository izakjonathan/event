'use client';

import Link from 'next/link';
import { AppShell, Badge, Button, Card, Stat } from './ui/AppShell';
import { useEventStore } from './EventStore';
import { eventTotals } from '@/lib/calculations';

const modules = [
  ['/ui-studio', 'UI Studio', 'Change background, content, muted and accent colors.', 'Studio'],
  ['/event-planner', 'Event Planner', 'Forecast tickets, costs, staff, bar and venue terms.', 'Active'],
  ['/artist-booking', 'Artist Booking', 'Public artist submission form with image upload.', 'Public'],
  ['/artists', 'Artist Management', 'Review submissions and connect artists to events.', 'Active'],
  ['/calendar', 'Calendar / Schedule', 'Review upcoming events, timings and warnings.', 'Active'],
  ['/bar-planner', 'Bar Planner', 'Plan products, staff, menu and bar profit.', 'Active'],
  ['/project-management', 'Project Management', 'Manage projects, tasks, owners and due dates.', 'Active'],
] as const;

const future = ['Staff planner', 'Contracts', 'Supplier list', 'Budget reports'];

export default function Dashboard() {
  const { events, artists, tasks, alert, usingLocal } = useEventStore();
  const upcoming = events.filter((e) => e.meta.date).sort((a, b) => a.meta.date.localeCompare(b.meta.date))[0];
  const totals = upcoming ? eventTotals(upcoming) : null;

  return (
    <AppShell title="Operations" actions={<Badge tone={usingLocal ? 'warn' : 'ok'}>{usingLocal ? 'Local' : 'Live'}</Badge>}>
      <div className="space-y-5">
        <Card className="overflow-hidden">
          <div className="flex items-start justify-between gap-4">
            <div className="max-w-[75%]">
              <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-zinc-500">Connected workspace</p>
              <h1 className="mt-4 text-balance text-[54px] font-medium leading-[0.93] tracking-[-0.085em] text-white">
                Event Operations System
              </h1>
              <p className="mt-4 max-w-[26ch] text-base leading-6 text-zinc-400">
                Plan events, book artists, manage schedules, bar operations and tasks from one mobile-first workspace.
              </p>
            </div>
            <div className="grid h-12 w-12 place-items-center rounded-full border border-white/10 bg-white/[.03] text-2xl text-white">＋</div>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-2">
            <Stat label="Events" value={events.length} />
            <Stat label="Artists" value={artists.length} />
            <Stat label="Open tasks" value={tasks.filter((t) => !['done', 'archived'].includes(t.status)).length} />
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Badge tone={usingLocal ? 'warn' : 'ok'}>{usingLocal ? 'Local mode' : 'Supabase connected'}</Badge>
            <Badge>Mobile-first</Badge>
          </div>

          <Link href="/ui-studio" className="mt-5 block">
            <div className="eos-primary rounded-[24px] border px-4 py-4 text-black transition active:scale-[.99]">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-[0.08em] opacity-70">Design controls</p>
                  <h2 className="mt-1 text-2xl font-medium tracking-[-0.055em]">Open UI Studio</h2>
                  <p className="mt-1 text-sm opacity-70">Change background, content, muted and accent colors.</p>
                </div>
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-black/10 text-xl">◐</div>
              </div>
            </div>
          </Link>

          {alert && (
            <p className="mt-4 rounded-[22px] border border-amber-300/20 bg-amber-300/10 p-3 text-sm text-amber-100">
              {alert}
            </p>
          )}
        </Card>

        {upcoming && (
          <Card>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-zinc-500">Next review</p>
                <h2 className="mt-3 text-3xl font-medium tracking-[-0.06em] text-white">{upcoming.meta.name}</h2>
                <p className="mt-2 text-sm text-zinc-500">
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
            <h2 className="text-[38px] font-medium tracking-[-0.075em] text-white">Modules</h2>
            <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-zinc-500">Workspace</p>
          </div>

          {modules.map(([href, name, desc, status]) => (
            <Link key={href} href={href} className="block">
              <Card className="transition active:scale-[.99]">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="mb-3 flex items-center gap-2">
                      <Badge tone={status === 'Public' || status === 'Studio' ? 'warn' : 'ok'}>{status}</Badge>
                    </div>
                    <h3 className="text-[28px] font-medium leading-[1.02] tracking-[-0.065em] text-white">{name}</h3>
                    <p className="mt-2 text-sm leading-6 text-zinc-400">{desc}</p>
                  </div>
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-white/10 bg-white/[.03] text-lg text-zinc-400">
                    →
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>

        <Card>
          <div className="flex items-end justify-between gap-3">
            <h3 className="text-[30px] font-medium tracking-[-0.06em] text-white">Future modules</h3>
            <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-zinc-500">Roadmap</p>
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
