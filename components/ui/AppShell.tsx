'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ReactNode, useEffect, useState } from 'react';
import { applyTheme, readSavedTheme } from '@/lib/theme';
import { cx } from '@/lib/utils';

const nav = [
 ['/', 'Main', 'home'],
 ['/event-planner', 'Planner', 'planner'],
 ['/event-comparison', 'Compare', 'compare'],
 ['/artists', 'Artists', 'artists'],
 ['/calendar', 'Calendar', 'calendar'],
 ['/ui-studio', 'Studio', 'studio'],
] as const;

type NavIconName = (typeof nav)[number][2];

type AppShellProps = {
 children: ReactNode;
};

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


 if (name === 'compare') {
 return (
 <svg {...common}>
 <path d="M5.2 18.8V9.2" />
 <path d="M12 18.8V5.2" />
 <path d="M18.8 18.8v-7.5" />
 <path d="M4 18.8h16" />
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

export function AppShell({ children }: AppShellProps) {
 const path = usePathname();
 const router = useRouter();

 useEffect(() => {
 applyTheme(readSavedTheme());
 }, []);

 useEffect(() => {
 let cancelled = false;
 const prefetchRoutes = () => {
 if (cancelled) return;
 nav.forEach(([href]) => {
 if (href !== path) router.prefetch(href);
 });
 };

 const requestIdle = (window as any).requestIdleCallback as undefined | ((callback: () => void, options?: { timeout: number }) => number);
 const cancelIdle = (window as any).cancelIdleCallback as undefined | ((id: number) => void);

 if (requestIdle && cancelIdle) {
 const id = requestIdle(prefetchRoutes, { timeout: 800 });
 return () => {
 cancelled = true;
 cancelIdle(id);
 };
 }

 const id = window.setTimeout(prefetchRoutes, 80);
 return () => {
 cancelled = true;
 window.clearTimeout(id);
 };
 }, [path, router]);

 return (
 <main className="eos-root mx-auto min-h-screen max-w-[430px]">
 <section className="eos-page-content relative z-10 px-4 pt-[calc(env(safe-area-inset-top)+18px)] sm:px-5">
 {children}
 </section>

 <nav className="eos-dock fixed bottom-[calc(env(safe-area-inset-bottom)+8px)] left-1/2 z-40 w-[calc(100%-32px)] max-w-[398px] -translate-x-1/2 rounded-[26px] border p-1">
 <div className="grid grid-cols-6 gap-1">
 {nav.map(([href, label, icon]) => {
 const active = path === href;

 return (
 <Link
 key={href}
 href={href}
 prefetch
 aria-current={active ? 'page' : undefined}
 className={cx('eos-nav-item eos-nav-label rounded-[20px] px-0.5 py-1 text-center', active ? 'eos-dock-active' : 'eos-muted')}
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
 'focus-ring eos-button rounded-[22px] border px-4 py-3 disabled:opacity-40',
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

export function SubCard({ children, className = '' }: { children: ReactNode; className?: string }) {
 return <div className={cx('eos-subcard eos-stack', className)}>{children}</div>;
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
 <div className="eos-caption truncate">{label}</div>
 <div className="eos-stat-value mt-3 truncate">
 <MetricValue value={value} />
 </div>
 {sub && <div className="eos-caption mt-1 truncate eos-muted">{sub}</div>}
 </div>
 );
}

export function Badge({
 children,
 tone = 'neutral',
 className = '',
}: {
 children: ReactNode;
 tone?: 'neutral' | 'ok' | 'warn' | 'bad';
 className?: string;
}) {
 return (
 <span
 className={cx(
 'pill eos-caption inline-flex shrink-0 items-center gap-1 whitespace-nowrap border px-3 py-1.5',
 tone === 'neutral' && 'eos-surface',
 tone === 'ok' && 'eos-ok',
 tone === 'warn' && 'eos-warn',
 tone === 'bad' && 'eos-danger',
 className,
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

 return (
 <div className="eos-section eos-card rounded-[30px] border p-1.5">
 <button
 type="button"
 onClick={() => setOpen((value) => !value)}
 aria-expanded={open}
 className="eos-accordion-trigger flex w-full cursor-pointer list-none items-center justify-between gap-3 rounded-[24px] px-4 py-3.5 text-left"
 >
 <span className="eos-title">{title}</span>
 <span className="eos-muted flex items-center gap-2 eos-caption">
 {right}
 <span className="text-base">{open ? '⌃' : '⌄'}</span>
 </span>
 </button>
 {open && <div className="space-y-4 px-3 pb-3.5">{children}</div>}
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

export function CheckboxRow({
 label,
 checked,
 onChange,
}: {
 label: string;
 checked: boolean;
 onChange: (checked: boolean) => void;
}) {
 return (
 <label className="eos-checkbox-row">
 <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
 <span>{label}</span>
 </label>
 );
}

export function Row({ children }: { children: ReactNode }) {
 return <div className="grid min-w-0 grid-cols-1 gap-3">{children}</div>;
}
