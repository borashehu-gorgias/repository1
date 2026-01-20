'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';

function ErrorContent() {
  const searchParams = useSearchParams();
  const message = searchParams.get('message') || 'An unknown error occurred';

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#0f1419] px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="mx-auto flex items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-br from-rose-500 to-red-600 mb-6 shadow-xl shadow-rose-900/30">
            <svg
              className="h-8 w-8 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h2 className="text-3xl font-medium text-white mb-2">
            Authentication Error
          </h2>
          <p className="text-gray-400">Something went wrong</p>
        </div>

        <div className="bg-[#1a1f29] border border-gray-800 rounded-2xl p-8 mb-6">
          <p className="text-gray-300 text-center leading-relaxed">
            {decodeURIComponent(message)}
          </p>
        </div>

        <Link
          href="/"
          className="block w-full text-center bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-500 transition-all shadow-lg shadow-blue-900/30"
        >
          Try Again
        </Link>
      </div>
    </div>
  );
}

export default function ErrorPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-[#0f1419]">
        <div className="text-gray-400">Loading...</div>
      </div>
    }>
      <ErrorContent />
    </Suspense>
  );
}
