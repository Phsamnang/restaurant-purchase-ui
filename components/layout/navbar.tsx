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

export function Navbar() {
  const { user, logout } = useAuth();
  const { language, toggleLanguage, t } = useTranslation();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const navItems = [
    { 
      name: t('nav.dashboard'),
      nameEn: 'Dashboard',
      nameKh: 'ផ្ទាំងគ្រប់គ្រង',
      href: '/dashboard', 
      icon: LayoutDashboard,
      isActive: pathname === '/dashboard' || pathname === '/'
    },
    { 
      name: t('nav.orders'),
      nameEn: 'Orders',
      nameKh: 'បញ្ជីទិញ',
      href: '/requests', 
      icon: FileText,
      isActive: pathname === '/requests' || (pathname.startsWith('/requests/') && pathname !== '/requests/new')
    },
    { 
      name: t('nav.finance'),
      nameEn: 'Finance',
      nameKh: 'ហិរញ្ញវត្ថុ',
      href: '/finance', 
      icon: Wallet,
      isActive: pathname.startsWith('/finance')
    },
  ];

  const isCreateActive = pathname === '/requests/new';

  return (
    <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-md border-b border-border/80 px-3 sm:px-6 py-2 md:py-3 shadow-2xs">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 md:gap-4">
        
        {/* Left: Branding */}
        <div className="flex items-center justify-start shrink-0">
          <Link href="/dashboard" className="flex items-center gap-2 group">
            <div className="w-8 h-8 md:w-9 md:h-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-black shadow-sm group-hover:scale-105 transition-all">
              <Flame className="w-4 h-4 md:w-5 md:h-5 fill-primary-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="font-black text-sm md:text-base tracking-tight text-foreground leading-tight">RestaurantAI</span>
              <span className="hidden sm:block text-[10px] font-extrabold text-primary-hover dark:text-primary uppercase tracking-wider">
                {t('nav.brandSub')}
              </span>
            </div>
          </Link>
        </div>

        {/* Center: Desktop Navigation Items (Balanced Pill Bar - Hidden on Mobile) */}
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

          <div className="w-[1px] h-4 bg-border mx-1" />

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

        {/* Right: User Profile & Language Switcher (Desktop >= md) */}
        <div className="hidden md:flex items-center justify-end gap-2.5 shrink-0">
          <button
            type="button"
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-secondary/80 hover:bg-secondary border border-border/80 text-xs font-bold text-foreground shadow-2xs transition-all active:scale-95 cursor-pointer"
            title={t('nav.switchLang')}
          >
            <Globe className="w-3.5 h-3.5 text-primary shrink-0" />
            <span>{language === 'en' ? '🇺🇸 EN' : '🇰🇭 ខ្មែរ'}</span>
          </button>

          {user && (
            <div className="flex items-center gap-2.5 border-l border-border/80 pl-3">
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
          )}
        </div>

        {/* Right: Mobile Actions (< md) - Single Primary Action + Hamburger Menu */}
        <div className="flex md:hidden items-center justify-end gap-1.5 shrink-0">
          <Link
            href="/requests/new"
            className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs active:scale-95 transition-all flex items-center justify-center"
            title="+ Create Order"
          >
            <PlusCircle className="w-4 h-4" />
          </Link>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl bg-secondary hover:bg-secondary/80 border border-border text-foreground transition-all flex items-center justify-center"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>

      </div>

      {/* Mobile / Tablet Navigation Drawer (< md) */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-2 pt-3 border-t border-border space-y-2.5 animate-in slide-in-from-top-2 duration-200">
          <div className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`p-3 rounded-xl flex items-center gap-3 transition-all border ${
                    item.isActive
                      ? 'bg-primary text-primary-foreground border-primary shadow-sm font-extrabold'
                      : 'bg-secondary/60 hover:bg-secondary text-foreground border-border/60'
                  }`}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  <div className="flex flex-col text-left min-w-0 flex-1">
                    <span className="text-sm font-bold leading-tight truncate">{item.nameEn}</span>
                    <span className={`text-[11px] font-semibold leading-tight mt-0.5 truncate ${
                      item.isActive ? 'text-primary-foreground/90' : 'text-muted-foreground'
                    }`}>
                      {item.nameKh}
                    </span>
                  </div>
                </Link>
              );
            })}

            <Link
              href="/requests/new"
              className={`p-3 rounded-xl flex items-center gap-3 transition-all shadow-sm border ${
                isCreateActive
                  ? 'bg-emerald-700 text-white border-emerald-600 ring-2 ring-emerald-400 font-extrabold'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 font-bold'
              }`}
            >
              <PlusCircle className="w-5 h-5 shrink-0" />
              <div className="flex flex-col text-left min-w-0 flex-1">
                <span className="text-sm font-extrabold leading-tight truncate">+ Create Order</span>
                <span className={`text-[11px] font-semibold leading-tight mt-0.5 truncate ${
                  isCreateActive ? 'text-emerald-100' : 'text-emerald-100/90'
                }`}>
                  + បង្ហោះការបញ្ជាទិញ
                </span>
              </div>
            </Link>
          </div>

          {/* Language Switcher Card inside Drawer */}
          <div className="pt-2 border-t border-border/60">
            <button
              type="button"
              onClick={toggleLanguage}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-secondary/80 hover:bg-secondary border border-border/80 text-xs font-bold text-foreground shadow-2xs transition-all active:scale-95 cursor-pointer"
              title={t('nav.switchLang')}
            >
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-primary shrink-0" />
                <span>{t('nav.switchLang')}</span>
              </div>
              <span className="px-2 py-0.5 rounded-md bg-background text-[10px] font-extrabold border border-border">
                {language === 'en' ? '🇺🇸 EN' : '🇰🇭 ខ្មែរ'}
              </span>
            </button>
          </div>

          {user && (
            <div className="flex items-center justify-between pt-2 border-t border-border/60">
              <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
                <div className="w-8 h-8 rounded-full bg-primary/20 text-primary-hover dark:text-primary flex items-center justify-center font-black shrink-0">
                  <ChefHat className="w-4 h-4" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-foreground truncate">{user.name}</span>
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider truncate">{user.role}</span>
                </div>
              </div>
              <button
                onClick={logout}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors shrink-0 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>{t('nav.logout')}</span>
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
