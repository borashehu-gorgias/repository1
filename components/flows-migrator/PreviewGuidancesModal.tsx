'use client';

interface PreviewGuidancesModalProps {
  show: boolean;
  guidances: Array<{ flowId: string | number; flowName: string; content: string }>;
  pushingGuidances: boolean;
  pushResult: any;
  onUpdateContent: (flowId: string | number, newContent: string) => void;
  onPush: () => void;
  onClose: () => void;
}

export default function PreviewGuidancesModal({
  show,
  guidances,
  pushingGuidances,
  pushResult,
  onUpdateContent,
  onPush,
  onClose,
}: PreviewGuidancesModalProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
      <div className="bg-[#1a1f29] border border-gray-800 rounded-2xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-white font-semibold text-2xl mb-2">👁️ Preview Guidances</h2>
        <p className="text-gray-400 text-sm mb-6">
          Review and edit the generated content before publishing to Gorgias. {guidances.length} guidance{guidances.length !== 1 ? 's' : ''} ready.
        </p>

        {pushResult && (
          <div
            className={`mb-6 p-4 rounded-xl border ${
              pushResult.success
                ? 'bg-emerald-950/40 border-emerald-900/50'
                : 'bg-rose-950/40 border-rose-900/50'
            }`}
          >
            {pushResult.success ? (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <p className="font-medium text-emerald-100">Published Successfully!</p>
                </div>
                <p className="text-sm text-emerald-200/70">
                  {pushResult.summary?.succeeded} of {pushResult.summary?.total} guidances published to Gorgias
                </p>
                {pushResult.guidances && (
                  <div className="mt-3 space-y-1">
                    {pushResult.guidances.map((g: any, i: number) => (
                      <div key={i} className={`text-xs ${g.success ? 'text-emerald-300' : 'text-rose-300'}`}>
                        {g.success ? '✓' : '✗'} {g.title} {g.error ? `- ${g.error}` : ''}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-rose-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <div>
                  <p className="font-medium text-rose-100">Publish Failed</p>
                  <p className="text-sm text-rose-200/70">{pushResult.error}</p>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="space-y-6 mb-6">
          {guidances.map((guidance, index) => (
            <div key={guidance.flowId} className="bg-[#0f1419] border border-gray-700 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-gray-500 text-sm font-mono">#{index + 1}</span>
                <h3 className="text-white font-medium">{guidance.flowName}</h3>
              </div>
              <textarea
                value={guidance.content}
                onChange={(e) => onUpdateContent(guidance.flowId, e.target.value)}
                className="w-full bg-black/30 border border-gray-700 rounded-lg p-4 text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[200px] resize-y"
                placeholder="Guidance content..."
              />
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={pushingGuidances}
            className="flex-1 bg-gray-700 text-white px-6 py-3 rounded-xl font-medium hover:bg-gray-600 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onPush}
            disabled={pushingGuidances || pushResult?.success}
            className={`flex-1 px-6 py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 ${
              pushingGuidances || pushResult?.success
                ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                : 'bg-emerald-600 text-white hover:bg-emerald-500'
            }`}
          >
            {pushingGuidances ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Publishing...
              </>
            ) : pushResult?.success ? (
              '✓ Published'
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Push to Gorgias
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
