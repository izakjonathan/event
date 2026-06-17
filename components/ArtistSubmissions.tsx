'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { getSupabaseClient } from '@/lib/supabaseClient';

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

    setItems((data || []) as ArtistSubmission[]);
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
