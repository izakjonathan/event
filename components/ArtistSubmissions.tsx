'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { getSupabaseClient } from '@/lib/supabaseClient';

type EventArtist = {
  id: string;
  sourceSubmissionId?: string;
  artistName: string;
  contactName: string;
  email: string;
  phone: string;
  genre: string;
  imageUrl: string;
  fee: number;
  setTime: string;
  status: 'proposed' | 'contacted' | 'confirmed' | 'cancelled';
  notes: string;
};

type EventPayload = {
  id: string;
  meta?: { name?: string; date?: string };
  artists?: EventArtist[];
  updatedAt?: string;
  [key: string]: unknown;
};

type EventPlanRow = {
  id: string;
  name: string;
  event_date: string | null;
  payload: EventPayload;
};

type ArtistSubmission = {
  id: string;
  artist_name: string;
  contact_name: string | null;
  email: string;
  phone: string | null;
  genre: string | null;
  description: string | null;
  image_url: string | null;
  availability: string | null;
  preferred_fee: string | null;
  technical_needs: string | null;
  hospitality_needs: string | null;
  notes: string | null;
  links: Record<string, string> | null;
  status: string;
  created_at: string;
  updated_at: string;
};

type EditableArtist = {
  artist_name: string;
  contact_name: string;
  email: string;
  phone: string;
  genre: string;
  description: string;
  image_url: string;
  availability: string;
  preferred_fee: string;
  technical_needs: string;
  hospitality_needs: string;
  notes: string;
};

const statuses = ['new', 'interested', 'contacted', 'booked', 'rejected', 'archived'];

function parseFee(value: string | null) {
  if (!value) return 0;
  const match = value.replace(',', '.').match(/\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : 0;
}

function formatDate(value: string | null) {
  if (!value) return '';
  try {
    return new Intl.DateTimeFormat('da-DK', { day: '2-digit', month: '2-digit', year: '2-digit' }).format(new Date(value));
  } catch {
    return value;
  }
}

function eventTitle(event: EventPlanRow) {
  return event.name || event.payload?.meta?.name || 'Untitled event';
}

function editableFromArtist(artist: ArtistSubmission): EditableArtist {
  return {
    artist_name: artist.artist_name || '',
    contact_name: artist.contact_name || '',
    email: artist.email || '',
    phone: artist.phone || '',
    genre: artist.genre || '',
    description: artist.description || '',
    image_url: artist.image_url || '',
    availability: artist.availability || '',
    preferred_fee: artist.preferred_fee || '',
    technical_needs: artist.technical_needs || '',
    hospitality_needs: artist.hospitality_needs || '',
    notes: artist.notes || ''
  };
}

export default function ArtistSubmissions() {
  const [items, setItems] = useState<ArtistSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [messageKind, setMessageKind] = useState<'info' | 'error' | 'success'>('info');
  const [filter, setFilter] = useState('all');
  const [events, setEvents] = useState<EventPlanRow[]>([]);
  const [selectedEventByArtist, setSelectedEventByArtist] = useState<Record<string, string>>({});
  const [artistFeeByArtist, setArtistFeeByArtist] = useState<Record<string, string>>({});
  const [setTimeByArtist, setSetTimeByArtist] = useState<Record<string, string>>({});
  const [editingArtist, setEditingArtist] = useState<ArtistSubmission | null>(null);
  const [editForm, setEditForm] = useState<EditableArtist | null>(null);

  function showMessage(text: string, kind: 'info' | 'error' | 'success' = 'info') {
    setMessage(text);
    setMessageKind(kind);
  }

  async function load() {
    setLoading(true);
    setMessage('');
    const supabase = getSupabaseClient();

    if (!supabase) {
      showMessage('Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel.', 'error');
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('artist_submissions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      showMessage(error.message, 'error');
      setLoading(false);
      return;
    }

    const submissions = (data || []) as ArtistSubmission[];
    setItems(submissions);

    const { data: eventRows, error: eventError } = await supabase
      .from('event_plans')
      .select('id,name,event_date,payload')
      .order('updated_at', { ascending: false });

    if (!eventError) {
      setEvents((eventRows || []) as EventPlanRow[]);
    }

    setArtistFeeByArtist((current) => {
      const next = { ...current };
      submissions.forEach((artist) => {
        if (next[artist.id] === undefined) next[artist.id] = String(parseFee(artist.preferred_fee) || '');
      });
      return next;
    });

    setLoading(false);
  }

  const linkedEventsByArtist = useMemo(() => {
    const map: Record<string, EventPlanRow[]> = {};
    events.forEach((event) => {
      const artists = Array.isArray(event.payload?.artists) ? event.payload.artists : [];
      artists.forEach((artist) => {
        if (!artist.sourceSubmissionId) return;
        map[artist.sourceSubmissionId] = [...(map[artist.sourceSubmissionId] || []), event];
      });
    });
    return map;
  }, [events]);

  const bookedArtists = useMemo(() => {
    return items.filter((artist) => (linkedEventsByArtist[artist.id] || []).length > 0 || artist.status === 'booked');
  }, [items, linkedEventsByArtist]);

  async function updateStatus(id: string, status: string) {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    setItems((current) => current.map((item) => item.id === id ? { ...item, status } : item));
    const { error } = await supabase.from('artist_submissions').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
    if (error) {
      showMessage(error.message, 'error');
      load();
    }
  }

  function startEdit(artist: ArtistSubmission) {
    setEditingArtist(artist);
    setEditForm(editableFromArtist(artist));
  }

  async function saveEdit() {
    if (!editingArtist || !editForm) return;
    const supabase = getSupabaseClient();
    if (!supabase) return;

    const { error } = await supabase
      .from('artist_submissions')
      .update({ ...editForm, updated_at: new Date().toISOString() })
      .eq('id', editingArtist.id);

    if (error) {
      showMessage(error.message, 'error');
      return;
    }

    setItems((current) => current.map((item) => item.id === editingArtist.id ? { ...item, ...editForm, updated_at: new Date().toISOString() } : item));
    setEditingArtist(null);
    setEditForm(null);
    showMessage('Artist submission updated.', 'success');
  }

  async function archiveArtist(artist: ArtistSubmission) {
    await updateStatus(artist.id, 'archived');
    showMessage(`${artist.artist_name} archived.`, 'success');
  }

  async function rejectArtist(artist: ArtistSubmission) {
    await updateStatus(artist.id, 'rejected');
    showMessage(`${artist.artist_name} marked as rejected.`, 'success');
  }

  async function addArtistToEvent(artist: ArtistSubmission) {
    const eventId = selectedEventByArtist[artist.id];
    if (!eventId) {
      showMessage('Choose an event first.', 'error');
      return;
    }

    const existingLinks = linkedEventsByArtist[artist.id] || [];
    if (existingLinks.some((event) => event.id === eventId)) {
      showMessage(`${artist.artist_name} is already connected to that event.`, 'error');
      return;
    }

    const supabase = getSupabaseClient();
    if (!supabase) return;

    const { data: row, error: readError } = await supabase
      .from('event_plans')
      .select('id,name,event_date,payload')
      .eq('id', eventId)
      .single();

    if (readError || !row) {
      showMessage(readError?.message || 'Could not load selected event.', 'error');
      return;
    }

    const eventRow = row as EventPlanRow;
    const payload = eventRow.payload || {};
    const existingArtists = Array.isArray(payload.artists) ? payload.artists : [];

    const nextArtist: EventArtist = {
      id: globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
      sourceSubmissionId: artist.id,
      artistName: artist.artist_name,
      contactName: artist.contact_name || '',
      email: artist.email || '',
      phone: artist.phone || '',
      genre: artist.genre || '',
      imageUrl: artist.image_url || '',
      fee: Number(artistFeeByArtist[artist.id] || parseFee(artist.preferred_fee) || 0),
      setTime: setTimeByArtist[artist.id] || '',
      status: 'proposed',
      notes: [artist.description, artist.technical_needs ? `Technical: ${artist.technical_needs}` : '', artist.hospitality_needs ? `Hospitality: ${artist.hospitality_needs}` : '', artist.notes].filter(Boolean).join('\n\n')
    };

    const nextPayload = {
      ...payload,
      artists: [...existingArtists, nextArtist],
      updatedAt: new Date().toISOString()
    };

    const { error: updateError } = await supabase
      .from('event_plans')
      .update({ payload: nextPayload, updated_at: new Date().toISOString() })
      .eq('id', eventId);

    if (updateError) {
      showMessage(updateError.message, 'error');
      return;
    }

    await updateStatus(artist.id, 'booked');
    showMessage(`${artist.artist_name} added to ${eventTitle(eventRow)}.`, 'success');
    load();
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    if (filter === 'all') return items;
    if (filter === 'linked') return items.filter((item) => (linkedEventsByArtist[item.id] || []).length > 0);
    if (filter === 'unlinked') return items.filter((item) => !(linkedEventsByArtist[item.id] || []).length);
    return items.filter((item) => item.status === filter);
  }, [filter, items, linkedEventsByArtist]);

  const messageClass = messageKind === 'error' ? 'artist-message-error' : messageKind === 'success' ? 'artist-message-success' : '';

  return (
    <main className="system-shell no-callout min-h-dvh bg-[var(--paper)] text-[var(--ink)]">
      <div className="system-wrap">
        <div className="artist-admin-top">
          <Link href="/" className="back-pill passport-button">← Dashboard</Link>
          <button onClick={load} className="back-pill passport-button">Reload</button>
        </div>

        <section className="system-hero passport-card">
          <div>
            <p className="system-kicker">Internal module</p>
            <h1>Artist submissions</h1>
            <p className="system-intro">
              Review, edit, archive and connect artists to events.
            </p>
          </div>
          <div className="system-status-pill">
            <span>Total</span>
            <strong>{items.length}</strong>
          </div>
        </section>

        <section className="booking-overview-grid">
          <div className="booking-overview-card passport-card">
            <span>Booked / linked</span>
            <strong>{bookedArtists.length}</strong>
          </div>
          <div className="booking-overview-card passport-card">
            <span>Needs event</span>
            <strong>{items.filter((artist) => !(linkedEventsByArtist[artist.id] || []).length && artist.status !== 'archived').length}</strong>
          </div>
          <div className="booking-overview-card passport-card">
            <span>Events</span>
            <strong>{events.length}</strong>
          </div>
        </section>

        <section className="booked-overview passport-card">
          <div className="booked-overview-head">
            <div>
              <p className="system-kicker">Booked artists overview</p>
              <h2>Linked lineup</h2>
            </div>
          </div>
          {!bookedArtists.length ? (
            <p className="artist-text">No artists are linked to events yet.</p>
          ) : (
            <div className="booked-chip-row">
              {bookedArtists.map((artist) => (
                <span key={artist.id}>
                  {artist.artist_name}
                  {(linkedEventsByArtist[artist.id] || []).length ? ` · ${(linkedEventsByArtist[artist.id] || []).map(eventTitle).join(', ')}` : ' · booked'}
                </span>
              ))}
            </div>
          )}
        </section>

        <section className="artist-filter-row">
          <button onClick={() => setFilter('all')} className={filter === 'all' ? 'active' : ''}>All</button>
          <button onClick={() => setFilter('linked')} className={filter === 'linked' ? 'active' : ''}>Linked</button>
          <button onClick={() => setFilter('unlinked')} className={filter === 'unlinked' ? 'active' : ''}>Unlinked</button>
          {statuses.map((status) => (
            <button key={status} onClick={() => setFilter(status)} className={filter === status ? 'active' : ''}>
              {status}
            </button>
          ))}
        </section>

        {message && <div className={`artist-message ${messageClass}`}>{message}</div>}
        {loading && <div className="artist-message">Loading submissions…</div>}
        {!loading && filtered.length === 0 && <div className="artist-message">No artist submissions found.</div>}

        <section className="artist-submission-grid">
          {filtered.map((artist) => {
            const linkedEvents = linkedEventsByArtist[artist.id] || [];
            return (
              <article key={artist.id} className="artist-submission-card passport-card">
                {artist.image_url ? (
                  <img src={artist.image_url} alt="" className="artist-image" />
                ) : (
                  <div className="artist-image artist-image-empty">No image</div>
                )}

                <div className="artist-submission-body">
                  <div className="artist-card-head">
                    <div>
                      <p className="system-kicker">{artist.genre || 'No genre'}</p>
                      <h2>{artist.artist_name}</h2>
                    </div>
                    <select value={artist.status || 'new'} onChange={(event) => updateStatus(artist.id, event.target.value)}>
                      {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
                    </select>
                  </div>

                  <div className="artist-link-status">
                    {linkedEvents.length ? (
                      linkedEvents.map((event) => <span key={event.id}>Linked to {eventTitle(event)}</span>)
                    ) : (
                      <span>Not linked to an event</span>
                    )}
                  </div>

                  <div className="artist-data-grid">
                    <span>Submitted</span><strong>{formatDate(artist.created_at)}</strong>
                    <span>Contact</span><strong>{artist.contact_name || '—'}</strong>
                    <span>Email</span><strong>{artist.email}</strong>
                    <span>Phone</span><strong>{artist.phone || '—'}</strong>
                    <span>Fee</span><strong>{artist.preferred_fee || '—'}</strong>
                    <span>Available</span><strong>{artist.availability || '—'}</strong>
                  </div>

                  {artist.description && <p className="artist-text">{artist.description}</p>}

                  <div className="artist-link-row">
                    {artist.links && Object.entries(artist.links).filter(([, value]) => value).map(([key, value]) => (
                      <a key={key} href={value} target="_blank" rel="noreferrer">{key}</a>
                    ))}
                  </div>

                  <div className="artist-add-event-box">
                    <select
                      value={selectedEventByArtist[artist.id] || ''}
                      onChange={(event) => setSelectedEventByArtist((current) => ({ ...current, [artist.id]: event.target.value }))}
                    >
                      <option value="">Choose event</option>
                      {events.map((event) => (
                        <option key={event.id} value={event.id}>
                          {eventTitle(event)}{event.event_date ? ` · ${formatDate(event.event_date)}` : ''}
                        </option>
                      ))}
                    </select>
                    <input
                      value={artistFeeByArtist[artist.id] || ''}
                      inputMode="decimal"
                      placeholder="Fee"
                      onChange={(event) => setArtistFeeByArtist((current) => ({ ...current, [artist.id]: event.target.value }))}
                    />
                    <input
                      value={setTimeByArtist[artist.id] || ''}
                      placeholder="Set time"
                      onChange={(event) => setSetTimeByArtist((current) => ({ ...current, [artist.id]: event.target.value }))}
                    />
                    <button onClick={() => addArtistToEvent(artist)}>Add to event</button>
                  </div>

                  <div className="artist-admin-actions">
                    <button onClick={() => startEdit(artist)}>Edit</button>
                    <button onClick={() => archiveArtist(artist)}>Archive</button>
                    <button onClick={() => rejectArtist(artist)}>Reject</button>
                  </div>

                  {(artist.technical_needs || artist.hospitality_needs || artist.notes) && (
                    <details className="artist-more">
                      <summary>More info</summary>
                      {artist.technical_needs && <p><strong>Technical:</strong> {artist.technical_needs}</p>}
                      {artist.hospitality_needs && <p><strong>Hospitality:</strong> {artist.hospitality_needs}</p>}
                      {artist.notes && <p><strong>Notes:</strong> {artist.notes}</p>}
                    </details>
                  )}
                </div>
              </article>
            );
          })}
        </section>

        {editingArtist && editForm && (
          <div className="artist-edit-modal">
            <div className="artist-edit-card passport-card">
              <div className="artist-card-head">
                <div>
                  <p className="system-kicker">Edit submission</p>
                  <h2>{editingArtist.artist_name}</h2>
                </div>
                <button onClick={() => { setEditingArtist(null); setEditForm(null); }} className="passport-button rounded-full px-3 font-black">Close</button>
              </div>

              <div className="artist-edit-grid">
                {([
                  ['artist_name', 'Artist name'],
                  ['contact_name', 'Contact name'],
                  ['email', 'Email'],
                  ['phone', 'Phone'],
                  ['genre', 'Genre'],
                  ['preferred_fee', 'Preferred fee'],
                  ['image_url', 'Image URL'],
                  ['availability', 'Availability']
                ] as [keyof EditableArtist, string][]).map(([key, label]) => (
                  <label key={key} className="artist-field">
                    <span>{label}</span>
                    <input value={editForm[key]} onChange={(event) => setEditForm((current) => current ? { ...current, [key]: event.target.value } : current)} />
                  </label>
                ))}

                {([
                  ['description', 'Description'],
                  ['technical_needs', 'Technical needs'],
                  ['hospitality_needs', 'Hospitality needs'],
                  ['notes', 'Notes']
                ] as [keyof EditableArtist, string][]).map(([key, label]) => (
                  <label key={key} className="artist-field artist-field-wide">
                    <span>{label}</span>
                    <textarea rows={4} value={editForm[key]} onChange={(event) => setEditForm((current) => current ? { ...current, [key]: event.target.value } : current)} />
                  </label>
                ))}
              </div>

              <button onClick={saveEdit} className="artist-submit">Save changes</button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
