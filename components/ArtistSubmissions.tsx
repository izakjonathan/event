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

const statuses = ['new', 'interested', 'contacted', 'booked', 'rejected', 'archived'];

function parseFee(value: string | null) {
  if (!value) return 0;
  const match = value.replace(',', '.').match(/\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : 0;
}

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat('da-DK', { day: '2-digit', month: '2-digit', year: '2-digit' }).format(new Date(value));
  } catch {
    return value;
  }
}

export default function ArtistSubmissions() {
  const [items, setItems] = useState<ArtistSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [filter, setFilter] = useState('all');
  const [events, setEvents] = useState<EventPlanRow[]>([]);
  const [selectedEventByArtist, setSelectedEventByArtist] = useState<Record<string, string>>({});
  const [artistFeeByArtist, setArtistFeeByArtist] = useState<Record<string, string>>({});
  const [setTimeByArtist, setSetTimeByArtist] = useState<Record<string, string>>({});

  async function load() {
    setLoading(true);
    setMessage('');
    const supabase = getSupabaseClient();

    if (!supabase) {
      setMessage('Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel.');
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('artist_submissions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      setMessage(error.message);
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

  async function updateStatus(id: string, status: string) {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    setItems((current) => current.map((item) => item.id === id ? { ...item, status } : item));
    const { error } = await supabase.from('artist_submissions').update({ status }).eq('id', id);
    if (error) {
      setMessage(error.message);
      load();
    }
  }

  async function addArtistToEvent(artist: ArtistSubmission) {
    const eventId = selectedEventByArtist[artist.id];
    if (!eventId) {
      setMessage('Choose an event first.');
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
      setMessage(readError?.message || 'Could not load selected event.');
      return;
    }

    const payload = (row as EventPlanRow).payload || {};
    const existingArtists = Array.isArray(payload.artists) ? payload.artists : [];
    const alreadyAdded = existingArtists.some((item) => item.sourceSubmissionId === artist.id);

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
      artists: alreadyAdded
        ? existingArtists.map((item) => item.sourceSubmissionId === artist.id ? { ...item, ...nextArtist, id: item.id } : item)
        : [...existingArtists, nextArtist],
      updatedAt: new Date().toISOString()
    };

    const { error: updateError } = await supabase
      .from('event_plans')
      .update({ payload: nextPayload, updated_at: new Date().toISOString() })
      .eq('id', eventId);

    if (updateError) {
      setMessage(updateError.message);
      return;
    }

    await updateStatus(artist.id, 'booked');
    setMessage(`${artist.artist_name} added to ${(row as EventPlanRow).name || 'event'}.`);
    load();
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    if (filter === 'all') return items;
    return items.filter((item) => item.status === filter);
  }, [filter, items]);

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
              Review submitted artists, update status and use the information later inside event plans.
            </p>
          </div>
          <div className="system-status-pill">
            <span>Total</span>
            <strong>{items.length}</strong>
          </div>
        </section>

        <section className="artist-filter-row">
          <button onClick={() => setFilter('all')} className={filter === 'all' ? 'active' : ''}>All</button>
          {statuses.map((status) => (
            <button key={status} onClick={() => setFilter(status)} className={filter === status ? 'active' : ''}>
              {status}
            </button>
          ))}
        </section>

        {message && <div className="artist-message artist-message-error">{message}</div>}
        {loading && <div className="artist-message">Loading submissions…</div>}
        {!loading && filtered.length === 0 && <div className="artist-message">No artist submissions found.</div>}

        <section className="artist-submission-grid">
          {filtered.map((artist) => (
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
                        {event.name || event.payload?.meta?.name || 'Untitled event'}{event.event_date ? ` · ${formatDate(event.event_date)}` : ''}
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
          ))}
        </section>
      </div>
    </main>
  );
}
