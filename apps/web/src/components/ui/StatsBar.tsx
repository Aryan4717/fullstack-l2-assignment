import type { Stats } from '@/types';

interface StatsBarProps {
  stats: Stats;
}

const statCards = (s: Stats) => [
  { label: 'Total', value: s.total, color: 'text-blue-700', bg: 'bg-blue-50' },
  { label: 'Pending', value: s.pending, color: 'text-yellow-700', bg: 'bg-yellow-50' },
  { label: 'Approved', value: s.approved, color: 'text-green-700', bg: 'bg-green-50' },
  { label: 'Rejected', value: s.rejected, color: 'text-red-700', bg: 'bg-red-50' },
];

export function StatsBar({ stats }: StatsBarProps) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {statCards(stats).map(({ label, value, color, bg }) => (
        <div key={label} className={`card ${bg} border-0`}>
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <p className={`mt-1 text-3xl font-bold ${color}`}>{value}</p>
        </div>
      ))}
    </div>
  );
}
