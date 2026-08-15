import AdminReportsDashboard from '@/components/AdminReportsDashboard';
import RoleBasedGuard from '@/components/RoleBasedGuard';

export default function SupervisorReportsPage() {
  return (
    <RoleBasedGuard requiredRole="supervisor">
      <AdminReportsDashboard />
    </RoleBasedGuard>
  );
}
