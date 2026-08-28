import YimiGoalsSettings from '@/components/YimiGoalsSettings';
import RoleBasedGuard from '@/components/RoleBasedGuard';

export default function AdminYimiGoalsPage() {
  return (
    <RoleBasedGuard requiredRole="admin">
      <YimiGoalsSettings />
    </RoleBasedGuard>
  );
}
