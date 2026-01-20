'use client';

interface TokenModalProps {
  subdomain: string;
  onSubmit: () => void;
}

export default function TokenModal({ subdomain, onSubmit }: TokenModalProps) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-[#0f1419] p-6">
      <div className="bg-[#1a1f29] border border-gray-800 rounded-2xl p-8 max-w-2xl w-full">
        <h2 className="text-white font-semibold text-2xl mb-4">🔑 Get Your Flows Token</h2>
        <p className="text-gray-400 mb-6">
          Follow these steps to retrieve your token from Gorgias:
        </p>

        <div className="bg-[#0f1419] border border-gray-700 rounded-xl p-6 mb-6 space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-sm font-medium">1</span>
              <span className="text-white font-medium">Open Gorgias and DevTools</span>
            </div>
            <div className="ml-8 text-gray-400 text-sm space-y-1">
              <p>
                • Open{' '}
                <a
                  href={`https://${subdomain}.gorgias.com/app`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 underline"
                >
                  Gorgias
                </a>
                {' '}in a new tab
              </p>
              <p>• Press <kbd className="bg-black/40 px-2 py-0.5 rounded text-xs font-mono">F12</kbd> to open DevTools</p>
              <p>• Click the <strong className="text-white">Network</strong> tab</p>
              <p>• Press <kbd className="bg-black/40 px-2 py-0.5 rounded text-xs font-mono">Cmd+R</kbd> (Mac) or <kbd className="bg-black/40 px-2 py-0.5 rounded text-xs font-mono">Ctrl+R</kbd> (Windows) to refresh</p>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-sm font-medium">2</span>
              <span className="text-white font-medium">Find the auth request</span>
            </div>
            <div className="ml-8 text-gray-400 text-sm space-y-1">
              <p>• In the Network tab, search for <code className="bg-black/40 px-2 py-0.5 rounded text-xs font-mono">gorgias-apps/auth</code></p>
              <p>• Click on the request to view details</p>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-sm font-medium">3</span>
              <span className="text-white font-medium">Copy the token</span>
            </div>
            <div className="ml-8 text-gray-400 text-sm space-y-1">
              <p>• Click the <strong className="text-white">Response</strong> tab</p>
              <p>• Find the <code className="bg-black/40 px-2 py-0.5 rounded text-xs font-mono">"token"</code> field</p>
              <p>• Copy the long token value (starts with <code className="bg-black/40 px-2 py-0.5 rounded text-xs font-mono">eyJ...</code>)</p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <label className="block text-gray-300 text-sm font-medium">
            Paste your token below:
          </label>
          <textarea
            id="longJWTInput"
            placeholder="eyJhbGciOiJSUzI1NiIsImtpZCI6..."
            className="w-full bg-black/30 border border-gray-700 rounded-lg p-3 text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[120px]"
          />
          <button
            onClick={onSubmit}
            className="w-full bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-500 transition-colors shadow-lg shadow-blue-900/30"
          >
            Load Flows
          </button>
        </div>
      </div>
    </div>
  );
}
