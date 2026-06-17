import Link from 'next/link';

export default function ArtistsPage() {
  return (
    <main className="system-shell no-callout min-h-dvh bg-[var(--paper)] text-[var(--ink)]">
      <div className="system-wrap">
        <Link href="/" className="back-pill passport-button">← Dashboard</Link>
        <section className="system-hero passport-card">
          <div>
            <p className="system-kicker">Internal module</p>
            <h1>Artist submissions</h1>
            <p className="system-intro">
              Placeholder page for reviewing artist submissions. Later, these entries can be connected to Event Planner events.
            </p>
          </div>
          <div className="system-status-pill">
            <span>Status</span>
            <strong>Planned</strong>
          </div>
        </section>

        <section className="placeholder-card passport-card">
          <h2>Submission workflow</h2>
          <div className="future-list">
            <span>New</span>
            <span>Interested</span>
            <span>Contacted</span>
            <span>Booked</span>
            <span>Rejected</span>
            <span>Archived</span>
          </div>
        </section>
      </div>
    </main>
  );
}
