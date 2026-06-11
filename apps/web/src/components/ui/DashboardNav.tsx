'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { logout } from '@/lib/api';
import { useState } from 'react';

export function DashboardNav() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await logout();
    } finally {
      router.push('/login');
      router.refresh();
    }
  };

  return (
    <nav className="border-b border-gray-200 bg-white shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/dashboard" className="text-lg font-bold text-blue-700">
          Moderation Platform
        </Link>
        <button
          onClick={handleLogout}
          disabled={loading}
          className="btn-secondary text-xs"
        >
          {loading ? 'Signing out…' : 'Sign out'}
        </button>
      </div>
    </nav>
  );
}
