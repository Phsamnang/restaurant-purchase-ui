'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { AppLayout } from '@/components/app-layout';
import { StatusBadge } from '@/components/shared/status-badge';
import { getOrderById, updateOrder, OrderRequest, OrderItemDetail } from '@/lib/orders';
import { 
  CheckCircle2, 
  XCircle, 
  Printer, 
  Image as ImageIcon, 
  Send, 
  AlertTriangle, 
  ShieldCheck, 
  UserCheck, 
  PackageCheck, 
  ArrowLeft,
  Sparkles,
  Plus,
  Minus,
  AlertCircle,
  Check,
  Store,
  Calendar,
  Clock,
  User,
  FileText,
  Share2,
  Download,
  ChevronRight,
  Flame,
  HelpCircle
} from 'lucide-react';

const DISCREPANCY_REASONS = [
  'Out of Stock / អស់ពីផ្សារ',
  'Damaged or Spoiled / ខូចគុណភាព/រលួយ',
  'Wrong Item Delivered / ខុសមុខទំនិញ',
  'Price Changed / ដូរតម្លៃ',
  'Short Delivery / ខ្វះទម្ងន់/ចំនួន',
];

const COMMON_UNITS = [
  'kg',
  'g',
  'bundle',
  'bottle',
  'sack',
  'pack',
  'can',
  'case',
  'bird',
  'piece'
];

interface CheckInData {
  received: number;
  isCorrect: boolean;
  isVerified: boolean;
  reason?: string;
  unit?: string;
}

export default function RequestDetailPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  
  // State
  const [order, setOrder] = useState<OrderRequest | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [demoRole, setDemoRole] = useState<'manager' | 'staff'>('manager');
  const [exportingImage, setExportingImage] = useState(false);

  // Delivery Check-in State
  const [checkingIn, setCheckingIn] = useState(false);
  const [receivedData, setReceivedData] = useState<Record<string, CheckInData>>({});

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
      return;
    }

    if (params.id) {
      const found = getOrderById(params.id as string);
      if (found) {
        setOrder(found);
        // Initialize check-in data
        const initial: Record<string, CheckInData> = {};
        found.items.forEach((item) => {
          const rec = item.received !== undefined ? item.received : item.ordered;
          const isCorr = item.received === undefined || item.received === item.ordered;
          const isVer = item.received !== undefined;
          initial[item.id] = { 
            received: rec, 
            isCorrect: isCorr, 
            isVerified: isVer,
            reason: item.discrepancyReason 
          };
        });
        setReceivedData(initial);
      }
      setPageLoading(false);
    }
  }, [user, loading, router, params.id]);

  // Verification progress calculations
  const totalItemsCount = order?.items.length || 0;
  const verifiedCount = useMemo(() => {
    return Object.values(receivedData).filter((d) => d.isVerified).length;
  }, [receivedData]);
  const progressPercent = totalItemsCount > 0 ? Math.round((verifiedCount / totalItemsCount) * 100) : 0;

  // Handlers for Manager Approval
  const handleApprove = () => {
    if (!order) return;
    const updated: OrderRequest = {
      ...order,
      status: 'approved',
      approvedBy: user?.name ? `${user.name} (អ្នកគ្រប់គ្រង)` : 'Manager Dara (អ្នកគ្រប់គ្រង)',
    };
    updateOrder(updated);
    setOrder(updated);
  };

  const handleReject = () => {
    if (!order) return;
    if (!confirm('Are you sure you want to reject this order? / តើអ្នកពិតជាចង់បដិសេធមែនទេ?')) return;
    const updated: OrderRequest = {
      ...order,
      status: 'rejected',
    };
    updateOrder(updated);
    setOrder(updated);
  };

  // Handlers for Supplier Export
  const handleDownloadPNG = async () => {
    const element = document.getElementById('supplier-invoice-card');
    if (!element) return;
    setExportingImage(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(element, { 
        scale: 2, 
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false 
      });
      const link = document.createElement('a');
      link.download = `${order?.id || 'order'}-supplier-sheet.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      alert('Failed to generate image. Please use Print/PDF instead.');
    } finally {
      setExportingImage(false);
    }
  };

  const handlePrintPDF = () => {
    window.print();
  };

  const handleShareTelegram = () => {
    if (!order) return;
    const text = `📋 *MARKET PURCHASE ORDER / បញ្ជីទំនិញ #${order.id}*\n🏪 RestaurantAI Kitchen\n📅 Date: ${order.date}\n---\n` +
      order.items.map((i, idx) => `${idx + 1}. ${i.icon || '▫️'} *${i.nameEn}* (${i.nameKh}) - *${i.ordered} ${i.unit}*`).join('\n') +
      `\n---\n✅ Approved by ${order.approvedBy || 'Manager'}\n🙏 Please check items as you pack and deliver by morning! / សូមដឹកជញ្ជូនពេលព្រឹក!`;
    
    window.open(`https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(text)}`, '_blank');
    
    if (order.status === 'approved') {
      const updated: OrderRequest = { ...order, status: 'sent' };
      updateOrder(updated);
      setOrder(updated);
    }
  };

  // Handlers for Fast-Tap Delivery Check-in
  const handleMarkCorrect = (itemId: string, orderedQty: number) => {
    setReceivedData((prev) => ({
      ...prev,
      [itemId]: { received: orderedQty, isCorrect: true, isVerified: true, reason: undefined },
    }));
  };

  const handleToggleDiscrepancy = (itemId: string, orderedQty: number) => {
    setReceivedData((prev) => {
      const current = prev[itemId];
      const newRec = current && current.received < orderedQty ? current.received : Math.max(0, orderedQty - 1);
      return {
        ...prev,
        [itemId]: { 
          received: newRec, 
          isCorrect: false, 
          isVerified: true,
          reason: current?.reason || DISCREPANCY_REASONS[0] 
        },
      };
    });
  };

  const handleUpdateReceivedQty = (itemId: string, qty: number, orderedQty: number) => {
    setReceivedData((prev) => {
      const current = prev[itemId] || { received: orderedQty, isCorrect: true, isVerified: true };
      const isNowCorrect = qty === orderedQty;
      return {
        ...prev,
        [itemId]: {
          ...current,
          received: Math.max(0, qty),
          isCorrect: isNowCorrect,
          isVerified: true,
          reason: isNowCorrect ? undefined : (current.reason || DISCREPANCY_REASONS[0]),
        },
      };
    });
  };

  const handleUpdateReason = (itemId: string, reason: string) => {
    setReceivedData((prev) => {
      const current = prev[itemId];
      if (!current) return prev;
      return {
        ...prev,
        [itemId]: { ...current, reason },
      };
    });
  };

  const handleUpdateUnit = (itemId: string, newUnit: string) => {
    setReceivedData((prev) => {
      const current = prev[itemId];
      if (!current) return prev;
      return {
        ...prev,
        [itemId]: { ...current, unit: newUnit },
      };
    });
  };

  const handleMarkAllRemainingCorrect = () => {
    if (!order) return;
    const next = { ...receivedData };
    order.items.forEach((item) => {
      if (!next[item.id] || !next[item.id].isVerified) {
        next[item.id] = { received: item.ordered, isCorrect: true, isVerified: true, reason: undefined };
      }
    });
    setReceivedData(next);
  };

  const handleSubmitCheckIn = () => {
    if (!order) return;
    
    // Ensure all items are marked verified
    const unverified = order.items.filter((item) => !receivedData[item.id]?.isVerified);
    if (unverified.length > 0) {
      if (!confirm(`You still have ${unverified.length} unverified items. Mark them as 100% correct and submit?`)) {
        return;
      }
      handleMarkAllRemainingCorrect();
    }

    const anyShortage = order.items.some((item) => {
      const data = receivedData[item.id];
      return !data || !data.isCorrect || data.received !== item.ordered;
    });

    const finalStatus = anyShortage ? 'discrepancy' : 'completed';

    const updatedItems = order.items.map((item) => {
      const data = receivedData[item.id] || { received: item.ordered, isCorrect: true };
      return {
        ...item,
        unit: data.unit || item.unit,
        received: data.received,
        discrepancyReason: data.isCorrect ? undefined : data.reason,
      };
    });

    const updated: OrderRequest = {
      ...order,
      status: finalStatus,
      items: updatedItems,
    };

    updateOrder(updated);
    setOrder(updated);
    setCheckingIn(false);
    
    if (finalStatus === 'discrepancy') {
      alert('⚠️ Discrepancy reported! The manager has been notified of shortages/issues.');
    } else {
      alert('🎉 All items verified correct! Order marked as Completed.');
    }
  };

  if (loading || pageLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center font-bold text-muted-foreground">Loading order details...</div>;
  }

  if (!user || !order) {
    return (
      <AppLayout title="Order Not Found">
        <div className="text-center py-16 space-y-4 bg-card border border-border rounded-2xl max-w-md mx-auto my-12 p-8 shadow-sm">
          <div className="w-16 h-16 bg-secondary text-muted-foreground rounded-full flex items-center justify-center mx-auto">
            <HelpCircle className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-foreground">Order Not Found</h3>
          <p className="text-sm text-muted-foreground">This order reference could not be found or has been removed.</p>
          <button onClick={() => router.push('/requests')} className="bg-[#0A8F4D] hover:bg-[#0A8F4D]/90 text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm">
            Back to Orders List
          </button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title={`Order #${order.id}`}>
      <datalist id="common-units-list">
        {COMMON_UNITS.map((u) => (
          <option key={u} value={u} />
        ))}
      </datalist>
      <div className="space-y-6 pb-32">
        {/* Top Navigation & Role Switcher Banner (Hidden when printing!) */}
        <div className="print:hidden bg-card border border-border/80 rounded-2xl p-4 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <button
            onClick={() => router.push('/requests')}
            className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to Orders List / ត្រឡប់</span>
          </button>

          {/* Role Demo Switcher Pill */}
          <div className="flex items-center gap-2 bg-secondary/80 p-1.5 rounded-xl border border-border/80 w-full sm:w-auto justify-between sm:justify-start">
            <span className="text-xs font-black px-2 text-muted-foreground uppercase tracking-wider">Demo Role:</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setDemoRole('manager')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  demoRole === 'manager'
                    ? 'bg-[#0A8F4D] text-white shadow-2xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>👨‍💼 Manager</span>
              </button>
              <button
                onClick={() => setDemoRole('staff')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  demoRole === 'staff'
                    ? 'bg-[#0A8F4D] text-white shadow-2xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <PackageCheck className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>🧑‍🍳 Kitchen Staff</span>
              </button>
            </div>
          </div>
        </div>

        {/* Status & Summary Header (Hidden when printing!) */}
        <div className="print:hidden bg-card border border-border/80 rounded-2xl p-6 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">{order.id}</h1>
              <StatusBadge status={order.status as any} size="lg" />
            </div>
            <div className="flex items-center gap-4 text-xs sm:text-sm text-muted-foreground font-medium flex-wrap">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-[#0A8F4D]" />
                <span>Ordered: <strong className="text-foreground">{order.date}</strong></span>
              </span>
              <span className="flex items-center gap-1.5">
                <User className="w-4 h-4 text-[#0A8F4D]" />
                <span>By: <strong className="text-foreground">{order.createdBy}</strong></span>
              </span>
              {order.approvedBy && (
                <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Approved by {order.approvedBy}</span>
                </span>
              )}
            </div>
          </div>

          <div className="text-left sm:text-right bg-secondary/50 sm:bg-transparent p-4 sm:p-0 rounded-xl border sm:border-0 border-border/60">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Estimated Total / តម្លៃប៉ាន់ស្មាន</p>
            <p className="text-3xl sm:text-4xl font-black text-[#0A8F4D] mt-0.5">{order.total}</p>
            <p className="text-[11px] text-muted-foreground font-medium mt-1">{order.items.length} unique ingredients requested</p>
          </div>
        </div>

        {/* STAGE 1: MANAGER REVIEW BANNER (When status === 'pending') */}
        {order.status === 'pending' && (
          <div className="print:hidden bg-amber-500/10 border-2 border-amber-500/30 rounded-2xl p-6 shadow-sm space-y-5 animate-in fade-in duration-300">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-300 flex-shrink-0 mt-0.5">
                <AlertTriangle className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="text-lg font-black text-amber-900 dark:text-amber-200">
                  Pending Manager Review / រង់ចាំការពិនិត្យពីអ្នកគ្រប់គ្រង
                </h3>
                <p className="text-sm text-amber-800 dark:text-amber-300/90 font-medium mt-1 leading-relaxed">
                  {demoRole === 'manager'
                    ? 'As the Manager, please review the requested items and quantities below. Once approved, you or the kitchen staff can export or share the order sheet with market suppliers.'
                    : 'This order is currently waiting for Manager approval. Switch to the "👨‍💼 Manager" demo role at the top right to test approving or rejecting this request.'}
                </p>
              </div>
            </div>

            {demoRole === 'manager' && (
              <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-amber-500/20">
                <button
                  onClick={handleApprove}
                  className="flex-1 bg-[#0A8F4D] hover:bg-[#0A8F4D]/90 text-white py-3.5 px-6 rounded-xl font-black text-sm sm:text-base transition-all shadow-md flex items-center justify-center gap-2 active:scale-95"
                >
                  <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                  <span>Approve Order / យល់ព្រមបញ្ជាទិញ</span>
                </button>
                <button
                  onClick={handleReject}
                  className="bg-red-600 hover:bg-red-700 text-white py-3.5 px-6 rounded-xl font-bold text-sm sm:text-base transition-all shadow-md flex items-center justify-center gap-2 active:scale-95"
                >
                  <XCircle className="w-5 h-5 stroke-[2.5]" />
                  <span>Reject / បដិសេធ</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* STAGE 2: SUPPLIER EXPORT CARD & TOOLBAR (When approved, sent, completed, or discrepancy) */}
        {order.status !== 'pending' && order.status !== 'rejected' && (
          <div className="space-y-5">
            {/* 3-in-1 Export Toolbar (Hidden when printing!) */}
            <div className="print:hidden bg-[#0A8F4D]/5 border border-[#0A8F4D]/20 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
              <div className="space-y-1">
                <h3 className="text-base font-black text-foreground flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-500 fill-amber-500" />
                  <span>Send to Supplier / ផ្ញើទៅអ្នកផ្គត់ផ្គង់ផ្សារ</span>
                </h3>
                <p className="text-xs text-muted-foreground font-medium">
                  Download as a clean Image, Print/PDF, or share directly via Telegram to your wet market vendors!
                </p>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                <button
                  onClick={handleDownloadPNG}
                  disabled={exportingImage}
                  className="bg-card hover:bg-secondary border border-border/80 text-foreground px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-2xs flex items-center gap-2 active:scale-95 disabled:opacity-50"
                  title="Download clean PNG invoice image"
                >
                  <ImageIcon className="w-4 h-4 text-blue-500 stroke-[2.5]" />
                  <span>{exportingImage ? 'Generating...' : 'Image (PNG)'}</span>
                </button>

                <button
                  onClick={handlePrintPDF}
                  className="bg-card hover:bg-secondary border border-border/80 text-foreground px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-2xs flex items-center gap-2 active:scale-95"
                  title="Print or Save as PDF"
                >
                  <Printer className="w-4 h-4 text-purple-500 stroke-[2.5]" />
                  <span>Print / PDF</span>
                </button>

                <button
                  onClick={handleShareTelegram}
                  className="bg-[#0088cc] hover:bg-[#0077b3] text-white px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all shadow-md flex items-center gap-2 active:scale-95"
                  title="Share formatted order list to Telegram"
                >
                  <Send className="w-4 h-4 stroke-[2.5]" />
                  <span>Telegram / WhatsApp</span>
                </button>
              </div>
            </div>

            {/* PRINTABLE / EXPORTABLE SUPPLIER INVOICE CARD */}
            <div
              id="supplier-invoice-card"
              className="bg-white text-slate-900 rounded-2xl border-2 border-slate-200 p-6 sm:p-8 shadow-md space-y-6 print:border-0 print:shadow-none print:p-0"
            >
              {/* Invoice Header */}
              <div className="border-b-2 border-slate-800 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2.5">
                    <span className="text-3xl">🏪</span>
                    <h2 className="text-2xl font-black tracking-tight text-slate-900">RestaurantAI Kitchen</h2>
                  </div>
                  <p className="text-xs font-extrabold text-[#0A8F4D] uppercase tracking-widest mt-1">
                    Morning Market Purchase Order / វិក្កយបត្របញ្ជាទិញ
                  </p>
                </div>
                <div className="text-left sm:text-right bg-slate-100 p-3.5 rounded-xl border border-slate-200">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Order Reference</p>
                  <p className="text-xl font-black text-slate-900">{order.id}</p>
                  <p className="text-xs font-semibold text-slate-600 mt-0.5">Date: {order.date}</p>
                </div>
              </div>

              {/* Instructions for Supplier */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-xs font-semibold text-amber-900 flex items-center justify-between flex-wrap gap-2">
                <span>🙏 <strong>For Supplier:</strong> Please check off items `[✔]` as you pack them at the morning market. / សូមគូសបញ្ជាក់ទំនិញពេលវេចខ្ចប់។</span>
                <span className="font-black bg-amber-200/60 px-2.5 py-1 rounded-lg text-amber-950">Total: {order.items.length} Items</span>
              </div>

              {/* Invoice Items Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b-2 border-slate-300 text-xs font-black text-slate-600 uppercase tracking-wider">
                      <th className="py-3 px-2 w-14 text-center">Pack</th>
                      <th className="py-3 px-3">Ingredient Name / ឈ្មោះទំនិញ</th>
                      <th className="py-3 px-3 text-right">Quantity / ចំនួន</th>
                      <th className="py-3 px-3 text-right">Unit / ខ្នាត</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-sm">
                    {order.items.map((item, idx) => (
                      <tr key={item.id || idx} className="hover:bg-slate-50 font-medium">
                        <td className="py-3.5 px-2 text-center">
                          <div className="w-6 h-6 border-2 border-slate-400 rounded-md mx-auto flex items-center justify-center bg-white shadow-inner">
                            {/* Empty checkbox for vendor */}
                          </div>
                        </td>
                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-2.5">
                            <span className="text-xl p-1 bg-slate-100 rounded-lg">{item.icon || '▫️'}</span>
                            <div>
                              <p className="font-bold text-slate-900">{item.nameEn}</p>
                              {item.nameKh && <p className="text-xs text-slate-600 font-semibold">{item.nameKh}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-3 text-right font-black text-slate-900 text-base">
                          {item.ordered}
                        </td>
                        <td className="py-3.5 px-3 text-right text-xs font-extrabold text-slate-600">
                          {item.unit}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Invoice Footer / Signatures */}
              <div className="border-t-2 border-slate-300 pt-8 grid grid-cols-2 gap-8 text-xs font-semibold text-slate-600">
                <div className="space-y-10">
                  <p>Requested by: <strong className="text-slate-900 font-black">{order.createdBy}</strong></p>
                  <div className="border-t border-slate-300 pt-2 w-48">
                    <p className="text-[11px] text-slate-400 uppercase font-black tracking-wider">Kitchen Staff Signature</p>
                  </div>
                </div>
                <div className="space-y-10 text-right flex flex-col items-end">
                  <p>Approved by: <strong className="text-slate-900 font-black">{order.approvedBy || 'Manager'}</strong></p>
                  <div className="border-t border-slate-300 pt-2 w-48 text-right">
                    <p className="text-[11px] text-slate-400 uppercase font-black tracking-wider">Supplier / Driver Signature</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STAGE 3: STAFF DELIVERY CHECK-IN & VERIFICATION (Hidden when printing!) */}
        {order.status !== 'pending' && order.status !== 'rejected' && (
          <div className="print:hidden bg-card border-2 border-border/80 rounded-2xl p-6 shadow-2xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
              <div className="space-y-1">
                <h3 className="text-lg sm:text-xl font-black text-foreground flex items-center gap-2">
                  <PackageCheck className="w-6 h-6 text-[#0A8F4D]" />
                  <span>Kitchen Delivery Check-in / ពិនិត្យទំនិញចូល</span>
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground font-medium">
                  When goods arrive from the market, staff verify each item below. Tap ✅ if correct, or ⚠️ if short/damaged.
                </p>
              </div>

              {!checkingIn && order.status !== 'completed' && order.status !== 'discrepancy' && (
                <button
                  onClick={() => setCheckingIn(true)}
                  className="bg-[#0A8F4D] hover:bg-[#0A8F4D]/90 text-white px-5 py-3 rounded-xl font-black text-sm transition-all shadow-md active:scale-95 flex items-center gap-2 flex-shrink-0"
                >
                  <PackageCheck className="w-5 h-5 stroke-[2.5]" />
                  <span>Start Delivery Check-in / ចាប់ផ្តើមពិនិត្យ</span>
                </button>
              )}
            </div>

            {/* Check-in Checklist or Status Summary */}
            {checkingIn ? (
              <div className="space-y-6 animate-in fade-in duration-200">
                {/* Live Progress Bar & Helper */}
                <div className="bg-secondary/70 p-4 rounded-xl border border-border/80 space-y-2.5">
                  <div className="flex items-center justify-between text-xs sm:text-sm font-bold">
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#0A8F4D] animate-pulse" />
                      <span>Verification Progress</span>
                    </span>
                    <span className="text-foreground">
                      <strong className="text-[#0A8F4D] font-black">{verifiedCount}</strong> / {totalItemsCount} items checked ({progressPercent}%)
                    </span>
                  </div>
                  <div className="w-full bg-background h-3 rounded-full overflow-hidden p-0.5 border border-border">
                    <div
                      className="bg-[#0A8F4D] h-full rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  {verifiedCount < totalItemsCount && (
                    <div className="flex items-center justify-between pt-1 text-[11px] text-muted-foreground font-medium">
                      <span>Tap &quot;Correct&quot; or &quot;Flag Issue&quot; on each card below</span>
                      <button
                        type="button"
                        onClick={handleMarkAllRemainingCorrect}
                        className="text-[#0A8F4D] hover:underline font-bold"
                      >
                        ⚡ Mark All Remaining Correct
                      </button>
                    </div>
                  )}
                </div>

                {/* Interactive Item Cards List */}
                <div className="grid grid-cols-1 gap-3.5">
                  {order.items.map((item) => {
                    const data = receivedData[item.id] || { received: item.ordered, isCorrect: true, isVerified: false };
                    
                    return (
                      <div
                        key={item.id}
                        className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                          data.isVerified
                            ? data.isCorrect
                              ? 'bg-emerald-500/5 border-emerald-500/40 dark:bg-emerald-950/20 shadow-2xs'
                              : 'bg-red-500/5 border-red-500/40 dark:bg-red-950/20 shadow-2xs'
                            : 'bg-card border-border/80 hover:border-border'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex items-center gap-3.5">
                            <span className="text-2xl sm:text-3xl p-2.5 bg-secondary rounded-xl flex-shrink-0 shadow-inner">
                              {item.icon || '▫️'}
                            </span>
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold text-base text-foreground">{item.nameEn}</h4>
                                {data.isVerified && (
                                  <span className={`inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${
                                    data.isCorrect ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                  }`}>
                                    {data.isCorrect ? '✔ Verified' : '⚠️ Flagged'}
                                  </span>
                                )}
                              </div>
                              {item.nameKh && <p className="text-xs text-[#0A8F4D] font-bold">{item.nameKh}</p>}
                              <div className="text-xs text-muted-foreground font-medium pt-0.5 flex items-center gap-1.5 flex-wrap">
                                <span>Ordered: <strong className="text-foreground font-bold">{item.ordered}</strong></span>
                                <input
                                  type="text"
                                  list="common-units-list"
                                  value={data.unit || item.unit}
                                  onChange={(e) => handleUpdateUnit(item.id, e.target.value)}
                                  placeholder="unit"
                                  className="w-16 px-1.5 py-0.5 text-xs font-black text-center bg-background border border-border/80 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0A8F4D] text-[#0A8F4D] shadow-2xs"
                                  title="Edit unit dynamically"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Fast-Tap Action Buttons */}
                          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                            <button
                              type="button"
                              onClick={() => handleMarkCorrect(item.id, item.ordered)}
                              className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-1.5 ${
                                data.isVerified && data.isCorrect
                                  ? 'bg-[#0A8F4D] text-white shadow-sm scale-[1.02] ring-2 ring-[#0A8F4D]/40'
                                  : 'bg-secondary hover:bg-[#0A8F4D] hover:text-white text-muted-foreground'
                              }`}
                            >
                              <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                              <span>Correct ({item.ordered}) / គ្រប់ចំនួន</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleToggleDiscrepancy(item.id, item.ordered)}
                              className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-1.5 ${
                                data.isVerified && !data.isCorrect
                                  ? 'bg-red-600 text-white shadow-sm scale-[1.02] ring-2 ring-red-600/40'
                                  : 'bg-secondary hover:bg-red-600 hover:text-white text-muted-foreground'
                              }`}
                            >
                              <AlertTriangle className="w-4 h-4 stroke-[2.5]" />
                              <span>Flag Issue / ខ្វះ/ខូច</span>
                            </button>
                          </div>
                        </div>

                        {/* Discrepancy inline adjuster if flagged */}
                        {!data.isCorrect && data.isVerified && (
                          <div className="mt-4 pt-4 border-t border-red-500/20 grid grid-cols-1 sm:grid-cols-2 gap-4 bg-red-500/5 p-4 rounded-xl animate-in fade-in duration-200">
                            <div>
                              <label className="block text-xs font-bold text-foreground mb-1.5">
                                Actual Quantity Received / ចំនួនទទួលបានពិតប្រាកដ
                              </label>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleUpdateReceivedQty(item.id, data.received - 1, item.ordered)}
                                  className="w-10 h-10 rounded-lg border border-border bg-background hover:bg-secondary text-foreground flex items-center justify-center font-bold shadow-2xs active:scale-95"
                                >
                                  <Minus className="w-4 h-4" />
                                </button>
                                <input
                                  type="number"
                                  value={data.received === 0 ? '' : data.received}
                                  onChange={(e) => handleUpdateReceivedQty(item.id, parseFloat(e.target.value || '0'), item.ordered)}
                                  min="0"
                                  step="any"
                                  max={item.ordered}
                                  className="w-20 text-center py-2 border border-border rounded-lg text-sm font-black bg-background focus:outline-none focus:ring-2 focus:ring-[#0A8F4D] shadow-inner"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleUpdateReceivedQty(item.id, data.received + 1, item.ordered)}
                                  className="w-10 h-10 rounded-lg border border-border bg-background hover:bg-secondary text-foreground flex items-center justify-center font-bold shadow-2xs active:scale-95"
                                >
                                  <Plus className="w-4 h-4" />
                                </button>
                                <input
                                  type="text"
                                  list="common-units-list"
                                  value={data.unit || item.unit}
                                  onChange={(e) => handleUpdateUnit(item.id, e.target.value)}
                                  placeholder="unit"
                                  className="w-16 px-1.5 py-1 text-xs font-black text-center bg-background border border-border/80 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0A8F4D] text-[#0A8F4D] shadow-2xs ml-1"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-xs font-bold text-foreground mb-1.5">
                                Reason for Discrepancy / មូលហេតុ
                              </label>
                              <select
                                value={data.reason || DISCREPANCY_REASONS[0]}
                                onChange={(e) => handleUpdateReason(item.id, e.target.value)}
                                className="w-full px-3.5 py-2.5 border border-border rounded-xl text-xs font-bold bg-background focus:outline-none focus:ring-2 focus:ring-[#0A8F4D] shadow-2xs"
                              >
                                {DISCREPANCY_REASONS.map((r) => (
                                  <option key={r} value={r}>{r}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Final Submit Check-in Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-border/80">
                  <button
                    onClick={handleSubmitCheckIn}
                    className="flex-1 bg-[#0A8F4D] hover:bg-[#0A8F4D]/90 text-white py-4 px-6 rounded-xl font-black text-base transition-all shadow-lg shadow-[#0A8F4D]/25 active:scale-95 flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                    <span>Submit Delivery Verification Report ({verifiedCount}/{totalItemsCount} checked)</span>
                  </button>
                  <button
                    onClick={() => setCheckingIn(false)}
                    className="px-6 py-4 border border-border text-foreground rounded-xl font-bold text-sm hover:bg-secondary transition-colors"
                  >
                    Cancel / បោះបង់
                  </button>
                </div>
              </div>
            ) : (
              /* Already Verified or Waiting to check in */
              <div className="space-y-4">
                {order.status === 'completed' || order.status === 'discrepancy' ? (
                  <div className="space-y-4">
                    <div className={`p-5 rounded-2xl border flex items-start sm:items-center gap-4 ${
                      order.status === 'completed' 
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-200' 
                        : 'bg-red-500/10 border-red-500/30 text-red-900 dark:text-red-200'
                    }`}>
                      {order.status === 'completed' ? (
                        <CheckCircle2 className="w-8 h-8 text-emerald-600 flex-shrink-0 mt-0.5 sm:mt-0 stroke-[2.5]" />
                      ) : (
                        <AlertTriangle className="w-8 h-8 text-red-600 flex-shrink-0 mt-0.5 sm:mt-0 stroke-[2.5]" />
                      )}
                      <div className="space-y-1">
                        <p className="font-black text-base sm:text-lg">
                          {order.status === 'completed' 
                            ? 'Delivery Verified: All Items Correct & Accounted For! / ទំនិញគ្រប់ចំនួនល្អ' 
                            : 'Delivery Verified: Discrepancies & Shortages Reported! / មានទំនិញខ្វះខូច'}
                        </p>
                        <p className="text-xs sm:text-sm opacity-90 font-medium">
                          The kitchen staff verified and logged this market delivery on {order.date}.
                        </p>
                      </div>
                    </div>

                    {/* Show discrepancy breakdown if any */}
                    {order.status === 'discrepancy' && (
                      <div className="border border-red-500/20 rounded-2xl p-5 bg-background space-y-3 shadow-2xs">
                        <p className="text-xs font-black text-red-600 uppercase tracking-wider flex items-center gap-1.5">
                          <AlertCircle className="w-4 h-4 stroke-[2.5]" />
                          <span>Discrepancy Breakdown / បញ្ជីទំនិញមានបញ្ហា:</span>
                        </p>
                        <div className="space-y-2 text-xs sm:text-sm">
                          {order.items.filter(i => i.received !== undefined && i.received !== i.ordered).map(item => (
                            <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-border/40 last:border-0 gap-1">
                              <span className="font-bold text-foreground flex items-center gap-2">
                                <span className="text-base">{item.icon || '▫️'}</span>
                                <span>{item.nameEn} ({item.nameKh})</span>
                              </span>
                              <span className="text-red-600 font-extrabold bg-red-500/10 px-2.5 py-1 rounded-lg">
                                Received {item.received} / {item.ordered} {item.unit} — <i className="font-medium">{item.discrepancyReason}</i>
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end pt-1">
                      <button
                        onClick={() => setCheckingIn(true)}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0A8F4D] hover:underline bg-[#0A8F4D]/10 px-3.5 py-2 rounded-xl transition-colors"
                      >
                        <span>✏️ Edit Delivery Report / កែសម្រួលរបាយការណ៍</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-secondary/50 rounded-2xl p-8 text-center space-y-3 border border-dashed border-border">
                    <div className="w-12 h-12 rounded-full bg-[#0A8F4D]/10 text-[#0A8F4D] flex items-center justify-center mx-auto">
                      <PackageCheck className="w-6 h-6 stroke-[2.5]" />
                    </div>
                    <div>
                      <h4 className="font-bold text-foreground text-base">Waiting for Morning Market Delivery</h4>
                      <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto font-medium">
                        This order has been approved and sent to suppliers. When the driver arrives at the kitchen, click &quot;Start Delivery Check-in&quot; above to verify items.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
