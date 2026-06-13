'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useCallback, useTransition } from 'react';

export function SubmissionFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.delete('page'); // reset to page 1 on filter change
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    },
    [pathname, router, searchParams]
  );

  return (
    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
      {isPending && (
        <span className="text-xs text-gray-400">Updating…</span>
      )}

      {/* Status filter */}
      <select
        value={searchParams.get('status') ?? ''}
        onChange={(e) => updateFilter('status', e.target.value)}
        className="min-h-[40px] rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        aria-label="Filter by status"
      >
        <option value="">All Statuses</option>
        <option value="PENDING">Pending</option>
        <option value="APPROVED">Approved</option>
        <option value="REJECTED">Rejected</option>
      </select>

      {/* Type filter */}
      <select
        value={searchParams.get('type') ?? ''}
        onChange={(e) => updateFilter('type', e.target.value)}
        className="min-h-[40px] rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        aria-label="Filter by type"
      >
        <option value="">All Types</option>
        <option value="ARTICLE">Article</option>
        <option value="COMMENT">Comment</option>
      </select>

      {/* Title search — full-width on mobile, fixed on sm+ */}
      <input
        type="search"
        placeholder="Search by title…"
        defaultValue={searchParams.get('search') ?? ''}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            updateFilter('search', (e.target as HTMLInputElement).value);
          }
        }}
        className="min-h-[40px] w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:w-48"
        aria-label="Search submissions"
      />

      {/* Clear filters */}
      {(searchParams.get('status') || searchParams.get('type') || searchParams.get('search')) && (
        <button
          onClick={() => {
            startTransition(() => router.push(pathname));
          }}
          className="min-h-[40px] px-2 text-xs text-red-500 hover:underline"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
