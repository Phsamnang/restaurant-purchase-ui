'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AppLayout } from '@/components/app-layout';
import { useAuth } from '@/lib/auth-context';
import { useTranslation } from '@/lib/i18n';
import { Modal } from '@/components/shared/modal';
import { EmptyState } from '@/components/shared/empty-state';
import { 
  TrendingUp, TrendingDown, DollarSign, Plus, Filter, Calendar, 
  ArrowUpRight, ArrowDownRight, Wallet, ShoppingBag, RotateCcw, 
  Home, Users, Wrench, PlusCircle, MinusCircle, CheckCircle2, 
  Trash2, FileText, PieChart, ChevronRight, AlertCircle
} from 'lucide-react';

import { 
  Transaction, TransactionType, INCOME_CATEGORIES, OUTCOME_CATEGORIES, 
  ALL_FINANCE_CATEGORIES, PAYMENT_METHODS, PaymentMethod 
} from '@/types/finance';
import { getTransactions, saveTransaction, deleteTransaction } from '@/lib/transactions';

export default function FinancePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { t, language } = useTranslation();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'income' | 'outcome'>('all');
  const [displayCurrency, setDisplayCurrency] = useState<'USD' | 'KHR'>('USD');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isSalesModalOpen, setIsSalesModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);

  // Form states for New Sales / Income
  const [incomeAmount, setIncomeAmount] = useState('');
  const [incomeCurrency, setIncomeCurrency] = useState<'USD' | 'KHR'>('USD');
  const [incomeCategory, setIncomeCategory] = useState('Daily Sales');
  const [incomeDescription, setIncomeDescription] = useState('');
  const [incomePaymentMethod, setIncomePaymentMethod] = useState<PaymentMethod>('ABA Pay / ធនាគារ ABA');
  const [incomeDate, setIncomeDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Form states for New Expense / Outcome
  const [outcomeAmount, setOutcomeAmount] = useState('');
  const [outcomeCurrency, setOutcomeCurrency] = useState<'USD' | 'KHR'>('USD');
  const [outcomeCategory, setOutcomeCategory] = useState('Rent & Utilities');
  const [outcomeDescription, setOutcomeDescription] = useState('');
  const [outcomePaymentMethod, setOutcomePaymentMethod] = useState<PaymentMethod>('Bank Transfer / ផ្ទេរប្រាក់');
  const [outcomeDate, setOutcomeDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [receiptRef, setReceiptRef] = useState('');

  useEffect(() => {
    if (!user) {
      router.push('/login');
    } else {
      setTransactions(getTransactions());
    }
  }, [user, router]);

  // Calculate live financial summary numbers
  const summary = useMemo(() => {
    const rate = 4000;
    const todayStr = new Date().toISOString().split('T')[0];
    const currentMonthPrefix = todayStr.slice(0, 7); // e.g. "2026-07"

    let todayIncome = 0;
    let todayOutcome = 0;
    let mtdIncome = 0;
    let mtdOutcome = 0;
    let totalIncome = 0;
    let totalOutcome = 0;

    for (const tx of transactions) {
      let val = tx.amount;
      if (tx.currency !== displayCurrency) {
        if (displayCurrency === 'USD') {
          val = tx.amount / rate;
        } else {
          val = tx.amount * rate;
        }
      }

      if (tx.type === 'income') {
        totalIncome += val;
        if (tx.date === todayStr) todayIncome += val;
        if (tx.date.startsWith(currentMonthPrefix)) mtdIncome += val;
      } else {
        totalOutcome += val;
        if (tx.date === todayStr) todayOutcome += val;
        if (tx.date.startsWith(currentMonthPrefix)) mtdOutcome += val;
      }
    }

    return {
      todayIncome,
      todayOutcome,
      todayNet: todayIncome - todayOutcome,
      mtdIncome,
      mtdOutcome,
      mtdNet: mtdIncome - mtdOutcome,
      totalIncome,
      totalOutcome,
      totalNet: totalIncome - totalOutcome,
    };
  }, [transactions, displayCurrency]);

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      if (activeTab !== 'all' && tx.type !== activeTab) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesDesc = tx.description.toLowerCase().includes(q);
        const matchesCat = tx.category.toLowerCase().includes(q);
        const matchesCreator = tx.createdBy.toLowerCase().includes(q);
        return matchesDesc || matchesCat || matchesCreator;
      }
      return true;
    });
  }, [transactions, activeTab, searchQuery]);

  const handleRecordSales = (e: React.FormEvent) => {
    e.preventDefault();
    if (!incomeAmount || isNaN(parseFloat(incomeAmount))) return;

    const newTx: Transaction = {
      id: `TX-${Date.now()}`,
      type: 'income',
      category: incomeCategory,
      amount: parseFloat(incomeAmount),
      currency: incomeCurrency,
      description: incomeDescription || `${incomeCategory} recorded for ${incomeDate}`,
      date: incomeDate,
      createdBy: user?.name || 'Staff Member',
      paymentMethod: incomePaymentMethod,
      createdAt: new Date().toISOString(),
    };

    saveTransaction(newTx);
    setTransactions(getTransactions());
    setIsSalesModalOpen(false);
    setIncomeAmount('');
    setIncomeDescription('');
  };

  const handleRecordExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!outcomeAmount || isNaN(parseFloat(outcomeAmount))) return;

    const newTx: Transaction = {
      id: `TX-${Date.now()}`,
      type: 'outcome',
      category: outcomeCategory,
      amount: parseFloat(outcomeAmount),
      currency: outcomeCurrency,
      description: outcomeDescription || `${outcomeCategory} expense recorded`,
      date: outcomeDate,
      createdBy: user?.name || 'Staff Member',
      paymentMethod: outcomePaymentMethod,
      receiptRef: receiptRef || undefined,
      createdAt: new Date().toISOString(),
    };

    saveTransaction(newTx);
    setTransactions(getTransactions());
    setIsExpenseModalOpen(false);
    setOutcomeAmount('');
    setOutcomeDescription('');
    setReceiptRef('');
  };

  const handleDeleteTransaction = (id: string) => {
    if (confirm(language === 'en' ? 'Are you sure you want to delete this transaction?' : 'តើអ្នកប្រាកដជាចង់លុបប្រតិបត្តិការនេះមែនទេ?')) {
      deleteTransaction(id);
      setTransactions(getTransactions());
    }
  };

  const formatMoney = (val: number) => {
    if (displayCurrency === 'USD') {
      return `$${val.toFixed(2)}`;
    }
    return `${Math.round(val).toLocaleString()} ៛`;
  };

  const getCategoryIcon = (category: string, type: TransactionType) => {
    switch (category) {
      case 'Daily Sales': return <TrendingUp className="w-5 h-5 text-emerald-600" />;
      case 'Customer Deposits': return <Wallet className="w-5 h-5 text-emerald-600" />;
      case 'Supplier Refunds': return <RotateCcw className="w-5 h-5 text-emerald-600" />;
      case 'Purchase Orders': return <ShoppingBag className="w-5 h-5 text-red-600" />;
      case 'Petty Cash & Tips': return <DollarSign className="w-5 h-5 text-amber-600" />;
      case 'Rent & Utilities': return <Home className="w-5 h-5 text-red-600" />;
      case 'Staff Payroll': return <Users className="w-5 h-5 text-red-600" />;
      case 'Maintenance & Repairs': return <Wrench className="w-5 h-5 text-amber-600" />;
      default: return type === 'income' ? <PlusCircle className="w-5 h-5 text-emerald-600" /> : <MinusCircle className="w-5 h-5 text-red-600" />;
    }
  };

  if (!user) return null;

  return (
    <AppLayout 
      title={language === 'en' ? 'Income & Outcome Tracking / គ្រប់គ្រងចំណូល និងចំណាយ' : 'គ្រប់គ្រងចំណូល និងចំណាយ / Income & Outcome Tracking'} 
      subtitle={language === 'en' ? 'Monitor daily sales revenue, purchase expenses, and net cash flow' : 'តាមដានចំណូលលក់ប្រចាំថ្ងៃ ការចំណាយទិញទំនិញ និងលំហូរសាច់ប្រាក់សុទ្ធ'}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-28 space-y-6">
        
        {/* Top Control Bar: Action Buttons & Currency Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-4 rounded-2xl border border-border shadow-2xs">
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setIsSalesModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-sm transition-all active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{language === 'en' ? '+ Record Daily Sales' : '+ កត់ត្រាចំណូលលក់'}</span>
            </button>
            <button
              onClick={() => setIsExpenseModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow-sm transition-all active:scale-95"
            >
              <MinusCircle className="w-4 h-4" />
              <span>{language === 'en' ? '+ Record Expense' : '+ កត់ត្រាចំណាយ'}</span>
            </button>
            <Link
              href="/finance/report"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-secondary hover:bg-slate-200 text-foreground font-bold text-sm border border-border transition-all"
            >
              <PieChart className="w-4 h-4 text-primary" />
              <span>{language === 'en' ? 'Monthly Report' : 'របាយការណ៍ប្រចាំខែ'}</span>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground">{language === 'en' ? 'Currency:' : 'រូបិយប័ណ្ណ:'}</span>
            <div className="bg-secondary p-1 rounded-xl border border-border flex items-center">
              <button
                type="button"
                onClick={() => setDisplayCurrency('USD')}
                className={`px-3 py-1 rounded-lg text-xs font-black transition-all ${
                  displayCurrency === 'USD' ? 'bg-primary text-primary-foreground shadow-2xs' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                $ USD
              </button>
              <button
                type="button"
                onClick={() => setDisplayCurrency('KHR')}
                className={`px-3 py-1 rounded-lg text-xs font-black transition-all ${
                  displayCurrency === 'KHR' ? 'bg-primary text-primary-foreground shadow-2xs' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                ៛ KHR
              </button>
            </div>
          </div>
        </div>

        {/* 4 Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Today's Income Card */}
          <div className="bg-gradient-to-br from-emerald-500/10 via-card to-card border border-emerald-500/20 rounded-2xl p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                {language === 'en' ? "Today's Income" : 'ចំណូលថ្ងៃនេះ'}
              </span>
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <ArrowUpRight className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
              {formatMoney(summary.todayIncome)}
            </div>
            <p className="text-xs text-muted-foreground mt-1.5 font-medium">
              {language === 'en' ? 'Recorded daily sales & receipts' : 'ចំណូលលក់ និងប្រាក់កក់ថ្ងៃនេះ'}
            </p>
          </div>

          {/* Today's Outcome Card */}
          <div className="bg-gradient-to-br from-red-500/10 via-card to-card border border-red-500/20 rounded-2xl p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-red-600">
                {language === 'en' ? "Today's Outcome" : 'ចំណាយថ្ងៃនេះ'}
              </span>
              <div className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center">
                <ArrowDownRight className="w-5 h-5 text-red-600" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
              {formatMoney(summary.todayOutcome)}
            </div>
            <p className="text-xs text-muted-foreground mt-1.5 font-medium">
              {language === 'en' ? 'Completed POs & cash payouts' : 'ចំណាយទិញទំនិញ និងដកប្រាក់'}
            </p>
          </div>

          {/* Today's Net Flow Card */}
          <div className={`bg-gradient-to-br via-card to-card border rounded-2xl p-5 shadow-2xs ${
            summary.todayNet >= 0 ? 'from-blue-500/10 border-blue-500/20' : 'from-amber-500/10 border-amber-500/20'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <span className={`text-xs font-bold uppercase tracking-wider ${summary.todayNet >= 0 ? 'text-blue-600' : 'text-amber-600'}`}>
                {language === 'en' ? "Today's Net Cash" : 'លំហូរសាច់ប្រាក់ថ្ងៃនេះ'}
              </span>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${summary.todayNet >= 0 ? 'bg-blue-500/10 text-blue-600' : 'bg-amber-500/10 text-amber-600'}`}>
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <div className={`text-xl sm:text-2xl font-extrabold tracking-tight ${summary.todayNet >= 0 ? 'text-blue-600' : 'text-amber-600'}`}>
              {summary.todayNet >= 0 ? `+${formatMoney(summary.todayNet)}` : formatMoney(summary.todayNet)}
            </div>
            <p className="text-xs text-muted-foreground mt-1.5 font-medium">
              {language === 'en' ? 'Income minus outcome today' : 'ចំណូលដកចំណាយសរុបថ្ងៃនេះ'}
            </p>
          </div>

          {/* MTD Net Cash Flow Card */}
          <div className="bg-gradient-to-br from-purple-500/10 via-card to-card border border-purple-500/20 rounded-2xl p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-600">
                {language === 'en' ? 'Month-to-Date Net' : 'លំហូរសាច់ប្រាក់ប្រចាំខែ'}
              </span>
              <div className="w-9 h-9 rounded-xl bg-purple-500/10 flex items-center justify-center">
                <PieChart className="w-5 h-5 text-purple-600" />
              </div>
            </div>
            <div className={`text-xl sm:text-2xl font-extrabold tracking-tight ${summary.mtdNet >= 0 ? 'text-purple-600' : 'text-red-600'}`}>
              {summary.mtdNet >= 0 ? `+${formatMoney(summary.mtdNet)}` : formatMoney(summary.mtdNet)}
            </div>
            <p className="text-xs text-muted-foreground mt-1.5 font-medium">
              {language === 'en' ? `MTD Income: ${formatMoney(summary.mtdIncome)}` : `ចំណូលខែនេះ: ${formatMoney(summary.mtdIncome)}`}
            </p>
          </div>

        </div>

        {/* Transactions Section Header & Filter Tabs */}
        <div className="bg-card rounded-2xl border border-border p-5 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-black text-foreground">
                {language === 'en' ? 'Financial Transaction Log' : 'កំណត់ត្រាប្រតិបត្តិការហិរញ្ញវត្ថុ'}
              </h2>
              <p className="text-xs text-muted-foreground font-medium">
                {language === 'en' ? 'Real-time record of all restaurant income and expenditures' : 'បញ្ជីរាយនាមចំណូល និងចំណាយទាំងអស់របស់ភោជនីយដ្ឋាន'}
              </p>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-secondary p-1 rounded-xl border border-border">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'all' ? 'bg-card text-foreground shadow-2xs' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {language === 'en' ? 'All Transactions' : 'ទាំងអស់'} ({transactions.length})
              </button>
              <button
                onClick={() => setActiveTab('income')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'income' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>{language === 'en' ? 'Income' : 'ចំណូល'} ({transactions.filter(t => t.type === 'income').length})</span>
              </button>
              <button
                onClick={() => setActiveTab('outcome')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'outcome' ? 'bg-red-600 text-white shadow-2xs' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <TrendingDown className="w-3.5 h-3.5" />
                <span>{language === 'en' ? 'Outcome' : 'ចំណាយ'} ({transactions.filter(t => t.type === 'outcome').length})</span>
              </button>
            </div>
          </div>

          {/* Search Box */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={language === 'en' ? 'Search by description, category, or staff member...' : 'ស្វែងរកតាមការពិពណ៌នា ប្រភេទ ឬឈ្មោះបុគ្គលិក...'}
              className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:bg-card transition-all"
            />
          </div>

          {/* Transaction List */}
          <div className="divide-y divide-border border-t border-border mt-4 pt-2">
            {filteredTransactions.length === 0 ? (
              <EmptyState 
                title={language === 'en' ? 'No transactions found' : 'មិនមានទិន្នន័យប្រតិបត្តិការទេ'}
                description={language === 'en' ? 'Try adjusting your search query or filter tab, or record a new transaction above.' : 'សូមសាកល្បងស្វែងរកម្តងទៀត ឬកត់ត្រាចំណូល/ចំណាយថ្មីនៅខាងលើ។'}
              />
            ) : (
              filteredTransactions.map((tx) => {
                const isIncome = tx.type === 'income';
                return (
                  <div key={tx.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-secondary/40 px-3 rounded-xl transition-all group">
                    <div className="flex items-start sm:items-center gap-3.5">
                      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border ${
                        isIncome ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20'
                      }`}>
                        {getCategoryIcon(tx.category, tx.type)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm text-foreground">
                            {tx.description}
                          </span>
                          {tx.linkedOrderId && (
                            <Link 
                              href={`/requests/${tx.linkedOrderId}`}
                              className="inline-flex items-center gap-1 text-[11px] font-extrabold bg-primary/20 text-primary-hover dark:text-primary px-2 py-0.5 rounded-full hover:underline"
                            >
                              <span>PO: {tx.linkedOrderId}</span>
                              <ChevronRight className="w-3 h-3" />
                            </Link>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap font-medium">
                          <span className="font-semibold text-foreground/80">{tx.category}</span>
                          <span>•</span>
                          <span>📅 {tx.date}</span>
                          <span>•</span>
                          <span>👤 {tx.createdBy}</span>
                          <span>•</span>
                          <span>💳 {tx.paymentMethod}</span>
                          {tx.receiptRef && (
                            <>
                              <span>•</span>
                              <span className="text-slate-500">📄 Ref: {tx.receiptRef}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0">
                      <div className="text-right">
                        <div className={`text-base sm:text-lg font-black tracking-tight ${
                          isIncome ? 'text-emerald-600' : 'text-red-600'
                        }`}>
                          {isIncome ? '+' : '-'}{tx.currency === 'USD' ? `$${tx.amount.toFixed(2)} USD` : `${tx.amount.toLocaleString()} ៛ KHR`}
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          {tx.currency === 'USD' 
                            ? `(≈ ${(tx.amount * 4000).toLocaleString()} ៛)` 
                            : `(≈ $${(tx.amount / 4000).toFixed(2)})`}
                        </span>
                      </div>

                      <button
                        onClick={() => handleDeleteTransaction(tx.id)}
                        className="p-2 rounded-lg text-muted-foreground hover:text-red-600 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
                        title={language === 'en' ? 'Delete Transaction' : 'លុបប្រតិបត្តិការ'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* MODAL 1: Record Daily Sales / Income */}
      <Modal
        isOpen={isSalesModalOpen}
        onClose={() => setIsSalesModalOpen(false)}
        title={language === 'en' ? 'Record Daily Sales & Income' : 'កត់ត្រាចំណូលលក់ប្រចាំថ្ងៃ'}
      >
        <form onSubmit={handleRecordSales} className="space-y-4 p-1">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
              {language === 'en' ? 'Income Category' : 'ប្រភេទចំណូល'}
            </label>
            <select
              value={incomeCategory}
              onChange={(e) => setIncomeCategory(e.target.value)}
              className="w-full bg-secondary border border-border rounded-xl px-3.5 py-2.5 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {INCOME_CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {language === 'en' ? c.nameEn : c.nameKh}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                {language === 'en' ? 'Amount' : 'ចំនួនប្រាក់'} <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="any"
                required
                value={incomeAmount}
                onChange={(e) => setIncomeAmount(e.target.value)}
                placeholder="e.g. 1420.00"
                className="w-full bg-secondary border border-border rounded-xl px-3.5 py-2.5 text-base font-black text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                {language === 'en' ? 'Currency' : 'រូបិយប័ណ្ណ'}
              </label>
              <div className="bg-secondary p-1 rounded-xl border border-border flex items-center h-[42px]">
                <button
                  type="button"
                  onClick={() => setIncomeCurrency('USD')}
                  className={`flex-1 py-1 rounded-lg text-xs font-black transition-all ${
                    incomeCurrency === 'USD' ? 'bg-primary text-primary-foreground shadow-2xs' : 'text-muted-foreground'
                  }`}
                >
                  $ USD
                </button>
                <button
                  type="button"
                  onClick={() => setIncomeCurrency('KHR')}
                  className={`flex-1 py-1 rounded-lg text-xs font-black transition-all ${
                    incomeCurrency === 'KHR' ? 'bg-primary text-primary-foreground shadow-2xs' : 'text-muted-foreground'
                  }`}
                >
                  ៛ KHR
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                {language === 'en' ? 'Date' : 'កាលបរិច្ឆេទ'}
              </label>
              <input
                type="date"
                required
                value={incomeDate}
                onChange={(e) => setIncomeDate(e.target.value)}
                className="w-full bg-secondary border border-border rounded-xl px-3.5 py-2.5 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                {language === 'en' ? 'Payment Method' : 'វិធីសាស្ត្រទទួលប្រាក់'}
              </label>
              <select
                value={incomePaymentMethod}
                onChange={(e) => setIncomePaymentMethod(e.target.value as PaymentMethod)}
                className="w-full bg-secondary border border-border rounded-xl px-3.5 py-2.5 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
              {language === 'en' ? 'Description & Notes' : 'ការពិពណ៌នា និងចំណាំ'}
            </label>
            <textarea
              rows={3}
              value={incomeDescription}
              onChange={(e) => setIncomeDescription(e.target.value)}
              placeholder={language === 'en' ? 'e.g. Dinner shift total sales receipts from register #1' : 'ឧ. ចំណូលលក់ពេលល្ងាចពីបេឡាលេខ ១'}
              className="w-full bg-secondary border border-border rounded-xl p-3 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsSalesModalOpen(false)}
              className="px-4 py-2.5 rounded-xl font-bold text-sm bg-secondary hover:bg-slate-200 text-foreground transition-all"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl font-bold text-sm bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all"
            >
              {language === 'en' ? 'Save Income Record' : 'រក្សាទុកចំណូល'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: Record Expense / Outcome */}
      <Modal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        title={language === 'en' ? 'Record Operational Expense' : 'កត់ត្រាចំណាយប្រតិបត្តិការ'}
      >
        <form onSubmit={handleRecordExpense} className="space-y-4 p-1">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
              {language === 'en' ? 'Expense Category' : 'ប្រភេទចំណាយ'}
            </label>
            <select
              value={outcomeCategory}
              onChange={(e) => setOutcomeCategory(e.target.value)}
              className="w-full bg-secondary border border-border rounded-xl px-3.5 py-2.5 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {OUTCOME_CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {language === 'en' ? c.nameEn : c.nameKh}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                {language === 'en' ? 'Amount' : 'ចំនួនប្រាក់'} <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="any"
                required
                value={outcomeAmount}
                onChange={(e) => setOutcomeAmount(e.target.value)}
                placeholder="e.g. 450.00"
                className="w-full bg-secondary border border-border rounded-xl px-3.5 py-2.5 text-base font-black text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                {language === 'en' ? 'Currency' : 'រូបិយប័ណ្ណ'}
              </label>
              <div className="bg-secondary p-1 rounded-xl border border-border flex items-center h-[42px]">
                <button
                  type="button"
                  onClick={() => setOutcomeCurrency('USD')}
                  className={`flex-1 py-1 rounded-lg text-xs font-black transition-all ${
                    outcomeCurrency === 'USD' ? 'bg-primary text-primary-foreground shadow-2xs' : 'text-muted-foreground'
                  }`}
                >
                  $ USD
                </button>
                <button
                  type="button"
                  onClick={() => setOutcomeCurrency('KHR')}
                  className={`flex-1 py-1 rounded-lg text-xs font-black transition-all ${
                    outcomeCurrency === 'KHR' ? 'bg-primary text-primary-foreground shadow-2xs' : 'text-muted-foreground'
                  }`}
                >
                  ៛ KHR
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                {language === 'en' ? 'Date' : 'កាលបរិច្ឆេទ'}
              </label>
              <input
                type="date"
                required
                value={outcomeDate}
                onChange={(e) => setOutcomeDate(e.target.value)}
                className="w-full bg-secondary border border-border rounded-xl px-3.5 py-2.5 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                {language === 'en' ? 'Payment Method' : 'វិធីសាស្ត្របង់ប្រាក់'}
              </label>
              <select
                value={outcomePaymentMethod}
                onChange={(e) => setOutcomePaymentMethod(e.target.value as PaymentMethod)}
                className="w-full bg-secondary border border-border rounded-xl px-3.5 py-2.5 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
              {language === 'en' ? 'Receipt / Bill Ref Number' : 'លេខវិក្កយបត្រ ឬឯកសារយោង'}
            </label>
            <input
              type="text"
              value={receiptRef}
              onChange={(e) => setReceiptRef(e.target.value)}
              placeholder="e.g. INV-98421"
              className="w-full bg-secondary border border-border rounded-xl px-3.5 py-2.5 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
              {language === 'en' ? 'Description & Notes' : 'ការពិពណ៌នា និងចំណាំ'}
            </label>
            <textarea
              rows={3}
              value={outcomeDescription}
              onChange={(e) => setOutcomeDescription(e.target.value)}
              placeholder={language === 'en' ? 'e.g. Monthly electricity utility bill payment for July' : 'ឧ. បង់ថ្លៃអគ្គិសនីប្រចាំខែកក្កដា'}
              className="w-full bg-secondary border border-border rounded-xl p-3 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsExpenseModalOpen(false)}
              className="px-4 py-2.5 rounded-xl font-bold text-sm bg-secondary hover:bg-slate-200 text-foreground transition-all"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl font-bold text-sm bg-red-600 hover:bg-red-700 text-white shadow-sm transition-all"
            >
              {language === 'en' ? 'Save Expense Record' : 'រក្សាទុកចំណាយ'}
            </button>
          </div>
        </form>
      </Modal>

    </AppLayout>
  );
}
