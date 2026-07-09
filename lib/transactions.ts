'use client';

import { Transaction, DailySummary, TransactionType } from '@/types/finance';
import { OrderRequest } from '@/lib/orders';

const STORAGE_KEY = 'restaurant_transactions_v1_erp';

const DEFAULT_TRANSACTIONS: Transaction[] = [
  {
    id: 'TX-2026-001',
    type: 'income',
    category: 'Daily Sales',
    amount: 1420.00,
    currency: 'USD',
    description: 'Dinner shift total sales (Malis Main Dining Room)',
    date: '2026-07-08',
    createdBy: 'Manager Dara (អ្នកគ្រប់គ្រង តារា)',
    paymentMethod: 'ABA Pay / ធនាគារ ABA',
    createdAt: '2026-07-08T22:15:00.000Z',
  },
  {
    id: 'TX-2026-002',
    type: 'income',
    category: 'Daily Sales',
    amount: 3850000,
    currency: 'KHR',
    description: 'Lunch shift cash register receipts',
    date: '2026-07-08',
    createdBy: 'Manager Dara (អ្នកគ្រប់គ្រង តារា)',
    paymentMethod: 'Cash / សាច់ប្រាក់',
    createdAt: '2026-07-08T14:30:00.000Z',
  },
  {
    id: 'TX-2026-003',
    type: 'outcome',
    category: 'Purchase Orders',
    amount: 320.00,
    currency: 'USD',
    description: 'Beef Tenderloin & Whole Chicken purchase (ORD-2026-004)',
    date: '2026-07-03',
    createdBy: 'Chef Sophea (ចុងភៅ សុភា)',
    linkedOrderId: 'ORD-2026-004',
    paymentMethod: 'Bank Transfer / ផ្ទេរប្រាក់',
    createdAt: '2026-07-03T09:00:00.000Z',
  },
  {
    id: 'TX-2026-004',
    type: 'outcome',
    category: 'Petty Cash & Tips',
    amount: 50.00,
    currency: 'USD',
    description: 'Kitchen staff tip advance payout',
    date: '2026-07-06',
    createdBy: 'Chef Sophea (ចុងភៅ សុភា)',
    paymentMethod: 'Cash / សាច់ប្រាក់',
    createdAt: '2026-07-06T16:00:00.000Z',
  },
  {
    id: 'TX-2026-005',
    type: 'income',
    category: 'Customer Deposits',
    amount: 500.00,
    currency: 'USD',
    description: 'VIP Private Dining Room prepayment deposit for Saturday event',
    date: '2026-07-07',
    createdBy: 'Manager Dara (អ្នកគ្រប់គ្រង តារា)',
    paymentMethod: 'ABA Pay / ធនាគារ ABA',
    createdAt: '2026-07-07T11:20:00.000Z',
  },
  {
    id: 'TX-2026-006',
    type: 'outcome',
    category: 'Rent & Utilities',
    amount: 450.00,
    currency: 'USD',
    description: 'Monthly commercial electricity utility bill payment',
    date: '2026-07-05',
    createdBy: 'Manager Dara (អ្នកគ្រប់គ្រង តារា)',
    paymentMethod: 'Bank Transfer / ផ្ទេរប្រាក់',
    createdAt: '2026-07-05T10:00:00.000Z',
  },
];

export function getTransactions(): Transaction[] {
  if (typeof window === 'undefined') return DEFAULT_TRANSACTIONS;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_TRANSACTIONS));
      return DEFAULT_TRANSACTIONS;
    }
    return JSON.parse(stored);
  } catch (err) {
    console.error('Error reading transactions from localStorage:', err);
    return DEFAULT_TRANSACTIONS;
  }
}

export function getTransactionById(id: string): Transaction | undefined {
  const transactions = getTransactions();
  return transactions.find((t) => t.id === id);
}

export function saveTransaction(newTx: Transaction): void {
  if (typeof window === 'undefined') return;
  try {
    const transactions = getTransactions();
    const existingIdx = transactions.findIndex((t) => t.id === newTx.id);
    if (existingIdx !== -1) {
      transactions[existingIdx] = newTx;
    } else {
      transactions.unshift(newTx);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
  } catch (err) {
    console.error('Error saving transaction to localStorage:', err);
  }
}

export function deleteTransaction(id: string): void {
  if (typeof window === 'undefined') return;
  try {
    const transactions = getTransactions();
    const updated = transactions.filter((t) => t.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Error deleting transaction from localStorage:', err);
  }
}

export function autoLinkOrderToOutcome(order: OrderRequest): Transaction | null {
  if (order.status !== 'completed' || typeof window === 'undefined') return null;

  try {
    const transactions = getTransactions();
    const existing = transactions.find((t) => t.linkedOrderId === order.id);

    // Parse numeric amount from order.total string (e.g. "$158.00" -> 158, or "738,000 ៛" -> 738000)
    const cleanedStr = order.total.replace(/[$,៛\s]/g, '');
    const numericAmount = parseFloat(cleanedStr) || 0;
    const isKHR = order.currency === 'KHR' || order.total.includes('៛');

    const tx: Transaction = {
      id: existing?.id || `TX-PO-${order.id}`,
      type: 'outcome',
      category: 'Purchase Orders',
      amount: numericAmount,
      currency: isKHR ? 'KHR' : 'USD',
      description: `Auto-linked market order ${order.id}: ${order.notes ? order.notes.slice(0, 80) : `${order.items.length} items received`}`,
      date: order.date || new Date().toISOString().split('T')[0],
      createdBy: order.createdBy || 'Kitchen Staff',
      linkedOrderId: order.id,
      paymentMethod: 'Bank Transfer / ផ្ទេរប្រាក់',
      receiptRef: order.id,
      createdAt: existing?.createdAt || new Date().toISOString(),
    };

    saveTransaction(tx);
    return tx;
  } catch (err) {
    console.error('Error auto-linking order to outcome:', err);
    return null;
  }
}

export function getFinancialSummary(transactions: Transaction[], targetCurrency: 'KHR' | 'USD' = 'USD') {
  const rate = 4000;
  let totalIncome = 0;
  let totalOutcome = 0;

  for (const tx of transactions) {
    let amountInTarget = tx.amount;
    if (tx.currency !== targetCurrency) {
      if (targetCurrency === 'USD') {
        amountInTarget = tx.amount / rate;
      } else {
        amountInTarget = tx.amount * rate;
      }
    }

    if (tx.type === 'income') {
      totalIncome += amountInTarget;
    } else {
      totalOutcome += amountInTarget;
    }
  }

  return {
    totalIncome,
    totalOutcome,
    netFlow: totalIncome - totalOutcome,
  };
}

export function getDailySummaries(transactions: Transaction[]): DailySummary[] {
  const map: Record<string, DailySummary> = {};

  for (const tx of transactions) {
    const d = tx.date || 'Unknown Date';
    if (!map[d]) {
      map[d] = {
        date: d,
        totalIncomeKHR: 0,
        totalIncomeUSD: 0,
        totalOutcomeKHR: 0,
        totalOutcomeUSD: 0,
        netFlowKHR: 0,
        netFlowUSD: 0,
        transactions: [],
      };
    }

    map[d].transactions.push(tx);

    if (tx.type === 'income') {
      if (tx.currency === 'KHR') {
        map[d].totalIncomeKHR += tx.amount;
      } else {
        map[d].totalIncomeUSD += tx.amount;
      }
    } else {
      if (tx.currency === 'KHR') {
        map[d].totalOutcomeKHR += tx.amount;
      } else {
        map[d].totalOutcomeUSD += tx.amount;
      }
    }
  }

  const summaries = Object.values(map);
  for (const s of summaries) {
    s.netFlowKHR = s.totalIncomeKHR - s.totalOutcomeKHR;
    s.netFlowUSD = s.totalIncomeUSD - s.totalOutcomeUSD;
    // Sort transactions within each day newest first
    s.transactions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // Sort daily summaries newest date first
  return summaries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function resetTransactionsToDefault(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_TRANSACTIONS));
  } catch (err) {
    console.error('Error resetting transactions:', err);
  }
}
