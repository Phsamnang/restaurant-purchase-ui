'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { AppLayout } from '@/components/app-layout';
import { EmptyState } from '@/components/shared/empty-state';
import { getOrders, updateOrder, OrderRequest, resetOrdersToDefault } from '@/lib/orders';
import { useTranslation } from '@/lib/i18n';
import { PrintSheet } from '@/components/market/print-sheet';
import {
  RefreshCw,
  Plus,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ChevronRight,
  User,
  Calendar,
  Package,
  Clock,
  Check,
  X,
  CheckCheck,
  ClipboardCheck,
  Printer,
} from 'lucide-react';

// ── Status token system ───────────────────────────────────────────────────────
// Each status has one unique color. Yellow/amber never used for status.

const STATUS_TOKENS: Record<string, { dot: string; edge: string; labelEn: string; labelKh: string }> = {
  all:         { dot: 'bg-slate-400',    edge: 'bg-slate-500',    labelEn: 'All Orders', labelKh: 'ទាំងអស់'  },
  pending:     { dot: 'bg-orange-400',   edge: 'bg-orange-500',   labelEn: 'Pending',    labelKh: 'រង់ចាំ'    },
  approved:    { dot: 'bg-blue-500',     edge: 'bg-blue-500',     labelEn: 'Approved',   labelKh: 'យល់ព្រម'  },
  sent:        { dot: 'bg-sky-400',      edge: 'bg-sky-400',      labelEn: 'Sent',       labelKh: 'ផ្ញើទៅ'   },
  discrepancy: { dot: 'bg-red-500',      edge: 'bg-red-500',      labelEn: 'Discrepancy',labelKh: 'ខ្វះខូច'  },
  completed:   { dot: 'bg-[#0A8F4D]',   edge: 'bg-[#0A8F4D]',   labelEn: 'Completed',  labelKh: 'បានទទួល'  },
};

const CARD_STATUS: Record<string, {
  bg: string; text: string; dot: string; leftBorder: string; labelEn: string; labelKh: string;
}> = {
  pending:     { bg: 'bg-orange-50 border-orange-200',  text: 'text-orange-700',  dot: 'bg-orange-400', leftBorder: 'border-l-orange-400',  labelEn: 'Pending Review',    labelKh: 'រង់ចាំពិនិត្យ'  },
  approved:    { bg: 'bg-blue-50 border-blue-200',      text: 'text-blue-700',    dot: 'bg-blue-500',   leftBorder: 'border-l-blue-500',    labelEn: 'Approved',          labelKh: 'យល់ព្រម'         },
  sent:        { bg: 'bg-sky-50 border-sky-200',        text: 'text-sky-700',     dot: 'bg-sky-400',    leftBorder: 'border-l-sky-400',     labelEn: 'Sent to Supplier',  labelKh: 'ផ្ញើទៅផ្សារ'    },
  discrepancy: { bg: 'bg-red-50 border-red-200',        text: 'text-red-700',     dot: 'bg-red-500',    leftBorder: 'border-l-red-500',     labelEn: 'Discrepancy',       labelKh: 'មានខ្វះខូច'      },
  completed:   { bg: 'bg-emerald-50 border-emerald-200',text: 'text-emerald-700', dot: 'bg-[#0A8F4D]', leftBorder: 'border-l-[#0A8F4D]',  labelEn: 'Completed',         labelKh: 'បានទទួលរួច'     },
  rejected:    { bg: 'bg-slate-100 border-slate-200',   text: 'text-slate-500',   dot: 'bg-slate-400',  leftBorder: 'border-l-slate-400',   labelEn: 'Rejected',          labelKh: 'បដិសេធ'          },
};

const STATUS_FILTERS = ['all', 'pending', 'approved', 'sent', 'discrepancy', 'completed'];

// ── Helpers ───────────────────────────────────────────────────────────────────

function getElapsed(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diffMs / 86_400_000);
  const hours = Math.floor(diffMs / 3_600_000);
  if (days >= 1) return `${days}d ago`;
  if (hours >= 1) return `${hours}h ago`;
  return 'just now';
}

function isStale(order: OrderRequest): boolean {
  if (order.status !== 'pending' && order.status !== 'discrepancy') return false;
  return Date.now() - new Date(order.date).getTime() >= 86_400_000;
}

function sortOrders(orders: OrderRequest[]): OrderRequest[] {
  const priority: Record<string, number> = { pending: 0, discrepancy: 1, sent: 2, approved: 3, completed: 4, rejected: 5 };
  return [...orders].sort((a, b) => {
    const pa = priority[a.status] ?? 6;
    const pb = priority[b.status] ?? 6;
    if (pa !== pb) return pa - pb;
    // Pending/discrepancy: oldest first (most urgent at top)
    if (pa <= 1) return new Date(a.date).getTime() - new Date(b.date).getTime();
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });
}

// ── Flash card — shown while animating approve/reject ─────────────────────────
function FlashCard({ id, type }: { id: string; type: 'approved' | 'rejected' }) {
  return (
    <div className={`rounded-xl border px-5 py-3.5 flex items-center gap-3 transition-all duration-300 ${
      type === 'approved' ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'
    }`}>
      {type === 'approved'
        ? <CheckCircle2 className="w-5 h-5 text-[#0A8F4D] flex-shrink-0" />
        : <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />}
      <span className={`text-sm font-bold ${type === 'approved' ? 'text-[#0A8F4D]' : 'text-red-600'}`}>
        {type === 'approved' ? `✓ ${id} Approved` : `✗ ${id} Rejected`}
      </span>
    </div>
  );
}

// ── Portal: mounts children directly on document.body so @media print can isolate them
function PrintPortal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;
  return createPortal(children, document.body);
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function RequestsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { t, language } = useTranslation();

  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [orders, setOrders] = useState<OrderRequest[]>([]);
  // Bulk selection — only pending orders can be selected
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  // Flash map: orderId → 'approved' | 'rejected' (in-animation state)
  const [flashIds, setFlashIds] = useState<Map<string, 'approved' | 'rejected'>>(new Map());
  // Inline reject state
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  // Orders queued for printing
  const [printQueue, setPrintQueue] = useState<OrderRequest[]>([]);
  const [printCurrency, setPrintCurrency] = useState<'KHR' | 'USD'>('KHR');

  const loadOrders = useCallback(() => setOrders(getOrders()), []);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
    else loadOrders();
  }, [user, loading, router, loadOrders]);

  const sorted = sortOrders(orders);
  const filtered = selectedStatus === 'all' ? sorted : sorted.filter(o => o.status === selectedStatus);
  const pendingCount = orders.filter(o => o.status === 'pending').length;
  const countFor = (id: string) => id === 'all' ? orders.length : orders.filter(o => o.status === id).length;

  // ── Approve single ───────────────────────────────────────────────────────
  const handleApprove = useCallback((id: string) => {
    if (!user) return;
    setFlashIds(prev => new Map(prev).set(id, 'approved'));
    setTimeout(() => {
      updateOrder(id, { status: 'approved', approvedBy: `${user.name} (${user.role})` });
      setFlashIds(prev => { const m = new Map(prev); m.delete(id); return m; });
      setSelectedIds(prev => { const s = new Set(prev); s.delete(id); return s; });
      loadOrders();
    }, 750);
  }, [user, loadOrders]);

  // ── Reject flow ──────────────────────────────────────────────────────────
  const handleStartReject = (id: string) => {
    setRejectingId(id);
    setRejectReason('');
  };

  const handleConfirmReject = useCallback((id: string) => {
    if (!user) return;
    setRejectingId(null);
    setFlashIds(prev => new Map(prev).set(id, 'rejected'));
    setTimeout(() => {
      updateOrder(id, { status: 'rejected', approvedBy: `${user.name} (${user.role})` });
      setFlashIds(prev => { const m = new Map(prev); m.delete(id); return m; });
      setSelectedIds(prev => { const s = new Set(prev); s.delete(id); return s; });
      loadOrders();
    }, 750);
  }, [user, loadOrders]);

  // ── Bulk approve ─────────────────────────────────────────────────────────
  const handleBulkApprove = useCallback(() => {
    if (!user) return;
    const ids = Array.from(selectedIds);
    const newFlash = new Map(flashIds);
    ids.forEach(id => newFlash.set(id, 'approved'));
    setFlashIds(newFlash);
    setTimeout(() => {
      ids.forEach(id => updateOrder(id, { status: 'approved', approvedBy: `${user.name} (${user.role})` }));
      setFlashIds(new Map());
      setSelectedIds(new Set());
      loadOrders();
    }, 750);
  }, [user, selectedIds, flashIds, loadOrders]);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id); else s.add(id);
      return s;
    });
  };

  const handleResetDemo = () => {
    if (confirm('Reset orders to default dataset? / កំណត់ទិន្នន័យឡើងវិញ?')) {
      resetOrdersToDefault();
      setSelectedIds(new Set());
      setFlashIds(new Map());
      setRejectingId(null);
      loadOrders();
    }
  };

  // ── Print ────────────────────────────────────────────────────────────────
  const handlePrint = useCallback((ordersToPrint: OrderRequest[]) => {
    const curr = ordersToPrint[0]?.currency || 'USD';
    setPrintCurrency(curr);
    setPrintQueue(ordersToPrint);
    setTimeout(() => window.print(), 80);
  }, []);

  const handlePrintSelected = useCallback(() => {
    const toPrint = orders.filter(o => selectedIds.has(o.id));
    if (toPrint.length > 0) handlePrint(toPrint);
  }, [orders, selectedIds, handlePrint]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#0A8F4D] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!user) return null;

  return (
    <>
    <AppLayout title={t('orders.title')} subtitle={t('orders.subtitle')}>
      <div className="space-y-5 pb-28">

        {/* ── DOMINANT PENDING COUNTER ──────────────────────────────────────── */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            {/* The number the manager sees first */}
            <div className={`flex flex-col items-center justify-center w-[72px] h-[72px] rounded-2xl border-2 transition-all duration-300 ${
              pendingCount > 0
                ? 'bg-orange-500 border-orange-600 shadow-lg shadow-orange-200'
                : 'bg-slate-100 border-slate-200'
            }`}>
              <span className={`text-3xl font-black leading-none tabular-nums ${pendingCount > 0 ? 'text-white' : 'text-slate-400'}`}>
                {pendingCount}
              </span>
              <span className={`text-[9px] font-bold uppercase tracking-widest mt-0.5 ${pendingCount > 0 ? 'text-orange-100' : 'text-slate-400'}`}>
                Pending
              </span>
            </div>

            <div>
              <p className="text-base font-bold text-slate-900 leading-tight">
                {pendingCount > 0
                  ? `${pendingCount} request${pendingCount > 1 ? 's' : ''} need your approval`
                  : 'Queue clear — all done'}
              </p>
              <p className="font-kantumruy text-sm text-slate-500 mt-0.5">
                {pendingCount > 0 ? 'ត្រូវការការអនុម័ត' : 'ទំហប់ទំនេរ — អស់ហើយ'}
              </p>
              {pendingCount === 0 && (
                <span className="inline-flex items-center gap-1 mt-1 text-xs font-semibold text-[#0A8F4D]">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  All requests processed
                </span>
              )}
            </div>
          </div>

          <button
            onClick={handleResetDemo}
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 bg-white px-3 py-1.5 rounded-lg border border-slate-200 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reset Demo
          </button>
        </div>

        {/* ── TAB STRIP ─────────────────────────────────────────────────────────
            slate-100 trough · active = white card + shadow-sm + colored left edge
            Pending tab always shows orange count badge regardless of active state
        ──────────────────────────────────────────────────────────────────────── */}
        <div className="bg-slate-100 rounded-xl p-1 flex gap-1 overflow-x-auto">
          {STATUS_FILTERS.map((filterId) => {
            const token = STATUS_TOKENS[filterId];
            const isActive = selectedStatus === filterId;
            const count = countFor(filterId);
            const isPendingTab = filterId === 'pending';

            return (
              <button
                key={filterId}
                onClick={() => setSelectedStatus(filterId)}
                className={`relative flex flex-col items-start px-3 py-2 rounded-lg transition-all flex-shrink-0 min-w-[80px] cursor-pointer ${
                  isActive ? 'bg-white shadow-sm border border-slate-200/80' : 'hover:bg-white/60'
                }`}
              >
                {/* Colored left-edge stripe when active — reads as "current filter" */}
                {isActive && (
                  <span className={`absolute left-0 top-2 bottom-2 w-[3px] rounded-full ${token?.edge}`} />
                )}
                <span className={`text-[11px] font-bold leading-none pl-0.5 ${isActive ? 'text-slate-800' : 'text-slate-500'}`}>
                  {token?.labelEn}
                </span>
                <span className={`font-kantumruy text-[10px] mt-0.5 leading-tight pl-0.5 ${isActive ? 'text-slate-500' : 'text-slate-400'}`}>
                  {token?.labelKh}
                </span>
                {/* Count badge — pending always orange when > 0 */}
                <span className={`mt-1.5 ml-0.5 text-[10px] font-black px-1.5 py-0.5 rounded-full leading-none ${
                  isPendingTab && count > 0
                    ? 'bg-orange-500 text-white'
                    : isActive
                    ? `${token?.edge} text-white`
                    : 'bg-slate-200 text-slate-500'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── ORDER LIST ─────────────────────────────────────────────────────── */}
        {filtered.length === 0 ? (
          selectedStatus === 'pending' ? (
            /* Empty pending queue — the satisfying "done" state */
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-50 border-2 border-[#0A8F4D]/20 flex items-center justify-center mb-4">
                <ClipboardCheck className="w-8 h-8 text-[#0A8F4D]" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Queue clear</h3>
              <p className="text-slate-500 text-sm mt-1">All pending requests have been processed.</p>
              <p className="font-kantumruy text-slate-400 text-sm mt-0.5">សំណើទាំងអស់ត្រូវបានដំណើរការ</p>
            </div>
          ) : (
            <EmptyState
              icon="📦"
              title={language === 'kh' ? 'មិនមានបញ្ជីទិញទេ' : 'No orders found'}
              description={`No ${selectedStatus !== 'all' ? selectedStatus : ''} orders.`}
              action={{ label: t('orders.newRequest'), onClick: () => router.push('/requests/new') }}
            />
          )
        ) : (
          <div className="space-y-2.5">
            {filtered.map((order) => {
              const flash = flashIds.get(order.id);
              const cardStatus = CARD_STATUS[order.status] || CARD_STATUS.rejected;
              const isPending = order.status === 'pending';
              const isSelected = selectedIds.has(order.id);
              const stale = isStale(order);
              const elapsed = (isPending || order.status === 'discrepancy') ? getElapsed(order.date) : null;
              const isRejecting = rejectingId === order.id;

              // ── Flash state: card animates out with result ──
              if (flash) {
                return <FlashCard key={order.id} id={order.id} type={flash} />;
              }

              return (
                <div
                  key={order.id}
                  className={`
                    group relative bg-white rounded-xl border border-slate-200
                    border-l-4 ${cardStatus.leftBorder}
                    transition-all duration-150
                    ${isSelected ? 'ring-2 ring-blue-400/50 shadow-sm' : 'hover:shadow-sm hover:border-slate-300'}
                    ${stale && isPending ? 'ring-1 ring-orange-200' : ''}
                  `}
                  onClick={() => router.push(`/requests/${order.id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  {/* Stale urgency strip */}
                  {stale && isPending && (
                    <div className="flex items-center gap-1.5 bg-orange-50 border-b border-orange-200 px-4 py-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />
                      <span className="text-[11px] font-bold text-orange-600 uppercase tracking-wide">
                        Stale — needs attention
                      </span>
                      <span className="font-kantumruy text-[10px] text-orange-500 ml-1">ត្រូវការការយកចិត្ត</span>
                    </div>
                  )}

                  <div className="p-4">
                    <div className="flex items-start gap-3">

                      {/* Checkbox — only on pending cards */}
                      {isPending && (
                        <div className="pt-0.5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelect(order.id)}
                            className="w-4 h-4 rounded border-slate-300 accent-blue-500 cursor-pointer"
                          />
                        </div>
                      )}

                      <div className="flex-1 min-w-0 space-y-2.5">

                        {/* Row 1: Status badge + elapsed time chip + total + expand chevron */}
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2 flex-wrap">
                            {/* Status badge — bilingual, stacked */}
                            <span className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold border ${cardStatus.bg} ${cardStatus.text}`}>
                              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cardStatus.dot}`} />
                              <span className="flex flex-col leading-none">
                                <span>{cardStatus.labelEn}</span>
                                <span className="font-kantumruy text-[9px] font-medium opacity-75 mt-0.5">{cardStatus.labelKh}</span>
                              </span>
                            </span>

                            {/* Elapsed time — visible on pending + discrepancy */}
                            {elapsed && (
                              <span className={`inline-flex items-center gap-1 text-[11px] font-semibold rounded-full px-2 py-0.5 ${
                                stale ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-500'
                              }`}>
                                <Clock className="w-3 h-3" />
                                requested {elapsed}
                              </span>
                            )}
                          </div>

                          {/* Right side: total + navigation affordance */}
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-base font-black text-slate-900 tabular-nums">
                              {order.total}
                            </span>
                            <span className="text-slate-300 group-hover:text-primary group-hover:translate-x-0.5 transition-all duration-200">
                              <ChevronRight className="w-5 h-5" />
                            </span>
                          </div>
                        </div>

                        {/* Inline reject reason input */}
                        {isRejecting && (
                          <div
                            className="flex items-center gap-2 pt-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <input
                              autoFocus
                              type="text"
                              value={rejectReason}
                              onChange={(e) => setRejectReason(e.target.value)}
                              placeholder="Reason (optional) — press Enter to confirm..."
                              className="flex-1 text-sm border border-red-200 rounded-lg px-3 py-1.5 bg-red-50 text-red-900 placeholder-red-300 focus:outline-none focus:ring-2 focus:ring-red-300"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleConfirmReject(order.id);
                                if (e.key === 'Escape') setRejectingId(null);
                              }}
                            />
                            <button
                              onClick={(e) => { e.preventDefault(); handleConfirmReject(order.id); }}
                              className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 transition-colors cursor-pointer"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={(e) => { e.preventDefault(); setRejectingId(null); }}
                              className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-200 transition-colors cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        )}

                        {/* Row 3: Quiet metadata + action buttons */}
                        <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100 flex-wrap">

                          {/* Metadata — monospace, muted, demoted */}
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
                              <Package className="w-3 h-3" />
                              {order.id}
                            </span>
                            <span className="flex items-center gap-1 text-[11px] text-slate-400">
                              <Calendar className="w-3 h-3" />
                              {new Date(order.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                            {order.createdBy && (
                              <span className="flex items-center gap-1 text-[11px] text-slate-400">
                                <User className="w-3 h-3" />
                                <span>{order.createdBy.replace(/\s*\(.*?\)\s*/g, '').trim()}</span>
                              </span>
                            )}
                          </div>

                          {/* Action Buttons: Print and View details on ALL cards, plus Reject/Approve for Pending */}
                          <div className="flex items-center gap-3 flex-wrap" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={(e) => { e.stopPropagation(); handlePrint([order]); }}
                              className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                              title="Print market list"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              Print
                            </button>
                            <Link
                              href={`/requests/${order.id}`}
                              className="flex items-center gap-0.5 text-[11px] text-slate-400 hover:text-slate-600 transition-colors"
                              onClick={(e) => e.stopPropagation()}
                            >
                              View details
                              <ChevronRight className="w-3.5 h-3.5" />
                            </Link>
                            {isPending && !isRejecting && (
                              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleStartReject(order.id); }}
                                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-red-200 text-red-600 text-xs font-bold hover:bg-red-50 active:scale-95 transition-all cursor-pointer"
                                >
                                  <X className="w-3.5 h-3.5" />
                                  Reject
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleApprove(order.id); }}
                                  className="flex items-center gap-1 px-4 py-1.5 rounded-lg bg-[#0A8F4D] text-white text-xs font-bold hover:bg-[#078844] active:scale-95 transition-all shadow-sm shadow-[#0A8F4D]/20 cursor-pointer"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  Approve
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── BULK APPROVE BAR ───────────────────────────────────────────────────
          Appears from bottom when ≥1 card selected.
          Dark pill: count · Approve all · ✕ clear
      ──────────────────────────────────────────────────────────────────────── */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl shadow-slate-900/25 border border-white/10">
          <span className="text-sm font-semibold tabular-nums">
            {selectedIds.size} selected
          </span>
          <div className="w-px h-5 bg-white/20 flex-shrink-0" />
          <button
            onClick={handleBulkApprove}
            className="flex items-center gap-1.5 text-sm font-bold text-[#4ADE80] hover:text-emerald-300 transition-colors cursor-pointer"
          >
            <CheckCheck className="w-4 h-4" />
            Approve all
          </button>
          <button
            onClick={() => setSelectedIds(new Set())}
            className="text-slate-400 hover:text-white transition-colors cursor-pointer ml-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── FAB: New Order — hidden while bulk bar is up ── */}
      {selectedIds.size === 0 && (
        <div className="fixed bottom-6 right-6 z-30">
          <Link
            href="/requests/new"
            className="bg-[#0A8F4D] text-white px-5 py-3 rounded-full font-bold text-sm hover:bg-[#078844] transition-all shadow-lg shadow-[#0A8F4D]/30 flex items-center gap-2 hover:scale-105 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            {t('orders.newRequest')}
          </Link>
        </div>
      )}
    </AppLayout>

    {/* ── PRINT SHEET: portalled to body so @media print can isolate it correctly ── */}
    {printQueue.length > 0 && (
      <PrintPortal>
        <PrintSheet orders={printQueue} currency={printCurrency} />
      </PrintPortal>
    )}
    </>
  );
}
