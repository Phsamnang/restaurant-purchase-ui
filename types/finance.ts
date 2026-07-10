export type TransactionType = 'income' | 'outcome';

export type PaymentMethod = 'Cash / សាច់ប្រាក់' | 'ABA Pay / ធនាគារ ABA' | 'Wing / វីង' | 'Bank Transfer / ផ្ទេរប្រាក់' | 'Credit / ជំពាក់';

export interface Transaction {
  id: string;
  type: TransactionType;
  category: string;
  amount: number;
  currency: 'KHR' | 'USD';
  description: string;
  date: string;               // YYYY-MM-DD format
  createdBy: string;
  linkedOrderId?: string;     // Links outcome back to a purchase order
  paymentMethod: PaymentMethod | string;
  receiptRef?: string;        // Receipt number or invoice ID
  createdAt: string;          // ISO timestamp
}

export interface DailySummary {
  date: string;
  totalIncomeKHR: number;
  totalIncomeUSD: number;
  totalOutcomeKHR: number;
  totalOutcomeUSD: number;
  netFlowKHR: number;
  netFlowUSD: number;
  transactions: Transaction[];
}

export interface BudgetLimit {
  category: string;
  monthlyLimit: number;
  currency: 'KHR' | 'USD';
  currentSpent: number;
}

export interface FinanceCategoryItem {
  id: string;
  name: string;
  iconName: string;
  type: TransactionType;
}

export const INCOME_CATEGORIES: FinanceCategoryItem[] = [
  { id: 'Daily Sales', name: 'Daily Sales & Revenue', iconName: 'TrendingUp', type: 'income' },
  { id: 'Customer Deposits', name: 'Customer Deposits & Events', iconName: 'Wallet', type: 'income' },
  { id: 'Supplier Refunds', name: 'Supplier Refunds & Rebates', iconName: 'RotateCcw', type: 'income' },
  { id: 'Other Income', name: 'Other Miscellaneous Income', iconName: 'PlusCircle', type: 'income' },
];

export const OUTCOME_CATEGORIES: FinanceCategoryItem[] = [
  { id: 'Purchase Orders', name: 'Purchase Orders (Market List)', iconName: 'ShoppingBag', type: 'outcome' },
  { id: 'Petty Cash & Tips', name: 'Petty Cash & Tip Advance Payouts', iconName: 'DollarSign', type: 'outcome' },
  { id: 'Rent & Utilities', name: 'Rent, Electricity & Water', iconName: 'Home', type: 'outcome' },
  { id: 'Staff Payroll', name: 'Staff Salary & Wages', iconName: 'Users', type: 'outcome' },
  { id: 'Maintenance & Repairs', name: 'Kitchen Equipment Maintenance & Repairs', iconName: 'Wrench', type: 'outcome' },
  { id: 'Other Expenses', name: 'Other Operational Expenses', iconName: 'MinusCircle', type: 'outcome' },
];

export const ALL_FINANCE_CATEGORIES: FinanceCategoryItem[] = [
  ...INCOME_CATEGORIES,
  ...OUTCOME_CATEGORIES,
];

export const PAYMENT_METHODS: PaymentMethod[] = [
  'Cash / សាច់ប្រាក់',
  'ABA Pay / ធនាគារ ABA',
  'Wing / វីង',
  'Bank Transfer / ផ្ទេរប្រាក់',
  'Credit / ជំពាក់'
];
