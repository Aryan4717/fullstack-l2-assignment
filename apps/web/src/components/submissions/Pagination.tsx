'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import type { Pagination as PaginationData } from '@/types';

interface PaginationProps {
  pagination: PaginationData;
}

export function Pagination({ pagination }: PaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { page, totalPages, total, limit } = pagination;

  if (totalPages <= 1) return null;

  const goToPage = (p: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(p));
    router.push(`${pathname}?${params.toString()}`);
  };

  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <div className="flex items-center justify-between text-sm text-gray-600">
      <span>
        Showing {from}–{to} of {total} submissions
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => goToPage(page - 1)}
          disabled={page <= 1}
          className="rounded-md border border-gray-300 px-3 py-1 text-xs disabled:opacity-40 hover:bg-gray-100 transition-colors"
        >
          Previous
        </button>
        {Array.from({ length: Math.min(totalPages, 7) }).map((_, i) => {
          const p = i + 1;
          return (
            <button
              key={p}
              onClick={() => goToPage(p)}
              className={`rounded-md border px-3 py-1 text-xs transition-colors ${
                p === page
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300 hover:bg-gray-100'
              }`}
            >
              {p}
            </button>
          );
        })}
        <button
          onClick={() => goToPage(page + 1)}
          disabled={page >= totalPages}
          className="rounded-md border border-gray-300 px-3 py-1 text-xs disabled:opacity-40 hover:bg-gray-100 transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  );
}
