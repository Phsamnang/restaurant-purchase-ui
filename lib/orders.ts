'use client';

export type OrderStatus = 'pending' | 'approved' | 'sent' | 'discrepancy' | 'completed' | 'rejected';

export interface OrderItemDetail {
  id: string;
  nameEn: string;
  nameKh: string;
  unit: string;
  ordered: number;
  received?: number;
  discrepancyReason?: string;
  icon?: string;
}

export interface OrderRequest {
  id: string;
  status: OrderStatus;
  date: string;
  total: string;
  items: OrderItemDetail[];
  createdBy: string;
  approvedBy?: string;
  notes?: string;
}

const STORAGE_KEY = 'restaurant_orders_v1';

const DEFAULT_ORDERS: OrderRequest[] = [
  {
    id: 'ORD-2026-001',
    status: 'pending',
    date: '2026-07-06',
    total: '$184.50',
    createdBy: 'Chef Sophea (ចុងភៅ សុភា)',
    items: [
      { id: 'pork-belly', nameEn: 'Pork Belly', nameKh: 'សាច់ជ្រូកបីជាន់', unit: 'kg', ordered: 5, icon: '🥩' },
      { id: 'lemongrass', nameEn: 'Lemongrass', nameKh: 'ស្លឹកគ្រៃ', unit: 'bundle (ដុំ/បាច់)', ordered: 3, icon: '🌿' },
      { id: 'fish-sauce', nameEn: 'Fish Sauce', nameKh: 'ទឹកត្រី', unit: 'bottle (ដប)', ordered: 10, icon: '🧂' },
      { id: 'jasmine-rice', nameEn: 'Jasmine Rice (25kg)', nameKh: 'អង្ករម្លិះ', unit: 'sack (បាវ)', ordered: 2, icon: '🍚' },
    ],
  },
  {
    id: 'ORD-2026-002',
    status: 'approved',
    date: '2026-07-05',
    total: '$245.00',
    createdBy: 'Chef Sophea (ចុងភៅ សុភា)',
    approvedBy: 'Manager Dara (អ្នកគ្រប់គ្រង តារា)',
    items: [
      { id: 'river-fish', nameEn: 'River Fish (Trey Riel)', nameKh: 'ត្រីរៀល/ត្រីស្រស់', unit: 'kg', ordered: 15, icon: '🐟' },
      { id: 'shrimp', nameEn: 'Shrimp / Prawns', nameKh: 'បង្គា', unit: 'kg', ordered: 8, icon: '🦐' },
      { id: 'garlic', nameEn: 'Garlic', nameKh: 'ខ្ទឹមស', unit: 'kg', ordered: 5, icon: '🧄' },
      { id: 'lime', nameEn: 'Lime', nameKh: 'ក្រូចឆ្មា', unit: 'kg', ordered: 4, icon: '🍋' },
    ],
  },
  {
    id: 'ORD-2026-003',
    status: 'sent',
    date: '2026-07-04',
    total: '$112.75',
    createdBy: 'Chef Sophea (ចុងភៅ សុភា)',
    approvedBy: 'Manager Dara (អ្នកគ្រប់គ្រង តារា)',
    items: [
      { id: 'morning-glory', nameEn: 'Morning Glory (Trakuon)', nameKh: 'ត្រកួន', unit: 'bundle (ដុំ/បាច់)', ordered: 20, icon: '🌱' },
      { id: 'oyster-sauce', nameEn: 'Oyster Sauce', nameKh: 'ប្រេងខ្យង', unit: 'bottle (ដប)', ordered: 6, icon: '🍾' },
      { id: 'crushed-ice', nameEn: 'Crushed Ice', nameKh: 'ទឹកកកអនាម័យ', unit: 'sack/bag (បាវ)', ordered: 5, icon: '🧊' },
    ],
  },
  {
    id: 'ORD-2026-004',
    status: 'completed',
    date: '2026-07-03',
    total: '$320.00',
    createdBy: 'Chef Sophea (ចុងភៅ សុភា)',
    approvedBy: 'Manager Dara (អ្នកគ្រប់គ្រង តារា)',
    items: [
      { id: 'beef-tenderloin', nameEn: 'Beef Tenderloin', nameKh: 'សាច់គោ', unit: 'kg', ordered: 10, received: 10, icon: '🥩' },
      { id: 'whole-chicken', nameEn: 'Whole Chicken', nameKh: 'មាន់មូល', unit: 'bird (ក្បាល)', ordered: 12, received: 12, icon: '🐓' },
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
  } catch (err) {
    console.error('Error saving order to localStorage:', err);
  }
}

export function updateOrder(updatedOrder: OrderRequest): void {
  if (typeof window === 'undefined') return;
  try {
    const orders = getOrders();
    const index = orders.findIndex((o) => o.id === updatedOrder.id);
    if (index !== -1) {
      orders[index] = updatedOrder;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
    }
  } catch (err) {
    console.error('Error updating order in localStorage:', err);
  }
}

export function resetOrdersToDefault(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_ORDERS));
  } catch (err) {
    console.error('Error resetting orders:', err);
  }
}
