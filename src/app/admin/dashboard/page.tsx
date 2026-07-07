import AdminDashboard from '@/components/AdminDashboard';
import RoleBasedGuard from '@/components/RoleBasedGuard';

export default function AdminDashboardPage() {
  return (
    <RoleBasedGuard requiredRole="admin">
      <AdminDashboard />
    </RoleBasedGuard>
  );
}
