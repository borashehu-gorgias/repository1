'use client';

import { useEffect, useState } from 'react';

export default function SettingsPage() {
  const [hasCredentials, setHasCredentials] = useState(false);
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkCredentials();
  }, []);

  async function checkCredentials() {
    try {
      setLoading(true);
      const response = await fetch('/api/credentials');
      const data = await response.json();
      setHasCredentials(data.hasCredentials);
      if (data.username) {
        setUsername(data.username);
      }
    } catch (error) {
      console.error('Error checking credentials:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex items-center justify-center py-20">
          <svg className="animate-spin h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <div className="mb-12">
        <h1 className="text-4xl font-medium tracking-tight mb-3">Settings</h1>
        <p className="text-gray-400 text-base">
          Manage your preferences and API credentials
        </p>
      </div>

      <div className="space-y-6">
        {/* API Credentials Section */}
        <div className="bg-[#1a1f29] border border-gray-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-medium text-white mb-1">API Credentials</h2>
              <p className="text-sm text-gray-400">
                Manage your Gorgias API credentials for flow migration
              </p>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
              hasCredentials
                ? 'bg-emerald-900/40 text-emerald-300 border border-emerald-800/50'
                : 'bg-gray-800 text-gray-400 border border-gray-700'
            }`}>
              {hasCredentials ? 'Configured' : 'Not Set'}
            </div>
          </div>

          {hasCredentials && username && (
            <div className="mt-4 p-4 bg-[#0f1419] border border-gray-700 rounded-xl">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <div>
                  <p className="text-sm text-gray-400">Configured Username</p>
                  <p className="text-white font-mono text-sm">{username}</p>
                </div>
              </div>
            </div>
          )}

          <div className="mt-6 p-4 bg-blue-950/30 border border-blue-900/50 rounded-xl">
            <p className="text-blue-300 text-sm">
              💡 You can update your credentials in the Flows Migrator tab when needed for migration operations.
            </p>
          </div>
        </div>

        {/* User Preferences Section */}
        <div className="bg-[#1a1f29] border border-gray-800 rounded-2xl p-6">
          <div className="mb-4">
            <h2 className="text-xl font-medium text-white mb-1">User Preferences</h2>
            <p className="text-sm text-gray-400">
              Customize your experience
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-[#0f1419] border border-gray-700 rounded-xl">
              <div>
                <p className="text-white font-medium">Theme</p>
                <p className="text-sm text-gray-400">Dark mode is enabled</p>
              </div>
              <div className="px-3 py-1 bg-gray-800 text-gray-400 rounded-lg text-sm font-medium">
                Dark
              </div>
            </div>
          </div>
        </div>

        {/* About Section */}
        <div className="bg-[#1a1f29] border border-gray-800 rounded-2xl p-6">
          <div className="mb-4">
            <h2 className="text-xl font-medium text-white mb-1">About</h2>
            <p className="text-sm text-gray-400">
              Information about this tool
            </p>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-blue-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <div>
                <p className="text-white font-medium">Gorgias Flows Migrator</p>
                <p className="text-gray-400">Migrate flows between accounts or convert to AI Guidances</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
