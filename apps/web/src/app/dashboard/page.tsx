import { Suspense } from 'react';
import { getStats, getSubmissions } from '@/lib/api';
import { getServerToken } from '@/lib/auth';
import { StatsBar } from '@/components/ui/StatsBar';
import { StatsBarSkeleton } from '@/components/ui/StatsBarSkeleton';
import { SubmissionList } from '@/components/submissions/SubmissionList';
import { SubmissionListSkeleton } from '@/components/submissions/SubmissionListSkeleton';
import { SubmissionFilters } from '@/components/submissions/SubmissionFilters';
import { Pagination } from '@/components/submissions/Pagination';

interface SearchParams {
  status?: string;
  type?: string;
  search?: string;
  page?: string;
}

interface PageProps {
  searchParams: Promise<SearchParams>;
}

async function StatsSection({ token }: { token?: string }) {
  const stats = await getStats(token);
  return <StatsBar stats={stats} />;
}

async function SubmissionsSection({
  filters,
  token,
}: {
  filters: SearchParams;
  token?: string;
}) {
  const page = filters.page ? parseInt(filters.page, 10) : 1;
  const { data, pagination } = await getSubmissions(
    { ...filters, page, limit: 10 },
    token
  );

  return (
    <>
      <SubmissionList submissions={data} />
      <div className="mt-6">
        <Pagination pagination={pagination} />
      </div>
    </>
  );
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const token = await getServerToken();
  const params = await searchParams;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Moderation Dashboard</h1>
      </div>

      <Suspense fallback={<StatsBarSkeleton />}>
        <StatsSection token={token} />
      </Suspense>

      <div className="card">
        <SubmissionFilters />
        <div className="mt-4">
          <Suspense fallback={<SubmissionListSkeleton />}>
            <SubmissionsSection filters={params} token={token} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
