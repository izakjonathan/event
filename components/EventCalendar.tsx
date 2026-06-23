'use client';

import Link from 'next/link';
import { dkk, eventTotals } from '@/lib/calculations';
import { dateSort } from '@/lib/utils';
import { useEventStore } from './EventStore';
import { AppShell, Badge, Button, Card, Section, Stat } from './ui/AppShell';

export default function EventCalendar() {
 const { events, setCurrentId } = useEventStore();
 const sorted = [...events].sort((a, b) => dateSort(a.meta.date, b.meta.date));

 return (
  <AppShell title="Calendar" actions={<Link href="/event-planner"><Button kind="soft">Planner</Button></Link>}>
   <div className="space-y-5">
    <Card>
     <p className="text-sm eos-muted">Readiness layer</p>
     <h2 className="eos-heading mt-2">Upcoming events</h2>
    </Card>

    {sorted.length === 0 && (
     <Card>
      <p className="eos-muted">No events yet. Create one in Event Planner.</p>
     </Card>
    )}

    {sorted.map((event) => {
     const totals = eventTotals(event);
     const warnings = [
      !event.meta.date && 'missing date',
      !event.meta.time && 'missing time',
      !event.meta.location && 'missing location',
      ...event.artists.flatMap((artist) =>
       [
        !artist.startTime && `${artist.artistName} missing time`,
        !artist.fee && `${artist.artistName} missing fee`,
       ].filter(Boolean) as string[],
      ),
     ].filter(Boolean) as string[];

     return (
      <Section
       key={event.id}
       title={event.meta.name}
       openDefault={false}
       right={<Badge tone={warnings.length ? 'warn' : 'ok'}>{warnings.length ? `${warnings.length} warnings` : 'ready'}</Badge>}
      >
       <Card className="eos-panel">
        <div className="flex items-start justify-between">
         <div>
          <p className="eos-subheading">{event.meta.date || 'No date'}</p>
          <p className="text-sm eos-muted">
           {event.meta.time || 'No start'}–{event.meta.endTime || 'No end'} · {event.meta.location || 'No location'}
          </p>
         </div>
         <Badge>{event.meta.status}</Badge>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
         <Stat label="Profit" value={dkk(totals.profit)} />
         <Stat label="Artists" value={event.artists.length} />
        </div>

        {warnings.length > 0 && (
         <div className="mt-4 flex flex-wrap gap-2">
          {warnings.map((warning) => (
           <Badge key={warning} tone="warn">
            {warning}
           </Badge>
          ))}
         </div>
        )}

        <Link href="/event-planner" onClick={() => setCurrentId(event.id)}>
         <Button className="mt-4 w-full">Edit event</Button>
        </Link>
       </Card>

       {event.artists.length > 0 && (
        <div className="space-y-2">
         <h4 className="text-sm font-normal eos-muted">Lineup</h4>
         {event.artists.map((artist) => (
          <Card key={artist.id} className="eos-panel">
           <div className="flex justify-between gap-3">
            <div>
             <h4 className="font-normal">{artist.artistName}</h4>
             <p className="text-sm eos-muted">
              {artist.genre} · {artist.startTime || 'No start'}–{artist.endTime || 'No end'}
             </p>
            </div>
            <div className="text-right">
             <Badge>{artist.status}</Badge>
             <p className="mt-2 text-sm eos-muted">{dkk(artist.fee)}</p>
            </div>
           </div>
          </Card>
         ))}
        </div>
       )}
      </Section>
     );
    })}
   </div>
  </AppShell>
 );
}
