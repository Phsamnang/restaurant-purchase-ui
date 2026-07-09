'use client';

import { autoLinkOrderToOutcome } from '@/lib/transactions';

export type OrderStatus = 'pending' | 'approved' | 'sent' | 'discrepancy' | 'completed' | 'rejected';

export interface OrderItemDetail {
  id: string;
  nameEn: string;
  nameKh: string;
  unit: string;
  ordered: number;
  received?: number;
  actualPrice?: number;
  actualPriceCurrency?: 'USD' | 'KHR';
  discrepancyReason?: string;
  icon?: string;
  category?: string;
  estimatedPrice?: number;
  supplierNotes?: string;
  packingStatus?: 'packed' | 'pending' | 'flagged';
}

export interface OrderRequest {
  id: string;
  status: OrderStatus;
  date: string;
  total: string;
  currency?: 'KHR' | 'USD';
  items: OrderItemDetail[];
  createdBy: string;
  approvedBy?: string;
  notes?: string;
  requestType?: 'glossary' | 'stuff' | 'mixed';
  requesterRole?: 'manager' | 'staff' | 'service';
  requestedFrom?: 'manager' | 'purchaser' | 'accounting' | string;
}

const STORAGE_KEY = 'restaurant_orders_v2_erp';

const DEFAULT_ORDERS: OrderRequest[] = [
  {
    id: 'ORD-2026-005',
    status: 'pending',
    date: '2026-07-09',
    total: '$158.00',
    currency: 'USD',
    requestType: 'stuff',
    requesterRole: 'service',
    requestedFrom: 'manager',
    createdBy: 'Sophea Bar [🍸 Service & FOH]',
    notes: 'Urgent Glassware replacement for VIP room & weekly Staff Tip Advance payout request',
    items: [
      { id: 'wine-glass-red', nameEn: 'Red Wine Glass 450ml', nameKh: 'កែវស្រាក្រហមប្រណិត', unit: 'piece', ordered: 12, icon: 'GlassWater', category: 'Glassware & Tableware', estimatedPrice: 4.50, supplierNotes: 'Fragile - handle with care, crystal clear stem', packingStatus: 'pending' },
      { id: 'highball-glass', nameEn: 'Highball Drinking Glass 350ml', nameKh: 'កែវទឹកក្រឡុក / ទឹកសុទ្ធ', unit: 'piece', ordered: 30, icon: 'GlassWater', category: 'Glassware & Tableware', estimatedPrice: 1.80, supplierNotes: 'Commercial thick glass', packingStatus: 'pending' },
      { id: 'tip-payout-advance', nameEn: 'Staff Tip Advance Payout', nameKh: 'ដកប្រាក់រង្វាន់ Tip មុនកាលកំណត់', unit: 'USD', ordered: 1, icon: 'DollarSign', category: 'Petty Cash & Tip Advance', estimatedPrice: 50.00, supplierNotes: 'Ask for getting money tip advance for kitchen closing shift', packingStatus: 'pending' },
    ],
  },
  {
    id: 'ORD-2026-001',
    status: 'pending',
    date: '2026-07-06',
    total: '738,000 ៛',
    currency: 'KHR',
    requestType: 'glossary',
    requesterRole: 'staff',
    createdBy: 'Chef Sophea [🍳 Kitchen Staff]',
    items: [
      { id: 'pork-belly', nameEn: 'Pork Belly', nameKh: 'សាច់ជ្រូកបីជាន់', unit: 'kg', ordered: 5, icon: 'Beef', category: 'Meat & Poultry', estimatedPrice: 7.50, supplierNotes: 'Fresh morning cut, 50/50 fat ratio', packingStatus: 'pending' },
      { id: 'lemongrass', nameEn: 'Lemongrass', nameKh: 'ស្លឹកគ្រៃ', unit: 'bundle (ដុំ/បាច់)', ordered: 3, icon: 'Leaf', category: 'Vegetables & Herbs', estimatedPrice: 2.00, supplierNotes: 'Trim bottom stems', packingStatus: 'pending' },
      { id: 'fish-sauce', nameEn: 'Fish Sauce', nameKh: 'ទឹកត្រី', unit: 'bottle (ដប)', ordered: 10, icon: 'Droplets', category: 'Sauces & Condiments', estimatedPrice: 1.80, supplierNotes: 'Premium Squid Brand or equivalent', packingStatus: 'pending' },
      { id: 'jasmine-rice', nameEn: 'Jasmine Rice (25kg)', nameKh: 'អង្ករម្លិះ', unit: 'sack (បាវ)', ordered: 2, icon: 'Wheat', category: 'Dry Goods & Rice', estimatedPrice: 32.00, supplierNotes: 'New crop fragrance rice', packingStatus: 'pending' },
    ],
  },
  {
    id: 'ORD-2026-002',
    status: 'approved',
    date: '2026-07-05',
    total: '$245.00',
    currency: 'USD',
    requestType: 'glossary',
    createdBy: 'Chef Sophea (ចុងភៅ សុភា)',
    approvedBy: 'Manager Dara (អ្នកគ្រប់គ្រង តារា)',
    items: [
      { id: 'river-fish', nameEn: 'River Fish (Trey Riel)', nameKh: 'ត្រីរៀល/ត្រីស្រស់', unit: 'kg', ordered: 15, icon: 'Fish', category: 'Seafood', estimatedPrice: 6.00, supplierNotes: 'Must be live/fresh from Mekong', packingStatus: 'packed' },
      { id: 'shrimp', nameEn: 'Shrimp / Prawns', nameKh: 'បង្គា', unit: 'kg', ordered: 8, icon: 'Fish', category: 'Seafood', estimatedPrice: 12.50, supplierNotes: 'Medium size 30-40 count/kg', packingStatus: 'packed' },
      { id: 'garlic', nameEn: 'Garlic', nameKh: 'ខ្ទឹមស', unit: 'kg', ordered: 5, icon: 'Carrot', category: 'Vegetables & Herbs', estimatedPrice: 3.50, supplierNotes: 'Dry whole bulbs', packingStatus: 'packed' },
      { id: 'lime', nameEn: 'Lime', nameKh: 'ក្រូចឆ្មា', unit: 'kg', ordered: 4, icon: 'Carrot', category: 'Vegetables & Herbs', estimatedPrice: 2.25, supplierNotes: 'Juicy green seedless limes', packingStatus: 'packed' },
    ],
  },
  {
    id: 'ORD-2026-003',
    status: 'sent',
    date: '2026-07-04',
    total: '451,000 ៛',
    currency: 'KHR',
    requestType: 'glossary',
    createdBy: 'Chef Sophea (ចុងភៅ សុភា)',
    approvedBy: 'Manager Dara (អ្នកគ្រប់គ្រង តារា)',
    items: [
      { id: 'morning-glory', nameEn: 'Morning Glory (Trakuon)', nameKh: 'ត្រកួន', unit: 'bundle (ដុំ/បាច់)', ordered: 20, icon: 'Leaf', category: 'Vegetables & Herbs', estimatedPrice: 0.75, supplierNotes: 'Young tender shoots only', packingStatus: 'packed' },
      { id: 'oyster-sauce', nameEn: 'Oyster Sauce', nameKh: 'ប្រេងខ្យង', unit: 'bottle (ដប)', ordered: 6, icon: 'GlassWater', category: 'Sauces & Condiments', estimatedPrice: 3.20, supplierNotes: 'Lee Kum Kee Panda Brand', packingStatus: 'packed' },
      { id: 'crushed-ice', nameEn: 'Crushed Ice', nameKh: 'ទឹកកកអនាម័យ', unit: 'sack/bag (បាវ)', ordered: 5, icon: 'GlassWater', category: 'Beverages & Ice', estimatedPrice: 2.50, supplierNotes: 'Deliver by 6:00 AM sharp', packingStatus: 'packed' },
    ],
  },
  {
    id: 'ORD-2026-004',
    status: 'completed',
    date: '2026-07-03',
    total: '$320.00',
    currency: 'USD',
    requestType: 'glossary',
    createdBy: 'Chef Sophea (ចុងភៅ សុភា)',
    approvedBy: 'Manager Dara (អ្នកគ្រប់គ្រង តារា)',
    items: [
      { id: 'beef-tenderloin', nameEn: 'Beef Tenderloin', nameKh: 'សាច់គោ', unit: 'kg', ordered: 10, received: 10, icon: 'Beef', category: 'Meat & Poultry', estimatedPrice: 16.00, supplierNotes: 'Prime cut, trimmed fat', packingStatus: 'packed' },
      { id: 'whole-chicken', nameEn: 'Whole Chicken', nameKh: 'មាន់មូល', unit: 'bird (ក្បាល)', ordered: 12, received: 12, icon: 'Egg', category: 'Meat & Poultry', estimatedPrice: 6.50, supplierNotes: 'Free-range local chicken', packingStatus: 'packed' },
    ],
  },
];

export function getOrders(): OrderRequest[] {
  if (typeof window === 'undefined') return DEFAULT_ORDERS;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_ORDERS));
      return DEFAULT_ORDERS;
    }
    return JSON.parse(stored);
  } catch (err) {
    console.error('Error reading orders from localStorage:', err);
    return DEFAULT_ORDERS;
  }
}

export function getOrderById(id: string): OrderRequest | undefined {
  const orders = getOrders();
  return orders.find((o) => o.id === id);
}

export function saveOrder(newOrder: OrderRequest): void {
  if (typeof window === 'undefined') return;
  try {
    const orders = getOrders();
    const updated = [newOrder, ...orders];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    if (newOrder.status === 'completed') {
      autoLinkOrderToOutcome(newOrder);
    }
  } catch (err) {
    console.error('Error saving order to localStorage:', err);
  }
}

export function updateOrder(idOrOrder: string | OrderRequest, updates?: Partial<OrderRequest>): OrderRequest | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    const orders = getOrders();
    const id = typeof idOrOrder === 'string' ? idOrOrder : idOrOrder.id;
    const index = orders.findIndex((o) => o.id === id);
    if (index !== -1) {
      const currentOrder = orders[index];
      const newOrder: OrderRequest = typeof idOrOrder === 'string'
        ? { ...currentOrder, ...updates }
        : { ...currentOrder, ...idOrOrder, ...updates };
      orders[index] = newOrder;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
      if (newOrder.status === 'completed') {
        autoLinkOrderToOutcome(newOrder);
      }
      return newOrder;
    }
  } catch (err) {
    console.error('Error updating order in localStorage:', err);
  }
  return undefined;
}

export function resetOrdersToDefault(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_ORDERS));
  } catch (err) {
    console.error('Error resetting orders:', err);
  }
}
