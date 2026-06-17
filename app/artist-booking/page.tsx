import Link from 'next/link';

export default function ArtistBookingPage() {
  return (
    <main className="system-shell no-callout min-h-dvh bg-[var(--paper)] text-[var(--ink)]">
      <div className="system-wrap">
        <Link href="/" className="back-pill passport-button">← Dashboard</Link>
        <section className="system-hero passport-card">
          <div>
            <p className="system-kicker">Next module</p>
            <h1>Artist booking form</h1>
            <p className="system-intro">
              Placeholder page for the public artist submission form. This will become the link you send to artists.
            </p>
          </div>
          <div className="system-status-pill">
            <span>Status</span>
            <strong>Planned</strong>
          </div>
        </section>

        <section className="placeholder-card passport-card">
          <h2>Planned form fields</h2>
          <div className="future-list">
            <span>Artist name</span>
            <span>Contact info</span>
            <span>Description</span>
            <span>Image</span>
            <span>Availability</span>
            <span>Fee</span>
            <span>Links</span>
            <span>Technical needs</span>
          </div>
        </section>
      </div>
    </main>
  );
}
