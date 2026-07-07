import AdminReportsDashboard from '@/components/AdminReportsDashboard';
import RoleBasedGuard from '@/components/RoleBasedGuard';

export default function AdminReportsPage() {
  return (
    <RoleBasedGuard requiredRole="admin">
      <AdminReportsDashboard />
    </RoleBasedGuard>
  );
}
