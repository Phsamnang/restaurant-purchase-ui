'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useTranslation } from '@/lib/i18n';
import { 
  Flame, ChefHat, LogOut, Globe, LayoutDashboard, FileText, 
  Wallet, PlusCircle, Menu, X 
} from 'lucide-react';

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export function AppLayout({ children, title, subtitle }: AppLayoutProps) {
  const { user, logout } = useAuth();
  const { language, toggleLanguage, t } = useTranslation();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile drawer whenever route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  if (!user) {
    return <>{children}</>;
  }

  // Support both clean single-language titles or dual-language legacy titles
  const [mainTitle, secondarySubtitle] = title
    ? title.includes(' / ')
      ? title.split(' / ')
      : [title, subtitle || null]
    : [null, subtitle || null];

  const navItems = [
    { 
      name: t('nav.dashboard'), 
      href: '/dashboard', 
      icon: LayoutDashboard,
      isActive: pathname === '/dashboard'
    },
    { 
      name: t('nav.orders'), 
      href: '/requests', 
      icon: FileText,
      isActive: pathname === '/requests' || (pathname.startsWith('/requests/') && pathname !== '/requests/new')
    },
    { 
      name: t('nav.finance'), 
      href: '/finance', 
      icon: Wallet,
      isActive: pathname.startsWith('/finance')
    },
  ];

  const isCreateActive = pathname === '/requests/new';

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* 1. GLOBAL NAVIGATION & HEADER: Clean 3-Column Grid Layout */}
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-md border-b border-border/80 px-4 sm:px-6 py-3 shadow-2xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          {/* Left: Branding */}
          <div className="flex items-center justify-start shrink-0">
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

          {/* Center: Desktop Navigation Items (Balanced Pill Bar) */}
          <nav className="hidden md:flex items-center justify-center gap-1 bg-secondary/80 p-1.5 rounded-full border border-border/60 shadow-inner">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-4 py-1.5 rounded-full text-xs transition-all flex items-center gap-1.5 ${
                    item.isActive
                      ? 'bg-primary text-primary-foreground font-extrabold shadow-sm ring-1 ring-primary/30'
                      : 'font-bold text-muted-foreground hover:text-foreground hover:bg-card/80'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{item.name}</span>
                </Link>
              );
            })}

            {/* Separator inside nav pill */}
            <div className="w-[1px] h-4 bg-border mx-1" />

            {/* High-Contrast Action Pill inside nav: + Create Order */}
            <Link
              href="/requests/new"
              className={`px-4 py-1.5 rounded-full text-xs font-extrabold transition-all flex items-center gap-1.5 shadow-sm ${
                isCreateActive
                  ? 'bg-emerald-700 text-white ring-2 ring-emerald-400'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white active:scale-95'
              }`}
            >
              <PlusCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{t('nav.createOrder')}</span>
            </Link>
          </nav>

          {/* Right: User Profile, Language Switcher & Mobile Menu Button */}
          <div className="flex items-center justify-end gap-2.5 shrink-0">
            <button
              type="button"
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-secondary/80 hover:bg-secondary border border-border/80 text-xs font-bold text-foreground shadow-2xs transition-all active:scale-95 cursor-pointer"
              title={t('nav.switchLang')}
            >
              <Globe className="w-3.5 h-3.5 text-primary shrink-0" />
              <span>{language === 'en' ? '🇺🇸 EN' : '🇰🇭 ខ្មែរ'}</span>
            </button>

            <div className="hidden sm:flex items-center gap-2.5 border-l border-border/80 pl-3">
              <div className="flex items-center gap-2 bg-secondary/40 px-2.5 py-1 rounded-xl border border-border/40">
                <div className="w-7 h-7 rounded-full bg-primary/20 text-primary-hover dark:text-primary flex items-center justify-center font-black text-xs shrink-0">
                  <ChefHat className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-foreground truncate max-w-[120px]">
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

            {/* Mobile Hamburger Toggle Button (< md) */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl bg-secondary hover:bg-secondary/80 border border-border text-foreground transition-all"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>

        {/* Mobile / Tablet Navigation Drawer (< md) */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-3 pt-3 border-t border-border space-y-2 animate-in slide-in-from-top-2 duration-200">
            <div className="grid grid-cols-2 gap-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`p-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all border ${
                      item.isActive
                        ? 'bg-primary text-primary-foreground border-primary shadow-2xs font-extrabold'
                        : 'bg-secondary/60 hover:bg-secondary text-foreground border-border'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{item.name}</span>
                  </Link>
                );
              })}

              <Link
                href="/requests/new"
                className={`p-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all shadow-sm border ${
                  isCreateActive
                    ? 'bg-emerald-700 text-white border-emerald-600 ring-2 ring-emerald-400'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600'
                }`}
              >
                <PlusCircle className="w-4 h-4 shrink-0" />
                <span className="truncate">{t('nav.createOrder')}</span>
              </Link>
            </div>

            {/* Mobile User Profile & Logout */}
            <div className="flex items-center justify-between pt-2 border-t border-border/60">
              <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                <div className="w-7 h-7 rounded-full bg-primary/20 text-primary-hover dark:text-primary flex items-center justify-center font-black">
                  <ChefHat className="w-4 h-4" />
                </div>
                <span>{user.name}</span>
              </div>
              <button
                onClick={logout}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>{t('nav.logout')}</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full">
        {mainTitle && (
          <div className="border-b border-border/80 bg-card/50 backdrop-blur-sm px-4 sm:px-6 py-5 shadow-2xs">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground">{mainTitle}</h1>
                {secondarySubtitle && (
                  <p className="text-xs sm:text-sm font-semibold text-muted-foreground mt-1 leading-relaxed">
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
