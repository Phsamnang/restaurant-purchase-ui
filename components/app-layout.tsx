'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { Flame, ChefHat, LogOut, Globe, ShoppingBag, LayoutDashboard, FileText } from 'lucide-react';

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export function AppLayout({ children, title, subtitle }: AppLayoutProps) {
  const { user, logout } = useAuth();

  if (!user) {
    return <>{children}</>;
  }

  // Parse dual-language titles (e.g. "Create Market Order / បង្ហោះការបញ្ជាទិញ")
  const [mainTitle, khmerSubtitle] = title
    ? title.includes(' / ')
      ? title.split(' / ')
      : [title, subtitle || null]
    : [null, subtitle || null];

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* 1. GLOBAL NAVIGATION & HEADER: Clean 3-Column Grid Layout */}
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-md border-b border-border/80 px-4 sm:px-6 py-3 shadow-2xs">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-3 items-center gap-4">
          
          {/* Left: Branding */}
          <div className="flex items-center justify-start">
            <Link href="/dashboard" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-[#059669] text-white flex items-center justify-center font-black shadow-sm group-hover:scale-105 transition-all">
                <Flame className="w-5 h-5 fill-white" />
              </div>
              <div className="flex flex-col">
                <span className="font-black text-base tracking-tight text-foreground leading-tight">RestaurantAI</span>
                <span className="text-[10px] font-extrabold text-[#059669] uppercase tracking-wider">Enterprise ERP</span>
              </div>
            </Link>
          </div>

          {/* Center: Navigation Items (Balanced Pill Bar) */}
          <nav className="hidden md:flex items-center justify-center gap-1 bg-secondary/80 p-1.5 rounded-full border border-border/60 shadow-inner">
            <Link
              href="/requests"
              className="px-4 py-1.5 rounded-full text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-background transition-all flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Orders / បញ្ជីទិញ</span>
            </Link>
            <Link
              href="/requests/new"
              className="px-4 py-1.5 rounded-full text-xs font-bold text-[#059669] hover:text-[#059669] hover:bg-background transition-all flex items-center gap-1.5 shadow-2xs bg-background/50"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#059669] animate-pulse" />
              <span>+ Create Order / បង្ហោះ</span>
            </Link>
            <Link
              href="/dashboard"
              className="px-4 py-1.5 rounded-full text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-background transition-all flex items-center gap-1.5"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </Link>
          </nav>

          {/* Right: User Profile & Language Switcher */}
          <div className="flex items-center justify-end gap-3">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-secondary/70 border border-border/60 text-xs font-bold text-muted-foreground shadow-2xs">
              <Globe className="w-3.5 h-3.5 text-[#059669]" />
              <span className="text-foreground">KH</span>
              <span className="opacity-40">/</span>
              <span>EN</span>
            </div>

            <div className="flex items-center gap-2.5 border-l border-border/80 pl-3">
              <div className="flex items-center gap-2 bg-secondary/40 px-2.5 py-1 rounded-xl border border-border/40">
                <div className="w-7 h-7 rounded-full bg-[#059669]/10 text-[#059669] flex items-center justify-center font-black text-xs flex-shrink-0">
                  <ChefHat className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-foreground hidden lg:inline-block truncate max-w-[120px]">
                  {user.name}
                </span>
              </div>
              <button
                onClick={logout}
                className="p-2 rounded-xl text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors border border-transparent hover:border-red-200"
                title="Logout / ចាកចេញ"
              >
                <LogOut className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>
          </div>

        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full">
        {/* 1 (cont). Fix Dual-Language Page Title (No inline slash, Kantumruy Pro subtitle) */}
        {mainTitle && (
          <div className="border-b border-border/80 bg-card/50 backdrop-blur-sm px-4 sm:px-6 py-5 shadow-2xs">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">{mainTitle}</h1>
                {khmerSubtitle && (
                  <p className="text-sm sm:text-base font-bold text-muted-foreground mt-1.5 font-khmer leading-relaxed">
                    {khmerSubtitle}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 3. GLOBAL FLOATING OVERLAYS & VIEWPORTS: Structural Padding-Bottom */}
        <div className="max-w-7xl mx-auto w-full p-4 sm:p-6 pb-36 sm:pb-44 min-h-[calc(100vh-140px)]">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-secondary/40 px-4 py-6 mt-auto print:hidden">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-medium text-muted-foreground">
          <p>&copy; 2026 RestaurantAI Enterprise ERP. Built for Cambodian restaurant procurement.</p>
          <div className="flex items-center gap-4">
            <span>Bilingual Support (KH/EN)</span>
            <span>•</span>
            <span>Mobile & Touch Optimized</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
