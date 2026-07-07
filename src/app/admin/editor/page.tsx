import MarketingEditor from '@/components/MarketingEditor';
import RoleBasedGuard from '@/components/RoleBasedGuard';

export default function MarketingEditorPage() {
  return (
    <RoleBasedGuard requiredRole="admin">
      <MarketingEditor />
    </RoleBasedGuard>
  );
}
