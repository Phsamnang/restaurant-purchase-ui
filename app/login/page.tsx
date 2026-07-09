'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, User } from '@/lib/auth-context';
import { Store, UserCheck, ShieldCheck, Utensils, GlassWater } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!username || !password) {
        setError('Please fill in all fields');
        setLoading(false);
        return;
      }
      await login(username, password);
      router.push('/dashboard');
    } catch (err) {
      setError('Login failed. Please try again.');
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = async (role: User['role'], name: string, userHandle: string) => {
    setError('');
    setLoading(true);
    try {
      await login(userHandle, 'demo123', role, name);
      router.push('/dashboard');
    } catch (err) {
      setError('Demo login failed.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 bg-primary text-primary-foreground rounded-2xl flex items-center justify-center mx-auto shadow-md">
              <Store className="w-7 h-7 stroke-[2.5]" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">RestaurantAI</h1>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Role-Based Requisition System</p>
          </div>

          {/* Quick Demo Role Selector Cards */}
          <div className="space-y-2.5">
            <label className="block text-xs font-black uppercase tracking-wider text-slate-500 text-center">
              ⚡ Quick 1-Click Role Demo Login
            </label>
            <div className="grid grid-cols-1 gap-2.5">
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('manager', 'Manager Alex (General Manager)', 'alex_mgr')}
                className="flex items-center gap-3 p-3.5 rounded-xl border-2 border-indigo-200 bg-indigo-50/60 hover:bg-indigo-100/80 hover:border-indigo-400 transition-all text-left group cursor-pointer"
              >
                <div className="p-2 rounded-lg bg-indigo-600 text-white shadow-2xs group-hover:scale-105 transition-transform">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-sm text-indigo-950">Manager Alex</span>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-indigo-200/80 text-indigo-800">
                      Manager Role
                    </span>
                  </div>
                  <p className="text-xs text-indigo-700/80 font-medium truncate">Full Catalog + Cash Request Override</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoLogin('staff', 'Chef John (Head Kitchen Staff)', 'john_chef')}
                className="flex items-center gap-3 p-3.5 rounded-xl border-2 border-amber-200 bg-amber-50/60 hover:bg-amber-100/80 hover:border-amber-400 transition-all text-left group cursor-pointer"
              >
                <div className="p-2 rounded-lg bg-amber-600 text-white shadow-2xs group-hover:scale-105 transition-transform">
                  <Utensils className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-sm text-amber-950">🍳 Chef John</span>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-200/80 text-amber-900">
                      Staff Role
                    </span>
                  </div>
                  <p className="text-xs text-amber-800/80 font-medium truncate">Food Ingredients & Kitchen Tools</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoLogin('service', 'Sophea Bar (Service & FOH Lead)', 'sophea_foh')}
                className="flex items-center gap-3 p-3.5 rounded-xl border-2 border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100/80 hover:border-emerald-400 transition-all text-left group cursor-pointer"
              >
                <div className="p-2 rounded-lg bg-emerald-600 text-white shadow-2xs group-hover:scale-105 transition-transform">
                  <GlassWater className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-sm text-emerald-950">🍸 Sophea Bar</span>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-200/80 text-emerald-900">
                      Service Role
                    </span>
                  </div>
                  <p className="text-xs text-emerald-800/80 font-medium truncate">Beverages, Glassware & Tip Advance / Cash</p>
                </div>
              </button>
            </div>
          </div>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink mx-4 text-xs font-bold uppercase text-slate-400">Or manual login</span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm font-bold">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="username" className="block text-xs font-bold uppercase text-slate-700 mb-1.5">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                className="w-full h-11 px-4 border border-slate-300 rounded-xl font-bold text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 bg-white"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-bold uppercase text-slate-700 mb-1.5">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-11 px-4 border border-slate-300 rounded-xl font-bold text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 bg-white"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 text-white py-3 rounded-xl font-black text-sm hover:bg-slate-800 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm cursor-pointer"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
