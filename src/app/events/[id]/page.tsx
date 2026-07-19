import EventDetailPage from '@/components/events/EventDetailPage';
export const metadata = { title: 'Event — Makay Beach Club' };
export default function EventPage({ params }: { params: Promise<{ id: string }> }) {
  return <EventDetailPage paramsPromise={params} />;
}
