'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function SubdomainPage() {
  const router = useRouter();
  const [subdomain, setSubdomain] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (subdomain.trim()) {
      router.push(`/api/auth/gorgias?account=${encodeURIComponent(subdomain.trim())}`);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#0f1419] px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="mb-6 inline-flex items-center justify-center">
            <Image 
              src="/icon.png" 
              alt="Flows to Guidance Migrator" 
              width={64}
              height={64}
              className="rounded-xl shadow-xl"
            />
          </div>
          <h1 className="text-3xl font-medium mb-2 text-white">
            Connect Your Account
          </h1>
          <p className="text-gray-400">
            Enter your Gorgias subdomain to continue
          </p>
        </div>

        <div className="bg-[#1a1f29] border border-gray-800 rounded-2xl p-8">
          <form onSubmit={handleSubmit}>
            <label className="block mb-3 text-sm font-medium text-gray-300">
              Gorgias Subdomain
            </label>
            <div className="flex items-center gap-2 mb-6">
              <input
                type="text"
                value={subdomain}
                onChange={(e) => setSubdomain(e.target.value)}
                placeholder="your-store"
                className="flex-1 px-4 py-3 bg-[#0f1419] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                required
              />
              <span className="text-gray-400 text-sm whitespace-nowrap">.gorgias.com</span>
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-500 transition-all shadow-lg shadow-blue-900/30"
            >
              Continue
            </button>
          </form>
        </div>

        <p className="mt-6 text-sm text-gray-500 text-center">
          Your subdomain is part of your Gorgias URL
        </p>
      </div>
    </div>
  );
}
