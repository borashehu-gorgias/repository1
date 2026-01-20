'use client';

interface MigrationActionsProps {
  disabled: boolean;
  migrating: boolean;
  showOptions: boolean;
  generatingPreview: boolean;
  exporting: boolean;
  onToggleOptions: () => void;
  onPreview: () => void;
  onMigrateToAccount: () => void;
  onExport: () => void;
}

export default function MigrationActions({
  disabled,
  migrating,
  showOptions,
  generatingPreview,
  exporting,
  onToggleOptions,
  onPreview,
  onMigrateToAccount,
  onExport,
}: MigrationActionsProps) {
  return (
    <div className="relative">
      <button
        onClick={onToggleOptions}
        disabled={disabled || migrating}
        className={`px-6 py-2.5 rounded-xl font-medium text-sm transition-all flex items-center gap-2 ${
          disabled || migrating
            ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-900/30'
        }`}
      >
        {migrating ? (
          <>
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Migrating...
          </>
        ) : (
          <>
            Migrate Selected
            <svg className={`w-4 h-4 transition-transform ${showOptions ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </>
        )}
      </button>

      {showOptions && !migrating && (
        <div className="absolute right-0 mt-2 w-64 bg-[#1a1f29] border border-gray-700 rounded-xl shadow-xl z-10 overflow-hidden">
          <button
            onClick={() => {
              onPreview();
            }}
            disabled={generatingPreview}
            className="w-full px-4 py-3 text-left hover:bg-[#252b38] transition-colors border-b border-gray-800"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-600/20 flex items-center justify-center">
                {generatingPreview ? (
                  <svg className="animate-spin w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </div>
              <div>
                <p className="text-white text-sm font-medium">
                  {generatingPreview ? 'Generating Preview...' : 'Preview Guidance'}
                </p>
                <p className="text-gray-400 text-xs">Review & edit before publishing</p>
              </div>
            </div>
          </button>
          <button
            onClick={() => {
              onMigrateToAccount();
            }}
            className="w-full px-4 py-3 text-left hover:bg-[#252b38] transition-colors border-b border-gray-800"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-600/20 flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </div>
              <div>
                <p className="text-white text-sm font-medium">To Another Account</p>
                <p className="text-gray-400 text-xs">Copy flows to different Gorgias</p>
              </div>
            </div>
          </button>
          <button
            onClick={() => {
              onExport();
            }}
            disabled={exporting}
            className="w-full px-4 py-3 text-left hover:bg-[#252b38] transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-purple-600/20 flex items-center justify-center">
                <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </div>
              <div>
                <p className="text-white text-sm font-medium">{exporting ? 'Exporting...' : 'Export to File'}</p>
                <p className="text-gray-400 text-xs">Download as JSON backup</p>
              </div>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
