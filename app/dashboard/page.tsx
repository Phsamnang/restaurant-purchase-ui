'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AppLayout } from '@/components/app-layout';
import { StatusBadge } from '@/components/shared/status-badge';
import { getOrders, OrderRequest } from '@/lib/orders';
import { getTransactions, getFinancialSummary } from '@/lib/transactions';
import { Plus, ArrowRight, ShoppingBag, Clock, CheckCircle, AlertTriangle, Wallet, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<OrderRequest[]>([]);
  const [finSummary, setFinSummary] = useState({ totalIncome: 0, totalOutcome: 0, netFlow: 0 });

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    } else {
      setOrders(getOrders());
      setFinSummary(getFinancialSummary(getTransactions(), 'USD'));
    }
  }, [user, loading, router]);

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return null;
  }

  // Calculate live summary stats
  const pendingCount = orders.filter((o) => o.status === 'pending').length;
  const approvedCount = orders.filter((o) => o.status === 'approved' || o.status === 'sent').length;
  const discrepancyCount = orders.filter((o) => o.status === 'discrepancy').length;
  const completedCount = orders.filter((o) => o.status === 'completed').length;

  const totalSpentNumeric = orders.reduce((sum, o) => {
    const val = parseFloat(o.total.replace('$', '')) || 0;
    return sum + val;
  }, 0);

  const stats = [
    { label: 'Pending Review / រង់ចាំពិនិត្យ', value: pendingCount.toString(), color: 'text-amber-500', bg: 'bg-amber-500/10 border-amber-500/20', icon: <Clock className="w-6 h-6 text-amber-500" /> },
    { label: 'Approved & Sent / បានយល់ព្រម', value: approvedCount.toString(), color: 'text-blue-500', bg: 'bg-blue-500/10 border-blue-500/20', icon: <ShoppingBag className="w-6 h-6 text-blue-500" /> },
    { label: 'Discrepancies / មានខ្វះខូច', value: discrepancyCount.toString(), color: 'text-red-500', bg: 'bg-red-500/10 border-red-500/20', icon: <AlertTriangle className="w-6 h-6 text-red-500" /> },
    { label: 'Completed / បានទទួល', value: completedCount.toString(), color: 'text-green-500', bg: 'bg-green-500/10 border-green-500/20', icon: <CheckCircle className="w-6 h-6 text-green-500" /> },
  ];

  const recentRequests = orders.slice(0, 5);

  return (
    <AppLayout title="Kitchen Dashboard / ផ្ទាំងគ្រប់គ្រង">
      <div className="space-y-6 pb-12">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-primary/15 via-primary/5 to-background border border-primary/20 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-foreground">
              Welcome back, {user.name} 👋
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Here is what is happening in your kitchen morning market orders today.
            </p>
          </div>
          <Link
            href="/requests/new"
            className="bg-primary text-primary-foreground px-5 py-3 rounded-xl font-bold text-sm hover:bg-primary-hover hover:text-primary active:bg-primary-active active:text-white transition-all shadow-md flex items-center gap-2 whitespace-nowrap active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>New Order / បង្ហោះបញ្ជីទិញ</span>
          </Link>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {stats.map((stat) => (
            <div key={stat.label} className={`border rounded-xl p-5 flex items-center justify-between gap-3 ${stat.bg}`}>
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground line-clamp-1">{stat.label}</p>
                <p className={`text-xl sm:text-2xl font-extrabold ${stat.color}`}>{stat.value}</p>
              </div>
              <div className="p-3 rounded-xl bg-background/80 shadow-2xs">
                {stat.icon}
              </div>
            </div>
          ))}
        </div>

        {/* Total Spend Summary Bar */}
        <div className="bg-card border border-border rounded-xl p-5 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Estimated Total Market Spend</p>
            <p className="text-2xl font-bold text-foreground">${totalSpentNumeric.toFixed(2)} USD</p>
          </div>
          <Link
            href="/requests"
            className="text-sm font-bold text-primary hover:underline flex items-center gap-1"
          >
            <span>View All Orders</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Financial Position Summary Box */}
        <div className="bg-gradient-to-r from-emerald-500/10 via-blue-500/5 to-purple-500/10 border border-border rounded-2xl p-5 sm:p-6 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-base sm:text-lg font-black text-foreground flex items-center gap-2">
                <Wallet className="w-5 h-5 text-emerald-600" />
                <span>Today&apos;s Financial Position / ស្ថានភាពហិរញ្ញវត្ថុ</span>
              </h3>
              <p className="text-xs text-muted-foreground font-medium">Real-time overview of recorded sales revenue and expenditure</p>
            </div>
            <Link
              href="/finance"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-card hover:bg-secondary text-foreground font-bold text-xs border border-border shadow-2xs transition-all"
            >
              <span>View Finance Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div className="bg-card/90 rounded-xl p-4 border border-border">
              <div className="flex items-center justify-between text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">
                <span>Total Income / ចំណូល</span>
                <TrendingUp className="w-4 h-4" />
              </div>
              <div className="text-xl font-black text-foreground">${finSummary.totalIncome.toFixed(2)} USD</div>
            </div>

            <div className="bg-card/90 rounded-xl p-4 border border-border">
              <div className="flex items-center justify-between text-xs font-bold text-red-600 uppercase tracking-wider mb-1">
                <span>Total Outcome / ចំណាយ</span>
                <TrendingDown className="w-4 h-4" />
              </div>
              <div className="text-xl font-black text-foreground">${finSummary.totalOutcome.toFixed(2)} USD</div>
            </div>

            <div className={`rounded-xl p-4 border ${
              finSummary.netFlow >= 0 ? 'bg-blue-500/10 border-blue-500/20 text-blue-600' : 'bg-amber-500/10 border-amber-500/20 text-amber-600'
            }`}>
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider mb-1">
                <span>Net Cash Flow / លំហូរសាច់ប្រាក់</span>
                <DollarSign className="w-4 h-4" />
              </div>
              <div className="text-xl font-black">
                {finSummary.netFlow >= 0 ? `+$${finSummary.netFlow.toFixed(2)} USD` : `-$${Math.abs(finSummary.netFlow).toFixed(2)} USD`}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <h3 className="text-base font-bold text-foreground">Quick Actions / សកម្មភាពរហ័ស</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Link
              href="/requests/new"
              className="bg-primary text-primary-foreground p-4 rounded-xl font-bold text-center hover:bg-primary-hover hover:text-primary active:bg-primary-active active:text-white transition-all shadow-sm flex items-center justify-center gap-2 group"
            >
              <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
              <span>Create Morning Order / ទិញទំនិញ</span>
            </Link>
            <Link
              href="/requests"
              className="border border-border bg-secondary/50 hover:bg-secondary text-foreground p-4 rounded-xl font-bold text-center transition-all flex items-center justify-center gap-2"
            >
              <span>Review Orders / ពិនិត្យបញ្ជី</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/finance"
              className="border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 p-4 rounded-xl font-bold text-center transition-all flex items-center justify-center gap-2"
            >
              <Wallet className="w-4 h-4" />
              <span>Manage Finance / ហិរញ្ញវត្ថុ</span>
            </Link>
          </div>
        </div>

        {/* Recent Requests */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-foreground">Recent Orders / បញ្ជីទិញថ្មីៗ</h3>
            <Link href="/requests" className="text-xs font-semibold text-primary hover:underline">
              See All ({orders.length})
            </Link>
          </div>
          <div className="space-y-2.5">
            {recentRequests.map((request) => {
              const itemsSummaryEn = request.items.map((i) => i.nameEn).join(', ');
              const itemsSummaryKh = request.items.map((i) => i.nameKh).join(', ');
              return (
                <Link key={request.id} href={`/requests/${request.id}`}>
                  <div className="bg-card border border-border rounded-xl p-4 hover:shadow-md hover:border-primary/40 transition-all cursor-pointer group">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">
                            {request.id}
                          </span>
                          <span className="text-xs text-muted-foreground">• {request.date}</span>
                        </div>
                        <p className="font-semibold text-sm text-foreground truncate">{itemsSummaryEn}</p>
                        <p className="text-xs text-primary font-medium truncate">{itemsSummaryKh}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-bold text-sm text-foreground mb-1">{request.total}</p>
                        <StatusBadge status={request.status as any} size="sm" />
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
