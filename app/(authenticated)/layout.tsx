import { requireAuth } from '@/lib/auth-helpers';
import TabNavigation from '@/components/ui/TabNavigation';

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check authentication - redirects to login if not authenticated
  await requireAuth();

  return (
    <div className="min-h-screen bg-[#0f1419] text-white">
      <TabNavigation />
      {children}
    </div>
  );
}
