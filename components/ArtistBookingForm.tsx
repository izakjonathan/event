'use client';

import { type FormEvent, useState } from 'react';
import { blankSubmission, id } from '@/lib/defaults';
import { supabase } from '@/lib/supabaseClient';
import { cleanUrl, fileToDataUrl } from '@/lib/utils';
import { useEventStore } from './EventStore';
import { AppShell, Badge, Button, Card, Field, Row } from './ui/AppShell';

const LINK_FIELDS = ['instagram', 'spotify', 'soundcloud', 'youtube', 'website'] as const;

export default function ArtistBookingForm() {
  const { createArtist, usingLocal } = useEventStore();
  const [form, setForm] = useState(blankSubmission());
  const [message, setMessage] = useState('');

  const setValue = (key: string, value: any) => setForm((current) => ({ ...current, [key]: value }));
  const setLink = (key: string, value: string) => setForm((current) => ({ ...current, links: { ...current.links, [key]: cleanUrl(value) } }));

  async function uploadImage(file?: File) {
    if (!file) return;

    try {
      if (supabase) {
        const path = `${id()}-${file.name}`;
        const upload = await supabase.storage.from('artist-images').upload(path, file, { upsert: true });
        if (upload.error) throw upload.error;

        const { data } = supabase.storage.from('artist-images').getPublicUrl(path);
        setValue('image_url', data.publicUrl);
        return;
      }

      setValue('image_url', await fileToDataUrl(file));
    } catch (error: any) {
      setValue('image_url', await fileToDataUrl(file));
      setMessage(`Image stored locally. Upload failed: ${error?.message || ''}`);
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();

    try {
      await createArtist({
        ...form,
        id: id(),
        status: 'new',
        preferred_fee: Number(form.preferred_fee) || 0,
        links: Object.fromEntries(Object.entries(form.links).map(([key, value]) => [key, cleanUrl(String(value || ''))])),
      });

      setForm(blankSubmission());
      setMessage('Submission received. Thank you.');
    } catch (error: any) {
      setMessage(`Submission failed: ${error?.message || 'Unknown error'}`);
    }
  }

  const input = (label: string, key: string, type = 'text') => (
    <Field label={label}>
      <input
        required={['artist_name', 'email'].includes(key)}
        type={type}
        value={(form as any)[key] ?? ''}
        onChange={(event) => setValue(key, type === 'number' ? Number(event.target.value) : event.target.value)}
      />
    </Field>
  );

  return (
    <AppShell title="Artist Booking" actions={<Badge tone={usingLocal ? 'warn' : 'ok'}>{usingLocal ? 'Local' : 'Live'}</Badge>}>
      <form onSubmit={submit} className="space-y-5">
        <Card>
          <p className="text-sm eos-muted">Public submission form</p>
          <h2 className="eos-heading mt-2">Apply to play</h2>
          <p className="mt-3 text-sm eos-muted">Send artist details, links, image, availability, technical needs and preferred fee.</p>
          {message && <p className="mt-4 rounded-2xl border eos-border eos-panel p-3 text-sm">{message}</p>}
        </Card>

        <Card className="space-y-3">
          <Row>
            {input('Artist name', 'artist_name')}
            {input('Contact name', 'contact_name')}
          </Row>
          <Row>
            {input('Email', 'email', 'email')}
            {input('Phone', 'phone', 'tel')}
          </Row>
          {input('Genre', 'genre')}
          <Field label="Description">
            <textarea value={form.description} onChange={(event) => setValue('description', event.target.value)} />
          </Field>
          <Field label="Artist image">
            <label className="block cursor-pointer rounded-[22px] border border-dashed eos-border eos-panel p-4 text-center text-sm eos-muted">
              <span>Upload artist image</span>
              <input className="sr-only" type="file" accept="image/*" onChange={(event) => uploadImage(event.target.files?.[0])} />
            </label>
            {form.image_url && <img src={form.image_url} className="mt-3 h-44 w-full rounded-[24px] object-cover" alt="Artist preview" />}
          </Field>
        </Card>

        <Card className="space-y-3">
          <h3 className="eos-card-heading">Links</h3>
          {LINK_FIELDS.map((key) => (
            <Field key={key} label={key}>
              <input value={(form.links as any)[key] || ''} onChange={(event) => setLink(key, event.target.value)} />
            </Field>
          ))}
        </Card>

        <Card className="space-y-3">
          <h3 className="eos-card-heading">Availability and needs</h3>
          {input('Availability date/text', 'availability')}
          <Row>
            {input('Start time', 'availability_start_time', 'time')}
            {input('End time', 'availability_end_time', 'time')}
          </Row>
          {input('Preferred fee', 'preferred_fee', 'number')}
          <Field label="Technical needs">
            <textarea value={form.technical_needs} onChange={(event) => setValue('technical_needs', event.target.value)} />
          </Field>
          <Field label="Hospitality needs">
            <textarea value={form.hospitality_needs} onChange={(event) => setValue('hospitality_needs', event.target.value)} />
          </Field>
          <Field label="Notes">
            <textarea value={form.notes} onChange={(event) => setValue('notes', event.target.value)} />
          </Field>
          <Button type="submit" className="w-full">
            Submit artist
          </Button>
        </Card>
      </form>
    </AppShell>
  );
}
