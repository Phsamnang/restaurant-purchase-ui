'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useTranslation } from '@/lib/i18n';
import { Flame, ChefHat, LogOut, Globe, LayoutDashboard, FileText } from 'lucide-react';

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export function AppLayout({ children, title, subtitle }: AppLayoutProps) {
  const { user, logout } = useAuth();
  const { language, toggleLanguage, t } = useTranslation();

  if (!user) {
    return <>{children}</>;
  }

  // Support both clean single-language titles or dual-language legacy titles
  const [mainTitle, secondarySubtitle] = title
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
              <div className="w-9 h-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-black shadow-sm group-hover:scale-105 transition-all">
                <Flame className="w-5 h-5 fill-primary-foreground" />
              </div>
              <div className="flex flex-col">
                <span className="font-black text-base tracking-tight text-foreground leading-tight">RestaurantAI</span>
                <span className="text-[10px] font-extrabold text-primary-hover dark:text-primary uppercase tracking-wider">
                  {t('nav.brandSub')}
                </span>
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
              <span>{t('nav.orders')}</span>
            </Link>
            <Link
              href="/requests/new"
              className="px-4 py-1.5 rounded-full text-xs font-bold bg-primary text-primary-foreground hover:bg-primary-hover hover:text-primary active:bg-primary-active active:text-white transition-all flex items-center gap-1.5 shadow-sm"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-primary-foreground animate-pulse" />
              <span>{t('nav.createOrder')}</span>
            </Link>
            <Link
              href="/dashboard"
              className="px-4 py-1.5 rounded-full text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-background transition-all flex items-center gap-1.5"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>{t('nav.dashboard')}</span>
            </Link>
          </nav>

          {/* Right: User Profile & Interactive Language Switcher */}
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-secondary/80 hover:bg-secondary border border-border/80 text-xs font-bold text-foreground shadow-2xs transition-all active:scale-95 cursor-pointer"
              title={t('nav.switchLang')}
            >
              <Globe className="w-3.5 h-3.5 text-primary" />
              <span>{language === 'en' ? '🇺🇸 EN' : '🇰🇭 ខ្មែរ'}</span>
            </button>

            <div className="flex items-center gap-2.5 border-l border-border/80 pl-3">
              <div className="flex items-center gap-2 bg-secondary/40 px-2.5 py-1 rounded-xl border border-border/40">
                <div className="w-7 h-7 rounded-full bg-primary/20 text-primary-hover dark:text-primary flex items-center justify-center font-black text-xs flex-shrink-0">
                  <ChefHat className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-foreground hidden lg:inline-block truncate max-w-[120px]">
                  {user.name}
                </span>
              </div>
              <button
                onClick={logout}
                className="p-2 rounded-xl text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors border border-transparent hover:border-red-200 cursor-pointer"
                title={t('nav.logout')}
              >
                <LogOut className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>
          </div>

        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full">
        {mainTitle && (
          <div className="border-b border-border/80 bg-card/50 backdrop-blur-sm px-4 sm:px-6 py-5 shadow-2xs">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">{mainTitle}</h1>
                {secondarySubtitle && (
                  <p className="text-sm sm:text-base font-bold text-muted-foreground mt-1.5 font-kantumruy leading-relaxed">
                    {secondarySubtitle}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="max-w-7xl mx-auto w-full p-4 sm:p-6 pb-36 sm:pb-44 min-h-[calc(100vh-140px)]">
          {children}
        </div>
      </main>
    </div>
  );
}
