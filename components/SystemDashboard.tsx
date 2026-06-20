'use client';

import Link from 'next/link';

type ModuleCard = {
  title: string;
  label: string;
  description: string;
  href: string;
  status: string;
  items: string[];
  active?: boolean;
};

const modules: ModuleCard[] = [
  {
    title: 'Event Planner',
    label: 'Live module',
    description: 'Revenue, expenses, tickets, bar spend, files and event forecasts.',
    href: '/event-planner',
    status: 'Ready',
    active: true,
    items: ['Forecast calculator', 'Ticket scenarios', 'Event files', 'Supabase sync']
  },
  {
    title: 'Artist Management',
    label: 'Internal',
    description: 'Review submitted artists, update their status and prepare bookings for events.',
    href: '/artists',
    status: 'Live',
    items: ['Submission cards', 'Status tracking', 'Contact info', 'Booking notes']
  },
  {
    title: 'Calendar / Schedule',
    label: 'Overview',
    description: 'See all events, linked artists, set times and missing planning info.',
    href: '/calendar',
    status: 'Live',
    items: ['Event dates', 'Artist set times', 'Warnings', 'Quick links']
  },
  {
    title: 'Bar Planner',
    label: 'Live module',
    description: 'Plan products, prices, quantities, staffing and event menus.',
    href: '/bar-planner',
    status: 'Live',
    items: ['Products', 'Buy/sell prices', 'Staffing', 'Menu builder']
  },
  {
    title: 'Project Management',
    label: 'Live module',
    description: 'Manage projects, tasks, owners, deadlines and linked events.',
    href: '/project-management',
    status: 'Live',
    items: ['Projects', 'Tasks', 'Owners', 'Deadlines']
  }
];

export default function SystemDashboard() {
  return (
    <main className="ds-page module-dashboard system-shell no-callout min-h-dvh bg-[var(--paper)] text-[var(--ink)]">
      <div className="ds-wrap system-wrap">
        <header className="nb-landing-hero ds-card">
          <div className="nb-landing-meta">
            <span>EVENT OPS</span>
            <span>COPENHAGEN</span>
            <span>LIVE SYSTEM</span>
          </div>
          <div className="nb-landing-title-wrap">
            <h1>OPERATIONS<br />SYSTEM</h1>
            <p>
              A clear workspace for events, artists, bars, schedules and projects.
            </p>
          </div>
          <Link href="/event-planner" className="nb-primary-link">
            Open planner
          </Link>
        </header>

        <section className="nb-module-list">
          {modules.map((module, index) => (
            <Link key={module.title} href={module.href} className={`nb-module-row ${module.active ? 'is-active' : ''}`}>
              <span className="nb-module-index">{String(index + 1).padStart(2, '0')}</span>
              <div className="nb-module-main">
                <span>{module.label}</span>
                <strong>{module.title}</strong>
              </div>
              <em>{module.status}</em>
            </Link>
          ))}
        </section>

        <section className="nb-footer-note">
          <span>Future modules</span>
          <p>Staff planner · Contracts · Supplier list · Budget reports</p>
        </section>
      </div>
    </main>
  );
}
