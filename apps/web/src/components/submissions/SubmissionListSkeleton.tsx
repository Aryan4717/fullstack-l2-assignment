export function SubmissionListSkeleton() {
  return (
    <ul className="divide-y divide-gray-100">
      {Array.from({ length: 5 }).map((_, i) => (
        <li key={i} className="animate-pulse py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 space-y-2">
              <div className="h-4 w-2/3 rounded bg-gray-200" />
              <div className="h-3 w-1/3 rounded bg-gray-200" />
            </div>
            <div className="flex gap-2">
              <div className="h-5 w-16 rounded-full bg-gray-200" />
              <div className="h-5 w-16 rounded-full bg-gray-200" />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
