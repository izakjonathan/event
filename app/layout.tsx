import './globals.css';
import type { Metadata, Viewport } from 'next';
import { EventStoreProvider } from '@/components/EventStore';

export const metadata: Metadata = {
 title: 'EventOS',
 description: 'EventOS mobile planning workspace for events, artists, bar planning and tasks',
 icons: {
  icon: [
   { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
   { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
   { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
  ],
  apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  shortcut: '/favicon-32.png',
 },
 manifest: '/manifest.webmanifest',
 appleWebApp: {
  capable: true,
  title: 'EventOS',
  statusBarStyle: 'black-translucent',
 },
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
 <head>
 <link rel="preconnect" href="https://fonts.googleapis.com" />
 <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
 <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300..900&family=Space+Grotesk:wght@300..700&display=swap" rel="stylesheet" />
 </head>
 <body>
 <EventStoreProvider>{children}</EventStoreProvider>
 </body>
 </html>
 );
}
