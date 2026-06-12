'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { logout, seedSubmissions } from '@/lib/api';
import { useState } from 'react';

interface DashboardNavProps {
  role?: string;
  email?: string;
}

export function DashboardNav({ role, email }: DashboardNavProps) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [seedMsg, setSeedMsg] = useState('');

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
    } finally {
      router.push('/login');
      router.refresh();
    }
  };

  const handleSeed = async () => {
    setSeeding(true);
    setSeedMsg('');
    try {
      await seedSubmissions();
      setSeedMsg('20 test submissions created!');
      router.refresh();
    } catch {
      setSeedMsg('Seed failed.');
    } finally {
      setSeeding(false);
      setTimeout(() => setSeedMsg(''), 3000);
    }
  };

  return (
    <nav className="border-b border-gray-200 bg-white shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/dashboard" className="text-lg font-bold text-blue-700">
          Moderation Platform
        </Link>

        <div className="flex items-center gap-4">
          {seedMsg && (
            <span className="text-xs text-green-600 font-medium">{seedMsg}</span>
          )}

          {role === 'ADMIN' && (
            <button
              onClick={handleSeed}
              disabled={seeding}
              className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {seeding ? 'Seeding…' : 'Seed Test Data'}
            </button>
          )}

          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">{email}</span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                role === 'ADMIN'
                  ? 'bg-purple-100 text-purple-700'
                  : 'bg-blue-100 text-blue-700'
              }`}
            >
              {role}
            </span>
          </div>

          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="btn-secondary text-xs"
          >
            {loggingOut ? 'Signing out…' : 'Sign out'}
          </button>
        </div>
      </div>
    </nav>
  );
}
