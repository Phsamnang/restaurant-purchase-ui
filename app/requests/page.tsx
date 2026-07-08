'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AppLayout } from '@/components/app-layout';
import { StatusBadge } from '@/components/shared/status-badge';
import { EmptyState } from '@/components/shared/empty-state';
import { getOrders, OrderRequest, resetOrdersToDefault } from '@/lib/orders';
import { useTranslation } from '@/lib/i18n';
import { RefreshCw, Plus } from 'lucide-react';

const STATUS_FILTERS = [
  { id: 'all', labelEn: 'All Orders', labelKh: 'ទាំងអស់' },
  { id: 'pending', labelEn: 'Pending', labelKh: 'រង់ចាំពិនិត្យ' },
  { id: 'approved', labelEn: 'Approved', labelKh: 'បានយល់ព្រម' },
  { id: 'sent', labelEn: 'Sent to Supplier', labelKh: 'ផ្ញើទៅផ្សារ' },
  { id: 'discrepancy', labelEn: 'Discrepancies', labelKh: 'មានខ្វះខូច' },
  { id: 'completed', labelEn: 'Received / Completed', labelKh: 'បានទទួល' },
];

export default function RequestsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { t, language } = useTranslation();
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [orders, setOrders] = useState<OrderRequest[]>([]);

  const loadOrdersData = () => {
    setOrders(getOrders());
  };

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    } else {
      loadOrdersData();
    }
  }, [user, loading, router]);

  const handleResetDemo = () => {
    if (confirm('Reset orders to default Cambodian market dataset? / កំណត់ទិន្នន័យឡើងវិញ?')) {
      resetOrdersToDefault();
      loadOrdersData();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-bold text-slate-500">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <span>{t('common.loading')}</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const filtered = selectedStatus === 'all' ? orders : orders.filter((r) => r.status === selectedStatus);

  return (
    <AppLayout title={t('orders.title')} subtitle={t('orders.subtitle')}>
      <div className="space-y-6 pb-24">
        {/* Top bar with Reset Demo button */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <p className="text-sm text-muted-foreground">
            Manage and track all daily market supply orders from kitchen staff.
          </p>
          <button
            onClick={handleResetDemo}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground bg-secondary px-3 py-1.5 rounded-lg border border-border/60 transition-colors cursor-pointer"
            title="Reset demo data"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Demo Data</span>
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {STATUS_FILTERS.map((filter) => {
            const isSelected = selectedStatus === filter.id;
            const count = filter.id === 'all' ? orders.length : orders.filter((o) => o.status === filter.id).length;
            const mainLabel = language === 'kh' ? filter.labelKh : filter.labelEn;
            const subLabel = language === 'kh' ? filter.labelEn : filter.labelKh;

            return (
              <button
                key={filter.id}
                onClick={() => setSelectedStatus(filter.id)}
                className={`px-4 py-2 rounded-xl font-medium text-xs sm:text-sm transition-all whitespace-nowrap flex items-center gap-2 flex-shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-primary text-primary-foreground shadow-md scale-105 font-bold'
                    : 'bg-secondary/70 text-foreground hover:bg-secondary border border-border/50'
                }`}
              >
                <span>{mainLabel}</span>
                <span className="text-[10px] opacity-80">({subLabel})</span>
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${isSelected ? 'bg-black/10 dark:bg-white/20 text-primary-foreground' : 'bg-background text-muted-foreground'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Requests List */}
        {filtered.length === 0 ? (
          <EmptyState
            icon="📦"
            title={language === 'kh' ? "មិនមានបញ្ជីទិញទេ" : "No orders found"}
            description={`No ${selectedStatus !== 'all' ? selectedStatus : ''} orders matching this filter.`}
            action={{
              label: t('orders.newRequest'),
              onClick: () => router.push('/requests/new'),
            }}
          />
        ) : (
          <div className="space-y-3">
            {filtered.map((request) => {
              const mainSummary = request.items
                .map((i) => (language === 'kh' ? (i.nameKh || i.nameEn) : i.nameEn))
                .join(', ');
              const subSummary = request.items
                .map((i) => (language === 'kh' ? i.nameEn : (i.nameKh || i.nameEn)))
                .join(', ');

              return (
                <Link key={request.id} href={`/requests/${request.id}`}>
                  <div className="bg-card border border-border rounded-xl p-4 hover:shadow-md hover:border-primary/40 transition-all cursor-pointer group">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-foreground group-hover:text-primary transition-colors">
                            {request.id}
                          </span>
                          <span className="text-xs text-muted-foreground">• {request.date}</span>
                          {request.createdBy && (
                            <span className="text-[11px] bg-secondary px-2 py-0.5 rounded text-muted-foreground hidden sm:inline-block">
                              👤 {request.createdBy}
                            </span>
                          )}
                        </div>
                        <p className="font-semibold text-foreground text-sm sm:text-base truncate">
                          {mainSummary}
                        </p>
                        <p className="text-xs text-primary font-medium truncate font-kantumruy">
                          {subSummary}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0 flex flex-col items-end justify-between">
                        <p className="font-bold text-foreground text-base sm:text-lg">{request.total}</p>
                        <div className="mt-2">
                          <StatusBadge status={request.status as any} size="sm" />
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Floating New Order Button */}
        <div className="fixed bottom-6 right-6 z-30">
          <Link
            href="/requests/new"
            className="bg-primary text-primary-foreground px-6 py-3.5 rounded-full font-bold text-sm sm:text-base hover:bg-primary-hover hover:text-primary active:bg-primary-active active:text-white transition-all shadow-xl shadow-primary/25 flex items-center gap-2 hover:scale-105 active:scale-95"
          >
            <Plus className="w-5 h-5" />
            <span>{t('orders.newRequest')}</span>
          </Link>
        </div>
      </div>
    </AppLayout>
  );
}
