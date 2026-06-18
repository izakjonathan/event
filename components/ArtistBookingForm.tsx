'use client';

import { useMemo, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabaseClient';

type ArtistFormState = {
  artistName: string;
  contactName: string;
  email: string;
  phone: string;
  genre: string;
  description: string;
  imageUrl: string;
  instagram: string;
  spotify: string;
  soundcloud: string;
  youtube: string;
  website: string;
  availability: string;
  startTime: string;
  endTime: string;
  preferredFee: string;
  technicalNeeds: string;
  hospitalityNeeds: string;
  notes: string;
};

const emptyForm: ArtistFormState = {
  artistName: '',
  contactName: '',
  email: '',
  phone: '',
  genre: '',
  description: '',
  imageUrl: '',
  instagram: '',
  spotify: '',
  soundcloud: '',
  youtube: '',
  website: '',
  availability: '',
  startTime: '',
  endTime: '',
  preferredFee: '',
  technicalNeeds: '',
  hospitalityNeeds: '',
  notes: ''
};

const fieldLabels: Record<keyof ArtistFormState, string> = {
  artistName: 'Artist / act name',
  contactName: 'Contact name',
  email: 'Email',
  phone: 'Phone',
  genre: 'Genre / style',
  description: 'Description / bio',
  imageUrl: 'Image URL',
  instagram: 'Instagram',
  spotify: 'Spotify',
  soundcloud: 'SoundCloud',
  youtube: 'YouTube',
  website: 'Website',
  availability: 'Availability',
  startTime: 'Start time',
  endTime: 'End time',
  preferredFee: 'Preferred fee',
  technicalNeeds: 'Technical requirements',
  hospitalityNeeds: 'Hospitality requirements',
  notes: 'Notes'
};

function cleanUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  return `https://${trimmed}`;
}

export default function ArtistBookingForm() {
  const [form, setForm] = useState<ArtistFormState>(emptyForm);
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [error, setError] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');

  const canSubmit = useMemo(() => {
    return form.artistName.trim().length > 1 && form.email.trim().length > 3;
  }, [form.artistName, form.email]);

  function patch<K extends keyof ArtistFormState>(key: K, value: ArtistFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function uploadArtistImage(supabase: NonNullable<ReturnType<typeof getSupabaseClient>>) {
    if (!imageFile) return cleanUrl(form.imageUrl);

    const extension = imageFile.name.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;
    const path = `artist-images/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('artist-images')
      .upload(path, imageFile, {
        cacheControl: '3600',
        upsert: false,
        contentType: imageFile.type || 'image/jpeg'
      });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from('artist-images').getPublicUrl(path);
    return data.publicUrl;
  }

  function handleImageFile(file: File | null) {
    setImageFile(file);
    if (!file) {
      setImagePreview('');
      return;
    }
    setImagePreview(URL.createObjectURL(file));
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    if (!canSubmit) {
      setStatus('error');
      setError('Artist name and email are required.');
      return;
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      setStatus('error');
      setError('Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel.');
      return;
    }

    setStatus('sending');

    let uploadedImageUrl = '';
    try {
      uploadedImageUrl = await uploadArtistImage(supabase);
    } catch (uploadError) {
      setStatus('error');
      setError(uploadError instanceof Error ? uploadError.message : 'Image upload failed.');
      return;
    }

    const payload = {
      artist_name: form.artistName.trim(),
      contact_name: form.contactName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      genre: form.genre.trim(),
      description: form.description.trim(),
      image_url: uploadedImageUrl,
      availability: form.availability.trim(),
      availability_start_time: form.startTime.trim(),
      availability_end_time: form.endTime.trim(),
      preferred_fee: form.preferredFee.trim(),
      technical_needs: form.technicalNeeds.trim(),
      hospitality_needs: form.hospitalityNeeds.trim(),
      notes: form.notes.trim(),
      links: {
        instagram: cleanUrl(form.instagram),
        spotify: cleanUrl(form.spotify),
        soundcloud: cleanUrl(form.soundcloud),
        youtube: cleanUrl(form.youtube),
        website: cleanUrl(form.website)
      },
      status: 'new'
    };

    const { error: insertError } = await supabase.from('artist_submissions').insert(payload);

    if (insertError) {
      setStatus('error');
      setError(insertError.message);
      return;
    }

    setStatus('sent');
    setForm(emptyForm);
    setImageFile(null);
    setImagePreview('');
  }

  const input = (key: keyof ArtistFormState, type = 'text', placeholder = '') => (
    <label className="artist-field">
      <span>{fieldLabels[key]}</span>
      <input
        value={form[key]}
        type={type}
        placeholder={placeholder}
        onChange={(event) => patch(key, event.target.value)}
      />
    </label>
  );

  const area = (key: keyof ArtistFormState, rows = 4, placeholder = '') => (
    <label className="artist-field artist-field-wide">
      <span>{fieldLabels[key]}</span>
      <textarea
        value={form[key]}
        rows={rows}
        placeholder={placeholder}
        onChange={(event) => patch(key, event.target.value)}
      />
    </label>
  );

  return (
    <main className="public-artist-page artist-booking-scale-fixed no-callout min-h-dvh bg-[var(--paper)] text-[var(--ink)]">
      <div className="artist-public-wrap">
        <section className="artist-public-hero passport-card">
          <p className="system-kicker">Artist booking</p>
          <h1>Artist submission</h1>
          <p>
            Share your artist profile, links, availability and requirements so we can review you for upcoming events.
          </p>
        </section>

        <form onSubmit={submit} className="artist-form artist-form-public passport-card">
          <div className="artist-form-section">
            <p className="artist-section-title">Main info</p>
            <div className="artist-form-grid">
              {input('artistName', 'text', 'Artist name')}
              {input('contactName', 'text', 'Your name')}
              {input('email', 'email', 'name@email.com')}
              {input('phone', 'tel', '+45 ...')}
              {input('genre', 'text', 'DJ, live band, singer-songwriter...')}
              {input('preferredFee', 'text', 'Fee / price range')}
              {area('description', 5, 'Tell us about your sound, experience and what kind of events you fit.')}
              {area('availability', 4, 'Specific dates, weekdays, months or periods you are available.')}
              {input('startTime', 'time')}
              {input('endTime', 'time')}
            </div>
          </div>

          <div className="artist-form-section">
            <p className="artist-section-title">Image + links</p>
            <div className="artist-form-grid">
              <label className="artist-field artist-upload-field">
                <span>Artist image upload</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => handleImageFile(event.target.files?.[0] || null)}
                />
                {(imagePreview || form.imageUrl) && (
                  <div className="artist-upload-preview">
                    <img src={imagePreview || form.imageUrl} alt="" />
                  </div>
                )}
              </label>
              {input('imageUrl', 'url', 'Optional image URL instead')}
              {input('instagram', 'text', 'instagram.com/...')}
              {input('spotify', 'text', 'open.spotify.com/...')}
              {input('soundcloud', 'text', 'soundcloud.com/...')}
              {input('youtube', 'text', 'youtube.com/...')}
              {input('website', 'text', 'your website')}
            </div>
          </div>

          <div className="artist-form-section">
            <p className="artist-section-title">Requirements</p>
            <div className="artist-form-grid">
              {area('technicalNeeds', 4, 'Equipment, stage, sound, setup time, DJ gear, microphones etc.')}
              {area('hospitalityNeeds', 4, 'Drinks, food, backstage, guestlist or other needs.')}
              {area('notes', 4, 'Anything else we should know.')}
            </div>
          </div>

          {status === 'error' && <div className="artist-message artist-message-error">{error}</div>}
          {status === 'sent' && (
            <div className="artist-success-card">
              <p className="system-kicker">Submitted</p>
              <h2>Thanks — your artist info has been sent.</h2>
              <p>We can now review your profile, links, availability and requirements for future events.</p>
              <button type="button" onClick={() => setStatus('idle')}>Submit another artist</button>
            </div>
          )}

          <button className="artist-submit" disabled={status === 'sending'}>
            {status === 'sending' ? 'Submitting…' : 'Submit artist info'}
          </button>
        </form>
      </div>
    </main>
  );
}
