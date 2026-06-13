'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import * as Sentry from '@sentry/nextjs';
import type { AIAnalysis } from '@/types';
import { triggerAnalysis } from '@/lib/api';

interface AIAnalysisPanelProps {
  submissionId: string;
  analysis: AIAnalysis | null;
}

const sentimentColor = (s: string) =>
  s === 'POSITIVE' ? 'text-green-700' : s === 'NEGATIVE' ? 'text-red-700' : 'text-gray-700';

const recommendationColor = (r: string) =>
  r === 'APPROVE' ? 'text-green-700 bg-green-50' : r === 'REJECT' ? 'text-red-700 bg-red-50' : 'text-yellow-700 bg-yellow-50';

const toxicityBar = (score: number) => {
  const pct = (score / 10) * 100;
  const color = score <= 3 ? 'bg-green-500' : score <= 6 ? 'bg-yellow-500' : 'bg-red-500';
  return { pct, color };
};

export function AIAnalysisPanel({ submissionId, analysis: initialAnalysis }: AIAnalysisPanelProps) {
  const router = useRouter();
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(initialAnalysis);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleTrigger = async () => {
    setError(null);
    try {
      const result = await triggerAnalysis(submissionId);
      setAnalysis(result);
      startTransition(() => router.refresh());
    } catch (err) {
      Sentry.captureException(err, { tags: { feature: 'ai-analysis', submissionId } });
      setError(err instanceof Error ? err.message : 'Analysis failed');
    }
  };

  return (
    <div className="card space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">AI Analysis</h2>
        <button
          onClick={handleTrigger}
          disabled={isPending}
          className="btn-secondary text-xs"
        >
          {isPending ? 'Analysing…' : analysis ? 'Re-run Analysis' : 'Trigger AI Analysis'}
        </button>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700" role="alert">
          {error}
        </div>
      )}

      {!analysis && !isPending && (
        <p className="text-sm text-gray-500">
          No analysis yet. Click &quot;Trigger AI Analysis&quot; to run the AI moderation check.
        </p>
      )}

      {analysis && (
        <div className="space-y-4">
          {analysis.errorFlag && (
            <div className="rounded-md bg-yellow-50 p-3 text-sm text-yellow-700">
              Analysis encountered an error — showing fallback values.
            </div>
          )}

          {/* Toxicity score */}
          <div>
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-gray-700">Toxicity Score</span>
              <span className="font-bold text-gray-900">{analysis.toxicityScore}/10</span>
            </div>
            <div className="mt-1 h-2 w-full rounded-full bg-gray-200">
              <div
                className={`h-2 rounded-full transition-all ${toxicityBar(analysis.toxicityScore).color}`}
                style={{ width: `${toxicityBar(analysis.toxicityScore).pct}%` }}
              />
            </div>
          </div>

          {/* Sentiment */}
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium text-gray-700">Sentiment:</span>
            <span className={`font-semibold ${sentimentColor(analysis.sentiment)}`}>
              {analysis.sentiment}
            </span>
          </div>

          {/* Summary */}
          <div className="text-sm">
            <span className="font-medium text-gray-700">Summary: </span>
            <span className="text-gray-600">{analysis.summary}</span>
          </div>

          {/* Recommendation */}
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium text-gray-700">Recommendation:</span>
            <span className={`rounded-full px-3 py-0.5 text-xs font-bold ${recommendationColor(analysis.recommendation)}`}>
              {analysis.recommendation}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
