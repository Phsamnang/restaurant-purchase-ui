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
  nameEn: string;
  nameKh: string;
  iconName: string;
  type: TransactionType;
}

export const INCOME_CATEGORIES: FinanceCategoryItem[] = [
  { id: 'Daily Sales', nameEn: 'Daily Sales & Revenue', nameKh: 'ចំណូលលក់ប្រចាំថ្ងៃ', iconName: 'TrendingUp', type: 'income' },
  { id: 'Customer Deposits', nameEn: 'Customer Deposits & Events', nameKh: 'ប្រាក់កក់ និងកម្មវិធីពិសេស', iconName: 'Wallet', type: 'income' },
  { id: 'Supplier Refunds', nameEn: 'Supplier Refunds & Rebates', nameKh: 'ប្រាក់បង្វិលពីក្រុមហ៊ុនផ្គត់ផ្គង់', iconName: 'RotateCcw', type: 'income' },
  { id: 'Other Income', nameEn: 'Other Miscellaneous Income', nameKh: 'ចំណូលផ្សេងៗ', iconName: 'PlusCircle', type: 'income' },
];

export const OUTCOME_CATEGORIES: FinanceCategoryItem[] = [
  { id: 'Purchase Orders', nameEn: 'Purchase Orders (Market List)', nameKh: 'ការបញ្ជាទិញទំនិញទីផ្សារ', iconName: 'ShoppingBag', type: 'outcome' },
  { id: 'Petty Cash & Tips', nameEn: 'Petty Cash & Tip Advance Payouts', nameKh: 'សាច់ប្រាក់បម្រុង និងដកប្រាក់ Tip', iconName: 'DollarSign', type: 'outcome' },
  { id: 'Rent & Utilities', nameEn: 'Rent, Electricity & Water', nameKh: 'ឈ្នួលផ្ទះ ភ្លើង និងទឹក', iconName: 'Home', type: 'outcome' },
  { id: 'Staff Payroll', nameEn: 'Staff Salary & Wages', nameKh: 'ប្រាក់ខែ និងប្រាក់ឈ្នួលបុគ្គលិក', iconName: 'Users', type: 'outcome' },
  { id: 'Maintenance & Repairs', nameEn: 'Kitchen Equipment Maintenance & Repairs', nameKh: 'ជួសជុល និងថែទាំសម្ភារៈផ្ទះបាយ', iconName: 'Wrench', type: 'outcome' },
  { id: 'Other Expenses', nameEn: 'Other Operational Expenses', nameKh: 'ចំណាយប្រតិបត្តិការផ្សេងៗ', iconName: 'MinusCircle', type: 'outcome' },
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
