import ProductRotationManager from '@/components/ProductRotationManager';
import RoleBasedGuard from '@/components/RoleBasedGuard';

export default function ProductRotationPage() {
  return (
    <RoleBasedGuard requiredRole="supervisor">
      <ProductRotationManager />
    </RoleBasedGuard>
  );
}
