'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavDrawerProps {
  id: string;
  isOpen: boolean;
  onClose: () => void;
  role?: string;
  email?: string;
  seeding: boolean;
  seedMsg: string;
  loggingOut: boolean;
  onSeed: () => void;
  onLogout: () => void;
}

export function NavDrawer({
  id,
  isOpen,
  onClose,
  role,
  email,
  seeding,
  seedMsg,
  loggingOut,
  onSeed,
  onLogout,
}: NavDrawerProps) {
  const pathname = usePathname();
  const drawerRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Focus the close button when the drawer opens
  useEffect(() => {
    if (isOpen) {
      // Small delay lets the CSS transition start first
      const raf = requestAnimationFrame(() => closeButtonRef.current?.focus());
      return () => cancelAnimationFrame(raf);
    }
  }, [isOpen]);

  // Focus trap + Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      if (e.key !== 'Tab') return;

      const drawer = drawerRef.current;
      if (!drawer) return;

      const focusable = Array.from(
        drawer.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input, textarea, select, [tabindex]:not([tabindex="-1"])'
        )
      );

      if (!focusable.length) { e.preventDefault(); return; }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Body scroll lock — preserves scroll position on iOS (position: fixed technique)
  useEffect(() => {
    if (!isOpen) return;

    const scrollY = window.scrollY;
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';

    return () => {
      const saved = parseInt(document.body.style.top || '0') * -1;
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      window.scrollTo(0, saved);
    };
  }, [isOpen]);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + '/');

  const avatarLetter = email?.[0]?.toUpperCase() ?? '?';

  return (
    // Both the backdrop and the panel are hidden on desktop — the desktop navbar
    // handles all navigation at lg+. This avoids any SSR/hydration mismatch.
    <div className="lg:hidden" aria-hidden={!isOpen}>
      {/* ── Backdrop ──────────────────────────────────────────────────── */}
      <div
        className={`fixed inset-0 z-40 bg-gray-900/60 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        aria-hidden="true"
        onClick={onClose}
      />

      {/* ── Drawer panel ──────────────────────────────────────────────── */}
      <div
        id={id}
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-white shadow-2xl transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <Link
            href="/dashboard"
            onClick={onClose}
            className="text-base font-bold text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
          >
            Moderation Platform
          </Link>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            aria-label="Close navigation menu"
            className="flex h-9 w-9 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* ── User profile ────────────────────────────────────────────── */}
        <div className="border-b border-gray-100 px-5 py-4">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${
                role === 'ADMIN' ? 'bg-purple-600' : 'bg-blue-600'
              }`}
              aria-hidden="true"
            >
              {avatarLetter}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-gray-900">{email}</p>
              <span
                className={`mt-0.5 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                  role === 'ADMIN'
                    ? 'bg-purple-100 text-purple-700'
                    : 'bg-blue-100 text-blue-700'
                }`}
              >
                {role}
              </span>
            </div>
          </div>
        </div>

        {/* ── Nav links ───────────────────────────────────────────────── */}
        <nav
          className="flex-1 overflow-y-auto px-3 py-4"
          aria-label="Main navigation"
        >
          <ul className="space-y-0.5" role="list">
            <li>
              <Link
                href="/dashboard"
                onClick={onClose}
                aria-current={isActive('/dashboard') ? 'page' : undefined}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset ${
                  isActive('/dashboard')
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                {/* Home icon */}
                <svg className="shrink-0" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
                Dashboard
              </Link>
            </li>
          </ul>

          {/* Admin section */}
          {role === 'ADMIN' && (
            <div className="mt-6">
              <p className="mb-1.5 px-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
                Admin
              </p>
              <ul className="space-y-0.5" role="list">
                <li>
                  <button
                    onClick={onSeed}
                    disabled={seeding}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset disabled:opacity-50"
                  >
                    {/* Database icon */}
                    <svg className="shrink-0" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <ellipse cx="12" cy="5" rx="9" ry="3" />
                      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
                      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
                    </svg>
                    {seeding ? 'Seeding…' : 'Seed Test Data'}
                  </button>
                </li>
              </ul>
              {seedMsg && (
                <p className="mt-2 px-3 text-xs font-medium text-green-600" role="status" aria-live="polite">
                  {seedMsg}
                </p>
              )}
            </div>
          )}
        </nav>

        {/* ── Footer — sign out ────────────────────────────────────────── */}
        <div className="border-t border-gray-100 px-3 py-4">
          <button
            onClick={onLogout}
            disabled={loggingOut}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-red-50 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-inset disabled:opacity-50"
          >
            {/* Logout icon */}
            <svg className="shrink-0" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            {loggingOut ? 'Signing out…' : 'Sign out'}
          </button>
        </div>
      </div>
    </div>
  );
}
