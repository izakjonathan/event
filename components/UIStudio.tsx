'use client';

import { useEffect, useMemo, useState } from 'react';
import { AppShell, Badge, Button, Card, Field, Stat } from './ui/AppShell';
import {
  applyTheme,
  DAY_THEME,
  NIGHT_THEME,
  normalizeTheme,
  readSavedTheme,
  Theme,
  ThemeKey,
  ThemeMode,
} from '@/lib/theme';

type ColorKey = ThemeKey;
type NamedTheme = Theme & { name: string; custom?: boolean };

const DEFAULT_THEME = NIGHT_THEME;
const CUSTOM_PRESETS_KEY = 'eos-ui-custom-presets';

const BUILT_IN_PRESETS: NamedTheme[] = [
  { name: 'Night mode', ...NIGHT_THEME },
  { name: 'Day mode', ...DAY_THEME },
  {
    name: 'Vercel dark blue',
    ...NIGHT_THEME,
    text: '#f3f6ff',
    muted: '#8a95a8',
    accent: '#7aa2ff',
    border: '#273142',
    'border-strong': '#40506a',
    surface: '#070b12',
    'dock-active': '#14213d',
  },
  {
    name: 'Warm operations',
    ...NIGHT_THEME,
    text: '#fff8ed',
    muted: '#a09584',
    accent: '#f2c36b',
    border: '#3a3022',
    'border-strong': '#5a4930',
    surface: '#100d08',
    'dock-active': '#2c2418',
  },
  {
    name: 'Clean daylight',
    ...DAY_THEME,
    background: '#fafafa',
    content: '#ffffff',
    text: '#111111',
    muted: '#66645f',
    accent: '#111111',
    border: '#e1e1df',
    'border-strong': '#c9c9c5',
    surface: '#f4f4f2',
    'dock-active': '#e4e4e2',
  },
  {
    name: 'Green room',
    ...NIGHT_THEME,
    text: '#f2fff7',
    muted: '#789487',
    accent: '#75f0a6',
    border: '#1d3529',
    'border-strong': '#2c5642',
    surface: '#06110c',
    'dock-active': '#10251a',
    success: '#75f0a6',
  },
];

function readCustomPresets(): NamedTheme[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = JSON.parse(localStorage.getItem(CUSTOM_PRESETS_KEY) || '[]');
    if (!Array.isArray(raw)) return [];

    return raw
      .map((item) => {
        if (!item || typeof item.name !== 'string') return null;
        return {
          ...normalizeTheme(item),
          name: item.name.trim() || 'Saved preset',
          custom: true,
        } satisfies NamedTheme;
      })
      .filter(Boolean) as NamedTheme[];
  } catch {
    localStorage.removeItem(CUSTOM_PRESETS_KEY);
    return [];
  }
}

function writeCustomPresets(presets: NamedTheme[]) {
  localStorage.setItem(CUSTOM_PRESETS_KEY, JSON.stringify(presets));
}

export default function UIStudio() {
  const [theme, setTheme] = useState<Theme>(DEFAULT_THEME);
  const [saved, setSaved] = useState(false);
  const [customPresets, setCustomPresets] = useState<NamedTheme[]>([]);
  const [presetName, setPresetName] = useState('');

  useEffect(() => {
    const stored = readSavedTheme();
    setTheme(stored);
    applyTheme(stored);
    setCustomPresets(readCustomPresets());
  }, []);

  const tokens = useMemo(
    () =>
      [
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
      ] as const,
    [],
  );

  const presets = useMemo(() => [...BUILT_IN_PRESETS, ...customPresets], [customPresets]);

  const flashSaved = () => {
    setSaved(true);
    window.setTimeout(() => setSaved(false), 900);
  };

  const commit = (nextTheme: Theme) => {
    const next = normalizeTheme(nextTheme);
    setTheme(next);
    applyTheme(next);
    localStorage.setItem('eos-ui-theme', JSON.stringify(next));
    flashSaved();
  };

  const update = (key: ColorKey, value: string) => {
    commit({ ...theme, [key]: value });
  };

  const setMode = (mode: ThemeMode) => {
    commit(mode === 'day' ? DAY_THEME : NIGHT_THEME);
  };

  const reset = () => commit(DEFAULT_THEME);

  const saveCurrentPreset = () => {
    const name = presetName.trim() || `Preset ${customPresets.length + 1}`;
    const nextPreset: NamedTheme = { ...normalizeTheme(theme), name, custom: true };
    const nextPresets = [nextPreset, ...customPresets.filter((preset) => preset.name.toLowerCase() !== name.toLowerCase())].slice(0, 20);
    setCustomPresets(nextPresets);
    writeCustomPresets(nextPresets);
    setPresetName('');
    flashSaved();
  };

  const deleteCustomPreset = (name: string) => {
    const nextPresets = customPresets.filter((preset) => preset.name !== name);
    setCustomPresets(nextPresets);
    writeCustomPresets(nextPresets);
    flashSaved();
  };

  return (
    <AppShell title="UI Studio">
      <div className="space-y-5">
        <Card className="overflow-hidden">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.08em] eos-muted">Design system</p>
              <h1 className="mt-4 text-[54px] font-medium leading-[0.93] tracking-[-0.085em] eos-text">UI Studio</h1>
              <p className="mt-4 max-w-[28ch] text-base leading-6 eos-muted">
                Change every shared color token used across the app. Changes are saved on this device.
              </p>
            </div>
            <Badge tone={saved ? 'ok' : 'neutral'}>{saved ? 'Saved' : 'Live'}</Badge>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-2">
            <Stat label="Mode" value={theme.mode} />
            <Stat label="Accent" value={theme.accent} />
            <Stat label="Border" value={theme.border} />
            <Stat label="Surface" value={theme.surface} />
          </div>
        </Card>

        <Card>
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.08em] eos-muted">Appearance</p>
              <h2 className="mt-2 text-[34px] font-medium tracking-[-0.07em] eos-text">Day / night mode</h2>
            </div>
            <Button kind="ghost" onClick={reset}>Reset</Button>
          </div>

          <div className="eos-panel mt-5 grid grid-cols-2 gap-2 rounded-[26px] border p-2">
            <button
              type="button"
              onClick={() => setMode('night')}
              className={`rounded-[20px] border px-4 py-4 text-left transition active:scale-[.99] ${
                theme.mode === 'night' ? 'eos-primary' : 'eos-surface'
              }`}
            >
              <span className="block text-lg font-medium tracking-[-0.04em]">Night</span>
              <span className="mt-1 block text-xs opacity-70">Dark canvas, light text and muted borders.</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('day')}
              className={`rounded-[20px] border px-4 py-4 text-left transition active:scale-[.99] ${
                theme.mode === 'day' ? 'eos-primary' : 'eos-surface'
              }`}
            >
              <span className="block text-lg font-medium tracking-[-0.04em]">Day</span>
              <span className="mt-1 block text-xs opacity-70">Light canvas, dark text and muted borders.</span>
            </button>
          </div>
        </Card>

        <Card>
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.08em] eos-muted">Editable tokens</p>
              <h2 className="mt-2 text-[34px] font-medium tracking-[-0.07em] eos-text">Colors</h2>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            {tokens.map(([key, label, description]) => (
              <div key={key} className="eos-panel rounded-[26px] border p-3">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-medium tracking-[-0.045em] eos-text">{label}</h3>
                    <p className="mt-1 text-sm leading-5 eos-muted">{description}</p>
                  </div>
                  <div className="h-10 w-10 shrink-0 rounded-full border eos-border" style={{ background: theme[key] }} />
                </div>
                <div className="grid grid-cols-[64px_1fr] gap-3">
                  <input
                    aria-label={label}
                    className="eos-color-input"
                    type="color"
                    value={theme[key]}
                    onChange={(event) => update(key, event.target.value)}
                  />
                  <Field label="Hex value">
                    <input value={theme[key]} onChange={(event) => update(key, event.target.value)} />
                  </Field>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.08em] eos-muted">Presets</p>
              <h2 className="mt-2 text-[34px] font-medium tracking-[-0.07em] eos-text">Saved themes</h2>
            </div>
            <Badge tone="neutral">{customPresets.length} saved</Badge>
          </div>

          <div className="eos-panel mt-4 rounded-[24px] border p-3">
            <Field label="Preset name">
              <input
                value={presetName}
                placeholder={`Preset ${customPresets.length + 1}`}
                onChange={(event) => setPresetName(event.target.value)}
              />
            </Field>
            <Button className="mt-3 w-full" kind="primary" onClick={saveCurrentPreset}>Save current theme as preset</Button>
          </div>

          <div className="mt-4 space-y-2">
            {presets.map((preset) => (
              <div key={`${preset.custom ? 'custom' : 'built-in'}-${preset.name}`} className="eos-panel rounded-[24px] border p-3">
                <button
                  type="button"
                  onClick={() => commit(normalizeTheme(preset))}
                  className="flex w-full items-center justify-between gap-3 text-left"
                >
                  <span>
                    <span className="block text-lg font-medium tracking-[-0.04em] eos-text">{preset.name}</span>
                    <span className="mt-1 block font-mono text-[11px] uppercase tracking-[0.06em] eos-muted">
                      {preset.custom ? 'saved' : 'built in'} · {preset.mode} · {preset.background}
                    </span>
                  </span>
                  <span className="flex shrink-0 gap-1.5">
                    {(['background', 'content', 'surface', 'border', 'accent'] as ColorKey[]).map((key) => (
                      <span key={key} className="h-7 w-7 rounded-full border eos-border" style={{ background: preset[key] }} />
                    ))}
                  </span>
                </button>
                {preset.custom && (
                  <button
                    type="button"
                    onClick={() => deleteCustomPreset(preset.name)}
                    className="eos-danger mt-3 rounded-full border px-3 py-1.5 text-[11px] font-mono uppercase tracking-[0.06em]"
                  >
                    Delete preset
                  </button>
                )}
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <p className="font-mono text-[11px] uppercase tracking-[0.08em] eos-muted">Preview</p>
          <h2 className="mt-3 text-[36px] font-medium leading-none tracking-[-0.075em] eos-text">Operational event card</h2>
          <p className="mt-3 text-sm leading-6 eos-muted">
            This preview uses the same shared text, muted, accent, border, surface, status and shadow colors as the app.
          </p>
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
