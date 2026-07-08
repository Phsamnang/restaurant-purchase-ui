'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AppLayout } from '@/components/app-layout';
import { useTranslation } from '@/lib/i18n';
import { PrintSheet } from '@/components/market/print-sheet';
import { renderIngredientIcon } from '@/components/market/ingredient-list';
import { getOrderById, updateOrder, OrderRequest, OrderItemDetail } from '@/lib/orders';
import { 
  CheckCircle2, 
  XCircle, 
  Printer, 
  Send, 
  AlertTriangle, 
  ShieldCheck, 
  UserCheck, 
  PackageCheck, 
  ArrowLeft,
  Copy,
  Check,
  Store,
  Calendar,
  Clock,
  User,
  FileText,
  Download,
  FileEdit,
  Package,
  History,
  TrendingUp,
  Minus,
  Plus,
  AlertCircle,
  HelpCircle
} from 'lucide-react';

// ── Portal: mounts children directly on document.body so @media print can isolate them
function PrintPortal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;
  return createPortal(children, document.body);
}

export default function RequestDetailPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = Array.isArray(params?.id) ? params.id[0] : (params?.id as string);
  const { t, language } = useTranslation();

  const [order, setOrder] = useState<OrderRequest | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'po' | 'checkin'>('po');
  const [checkingIn, setCheckingIn] = useState(false);
  const [printQueue, setPrintQueue] = useState<OrderRequest[]>([]);
  const [printCurrency, setPrintCurrency] = useState<'KHR' | 'USD'>('KHR');

  // Stage 3 Check-in state
  const [receivedData, setReceivedData] = useState<Record<string, { received: number; isCorrect: boolean; isVerified: boolean; unit?: string }>>({});


  useEffect(() => {
    if (id) {
      const data = getOrderById(id);
      if (data) {
        setOrder(data);
        // Initialize received data
        const initialData: Record<string, { received: number; isCorrect: boolean; isVerified: boolean; unit?: string }> = {};
        data.items.forEach((item) => {
          const isCorrect = item.received === undefined || item.received === item.ordered;
          const isVerified = item.received !== undefined || data.status === 'completed';
          initialData[item.id] = {
            received: item.received !== undefined ? item.received : item.ordered,
            isCorrect,
            isVerified,
            unit: item.unit
          };
        });
        setReceivedData(initialData);
      }
    }
  }, [id]);

  // Handle Item Checkbox Selection
  const toggleSelectItem = (itemId: string) => {
    setSelectedItems((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (!order) return;
    if (selectedItems.size === order.items.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(order.items.map((i) => i.id)));
    }
  };

  // 1-Click Copy Link
  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Quick Share Actions
  const handleShareTelegram = () => {
    if (!order) return;
    const text = encodeURIComponent(`📦 Purchase Order ${order.id} (${order.items.length} items, ${order.total})\nView ERP Details: ${window.location.href}`);
    window.open(`https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${text}`, '_blank');
  };

  // Manager Approval Actions
  const handleApprove = () => {
    if (!order || !user) return;
    const updated = updateOrder(order.id, {
      status: 'approved',
      approvedBy: `${user.name} (${user.role})`
    });
    if (updated) setOrder(updated);
  };

  const handleReject = () => {
    if (!order || !user) return;
    const updated = updateOrder(order.id, {
      status: 'rejected',
      approvedBy: `${user.name} (${user.role})`
    });
    if (updated) setOrder(updated);
  };

  const handlePrint = () => {
    if (!order) return;
    const currency = order.currency || 'KHR';
    setPrintCurrency(currency);
    setPrintQueue([order]);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  // Stage 3 Check-in Handlers
  const handleMarkCorrect = (itemId: string, orderedQty: number) => {
    setReceivedData((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        received: orderedQty,
        isCorrect: true,
        isVerified: true
      }
    }));
  };

  const handleToggleDiscrepancy = (itemId: string, orderedQty: number) => {
    setReceivedData((prev) => {
      const current = prev[itemId] || { received: orderedQty, isCorrect: true, isVerified: false };
      const newIsCorrect = !current.isCorrect;
      return {
        ...prev,
        [itemId]: {
          ...current,
          received: newIsCorrect ? orderedQty : Math.max(0, orderedQty - 1),
          isCorrect: newIsCorrect,
          isVerified: true
        }
      };
    });
  };

  const handleUpdateReceivedQty = (itemId: string, qty: number, orderedQty: number) => {
    const validQty = Math.max(0, qty);
    setReceivedData((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        received: validQty,
        isCorrect: validQty === orderedQty,
        isVerified: true
      }
    }));
  };

  const handleMarkAllRemainingCorrect = () => {
    if (!order) return;
    setReceivedData((prev) => {
      const updated = { ...prev };
      order.items.forEach((item) => {
        if (!updated[item.id] || !updated[item.id].isVerified) {
          updated[item.id] = {
            received: item.ordered,
            isCorrect: true,
            isVerified: true,
            unit: item.unit
          };
        }
      });
      return updated;
    });
  };

  const handleCompleteCheckIn = () => {
    if (!order) return;
    const allVerified = order.items.every((item) => receivedData[item.id]?.isVerified);
    if (!allVerified) {
      alert(language === 'kh' ? 'សូមពិនិត្យផ្ទៀងផ្ទាត់ទំនិញទាំងអស់ជាមុនសិន!' : 'Please verify all items before completing delivery check-in!');
      return;
    }

    const hasDiscrepancy = order.items.some((item) => !receivedData[item.id]?.isCorrect);
    const newStatus = hasDiscrepancy ? 'discrepancy' : 'completed';

    const updatedItems: OrderItemDetail[] = order.items.map((item) => {
      const rData = receivedData[item.id];
      return {
        ...item,
        unit: rData.unit || item.unit,
        received: rData.received,
        discrepancyReason: !rData.isCorrect ? 'Discrepancy flagged during check-in' : undefined
      };
    });

    const updated = updateOrder(order.id, {
      status: newStatus,
      items: updatedItems
    });

    if (updated) {
      setOrder(updated);
      setCheckingIn(false);
    }
  };

  if (!order) {
    return (
      <AppLayout>
        <div className="max-w-[1440px] mx-auto p-8 text-center min-h-screen flex flex-col items-center justify-center">
          <Clock className="w-10 h-10 text-slate-400 animate-spin mb-4" />
          <p className="text-slate-500 font-medium">Loading ERP Order Details...</p>
        </div>
      </AppLayout>
    );
  }

  const verifiedCount = order.items.filter((i) => receivedData[i.id]?.isVerified).length;
  const progressPercent = Math.round((verifiedCount / order.items.length) * 100);

  // Render Clean Lucide Status Badge
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/30 shadow-2xs">
            <Clock className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>{language === 'kh' ? 'រង់ចាំការពិនិត្យ' : 'Pending Review'}</span>
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#0A8F4D]/10 text-[#0A8F4D] border border-[#0A8F4D]/30 shadow-2xs">
            <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>{language === 'kh' ? 'បានអនុម័ត' : 'Approved'}</span>
          </span>
        );
      case 'sent':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-600 border border-sky-500/30 shadow-2xs">
            <Send className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>{language === 'kh' ? 'បានបញ្ជូនទៅផ្សារ' : 'Sent to Market'}</span>
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#16A34A]/10 text-[#16A34A] border border-[#16A34A]/30 shadow-2xs">
            <PackageCheck className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>{language === 'kh' ? 'បានទទួលគ្រប់ចំនួន' : 'Completed (Verified)'}</span>
          </span>
        );
      case 'discrepancy':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/30 shadow-2xs">
            <AlertTriangle className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>{language === 'kh' ? 'មានបញ្ហា/ខ្វះ' : 'Discrepancy Flagged'}</span>
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/30 shadow-2xs">
            <XCircle className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>{language === 'kh' ? 'បដិសេធ' : 'Rejected'}</span>
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <AppLayout>
      <div className="bg-[#F8FAFC] dark:bg-slate-950 min-h-screen py-8">
        <div className="max-w-[1440px] mx-auto px-6 md:px-8 space-y-6">
          
          {/* Top Navigation Back Button */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push('/requests')}
              className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{language === 'kh' ? 'ត្រឡប់ទៅបញ្ជីវិក្កយបត្រ' : 'Back to Market Orders'}</span>
            </button>

            {/* View Mode Switcher (PO Table vs Delivery Check-in) */}
            {order.status !== 'pending' && order.status !== 'rejected' && (
              <div className="bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-800 p-1 rounded-xl flex items-center gap-1 shadow-2xs">
                <button
                  onClick={() => setActiveTab('po')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    activeTab === 'po'
                      ? 'bg-[#0A8F4D] text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>{language === 'kh' ? 'តារាងបញ្ជាទិញ' : 'Purchase Order Table'}</span>
                </button>
                <button
                  onClick={() => { setActiveTab('checkin'); setCheckingIn(true); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    activeTab === 'checkin'
                      ? 'bg-[#0A8F4D] text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <PackageCheck className="w-3.5 h-3.5" />
                  <span>{language === 'kh' ? `ពិនិត្យទំនិញចូល (${verifiedCount}/${order.items.length})` : `Delivery Check-in (${verifiedCount}/${order.items.length})`}</span>
                </button>
              </div>
            )}
          </div>

          {/* SECTION ①: ORDER HEADER (One Clean Horizontal Card) */}
          <div className="bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-800 rounded-2xl p-6 shadow-2xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              
              {/* Left Side: Order Number, Status, Dates, Creators */}
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                    {order.id}
                  </h1>
                  {renderStatusBadge(order.status)}
                </div>

                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px] text-slate-500 font-normal">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Order Date: <strong className="text-slate-700 dark:text-slate-300 font-medium">{order.date}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>Created By: <strong className="text-slate-700 dark:text-slate-300 font-medium">{order.createdBy}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                    <span>Approved By: <strong className="text-slate-700 dark:text-slate-300 font-medium">{order.approvedBy || 'Pending Review'}</strong></span>
                  </div>
                </div>
              </div>

              {/* Right Side: Estimated Total & Item Count */}
              <div className="flex md:flex-col items-start md:items-end justify-between md:justify-center border-t md:border-t-0 pt-4 md:pt-0 border-slate-100 dark:border-slate-800">
                <div className="text-left md:text-right">
                  <p className="text-[13px] text-slate-500 font-medium uppercase tracking-wider">Estimated Total</p>
                  <p className="text-3xl font-bold text-[#0A8F4D] tracking-tight mt-0.5">{order.total}</p>
                </div>
                <div className="text-right mt-1">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[13px] font-medium text-slate-600 dark:text-slate-300">
                    <Package className="w-3.5 h-3.5" />
                    <span>{order.items.length} {language === 'kh' ? 'មុខទំនិញ' : 'Items'}</span>
                  </span>
                </div>
              </div>

            </div>
          </div>

          {/* SECTION ②: COMPACT STICKY ACTION BAR */}
          <div className="sticky top-20 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-[#E5E7EB] dark:border-slate-800 rounded-xl p-2 sm:p-2.5 shadow-sm flex items-center justify-between flex-wrap gap-2 sm:gap-3 transition-all">
            
            {/* Left Actions: Export & Share Toolbar */}
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => alert('PNG download initiated')}
                className="h-9 sm:h-10 px-2.5 sm:px-3.5 bg-white dark:bg-slate-800 border border-[#E5E7EB] dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1.5 sm:gap-2 transition-all shadow-2xs active:scale-95"
              >
                <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500" />
                <span className="hidden sm:inline">Download PNG</span>
                <span className="inline sm:hidden">PNG</span>
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="h-9 sm:h-10 px-3 sm:px-3.5 bg-white dark:bg-slate-800 border border-[#E5E7EB] dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1.5 sm:gap-2 transition-all shadow-2xs active:scale-95 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500" />
                <span>{language === 'kh' ? 'បោះពុម្ពបញ្ជីទិញ' : 'Print Market List'}</span>
              </button>

              <button
                type="button"
                onClick={handleShareTelegram}
                className="h-9 sm:h-10 px-2.5 sm:px-3.5 bg-white dark:bg-slate-800 border border-[#E5E7EB] dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1.5 sm:gap-2 transition-all shadow-2xs active:scale-95"
              >
                <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-500" />
                <span className="hidden sm:inline">Telegram</span>
              </button>

              <button
                type="button"
                onClick={handleCopyLink}
                className="h-9 sm:h-10 px-2.5 sm:px-3.5 bg-white dark:bg-slate-800 border border-[#E5E7EB] dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1.5 sm:gap-2 transition-all shadow-2xs active:scale-95"
              >
                {copied ? <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#0A8F4D]" /> : <Copy className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500" />}
                <span>{copied ? 'Copied!' : 'Copy Link'}</span>
              </button>

              <button
                type="button"
                onClick={() => alert('Edit order mode enabled')}
                className="h-9 sm:h-10 px-2.5 sm:px-3.5 bg-white dark:bg-slate-800 border border-[#E5E7EB] dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1.5 sm:gap-2 transition-all shadow-2xs active:scale-95"
              >
                <FileEdit className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500" />
                <span className="hidden sm:inline">Edit Order</span>
                <span className="inline sm:hidden">Edit</span>
              </button>
            </div>

            {/* Right Actions: Manager Authorization (When Pending) */}
            {order.status === 'pending' && (
              <div className="flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={handleReject}
                  className="h-9 sm:h-10 px-3 sm:px-4 bg-white dark:bg-slate-800 border border-[#EF4444] text-[#EF4444] hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1 sm:gap-1.5 transition-all active:scale-95"
                >
                  <XCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span>{language === 'kh' ? 'បដិសេធ' : 'Reject Order'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleApprove}
                  className="h-9 sm:h-10 px-3.5 sm:px-5 bg-[#0A8F4D] hover:bg-[#08733E] text-white rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1 sm:gap-1.5 shadow-sm transition-all active:scale-95"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span>{language === 'kh' ? 'អនុម័តវិក្កយបត្រ' : 'Approve Order'}</span>
                </button>
              </div>
            )}
          </div>

          {/* MAIN 4-COLUMN DESKTOP GRID (75% Content / 25% Sidebar) */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
            
            {/* LEFT 3 COLUMNS: PURCHASE ORDER ROW & TABLE */}
            <div className="lg:col-span-3 space-y-6">
              
              {/* SECTION ③: PURCHASE ORDER HEADER ROW */}
              <div className="bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-800 rounded-xl px-4 sm:px-6 py-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6 text-sm">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#0A8F4D]/10 flex items-center justify-center flex-shrink-0">
                    <Store className="w-5 h-5 text-[#0A8F4D]" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white text-[15px]">RestaurantAI ERP</p>
                    <p className="text-[13px] text-slate-500 font-normal">Central Procurement Division</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:flex sm:items-center gap-4 sm:gap-6 w-full sm:w-auto text-[13px] text-slate-600 dark:text-slate-300 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100 dark:border-slate-800">
                  <div>
                    <span className="text-slate-400 block text-[11px] uppercase font-semibold">Document</span>
                    <span className="font-semibold text-slate-900 dark:text-white">Purchase Order / វិក្កយបត្រ</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px] uppercase font-semibold">Supplier</span>
                    <span className="font-semibold text-slate-900 dark:text-white">Morning Market Vendor / ផ្សារព្រឹក</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px] uppercase font-semibold">Date</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{order.date}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px] uppercase font-semibold">Reference</span>
                    <span className="font-semibold text-[#0A8F4D]">{order.id}</span>
                  </div>
                </div>
              </div>

              {/* SECTION ④: INGREDIENT TABLE OR DELIVERY CHECK-IN */}
              {activeTab === 'po' ? (
                <div className="bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xs">
                  {/* DESKTOP TABLE VIEW (hidden on mobile, visible md and up) */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full min-w-[950px] text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-900/90 border-b border-[#E5E7EB] dark:border-slate-800 text-[13px] font-semibold text-slate-500 uppercase tracking-wider">
                          <th className="py-4 px-4 w-12 text-center">
                            <input
                              type="checkbox"
                              checked={selectedItems.size === order.items.length && order.items.length > 0}
                              onChange={toggleSelectAll}
                              className="w-4 h-4 text-[#0A8F4D] rounded border-[#E5E7EB] focus:ring-[#0A8F4D]"
                            />
                          </th>
                          <th className="py-4 px-5 min-w-[260px]">Ingredient / ឈ្មោះទំនិញ</th>
                          <th className="py-4 px-4 min-w-[150px] whitespace-nowrap">Category</th>
                          <th className="py-4 px-4 text-right min-w-[130px] whitespace-nowrap">Requested Qty</th>
                          <th className="py-4 px-4 min-w-[100px] whitespace-nowrap">Unit</th>
                          <th className="py-4 px-4 text-right min-w-[140px] whitespace-nowrap">Estimated Price</th>
                          <th className="py-4 px-4 min-w-[200px]">Supplier Notes</th>
                          <th className="py-4 px-4 text-center min-w-[130px] whitespace-nowrap">Packing Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E5E7EB] dark:divide-slate-800 text-[15px] font-normal text-slate-900 dark:text-white">
                        {order.items.map((item) => {
                          const isSelected = selectedItems.has(item.id);

                          return (
                            <tr
                              key={item.id}
                              className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors py-3.5 ${
                                isSelected ? 'bg-[#0A8F4D]/5 dark:bg-[#0A8F4D]/10 border-l-4 border-[#0A8F4D]' : ''
                              }`}
                            >
                              <td className="py-4 px-4 text-center">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleSelectItem(item.id)}
                                  className="w-4 h-4 text-[#0A8F4D] rounded border-[#E5E7EB] focus:ring-[#0A8F4D]"
                                />
                              </td>
                              
                              <td className="py-4 px-5 min-w-[260px]">
                                <div className="flex items-center gap-3.5">
                                  <div className="w-10 h-10 rounded-xl bg-[#0A8F4D]/10 dark:bg-slate-800 flex items-center justify-center flex-shrink-0 shadow-inner">
                                    {renderIngredientIcon(item.icon || 'Package', "w-5 h-5 text-[#0A8F4D]")}
                                  </div>
                                  <div className="space-y-0.5">
                                    <p className="font-semibold text-slate-900 dark:text-white text-[15px] leading-snug">
                                      {language === 'kh' && item.nameKh ? item.nameKh : item.nameEn}
                                    </p>
                                    {item.nameKh && (
                                      <p className="text-[13px] text-slate-500 font-normal leading-snug">
                                        {language === 'kh' ? item.nameEn : item.nameKh}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </td>

                              <td className="py-4 px-4 text-sm text-slate-600 dark:text-slate-300 whitespace-nowrap">
                                {item.category || 'General Procurement'}
                              </td>

                              <td className="py-4 px-4 text-right font-bold text-base text-slate-900 dark:text-white whitespace-nowrap">
                                {item.ordered}
                              </td>

                              <td className="py-4 px-4 text-sm font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap">
                                {item.unit}
                              </td>

                              <td className="py-4 px-4 text-right font-semibold text-sm text-slate-900 dark:text-white whitespace-nowrap">
                                ${item.estimatedPrice ? (item.estimatedPrice * item.ordered).toFixed(2) : '0.00'}
                                <span className="block text-[11px] text-slate-400 font-normal">
                                  (${item.estimatedPrice?.toFixed(2) || '0.00'}/{item.unit})
                                </span>
                              </td>

                              <td className="py-4 px-4 text-[13px] text-slate-500 italic max-w-xs truncate">
                                {item.supplierNotes || 'Standard market grade, clean pack'}
                              </td>

                              <td className="py-4 px-4 text-center whitespace-nowrap">
                                {item.packingStatus === 'packed' || order.status === 'completed' ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-[#16A34A]/10 text-[#16A34A] border border-[#16A34A]/20">
                                    <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
                                    <span>Packed</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                                    <Clock className="w-3.5 h-3.5" />
                                    <span>Pending</span>
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* MOBILE CARD LIST VIEW (visible on mobile < md, hidden on desktop) */}
                  <div className="block md:hidden divide-y divide-[#E5E7EB] dark:divide-slate-800">
                    {/* Mobile Select All Header */}
                    <div className="p-3.5 bg-slate-50 dark:bg-slate-900/90 flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                      <label className="flex items-center gap-2.5 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={selectedItems.size === order.items.length && order.items.length > 0}
                          onChange={toggleSelectAll}
                          className="w-4 h-4 text-[#0A8F4D] rounded border-[#E5E7EB] focus:ring-[#0A8F4D]"
                        />
                        <span>Select All ({order.items.length})</span>
                      </label>
                      <span className="text-xs font-medium text-[#0A8F4D] bg-[#0A8F4D]/10 px-2.5 py-0.5 rounded-full">
                        {selectedItems.size} selected
                      </span>
                    </div>

                    {/* Mobile Item Cards */}
                    {order.items.map((item) => {
                      const isSelected = selectedItems.has(item.id);

                      return (
                        <div
                          key={item.id}
                          className={`p-4 transition-all ${
                            isSelected ? 'bg-[#0A8F4D]/5 dark:bg-[#0A8F4D]/10 border-l-4 border-[#0A8F4D]' : ''
                          }`}
                        >
                          {/* Top Row: Checkbox, Icon, Title, and Status Badge */}
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3 min-w-0">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleSelectItem(item.id)}
                                className="w-4 h-4 mt-1 text-[#0A8F4D] rounded border-[#E5E7EB] focus:ring-[#0A8F4D] flex-shrink-0"
                              />
                              <div className="w-10 h-10 rounded-xl bg-[#0A8F4D]/10 dark:bg-slate-800 flex items-center justify-center flex-shrink-0 shadow-inner">
                                {renderIngredientIcon(item.icon || 'Package', "w-5 h-5 text-[#0A8F4D]")}
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-slate-900 dark:text-white text-base leading-snug break-words">
                                  {language === 'kh' && item.nameKh ? item.nameKh : item.nameEn}
                                </p>
                                {item.nameKh && (
                                  <p className="text-xs text-slate-500 font-normal leading-snug break-words mt-0.5">
                                    {language === 'kh' ? item.nameEn : item.nameKh}
                                  </p>
                                )}
                                <span className="inline-block mt-1.5 px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[11px] rounded font-medium">
                                  {item.category || 'General Procurement'}
                                </span>
                              </div>
                            </div>

                            <div className="flex-shrink-0">
                              {item.packingStatus === 'packed' || order.status === 'completed' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#16A34A]/10 text-[#16A34A] border border-[#16A34A]/20">
                                  <CheckCircle2 className="w-3 h-3 stroke-[2.5]" />
                                  <span>Packed</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                                  <Clock className="w-3 h-3" />
                                  <span>Pending</span>
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Stats Grid: Qty, Unit, Estimated Price */}
                          <div className="mt-3.5 grid grid-cols-3 gap-2 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-100 dark:border-slate-700/60 text-xs">
                            <div>
                              <span className="text-slate-400 block text-[10px] uppercase font-bold">Qty / ចំនួន</span>
                              <span className="font-bold text-slate-900 dark:text-white text-sm">{item.ordered}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 block text-[10px] uppercase font-bold">Unit / ឯកតា</span>
                              <span className="font-semibold text-slate-700 dark:text-slate-300 text-sm">{item.unit.split('(')[0].trim()}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-slate-400 block text-[10px] uppercase font-bold">Est. Price / តម្លៃ</span>
                              <span className="font-bold text-[#0A8F4D] text-sm">
                                ${item.estimatedPrice ? (item.estimatedPrice * item.ordered).toFixed(2) : '0.00'}
                              </span>
                            </div>
                          </div>

                          {/* Supplier Notes */}
                          <div className="mt-2.5 text-xs text-slate-500 italic flex items-start gap-1.5 bg-amber-50/70 dark:bg-amber-950/20 p-2.5 rounded-lg border border-amber-200/60 dark:border-amber-900/40">
                            <span className="font-semibold text-amber-800 dark:text-amber-400 not-italic flex-shrink-0">Notes:</span>
                            <span className="text-amber-900 dark:text-amber-300 break-words">{item.supplierNotes || 'Standard market grade, clean pack'}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Table & Mobile Footer */}
                  <div className="bg-slate-50 dark:bg-slate-900/60 px-4 sm:px-6 py-3.5 sm:py-4 border-t border-[#E5E7EB] dark:border-slate-800 flex items-center justify-between text-xs sm:text-sm text-slate-500">
                    <span>Showing <strong className="text-slate-900 dark:text-white font-semibold">{order.items.length}</strong> procurement items</span>
                    <span>Selected: <strong className="text-[#0A8F4D] font-semibold">{selectedItems.size}</strong> items</span>
                  </div>
                </div>
              ) : (
                /* STAGE 3 DELIVERY CHECK-IN WORKFLOW TAB */
                <div className="bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-800 rounded-2xl p-6 shadow-2xs space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E7EB] dark:border-slate-800 pb-5">
                    <div className="space-y-1">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <PackageCheck className="w-5 h-5 text-[#0A8F4D]" />
                        <span>{language === 'kh' ? 'ពិនិត្យទំនិញចូល' : 'Kitchen Delivery Check-in'}</span>
                      </h3>
                      <p className="text-xs text-slate-500 font-normal">
                        {language === 'kh'
                          ? 'នៅពេលទំនិញមកដល់ពីផ្សារ សូមពិនិត្យផ្ទៀងផ្ទាត់ទំនិញនីមួយៗខាងក្រោម។ ចុច ✅ ប្រសិនបើត្រឹមត្រូវ ឬ ⚠️ ប្រសិនបើខ្វះ/ខូច។'
                          : 'When goods arrive from the market, staff verify each item below. Tap ✅ if correct, or ⚠️ if short/damaged.'}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleMarkAllRemainingCorrect}
                      className="h-10 px-4 bg-[#0A8F4D]/10 hover:bg-[#0A8F4D]/20 text-[#0A8F4D] rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{language === 'kh' ? 'កំណត់ទំនិញដែលនៅសល់ថាត្រឹមត្រូវទាំងអស់' : 'Mark All Remaining Correct'}</span>
                    </button>
                  </div>

                  {/* Live Progress Bar */}
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-[#E5E7EB] dark:border-slate-700 space-y-2">
                    <div className="flex items-center justify-between text-xs font-medium">
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#0A8F4D] animate-pulse" />
                        <span>{language === 'kh' ? 'វឌ្ឍនភាពនៃការពិនិត្យ' : 'Verification Progress'}</span>
                      </span>
                      <span className="text-slate-900 dark:text-white font-semibold">
                        <strong className="text-[#0A8F4D]">{verifiedCount}</strong> / {order.items.length} {language === 'kh' ? 'មុខទំនិញ' : 'items'} checked ({progressPercent}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-[#0A8F4D] h-full rounded-full transition-all duration-300 ease-out"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Interactive Item Verification Cards */}
                  <div className="grid grid-cols-1 gap-3">
                    {order.items.map((item) => {
                      const data = receivedData[item.id] || { received: item.ordered, isCorrect: true, isVerified: false };
                      return (
                        <div
                          key={item.id}
                          className={`p-4 rounded-xl border transition-all ${
                            data.isVerified
                              ? data.isCorrect
                                ? 'bg-[#16A34A]/5 border-[#16A34A]/30 dark:bg-[#16A34A]/10'
                                : 'bg-[#EF4444]/5 border-[#EF4444]/30 dark:bg-[#EF4444]/10'
                              : 'bg-white dark:bg-slate-800 border-[#E5E7EB] dark:border-slate-700'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
                                {renderIngredientIcon(item.icon || 'Package', "w-5 h-5 text-[#0A8F4D]")}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                                    {language === 'kh' && item.nameKh ? item.nameKh : item.nameEn}
                                  </h4>
                                  {data.isVerified && (
                                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                                      data.isCorrect ? 'bg-[#16A34A]/10 text-[#16A34A]' : 'bg-[#EF4444]/10 text-[#EF4444]'
                                    }`}>
                                      {data.isCorrect ? (language === 'kh' ? '✔ បានផ្ទៀងផ្ទាត់' : '✔ Verified') : (language === 'kh' ? '⚠️ មានបញ្ហា' : '⚠️ Flagged')}
                                    </span>
                                  )}
                                </div>
                                {item.nameKh && <p className="text-xs text-slate-500 font-normal">{language === 'kh' ? item.nameEn : item.nameKh}</p>}
                              </div>
                            </div>

                            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                              <button
                                type="button"
                                onClick={() => handleMarkCorrect(item.id, item.ordered)}
                                className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                                  data.isVerified && data.isCorrect
                                    ? 'bg-[#0A8F4D] text-white shadow-xs'
                                    : 'bg-slate-100 dark:bg-slate-700 hover:bg-[#0A8F4D] hover:text-white text-slate-700 dark:text-slate-300'
                                }`}
                              >
                                <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                                <span>{language === 'kh' ? `គ្រប់ចំនួន (${item.ordered})` : `Correct (${item.ordered})`}</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleToggleDiscrepancy(item.id, item.ordered)}
                                className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                                  data.isVerified && !data.isCorrect
                                    ? 'bg-[#EF4444] text-white shadow-xs'
                                    : 'bg-slate-100 dark:bg-slate-700 hover:bg-[#EF4444] hover:text-white text-slate-700 dark:text-slate-300'
                                }`}
                              >
                                <AlertTriangle className="w-4 h-4 stroke-[2.5]" />
                                <span>{language === 'kh' ? 'ខ្វះ/ខូច (មានបញ្ហា)' : 'Flag Issue'}</span>
                              </button>
                            </div>
                          </div>

                          {/* Inline Quantity Adjuster for Discrepancy */}
                          {!data.isCorrect && data.isVerified && (
                            <div className="mt-4 pt-4 border-t border-[#EF4444]/20 grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#EF4444]/5 p-4 rounded-xl animate-in fade-in duration-200">
                              <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                  {language === 'kh' ? 'ចំនួនទទួលបានពិតប្រាកដ' : 'Actual Quantity Received'}
                                </label>
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateReceivedQty(item.id, data.received - 1, item.ordered)}
                                    className="w-9 h-9 rounded-lg border border-[#E5E7EB] dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-200 flex items-center justify-center font-bold shadow-2xs active:scale-95"
                                  >
                                    <Minus className="w-4 h-4" />
                                  </button>
                                  <input
                                    type="number"
                                    value={data.received === 0 ? '' : data.received}
                                    onChange={(e) => handleUpdateReceivedQty(item.id, parseFloat(e.target.value || '0'), item.ordered)}
                                    min="0"
                                    step="any"
                                    className="w-24 h-9 text-center bg-white dark:bg-slate-800 border border-[#E5E7EB] dark:border-slate-700 rounded-lg font-bold text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#EF4444]"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateReceivedQty(item.id, data.received + 1, item.ordered)}
                                    className="w-9 h-9 rounded-lg border border-[#E5E7EB] dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-200 flex items-center justify-center font-bold shadow-2xs active:scale-95"
                                  >
                                    <Plus className="w-4 h-4" />
                                  </button>
                                  <span className="text-xs font-semibold text-slate-500">{item.unit}</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="pt-4 border-t border-[#E5E7EB] dark:border-slate-800 flex justify-end">
                    <button
                      type="button"
                      onClick={handleCompleteCheckIn}
                      className="h-11 px-6 bg-[#0A8F4D] hover:bg-[#08733E] text-white rounded-xl text-sm font-bold flex items-center gap-2 shadow-sm transition-all active:scale-95"
                    >
                      <PackageCheck className="w-4 h-4" />
                      <span>{language === 'kh' ? 'បញ្ចប់ការផ្ទៀងផ្ទាត់ទំនិញ' : 'Complete Delivery Check-in'}</span>
                    </button>
                  </div>
                </div>
              )}

            </div>

            {/* RIGHT COLUMN: STICKY SIDEBAR (Recent Activity) */}
            <div className="lg:col-span-1 sticky top-24 space-y-6">

              {/* Recent Activity Timeline Card */}
              <div className="bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-800 rounded-2xl p-6 shadow-2xs space-y-4">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white border-b border-[#E5E7EB] dark:border-slate-800 pb-3 flex items-center gap-2">
                  <History className="w-4 h-4 text-[#0A8F4D]" />
                  <span>Recent Activity</span>
                </h3>

                <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
                  
                  {/* Event 1: Created */}
                  <div className="relative">
                    <span className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-white dark:bg-slate-900 border-2 border-[#0A8F4D] flex items-center justify-center">
                      <span className="w-2 h-2 rounded-full bg-[#0A8F4D]" />
                    </span>
                    <p className="text-xs font-semibold text-slate-900 dark:text-white">Order Created</p>
                    <p className="text-[11px] text-slate-500 font-normal">Submitted by {order.createdBy}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{order.date} • 05:30 AM</p>
                  </div>

                  {/* Event 2: Review State */}
                  <div className="relative">
                    <span className={`absolute -left-6 top-1 w-5 h-5 rounded-full bg-white dark:bg-slate-900 border-2 flex items-center justify-center ${
                      order.status === 'pending' ? 'border-[#F59E0B]' : 'border-[#0A8F4D]'
                    }`}>
                      <span className={`w-2 h-2 rounded-full ${order.status === 'pending' ? 'bg-[#F59E0B] animate-pulse' : 'bg-[#0A8F4D]'}`} />
                    </span>
                    <p className="text-xs font-semibold text-slate-900 dark:text-white">
                      {order.status === 'pending' ? 'Pending Manager Review' : 'Manager Authorization'}
                    </p>
                    <p className="text-[11px] text-slate-500 font-normal">
                      {order.status === 'pending' ? 'Awaiting review by Manager Dara' : `Approved by ${order.approvedBy || 'Manager Dara'}`}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{order.date} • 06:15 AM</p>
                  </div>

                  {/* Event 3: Market Dispatch */}
                  <div className="relative">
                    <span className={`absolute -left-6 top-1 w-5 h-5 rounded-full bg-white dark:bg-slate-900 border-2 flex items-center justify-center ${
                      order.status === 'sent' || order.status === 'completed' ? 'border-[#0A8F4D]' : 'border-slate-300 dark:border-slate-700'
                    }`}>
                      <span className={`w-2 h-2 rounded-full ${order.status === 'sent' || order.status === 'completed' ? 'bg-[#0A8F4D]' : 'bg-slate-300 dark:bg-slate-700'}`} />
                    </span>
                    <p className="text-xs font-semibold text-slate-900 dark:text-white">Market Procurement</p>
                    <p className="text-[11px] text-slate-500 font-normal">
                      {order.status === 'sent' || order.status === 'completed' ? 'Dispatched to Morning Market Vendor' : 'Ready for dispatch upon approval'}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{order.date} • 06:30 AM</p>
                  </div>

                  {/* Event 4: Delivery Check-in */}
                  {order.status === 'completed' && (
                    <div className="relative">
                      <span className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-white dark:bg-slate-900 border-2 border-[#16A34A] flex items-center justify-center">
                        <span className="w-2 h-2 rounded-full bg-[#16A34A]" />
                      </span>
                      <p className="text-xs font-semibold text-[#16A34A]">Delivery Completed</p>
                      <p className="text-[11px] text-slate-500 font-normal">All {order.items.length} items verified & checked into inventory</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{order.date} • 08:45 AM</p>
                    </div>
                  )}

                </div>
              </div>

            </div>

          </div>

        </div>
      </div>

      {/* ── PRINT SHEET: portalled to body so @media print can isolate it correctly ── */}
      {printQueue.length > 0 && (
        <PrintPortal>
          <PrintSheet orders={printQueue} currency={printCurrency} />
        </PrintPortal>
      )}
    </AppLayout>
  );
}
