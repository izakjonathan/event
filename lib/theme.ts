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
  muted: '#808080',
  accent: '#ffffff',
  border: '#191919',
  'border-strong': '#808080',
  surface: '#191919',
  'dock-active': '#191919',
  success: '#ffffff',
  warning: '#808080',
  danger: '#ffffff',
  shadow: '#000000',
};

export const DAY_THEME: Theme = {
  mode: 'day',
  background: '#ffffff',
  content: '#ffffff',
  text: '#000000',
  muted: '#808080',
  accent: '#000000',
  border: '#808080',
  'border-strong': '#191919',
  surface: '#ffffff',
  'dock-active': '#ffffff',
  success: '#191919',
  warning: '#808080',
  danger: '#000000',
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
