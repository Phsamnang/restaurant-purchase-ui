'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/app-layout';
import { useAuth, User } from '@/lib/auth-context';
import { useTranslation } from '@/lib/i18n';
import { Modal } from '@/components/shared/modal';
import { 
  Store, Search, Plus, Calendar, Clock, ShoppingCart, 
  CheckCircle2, AlertCircle, ArrowRight, Package,
  GlassWater, DollarSign, ShieldCheck, Utensils, UserCheck,
  Banknote, Crown, Send
} from 'lucide-react';

import { 
  IngredientItem, OrderItem, ALL_CATEGORIES, ALL_CATALOG, MARKET_CATEGORIES
} from '@/types/market';
import { getOrders, saveOrder, OrderRequest } from '@/lib/orders';
import { CategoryBar } from '@/components/market/category-bar';
import { IngredientList, renderIngredientIcon } from '@/components/market/ingredient-list';
import { BasketPanel } from '@/components/market/basket-panel';
import { OrderModal } from '@/components/market/order-modal';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function NewMarketOrderPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { t, language } = useTranslation();

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  // Active Role State ('manager' | 'staff' | 'service')
  const [requesterRole, setRequesterRole] = useState<'manager' | 'staff' | 'service'>('staff');
  const [requestedFrom, setRequestedFrom] = useState<'manager' | 'purchaser' | 'accounting'>('purchaser');

  // Auto-initialize role based on logged-in user
  useEffect(() => {
    if (user && (user.role === 'manager' || user.role === 'staff' || user.role === 'service')) {
      const role = user.role as 'manager' | 'staff' | 'service';
      setRequesterRole(role);
      if (role === 'service' || role === 'manager') {
        setRequestedFrom('manager');
      } else {
        setRequestedFrom('purchaser');
      }
    }
  }, [user]);

  // Unified Catalog States
  const [customItems, setCustomItems] = useState<IngredientItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const activeCategories = useMemo(() => {
    if (requesterRole === 'staff') {
      const kitchenCatNames = [
        'all', 'Meat & Poultry', 'Seafood & Fish', 'Vegetables & Herbs', 
        'Sauces & Pantry', 'Rice & Noodles', 'Kitchen Equipment & Tools', 'Petty Cash & Tip Advance', 'Cleaning & Sanitation'
      ];
      return ALL_CATEGORIES.filter(c => kitchenCatNames.includes(c.id));
    } else if (requesterRole === 'service') {
      const serviceCatNames = [
        'all', 'Beverages & Ice', 'Glassware & Tableware', 
        'Petty Cash & Tip Advance', 'Cleaning & Sanitation'
      ];
      return ALL_CATEGORIES.filter(c => serviceCatNames.includes(c.id));
    }
    return ALL_CATEGORIES;
  }, [requesterRole]);

  const activeCatalog = useMemo(() => {
    const filteredCustom = customItems.filter(i => 
      !i.name.toLowerCase().includes('fff') &&
      !i.name.toLowerCase().includes('gggg') &&
      !i.id.toLowerCase().includes('fff') &&
      !i.id.toLowerCase().includes('gggg')
    );
    const combined = [...filteredCustom, ...ALL_CATALOG];
    
    // Filter by role category scope when not manager
    const allowedCatIds = activeCategories.map(c => c.id);
    if (requesterRole === 'manager') return combined;
    return combined.filter(item => allowedCatIds.includes(item.category) || item.category === 'all');
  }, [customItems, requesterRole, activeCategories]);

  // Handle Role Switching
  const handleRoleChange = (role: 'manager' | 'staff' | 'service') => {
    setRequesterRole(role);
    setSelectedCategory('all');
    if (role === 'service') {
      setCustomCategory('Glassware & Tableware');
      setCurrency('USD');
      setRequestedFrom('manager');
    } else if (role === 'staff') {
      setCustomCategory('Meat & Poultry');
      setCurrency('KHR');
      setRequestedFrom('purchaser');
    } else {
      setCustomCategory('Petty Cash & Tip Advance');
      setCurrency('USD');
      setRequestedFrom('manager');
    }
  };

  // Basket State
  const [orderItems, setOrderItems] = useState<Record<string, OrderItem>>({});

  // Active Modal States
  const [activeModalItem, setActiveModalItem] = useState<{
    ingredient: IngredientItem;
    orderItem?: OrderItem;
  } | null>(null);

  const [showCustomModal, setShowCustomModal] = useState<boolean>(false);
  const [showMobileBasket, setShowMobileBasket] = useState<boolean>(false);
  const [showReviewModal, setShowReviewModal] = useState<boolean>(false);

  // Custom Item Form State
  const [customName, setCustomName] = useState('');
  const [customCategory, setCustomCategory] = useState<string>('Meat & Poultry');
  const [customUnit, setCustomUnit] = useState('kg');
  const [customPrice, setCustomPrice] = useState<number>(0);

  // Cash / Money Advance Request with Reason State
  const [showMoneyModal, setShowMoneyModal] = useState<boolean>(false);
  const [moneyPurpose, setMoneyPurpose] = useState<string>('Tip Advance Payout (ដកប្រាក់រង្វាន់ Tip មុនកាលកំណត់)');
  const [moneyAmount, setMoneyAmount] = useState<number>(0);
  const [moneyCurrency, setMoneyCurrency] = useState<'KHR' | 'USD'>('USD');
  const [moneyReason, setMoneyReason] = useState<string>('');

  // Global Request Config (Top Bar)
  const [deliveryDate, setDeliveryDate] = useState<string>('');
  const [priority, setPriority] = useState<'normal' | 'urgent'>('normal');
  const [currency, setCurrency] = useState<'KHR' | 'USD'>('KHR');
  
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Initialize delivery date
  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yyyy = tomorrow.getFullYear();
    const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const dd = String(tomorrow.getDate()).padStart(2, '0');
    setDeliveryDate(`${yyyy}-${mm}-${dd}`);
  }, []);

  // Filter Ingredients based on Category and Search Query
  const filteredIngredients = useMemo(() => {
    return activeCatalog.filter((item) => {
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      if (!matchesCategory) return false;

      if (!searchQuery.trim()) return true;

      const query = searchQuery.toLowerCase().trim();
      const matchName = item.name.toLowerCase().includes(query);
      const matchCat = item.category.toLowerCase().includes(query);

      return matchName || matchCat;
    });
  }, [activeCatalog, selectedCategory, searchQuery]);

  // Basket Operations
  const handleInlineAdd = (item: OrderItem) => {
    setOrderItems((prev) => ({
      ...prev,
      [item.ingredient.id]: item,
    }));
  };

  const handleInlineRemove = (ingredientId: string) => {
    setOrderItems((prev) => {
      const next = { ...prev };
      delete next[ingredientId];
      return next;
    });
  };

  const handleClearBasket = () => {
    if (confirm('Are you sure you want to clear your shopping list? / តើអ្នកពិតជាចង់លុបបញ្ជីមែនទេ?')) {
      setOrderItems({});
    }
  };

  // Handle creating a Custom Market Item
  const handleCreateCustomItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customNameEn.trim()) return;

    const isCashCategory = customCategory === 'Petty Cash & Tip Advance';
    const newId = `custom-${Date.now()}`;
    
    const newIngredient: IngredientItem = {
      id: newId,
      name: customName.trim(),
      category: customCategory,
      defaultUnit: isCashCategory ? currency : customUnit,
      defaultPrice: Number(customPrice) || 0,
      allowedUnits: isCashCategory 
        ? ['USD', 'KHR'] 
        : ['kg', 'gram', 'piece', 'pack', 'box', 'bottle', 'set', 'gallon'],
      iconName: isCashCategory ? 'DollarSign' : 'Package',
      currentStock: 0,
      parStock: 10,
      isCustom: true,
      requestType: isCashCategory ? 'stuff' : 'glossary',
    };

    setCustomItems((prev) => [newIngredient, ...prev]);
    setShowCustomModal(false);

    const newOrderItem: OrderItem = {
      ingredient: newIngredient,
      quantity: 1,
      unit: newIngredient.defaultUnit,
      pricePerUnit: newIngredient.defaultPrice,
      totalCost: newIngredient.defaultPrice,
      supplier: isCashCategory ? `Staff Member (${requesterRole.toUpperCase()})` : 'Local Market Vendor',
      notes: customNameKh.trim() || customNameEn.trim(),
    };

    handleInlineAdd(newOrderItem);

    setCustomNameEn('');
    setCustomNameKh('');
    setCustomPrice(0);
  };

  // Handle Creating Cash / Money Request with mandatory Reason
  const handleCreateMoneyRequest = (e: React.FormEvent, directSubmit: boolean) => {
    e.preventDefault();
    if (!moneyAmount || moneyAmount <= 0) {
      alert(language === 'kh' ? 'សូមបញ្ចូលចំនួនប្រាក់!' : 'Please enter a valid amount!');
      return;
    }
    if (!moneyReason || moneyReason.trim().length < 3) {
      alert(language === 'kh' ? 'សូមបញ្ជាក់មូលហេតុដកប្រាក់ឲ្យបានច្បាស់!' : 'Please enter a clear reason / justification for this money request!');
      return;
    }

    try {
      if (!user) return;
      setSubmitting(true);
      const totalStr = moneyCurrency === 'KHR'
        ? `${Math.round(moneyAmount).toLocaleString()} ៛`
        : `$${moneyAmount.toFixed(2)}`;
      const roleLabel = requesterRole === 'manager' ? 'Manager' : (requesterRole === 'staff' ? 'Kitchen Staff' : 'Service & FOH');
      
      const newOrder: OrderRequest = {
        id: `ORD-${Date.now().toString().slice(-6)}`,
        status: 'pending',
        date: new Date().toISOString().split('T')[0],
        total: totalStr,
        currency: moneyCurrency,
        requestType: 'stuff',
        requesterRole: requesterRole,
        requestedFrom: 'manager',
        createdBy: `${user.name} [${roleLabel}] → Req from Manager`,
        notes: `Money Request Reason: ${moneyReason.trim()} (${moneyPurpose})`,
        items: [{
          id: 'item-cash-1',
          name: moneyPurpose,
          unit: moneyCurrency,
          ordered: 1,
          icon: 'banknote',
          category: 'Petty Cash & Tip Advance',
          estimatedPrice: Number(moneyAmount),
          supplierNotes: `Reason: ${moneyReason.trim()}`,
        }],
      };
      
      if (directSubmit) {
        saveOrder(newOrder);
        setShowMoneyModal(false);
        setMoneyReason('');
        setMoneyAmount(0);
        router.push('/requests');
      } else {
        const fakeIngredient: IngredientItem = {
          id: `CASH-${Date.now().toString().slice(-4)}`,
          name: `${moneyPurpose} (${moneyCurrency} ${moneyAmount})`,
          category: 'Petty Cash & Tip Advance',
          defaultUnit: moneyCurrency,
          defaultPrice: Number(moneyAmount),
          allowedUnits: ['USD', 'KHR'],
          iconName: 'banknote',
          currentStock: 0,
          parStock: 10,
          isCustom: true,
          requestType: 'stuff',
        };
        const cashOrderItem: OrderItem = {
          ingredient: fakeIngredient,
          quantity: 1,
          unit: moneyCurrency,
          pricePerUnit: Number(moneyAmount),
          totalCost: Number(moneyAmount),
          supplierNotes: `Reason: ${moneyReason.trim()}`
        };
        handleInlineAdd(cashOrderItem);
        setShowMoneyModal(false);
        setMoneyReason('');
        setMoneyAmount(0);
      }
    } catch (err) {
      alert('Error saving cash request');
    } finally {
      setSubmitting(false);
    }
  };

  const isCashItem = (item: OrderItem) => {
    return item.ingredient.category === 'Petty Cash & Tip Advance' ||
           item.ingredient.id.toLowerCase().includes('tip') ||
           item.ingredient.id.toLowerCase().includes('cash') ||
           item.ingredient.name.toLowerCase().includes('cash') ||
           item.ingredient.name.toLowerCase().includes('tip');
  };

  const itemsList = Object.values(orderItems);
  const totalItemCount = itemsList.length;
  const totalUnitsCount = itemsList.reduce((acc, curr) => acc + (isCashItem(curr) ? 1 : curr.quantity), 0);
  const usdSubtotal = useMemo(() => itemsList.reduce((acc, curr) => curr.unit !== 'KHR' ? acc + (curr.totalCost || 0) : acc, 0), [itemsList]);
  const khrSubtotal = useMemo(() => itemsList.reduce((acc, curr) => curr.unit === 'KHR' ? acc + (curr.totalCost || 0) : acc, 0), [itemsList]);

  // Direct Submit from Basket Panel
  const handleSubmitOrder = () => {
    if (itemsList.length === 0 || !user) return;

    setSubmitting(true);

    try {
      const usdSub = itemsList.reduce((acc, curr) => curr.unit !== 'KHR' ? acc + (curr.totalCost || 0) : acc, 0);
      const khrSub = itemsList.reduce((acc, curr) => curr.unit === 'KHR' ? acc + (curr.totalCost || 0) : acc, 0);
      let totalStr = '';
      if (usdSub > 0 && khrSub > 0) {
        totalStr = `$${usdSub.toFixed(2)} USD + ${Math.round(khrSub).toLocaleString()} ៛ KHR`;
      } else if (khrSub > 0) {
        totalStr = `${Math.round(khrSub).toLocaleString()} ៛ KHR`;
      } else {
        totalStr = `$${usdSub.toFixed(2)} USD`;
      }
      
      const hasCashItems = itemsList.some(isCashItem);
      const roleLabel = requesterRole === 'manager' ? 'Manager' : (requesterRole === 'staff' ? 'Kitchen Staff' : 'Service & FOH');
      const targetLabel = requestedFrom === 'manager' ? 'Manager' : (requestedFrom === 'purchaser' ? 'Purchaser' : 'Accounting');
      
      const newOrder: OrderRequest = {
        id: `ORD-${Date.now().toString().slice(-6)}`,
        status: 'pending',
        date: new Date().toISOString().split('T')[0],
        total: totalStr,
        currency: currency,
        requestType: hasCashItems ? 'stuff' : 'glossary',
        requesterRole: requesterRole,
        requestedFrom: requestedFrom,
        createdBy: `${user.name} [${roleLabel}] → Req from ${targetLabel}`,
        notes: `Requisition submitted via ${roleLabel} workflow (${itemsList.length} items). Target Delivery: ${deliveryDate}, Priority: ${priority}, Requested from: ${targetLabel}.`,
        items: itemsList.map((item, idx) => ({
          id: `item-${idx + 1}`,
          name: item.ingredient.name,
          unit: item.unit,
          ordered: isCashItem(item) ? 1 : item.quantity,
          icon: item.ingredient.iconName,
          category: item.ingredient.category,
          estimatedPrice: item.pricePerUnit || item.totalCost,
          supplierNotes: item.supplierNotes || (isCashItem(item) ? 'Reason: Cash/Tip Advance' : undefined),
        })),
      };
      
      saveOrder(newOrder);
      setShowReviewModal(false);
      router.push('/requests');
    } catch (err) {
      alert('Error submitting request / មានបញ្ហាក្នុងការបញ្ជូន');
      setSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500 font-bold">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <AppLayout 
      title={t('market.title')} 
      subtitle={t('market.subtitle')}
    >
      <div className="max-w-[1440px] mx-auto pb-24 space-y-6">
        
        {/* TOP CONFIG STRIP */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end relative z-20">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-primary" />
              <span>Target Date <span className="text-red-500">*</span></span>
            </label>
            <input
              type="date"
              required
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
              className="w-full h-11 px-3 rounded-xl border border-slate-300 bg-white font-bold text-sm text-slate-800 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 cursor-pointer"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-primary" />
              <span>Priority</span>
            </label>
            <Select value={priority} onValueChange={(val: any) => val && setPriority(val)}>
              <SelectTrigger className="w-full h-11 px-3 rounded-xl border border-slate-300 bg-white font-bold text-sm text-slate-800 focus:outline-none focus:border-primary shadow-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl z-50">
                <SelectItem value="normal">Normal / ធម្មតា</SelectItem>
                <SelectItem value="urgent">Urgent / បន្ទាន់</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5 flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-primary" />
              <span>Request From (Target)</span>
            </label>
            <Select value={requestedFrom} onValueChange={(val: any) => val && setRequestedFrom(val)}>
              <SelectTrigger className="w-full h-11 px-3 rounded-xl border border-slate-300 bg-white font-bold text-sm text-slate-800 focus:outline-none focus:border-primary shadow-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl z-50">
                <SelectItem value="manager">Restaurant Manager (Approval / Cash)</SelectItem>
                <SelectItem value="purchaser">Morning Market Purchaser</SelectItem>
                <SelectItem value="accounting">Accounting & Finance</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5 flex items-center gap-1.5">
              <span className="text-primary font-black">៛/$</span>
              <span>Currency</span>
            </label>
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold h-11">
              <button
                type="button"
                onClick={() => setCurrency('USD')}
                className={`flex-1 h-full rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  currency === 'USD' ? 'bg-white text-blue-600 shadow-2xs font-black' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                $ USD
              </button>
              <button
                type="button"
                onClick={() => setCurrency('KHR')}
                className={`flex-1 h-full rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  currency === 'KHR' ? 'bg-white text-orange-600 shadow-2xs font-black' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                ៛ KHR
              </button>
            </div>
          </div>
        </div>

        {/* HEADER & ROLE / DEPARTMENT FILTER BAR */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl font-bold flex items-center justify-center shadow-md bg-primary text-primary-foreground">
                <Store className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight mt-1">
                  Unified Requisition Catalog
                </h1>
                <span className="text-xs text-slate-500 font-medium">Request food ingredients, FOH supplies, or money advances</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              <button
                type="button"
                onClick={() => setShowMoneyModal(true)}
                className="whitespace-nowrap px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm flex items-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer border border-emerald-500/30"
              >
                <DollarSign className="w-4 h-4 stroke-[3] text-amber-300" />
                <span>Request Money / Cash Advance</span>
              </button>
              <button
                type="button"
                onClick={() => setShowCustomModal(true)}
                className="whitespace-nowrap px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-xs transition-all active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4 text-primary stroke-[3]" />
                <span>Add Custom Item</span>
              </button>
            </div>
          </div>

          {/* ROLE & DEPARTMENT SWITCHER STRIP */}
          <div className="space-y-2">
            <label className="block text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <span>⚡ Active Requisition Role / Department Workflow:</span>
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => handleRoleChange('manager')}
                className={`flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all text-left cursor-pointer ${
                  requesterRole === 'manager'
                    ? 'bg-indigo-50/80 border-indigo-600 ring-2 ring-indigo-500/20 shadow-sm scale-[1.01]'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100/80'
                }`}
              >
                <div className={`p-2 rounded-lg transition-colors ${
                  requesterRole === 'manager' ? 'bg-indigo-600 text-white font-bold shadow-2xs' : 'bg-white text-slate-600 border border-slate-200'
                }`}>
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center justify-between">
                    <span className={`font-black text-sm ${requesterRole === 'manager' ? 'text-indigo-950' : 'text-slate-700'}`}>
                      Manager
                    </span>
                    {requesterRole === 'manager' && (
                      <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-indigo-600 text-white">Active</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 font-medium truncate">Full Catalog + Cash / Money Request</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleRoleChange('staff')}
                className={`flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all text-left cursor-pointer ${
                  requesterRole === 'staff'
                    ? 'bg-amber-50/80 border-amber-600 ring-2 ring-amber-500/20 shadow-sm scale-[1.01]'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100/80'
                }`}
              >
                <div className={`p-2 rounded-lg transition-colors ${
                  requesterRole === 'staff' ? 'bg-amber-600 text-white font-bold shadow-2xs' : 'bg-white text-slate-600 border border-slate-200'
                }`}>
                  <Utensils className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center justify-between">
                    <span className={`font-black text-sm ${requesterRole === 'staff' ? 'text-amber-950' : 'text-slate-700'}`}>
                      🍳 Kitchen Staff
                    </span>
                    {requesterRole === 'staff' && (
                      <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-600 text-white">Active</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 font-medium truncate">Buying Food & Kitchen Tools</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleRoleChange('service')}
                className={`flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all text-left cursor-pointer ${
                  requesterRole === 'service'
                    ? 'bg-emerald-50/80 border-emerald-600 ring-2 ring-emerald-500/20 shadow-sm scale-[1.01]'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100/80'
                }`}
              >
                <div className={`p-2 rounded-lg transition-colors ${
                  requesterRole === 'service' ? 'bg-emerald-600 text-white font-bold shadow-2xs' : 'bg-white text-slate-600 border border-slate-200'
                }`}>
                  <GlassWater className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center justify-between">
                    <span className={`font-black text-sm ${requesterRole === 'service' ? 'text-emerald-950' : 'text-slate-700'}`}>
                      🍸 Service / Bar
                    </span>
                    {requesterRole === 'service' && (
                      <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-600 text-white">Active</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 font-medium truncate">Buying FOH Stuff & Money Request</p>
                </div>
              </button>
            </div>
          </div>

          {/* Compact Search Bar */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('market.searchPlaceholder')}
                className="w-full h-12 pl-12 pr-32 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all shadow-inner"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                <span className="hidden sm:inline-flex items-center gap-1 bg-slate-200/80 text-slate-600 px-2.5 py-1 rounded-lg text-xs font-bold border border-slate-300/50">
                  <span>{filteredIngredients.length} items</span>
                </span>
              </div>
            </div>
          </div>

          <CategoryBar
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            categories={activeCategories}
            catalog={activeCatalog}
          />
        </div>

        {/* WORKSPACE */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-8 space-y-4">
            <IngredientList
              items={filteredIngredients}
              selectedCategory={selectedCategory}
              orderItems={orderItems}
              onInlineAdd={handleInlineAdd}
              onInlineRemove={handleInlineRemove}
              currency={currency}
              onCurrencyChange={setCurrency}
            />
          </div>

          <div className="hidden lg:block lg:col-span-4">
            <BasketPanel
              orderItems={orderItems}
              onEditItem={(item) => setActiveModalItem({ ingredient: item.ingredient, orderItem: item })}
              onRemoveItem={handleInlineRemove}
              onClearBasket={handleClearBasket}
              onSubmitOrder={() => setShowReviewModal(true)}
              submitting={submitting}
              currency={currency}
            />
          </div>
        </div>
      </div>

      {/* MOBILE BOTTOM BAR & DRAWER */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-slate-900 text-white p-4 border-t border-slate-800 shadow-2xl flex items-center justify-between gap-4">
        <div onClick={() => setShowMobileBasket(true)} className="flex items-center gap-3 cursor-pointer flex-1 min-w-0">
          <div className="relative p-2.5 bg-primary text-primary-foreground font-bold rounded-xl">
            <ShoppingCart className="w-5 h-5 stroke-[2.5]" />
            {totalItemCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white font-black text-[10px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-slate-900 animate-pulse">
                {totalItemCount}
              </span>
            )}
          </div>
          <div className="min-w-0">
            <span className="text-xs text-slate-400 font-bold block uppercase tracking-wider">
              {totalItemCount === 0 ? t('basket.listEmpty') : `${totalItemCount} ${t('basket.items')}`}
            </span>
            <div className="text-sm font-black text-white flex flex-col leading-tight mt-0.5">
              <span className="text-emerald-400 truncate">${usdSubtotal.toFixed(2)} USD</span>
              <span className="text-amber-400 truncate">{Math.round(khrSubtotal).toLocaleString()} ៛ KHR</span>
            </div>
          </div>
        </div>
        <button
          onClick={() => {
            if (totalItemCount > 0) setShowReviewModal(true);
          }}
          disabled={totalItemCount === 0 || submitting}
          className="whitespace-nowrap bg-[#0A8F4D] hover:bg-[#08733E] text-white font-black shadow-lg shadow-emerald-700/20 py-3.5 px-6 rounded-xl flex items-center gap-2 active:scale-95 disabled:opacity-40 text-sm cursor-pointer border border-[#0A8F4D]/30"
        >
          <span>{submitting ? 'Sending...' : 'Review & Submit'}</span>
          <ArrowRight className="w-4 h-4 stroke-[3]" />
        </button>
      </div>

      {/* MOBILE BASKET MODAL */}
      <Modal isOpen={showMobileBasket} onClose={() => setShowMobileBasket(false)} title={t('basket.title')}>
        <div className="p-4">
          <BasketPanel
            orderItems={orderItems}
            onEditItem={(item) => {
              setShowMobileBasket(false);
              setActiveModalItem({ ingredient: item.ingredient, orderItem: item });
            }}
            onRemoveItem={handleInlineRemove}
            onClearBasket={handleClearBasket}
            onSubmitOrder={() => {
              setShowMobileBasket(false);
              setShowReviewModal(true);
            }}
            submitting={submitting}
            currency={currency}
          />
        </div>
      </Modal>

      {/* ADVANCED EDIT MODAL */}
      <OrderModal
        isOpen={!!activeModalItem}
        onClose={() => setActiveModalItem(null)}
        ingredient={activeModalItem?.ingredient || null}
        initialOrderItem={activeModalItem?.orderItem}
        onSave={handleInlineAdd}
      />

      {/* ADD CUSTOM INGREDIENT MODAL */}
      <Modal isOpen={showCustomModal} onClose={() => setShowCustomModal(false)} title="Add Custom Item" maxWidthClassName="max-w-xl">
        <form onSubmit={handleCreateCustomItem} className="p-6 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block mb-1.5 text-xs font-bold uppercase text-slate-700 tracking-wider">
                Item Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="e.g. Premium Truffle Oil or Tip Advance"
                className="w-full h-12 px-4 rounded-xl border border-slate-300 bg-white font-bold text-sm focus:outline-none focus:border-slate-800"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1.5 text-xs font-bold uppercase text-slate-700 tracking-wider">
                  Category <span className="text-red-500">*</span>
                </label>
                <Select value={customCategory} onValueChange={(val: any) => val && setCustomCategory(val)}>
                  <SelectTrigger className="w-full h-12 px-3.5 rounded-xl border border-slate-300 bg-white font-bold text-sm focus:border-slate-800 shadow-none z-50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="z-[70]">
                    {activeCategories.filter(c => c.id !== 'all').map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {customCategory === 'Petty Cash & Tip Advance' ? (
                <div>
                  <label className="block mb-1.5 text-xs font-bold uppercase text-slate-700 tracking-wider">Amount <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={customPrice || ''}
                    onChange={(e) => setCustomPrice(parseFloat(e.target.value) || 0)}
                    className="w-full h-12 px-4 rounded-xl border border-slate-300 bg-white font-bold text-sm focus:outline-none focus:border-slate-800"
                  />
                </div>
              ) : (
                <div>
                  <label className="block mb-1.5 text-xs font-bold uppercase text-slate-700 tracking-wider">Default Unit <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={customUnit}
                    onChange={(e) => setCustomUnit(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl border border-slate-300 bg-white font-bold text-sm focus:outline-none focus:border-slate-800"
                  />
                </div>
              )}
            </div>
          </div>
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-200">
            <button type="button" onClick={() => setShowCustomModal(false)} className="px-5 py-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 font-bold text-sm text-slate-700">Cancel</button>
            <button type="submit" className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-black text-sm shadow-md hover:bg-primary-hover flex items-center gap-2">Add Item</button>
          </div>
        </form>
      </Modal>

      {/* REQUEST MONEY / CASH ADVANCE WITH REASON MODAL */}
      <Modal
        isOpen={showMoneyModal}
        onClose={() => setShowMoneyModal(false)}
        title="Request Money / Cash Advance"
      >
        <div className="space-y-5 pt-2">
          <p className="text-xs text-slate-500 font-medium leading-relaxed -mt-1">
            Submit a cash advance, tip payout, or petty cash request with a clear justification.
          </p>
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 flex items-start gap-3">
            <Banknote className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <p className="text-xs text-emerald-900 leading-relaxed font-medium">
              <strong>Audit Policy:</strong> Every cash advance or money requisition requires a specific, auditable reason. Direct submissions will be routed immediately to the <span className="inline-flex items-center gap-1 font-bold text-emerald-950"><Crown className="w-3.5 h-3.5 text-emerald-700 inline -mt-0.5" /> Restaurant Manager</span> for review.
            </p>
          </div>

          <div>
            <label className="block mb-1.5 text-xs font-bold uppercase text-slate-700 tracking-wider">
              Purpose / Category <span className="text-red-500">*</span>
            </label>
            <Select value={moneyPurpose} onValueChange={(val: any) => val && setMoneyPurpose(val)}>
              <SelectTrigger className="w-full h-auto min-h-12 py-2.5 px-3.5 rounded-xl border border-slate-300 bg-white font-bold text-sm focus:border-slate-800 shadow-none z-50 text-left">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="z-[70] max-w-lg">
                <SelectItem value="Tip Advance Payout (ដកប្រាក់រង្វាន់ Tip មុនកាលកំណត់)" className="py-2">
                  <div className="flex flex-col text-left">
                    <span className="font-bold text-sm text-slate-900 leading-tight">Tip Advance Payout</span>
                    <span className="text-xs font-medium text-slate-500 leading-tight mt-0.5">ដកប្រាក់រង្វាន់ Tip មុនកាលកំណត់</span>
                  </div>
                </SelectItem>
                <SelectItem value="Petty Cash for Local Market (ប្រាក់ស្បៀងទិញផ្សារបន្ទាន់)" className="py-2">
                  <div className="flex flex-col text-left">
                    <span className="font-bold text-sm text-slate-900 leading-tight">Petty Cash for Local Market</span>
                    <span className="text-xs font-medium text-slate-500 leading-tight mt-0.5">ប្រាក់ស្បៀងទិញផ្សារបន្ទាន់</span>
                  </div>
                </SelectItem>
                <SelectItem value="Transport / TukTuk Reimbursement (ប្រាក់ថ្លៃដឹកជញ្ជូន)" className="py-2">
                  <div className="flex flex-col text-left">
                    <span className="font-bold text-sm text-slate-900 leading-tight">Transport / TukTuk Reimbursement</span>
                    <span className="text-xs font-medium text-slate-500 leading-tight mt-0.5">ប្រាក់ថ្លៃដឹកជញ្ជូន</span>
                  </div>
                </SelectItem>
                <SelectItem value="Emergency Supply Purchase (ប្រាក់ទិញសម្ភារៈបន្ទាន់)" className="py-2">
                  <div className="flex flex-col text-left">
                    <span className="font-bold text-sm text-slate-900 leading-tight">Emergency Supply Purchase</span>
                    <span className="text-xs font-medium text-slate-500 leading-tight mt-0.5">ប្រាក់ទិញសម្ភារៈបន្ទាន់</span>
                  </div>
                </SelectItem>
                <SelectItem value="Staff Welfare / Advance (ប្រាក់បុរេប្រទានបុគ្គលិក)" className="py-2">
                  <div className="flex flex-col text-left">
                    <span className="font-bold text-sm text-slate-900 leading-tight">Staff Welfare / Salary Advance</span>
                    <span className="text-xs font-medium text-slate-500 leading-tight mt-0.5">ប្រាក់បុរេប្រទានបុគ្គលិក</span>
                  </div>
                </SelectItem>
                <SelectItem value="Other Cash Advance (ផ្សេងៗ)" className="py-2">
                  <div className="flex flex-col text-left">
                    <span className="font-bold text-sm text-slate-900 leading-tight">Other Cash Advance</span>
                    <span className="text-xs font-medium text-slate-500 leading-tight mt-0.5">ផ្សេងៗ</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1.5 text-xs font-bold uppercase text-slate-700 tracking-wider">
                Amount <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                placeholder=""
                value={moneyAmount || ''}
                onChange={(e) => setMoneyAmount(parseFloat(e.target.value) || 0)}
                className="w-full h-12 px-4 rounded-xl border border-slate-300 bg-white font-black text-base text-emerald-700 focus:outline-none focus:border-emerald-600"
              />
            </div>
            <div>
              <label className="block mb-1.5 text-xs font-bold uppercase text-slate-700 tracking-wider">
                Currency <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center bg-slate-100 p-1.5 rounded-xl border border-slate-200 font-bold text-xs h-12">
                <button
                  type="button"
                  onClick={() => setMoneyCurrency('USD')}
                  className={`flex-1 h-full rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 ${
                    moneyCurrency === 'USD' ? 'bg-white text-blue-600 shadow-xs font-black' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  $ USD
                </button>
                <button
                  type="button"
                  onClick={() => setMoneyCurrency('KHR')}
                  className={`flex-1 h-full rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 ${
                    moneyCurrency === 'KHR' ? 'bg-white text-orange-600 shadow-xs font-black' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  ៛ KHR
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block mb-1 text-xs font-bold uppercase text-slate-700 tracking-wider">
              Detailed Reason / Justification <span className="text-red-500">*</span>
            </label>
            <p className="text-[11px] font-medium text-slate-500 mb-2">
              Required for audit approval and manager review
            </p>
            <textarea
              required
              rows={3}
              placeholder="e.g., Need $30 tip payout for family medical emergency, or 120,000៛ to pay local farmer delivery for fresh river fish..."
              value={moneyReason}
              onChange={(e) => setMoneyReason(e.target.value)}
              className="w-full p-3.5 rounded-xl border border-slate-300 bg-white font-medium text-sm text-slate-800 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 leading-relaxed"
            />
          </div>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-end gap-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setShowMoneyModal(false)}
              className="w-full sm:w-auto min-h-[48px] px-5 py-3.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 font-bold text-sm text-slate-700 cursor-pointer order-3 sm:order-1 flex items-center justify-center"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={(e) => handleCreateMoneyRequest(e, false)}
              className="w-full sm:w-auto min-h-[48px] px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-sm shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2.5 order-1 sm:order-2 border border-slate-800"
            >
              <Plus className="w-4 h-4 shrink-0 text-primary stroke-[3]" />
              <span>Add to Basket</span>
            </button>
            <button
              type="button"
              onClick={(e) => handleCreateMoneyRequest(e, true)}
              className="w-full sm:w-auto min-h-[48px] px-6 py-3.5 rounded-xl bg-[#0A8F4D] hover:bg-[#08733E] text-white font-black text-sm shadow-md shadow-emerald-700/20 transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2.5 order-2 sm:order-3 border border-[#0A8F4D]/30"
            >
              <Send className="w-4 h-4 shrink-0 text-white" />
              <span>Submit Directly</span>
            </button>
          </div>
        </div>
      </Modal>

      {/* REVIEW & SUBMIT CONFIRMATION MODAL */}
      <Modal
        isOpen={showReviewModal}
        onClose={() => !submitting && setShowReviewModal(false)}
        title={t('review.title')}
        maxWidthClassName="max-w-3xl"
      >
        <div className="space-y-6 pt-2">
          {/* Top Summary Header Banner */}
          <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-slate-800">
            <div className="space-y-1.5 min-w-0">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                {t('review.totalCost')} • {totalItemCount} {t('basket.items')} • {totalUnitsCount} {t('basket.units')}
              </span>
              <div className="flex flex-wrap items-center gap-4 pt-1">
                <div className="flex items-baseline gap-1.5 bg-slate-800/90 px-3.5 py-1.5 rounded-xl border border-slate-700">
                  <span className="text-xs font-bold text-slate-400">USD:</span>
                  <span className="text-2xl font-black text-emerald-400 tabular-nums">${usdSubtotal.toFixed(2)} USD</span>
                </div>
                <div className="flex items-baseline gap-1.5 bg-slate-800/90 px-3.5 py-1.5 rounded-xl border border-slate-700">
                  <span className="text-xs font-bold text-slate-400">KHR:</span>
                  <span className="text-2xl font-black text-amber-400 tabular-nums">{Math.round(khrSubtotal).toLocaleString()} ៛ KHR</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-1.5 sm:items-end text-xs w-full sm:w-auto bg-slate-800/80 p-3 rounded-xl border border-slate-700/80">
              <div className="flex items-center gap-1.5 text-slate-300">
                <Calendar className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="font-bold">{t('review.targetDate')}:</span>
                <span className="text-white font-extrabold">{deliveryDate || 'Standard Next Morning'}</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-300">
                <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="font-bold">{t('review.priority')}:</span>
                <span className={`font-black ${priority === 'urgent' ? 'text-red-400' : 'text-emerald-400'}`}>
                  {priority === 'urgent' ? t('review.priorityUrgent') : t('review.priorityNormal')}
                </span>
              </div>
            </div>
          </div>

          {/* Selected Ingredients & Requisition Items List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black uppercase text-slate-700 tracking-wider">
                {t('review.selectedItems')} ({itemsList.length})
              </h4>
            </div>

            <div className="max-h-80 overflow-y-auto space-y-2.5 pr-1 divide-y divide-slate-100 rounded-2xl border border-slate-200 p-3 bg-slate-50/50">
              {itemsList.map((item, idx) => {
                const itemIsCash = isCashItem(item);
                const itemTotal = item.totalCost;
                return (
                  <div key={`${item.ingredient.id}-${idx}`} className="pt-2.5 first:pt-0 flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-center text-lg shrink-0">
                        {renderIngredientIcon(item.ingredient.iconName)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-sm text-slate-900 leading-tight">
                          {item.ingredient.name}
                        </div>
                        <span className="text-xs font-medium text-slate-500 block mt-0.5">
                          {itemIsCash ? (
                            <span className="text-emerald-700 font-semibold">
                              {item.supplierNotes ? item.supplierNotes : 'Staff Member / Beneficiary'}
                            </span>
                          ) : (
                            <span>
                              {item.quantity} {item.unit} × {item.unit === 'KHR' ? `${Math.round(item.pricePerUnit).toLocaleString()} ៛` : `$${item.pricePerUnit.toFixed(2)}`}
                            </span>
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-sm font-black text-slate-900 tabular-nums">
                        {item.unit === 'KHR'
                          ? `${Math.round(itemTotal).toLocaleString()} ៛`
                          : `$${itemTotal.toFixed(2)}`}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Final Actions / High-Contrast Submit Buttons */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-end gap-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setShowReviewModal(false)}
              disabled={submitting}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold text-sm transition-all cursor-pointer shadow-2xs order-2 sm:order-1"
            >
              Cancel / Back to Edit
            </button>
            <button
              type="button"
              onClick={handleSubmitOrder}
              disabled={submitting || itemsList.length === 0}
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-[#0A8F4D] hover:bg-[#08733E] text-white font-black text-base shadow-lg shadow-emerald-700/20 transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2.5 order-1 sm:order-2 border border-[#0A8F4D]/30"
            >
              {submitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>{t('basket.sending')}</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                  <span>{t('review.confirmSend')}</span>
                  <ArrowRight className="w-5 h-5 stroke-[2.5]" />
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>
    </AppLayout>
  );
}
