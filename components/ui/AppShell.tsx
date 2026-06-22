'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { CSSProperties, MouseEvent, ReactNode, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { cx } from '@/lib/utils';
import { applyTheme, readSavedTheme } from '@/lib/theme';

const nav = [
  ['/', 'Main', 'home'],
  ['/event-planner', 'Planner', 'planner'],
  ['/artists', 'Artists', 'artists'],
  ['/calendar', 'Calendar', 'calendar'],
  ['/ui-studio', 'Studio', 'studio'],
] as const;

type NavIconName = typeof nav[number][2];

function NavIcon({ name }: { name: NavIconName }) {
  const common = {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.9,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  };

  if (name === 'home') {
    return (
      <svg {...common}>
        <path d="M4.5 11.2 12 4.8l7.5 6.4" />
        <path d="M6.8 10.5v8.2h10.4v-8.2" />
        <path d="M10 18.7v-5h4v5" />
      </svg>
    );
  }

  if (name === 'planner') {
    return (
      <svg {...common}>
        <path d="M7 5.2h10" />
        <path d="M7 12h10" />
        <path d="M7 18.8h6" />
        <path d="M4.5 5.2h.01" />
        <path d="M4.5 12h.01" />
        <path d="M4.5 18.8h.01" />
      </svg>
    );
  }

  if (name === 'artists') {
    return (
      <svg {...common}>
        <path d="M8.2 18.2a3.2 3.2 0 0 1 6.4 0" />
        <path d="M11.4 12.8a2.7 2.7 0 1 0 0-5.4 2.7 2.7 0 0 0 0 5.4Z" />
        <path d="M16.3 14.1a2.4 2.4 0 0 1 3.2 2.3" />
        <path d="M15.8 8.1a2.1 2.1 0 0 1 0 4" />
      </svg>
    );
  }

  if (name === 'calendar') {
    return (
      <svg {...common}>
        <path d="M7.5 4.5v3" />
        <path d="M16.5 4.5v3" />
        <path d="M5.2 8.2h13.6" />
        <rect x="5" y="6.2" width="14" height="13.2" rx="3" />
        <path d="M8.2 12.2h.01M12 12.2h.01M15.8 12.2h.01M8.2 15.6h.01M12 15.6h.01" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <path d="M12 4.8v14.4" />
      <path d="M12 19.2a7.2 7.2 0 0 0 0-14.4" />
      <path d="M12 4.8a7.2 7.2 0 0 0 0 14.4" opacity="0.38" />
    </svg>
  );
}

function applySavedTheme() {
  applyTheme(readSavedTheme());
}

export function AppShell({ children }: { title?: string; children: ReactNode; actions?: ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const [isLeaving, setIsLeaving] = useState(false);
  const transitionTimer = useRef<number | null>(null);

  useEffect(() => {
    applySavedTheme();
  }, []);

  useEffect(() => {
    setIsLeaving(false);
    if (transitionTimer.current) {
      window.clearTimeout(transitionTimer.current);
      transitionTimer.current = null;
    }
  }, [path]);

  useEffect(() => () => {
    if (transitionTimer.current) window.clearTimeout(transitionTimer.current);
  }, []);

  const navigateWithFade = (event: MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href === path) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;

    event.preventDefault();
    if (transitionTimer.current) window.clearTimeout(transitionTimer.current);

    setIsLeaving(true);
    transitionTimer.current = window.setTimeout(() => {
      router.push(href);
    }, 115);
  };

  return (
    <main className="safe eos-root mx-auto min-h-screen max-w-[430px]">
      <section key={path} data-leaving={isLeaving ? 'true' : 'false'} className="eos-page-content eos-page-shell relative z-10 px-4 pb-64 pt-[calc(env(safe-area-inset-top)+18px)] sm:px-5">
        {children}
      </section>

      <nav className="eos-dock fixed bottom-[calc(env(safe-area-inset-bottom)+8px)] left-1/2 z-40 w-[calc(100%-32px)] max-w-[398px] -translate-x-1/2 rounded-[26px] border p-1">
        <div className="grid grid-cols-5 gap-1">
          {nav.map(([href, label, icon]) => {
            const active = path === href;
            return (
              <Link
                key={href}
                href={href}
                onClick={(event) => navigateWithFade(event, href)}
                aria-current={active ? 'page' : undefined}
                className={cx(
                  'eos-nav-item rounded-[20px] px-1 py-1 text-center text-[10px] leading-tight transition active:scale-[.96]',
                  active ? 'eos-dock-active' : 'eos-muted',
                )}
              >
                <div className={cx('eos-nav-icon eos-panel mx-auto mb-1 grid h-6 w-6 place-items-center rounded-full border p-[5px]', active && 'eos-dock-active')}>
                  <NavIcon name={icon} />
                </div>
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
    </main>
  );
}

export function Button({
  children,
  onClick,
  kind = 'primary',
  type = 'button',
  className = '',
  disabled = false,
}: {
  children: ReactNode;
  onClick?: () => void;
  kind?: 'primary' | 'ghost' | 'danger' | 'soft';
  type?: 'button' | 'submit';
  className?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={cx(
        'eos-pressable focus-ring rounded-[22px] border px-4 py-3 text-sm font-medium tracking-[-0.02em] transition disabled:opacity-40',
        kind === 'primary' && 'eos-primary',
        kind === 'ghost' && 'eos-surface',
        kind === 'danger' && 'eos-danger',
        kind === 'soft' && 'eos-panel',
        className,
      )}
    >
      {children}
    </button>
  );
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={cx('eos-card rounded-[28px] border p-4 sm:p-5', className)}>{children}</div>;
}

function MetricValue({ value }: { value: string | number }) {
  const raw = String(value).replace(/\u00a0/g, ' ').replace(/kr\.?$/i, 'DKK').trim();
  const moneyMatch = raw.match(/^(.+?)\s*(DKK)$/i);
  const percentMatch = raw.match(/^(.+?)(%)$/);

  if (moneyMatch) {
    return (
      <span className="eos-metric-value">
        <span className="eos-metric-number">{moneyMatch[1].trim()}</span>
        <span className="eos-metric-unit">DKK</span>
      </span>
    );
  }

  if (percentMatch) {
    return (
      <span className="eos-metric-value">
        <span className="eos-metric-number">{percentMatch[1].trim()}</span>
        <span className="eos-metric-unit">%</span>
      </span>
    );
  }

  return <span className="eos-metric-number">{value}</span>;
}

export function Stat({
  label,
  value,
  sub,
  className = '',
}: {
  label: string;
  value: string | number;
  sub?: string;
  className?: string;
}) {
  return (
    <div className={cx('eos-stat min-w-0 overflow-hidden rounded-[22px] border p-3.5', className)}>
      <div className="eos-muted truncate font-mono text-[11px] uppercase tracking-[0.06em]">{label}</div>
      <div className="mt-3 truncate text-[31px] font-semibold leading-none tracking-[-0.065em]"><MetricValue value={value} /></div>
      {sub && <div className="eos-muted mt-1 truncate text-xs">{sub}</div>}
    </div>
  );
}

export function Badge({
  children,
  tone = 'neutral',
}: {
  children: ReactNode;
  tone?: 'neutral' | 'ok' | 'warn' | 'bad';
}) {
  return (
    <span
      className={cx(
        'pill inline-flex items-center gap-1 border px-3 py-1.5 text-[11px] font-mono uppercase tracking-[0.05em]',
        tone === 'neutral' && 'eos-surface',
        tone === 'ok' && 'eos-ok',
        tone === 'warn' && 'eos-warn',
        tone === 'bad' && 'eos-danger',
      )}
    >
      {children}
    </span>
  );
}

export function Section({
  title,
  children,
  openDefault = false,
  right,
}: {
  title: string;
  children: ReactNode;
  openDefault?: boolean;
  right?: ReactNode;
}) {
  const [open, setOpen] = useState(openDefault);
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  useLayoutEffect(() => {
    const element = contentRef.current;
    if (!element) return;

    const updateHeight = () => setHeight(element.scrollHeight);
    updateHeight();

    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(updateHeight);
    observer.observe(element);
    return () => observer.disconnect();
  }, [children, open]);

  return (
    <div className="eos-section eos-card rounded-[30px] border p-1.5">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="eos-accordion-trigger flex w-full cursor-pointer list-none items-center justify-between gap-3 rounded-[24px] px-4 py-3.5 text-left"
      >
        <span className="text-xl font-medium tracking-[-0.05em]">{title}</span>
        <span className="eos-muted flex items-center gap-2 text-xs">
          {right}
          <span className={cx('eos-chevron text-base', open && 'rotate-180')}>⌄</span>
        </span>
      </button>
      <div
        className="eos-accordion-panel"
        data-open={open ? 'true' : 'false'}
        style={{ '--accordion-height': `${height}px` } as CSSProperties}
      >
        <div ref={contentRef} className="space-y-3 px-3 pb-3">
          {children}
        </div>
      </div>
    </div>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <label>{label}</label>
      {children}
    </div>
  );
}

export function Row({ children }: { children: ReactNode }) {
  return <div className="grid min-w-0 grid-cols-1 gap-3">{children}</div>;
}
