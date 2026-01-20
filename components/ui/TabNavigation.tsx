'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { tabs } from '@/lib/tabs-config';
import { useState } from 'react';

export default function TabNavigation() {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });

      if (response.ok) {
        router.push('/');
      }
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <div className="border-b border-gray-800 bg-[#1a1f29]">
      <div className="max-w-7xl mx-auto px-6">
        <nav className="flex gap-1 items-center justify-between">
          <div className="flex gap-1">
            {tabs.map((tab) => {
              const isActive = pathname === tab.path || pathname.startsWith(`${tab.path}/`);

              return (
                <Link
                  key={tab.id}
                  href={tab.path}
                  className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    isActive
                      ? 'border-blue-500 text-white'
                      : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-700'
                  }`}
                >
                  {tab.label}
                </Link>
              );
            })}
          </div>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors disabled:opacity-50"
          >
            {loggingOut ? 'Logging out...' : 'Logout'}
          </button>
        </nav>
      </div>
    </div>
  );
}
