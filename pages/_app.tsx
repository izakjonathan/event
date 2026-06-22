import type { AppProps } from 'next/app';
import '../styles/globals.css';
import { EventStoreProvider } from '@/components/EventStore';
export default function App({ Component, pageProps }: AppProps) {
  return <EventStoreProvider><Component {...pageProps} /></EventStoreProvider>;
}
