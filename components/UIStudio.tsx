'use client';

import { useEffect, useMemo, useState } from 'react';
import { AppShell, Badge, Button, Card, Field, Stat } from './ui/AppShell';

type Mode = 'day' | 'night';
type Theme = {
  mode: Mode;
  background: string;
  content: string;
  text: string;
  muted: string;
  accent: string;
  border: string;
  'border-strong': string;
  surface: string;
  'dock-active': string;
  success: string;
  warning: string;
  danger: string;
  shadow: string;
};

type ColorKey = Exclude<keyof Theme, 'mode'>;

const COLOR_KEYS: ColorKey[] = [
  'background',
  'content',
  'text',
  'muted',
  'accent',
  'border',
  'border-strong',
  'surface',
  'dock-active',
  'success',
  'warning',
  'danger',
  'shadow',
];

const NIGHT_THEME: Theme = {
  mode: 'night',
  background: '#000000',
  content: '#000000',
  text: '#ffffff',
  muted: '#8e8e93',
  accent: '#ffffff',
  border: '#2e2e2e',
  'border-strong': '#4a4a4a',
  surface: '#111111',
  'dock-active': '#2c2c2e',
  success: '#23c483',
  warning: '#c78b00',
  danger: '#ff6b6b',
  shadow: '#000000',
};

const DAY_THEME: Theme = {
  mode: 'day',
  background: '#ffffff',
  content: '#ffffff',
  text: '#000000',
  muted: '#6e6e73',
  accent: '#000000',
  border: '#d9d9d9',
  'border-strong': '#b8b8b8',
  surface: '#f2f2f2',
  'dock-active': '#dedede',
  success: '#008c5a',
  warning: '#a86c00',
  danger: '#d92d20',
  shadow: '#000000',
};

const DEFAULT_THEME = NIGHT_THEME;

const PRESETS: Array<Theme & { name: string }> = [
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

function isHex(value: unknown): value is string {
  return typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value);
}

function normalizeTheme(raw: Partial<Theme>): Theme {
  const mode = raw.mode === 'day' ? 'day' : 'night';
  const base = mode === 'day' ? DAY_THEME : NIGHT_THEME;
  const next = { ...base, ...raw, mode } as Theme;
  COLOR_KEYS.forEach((key) => {
    if (!isHex(next[key])) next[key] = base[key];
  });
  return next;
}

function applyTheme(themeInput: Theme) {
  const theme = normalizeTheme(themeInput);
  document.documentElement.dataset.eosMode = theme.mode;
  document.documentElement.style.colorScheme = theme.mode === 'day' ? 'light' : 'dark';
  COLOR_KEYS.forEach((key) => {
    document.documentElement.style.setProperty(`--eos-${key}`, theme[key]);
  });
}

function readTheme(): Theme {
  if (typeof window === 'undefined') return DEFAULT_THEME;
  try {
    return normalizeTheme(JSON.parse(localStorage.getItem('eos-ui-theme') || '{}'));
  } catch {
    return DEFAULT_THEME;
  }
}

export default function UIStudio() {
  const [theme, setTheme] = useState<Theme>(DEFAULT_THEME);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = readTheme();
    setTheme(stored);
    applyTheme(stored);
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

  const commit = (nextTheme: Theme) => {
    const next = normalizeTheme(nextTheme);
    setTheme(next);
    applyTheme(next);
    localStorage.setItem('eos-ui-theme', JSON.stringify(next));
    setSaved(true);
    window.setTimeout(() => setSaved(false), 900);
  };

  const update = (key: ColorKey, value: string) => {
    commit({ ...theme, [key]: value });
  };

  const setMode = (mode: Mode) => {
    commit(mode === 'day' ? DAY_THEME : NIGHT_THEME);
  };

  const reset = () => commit(DEFAULT_THEME);

  return (
    <AppShell title="UI Studio">
      <div className="space-y-5">
        <Card className="overflow-hidden">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-zinc-500">Design system</p>
              <h1 className="mt-4 text-[54px] font-medium leading-[0.93] tracking-[-0.085em] text-white">UI Studio</h1>
              <p className="mt-4 max-w-[28ch] text-base leading-6 text-zinc-400">
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
              <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-zinc-500">Appearance</p>
              <h2 className="mt-2 text-[34px] font-medium tracking-[-0.07em] text-white">Day / night mode</h2>
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
              <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-zinc-500">Editable tokens</p>
              <h2 className="mt-2 text-[34px] font-medium tracking-[-0.07em] text-white">Colors</h2>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            {tokens.map(([key, label, description]) => (
              <div key={key} className="eos-panel rounded-[26px] border p-3">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-medium tracking-[-0.045em] text-white">{label}</h3>
                    <p className="mt-1 text-sm leading-5 text-zinc-500">{description}</p>
                  </div>
                  <div className="h-10 w-10 shrink-0 rounded-full border border-current/15" style={{ background: theme[key] }} />
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
          <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-zinc-500">Presets</p>
          <div className="mt-4 space-y-2">
            {PRESETS.map((preset) => (
              <button
                key={preset.name}
                type="button"
                onClick={() => commit(normalizeTheme(preset))}
                className="eos-panel flex w-full items-center justify-between gap-3 rounded-[24px] border p-3 text-left transition active:scale-[.99]"
              >
                <span>
                  <span className="block text-lg font-medium tracking-[-0.04em] text-white">{preset.name}</span>
                  <span className="mt-1 block font-mono text-[11px] uppercase tracking-[0.06em] text-zinc-500">
                    {preset.mode} · {preset.background} · {preset.text}
                  </span>
                </span>
                <span className="flex gap-1.5">
                  {(['background', 'content', 'surface', 'border', 'accent'] as ColorKey[]).map((key) => (
                    <span key={key} className="h-7 w-7 rounded-full border border-current/15" style={{ background: preset[key] }} />
                  ))}
                </span>
              </button>
            ))}
          </div>
        </Card>

        <Card>
          <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-zinc-500">Preview</p>
          <h2 className="mt-3 text-[36px] font-medium leading-none tracking-[-0.075em] text-white">Operational event card</h2>
          <p className="mt-3 text-sm leading-6 text-zinc-500">
            This preview uses the same shared text, muted, accent, border, surface, status and shadow colors as the app.
          </p>
          <div className="mt-5 grid grid-cols-2 gap-2">
            <Stat label="Profit" value="12.450 kr." />
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
