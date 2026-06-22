export type ThemeMode = 'day' | 'night';

export const THEME_KEYS = [
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
] as const;

export type ThemeKey = typeof THEME_KEYS[number];
export type Theme = Record<ThemeKey, string> & { mode: ThemeMode };

export const NIGHT_THEME: Theme = {
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

export const DAY_THEME: Theme = {
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

const HEX = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

export function normalizeTheme(raw: Partial<Theme> | null | undefined): Theme {
  const mode: ThemeMode = raw?.mode === 'day' ? 'day' : 'night';
  const base = mode === 'day' ? DAY_THEME : NIGHT_THEME;
  const next: Theme = { ...base, mode };

  for (const key of THEME_KEYS) {
    const value = raw?.[key];
    if (typeof value === 'string' && HEX.test(value.trim())) {
      next[key] = value.trim();
    }
  }

  return next;
}

export function applyTheme(raw: Partial<Theme> | null | undefined) {
  if (typeof document === 'undefined') return;
  const theme = normalizeTheme(raw);
  document.documentElement.dataset.eosMode = theme.mode;
  document.documentElement.style.colorScheme = theme.mode === 'day' ? 'light' : 'dark';
  for (const key of THEME_KEYS) {
    document.documentElement.style.setProperty(`--eos-${key}`, theme[key]);
  }
}

export function readSavedTheme(): Theme {
  if (typeof window === 'undefined') return NIGHT_THEME;
  try {
    return normalizeTheme(JSON.parse(localStorage.getItem('eos-ui-theme') || '{}'));
  } catch {
    localStorage.removeItem('eos-ui-theme');
    return NIGHT_THEME;
  }
}
