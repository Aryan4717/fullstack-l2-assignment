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

  // Limit page buttons: show at most 5 numbered pages to prevent overflow on mobile.
  const maxButtons = 5;
  const half = Math.floor(maxButtons / 2);
  const startPage = Math.max(1, Math.min(page - half, totalPages - maxButtons + 1));
  const endPage = Math.min(totalPages, startPage + maxButtons - 1);
  const pages = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);

  return (
    <div className="flex flex-col gap-3 text-sm text-gray-600 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-center sm:text-left">
        Showing {from}–{to} of {total} submissions
      </span>

      <div className="flex flex-wrap items-center justify-center gap-1 sm:justify-end">
        <button
          onClick={() => goToPage(page - 1)}
          disabled={page <= 1}
          className="min-h-[36px] rounded-md border border-gray-300 px-3 py-1 text-xs disabled:opacity-40 hover:bg-gray-100 transition-colors"
        >
          Previous
        </button>

        {startPage > 1 && (
          <>
            <button
              onClick={() => goToPage(1)}
              className="min-h-[36px] rounded-md border border-gray-300 px-3 py-1 text-xs hover:bg-gray-100 transition-colors"
            >
              1
            </button>
            {startPage > 2 && <span className="px-1 text-gray-400">…</span>}
          </>
        )}

        {pages.map((p) => (
          <button
            key={p}
            onClick={() => goToPage(p)}
            className={`min-h-[36px] rounded-md border px-3 py-1 text-xs transition-colors ${
              p === page
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-300 hover:bg-gray-100'
            }`}
          >
            {p}
          </button>
        ))}

        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <span className="px-1 text-gray-400">…</span>}
            <button
              onClick={() => goToPage(totalPages)}
              className="min-h-[36px] rounded-md border border-gray-300 px-3 py-1 text-xs hover:bg-gray-100 transition-colors"
            >
              {totalPages}
            </button>
          </>
        )}

        <button
          onClick={() => goToPage(page + 1)}
          disabled={page >= totalPages}
          className="min-h-[36px] rounded-md border border-gray-300 px-3 py-1 text-xs disabled:opacity-40 hover:bg-gray-100 transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  );
}
