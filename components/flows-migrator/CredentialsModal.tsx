'use client';

interface CredentialsModalProps {
  show: boolean;
  credentialsForm: {
    username: string;
    apiKey: string;
  };
  onFormChange: (form: { username: string; apiKey: string }) => void;
  onSave: () => void;
  onClose: () => void;
}

export default function CredentialsModal({
  show,
  credentialsForm,
  onFormChange,
  onSave,
  onClose,
}: CredentialsModalProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
      <div className="bg-[#1a1f29] border border-gray-800 rounded-2xl p-8 max-w-md w-full">
        <h2 className="text-white font-semibold text-2xl mb-2">🔑 Gorgias API Credentials</h2>
        <p className="text-gray-400 text-sm mb-6">
          Required to create AI Guidances from your flows
        </p>

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Gorgias Username (Email)
            </label>
            <input
              type="email"
              value={credentialsForm.username}
              onChange={(e) => onFormChange({ ...credentialsForm, username: e.target.value })}
              placeholder="your.email@company.com"
              className="w-full bg-black/30 border border-gray-700 rounded-lg p-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Gorgias API Key
            </label>
            <input
              type="password"
              value={credentialsForm.apiKey}
              onChange={(e) => onFormChange({ ...credentialsForm, apiKey: e.target.value })}
              placeholder="Enter your API key..."
              className="w-full bg-black/30 border border-gray-700 rounded-lg p-3 text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-gray-500 text-xs mt-1">
              Get from: Gorgias → Settings → REST API → Generate Key
            </p>
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
            onClick={onSave}
            disabled={!credentialsForm.username || !credentialsForm.apiKey}
            className={`flex-1 px-6 py-3 rounded-xl font-medium transition-colors ${
              credentialsForm.username && credentialsForm.apiKey
                ? 'bg-blue-600 text-white hover:bg-blue-500'
                : 'bg-gray-800 text-gray-500 cursor-not-allowed'
            }`}
          >
            Save Credentials
          </button>
        </div>
      </div>
    </div>
  );
}
