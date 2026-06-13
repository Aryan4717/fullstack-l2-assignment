'use client';

import React, { useState } from 'react';
import * as Sentry from '@sentry/nextjs';

type Result = { label: string; eventId: string | undefined; status: 'ok' | 'error' };

// Bomb component — crashes on render to test error boundary
function CrashBomb(): React.ReactElement {
  throw new Error('[SENTRY TEST] React render crash — error boundary verification');
}

export function SentryTestPanel() {
  const [results, setResults] = useState<Result[]>([]);
  const [showCrash, setShowCrash] = useState(false);

  const push = (label: string, eventId: string | undefined) =>
    setResults((prev) => [{ label, eventId, status: eventId ? 'ok' : 'error' }, ...prev]);

  const handleBasic = () => {
    Sentry.setUser({ id: 'fe-test-001', email: 'frontend-test@platform.com', role: 'ADMIN' });
    Sentry.setTag('test.type', 'basic');
    const eventId = Sentry.captureException(
      new Error('[SENTRY TEST] Basic browser exception — safe to ignore')
    );
    push('Basic exception', eventId);
  };

  const handleAdvanced = () => {
    // User context
    Sentry.setUser({ id: 'fe-test-002', email: 'advanced-test@platform.com', role: 'MODERATOR' });

    // Tags
    Sentry.setTag('test.type', 'advanced');
    Sentry.setTag('feature', 'sentry-verification');

    // Custom context
    Sentry.setContext('browser.test', {
      triggeredAt: new Date().toISOString(),
      userAgent: navigator.userAgent,
      screenWidth: window.innerWidth,
    });

    // Breadcrumbs
    Sentry.addBreadcrumb({ category: 'auth', message: 'User viewed dashboard', level: 'info' });
    Sentry.addBreadcrumb({ category: 'ui.click', message: 'Clicked AI Analysis trigger', level: 'info' });
    Sentry.addBreadcrumb({ category: 'fetch', message: 'POST /api/proxy/analyse/123 → 500', level: 'error' });
    Sentry.addBreadcrumb({ category: 'app.error', message: 'About to throw test error', level: 'warning' });

    const err = new Error('[SENTRY TEST] Advanced — breadcrumbs + context + tags + stack trace');
    err.name = 'SentryFrontendAdvancedError';

    const eventId = Sentry.captureException(err, {
      extra: {
        checksCompleted: ['user-context', 'tags', 'custom-context', 'breadcrumbs', 'stack-trace'],
      },
    });
    push('Advanced (breadcrumbs + context + tags)', eventId);
  };

  const handleMessage = () => {
    Sentry.setTag('test.type', 'message');
    const eventId = Sentry.captureMessage(
      '[SENTRY TEST] Custom message event — not an error',
      'warning'
    );
    push('Custom message (warning level)', eventId);
  };

  const handleReplay = () => {
    Sentry.addBreadcrumb({
      category: 'test',
      message: 'Session replay breadcrumb — check Replays tab in Sentry',
      level: 'info',
      data: { timestamp: new Date().toISOString() },
    });
    const eventId = Sentry.captureMessage('[SENTRY TEST] Session replay verification', 'info');
    push('Session replay breadcrumb', eventId);
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="card space-y-3">
        <h2 className="text-base font-semibold text-gray-900">Test Controls</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <button onClick={handleBasic} className="btn-secondary text-sm">
            Basic Exception
          </button>
          <button onClick={handleAdvanced} className="btn-secondary text-sm">
            Advanced Test
          </button>
          <button onClick={handleMessage} className="btn-secondary text-sm">
            Capture Message
          </button>
          <button onClick={handleReplay} className="btn-secondary text-sm">
            Replay Breadcrumb
          </button>
        </div>
        <button
          onClick={() => setShowCrash(true)}
          className="w-full rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
        >
          Crash Page (tests error boundary)
        </button>

        {/* Rendering CrashBomb triggers the React error boundary */}
        {showCrash && <CrashBomb />}
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="card space-y-2">
          <h2 className="text-base font-semibold text-gray-900">Results</h2>
          <ul className="divide-y divide-gray-100">
            {results.map((r, i) => (
              <li key={i} className="flex items-start justify-between gap-4 py-2 text-sm">
                <span className="font-medium text-gray-700">{r.label}</span>
                <span className={r.status === 'ok' ? 'text-green-600' : 'text-red-600'}>
                  {r.status === 'ok' ? (
                    <>sent · <code className="text-xs">{r.eventId}</code></>
                  ) : (
                    'no eventId — SENTRY_DSN not set?'
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Checklist */}
      <div className="card space-y-2 text-sm text-gray-600">
        <h2 className="text-base font-semibold text-gray-900">Verify in Sentry dashboard</h2>
        <ol className="list-inside list-decimal space-y-1">
          <li>Open Sentry → <strong>Issues</strong> tab → look for <code>[SENTRY TEST]</code> events</li>
          <li>Click the Advanced event → check <strong>User</strong> section (email + role)</li>
          <li>Check <strong>Tags</strong> panel → <code>test.type: advanced</code></li>
          <li>Check <strong>Breadcrumbs</strong> → 4 trail entries ending in warning</li>
          <li>Check <strong>Context</strong> → <code>browser.test</code> with userAgent + screenWidth</li>
          <li>Check <strong>Stack Trace</strong> → points to <code>SentryTestPanel.tsx</code></li>
          <li>Open <strong>Replays</strong> tab → find session from this browser</li>
        </ol>
      </div>

      {/* Removal instructions */}
      <div className="rounded-md border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
        <strong>Remove after verification:</strong> delete{' '}
        <code>apps/web/src/app/sentry-test/</code> (this entire folder).
      </div>
    </div>
  );
}
