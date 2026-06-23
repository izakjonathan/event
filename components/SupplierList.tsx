'use client';

import { useMemo, useState } from 'react';
import { blankSupplier } from '@/lib/defaults';
import { Supplier } from '@/lib/types';
import { cleanUrl } from '@/lib/utils';
import { useEventStore } from './EventStore';
import { AppShell, Badge, Button, Card, Field, Row, Section } from './ui/AppShell';

const SUPPLIER_TYPES = ['Beverage', 'Food', 'Equipment', 'Technical', 'Cleaning', 'Marketing', 'Other'];

export default function SupplierList() {
  const { ownerKey, suppliers, saveSupplier, deleteSupplier } = useEventStore();
  const [draft, setDraft] = useState<Supplier>(() => ({ ...blankSupplier(), owner_key: ownerKey }));

  const sortedSuppliers = useMemo(
    () => [...suppliers].sort((a, b) => (a.name || 'zzz').localeCompare(b.name || 'zzz')),
    [suppliers],
  );

  const updateDraft = (key: keyof Supplier, value: string) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const saveNewSupplier = async () => {
    if (!draft.name.trim()) return;
    await saveSupplier({
      ...draft,
      owner_key: ownerKey,
      webpage: cleanUrl(draft.webpage),
    });
    setDraft({ ...blankSupplier(), owner_key: ownerKey });
  };

  const input = (label: string, value: string, onChange: (value: string) => void, type = 'text') => (
    <Field label={label}>
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} />
    </Field>
  );

  return (
    <AppShell title="Suppliers">
      <div className="space-y-5">
        <Card>
          <p className="eos-caption eos-muted">Supplier list</p>
          <h1 className="eos-heading mt-3">Suppliers</h1>
          <p className="eos-body eos-muted mt-3">Save supplier contacts, categories, labels and notes for the workspace.</p>
        </Card>

        <Section title="Add new supplier" openDefault>
          {input('Name', draft.name, (value) => updateDraft('name', value))}
          <Row>
            {input('Contact person', draft.contact_person, (value) => updateDraft('contact_person', value))}
            {input('Phone', draft.phone, (value) => updateDraft('phone', value), 'tel')}
          </Row>
          <Row>
            {input('Mail', draft.email, (value) => updateDraft('email', value), 'email')}
            {input('Webpage', draft.webpage, (value) => updateDraft('webpage', value), 'url')}
          </Row>
          <Row>
            <Field label="Type">
              <select value={draft.type} onChange={(event) => updateDraft('type', event.target.value)}>
                <option value="">Choose type</option>
                {SUPPLIER_TYPES.map((type) => (
                  <option key={type}>{type}</option>
                ))}
              </select>
            </Field>
            {input('Label', draft.label, (value) => updateDraft('label', value))}
          </Row>
          <Field label="Note">
            <textarea value={draft.note} onChange={(event) => updateDraft('note', event.target.value)} />
          </Field>
          <Button className="w-full" onClick={saveNewSupplier} disabled={!draft.name.trim()}>
            Save supplier
          </Button>
        </Section>

        <Section title="Saved suppliers" openDefault right={<Badge>{sortedSuppliers.length}</Badge>}>
          {sortedSuppliers.length === 0 && <p className="eos-body eos-muted">No suppliers saved yet.</p>}

          {sortedSuppliers.map((supplier) => (
            <SupplierCard key={supplier.id} supplier={supplier} onSave={saveSupplier} onDelete={deleteSupplier} />
          ))}
        </Section>
      </div>
    </AppShell>
  );
}

function SupplierCard({
  supplier,
  onSave,
  onDelete,
}: {
  supplier: Supplier;
  onSave: (supplier: Supplier) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [draft, setDraft] = useState(supplier);

  const update = (key: keyof Supplier, value: string) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const input = (label: string, value: string, onChange: (value: string) => void, type = 'text') => (
    <Field label={label}>
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} />
    </Field>
  );

  return (
    <Section
      title={draft.name || 'Unnamed supplier'}
      right={<Badge>{draft.label || draft.type || 'supplier'}</Badge>}
    >
      <Row>
        {input('Name', draft.name, (value) => update('name', value))}
        {input('Contact person', draft.contact_person, (value) => update('contact_person', value))}
      </Row>
      <Row>
        {input('Phone', draft.phone, (value) => update('phone', value), 'tel')}
        {input('Mail', draft.email, (value) => update('email', value), 'email')}
      </Row>
      <Row>
        {input('Webpage', draft.webpage, (value) => update('webpage', value), 'url')}
        {input('Type', draft.type, (value) => update('type', value))}
      </Row>
      {input('Label', draft.label, (value) => update('label', value))}
      <Field label="Note">
        <textarea value={draft.note} onChange={(event) => update('note', event.target.value)} />
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <Button onClick={() => onSave({ ...draft, webpage: cleanUrl(draft.webpage) })}>Save edits</Button>
        <Button kind="danger" onClick={() => onDelete(draft.id)}>Delete</Button>
      </div>
    </Section>
  );
}
