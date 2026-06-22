'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode, useEffect } from 'react';
import { cx } from '@/lib/utils';

const nav = [
  ['/', 'Main', '◥'],
  ['/event-planner', 'Planner', '◌'],
  ['/artists', 'Artists', '⌘'],
  ['/calendar', 'Calendar', '▣'],
  ['/ui-studio', 'Studio', '◐'],
];

const themeKeys = ['background', 'content', 'text', 'muted', 'accent'] as const;

function applySavedTheme() {
  if (typeof window === 'undefined') return;
  try {
    const saved = JSON.parse(localStorage.getItem('eos-ui-theme') || '{}');
    const mode = saved.mode === 'day' ? 'day' : 'night';
    document.documentElement.dataset.eosMode = mode;
    document.documentElement.style.colorScheme = mode === 'day' ? 'light' : 'dark';
    themeKeys.forEach((key) => {
      const value = saved[key];
      if (typeof value === 'string' && value.startsWith('#')) {
        document.documentElement.style.setProperty(`--eos-${key}`, value);
      }
    });
  } catch {
    localStorage.removeItem('eos-ui-theme');
  }
}

export function AppShell({ children }: { title?: string; children: ReactNode; actions?: ReactNode }) {
  const path = usePathname();

  useEffect(() => {
    applySavedTheme();
  }, []);

  return (
    <main className="safe eos-root mx-auto min-h-screen max-w-[430px] bg-transparent">
      <div className="eos-fade pointer-events-none fixed inset-x-0 top-0 z-0 mx-auto h-48 max-w-[430px]" />
      <section className="eos-page-content relative z-10 px-4 pb-64 pt-[calc(env(safe-area-inset-top)+18px)] sm:px-5">
        {children}
      </section>

      <nav className="eos-dock fixed bottom-[calc(env(safe-area-inset-bottom)+18px)] left-1/2 z-40 w-[calc(100%-32px)] max-w-[398px] -translate-x-1/2 rounded-[28px] border p-1.5 shadow-[0_24px_80px_rgba(0,0,0,0.52)] backdrop-blur-2xl">
        <div className="grid grid-cols-5 gap-1.5">
          {nav.map(([href, label, ico]) => {
            const active = path === href;
            return (
              <Link
                key={href}
                href={href}
                className={cx(
                  'rounded-[22px] px-1.5 py-1.5 text-center text-[11px] leading-tight text-zinc-500 transition active:scale-[.98]',
                  active && 'eos-dock-active',
                )}
              >
                <div
                  className={cx(
                    'mx-auto mb-1 grid h-7 w-7 place-items-center rounded-full border border-white/10 bg-white/[.02] text-sm',
                    active && 'eos-dock-active eos-accent-border',
                  )}
                >
                  {ico}
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
        'focus-ring rounded-[22px] border px-4 py-3 text-sm font-medium tracking-[-0.02em] transition active:scale-[.985] disabled:opacity-40',
        kind === 'primary' && 'eos-primary shadow-[0_8px_24px_rgba(255,255,255,0.12)]',
        kind === 'ghost' && 'border-white/10 bg-white/[.03] text-white',
        kind === 'danger' && 'border-red-300/18 bg-red-300/12 text-red-100',
        kind === 'soft' && 'eos-surface text-white',
        className,
      )}
    >
      {children}
    </button>
  );
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={cx('glass eos-card rounded-[28px] p-4 sm:p-5', className)}>{children}</div>;
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
      <div className="truncate font-mono text-[11px] uppercase tracking-[0.06em] text-zinc-500">{label}</div>
      <div className="mt-3 truncate text-[28px] font-medium leading-none tracking-[-0.06em]">{value}</div>
      {sub && <div className="mt-1 truncate text-xs text-zinc-500">{sub}</div>}
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
        tone === 'neutral' && 'eos-surface text-zinc-300',
        tone === 'ok' && 'border-emerald-300/20 bg-emerald-300/10 text-emerald-200',
        tone === 'warn' && 'border-amber-300/20 bg-amber-300/10 text-amber-200',
        tone === 'bad' && 'border-red-300/20 bg-red-300/10 text-red-200',
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
  return (
    <details open={openDefault} className="eos-card group rounded-[30px] border p-1.5 shadow-[0_18px_46px_rgba(0,0,0,0.28)]">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3.5">
        <span className="text-xl font-medium tracking-[-0.05em] text-white">{title}</span>
        <span className="flex items-center gap-2 text-xs text-zinc-500">
          {right}
          <span className="text-base transition group-open:rotate-180">⌄</span>
        </span>
      </summary>
      <div className="space-y-3 px-3 pb-3">{children}</div>
    </details>
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
