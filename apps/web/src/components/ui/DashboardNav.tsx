'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import * as Sentry from '@sentry/nextjs';
import { logout, seedSubmissions } from '@/lib/api';
import { useState, useEffect, useRef, useCallback } from 'react';
import { NavDrawer } from './NavDrawer';

interface DashboardNavProps {
  role?: string;
  email?: string;
}

export function DashboardNav({ role, email }: DashboardNavProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [seedMsg, setSeedMsg] = useState('');

  // Ref for returning focus to the hamburger button when drawer closes
  const hamburgerRef = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(false);

  // Close drawer on route change (e.g. link click inside drawer)
  useEffect(() => {
    setIsDrawerOpen(false);
  }, [pathname]);

  // Return focus to hamburger when drawer closes
  useEffect(() => {
    if (wasOpen.current && !isDrawerOpen) {
      hamburgerRef.current?.focus();
    }
    wasOpen.current = isDrawerOpen;
  }, [isDrawerOpen]);

  const openDrawer = useCallback(() => setIsDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setIsDrawerOpen(false), []);

  const handleLogout = useCallback(async () => {
    setLoggingOut(true);
    try {
      await logout();
    } finally {
      router.push('/login');
      router.refresh();
    }
  }, [router]);

  const handleSeed = useCallback(async () => {
    setSeeding(true);
    setSeedMsg('');
    try {
      await seedSubmissions();
      setSeedMsg('20 submissions created!');
      router.refresh();
    } catch (err) {
      Sentry.captureException(err, { tags: { feature: 'admin-seed' } });
      setSeedMsg('Seed failed.');
    } finally {
      setSeeding(false);
      setTimeout(() => setSeedMsg(''), 4000);
    }
  }, [router]);

  const avatarLetter = email?.[0]?.toUpperCase() ?? '?';

  return (
    <>
      {/* ── Sticky top header ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

          {/* ── Mobile / Tablet (< lg) ─────────────────────────────────── */}
          <div className="flex h-14 items-center justify-between lg:hidden">

            {/* Hamburger button */}
            <button
              ref={hamburgerRef}
              onClick={openDrawer}
              aria-label="Open navigation menu"
              aria-expanded={isDrawerOpen}
              aria-controls="mobile-nav-drawer"
              className="flex h-10 w-10 items-center justify-center rounded-md text-gray-600 transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>

            {/* Logo — centered */}
            <Link
              href="/dashboard"
              className="text-base font-bold text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
            >
              Moderation Platform
            </Link>

            {/* Avatar circle (shows first letter of email) */}
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white select-none ${
                role === 'ADMIN' ? 'bg-purple-600' : 'bg-blue-600'
              }`}
              role="img"
              aria-label={`Signed in as ${email} (${role})`}
            >
              {avatarLetter}
            </div>
          </div>

          {/* ── Desktop (lg+) ─────────────────────────────────────────── */}
          <div className="hidden h-14 items-center justify-between lg:flex">

            {/* Logo */}
            <Link
              href="/dashboard"
              className="text-lg font-bold text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
            >
              Moderation Platform
            </Link>

            {/* Right-side actions */}
            <div className="flex items-center gap-3">
              {seedMsg && (
                <span
                  className="text-xs font-medium text-green-600"
                  role="status"
                  aria-live="polite"
                >
                  {seedMsg}
                </span>
              )}

              {role === 'ADMIN' && (
                <button
                  onClick={handleSeed}
                  disabled={seeding}
                  className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 min-h-[36px]"
                >
                  {seeding ? 'Seeding…' : 'Seed Test Data'}
                </button>
              )}

              {/* User info */}
              <div className="flex items-center gap-2">
                <span className="max-w-[200px] truncate text-xs text-gray-500">
                  {email}
                </span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    role === 'ADMIN'
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}
                >
                  {role}
                </span>
              </div>

              {/* Sign out */}
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 min-h-[36px]"
              >
                {loggingOut ? 'Signing out…' : 'Sign out'}
              </button>
            </div>
          </div>

        </div>
      </header>

      {/* ── Mobile / Tablet drawer ────────────────────────────────────── */}
      <NavDrawer
        id="mobile-nav-drawer"
        isOpen={isDrawerOpen}
        onClose={closeDrawer}
        role={role}
        email={email}
        seeding={seeding}
        seedMsg={seedMsg}
        loggingOut={loggingOut}
        onSeed={handleSeed}
        onLogout={handleLogout}
      />
    </>
  );
}
