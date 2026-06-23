import './globals.css';
import type { Metadata, Viewport } from 'next';
import { EventStoreProvider } from '@/components/EventStore';

export const metadata: Metadata = {
 title: 'EventOS',
 description: 'EventOS mobile planning workspace for events, artists, bar planning and tasks',
};

export const viewport: Viewport = {
 width: 'device-width',
 initialScale: 1,
 maximumScale: 1,
 viewportFit: 'cover',
 themeColor: '#000000',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
 return (
 <html lang="en">
 <body>
 <EventStoreProvider>{children}</EventStoreProvider>
 </body>
 </html>
 );
}
