'use client';

import { useEffect, useMemo, useState } from 'react';
import { AppShell, Badge, Button, Card, Field, Stat } from './ui/AppShell';
import { useEventStore } from './EventStore';
import { supabase, supabaseReady } from '@/lib/supabaseClient';
import {
  applyTheme,
  ColorKey,
  DAY_THEME,
  NIGHT_THEME,
  normalizeTheme,
  readSavedTheme,
  Theme,
  ThemeMode,
  TypographyKey,
  TYPOGRAPHY_KEYS,
} from '@/lib/theme';

type NamedTheme = Theme & {
  id?: string;
  name: string;
  custom?: boolean;
  synced?: boolean;
};

type TypographyGroup = {
  id: 'display' | 'heading' | 'title' | 'body' | 'caption' | 'button' | 'metric';
  name: string;
  sample: string;
  sizeKey: TypographyKey;
  weightKey: TypographyKey;
  trackKey: TypographyKey;
  transformKey: TypographyKey;
};

const DEFAULT_THEME = NIGHT_THEME;
const LOCAL_PRESETS_KEY = 'eos-ui-custom-presets';
const THEME_STORAGE_KEY = 'eos-ui-theme';
const FONT_STACK_OPTIONS = [
  "'Inter', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  "'Space Grotesk', 'Inter', ui-sans-serif, system-ui, sans-serif",
  "Arial, Helvetica, sans-serif",
  "Georgia, 'Times New Roman', serif",
  "'Courier New', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
];
const WEIGHT_OPTIONS = ['300', '400', '500', '560', '620', '680', '700', '800', '900'];
const TRANSFORM_OPTIONS = [
  ['none', 'Off'],
  ['uppercase', 'Caps on'],
] as const;

const BUILT_IN_PRESETS: NamedTheme[] = [
  { name: 'Onyx monograph', ...NIGHT_THEME },
  { name: 'Paper monograph', ...DAY_THEME },
  {
    name: 'Inverse catalogue',
    ...NIGHT_THEME,
    background: '#191919',
    content: '#191919',
    surface: '#000000',
    text: '#ffffff',
    muted: '#808080',
    accent: '#ffffff',
    border: '#808080',
    'border-strong': '#ffffff',
    'dock-active': '#000000',
  },
  {
    name: 'White index',
    ...DAY_THEME,
    background: '#ffffff',
    content: '#ffffff',
    surface: '#ffffff',
    text: '#000000',
    muted: '#808080',
    accent: '#000000',
    border: '#191919',
    'border-strong': '#000000',
    'dock-active': '#ffffff',
  },
];

const COLOR_TOKENS = [
  ['background', 'Background color', 'Full app canvas behind every module.'],
  ['content', 'Content color', 'Main cards, panels, dock and inputs.'],
  ['surface', 'Surface color', 'Stat blocks, inactive dock icons and nested panels.'],
  ['text', 'Text color', 'Main titles, body text and field text.'],
  ['muted', 'Muted color', 'Labels, helper text and inactive navigation.'],
  ['accent', 'Accent color', 'Primary buttons and highlighted actions.'],
  ['border', 'Border color', 'Default muted borders across the app.'],
  ['border-strong', 'Focus border color', 'Stronger border used for focused inputs.'],
  ['dock-active', 'Dock active color', 'Selected item background in the floating dock.'],
  ['success', 'Success color', 'Ready and positive status badges.'],
  ['warning', 'Warning color', 'Warnings and missing information.'],
  ['danger', 'Danger color', 'Delete, archive and overdue states.'],
  ['shadow', 'Shadow color', 'Subtle elevation behind cards and dock.'],
] as const satisfies readonly (readonly [ColorKey, string, string])[];

const TYPOGRAPHY_GROUPS: TypographyGroup[] = [
  { id: 'display', name: 'Display', sample: 'EventOS', sizeKey: 'type-display-size', weightKey: 'type-display-weight', trackKey: 'type-display-track', transformKey: 'type-display-transform' },
  { id: 'heading', name: 'Heading', sample: 'Operational event card', sizeKey: 'type-heading-size', weightKey: 'type-heading-weight', trackKey: 'type-heading-track', transformKey: 'type-heading-transform' },
  { id: 'title', name: 'Title', sample: 'Scenario planning', sizeKey: 'type-title-size', weightKey: 'type-title-weight', trackKey: 'type-title-track', transformKey: 'type-title-transform' },
  { id: 'body', name: 'Body', sample: 'Fast event planning and operational review.', sizeKey: 'type-body-size', weightKey: 'type-body-weight', trackKey: 'type-body-track', transformKey: 'type-body-transform' },
  { id: 'caption', name: 'Caption / labels', sample: 'TICKETS SOLD', sizeKey: 'type-caption-size', weightKey: 'type-caption-weight', trackKey: 'type-caption-track', transformKey: 'type-caption-transform' },
  { id: 'button', name: 'Buttons', sample: 'Primary action', sizeKey: 'type-button-size', weightKey: 'type-button-weight', trackKey: 'type-button-track', transformKey: 'type-button-transform' },
  { id: 'metric', name: 'Metric numbers', sample: '12.450 DKK', sizeKey: 'type-metric-size', weightKey: 'type-metric-weight', trackKey: 'type-metric-track', transformKey: 'type-metric-transform' },
];

function fallbackId() {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
}

function dbRowToPreset(row: any): NamedTheme | null {
  if (!row || typeof row.name !== 'string') return null;
  return {
    ...normalizeTheme(row.payload || {}),
    id: row.id,
    name: row.name.trim() || 'Saved preset',
    custom: true,
    synced: true,
  };
}

function readLocalPresets(): NamedTheme[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = JSON.parse(localStorage.getItem(LOCAL_PRESETS_KEY) || '[]');
    if (!Array.isArray(raw)) return [];
    return raw
      .map((item) => {
        if (!item || typeof item.name !== 'string') return null;
        return {
          ...normalizeTheme(item),
          id: item.id || fallbackId(),
          name: item.name.trim() || 'Saved preset',
          custom: true,
          synced: false,
        } satisfies NamedTheme;
      })
      .filter(Boolean) as NamedTheme[];
  } catch {
    localStorage.removeItem(LOCAL_PRESETS_KEY);
    return [];
  }
}

function writeLocalPresets(presets: NamedTheme[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LOCAL_PRESETS_KEY, JSON.stringify(presets));
}

function numberValue(value: string, unit: 'px' | 'em') {
  return String(value).replace(unit, '');
}

export default function UIStudio() {
  const { ownerKey } = useEventStore();
  const [theme, setTheme] = useState<Theme>(DEFAULT_THEME);
  const [saved, setSaved] = useState(false);
  const [customPresets, setCustomPresets] = useState<NamedTheme[]>([]);
  const [presetName, setPresetName] = useState('');
  const [presetStatus, setPresetStatus] = useState(supabaseReady ? 'Loading shared presets…' : 'Supabase not configured. Presets are local on this device.');

  useEffect(() => {
    const stored = readSavedTheme();
    setTheme(stored);
    applyTheme(stored);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadPresets() {
      if (!supabase) {
        const localPresets = readLocalPresets();
        if (!cancelled) {
          setCustomPresets(localPresets);
          setPresetStatus('Supabase not configured. Presets are local on this device.');
        }
        return;
      }

      try {
        const { data, error } = await supabase
          .from('ui_studio_presets')
          .select('*')
          .eq('owner_key', ownerKey)
          .order('updated_at', { ascending: false });

        if (error) throw error;
        const syncedPresets = (data || []).map(dbRowToPreset).filter(Boolean) as NamedTheme[];
        if (!cancelled) {
          setCustomPresets(syncedPresets);
          setPresetStatus(syncedPresets.length ? 'Shared presets loaded from Supabase.' : 'No shared presets saved yet.');
        }
      } catch (error: any) {
        const localPresets = readLocalPresets();
        if (!cancelled) {
          setCustomPresets(localPresets);
          setPresetStatus(`Supabase presets unavailable. Using local fallback. ${error?.message || ''}`.trim());
        }
      }
    }

    loadPresets();
    return () => {
      cancelled = true;
    };
  }, [ownerKey]);

  const presets = useMemo(() => [...BUILT_IN_PRESETS, ...customPresets], [customPresets]);

  const flashSaved = () => {
    setSaved(true);
    window.setTimeout(() => setSaved(false), 900);
  };

  const commit = (nextTheme: Theme) => {
    const next = normalizeTheme(nextTheme);
    setTheme(next);
    applyTheme(next);
    localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(next));
    flashSaved();
  };

  const updateColor = (key: ColorKey, value: string) => {
    commit({ ...theme, [key]: value });
  };

  const updateTypography = (key: TypographyKey, value: string) => {
    commit({ ...theme, [key]: value });
  };

  const setMode = (mode: ThemeMode) => {
    const base = normalizeTheme(mode === 'day' ? DAY_THEME : NIGHT_THEME);
    const next = { ...base, mode };
    for (const key of TYPOGRAPHY_KEYS) {
      next[key] = theme[key];
    }
    commit(next);
  };

  const reset = () => commit(DEFAULT_THEME);

  const saveCurrentPreset = async () => {
    const name = presetName.trim() || `Preset ${customPresets.length + 1}`;
    const id = fallbackId();
    const nextPreset: NamedTheme = { ...normalizeTheme(theme), id, name, custom: true, synced: Boolean(supabase) };

    if (supabase) {
      try {
        const { data, error } = await supabase.from('ui_studio_presets').upsert({
          id,
          owner_key: ownerKey,
          name,
          payload: normalizeTheme(theme),
          updated_at: new Date().toISOString(),
        });
        if (error) throw error;
        const synced = dbRowToPreset(Array.isArray(data) ? data[0] : data) || nextPreset;
        setCustomPresets((current) => [synced, ...current.filter((preset) => preset.name.toLowerCase() !== name.toLowerCase())].slice(0, 30));
        setPresetStatus('Preset saved to Supabase and available on all devices.');
        setPresetName('');
        flashSaved();
        return;
      } catch (error: any) {
        setPresetStatus(`Supabase save failed. Saved locally as fallback. ${error?.message || ''}`.trim());
      }
    }

    const nextPresets = [nextPreset, ...customPresets.filter((preset) => preset.name.toLowerCase() !== name.toLowerCase())].slice(0, 30);
    setCustomPresets(nextPresets);
    writeLocalPresets(nextPresets);
    setPresetName('');
    flashSaved();
  };

  const deleteCustomPreset = async (preset: NamedTheme) => {
    setCustomPresets((current) => current.filter((item) => item.id !== preset.id && item.name !== preset.name));
    if (supabase && preset.id) {
      const { error } = await supabase.from('ui_studio_presets').delete().eq('id', preset.id);
      setPresetStatus(error ? `Delete failed in Supabase. ${error.message || ''}`.trim() : 'Preset deleted from Supabase.');
      return;
    }
    const nextLocal = readLocalPresets().filter((item) => item.id !== preset.id && item.name !== preset.name);
    writeLocalPresets(nextLocal);
    setPresetStatus('Local preset deleted.');
  };

  return (
    <AppShell title="UI Studio">
      <div className="space-y-5">
        <Card className="overflow-hidden">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="eos-caption eos-muted">Design system</p>
              <h1 className="eos-display mt-4">UI Studio</h1>
              <p className="mt-4 max-w-[28ch] eos-body eos-muted">
                Change shared color and typography tokens. Presets save both color and typography settings.
              </p>
            </div>
            <Badge tone={saved ? 'ok' : 'neutral'}>{saved ? 'Saved' : 'Live'}</Badge>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-2">
            <Stat label="Mode" value={theme.mode} />
            <Stat label="Body" value={theme['type-body-size']} />
            <Stat label="Display" value={theme['type-display-weight']} />
            <Stat label="Caps" value={theme['type-caption-transform'] === 'uppercase' ? 'On' : 'Off'} />
          </div>
        </Card>

        <Card>
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="eos-caption eos-muted">Appearance</p>
              <h2 className="eos-title mt-2">Day / night mode</h2>
            </div>
            <Button kind="ghost" onClick={reset}>Reset all</Button>
          </div>

          <div className="eos-panel mt-5 grid grid-cols-2 gap-2 rounded-[26px] border p-2">
            {(['night', 'day'] as ThemeMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setMode(mode)}
                className={`rounded-[20px] border px-4 py-4 text-left ${theme.mode === mode ? 'eos-primary' : 'eos-surface'}`}
              >
                <span className="eos-body block">{mode === 'night' ? 'Night' : 'Day'}</span>
                <span className="mt-1 block eos-caption opacity-70">{mode === 'night' ? 'Dark canvas and light text.' : 'Light canvas and dark text.'}</span>
              </button>
            ))}
          </div>
        </Card>

        <Card>
          <p className="eos-caption eos-muted">Editable typography</p>
          <h2 className="eos-title mt-2">Typography</h2>
          <p className="mt-3 eos-body eos-muted">Controls are global. Presets include these typography values.</p>

          <div className="mt-5 grid gap-3">
            <Field label="Display font stack">
              <select value={theme['type-display-font']} onChange={(event) => updateTypography('type-display-font', event.target.value)}>
                {FONT_STACK_OPTIONS.map((font) => <option key={font} value={font}>{font}</option>)}
              </select>
            </Field>
            <Field label="UI / body font stack">
              <select value={theme['type-ui-font']} onChange={(event) => updateTypography('type-ui-font', event.target.value)}>
                {FONT_STACK_OPTIONS.map((font) => <option key={font} value={font}>{font}</option>)}
              </select>
            </Field>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <Field label="Event logo weight">
              <select value={theme['type-logo-event-weight']} onChange={(event) => updateTypography('type-logo-event-weight', event.target.value)}>
                {WEIGHT_OPTIONS.map((weight) => <option key={weight} value={weight}>{weight}</option>)}
              </select>
            </Field>
            <Field label="OS logo weight">
              <select value={theme['type-logo-os-weight']} onChange={(event) => updateTypography('type-logo-os-weight', event.target.value)}>
                {WEIGHT_OPTIONS.map((weight) => <option key={weight} value={weight}>{weight}</option>)}
              </select>
            </Field>
          </div>

          <div className="mt-5 space-y-4">
            {TYPOGRAPHY_GROUPS.map((group) => (
              <div key={group.id} className="eos-panel rounded-[26px] border p-3">
                <div className="mb-3">
                  <p className="eos-caption eos-muted">{group.name}</p>
                  <div className={`mt-2 ${group.id === 'display' ? 'eos-display' : group.id === 'heading' ? 'eos-heading' : group.id === 'metric' ? 'eos-stat-value' : group.id === 'caption' ? 'eos-caption' : group.id === 'button' ? 'eos-button' : group.id === 'body' ? 'eos-body' : 'eos-title'}`}>
                    {group.sample}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Size px">
                    <input
                      type="number"
                      min="8"
                      max="96"
                      value={numberValue(theme[group.sizeKey], 'px')}
                      onChange={(event) => updateTypography(group.sizeKey, `${event.target.value || 0}px`)}
                    />
                  </Field>
                  <Field label="Weight">
                    <select value={theme[group.weightKey]} onChange={(event) => updateTypography(group.weightKey, event.target.value)}>
                      {WEIGHT_OPTIONS.map((weight) => <option key={weight} value={weight}>{weight}</option>)}
                    </select>
                  </Field>
                  <Field label="Letter spacing em">
                    <input
                      type="number"
                      step="0.005"
                      min="-0.2"
                      max="0.2"
                      value={numberValue(theme[group.trackKey], 'em')}
                      onChange={(event) => updateTypography(group.trackKey, `${event.target.value || 0}em`)}
                    />
                  </Field>
                  <Field label="Caps">
                    <select value={theme[group.transformKey]} onChange={(event) => updateTypography(group.transformKey, event.target.value)}>
                      {TRANSFORM_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                    </select>
                  </Field>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <p className="eos-caption eos-muted">Editable colors</p>
          <h2 className="eos-title mt-2">Colors</h2>

          <div className="mt-5 space-y-4">
            {COLOR_TOKENS.map(([key, label, description]) => (
              <div key={key} className="eos-panel rounded-[26px] border p-3">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <h3 className="eos-title">{label}</h3>
                    <p className="mt-1 eos-body eos-muted">{description}</p>
                  </div>
                  <div className="h-10 w-10 shrink-0 rounded-full border eos-border" style={{ background: theme[key] }} />
                </div>
                <div className="grid grid-cols-[64px_1fr] gap-3">
                  <input aria-label={label} className="eos-color-input" type="color" value={theme[key]} onChange={(event) => updateColor(key, event.target.value)} />
                  <Field label="Hex value">
                    <input value={theme[key]} onChange={(event) => updateColor(key, event.target.value)} />
                  </Field>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="eos-caption eos-muted">Presets</p>
              <h2 className="eos-title mt-2">Shared themes</h2>
            </div>
            <Badge tone="neutral">{customPresets.length} shared</Badge>
          </div>
          <p className="mt-3 eos-body eos-muted">{presetStatus}</p>

          <div className="eos-panel mt-4 rounded-[24px] border p-3">
            <Field label="Preset name">
              <input value={presetName} placeholder={`Preset ${customPresets.length + 1}`} onChange={(event) => setPresetName(event.target.value)} />
            </Field>
            <Button className="mt-3 w-full" kind="primary" onClick={saveCurrentPreset}>Save current theme to Supabase</Button>
          </div>

          <div className="mt-4 space-y-2">
            {presets.map((preset) => (
              <div key={`${preset.custom ? 'custom' : 'built-in'}-${preset.id || preset.name}`} className="eos-panel rounded-[24px] border p-3">
                <button type="button" onClick={() => commit(normalizeTheme(preset))} className="flex w-full items-center justify-between gap-3 text-left">
                  <span>
                    <span className="eos-body block eos-text">{preset.name}</span>
                    <span className="mt-1 block eos-caption eos-muted">
                      {preset.custom ? (preset.synced ? 'supabase' : 'local fallback') : 'built in'} · {preset.mode} · {preset['type-body-size']} · {preset['type-body-weight']}
                    </span>
                  </span>
                  <span className="flex shrink-0 gap-1.5">
                    {(['background', 'content', 'surface', 'border', 'accent'] as ColorKey[]).map((key) => (
                      <span key={key} className="h-7 w-7 rounded-full border eos-border" style={{ background: preset[key] }} />
                    ))}
                  </span>
                </button>
                {preset.custom && (
                  <button type="button" onClick={() => deleteCustomPreset(preset)} className="eos-danger mt-3 rounded-full border px-3 py-1.5 eos-caption">
                    Delete preset
                  </button>
                )}
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <p className="eos-caption eos-muted">Preview</p>
          <h2 className="eos-heading mt-3">Operational event card</h2>
          <p className="mt-3 eos-body eos-muted">This preview uses the same shared colors and typography as the app.</p>
          <div className="mt-5 grid grid-cols-2 gap-2">
            <Stat label="Profit" value="12.450 DKK" />
            <Stat label="Readiness" value="86%" />
          </div>
          <div className="mt-4 flex gap-2">
            <Badge tone="ok">Ready</Badge>
            <Badge tone="warn">Warning</Badge>
            <Badge tone="bad">Risk</Badge>
          </div>
          <Button className="mt-4 w-full">Primary action</Button>
        </Card>
      </div>
    </AppShell>
  );
}
