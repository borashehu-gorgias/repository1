'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function Home() {
  const router = useRouter();
  const [subdomain, setSubdomain] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [require2FA, setRequire2FA] = useState(false);
  const [showManualToken, setShowManualToken] = useState(false);
  const [manualToken, setManualToken] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/flows-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subdomain,
          email,
          password,
          twoFactorCode: require2FA ? twoFactorCode : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.require_2fa) {
          if (data.require_2fa_email) {
            // Email-based device verification - can't work with serverless
            setError(
              'Email verification triggered. To use this tool, please enable app-based 2FA in Gorgias: Settings → Profile → Password & 2FA → Enable 2FA. This replaces email verification with a 6-digit code from your authenticator app.'
            );
            setLoading(false);
            return;
          }
          // App-based 2FA - show code input
          setRequire2FA(true);
          setError('Enter your 2FA code from your authenticator app');
          setLoading(false);
          return;
        }
        if (data.show_recaptcha || data.sso_only) {
          setShowManualToken(true);
          setError(data.error || 'Please use manual token method.');
          setLoading(false);
          return;
        }
        throw new Error(data.error || 'Login failed');
      }

      // Success! Redirect to dashboard
      router.push('/dashboard/flows-migrator');
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleManualToken = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/manual-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subdomain, longJWT: manualToken }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save token');
      }

      router.push('/dashboard/flows-migrator');
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-[#0f1419]">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="mb-6 inline-flex items-center justify-center">
            <Image
              src="/icon.png"
              alt="Gorgias Flows Migrator"
              width={64}
              height={64}
              className="rounded-2xl shadow-2xl"
            />
          </div>
          <h1 className="text-3xl font-medium mb-2 text-white tracking-tight">
            Gorgias Flows Migrator
          </h1>
          <p className="text-gray-400 text-sm">
            Migrate flows between accounts or convert to AI Guidance
          </p>
        </div>

        {!showManualToken ? (
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Subdomain */}
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Gorgias Subdomain
              </label>
              <div className="flex">
                <input
                  type="text"
                  value={subdomain}
                  onChange={(e) => setSubdomain(e.target.value)}
                  placeholder="your-store"
                  className="flex-1 bg-black/30 border border-gray-700 rounded-l-lg p-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <span className="bg-gray-800 border border-l-0 border-gray-700 rounded-r-lg px-3 flex items-center text-gray-400 text-sm">
                  .gorgias.com
                </span>
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full bg-black/30 border border-gray-700 rounded-lg p-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-black/30 border border-gray-700 rounded-lg p-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* 2FA Code (if required) */}
            {require2FA && (
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  2FA Code
                </label>
                <input
                  type="text"
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value)}
                  placeholder="Enter 6-digit code"
                  className="w-full bg-black/30 border border-gray-700 rounded-lg p-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  maxLength={6}
                  autoFocus
                />
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className={`p-3 rounded-lg text-sm ${require2FA && !error.includes('failed') ? 'bg-blue-950/50 border border-blue-900/50 text-blue-300' : 'bg-rose-950/50 border border-rose-900/50 text-rose-300'}`}>
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-xl font-medium text-white transition-all ${loading
                ? 'bg-gray-700 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-900/30 hover:shadow-xl'
                }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Connecting...
                </span>
              ) : require2FA ? (
                'Verify & Connect'
              ) : (
                'Connect to Gorgias'
              )}
            </button>

            {/* Trust Notice */}
            <p className="text-center text-gray-500 text-xs mt-4">
              🔒 Credentials are used once to authenticate, never stored.
            </p>

            {/* Alternative: Manual Token */}
            <div className="text-center pt-4 border-t border-gray-800">
              <button
                type="button"
                onClick={() => setShowManualToken(true)}
                className="text-gray-400 text-sm hover:text-white transition-colors"
              >
                Having trouble? Use manual token instead →
              </button>
            </div>
          </form>
        ) : (
          /* Manual Token Form */
          <form onSubmit={handleManualToken} className="space-y-4">
            <div className="p-4 bg-amber-950/30 border border-amber-900/50 rounded-xl mb-4">
              <p className="text-amber-300 text-sm font-medium mb-2">Manual Token Entry</p>
              <p className="text-amber-200/70 text-xs">
                If login doesn't work (SSO-only, reCAPTCHA, etc.), paste your long JWT token from DevTools.
              </p>
            </div>

            {/* Subdomain */}
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Gorgias Subdomain
              </label>
              <div className="flex">
                <input
                  type="text"
                  value={subdomain}
                  onChange={(e) => setSubdomain(e.target.value)}
                  placeholder="your-store"
                  className="flex-1 bg-black/30 border border-gray-700 rounded-l-lg p-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <span className="bg-gray-800 border border-l-0 border-gray-700 rounded-r-lg px-3 flex items-center text-gray-400 text-sm">
                  .gorgias.com
                </span>
              </div>
            </div>

            {/* Token */}
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Long JWT Token
              </label>
              <textarea
                value={manualToken}
                onChange={(e) => setManualToken(e.target.value)}
                placeholder="eyJhbGciOiJSUzI1NiIsImtpZCI6..."
                className="w-full bg-black/30 border border-gray-700 rounded-lg p-3 text-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[120px]"
                required
              />
            </div>

            {/* Error */}
            {error && (
              <div className="p-3 rounded-lg text-sm bg-rose-950/50 border border-rose-900/50 text-rose-300">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-xl font-medium text-white transition-all ${loading ? 'bg-gray-700 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500'
                }`}
            >
              {loading ? 'Connecting...' : 'Connect with Token'}
            </button>

            {/* Back */}
            <button
              type="button"
              onClick={() => {
                setShowManualToken(false);
                setError('');
              }}
              className="w-full text-gray-400 text-sm hover:text-white transition-colors"
            >
              ← Back to login
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
