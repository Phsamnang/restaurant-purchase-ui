'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Flame, FileText, PlusCircle, LayoutDashboard, Globe, ChefHat, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState<'EN' | 'KH'>('KH');

  const navItems = [
    { name: 'Orders', khName: 'បញ្ជីទិញ', href: '/requests', icon: FileText },
    { name: 'Create Order', khName: 'ង្ហោះ', href: '/requests/new', icon: PlusCircle, highlight: true },
    { name: 'Dashboard', khName: 'ផ្ទាំងគ្រប់គ្រង', href: '/dashboard', icon: LayoutDashboard },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-border shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 grid grid-cols-2 md:grid-cols-3 items-center gap-4">
        
        {/* Left: Branding & Logo */}
        <div className="flex items-center justify-start">
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black shadow-sm group-hover:scale-105 transition-all">
              <Flame className="w-5 h-5 fill-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-black text-base tracking-tight text-slate-900 leading-tight">RestaurantAI</span>
              <span className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-wider">Enterprise ERP</span>
            </div>
          </Link>
        </div>

        {/* Center: Primary Navigation Pages (Balanced Nav Bar) */}
        <nav className="hidden md:flex items-center justify-center gap-1 bg-slate-100 p-1.5 rounded-full border border-slate-200 shadow-inner">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-white text-emerald-600 shadow-2xs'
                    : item.highlight
                    ? 'text-emerald-600 hover:bg-white/60'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                {item.highlight && <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />}
                <Icon className="w-3.5 h-3.5" />
                <span>{item.name} / {item.khName}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right: Dedicated Language Switcher Dropdown & Profile */}
        <div className="flex items-center justify-end gap-3">
          
          {/* Language Switcher Dropdown (EN | KH) */}
          <div className="relative">
            <button
              onClick={() => setLangDropdownOpen(!langDropdownOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs font-bold text-slate-700 transition-all shadow-2xs"
            >
              <Globe className="w-3.5 h-3.5 text-emerald-600" />
              <span>{currentLang === 'KH' ? '🇰🇭 KH' : '🇬🇧 EN'}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {langDropdownOpen && (
              <div className="absolute right-0 mt-2 w-32 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-50 animate-in fade-in-50 zoom-in-95 duration-100">
                <button
                  onClick={() => { setCurrentLang('KH'); setLangDropdownOpen(false); }}
                  className={`w-full px-3 py-2 text-left text-xs font-bold flex items-center justify-between hover:bg-slate-50 ${currentLang === 'KH' ? 'text-emerald-600 bg-emerald-50/50' : 'text-slate-700'}`}
                >
                  <span>🇰🇭 Khmer</span>
                  {currentLang === 'KH' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />}
                </button>
                <button
                  onClick={() => { setCurrentLang('EN'); setLangDropdownOpen(false); }}
                  className={`w-full px-3 py-2 text-left text-xs font-bold flex items-center justify-between hover:bg-slate-50 ${currentLang === 'EN' ? 'text-emerald-600 bg-emerald-50/50' : 'text-slate-700'}`}
                >
                  <span>🇬🇧 English</span>
                  {currentLang === 'EN' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />}
                </button>
              </div>
            )}
          </div>

          {/* User Profile */}
          {user && (
            <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
              <div className="flex items-center gap-2 bg-slate-100 px-2.5 py-1 rounded-xl border border-slate-200">
                <div className="w-7 h-7 rounded-full bg-emerald-600/10 text-emerald-600 flex items-center justify-center font-black text-xs flex-shrink-0">
                  <ChefHat className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-800 hidden lg:inline-block truncate max-w-[100px]">
                  {user.name}
                </span>
              </div>
              <button
                onClick={logout}
                title="Logout"
                className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}
