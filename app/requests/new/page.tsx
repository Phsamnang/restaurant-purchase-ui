'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/app-layout';
import { useAuth } from '@/lib/auth-context';
import { useTranslation } from '@/lib/i18n';
import { saveOrder, OrderRequest, OrderItemDetail } from '@/lib/orders';
import { 
  ALL_CATALOG, 
  MARKET_CATEGORIES, 
  STUFF_CATEGORIES, 
  ALL_AVAILABLE_UNITS, 
  ALL_STUFF_UNITS, 
  IngredientItem 
} from '@/types/market';
import { 
  ShoppingCart, Plus, Send, Clock, AlertTriangle, CheckCircle2, 
  Search, Trash2, Calendar, User, ShieldAlert, ArrowLeft, 
  Sparkles, Wrench, GlassWater, Beef, Fish, Carrot, 
  Soup, Wheat, Package, Utensils, Egg, Leaf, CookingPot, Droplets,
  Layers, FileText, Check, X, Edit3, ListChecks, CheckSquare, RotateCcw, MessageSquare
} from 'lucide-react';

// Helper to render icons safely
function renderIcon(iconName: string, className = 'w-5 h-5') {
  switch (iconName) {
    case 'Beef': return <Beef className={className} />;
    case 'Fish': return <Fish className={className} />;
    case 'Carrot': return <Carrot className={className} />;
    case 'Soup': return <Soup className={className} />;
    case 'Wheat': return <Wheat className={className} />;
    case 'GlassWater': return <GlassWater className={className} />;
    case 'Package': return <Package className={className} />;
    case 'Wrench': return <Wrench className={className} />;
    case 'Sparkles': return <Sparkles className={className} />;
    case 'Utensils': return <Utensils className={className} />;
    case 'Egg': return <Egg className={className} />;
    case 'Leaf': return <Leaf className={className} />;
    case 'CookingPot': return <CookingPot className={className} />;
    case 'Droplets': return <Droplets className={className} />;
    default: return <ShoppingCart className={className} />;
  }
}

// Khmer translations map for categories & items
const KHMER_LABELS: Record<string, string> = {
  'Meat & Poultry': 'សាច់សត្វ និងបក្សី',
  'Seafood & Fish': 'គ្រឿងសមុទ្រ និងត្រី',
  'Vegetables & Herbs': 'បន្លែ និងរុក្ខជាតិ',
  'Sauces & Pantry': 'គ្រឿងទេស និងទឹកជ្រលក់',
  'Rice & Noodles': 'អង្ករ និងមី/គុយទាវ',
  'Beverages & Ice': 'ភេសជ្ជៈ និងទឹកកក',
  'Glassware & Tableware': 'កែវ និងចានស្លាបព្រា',
  'Petty Cash & Tip Advance': 'បេឡា និងប្រាក់រង្វាន់បុគ្គលិក',
  'Kitchen Equipment & Tools': 'ឧបករណ៍ និងសម្ភារៈផ្ទះបាយ',
  'Cleaning & Sanitation': 'សម្ភារៈអនាម័យ និងលាងសម្អាត',
  'All Ingredients': 'គ្រឿងទេសទាំងអស់',
  'All Supplies & Cash': 'សម្ភារៈ និងបេឡាទាំងអស់',
  'Pork Belly': 'សាច់ជ្រូកបីជាន់',
  'Ground Pork': 'សាច់ជ្រូកចិញ្ច្រាំ',
  'Chicken Breast': 'ទ្រូងមាន់',
  'Whole Chicken': 'មាន់ស្រែមួយក្បាល',
  'Beef Tenderloin': 'សាច់គោសាច់ខ្នុរ',
  'River Fish': 'ត្រីទន្លេ / ត្រីរៀល',
  'Tiger Prawns / Shrimp': 'បង្គា / បង្កងក្បាលធំ',
  'Fresh Squid': 'មឹកស្រស់',
  'Fresh Mud Crab': 'ក្តាមថ្មស្រស់',
  'Lemongrass': 'គល់ស្លឹកគ្រៃ',
  'Garlic Bulbs': 'ខ្ទឹមស',
  'Red Shallots': 'ខ្ទឹមក្រហម',
  'Kaffir Lime Leaves': 'ស្លឹកក្រូចសើច',
  'Morning Glory': 'ត្រកួនស្រស់',
  'Fresh Lime': 'ក្រូចឆ្មារ',
  'Premium Fish Sauce': 'ទឹកត្រីពិសេស',
  'Oyster Sauce': 'ប្រេងខ្យង',
  'Palm Sugar': 'ស្ករត្នោត',
  'Coconut Milk': 'ខ្ទិះដូងកំប៉ុង',
  'Jasmine Rice (25kg)': 'អង្ករម្លិះ (បាវ ២៥គីឡូ)',
  'Fresh Rice Noodles': 'គុយទាវស្រស់',
  'Yellow Egg Noodles': 'មីលឿង',
  'Drinking Water Case': 'ទឹកបរិសុទ្ធកេស',
  'Crushed Hygienic Ice': 'ទឹកកកអនាម័យកិន',
  'Red Wine Glass 450ml': 'កែវស្រាក្រហម 450ml',
  'Highball Drinking Glass 350ml': 'កែវទឹក Highball 350ml',
  'Chilled Beer Mug 500ml': 'កែវបៀរ 500ml',
  'Ceramic Main Course Plate 28cm': 'ចានសេរ៉ាមិចម្ហូបធំ ២៨សង់ទីម៉ែត្រ',
  'Stainless Steel Fork & Spoon Set': 'ឈុតស្លាបព្រា និងសមអ៊ីណុក',
  'Staff Tip Advance Payout': 'ដកប្រាក់ Tip មុនសម្រាប់បុគ្គលិក',
  'Petty Cash - Urgent Operational Expense': 'បេឡា - ចំណាយបន្ទាន់ប្រចាំថ្ងៃ',
  'Small Change / Coins for Cashier Register': 'ប្រាក់រាយសម្រាប់បេឡាគិតប្រាក់',
  'Cooking Gas Tank Refill 15kg': 'បញ្ចូលហ្គាសចម្អិនអាហារ ១៥គីឡូ',
  'Heavy Duty Commercial Bar Blender': 'ម៉ាស៊ីនក្រឡុកធុនធ្ងន់សម្រាប់បារ',
  'Professional Chef Knife 8"': 'កាំបិតចុងភៅជំនាញ ៨អ៊ិញ',
  'Color-Coded Hygienic Cutting Board Set': 'ឈុតជ្រុះកាត់បែងចែកពណ៌អនាម័យ',
  'Industrial Dishwashing Liquid 5L': 'សាប៊ូលាងចានកាណុង ៥លីត្រ',
  'Heavy Duty Black Trash Bags XXL': 'ថង់សំរាមខ្មៅធុនធ្ងន់ XXL',
  'Microfiber Kitchen Cleaning Towels': 'កន្សែងជូតសម្អាតផ្ទះបាយ Microfiber',
};

function getKhmerText(text: string): string {
  if (KHMER_LABELS[text]) return KHMER_LABELS[text];
  if (text.includes('(') && text.includes(')')) {
    const match = text.match(/\(([^)]+)\)/);
    if (match && match[1]) return match[1];
  }
  return 'សម្ភារៈ / គ្រឿងផ្សំ';
}

interface RequestLineItem {
  lineId: string;
  item: IngredientItem;
  quantity: number;
  unit: string;
  supplierNotes: string;
}

export default function NewPurchaseRequestPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { language } = useTranslation();

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  // Role context (Staff, Chef, or Service)
  const [requesterRole, setRequesterRole] = useState<'staff' | 'chef' | 'service'>('staff');

  // Auto initialize role from user
  useEffect(() => {
    if (user) {
      if (user.role === 'service') {
        setRequesterRole('service');
      } else if (user.role === 'manager') {
        setRequesterRole('chef');
      } else {
        setRequesterRole('staff');
      }
    }
  }, [user]);

  // Request Type: 'glossary' | 'stuff' | 'mixed'
  const [requestType, setRequestType] = useState<'glossary' | 'stuff' | 'mixed'>('glossary');

  // Request Header Fields
  const [priority, setPriority] = useState<'normal' | 'urgent'>('normal');
  const [deliveryDate, setDeliveryDate] = useState<string>(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dd = String(tomorrow.getDate()).padStart(2, '0');
    const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const yyyy = tomorrow.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  });
  const [requestedFrom, setRequestedFrom] = useState<'manager' | 'purchaser' | 'accounting'>('purchaser');
  const [notes, setNotes] = useState<string>('');

  // Auto update requestedFrom default when requestType changes
  useEffect(() => {
    if (requestType === 'glossary') {
      setRequestedFrom('purchaser');
    } else {
      setRequestedFrom('manager');
    }
  }, [requestType]);

  // Dictionary of selected order line items mapped by `item.id`
  const [selectedItemsMap, setSelectedItemsMap] = useState<Record<string, RequestLineItem>>(() => {
    const defaultGlossary = ALL_CATALOG[0]; // Pork belly
    return {
      [defaultGlossary.id]: {
        lineId: defaultGlossary.id,
        item: defaultGlossary,
        quantity: 5,
        unit: defaultGlossary.defaultUnit || 'kg',
        supplierNotes: '',
      }
    };
  });

  // Track which items have expanded supplier notes open in the dense list
  const [openNotesMap, setOpenNotesMap] = useState<Record<string, boolean>>({});

  const toggleNoteOpen = (itemId: string) => {
    setOpenNotesMap(prev => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  // Checklist search and category filters
  const [catalogSearch, setCatalogSearch] = useState<string>('');
  const [catalogCategory, setCatalogCategory] = useState<string>('all');

  // Custom Item Modal State
  const [showCustomModal, setShowCustomModal] = useState<boolean>(false);
  const [customNameEn, setCustomNameEn] = useState<string>('');
  const [customNameKh, setCustomNameKh] = useState<string>('');
  const [customCategory, setCustomCategory] = useState<string>('Meat & Poultry');
  const [customUnit, setCustomUnit] = useState<string>('piece');
  const [customNotes, setCustomNotes] = useState<string>('');

  // Submitted read-only state
  const [submittedOrder, setSubmittedOrder] = useState<OrderRequest | null>(null);

  // Adjust initial selected map when requestType toggles (if user only has default item)
  const handleTypeChange = (newType: 'glossary' | 'stuff' | 'mixed') => {
    setRequestType(newType);
    setCatalogCategory('all');
    
    const selectedList = Object.values(selectedItemsMap);
    if (selectedList.length <= 1) {
      if (newType === 'stuff') {
        const defaultStuff = ALL_CATALOG.find(i => i.requestType === 'stuff') || ALL_CATALOG[20];
        setSelectedItemsMap({
          [defaultStuff.id]: {
            lineId: defaultStuff.id,
            item: defaultStuff,
            quantity: 2,
            unit: defaultStuff.defaultUnit || 'piece',
            supplierNotes: '',
          }
        });
      } else if (newType === 'glossary') {
        const defaultGlossary = ALL_CATALOG[0];
        setSelectedItemsMap({
          [defaultGlossary.id]: {
            lineId: defaultGlossary.id,
            item: defaultGlossary,
            quantity: 5,
            unit: defaultGlossary.defaultUnit || 'kg',
            supplierNotes: '',
          }
        });
      }
    }
  };

  // Filtered catalog for inline checklist view
  const filteredCatalog = useMemo(() => {
    return ALL_CATALOG.filter(item => {
      // Filter by Request Type
      if (requestType === 'glossary' && item.requestType === 'stuff') return false;
      if (requestType === 'stuff' && item.requestType !== 'stuff') return false;

      // Filter by Category tab
      if (catalogCategory !== 'all' && item.category !== catalogCategory) return false;

      // Filter by search string
      if (!catalogSearch.trim()) return true;
      const q = catalogSearch.toLowerCase();
      const khName = getKhmerText(item.name).toLowerCase();
      return item.name.toLowerCase().includes(q) || khName.includes(q) || item.category.toLowerCase().includes(q);
    });
  }, [requestType, catalogCategory, catalogSearch]);

  const availableCategoriesForFilter = useMemo(() => {
    if (requestType === 'glossary') return MARKET_CATEGORIES;
    if (requestType === 'stuff') return STUFF_CATEGORIES;
    return [
      { id: 'all', name: 'All Categories', iconName: 'LayoutGrid' },
      ...MARKET_CATEGORIES.filter(c => c.id !== 'all'),
      ...STUFF_CATEGORIES.filter(c => c.id !== 'all')
    ];
  }, [requestType]);

  // Array of currently selected items (`quantity > 0` or in `selectedItemsMap`)
  const selectedLineItems = useMemo(() => {
    return Object.values(selectedItemsMap);
  }, [selectedItemsMap]);

  // Calculate total units across all selected items
  const totalUnitsOrdered = useMemo(() => {
    return selectedLineItems.reduce((sum, line) => sum + (line.quantity || 0), 0);
  }, [selectedLineItems]);

  // Toggle or add item to selected map from checklist
  const toggleSelectOrIncrement = (item: IngredientItem) => {
    setSelectedItemsMap(prev => {
      const existing = prev[item.id];
      if (existing) {
        // If already selected, increase qty
        const step = item.defaultUnit === 'gram' ? 100 : 1;
        return {
          ...prev,
          [item.id]: {
            ...existing,
            quantity: existing.quantity + step,
          }
        };
      } else {
        // Add new to order
        return {
          ...prev,
          [item.id]: {
            lineId: item.id,
            item: item,
            quantity: item.defaultUnit === 'gram' ? 500 : 1,
            unit: item.defaultUnit || 'piece',
            supplierNotes: '',
          }
        };
      }
    });
  };

  // Update specific field on a selected line item
  const updateSelectedLine = (itemId: string, updates: Partial<RequestLineItem>) => {
    setSelectedItemsMap(prev => {
      const existing = prev[itemId];
      if (!existing) return prev;
      return {
        ...prev,
        [itemId]: { ...existing, ...updates }
      };
    });
  };

  // Decrement quantity or remove if qty drops to 0
  const decrementSelectedLine = (itemId: string) => {
    setSelectedItemsMap(prev => {
      const existing = prev[itemId];
      if (!existing) return prev;
      const step = existing.unit === 'gram' ? 100 : 1;
      const newQty = existing.quantity - step;
      if (newQty <= 0) {
        const copy = { ...prev };
        delete copy[itemId];
        return copy;
      }
      return {
        ...prev,
        [itemId]: { ...existing, quantity: newQty }
      };
    });
  };

  // Directly remove an item from the order
  const removeSelectedLine = (itemId: string) => {
    setSelectedItemsMap(prev => {
      const copy = { ...prev };
      delete copy[itemId];
      return copy;
    });
  };

  // Add Custom Item directly to selected order
  const handleAddCustomItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customNameEn.trim()) return;

    const customId = `custom-${Date.now()}`;
    const fullDisplayName = customNameKh.trim() ? `${customNameEn} (${customNameKh})` : customNameEn;

    const newCustomItem: IngredientItem = {
      id: customId,
      name: fullDisplayName,
      category: customCategory,
      iconName: requestType === 'stuff' ? 'Wrench' : 'Utensils',
      currentStock: 0,
      parStock: 0,
      defaultUnit: customUnit,
      allowedUnits: [customUnit],
      defaultPrice: 0,
      isCustom: true,
      requestType: requestType === 'stuff' ? 'stuff' : 'glossary',
    };

    const newLine: RequestLineItem = {
      lineId: customId,
      item: newCustomItem,
      quantity: 1,
      unit: customUnit,
      supplierNotes: customNotes,
    };

    setSelectedItemsMap(prev => ({ ...prev, [customId]: newLine }));
    setShowCustomModal(false);
    
    // Reset inputs
    setCustomNameEn('');
    setCustomNameKh('');
    setCustomNotes('');
  };

  // Handle Date quick sets
  const setQuickDate = (offsetDays: number) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    setDeliveryDate(`${dd}/${mm}/${yyyy}`);
  };

  // Handle Submit Purchase Request (Pure Quantity & Unit, No Price)
  const handleSubmitRequest = () => {
    if (selectedLineItems.length === 0) {
      alert('Please select at least one line item before submitting your purchase request.');
      return;
    }

    const newReqId = `REQ-2026-${String(Math.floor(Math.random() * 899) + 100)}`;
    
    const roleNameEn = requesterRole === 'chef' ? 'Executive Chef' : requesterRole === 'service' ? 'FOH Service Lead' : 'Kitchen Staff';
    const roleNameKh = requesterRole === 'chef' ? 'មេចុងភៅធំ' : requesterRole === 'service' ? 'ប្រធានផ្នែកសេវាកម្ម' : 'បុគ្គលិកផ្ទះបាយ';
    const createdByFormatted = `${user?.name || 'Chef Sophea'} [${roleNameEn} / ${roleNameKh}]`;

    const itemsDetail: OrderItemDetail[] = selectedLineItems.map(l => ({
      id: l.item.id,
      name: l.item.name,
      unit: l.unit,
      ordered: l.quantity,
      estimatedPrice: 0,
      estimatedPriceCurrency: 'USD',
      icon: l.item.iconName,
      category: l.item.category,
      supplierNotes: l.supplierNotes,
      packingStatus: 'pending',
    }));

    const totalDisplayStr = `${selectedLineItems.length} items (${totalUnitsOrdered} units)`;

    const newOrderRequest: OrderRequest = {
      id: newReqId,
      status: 'pending',
      date: new Date().toISOString().split('T')[0],
      deliveryDate: deliveryDate,
      total: totalDisplayStr,
      totalUSD: 0,
      totalKHR: 0,
      currency: 'USD',
      items: itemsDetail,
      createdBy: createdByFormatted,
      notes: notes,
      requestType: requestType,
      requesterRole: requesterRole,
      requestedFrom: requestedFrom,
      priority: priority,
    };

    saveOrder(newOrderRequest);
    setSubmittedOrder(newOrderRequest);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Reset to create another new request
  const handleCreateAnother = () => {
    setSubmittedOrder(null);
    setSelectedItemsMap({});
    setNotes('');
    setPriority('normal');
  };

  // ── RENDER SUBMITTED ("Waiting for Manager Approval") STATE ──────────────────
  if (submittedOrder) {
    return (
      <AppLayout>
        <div className="max-w-4xl mx-auto px-4 py-6 md:py-10 space-y-6">
          {/* Confirmation Banner */}
          <div className="bg-orange-50 border border-orange-200 rounded-2xl p-6 shadow-sm text-slate-900 space-y-4 animate-fade-in">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-orange-500 text-white flex items-center justify-center shadow-sm flex-shrink-0">
                  <Clock className="w-7 h-7" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider bg-orange-100 text-orange-800 border border-orange-200 px-2.5 py-0.5 rounded-full">
                      Status: Pending Approval
                    </span>
                    <span className="text-xs text-slate-600">រង់ចាំការពិនិត្យយល់ព្រម</span>
                  </div>
                  <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mt-1 text-slate-900">
                    Waiting for Manager Approval
                  </h1>
                  <p className="text-sm text-slate-600 font-medium mt-0.5">
                    សំណើបញ្ជាទិញរបស់អ្នកត្រូវបានបញ្ជូន និងកំពុងរង់ចាំការយល់ព្រមពីអ្នកគ្រប់គ្រង
                  </p>
                </div>
              </div>
              <div className="text-right hidden sm:block">
                <div className="text-xs font-semibold text-slate-500 uppercase">Request ID</div>
                <div className="text-xl font-black text-slate-900 tracking-tight font-mono">{submittedOrder.id}</div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-3.5 flex items-center gap-3 border border-orange-200 shadow-sm">
              <ShieldAlert className="w-5 h-5 text-orange-600 flex-shrink-0" />
              <p className="text-xs md:text-sm text-slate-700 leading-relaxed font-medium">
                <strong>Read-Only Notice:</strong> On submit, this request entered <span className="underline font-bold">pending status</span> and cannot be edited by the requester afterward. A manager will review and approve the quantities shortly.
                <br />
                <span className="text-xs text-slate-500">
                  សំណើនេះកំពុងស្ថិតក្នុងស្ថានភាពរង់ចាំ ហើយអ្នកស្នើសុំមិនអាចកែសម្រួលបានទេ បន្ទាប់ពីបានបញ្ជូនរួច។
                </span>
              </p>
            </div>
          </div>

          {/* Request Header Summary Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-slate-700" />
                <span>Request Details Summary</span>
                <span className="text-xs font-normal text-slate-500 block sm:inline">សេចក្តីលម្អិតនៃសំណើ</span>
              </h2>
              {submittedOrder.priority === 'urgent' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 text-red-800 border border-red-200 text-xs font-bold uppercase tracking-wide">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                  Urgent Priority (បន្ទាន់)
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80">
                <div className="text-xs text-slate-500 font-medium">Delivery Date (កាលបរិច្ឆេទ)</div>
                <div className="text-sm font-bold text-slate-900 mt-1 flex items-center gap-1.5 font-mono">
                  <Calendar className="w-4 h-4 text-slate-600" />
                  {submittedOrder.deliveryDate || submittedOrder.date}
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80">
                <div className="text-xs text-slate-500 font-medium">Requested From (ស្នើទៅ)</div>
                <div className="text-sm font-bold text-slate-900 mt-1 capitalize">
                  {submittedOrder.requestedFrom === 'manager' && '👤 Manager (អ្នកគ្រប់គ្រង)'}
                  {submittedOrder.requestedFrom === 'purchaser' && '🛍️ Market Purchaser (អ្នកទិញផ្សារ)'}
                  {submittedOrder.requestedFrom === 'accounting' && '💵 Accounting (គណនេយ្យ)'}
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80">
                <div className="text-xs text-slate-500 font-medium">Request Type (ប្រភេទ)</div>
                <div className="text-sm font-bold text-slate-900 mt-1 uppercase">
                  {submittedOrder.requestType === 'glossary' && '🥕 Glossary (ផ្សារ)'}
                  {submittedOrder.requestType === 'stuff' && '📦 Stuff (សម្ភារៈ)'}
                  {submittedOrder.requestType === 'mixed' && '🔀 Mixed (ចម្រុះ)'}
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80">
                <div className="text-xs text-slate-500 font-medium">Created By (បង្កើតដោយ)</div>
                <div className="text-sm font-bold text-slate-900 mt-1 truncate" title={submittedOrder.createdBy}>
                  {submittedOrder.createdBy.split(' [')[0]}
                </div>
              </div>
            </div>

            {submittedOrder.notes && (
              <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/80 text-sm">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">General Notes (កំណត់សម្គាល់ទូទៅ):</div>
                <div className="text-slate-800 mt-1 font-medium">{submittedOrder.notes}</div>
              </div>
            )}
          </div>

          {/* Read-only Submitted Line Items List (Pure Quantity & Unit, No Price) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Submitted Line Items ({submittedOrder.items.length} items)
                </h3>
                <p className="text-xs text-slate-500">បញ្ជីមុខទំនិញដែលបានស្នើសុំ (បរិមាណ និងខ្នាត)</p>
              </div>
              <span className="bg-slate-200/80 text-slate-700 border border-slate-300 text-xs font-bold px-3 py-1 rounded-full">
                {submittedOrder.items.reduce((s, i) => s + (i.ordered || 0), 0)} Total Units
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {submittedOrder.items.map((item, idx) => (
                <div key={item.id + idx} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-start gap-3.5">
                    <div className="w-11 h-11 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 flex-shrink-0 mt-0.5">
                      {renderIcon(item.icon || 'ShoppingCart', 'w-6 h-6')}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-base leading-snug">
                        {item.name.split(' (')[0]}
                      </div>
                      <div className="text-xs font-medium text-slate-500 mt-0.5">
                        {getKhmerText(item.name)}
                      </div>
                      {item.category && (
                        <span className="inline-block mt-1 text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 rounded-md">
                          {item.category}
                        </span>
                      )}
                      {item.supplierNotes && (
                        <div className="mt-2 bg-orange-50 border border-orange-200 px-2.5 py-1 rounded text-xs text-slate-800 font-medium">
                          <strong>Note:</strong> {item.supplierNotes}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                    <div className="text-lg sm:text-xl font-black text-slate-900 font-mono bg-slate-50 border border-slate-200 px-3.5 py-1.5 rounded-xl">
                      {item.ordered} <span className="text-sm font-bold text-slate-600">{item.unit}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Footer (Only 1 primary button: Create Another Request) */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 pb-8">
            <button
              type="button"
              onClick={() => router.push('/requests')}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 font-bold text-slate-700 flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              <ArrowLeft className="w-5 h-5 text-slate-500" />
              <span>Back to Requests List</span>
              <span className="text-xs text-slate-400 font-normal ml-1">(បញ្ជីសំណើ)</span>
            </button>

            <button
              type="button"
              onClick={handleCreateAnother}
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-[#0A8F4D] hover:bg-[#08733E] font-bold text-white flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              <Plus className="w-5 h-5" />
              <span>Create Another Request</span>
              <span className="text-xs text-[#E1F5EE] font-normal ml-1">(បង្កើតថ្មីទៀត)</span>
            </button>
          </div>
        </div>
      </AppLayout>
    );
  }

  // ── RENDER NEW REQUEST CREATE/EDIT SCREEN (Side-by-Side Split: Ultra-Compact Tabular List Rows) ────
  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 md:py-8 pb-36 space-y-6">
        
        {/* Top Role Selector & Page Header */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center font-bold">
                <User className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-slate-500 font-medium">Active Staff Role Context (តួនាទីបុគ្គលិក)</div>
                <div className="text-sm font-bold text-slate-900 flex items-center gap-2 mt-0.5">
                  {requesterRole === 'staff' && '👨‍🍳 Kitchen Staff & Chef (បុគ្គលិកផ្ទះបាយ)'}
                  {requesterRole === 'service' && '🍸 Bar & Service FOH (ផ្នែកសេវាកម្ម)'}
                  {requesterRole === 'chef' && '👑 Executive Chef Lead (មេចុងភៅធំ)'}
                </div>
              </div>
            </div>

            {/* Quick switcher using neutral secondary controls */}
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-medium">
              <button
                type="button"
                onClick={() => setRequesterRole('staff')}
                className={`px-3 py-1.5 rounded-lg transition-all ${requesterRole === 'staff' ? 'bg-white text-slate-900 font-bold shadow-sm border border-slate-200/80' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Kitchen Staff
              </button>
              <button
                type="button"
                onClick={() => setRequesterRole('chef')}
                className={`px-3 py-1.5 rounded-lg transition-all ${requesterRole === 'chef' ? 'bg-white text-slate-900 font-bold shadow-sm border border-slate-200/80' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Chef Lead
              </button>
              <button
                type="button"
                onClick={() => setRequesterRole('service')}
                className={`px-3 py-1.5 rounded-lg transition-all ${requesterRole === 'service' ? 'bg-white text-slate-900 font-bold shadow-sm border border-slate-200/80' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Service / Bar
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  New Purchase Request
                </h1>
                <span className="text-xs font-bold bg-[#E1F5EE] text-[#085041] border border-[#0A8F4D]/30 px-2.5 py-1 rounded-full">
                  Ultra-Compact View
                </span>
              </div>
              <p className="text-sm text-slate-500 font-medium mt-0.5">
                សំណើបញ្ជាទិញថ្មី — Dense single-line item rows designed for rapid multi-item chef ordering
              </p>
            </div>

            <button
              type="button"
              onClick={() => router.push('/requests')}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 self-start sm:self-auto transition-colors shadow-sm"
            >
              <ArrowLeft className="w-4 h-4 text-slate-500" />
              <span>Cancel & Back</span>
            </button>
          </div>
        </div>

        {/* Request Type Selector: 'glossary' | 'stuff' | 'mixed' */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
            1. Select Request Type <span className="text-slate-400 font-normal">(ជ្រើសរើសប្រភេទសំណើ)</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => handleTypeChange('glossary')}
              className={`text-left p-4 rounded-2xl transition-all flex items-start gap-3.5 border-2 ${
                requestType === 'glossary'
                  ? 'border-[#0A8F4D] bg-[#E1F5EE]/40 shadow-sm'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 border ${
                requestType === 'glossary' ? 'bg-[#0A8F4D] text-white border-[#0A8F4D] shadow-sm' : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}>
                <Carrot className="w-6 h-6" />
              </div>
              <div>
                <div className={`font-bold text-base ${requestType === 'glossary' ? 'text-slate-900' : 'text-slate-800'}`}>
                  Glossary Market
                </div>
                <div className="text-xs font-medium text-slate-500 mt-0.5">
                  គ្រឿងទេស និងផ្សារ
                </div>
                <div className="text-[11px] text-slate-400 mt-1 leading-tight">
                  Fresh meat, produce, seafood, spices & kitchen groceries
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleTypeChange('stuff')}
              className={`text-left p-4 rounded-2xl transition-all flex items-start gap-3.5 border-2 ${
                requestType === 'stuff'
                  ? 'border-[#0A8F4D] bg-[#E1F5EE]/40 shadow-sm'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 border ${
                requestType === 'stuff' ? 'bg-[#0A8F4D] text-white border-[#0A8F4D] shadow-sm' : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}>
                <Package className="w-6 h-6" />
              </div>
              <div>
                <div className={`font-bold text-base ${requestType === 'stuff' ? 'text-slate-900' : 'text-slate-800'}`}>
                  Stuff & Supplies
                </div>
                <div className="text-xs font-medium text-slate-500 mt-0.5">
                  សម្ភារៈ និងបេឡា
                </div>
                <div className="text-[11px] text-slate-400 mt-1 leading-tight">
                  Glassware, kitchen equipment, petty cash, maintenance & cleaning
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleTypeChange('mixed')}
              className={`text-left p-4 rounded-2xl transition-all flex items-start gap-3.5 border-2 ${
                requestType === 'mixed'
                  ? 'border-[#0A8F4D] bg-[#E1F5EE]/40 shadow-sm'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 border ${
                requestType === 'mixed' ? 'bg-[#0A8F4D] text-white border-[#0A8F4D] shadow-sm' : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}>
                <Layers className="w-6 h-6" />
              </div>
              <div>
                <div className={`font-bold text-base ${requestType === 'mixed' ? 'text-slate-900' : 'text-slate-800'}`}>
                  Mixed Order
                </div>
                <div className="text-xs font-medium text-slate-500 mt-0.5">
                  ចម្រុះ (គ្រឿងទេស + សម្ភារៈ)
                </div>
                <div className="text-[11px] text-slate-400 mt-1 leading-tight">
                  Combined purchase containing both ingredients & supplies
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Request Header Settings: Priority, Delivery Date, Requested From, Notes */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                2. Order Parameters & Details
              </h2>
              <p className="text-xs text-slate-500">កំណត់កាលបរិច្ឆេទ និងកម្រិតបន្ទាន់</p>
            </div>
            {priority === 'urgent' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 text-red-800 border border-red-200 text-xs font-bold uppercase tracking-wide">
                <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                Urgent Priority
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Priority Toggle: normal vs urgent */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
                Priority Level <span className="text-slate-400 font-normal">(កម្រិតបន្ទាន់)</span>
              </label>
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setPriority('normal')}
                  className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    priority === 'normal'
                      ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Check className="w-3.5 h-3.5 text-[#0A8F4D]" />
                  <span>Normal (ធម្មតា)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPriority('urgent')}
                  className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    priority === 'urgent'
                      ? 'bg-red-50 text-red-700 border border-red-200 font-black shadow-sm'
                      : 'text-slate-600 hover:text-red-600'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                  <span>Urgent (បន្ទាន់)</span>
                </button>
              </div>
            </div>

            {/* Delivery Date in DD/MM/YYYY */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
                Delivery Date <span className="text-slate-400 font-normal">(កាលបរិច្ឆេទ DD/MM/YYYY)</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  placeholder="DD/MM/YYYY (e.g. 14/07/2026)"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 bg-white font-mono font-bold text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0A8F4D]"
                />
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              </div>
              <div className="flex items-center gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => setQuickDate(0)}
                  className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => setQuickDate(1)}
                  className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-[#E1F5EE] hover:bg-[#cbf0e2] text-[#085041] border border-[#0A8F4D]/30"
                >
                  Tomorrow
                </button>
                <button
                  type="button"
                  onClick={() => setQuickDate(2)}
                  className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
                >
                  +2 Days
                </button>
              </div>
            </div>

            {/* Requested From: manager | purchaser | accounting */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
                Requested From <span className="text-slate-400 font-normal">(ស្នើទៅកាន់)</span>
              </label>
              <select
                value={requestedFrom}
                onChange={(e) => setRequestedFrom(e.target.value as any)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white font-bold text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0A8F4D]"
              >
                <option value="purchaser">🛍️ Market Purchaser (អ្នកទិញផ្សារ)</option>
                <option value="manager">👤 Restaurant Manager (អ្នកគ្រប់គ្រង)</option>
                <option value="accounting">💵 Accounting & Cashier (គណនេយ្យ / បេឡា)</option>
              </select>
            </div>
          </div>

          {/* Free text general notes */}
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
              General Request Notes <span className="text-slate-400 font-normal">(កំណត់សម្គាល់ទូទៅសម្រាប់អ្នកទិញ/អ្នកគ្រប់គ្រង)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="e.g. Need fresh morning cut pork belly before 7:00 AM sharp for Malis banquet prep..."
              className="w-full p-3 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0A8F4D] placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* ── 2-COLUMN SPLIT SCREEN: Left Column (Catalog) | Right Column (Market Shopping List) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT COLUMN: All Catalog Items with Search & Add (+) Buttons (lg:col-span-7) */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <ListChecks className="w-5 h-5 text-slate-700" />
                  <span>3. Select Items from Catalog</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  ជ្រើសរើសទំនិញដើម្បីបន្ថែមទៅក្នុង Market Shopping List ខាងស្តាំ
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowCustomModal(true)}
                className="px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm self-start sm:self-auto"
              >
                <Edit3 className="w-4 h-4 text-slate-500" />
                <span>+ Add Custom Item</span>
              </button>
            </div>

            {/* Checklist Filters Bar */}
            <div className="p-4 border-b border-slate-200 bg-white space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search ingredient or supply in English or Khmer (e.g. Pork, ត្រកួន)..."
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0A8F4D]"
                />
                {catalogSearch && (
                  <button
                    type="button"
                    onClick={() => setCatalogSearch('')}
                    className="absolute right-3 top-3 text-xs text-slate-500 hover:text-slate-700 font-bold"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Category Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar pt-1">
                {availableCategoriesForFilter.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCatalogCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                      catalogCategory === cat.id
                        ? 'bg-[#E1F5EE] text-[#085041] border border-[#0A8F4D]/40 shadow-sm'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200/80'
                    }`}
                  >
                    {renderIcon(cat.iconName || 'LayoutGrid', 'w-3.5 h-3.5')}
                    <span>{cat.name.split(' (')[0]}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Catalog Items List (Dense tabular rows) */}
            <div className="divide-y divide-slate-100 max-h-[720px] overflow-y-auto">
              {filteredCatalog.length === 0 ? (
                <div className="py-12 text-center text-slate-400 space-y-3 p-6">
                  <Package className="w-10 h-10 mx-auto opacity-40" />
                  <p className="text-sm font-bold text-slate-600">No catalog items match your search</p>
                  <button
                    type="button"
                    onClick={() => setShowCustomModal(true)}
                    className="px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs inline-flex items-center gap-1.5 shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Add Custom Item Instead</span>
                  </button>
                </div>
              ) : (
                filteredCatalog.map(item => {
                  const selectedLine = selectedItemsMap[item.id];
                  const isSelected = !!selectedLine && selectedLine.quantity > 0;

                  return (
                    <div
                      key={item.id}
                      className={`p-2.5 sm:p-3 transition-all flex items-center justify-between gap-2 sm:gap-3 ${
                        isSelected
                          ? 'bg-[#E1F5EE]/20 border-l-4 border-l-[#0A8F4D]'
                          : 'bg-white hover:bg-slate-50/80'
                      }`}
                    >
                      {/* Item Title & Icon */}
                      <div 
                        className="flex items-center gap-2.5 cursor-pointer min-w-0 flex-1"
                        onClick={() => toggleSelectOrIncrement(item)}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 border transition-colors ${
                          isSelected ? 'bg-[#E1F5EE] text-[#085041] border-[#0A8F4D]/30 shadow-sm' : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}>
                          {renderIcon(item.iconName || 'ShoppingCart', 'w-4 h-4')}
                        </div>
                        <div className="min-w-0 truncate">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-xs sm:text-sm text-slate-900 leading-tight truncate">
                              {item.name.split(' (')[0]}
                            </h4>
                            {isSelected && (
                              <span className="text-[10px] font-bold bg-[#E1F5EE] text-[#085041] border border-[#0A8F4D]/30 px-1.5 py-0.2 rounded-full hidden sm:inline-flex items-center gap-0.5">
                                <Check className="w-2.5 h-2.5" /> Added
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] font-medium text-slate-500 truncate">
                            {getKhmerText(item.name)} <span className="text-slate-400">({item.category})</span>
                          </div>
                        </div>
                      </div>

                      {/* Right side Qty steppers or Add button */}
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {isSelected ? (
                          <div className="flex items-center gap-1 bg-white border border-slate-200 p-0.5 rounded-lg shadow-sm">
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); decrementSelectedLine(item.id); }}
                              className="w-7 h-7 rounded bg-slate-100 hover:bg-slate-200 flex items-center justify-center font-black text-slate-700 text-xs"
                            >
                              -
                            </button>
                            <span className="min-w-[44px] text-center font-mono font-black text-xs text-slate-900 px-1">
                              {selectedLine.quantity} {selectedLine.unit}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); updateSelectedLine(item.id, { quantity: selectedLine.quantity + (selectedLine.unit === 'gram' ? 100 : 1) }); }}
                              className="w-7 h-7 rounded bg-slate-100 hover:bg-slate-200 flex items-center justify-center font-black text-slate-700 text-xs"
                            >
                              +
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => toggleSelectOrIncrement(item)}
                            className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-bold text-xs flex items-center gap-1 transition-all shadow-sm whitespace-nowrap"
                          >
                            <Plus className="w-3.5 h-3.5 text-slate-500" />
                            <span>+ Add</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Persistent Market Shopping List Card (lg:col-span-5) - ULTRA-COMPACT TABULAR LIST */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden lg:sticky lg:top-6 flex flex-col max-h-[820px]">
            
            {/* Shopping List Header */}
            <div className="p-3.5 sm:p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-3 flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#E1F5EE] border border-[#0A8F4D]/30 flex items-center justify-center text-[#085041] font-bold">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-sm sm:text-base text-slate-900 flex items-center gap-1.5">
                    <span>Market Shopping List</span>
                    <span className="bg-slate-800 text-white text-xs font-bold px-2 py-0.2 rounded-full">
                      {selectedLineItems.length}
                    </span>
                  </h3>
                  <p className="text-[10px] sm:text-[11px] text-slate-500">បញ្ជីទំនិញដែលត្រូវបញ្ជាទិញ (បរិមាណ និងខ្នាត)</p>
                </div>
              </div>

              {selectedLineItems.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedItemsMap({})}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-600 text-xs font-bold transition-colors shadow-sm flex items-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Clear</span>
                </button>
              )}
            </div>

            {/* Shopping List Items Container (Ultra-Compact Tabular / Single-Line Rows) */}
            <div className="divide-y divide-slate-100 overflow-y-auto flex-1">
              {selectedLineItems.length === 0 ? (
                <div className="py-16 text-center text-slate-400 space-y-3 px-4">
                  <ShoppingCart className="w-12 h-12 mx-auto opacity-30" />
                  <h4 className="text-base font-bold text-slate-700">Your Shopping List is Empty</h4>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                    សូមចុចប៊ូតុង <strong className="text-slate-700">(+ Add)</strong> ពីបញ្ជីទំនិញខាងឆ្វេង ដើម្បីបន្ថែមមកក្នុងបណ្ដុំ Market Shopping List នេះ។
                  </p>
                </div>
              ) : (
                selectedLineItems.map((line) => {
                  const hasNote = !!line.supplierNotes.trim();
                  const isNoteOpen = !!openNotesMap[line.item.id] || hasNote;

                  return (
                    <div 
                      key={line.lineId}
                      className="px-3 py-2 bg-white hover:bg-slate-50 transition-colors flex flex-col gap-1 border-b border-slate-100"
                    >
                      {/* Ultra-Dense Horizontal Row */}
                      <div className="flex items-center justify-between gap-2">
                        {/* Left: Item Title */}
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <div className="w-6 h-6 rounded bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 flex-shrink-0">
                            {renderIcon(line.item.iconName || 'ShoppingCart', 'w-3.5 h-3.5')}
                          </div>
                          <div className="min-w-0 truncate">
                            <span className="font-bold text-xs sm:text-sm text-slate-900 leading-tight truncate block sm:inline">
                              {line.item.name.split(' (')[0]}
                            </span>
                            <span className="text-[11px] text-slate-500 truncate hidden sm:inline ml-1 font-normal">
                              ({getKhmerText(line.item.name)})
                            </span>
                          </div>
                        </div>

                        {/* Center-Right: Compact Stepper & Unit Select */}
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {/* Compact Stepper */}
                          <div className="flex items-center gap-0.5 bg-slate-100 border border-slate-200 rounded-md p-0.5">
                            <button
                              type="button"
                              onClick={() => decrementSelectedLine(line.item.id)}
                              className="w-6 h-6 sm:w-7 sm:h-7 rounded bg-white hover:bg-slate-200 flex items-center justify-center font-black text-slate-700 text-xs shadow-sm"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              step={line.unit === 'gram' ? '50' : '1'}
                              min="0.1"
                              value={line.quantity}
                              onChange={(e) => updateSelectedLine(line.item.id, { quantity: parseFloat(e.target.value) || 0 })}
                              className="w-9 sm:w-11 py-0.5 text-center font-mono font-black text-xs sm:text-sm text-slate-900 bg-transparent focus:outline-none focus:ring-1 focus:ring-[#0A8F4D] rounded"
                            />
                            <button
                              type="button"
                              onClick={() => updateSelectedLine(line.item.id, { quantity: line.quantity + (line.unit === 'gram' ? 100 : 1) })}
                              className="w-6 h-6 sm:w-7 sm:h-7 rounded bg-white hover:bg-slate-200 flex items-center justify-center font-black text-slate-700 text-xs shadow-sm"
                            >
                              +
                            </button>
                          </div>

                          {/* Mini Unit Selector */}
                          <select
                            value={line.unit}
                            onChange={(e) => updateSelectedLine(line.item.id, { unit: e.target.value })}
                            className="w-14 sm:w-16 px-1.5 py-1 rounded-md border border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#0A8F4D]"
                          >
                            {(requestType === 'stuff' ? ALL_STUFF_UNITS : ALL_AVAILABLE_UNITS).map(u => (
                              <option key={u} value={u}>{u}</option>
                            ))}
                          </select>

                          {/* Mini Note Toggle Button */}
                          <button
                            type="button"
                            onClick={() => toggleNoteOpen(line.item.id)}
                            className={`p-1 rounded-md border transition-colors ${
                              hasNote || isNoteOpen
                                ? 'bg-amber-50 border-amber-300 text-amber-700 font-bold'
                                : 'border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                            }`}
                            title="Add / Edit Note"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>

                          {/* Mini Trash Remove Button */}
                          <button
                            type="button"
                            onClick={() => removeSelectedLine(line.item.id)}
                            className="p-1 rounded-md text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors"
                            title="Remove item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Expandable/Collapsible Slim Note Bar (Only shown if open or if text exists) */}
                      {isNoteOpen && (
                        <div className="pl-8 pr-1 pt-0.5 pb-1 flex items-center gap-1.5 animate-fade-in">
                          <input
                            type="text"
                            value={line.supplierNotes}
                            onChange={(e) => updateSelectedLine(line.item.id, { supplierNotes: e.target.value })}
                            placeholder="Add brief supplier note (e.g. Trim fat / morning delivery)..."
                            className="w-full px-2 py-1 rounded border border-slate-200 bg-slate-50/80 text-[11px] text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#0A8F4D] focus:bg-white placeholder:text-slate-400"
                          />
                          {hasNote && (
                            <button
                              type="button"
                              onClick={() => updateSelectedLine(line.item.id, { supplierNotes: '' })}
                              className="text-[10px] font-bold text-slate-400 hover:text-red-600 px-1"
                            >
                              Clear
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Shopping List Footer & Submit Button (Compact & Clean) */}
            <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-200 space-y-2.5 flex-shrink-0">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm">
                <span>ESTIMATED MARKET LIST</span>
                <span className="font-mono text-xs font-black bg-[#E1F5EE] text-[#085041] px-2.5 py-0.5 rounded border border-[#0A8F4D]/30">
                  {selectedLineItems.length} items · {totalUnitsOrdered} units
                </span>
              </div>

              <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium leading-tight">
                On submit, request enters <strong className="text-slate-700 underline">pending status</strong> requiring manager approval before purchasing.
              </p>

              <button
                type="button"
                onClick={handleSubmitRequest}
                disabled={selectedLineItems.length === 0}
                className={`w-full py-3 rounded-xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-sm transition-all ${
                  selectedLineItems.length === 0
                    ? 'bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed'
                    : 'bg-[#0A8F4D] hover:bg-[#08733E] text-white active:scale-[0.98]'
                }`}
              >
                <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Submit Market List ({selectedLineItems.length})</span>
              </button>
            </div>
          </div>

        </div>

        {/* ── ADD CUSTOM ITEM MODAL (Quantity & Unit Only, No Price) ──────────────── */}
        {showCustomModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fade-in">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden">
              <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                <div>
                  <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    <Edit3 className="w-5 h-5 text-slate-700" />
                    <span>Add Custom Line Item</span>
                  </h3>
                  <p className="text-xs text-slate-500">បញ្ចូលទំនិញថ្មីដែលមិនមានក្នុងបណ្ណាល័យ</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCustomModal(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddCustomItem} className="p-5 space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                    Item Name in English <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Room 204 Air Conditioner Replacement Part / Special Truffle Oil..."
                    value={customNameEn}
                    onChange={(e) => setCustomNameEn(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0A8F4D]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                    Khmer Name / Secondary Line <span className="text-slate-400 font-normal">(ឈ្មោះជាភាសាខ្មែរ)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. គ្រឿងបន្លាស់ម៉ាស៊ីនត្រជាក់បន្ទប់ ២០៤ / ប្រេងពិសេស..."
                    value={customNameKh}
                    onChange={(e) => setCustomNameKh(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0A8F4D]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                      Category <span className="text-slate-400 font-normal">(ផ្នែក)</span>
                    </label>
                    <select
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0A8F4D]"
                    >
                      {(requestType === 'stuff' ? STUFF_CATEGORIES : MARKET_CATEGORIES).filter(c => c.id !== 'all').map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                      Default Unit <span className="text-slate-400 font-normal">(ខ្នាត)</span>
                    </label>
                    <input
                      type="text"
                      value={customUnit}
                      onChange={(e) => setCustomUnit(e.target.value)}
                      placeholder="piece, kg, set, bottle..."
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0A8F4D]"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                    Optional Supplier Notes <span className="text-slate-400 font-normal">(កំណត់សម្គាល់)</span>
                  </label>
                  <input
                    type="text"
                    value={customNotes}
                    onChange={(e) => setCustomNotes(e.target.value)}
                    placeholder="e.g. Room 204 AC unit — leaking water on floor..."
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0A8F4D]"
                  />
                </div>

                <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowCustomModal(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-300 font-bold text-xs text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-[#0A8F4D] hover:bg-[#08733E] text-white font-bold text-xs shadow-sm"
                  >
                    + Add Custom Item to Request
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </AppLayout>
  );
}
