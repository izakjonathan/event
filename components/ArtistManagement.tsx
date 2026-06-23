'use client';

import Link from 'next/link';
import { useState } from 'react';
import { dkk } from '@/lib/calculations';
import { id } from '@/lib/defaults';
import { ArtistSubmission } from '@/lib/types';
import { publicArtistFormLink } from '@/lib/utils';
import { useEventStore } from './EventStore';
import { AppShell, Badge, Button, Card, Field, Row, Section } from './ui/AppShell';

const STATUSES = ['all', 'new', 'interested', 'contacted', 'booked', 'rejected', 'archived'] as const;

export default function ArtistManagement() {
 const { artists, events, saveArtist, saveEvent } = useEventStore();
 const [filter, setFilter] = useState<(typeof STATUSES)[number]>('all');
 const [drafts, setDrafts] = useState<Record<string, ArtistSubmission>>({});

 const list = artists.filter((artist) => filter === 'all' || artist.status === filter);
 const getDraft = (artist: ArtistSubmission) => drafts[artist.id] || artist;
 const updateDraft = (artist: ArtistSubmission, key: string, value: any) => {
 setDrafts((current) => ({
 ...current,
 [artist.id]: {
 ...getDraft(artist),
 [key]: value,
 },
 }));
 };

 async function linkArtist(artist: ArtistSubmission) {
 const event = events[0];
 if (!event) return;

 await saveEvent({
 ...event,
 artists: [
 ...event.artists,
 {
 id: id(),
 sourceSubmissionId: artist.id,
 artistName: artist.artist_name,
 contactName: artist.contact_name,
 email: artist.email,
 phone: artist.phone,
 genre: artist.genre,
 imageUrl: artist.image_url,
 fee: Number(artist.preferred_fee || 0),
 startTime: artist.availability_start_time || '',
 endTime: artist.availability_end_time || '',
 status: 'proposed',
 notes: artist.notes || '',
 },
 ],
 });

 await saveArtist({ ...artist, status: 'booked' });
 }

 return (
 <AppShell title="Artists" actions={<Link href="/artist-booking"><Button kind="soft">Form</Button></Link>}>
 <div className="space-y-5">
 <Card>
 <p className="eos-body eos-muted">Artist submissions</p>
 <h2 className="eos-heading mt-2">Review and book</h2>

 <div className="mt-4 flex gap-2 overflow-x-auto scrollbar-none">
 {STATUSES.map((status) => (
 <button
 key={status}
 onClick={() => setFilter(status)}
 className={`pill whitespace-nowrap border px-3 py-2 eos-body ${filter === status ? 'eos-primary' : 'eos-border eos-panel eos-muted'}`}
 >
 {status}
 </button>
 ))}
 </div>

 <Button kind="ghost" className="mt-4 w-full" onClick={() => navigator.clipboard.writeText(publicArtistFormLink())}>
 Copy public artist form link
 </Button>
 </Card>

 {list.length === 0 && (
 <Card>
 <p className="eos-muted">No artist submissions in this view.</p>
 </Card>
 )}

 {list.map((artist) => {
 const draft = getDraft(artist);

 return (
 <Section
 key={artist.id}
 title={draft.artist_name || 'Unnamed artist'}
 right={<Badge tone={draft.status === 'booked' ? 'ok' : draft.status === 'rejected' ? 'bad' : 'neutral'}>{draft.status}</Badge>}
 >
 <Card className="eos-panel">
 <div className="flex gap-3">
 {draft.image_url ? (
 <img src={draft.image_url} alt="" className="h-20 w-20 rounded-[24px] object-cover" />
 ) : (
 <div className="grid h-20 w-20 place-items-center rounded-[24px] border eos-border eos-panel eos-muted">No img</div>
 )}

 <div className="min-w-0 flex-1">
 <h3 className="eos-title truncate">{draft.artist_name}</h3>
 <p className="eos-body eos-muted">{draft.genre || 'No genre'} · {dkk(draft.preferred_fee)}</p>
 <p className="mt-1 eos-caption eos-muted">{draft.email} {draft.phone}</p>
 </div>
 </div>
 </Card>

 <Row>
 <Field label="Artist">
 <input value={draft.artist_name} onChange={(event) => updateDraft(artist, 'artist_name', event.target.value)} />
 </Field>
 <Field label="Contact">
 <input value={draft.contact_name} onChange={(event) => updateDraft(artist, 'contact_name', event.target.value)} />
 </Field>
 </Row>

 <Row>
 <Field label="Email">
 <input value={draft.email} onChange={(event) => updateDraft(artist, 'email', event.target.value)} />
 </Field>
 <Field label="Phone">
 <input value={draft.phone} onChange={(event) => updateDraft(artist, 'phone', event.target.value)} />
 </Field>
 </Row>

 <Row>
 <Field label="Genre">
 <input value={draft.genre} onChange={(event) => updateDraft(artist, 'genre', event.target.value)} />
 </Field>
 <Field label="Preferred fee">
 <input
 type="number"
 value={draft.preferred_fee}
 onChange={(event) => updateDraft(artist, 'preferred_fee', Number(event.target.value))}
 />
 </Field>
 </Row>

 <Row>
 <Field label="Availability">
 <input value={draft.availability} onChange={(event) => updateDraft(artist, 'availability', event.target.value)} />
 </Field>
 <Field label="Status">
 <select value={draft.status} onChange={(event) => updateDraft(artist, 'status', event.target.value)}>
 {STATUSES.filter((status) => status !== 'all').map((status) => (
 <option key={status}>{status}</option>
 ))}
 </select>
 </Field>
 </Row>

 <Row>
 <Field label="Start">
 <input type="time" value={draft.availability_start_time} onChange={(event) => updateDraft(artist, 'availability_start_time', event.target.value)} />
 </Field>
 <Field label="End">
 <input type="time" value={draft.availability_end_time} onChange={(event) => updateDraft(artist, 'availability_end_time', event.target.value)} />
 </Field>
 </Row>

 {['description', 'technical_needs', 'hospitality_needs', 'notes'].map((key) => (
 <Field key={key} label={key.replace('_', ' ')}>
 <textarea value={(draft as any)[key] || ''} onChange={(event) => updateDraft(artist, key, event.target.value)} />
 </Field>
 ))}

 <div className="flex flex-wrap gap-2">
 {Object.entries(draft.links || {})
 .filter(([, value]) => value)
 .map(([key, value]) => (
 <a key={key} href={String(value)} target="_blank" className="pill border eos-border eos-panel px-3 py-2 eos-body eos-muted">
 {key}
 </a>
 ))}
 </div>

 <div className="grid grid-cols-2 gap-2">
 <Button onClick={() => saveArtist(draft)}>Save edits</Button>
 <Button kind="ghost" onClick={() => linkArtist(draft)}>
 Add to event
 </Button>
 <Button kind="danger" onClick={() => saveArtist({ ...draft, status: 'rejected' })}>
 Reject
 </Button>
 <Button kind="danger" onClick={() => saveArtist({ ...draft, status: 'archived' })}>
 Archive
 </Button>
 </div>
 </Section>
 );
 })}
 </div>
 </AppShell>
 );
}
