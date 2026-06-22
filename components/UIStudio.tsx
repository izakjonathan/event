'use client';

import { useEffect, useMemo, useState } from 'react';
import { AppShell, Badge, Button, Card, Field, Stat } from './ui/AppShell';

const DEFAULT_THEME = {
  background: '#000000',
  content: '#0b0b0d',
  muted: '#8b8b94',
  accent: '#ffffff',
};

const PRESETS = [
  {
    name: 'Vercel dark',
    background: '#000000',
    content: '#0b0b0d',
    muted: '#8b8b94',
    accent: '#ffffff',
  },
  {
    name: 'Graphite blue',
    background: '#05070d',
    content: '#10141d',
    muted: '#8a95a8',
    accent: '#7aa2ff',
  },
  {
    name: 'Warm operations',
    background: '#080604',
    content: '#15110c',
    muted: '#a09584',
    accent: '#f2c36b',
  },
  {
    name: 'Green room',
    background: '#020806',
    content: '#0b1712',
    muted: '#789487',
    accent: '#75f0a6',
  },
];

type Theme = typeof DEFAULT_THEME;
type ThemeKey = keyof Theme;

function applyTheme(theme: Theme) {
  Object.entries(theme).forEach(([key, value]) => {
    document.documentElement.style.setProperty(`--eos-${key}`, value);
  });
}

function readTheme(): Theme {
  if (typeof window === 'undefined') return DEFAULT_THEME;
  try {
    return { ...DEFAULT_THEME, ...JSON.parse(localStorage.getItem('eos-ui-theme') || '{}') };
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
    () => [
      ['background', 'Background color', 'The full app canvas behind every module.'],
      ['content', 'Content color', 'Cards, panels, stat blocks, dock and inputs.'],
      ['muted', 'Muted color', 'Secondary text, labels, helper text and inactive navigation.'],
      ['accent', 'Accent color', 'Primary buttons, active dock item, highlights and previews.'],
    ] as const,
    [],
  );

  const update = (key: ThemeKey, value: string) => {
    const next = { ...theme, [key]: value };
    setTheme(next);
    applyTheme(next);
    localStorage.setItem('eos-ui-theme', JSON.stringify(next));
    setSaved(true);
    window.setTimeout(() => setSaved(false), 900);
  };

  const reset = () => {
    setTheme(DEFAULT_THEME);
    applyTheme(DEFAULT_THEME);
    localStorage.setItem('eos-ui-theme', JSON.stringify(DEFAULT_THEME));
    setSaved(true);
    window.setTimeout(() => setSaved(false), 900);
  };

  return (
    <AppShell title="UI Studio">
      <div className="space-y-5">
        <Card className="overflow-hidden">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-zinc-500">Design system</p>
              <h1 className="mt-4 text-[54px] font-medium leading-[0.93] tracking-[-0.085em] text-white">UI Studio</h1>
              <p className="mt-4 max-w-[28ch] text-base leading-6 text-zinc-400">
                Change the live color tokens used across the app. Changes are saved on this device.
              </p>
            </div>
            <Badge tone={saved ? 'ok' : 'neutral'}>{saved ? 'Saved' : 'Live'}</Badge>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-2">
            <Stat label="Background" value={theme.background} />
            <Stat label="Content" value={theme.content} />
            <Stat label="Muted" value={theme.muted} />
            <Stat label="Accent" value={theme.accent} />
          </div>
        </Card>

        <Card>
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-zinc-500">Editable tokens</p>
              <h2 className="mt-2 text-[34px] font-medium tracking-[-0.07em] text-white">Colors</h2>
            </div>
            <Button kind="ghost" onClick={reset}>Reset</Button>
          </div>

          <div className="mt-5 space-y-4">
            {tokens.map(([key, label, description]) => (
              <div key={key} className="eos-surface rounded-[26px] border p-3">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-medium tracking-[-0.045em] text-white">{label}</h3>
                    <p className="mt-1 text-sm leading-5 text-zinc-500">{description}</p>
                  </div>
                  <div className="h-10 w-10 shrink-0 rounded-full border border-white/15" style={{ background: theme[key] }} />
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
                onClick={() => {
                  const next = {
                    background: preset.background,
                    content: preset.content,
                    muted: preset.muted,
                    accent: preset.accent,
                  };
                  setTheme(next);
                  applyTheme(next);
                  localStorage.setItem('eos-ui-theme', JSON.stringify(next));
                  setSaved(true);
                  window.setTimeout(() => setSaved(false), 900);
                }}
                className="eos-surface flex w-full items-center justify-between gap-3 rounded-[24px] border p-3 text-left transition active:scale-[.99]"
              >
                <span>
                  <span className="block text-lg font-medium tracking-[-0.04em] text-white">{preset.name}</span>
                  <span className="mt-1 block font-mono text-[11px] uppercase tracking-[0.06em] text-zinc-500">
                    {preset.background} · {preset.content}
                  </span>
                </span>
                <span className="flex gap-1.5">
                  {(['background', 'content', 'muted', 'accent'] as ThemeKey[]).map((key) => (
                    <span key={key} className="h-7 w-7 rounded-full border border-white/15" style={{ background: preset[key] }} />
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
            This preview uses the same shared card, stat, badge, muted and accent styles as the app.
          </p>
          <div className="mt-5 grid grid-cols-2 gap-2">
            <Stat label="Profit" value="12.450 kr." />
            <Stat label="Readiness" value="86%" />
          </div>
          <div className="mt-4 flex gap-2">
            <Badge tone="ok">Ready</Badge>
            <Badge>Draft</Badge>
          </div>
          <Button className="mt-4 w-full">Primary action</Button>
        </Card>
      </div>
    </AppShell>
  );
}
