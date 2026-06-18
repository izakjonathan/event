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
  startTime?: string;
  endTime?: string;
  setTime?: string;
  status: string;
  notes: string;
};

type EventMeta = {
  name?: string;
  date?: string;
  endDate?: string;
  location?: string;
  time?: string;
  endTime?: string;
  status?: string;
};

type EventPayload = {
  id?: string;
  meta?: EventMeta;
  artists?: EventArtist[];
  [key: string]: unknown;
};

type EventRow = {
  id: string;
  name: string;
  event_date: string | null;
  payload: EventPayload | null;
  updated_at: string;
};

function formatDate(value?: string | null) {
  if (!value) return 'No date';
  try {
    return new Intl.DateTimeFormat('da-DK', { weekday: 'short', day: '2-digit', month: '2-digit', year: '2-digit' }).format(new Date(value));
  } catch {
    return value;
  }
}

function shortDate(value?: string | null) {
  if (!value) return '';
  try {
    return new Intl.DateTimeFormat('da-DK', { day: '2-digit', month: '2-digit' }).format(new Date(value));
  } catch {
    return value;
  }
}

function statusLabel(value?: string) {
  if (!value) return 'idea';
  return value.replace(/^\w/, (char) => char.toUpperCase());
}

function money(value: number) {
  return `${new Intl.NumberFormat('da-DK', { maximumFractionDigits: 0 }).format(Math.round(value || 0))} DKK`;
}

function eventName(event: EventRow) {
  return event.name || event.payload?.meta?.name || 'Untitled event';
}

function eventMeta(event: EventRow): EventMeta {
  return event.payload?.meta || {};
}

function eventArtists(event: EventRow) {
  return Array.isArray(event.payload?.artists) ? event.payload.artists : [];
}

function eventWarnings(event: EventRow) {
  const meta = eventMeta(event);
  const artists = eventArtists(event);
  const warnings: string[] = [];

  if (!meta.date && !event.event_date) warnings.push('No date');
  if (!meta.location) warnings.push('No location');
  if (!artists.length) warnings.push('No artist');
  artists.forEach((artist) => {
    if (!artist.startTime && !artist.setTime) warnings.push(`${artist.artistName || 'Artist'}: no start time`);
    if (!artist.endTime && !artist.setTime) warnings.push(`${artist.artistName || 'Artist'}: no end time`);
    if (!artist.fee) warnings.push(`${artist.artistName || 'Artist'}: no fee`);
  });

  return warnings;
}

function sortEvents(a: EventRow, b: EventRow) {
  const ad = eventMeta(a).date || a.event_date || '9999-12-31';
  const bd = eventMeta(b).date || b.event_date || '9999-12-31';
  return ad.localeCompare(bd);
}

export default function EventCalendar() {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [copied, setCopied] = useState(false);

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
      .from('event_plans')
      .select('id,name,event_date,payload,updated_at')
      .order('event_date', { ascending: true, nullsFirst: false });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    setEvents((data || []) as EventRow[]);
    setLoading(false);
  }

  async function copyArtistFormLink() {
    const url = `${window.location.origin}/artist-booking`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setMessage('Artist form link copied.');
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setMessage(url);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const sortedEvents = useMemo(() => [...events].sort(sortEvents), [events]);
  const confirmedEvents = events.filter((event) => eventMeta(event).status === 'confirmed').length;
  const totalArtists = events.reduce((sum, event) => sum + eventArtists(event).length, 0);
  const totalWarnings = events.reduce((sum, event) => sum + eventWarnings(event).length, 0);

  return (
    <main className="system-shell no-callout min-h-dvh bg-[var(--paper)] text-[var(--ink)]">
      <div className="system-wrap">
        <div className="calendar-top-nav">
          <Link href="/" className="passport-button top-nav-pill min-h-[46px] rounded-full px-2 text-center backdrop-blur">
            <span className="block text-[8px] font-bold uppercase leading-none tracking-[.13em] opacity-65">System</span>
            <strong className="block text-[12.5px] font-black leading-[1.02] tracking-[-.035em]">Dashboard</strong>
          </Link>
          <Link href="/event-planner" className="passport-button top-nav-pill min-h-[46px] rounded-full px-2 text-center backdrop-blur">
            <span className="block text-[8px] font-bold uppercase leading-none tracking-[.13em] opacity-65">Open</span>
            <strong className="block text-[12.5px] font-black leading-[1.02] tracking-[-.035em]">Planner</strong>
          </Link>
          <Link href="/artists" className="passport-button top-nav-pill min-h-[46px] rounded-full px-2 text-center backdrop-blur">
            <span className="block text-[8px] font-bold uppercase leading-none tracking-[.13em] opacity-65">Open</span>
            <strong className="block text-[12.5px] font-black leading-[1.02] tracking-[-.035em]">Artists</strong>
          </Link>
          <button onClick={copyArtistFormLink} className="passport-button top-nav-pill min-h-[46px] rounded-full px-2 text-center backdrop-blur">
            <span className="block text-[8px] font-bold uppercase leading-none tracking-[.13em] opacity-65">Public</span>
            <strong className="block text-[12.5px] font-black leading-[1.02] tracking-[-.035em]">{copied ? 'Copied' : 'Copy link'}</strong>
          </button>
        </div>

        <section className="system-hero passport-card">
          <div>
            <p className="system-kicker">Calendar / schedule</p>
            <h1>Event schedule</h1>
            <p className="system-intro">
              See events, linked artists, set times and missing information in one overview.
            </p>
          </div>
        </section>

        <section className="calendar-stats-grid">
          <div className="booking-overview-card passport-card">
            <span>Events</span>
            <strong>{events.length}</strong>
          </div>
          <div className="booking-overview-card passport-card">
            <span>Confirmed</span>
            <strong>{confirmedEvents}</strong>
          </div>
          <div className="booking-overview-card passport-card">
            <span>Artists</span>
            <strong>{totalArtists}</strong>
          </div>
          <div className="booking-overview-card passport-card">
            <span>Warnings</span>
            <strong>{totalWarnings}</strong>
          </div>
        </section>

        {message && <div className="artist-message">{message}</div>}
        {loading && <div className="artist-message">Loading schedule…</div>}
        {!loading && !events.length && <div className="artist-message">No events found yet.</div>}

        <section className="calendar-list">
          {sortedEvents.map((event) => {
            const meta = eventMeta(event);
            const artists = eventArtists(event);
            const warnings = eventWarnings(event);
            const date = meta.date || event.event_date;
            const endDate = meta.endDate;
            const timeText = [meta.time, meta.endTime].filter(Boolean).join(' – ');

            return (
              <article key={event.id} className="calendar-event-card passport-card">
                <div className="calendar-date-block">
                  <span>{date ? shortDate(date) : '—'}</span>
                  {endDate && endDate !== date && <em>→ {shortDate(endDate)}</em>}
                </div>

                <div className="calendar-event-main">
                  <div className="calendar-event-head">
                    <div>
                      <p className="system-kicker">{statusLabel(meta.status)}</p>
                      <h2>{eventName(event)}</h2>
                    </div>
                    <Link href={`/event-planner?workspace=main-workspace`} className="calendar-small-button">Open event</Link>
                  </div>

                  <div className="calendar-meta-row">
                    <span>{formatDate(date)}</span>
                    <span>{timeText || 'No event time'}</span>
                    <span>{meta.location || 'No location'}</span>
                  </div>

                  <div className="calendar-artist-list">
                    {!artists.length ? (
                      <div className="calendar-empty-artist">No artists linked</div>
                    ) : (
                      artists.map((artist) => (
                        <div key={artist.id} className="calendar-artist-row">
                          {artist.imageUrl ? <img src={artist.imageUrl} alt="" /> : <div className="calendar-artist-placeholder" />}
                          <div>
                            <strong>{artist.artistName || 'Unnamed artist'}</strong>
                            <span>{[artist.genre, artist.status].filter(Boolean).join(' · ') || 'Artist'}</span>
                          </div>
                          <em>{artist.startTime || artist.setTime || '—'}{(artist.endTime || artist.setTime) ? ` – ${artist.endTime || artist.setTime}` : ''}</em>
                          <b>{artist.fee ? money(artist.fee) : 'No fee'}</b>
                        </div>
                      ))
                    )}
                  </div>

                  {warnings.length > 0 && (
                    <div className="calendar-warning-row">
                      {warnings.map((warning) => <span key={warning}>{warning}</span>)}
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </section>
      </div>
    </main>
  );
}
