// TEMPORARY — delete apps/web/src/app/sentry-test/ after verifying Sentry.
import { SentryTestPanel } from './SentryTestPanel';

export default function SentryTestPage() {
  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sentry Frontend Test</h1>
          <p className="mt-1 text-sm text-gray-500">
            Temporary page — click each button, then verify the event appears in your Sentry dashboard.
          </p>
        </div>
        <SentryTestPanel />
      </div>
    </main>
  );
}
