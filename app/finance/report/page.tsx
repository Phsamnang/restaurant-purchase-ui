'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AppLayout } from '@/components/app-layout';
import { useAuth } from '@/lib/auth-context';
import { useTranslation } from '@/lib/i18n';
import { 
  ArrowLeft, Printer, Download, Calendar, PieChart, TrendingUp, 
  TrendingDown, DollarSign, ArrowUpRight, ArrowDownRight
} from 'lucide-react';

import { Transaction, INCOME_CATEGORIES, OUTCOME_CATEGORIES } from '@/types/finance';
import { getTransactions } from '@/lib/transactions';

export default function FinanceReportPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { language } = useTranslation();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [displayCurrency, setDisplayCurrency] = useState<'USD' | 'KHR'>('USD');

  useEffect(() => {
    if (!user) {
      router.push('/login');
    } else {
      setTransactions(getTransactions());
    }
  }, [user, router]);

  const monthTransactions = useMemo(() => {
    return transactions.filter((t) => t.date.startsWith(selectedMonth));
  }, [transactions, selectedMonth]);

  const reportData = useMemo(() => {
    const rate = 4000;
    let totalIncome = 0;
    let totalOutcome = 0;
    const incomeByCategory: Record<string, number> = {};
    const outcomeByCategory: Record<string, number> = {};

    for (const tx of monthTransactions) {
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
        incomeByCategory[tx.category] = (incomeByCategory[tx.category] || 0) + val;
      } else {
        totalOutcome += val;
        outcomeByCategory[tx.category] = (outcomeByCategory[tx.category] || 0) + val;
      }
    }

    return {
      totalIncome,
      totalOutcome,
      netFlow: totalIncome - totalOutcome,
      incomeByCategory,
      outcomeByCategory,
    };
  }, [monthTransactions, displayCurrency]);

  const formatMoney = (val: number) => {
    if (displayCurrency === 'USD') {
      return `$${val.toFixed(2)}`;
    }
    return `${Math.round(val).toLocaleString()} ៛`;
  };

  const handlePrint = () => {
    window.print();
  };

  if (!user) return null;

  return (
    <AppLayout 
      title={language === 'en' ? 'Monthly Financial Report / របាយការណ៍ហិរញ្ញវត្ថុប្រចាំខែ' : 'របាយការណ៍ហិរញ្ញវត្ថុប្រចាំខែ / Monthly Financial Report'}
      subtitle={language === 'en' ? 'Detailed breakdown of restaurant revenue, supplier purchases, and operating costs' : 'ការវិភាគលម្អិតអំពីចំណូលភោជនីយដ្ឋាន ការទិញទំនិញ និងចំណាយប្រតិបត្តិការ'}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-28 space-y-6">
        
        {/* Navigation & Controls Header (Hidden in Print) */}
        <div className="print:hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-4 rounded-2xl border border-border shadow-2xs">
          <div className="flex items-center gap-3">
            <Link
              href="/finance"
              className="p-2 rounded-xl bg-secondary hover:bg-slate-200 text-foreground transition-all flex items-center gap-1.5 font-bold text-xs"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{language === 'en' ? 'Back to Dashboard' : 'ត្រឡប់ថយក្រោយ'}</span>
            </Link>

            <div className="flex items-center gap-2 bg-secondary px-3 py-1.5 rounded-xl border border-border">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-transparent text-sm font-black text-foreground focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
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

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-extrabold text-xs shadow-sm hover:bg-primary-hover hover:text-white transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>{language === 'en' ? 'Print Report' : 'បោះពុម្ពរបាយការណ៍'}</span>
            </button>
          </div>
        </div>

        {/* Printable Report Box */}
        <div className="bg-card rounded-2xl border border-border p-6 sm:p-8 shadow-2xs space-y-8 print:border-none print:shadow-none print:p-0">
          
          {/* Header Title */}
          <div className="border-b border-border pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
                {language === 'en' ? 'Monthly Financial Overview' : 'របាយការណ៍ហិរញ្ញវត្ថុប្រចាំខែ'}
              </h1>
              <p className="text-sm font-semibold text-muted-foreground mt-1">
                {language === 'en' ? `Report Period: ${selectedMonth}` : `សម្រាប់ខែ: ${selectedMonth}`}
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground block">
                {language === 'en' ? 'Generated By' : 'បង្កើតដោយ'}
              </span>
              <span className="text-sm font-black text-foreground">{user.name}</span>
            </div>
          </div>

          {/* 3 Summary KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-5">
              <div className="flex items-center justify-between text-emerald-600 font-bold text-xs uppercase tracking-wider mb-2">
                <span>{language === 'en' ? 'Total Income' : 'ចំណូលសរុប'}</span>
                <ArrowUpRight className="w-4 h-4" />
              </div>
              <div className="text-xl sm:text-2xl font-extrabold text-emerald-600">
                {formatMoney(reportData.totalIncome)}
              </div>
            </div>

            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-5">
              <div className="flex items-center justify-between text-red-600 font-bold text-xs uppercase tracking-wider mb-2">
                <span>{language === 'en' ? 'Total Outcome' : 'ចំណាយសរុប'}</span>
                <ArrowDownRight className="w-4 h-4" />
              </div>
              <div className="text-xl sm:text-2xl font-extrabold text-red-600">
                {formatMoney(reportData.totalOutcome)}
              </div>
            </div>

            <div className={`border rounded-2xl p-5 ${
              reportData.netFlow >= 0 ? 'bg-blue-500/10 border-blue-500/20 text-blue-600' : 'bg-amber-500/10 border-amber-500/20 text-amber-600'
            }`}>
              <div className="flex items-center justify-between font-bold text-xs uppercase tracking-wider mb-2">
                <span>{language === 'en' ? 'Net Cash Flow' : 'លំហូរសាច់ប្រាក់សុទ្ធ'}</span>
                <DollarSign className="w-4 h-4" />
              </div>
              <div className="text-xl sm:text-2xl font-extrabold">
                {reportData.netFlow >= 0 ? `+${formatMoney(reportData.netFlow)}` : formatMoney(reportData.netFlow)}
              </div>
            </div>
          </div>

          {/* Category Breakdown Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4">
            
            {/* Income Breakdown */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-border pb-2">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
                <h3 className="text-lg font-black text-foreground">
                  {language === 'en' ? 'Revenue & Income Breakdown' : 'ការវិភាគចំណូលតាមប្រភេទ'}
                </h3>
              </div>

              <div className="space-y-3">
                {INCOME_CATEGORIES.map((cat) => {
                  const amount = reportData.incomeByCategory[cat.id] || 0;
                  const percentage = reportData.totalIncome > 0 ? (amount / reportData.totalIncome) * 100 : 0;
                  return (
                    <div key={cat.id} className="bg-secondary/50 rounded-xl p-3.5 border border-border/60">
                      <div className="flex items-center justify-between text-sm font-bold mb-1.5">
                        <span className="text-foreground">{cat.name}</span>
                        <span className="text-emerald-600">{formatMoney(amount)} ({percentage.toFixed(0)}%)</span>
                      </div>
                      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
                          style={{ width: `${Math.min(100, percentage)}%` }} 
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Outcome Breakdown */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-border pb-2">
                <TrendingDown className="w-5 h-5 text-red-600" />
                <h3 className="text-lg font-black text-foreground">
                  {language === 'en' ? 'Expenditure Breakdown' : 'ការវិភាគចំណាយតាមប្រភេទ'}
                </h3>
              </div>

              <div className="space-y-3">
                {OUTCOME_CATEGORIES.map((cat) => {
                  const amount = reportData.outcomeByCategory[cat.id] || 0;
                  const percentage = reportData.totalOutcome > 0 ? (amount / reportData.totalOutcome) * 100 : 0;
                  return (
                    <div key={cat.id} className="bg-secondary/50 rounded-xl p-3.5 border border-border/60">
                      <div className="flex items-center justify-between text-sm font-bold mb-1.5">
                        <span className="text-foreground">{cat.name}</span>
                        <span className="text-red-600">{formatMoney(amount)} ({percentage.toFixed(0)}%)</span>
                      </div>
                      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-red-500 rounded-full transition-all duration-500" 
                          style={{ width: `${Math.min(100, percentage)}%` }} 
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Detailed Transaction Table for Print / Audit */}
          <div className="pt-6 border-t border-border space-y-4">
            <h3 className="text-base font-black text-foreground">
              {language === 'en' ? `All Transactions (${selectedMonth})` : `ប្រតិបត្តិការទាំងអស់ (${selectedMonth})`}
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/80 font-bold text-muted-foreground text-xs uppercase">
                    <th className="py-3 px-4">{language === 'en' ? 'Date' : 'កាលបរិច្ឆេទ'}</th>
                    <th className="py-3 px-4">{language === 'en' ? 'Type' : 'ប្រភេទ'}</th>
                    <th className="py-3 px-4">{language === 'en' ? 'Category' : 'ចំណាត់ថ្នាក់'}</th>
                    <th className="py-3 px-4">{language === 'en' ? 'Description' : 'ការពិពណ៌នា'}</th>
                    <th className="py-3 px-4">{language === 'en' ? 'Method' : 'វិធីសាស្ត្រ'}</th>
                    <th className="py-3 px-4 text-right">{language === 'en' ? 'Amount' : 'ចំនួន'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {monthTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-muted-foreground font-medium">
                        {language === 'en' ? 'No transactions recorded for this month.' : 'មិនមានទិន្នន័យសម្រាប់ខែនេះទេ។'}
                      </td>
                    </tr>
                  ) : (
                    monthTransactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-secondary/40 font-medium">
                        <td className="py-3 px-4 whitespace-nowrap">{tx.date}</td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                            tx.type === 'income' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'
                          }`}>
                            {tx.type === 'income' ? (language === 'en' ? 'Income' : 'ចំណូល') : (language === 'en' ? 'Outcome' : 'ចំណាយ')}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-bold text-foreground">{tx.category}</td>
                        <td className="py-3 px-4 text-muted-foreground">{tx.description}</td>
                        <td className="py-3 px-4 text-xs">{tx.paymentMethod}</td>
                        <td className={`py-3 px-4 text-right font-black whitespace-nowrap ${
                          tx.type === 'income' ? 'text-emerald-600' : 'text-red-600'
                        }`}>
                          {tx.type === 'income' ? '+' : '-'}{tx.currency === 'USD' ? `$${tx.amount.toFixed(2)} USD` : `${tx.amount.toLocaleString()} ៛ KHR`}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

      </div>
    </AppLayout>
  );
}
