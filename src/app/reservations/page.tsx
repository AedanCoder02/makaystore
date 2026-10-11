import ReservationFlow from '@/components/reservations/ReservationFlow';

export const metadata = { title: 'Reservas — Makay Beach Club' };
export const dynamic = 'force-dynamic';

export default function ReservationsPage() {
  return <ReservationFlow />;
}
