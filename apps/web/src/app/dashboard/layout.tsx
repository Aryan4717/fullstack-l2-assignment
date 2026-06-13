import { DashboardNav } from '@/components/ui/DashboardNav';
import { getServerToken, parseJwtPayload } from '@/lib/auth';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const token = await getServerToken();
  const user = token ? parseJwtPayload(token) : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNav role={user?.role} email={user?.email} />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">{children}</main>
    </div>
  );
}
