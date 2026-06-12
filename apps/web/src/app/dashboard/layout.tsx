import { DashboardNav } from '@/components/ui/DashboardNav';
import { getServerToken, parseJwtPayload } from '@/lib/auth';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const token = await getServerToken();
  const user = token ? parseJwtPayload(token) : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNav role={user?.role} email={user?.email} />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
