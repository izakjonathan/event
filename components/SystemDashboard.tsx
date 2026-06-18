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
  }
];

export default function SystemDashboard() {
  return (
    <main className="system-shell no-callout min-h-dvh bg-[var(--paper)] text-[var(--ink)]">
      <div className="system-wrap">
        <header className="system-hero passport-card">
          <div>
            <p className="system-kicker">Event system</p>
            <h1>Event operations</h1>
            <p className="system-intro">
              A modular workspace for planning events, collecting artist submissions and building future event tools.
            </p>
          </div>
        </header>

        <section className="module-grid">
          {modules.map((module) => (
            <Link key={module.title} href={module.href} className={`module-card passport-card ${module.active ? 'module-card-active' : ''}`}>
              <div className="module-card-top">
                <span>{module.label}</span>
                <em>{module.status}</em>
              </div>
              <h2>{module.title}</h2>
              <p>{module.description}</p>
              <div className="module-items">
                {module.items.map((item) => <span key={item}>{item}</span>)}
              </div>
              <div className="module-open">Open</div>
            </Link>
          ))}
        </section>

        <section className="system-note passport-card">
          <p className="system-kicker">Future modules</p>
          <div className="future-list">
            <span>Staff planner</span>
            <span>Contracts</span>
            <span>Supplier list</span>
            <span>Budget reports</span>
          </div>
        </section>
      </div>
    </main>
  );
}
