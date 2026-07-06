'use client';

import { useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/navbar';
import { CategoryBar } from '@/components/market/category-bar';

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.push('/dashboard');
      } else {
        router.push('/login');
      }
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <CategoryBar />
      {/* Main Content Wrapper with pb-28 Overlap Prevention Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 pb-28">
        <div className="flex items-center justify-center h-64 text-slate-500 font-medium animate-pulse">
          Loading restaurant dashboard...
        </div>
      </main>
    </div>
  );
}
