'use client';

interface ImportFlowsModalProps {
  show: boolean;
  importing: boolean;
  importFile: any;
  importForm: {
    targetLongJWT: string;
    targetShopName: string;
    targetIntegrationType: string;
  };
  importResult: any;
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onFormChange: (form: any) => void;
  onImport: () => void;
  onClose: () => void;
}

export default function ImportFlowsModal({
  show,
  importing,
  importFile,
  importForm,
  importResult,
  onFileUpload,
  onFormChange,
  onImport,
  onClose,
}: ImportFlowsModalProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
      <div className="bg-[#1a1f29] border border-gray-800 rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-white font-semibold text-2xl mb-2">📥 Import Flows</h2>
        <p className="text-gray-400 text-sm mb-6">
          Upload an exported flows file and import to a Gorgias account
        </p>

        {importResult && (
          <div
            className={`mb-6 p-4 rounded-xl border ${
              importResult.success
                ? 'bg-emerald-950/40 border-emerald-900/50'
                : 'bg-rose-950/40 border-rose-900/50'
            }`}
          >
            {importResult.success ? (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <p className="font-medium text-emerald-100">Import Complete!</p>
                </div>
                <p className="text-sm text-emerald-200/70">
                  Successfully imported {importResult.summary?.succeeded} of {importResult.summary?.total} flows
                </p>
                {importResult.results && (
                  <div className="mt-3 space-y-1">
                    {importResult.results.map((r: any, i: number) => (
                      <div key={i} className={`text-xs ${r.success ? 'text-emerald-300' : 'text-rose-300'}`}>
                        {r.success ? '✓' : '✗'} {r.name} {r.error ? `- ${r.error}` : ''}
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
                  <p className="font-medium text-rose-100">Import Failed</p>
                  <p className="text-sm text-rose-200/70">{importResult.error}</p>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Upload Export File
            </label>
            <input
              type="file"
              accept=".json"
              onChange={onFileUpload}
              className="w-full bg-black/30 border border-gray-700 rounded-lg p-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-600 file:text-white file:font-medium hover:file:bg-blue-500 file:cursor-pointer"
            />
            {importFile && (
              <div className="mt-2 p-3 bg-emerald-950/30 border border-emerald-900/50 rounded-lg">
                <p className="text-emerald-300 text-sm">
                  ✓ Loaded {importFile.flowCount} flow(s) from {importFile.sourceSubdomain || 'export'}
                </p>
                <p className="text-emerald-200/60 text-xs mt-1">
                  Exported: {new Date(importFile.exportedAt).toLocaleString()}
                </p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Target Account Long JWT Token
            </label>
            <textarea
              value={importForm.targetLongJWT}
              onChange={(e) => onFormChange({ ...importForm, targetLongJWT: e.target.value })}
              placeholder="eyJhbGciOiJSUzI1NiIsImtpZCI6..."
              className="w-full bg-black/30 border border-gray-700 rounded-lg p-3 text-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
            />
            <div className="mt-2 p-3 bg-blue-950/30 border border-blue-900/50 rounded-lg">
              <p className="text-blue-300 text-xs font-medium mb-1">How to get the token:</p>
              <ol className="text-blue-200/70 text-xs space-y-1 list-decimal list-inside">
                <li>Log into the <strong>target</strong> Gorgias account</li>
                <li>Open DevTools (F12) → Network tab</li>
                <li>Refresh and search for <code className="bg-black/30 px-1 rounded">gorgias-apps/auth</code></li>
                <li>Click the request → Response tab → copy the <code className="bg-black/30 px-1 rounded">token</code> value</li>
              </ol>
            </div>
          </div>

          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Target Shop Name (Shopify Store Name)
            </label>
            <input
              type="text"
              value={importForm.targetShopName}
              onChange={(e) => onFormChange({ ...importForm, targetShopName: e.target.value })}
              placeholder="my-store-name"
              className="w-full bg-black/30 border border-gray-700 rounded-lg p-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="mt-2 p-3 bg-amber-950/30 border border-amber-900/50 rounded-lg">
              <p className="text-amber-300 text-xs font-medium mb-1">⚠️ Required for flows to appear in Gorgias UI!</p>
              <p className="text-amber-200/70 text-xs">
                Find this in the Gorgias URL when editing a flow: <code className="bg-black/30 px-1 rounded">/flows/shopify/[shop-name]/edit/...</code>
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-700 text-white px-6 py-3 rounded-xl font-medium hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onImport}
            disabled={!importFile || !importForm.targetLongJWT || importing}
            className={`flex-1 px-6 py-3 rounded-xl font-medium transition-colors ${
              importFile && importForm.targetLongJWT && !importing
                ? 'bg-blue-600 text-white hover:bg-blue-500'
                : 'bg-gray-800 text-gray-500 cursor-not-allowed'
            }`}
          >
            {importing ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Importing...
              </span>
            ) : (
              'Import Flows'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
