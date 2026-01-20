'use client';

interface ResultBannerProps {
  result: {
    success: boolean;
    count?: number;
    error?: string;
  };
}

export default function ResultBanner({ result }: ResultBannerProps) {
  return (
    <div
      className={`mb-6 p-5 rounded-xl border ${
        result.success
          ? 'bg-emerald-950/40 border-emerald-900/50'
          : 'bg-rose-950/40 border-rose-900/50'
      }`}
    >
      {result.success ? (
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-emerald-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <div>
            <p className="font-medium text-emerald-100">Migration successful!</p>
            <p className="text-sm text-emerald-200/70 mt-1">
              Migrated {result.count} flows to AI Guidances
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-rose-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          <div>
            <p className="font-medium text-rose-100">Migration failed</p>
            <p className="text-sm text-rose-200/70 mt-1">{result.error}</p>
          </div>
        </div>
      )}
    </div>
  );
}
