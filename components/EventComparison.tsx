'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { AppShell, Badge, Button, Card, Field, Row, Section, Stat, SubCard } from './ui/AppShell';
import { useEventStore } from './EventStore';
import { comparisonTotals, dkk, pct } from '@/lib/calculations';
import { PlannerEvent } from '@/lib/types';

const sortOptions = [
  ['date', 'Date'],
  ['profit', 'Profit'],
  ['revenue', 'Revenue'],
  ['cost', 'Cost'],
  ['margin', 'Margin'],
  ['revenuePerGuest', 'Revenue / guest'],
  ['costPerGuest', 'Cost / guest'],
] as const;

type SortKey = (typeof sortOptions)[number][0];

type EventMetric = {
  event: PlannerEvent;
  totals: ReturnType<typeof comparisonTotals>;
};

function unique(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b));
}

function metricWinner(items: EventMetric[], label: string, getter: (item: EventMetric) => number, lowIsGood = false) {
  if (!items.length) return { label, name: '—', value: '—' };
  const sorted = [...items].sort((a, b) => (lowIsGood ? getter(a) - getter(b) : getter(b) - getter(a)));
  const item = sorted[0];
  return { label, name: item.event.meta.name, value: getter(item) };
}

function exportComparison(items: EventMetric[]) {
  const headers = [
    'name',
    'date',
    'venue',
    'type',
    'status',
    'planned_guests',
    'actual_guests',
    'planned_staff',
    'actual_staff',
    'staff_hours',
    'revenue',
    'cost',
    'profit',
    'margin_percent',
    'revenue_per_guest',
    'cost_per_guest',
    'profit_per_guest',
    'staff_cost_percent',
  ];
  const rows = items.map(({ event, totals }) => [
    event.meta.name,
    event.meta.date,
    event.meta.location,
    event.review.eventType,
    event.meta.status,
    totals.plannedGuests,
    totals.actualGuests,
    totals.plannedStaff,
    totals.actualStaff,
    totals.totalStaffHours,
    Math.round(totals.revenue),
    Math.round(totals.cost),
    Math.round(totals.profit),
    Math.round(totals.margin * 10) / 10,
    Math.round(totals.revenuePerGuest),
    Math.round(totals.costPerGuest),
    Math.round(totals.profitPerGuest),
    Math.round(totals.staffCostPercent * 10) / 10,
  ]);

  const escape = (value: unknown) => `"${String(value ?? '').replaceAll('"', '""')}"`;
  const csv = [headers, ...rows].map((row) => row.map(escape).join(',')).join('\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'event-comparison.csv';
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function EventComparison() {
  const { events, setCurrentId } = useEventStore();
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [venue, setVenue] = useState('');
  const [eventType, setEventType] = useState('');
  const [status, setStatus] = useState('');
  const [completedOnly, setCompletedOnly] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const metrics = useMemo<EventMetric[]>(
    () => events.map((event) => ({ event, totals: comparisonTotals(event) })),
    [events],
  );

  const venues = useMemo(() => unique(events.map((event) => event.meta.location)), [events]);
  const eventTypes = useMemo(() => unique(events.map((event) => event.review.eventType)), [events]);
  const statuses = useMemo(() => unique(events.map((event) => event.meta.status)), [events]);

  const filtered = useMemo(() => {
    const output = metrics.filter(({ event }) => {
      if (dateFrom && event.meta.date && event.meta.date < dateFrom) return false;
      if (dateTo && event.meta.date && event.meta.date > dateTo) return false;
      if (venue && event.meta.location !== venue) return false;
      if (eventType && event.review.eventType !== eventType) return false;
      if (status && event.meta.status !== status) return false;
      if (completedOnly && event.meta.status !== 'completed') return false;
      return true;
    });

    return output.sort((a, b) => {
      if (sortKey === 'date') return (a.event.meta.date || '9999').localeCompare(b.event.meta.date || '9999');
      return b.totals[sortKey] - a.totals[sortKey];
    });
  }, [completedOnly, dateFrom, dateTo, eventType, metrics, sortKey, status, venue]);

  const selected = filtered.filter(({ event }) => selectedIds.includes(event.id)).slice(0, 4);
  const completed = filtered.filter(({ event }) => event.meta.status === 'completed');
  const baseForHighlights = completed.length ? completed : filtered;

  const highlights = [
    metricWinner(baseForHighlights, 'Best profit', (item) => item.totals.profit),
    metricWinner(baseForHighlights, 'Highest revenue', (item) => item.totals.revenue),
    metricWinner(baseForHighlights, 'Best / guest', (item) => item.totals.profitPerGuest),
    metricWinner(baseForHighlights, 'Lowest cost / guest', (item) => item.totals.costPerGuest, true),
  ];

  const toggleSelected = (id: string) => {
    setSelectedIds((current) => {
      if (current.includes(id)) return current.filter((item) => item !== id);
      return [...current, id].slice(-4);
    });
  };

  return (
    <AppShell>
      <div className="space-y-5">
        <Card>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="eos-caption eos-muted">Review module</p>
              <h1 className="eos-display mt-3">Compare</h1>
              <p className="eos-body eos-muted mt-2">Compare saved events across guests, staffing, costs, revenue and profit.</p>
            </div>
            <Badge>{filtered.length} events</Badge>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-2">
            <Stat label="Events" value={filtered.length} />
            <Stat label="Completed" value={completed.length} />
            <Stat label="Total profit" value={dkk(filtered.reduce((sum, item) => sum + item.totals.profit, 0))} />
            <Stat label="Revenue" value={dkk(filtered.reduce((sum, item) => sum + item.totals.revenue, 0))} />
          </div>
        </Card>

        <Card>
          <div className="flex items-end justify-between gap-3">
            <h2 className="eos-title">Filters</h2>
            <Button kind="ghost" onClick={() => exportComparison(filtered)}>CSV</Button>
          </div>
          <div className="mt-4 space-y-3">
            <Row>
              <Field label="From">
                <input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
              </Field>
              <Field label="To">
                <input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
              </Field>
            </Row>
            <Row>
              <Field label="Venue">
                <select value={venue} onChange={(event) => setVenue(event.target.value)}>
                  <option value="">All venues</option>
                  {venues.map((item) => <option key={item}>{item}</option>)}
                </select>
              </Field>
              <Field label="Type">
                <select value={eventType} onChange={(event) => setEventType(event.target.value)}>
                  <option value="">All types</option>
                  {eventTypes.map((item) => <option key={item}>{item}</option>)}
                </select>
              </Field>
            </Row>
            <Row>
              <Field label="Status">
                <select value={status} onChange={(event) => setStatus(event.target.value)}>
                  <option value="">All statuses</option>
                  {statuses.map((item) => <option key={item}>{item}</option>)}
                </select>
              </Field>
              <Field label="Sort by">
                <select value={sortKey} onChange={(event) => setSortKey(event.target.value as SortKey)}>
                  {sortOptions.map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                </select>
              </Field>
            </Row>
            <label className="eos-checkbox-row">
              <input type="checkbox" checked={completedOnly} onChange={(event) => setCompletedOnly(event.target.checked)} />
              <span>Show only completed events</span>
            </label>
          </div>
        </Card>

        <Card>
          <div className="flex items-end justify-between gap-3">
            <h2 className="eos-title">Best / worst</h2>
            <p className="eos-caption eos-muted">{completed.length ? 'Completed' : 'All events'}</p>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {highlights.map((item) => (
              <Stat key={item.label} label={item.label} value={typeof item.value === 'number' ? dkk(item.value) : item.value} sub={item.name} />
            ))}
          </div>
        </Card>

        {selected.length > 0 && (
          <Card>
            <div className="flex items-end justify-between gap-3">
              <h2 className="eos-title">Selected comparison</h2>
              <p className="eos-caption eos-muted">Max 4 events</p>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-3">
              {selected.map(({ event, totals }) => (
                <SubCard key={event.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="eos-title truncate">{event.meta.name}</h3>
                      <p className="eos-caption eos-muted mt-1">{event.meta.date || 'No date'} · {event.meta.location || 'No venue'}</p>
                    </div>
                    <Badge tone={totals.profit >= 0 ? 'ok' : 'bad'}>{dkk(totals.profit)}</Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <Stat label="Revenue" value={dkk(totals.revenue)} />
                    <Stat label="Cost" value={dkk(totals.cost)} />
                    <Stat label="/ guest" value={dkk(totals.profitPerGuest)} />
                  </div>
                </SubCard>
              ))}
            </div>
          </Card>
        )}

        <div className="space-y-3">
          <div className="flex items-end justify-between gap-3">
            <h2 className="eos-title">Events</h2>
            <p className="eos-caption eos-muted">Collapsible cards</p>
          </div>

          {filtered.length === 0 && (
            <Card>
              <p className="eos-body eos-muted">No events match the current filters.</p>
              <Link href="/event-planner"><Button className="mt-4 w-full">Create event</Button></Link>
            </Card>
          )}

          {filtered.map(({ event, totals }) => (
            <Section
              key={event.id}
              title={event.meta.name || 'Untitled event'}
              right={<Badge tone={totals.profit >= 0 ? 'ok' : 'bad'}>{dkk(totals.profit)}</Badge>}
            >
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Badge>{event.meta.status}</Badge>
                  {event.review.eventType && <Badge>{event.review.eventType}</Badge>}
                  {event.review.label && <Badge>{event.review.label}</Badge>}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Stat label="Date" value={event.meta.date || '—'} sub={event.meta.location || 'No venue'} />
                  <Stat label="Guests" value={totals.actualGuests || '—'} sub={`${totals.plannedGuests || 0} planned`} />
                  <Stat label="Revenue" value={dkk(totals.revenue)} />
                  <Stat label="Cost" value={dkk(totals.cost)} />
                  <Stat label="Margin" value={pct(totals.margin)} />
                  <Stat label="Profit / guest" value={dkk(totals.profitPerGuest)} />
                  <Stat label="Staff %" value={pct(totals.staffCostPercent)} />
                  <Stat label="Staff hours" value={totals.totalStaffHours || '—'} />
                </div>

                <SubCard>
                  <h3 className="eos-title">Breakdown</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <Stat label="Ticket revenue" value={dkk(totals.ticketRevenue)} />
                    <Stat label="Bar revenue" value={dkk(totals.barRevenue)} />
                    <Stat label="Other revenue" value={dkk(totals.otherRevenue)} />
                    <Stat label="Staff cost" value={dkk(totals.staffCost)} />
                    <Stat label="Artist cost" value={dkk(totals.artistCost)} />
                    <Stat label="Supplier cost" value={dkk(totals.supplierCost)} />
                    <Stat label="Equipment cost" value={dkk(totals.equipmentCost)} />
                    <Stat label="Other cost" value={dkk(totals.otherCost)} />
                  </div>
                </SubCard>

                {event.review.reviewNotes && <p className="eos-body eos-muted">{event.review.reviewNotes}</p>}

                <div className="grid grid-cols-2 gap-2">
                  <Button kind={selectedIds.includes(event.id) ? 'primary' : 'ghost'} onClick={() => toggleSelected(event.id)}>
                    {selectedIds.includes(event.id) ? 'Selected' : 'Compare'}
                  </Button>
                  <Link href="/event-planner" onClick={() => setCurrentId(event.id)}>
                    <Button kind="ghost" className="w-full">Edit event</Button>
                  </Link>
                </div>
              </div>
            </Section>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
