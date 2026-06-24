export type ThemeMode = 'day' | 'night';

export const COLOR_KEYS = [
  'background',
  'content',
  'surface',
  'dock',
  'text',
  'muted',
  'accent',
  'border',
  'border-strong',
  'dock-active',
  'success',
  'warning',
  'danger',
] as const;

export const TYPOGRAPHY_KEYS = [
  'type-display-font',
  'type-ui-font',
  'type-display-size',
  'type-heading-size',
  'type-title-size',
  'type-body-size',
  'type-caption-size',
  'type-button-size',
  'type-metric-size',
  'type-display-weight',
  'type-logo-event-weight',
  'type-logo-os-weight',
  'type-heading-weight',
  'type-title-weight',
  'type-body-weight',
  'type-caption-weight',
  'type-button-weight',
  'type-metric-weight',
  'type-display-track',
  'type-heading-track',
  'type-title-track',
  'type-body-track',
  'type-caption-track',
  'type-button-track',
  'type-metric-track',
  'type-display-transform',
  'type-heading-transform',
  'type-title-transform',
  'type-body-transform',
  'type-caption-transform',
  'type-button-transform',
  'type-metric-transform',
] as const;

export const BACKGROUND_KEYS = [
  'background-image-enabled',
  'background-image-url',
  'background-image-fit',
  'background-fill-enabled',
  'content-fill-enabled',
  'surface-fill-enabled',
] as const;

export const THEME_KEYS = [...COLOR_KEYS, ...TYPOGRAPHY_KEYS, ...BACKGROUND_KEYS] as const;

export type ColorKey = (typeof COLOR_KEYS)[number];
export type TypographyKey = (typeof TYPOGRAPHY_KEYS)[number];
export type BackgroundKey = (typeof BACKGROUND_KEYS)[number];
export type ThemeKey = (typeof THEME_KEYS)[number];
export type Theme = Record<ThemeKey, string> & { mode: ThemeMode };

const FONT_DISPLAY = "'Space Grotesk', 'General Sans', 'DM Sans', Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
const FONT_UI = "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

const TYPOGRAPHY_DEFAULTS: Record<TypographyKey, string> = {
  'type-display-font': FONT_DISPLAY,
  'type-ui-font': FONT_UI,
  'type-display-size': '66px',
  'type-heading-size': '40px',
  'type-title-size': '29px',
  'type-body-size': '15px',
  'type-caption-size': '11px',
  'type-button-size': '15px',
  'type-metric-size': '31px',
  'type-display-weight': '680',
  'type-logo-event-weight': '300',
  'type-logo-os-weight': '800',
  'type-heading-weight': '640',
  'type-title-weight': '620',
  'type-body-weight': '400',
  'type-caption-weight': '560',
  'type-button-weight': '620',
  'type-metric-weight': '700',
  'type-display-track': '-0.085em',
  'type-heading-track': '-0.07em',
  'type-title-track': '-0.055em',
  'type-body-track': '-0.01em',
  'type-caption-track': '0.06em',
  'type-button-track': '-0.015em',
  'type-metric-track': '-0.065em',
  'type-display-transform': 'none',
  'type-heading-transform': 'none',
  'type-title-transform': 'none',
  'type-body-transform': 'none',
  'type-caption-transform': 'uppercase',
  'type-button-transform': 'none',
  'type-metric-transform': 'none',
};

const BACKGROUND_DEFAULTS: Record<BackgroundKey, string> = {
  'background-image-enabled': 'false',
  'background-image-url': '',
  'background-image-fit': 'cover',
  'background-fill-enabled': 'true',
  'content-fill-enabled': 'true',
  'surface-fill-enabled': 'true',
};

export const NIGHT_THEME: Theme = {
  mode: 'night',
  background: '#000000',
  content: '#000000',
  surface: '#191919',
  dock: '#000000',
  text: '#ffffff',
  muted: '#808080',
  accent: '#ffffff',
  border: '#191919',
  'border-strong': '#808080',
  'dock-active': '#191919',
  success: '#ffffff',
  warning: '#808080',
  danger: '#ffffff',
  ...TYPOGRAPHY_DEFAULTS,
  ...BACKGROUND_DEFAULTS,
};

export const DAY_THEME: Theme = {
  mode: 'day',
  background: '#ffffff',
  content: '#ffffff',
  surface: '#ffffff',
  dock: '#ffffff',
  text: '#000000',
  muted: '#808080',
  accent: '#000000',
  border: '#808080',
  'border-strong': '#191919',
  'dock-active': '#ffffff',
  success: '#191919',
  warning: '#808080',
  danger: '#000000',
  ...TYPOGRAPHY_DEFAULTS,
  ...BACKGROUND_DEFAULTS,
};

const HEX = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;
const CSS_LENGTH = /^-?\d+(?:\.\d+)?(?:px|rem|em|%)$/;
const CSS_WEIGHT = /^(?:[1-9]00|[1-9][0-9]{2}|normal|bold|lighter|bolder)$/;
const CSS_TRANSFORM = /^(none|uppercase|lowercase|capitalize)$/;
const CSS_BACKGROUND_FIT = /^(cover|contain|auto)$/;
const CSS_BOOLEAN = /^(true|false)$/;

function validTypographyValue(key: TypographyKey, value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (key.endsWith('-font')) return trimmed;
  if (key.endsWith('-size') || key.endsWith('-track')) return CSS_LENGTH.test(trimmed) ? trimmed : null;
  if (key.endsWith('-weight')) return CSS_WEIGHT.test(trimmed) ? trimmed : null;
  if (key.endsWith('-transform')) return CSS_TRANSFORM.test(trimmed) ? trimmed : null;
  return null;
}

function validBackgroundValue(key: BackgroundKey, value: string) {
  const trimmed = value.trim();
  if (key === 'background-image-url') return trimmed;
  if (key === 'background-image-fit') return CSS_BACKGROUND_FIT.test(trimmed) ? trimmed : null;
  return CSS_BOOLEAN.test(trimmed) ? trimmed : null;
}

function cssUrl(value: string) {
  return `url(${JSON.stringify(value)})`;
}

export function normalizeTheme(raw: Partial<Theme> | null | undefined): Theme {
  const mode: ThemeMode = raw?.mode === 'day' ? 'day' : 'night';
  const base = mode === 'day' ? DAY_THEME : NIGHT_THEME;
  const next: Theme = { ...base, mode };

  for (const key of COLOR_KEYS) {
    const value = raw?.[key];
    if (typeof value === 'string' && HEX.test(value.trim())) next[key] = value.trim();
  }

  for (const key of TYPOGRAPHY_KEYS) {
    const value = raw?.[key];
    if (typeof value === 'string') {
      const valid = validTypographyValue(key, value);
      if (valid) next[key] = valid;
    }
  }

  for (const key of BACKGROUND_KEYS) {
    const value = raw?.[key];
    if (typeof value === 'string') {
      const valid = validBackgroundValue(key, value);
      if (valid !== null) next[key] = valid;
    }
  }

  return next;
}

export function applyTheme(raw: Partial<Theme> | null | undefined) {
  if (typeof document === 'undefined') return;
  const theme = normalizeTheme(raw);
  document.documentElement.dataset.eosMode = theme.mode;
  document.documentElement.style.colorScheme = theme.mode === 'day' ? 'light' : 'dark';

  for (const key of COLOR_KEYS) document.documentElement.style.setProperty(`--eos-${key}`, theme[key]);
  for (const key of TYPOGRAPHY_KEYS) document.documentElement.style.setProperty(`--${key}`, theme[key]);

  const useImage = theme['background-image-enabled'] === 'true' && Boolean(theme['background-image-url']);
  document.documentElement.dataset.eosBackgroundImage = useImage ? 'on' : 'off';
  document.documentElement.style.setProperty('--eos-background-image', useImage ? cssUrl(theme['background-image-url']) : 'none');
  document.documentElement.style.setProperty('--eos-background-size', theme['background-image-fit']);
  document.documentElement.style.setProperty('--eos-background-paint', theme['background-fill-enabled'] === 'true' ? theme.background : 'transparent');
  document.documentElement.style.setProperty('--eos-content-paint', theme['content-fill-enabled'] === 'true' ? theme.content : 'transparent');
  document.documentElement.style.setProperty('--eos-surface-paint', theme['surface-fill-enabled'] === 'true' ? theme.surface : 'transparent');
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
