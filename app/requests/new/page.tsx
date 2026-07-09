'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/app-layout';
import { useAuth } from '@/lib/auth-context';
import { useTranslation } from '@/lib/i18n';
import { Modal } from '@/components/shared/modal';
import { 
  Store, Search, Filter, Plus, Calendar, Clock, ShoppingCart, 
  CheckCircle2, AlertCircle, ArrowRight, LayoutGrid, Package, ChevronRight,
  Beef, GlassWater, DollarSign, Sparkles
} from 'lucide-react';

import { 
  IngredientItem, OrderItem, MARKET_CATEGORIES, DEFAULT_MARKET_CATALOG,
  STUFF_CATEGORIES, DEFAULT_STUFF_CATALOG, ALL_AVAILABLE_UNITS, ALL_STUFF_UNITS
} from '@/types/market';
import { getOrders, saveOrder, OrderRequest } from '@/lib/orders';
import { CategoryBar } from '@/components/market/category-bar';
import { IngredientList } from '@/components/market/ingredient-list';
import { BasketPanel } from '@/components/market/basket-panel';
import { OrderModal } from '@/components/market/order-modal';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function NewMarketOrderPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { t, tBi, language } = useTranslation();

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  // Request Mode State: 'glossary' (food ingredients) vs 'stuff' (glassware/supplies/tip advance)
  const [requestMode, setRequestMode] = useState<'glossary' | 'stuff'>('glossary');

  // Master Catalog States & Custom Items
  const [customItems, setCustomItems] = useState<IngredientItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Active Categories & Active Catalog computed dynamically based on requestMode
  const activeCategories = useMemo(() => {
    return requestMode === 'glossary' ? MARKET_CATEGORIES : STUFF_CATEGORIES;
  }, [requestMode]);

  const activeCatalog = useMemo(() => {
    const base = requestMode === 'glossary' ? DEFAULT_MARKET_CATALOG : DEFAULT_STUFF_CATALOG;
    const filteredCustom = customItems.filter(i => 
      (i.requestType || 'glossary') === requestMode &&
      !i.nameEn.toLowerCase().includes('fff') &&
      !i.nameEn.toLowerCase().includes('gggg') &&
      !i.id.toLowerCase().includes('fff') &&
      !i.id.toLowerCase().includes('gggg')
    );
    return [...filteredCustom, ...base];
  }, [requestMode, customItems]);

  // Basket State: Map ingredientId -> OrderItem
  const [orderItems, setOrderItems] = useState<Record<string, OrderItem>>({});

  // Active Modal States
  const [activeModalItem, setActiveModalItem] = useState<{
    ingredient: IngredientItem;
    orderItem?: OrderItem;
  } | null>(null);

  const [showCustomModal, setShowCustomModal] = useState<boolean>(false);
  const [showReviewModal, setShowReviewModal] = useState<boolean>(false);
  const [showMobileBasket, setShowMobileBasket] = useState<boolean>(false);

  // Custom Item Form State
  const [customNameEn, setCustomNameEn] = useState('');
  const [customNameKh, setCustomNameKh] = useState('');
  const [customCategory, setCustomCategory] = useState<string>(MARKET_CATEGORIES[1]?.id || 'Meat & Poultry');
  const [customUnit, setCustomUnit] = useState('kg');
  const [customPrice, setCustomPrice] = useState<number>(0);

  // Checkout Review Form State
  const [deliveryDate, setDeliveryDate] = useState<string>('');
  const [priority, setPriority] = useState<'normal' | 'urgent' | 'scheduled'>('normal');
  const [currency, setCurrency] = useState<'KHR' | 'USD'>('KHR');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submittedSuccess, setSubmittedSuccess] = useState<boolean>(false);

  // Initialize delivery date
  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yyyy = tomorrow.getFullYear();
    const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const dd = String(tomorrow.getDate()).padStart(2, '0');
    setDeliveryDate(`${yyyy}-${mm}-${dd}`);
  }, []);

  // When requestMode switches, reset category filter and default form options
  const handleModeChange = (mode: 'glossary' | 'stuff') => {
    setRequestMode(mode);
    setSelectedCategory('all');
    if (mode === 'stuff') {
      setCustomCategory(STUFF_CATEGORIES[1]?.id || 'Glassware & Tableware');
      setCustomUnit('piece');
      setCurrency('USD'); // Default stuff to USD easily
    } else {
      setCustomCategory(MARKET_CATEGORIES[1]?.id || 'Meat & Poultry');
      setCustomUnit('kg');
      setCurrency('KHR');
    }
  };

  // Filter Ingredients based on Category and Search Query (Bilingual search)
  const filteredIngredients = useMemo(() => {
    return activeCatalog.filter((item) => {
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      if (!matchesCategory) return false;

      if (!searchQuery.trim()) return true;

      const query = searchQuery.toLowerCase().trim();
      const matchEn = item.nameEn.toLowerCase().includes(query);
      const matchKh = item.nameKh ? item.nameKh.toLowerCase().includes(query) : false;
      const matchCat = item.category.toLowerCase().includes(query);

      return matchEn || matchKh || matchCat;
    });
  }, [activeCatalog, selectedCategory, searchQuery]);

  // Handle clicking an ingredient row
  const handleSelectIngredient = (ingredient: IngredientItem) => {
    const existing = orderItems[ingredient.id];
    setActiveModalItem({
      ingredient,
      orderItem: existing,
    });
  };

  // Save item from Modal into Basket
  const handleSaveOrderItem = (item: OrderItem) => {
    setOrderItems((prev) => ({
      ...prev,
      [item.ingredient.id]: item,
    }));
  };

  // Remove item from Basket
  const handleRemoveOrderItem = (ingredientId: string) => {
    setOrderItems((prev) => {
      const next = { ...prev };
      delete next[ingredientId];
      return next;
    });
  };

  // Clear entire Basket
  const handleClearBasket = () => {
    if (confirm('Are you sure you want to clear your shopping list? / តើអ្នកពិតជាចង់លុបបញ្ជីមែនទេ?')) {
      setOrderItems({});
    }
  };

  // Handle creating a Custom Market Item
  const handleCreateCustomItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customNameEn.trim()) return;

    const newId = `custom-${Date.now()}`;
    const newIngredient: IngredientItem = {
      id: newId,
      nameEn: customNameEn.trim(),
      nameKh: customNameKh.trim() || customNameEn.trim(),
      category: customCategory,
      defaultUnit: customCategory === 'Petty Cash & Tip Advance' ? currency : customUnit,
      defaultPrice: Number(customPrice) || 0,
      allowedUnits: customCategory === 'Petty Cash & Tip Advance'
        ? ['USD', 'KHR']
        : (requestMode === 'stuff' 
            ? ['piece', 'set', 'box', 'pack', 'bottle', 'gallon', 'tank', 'pair', 'roll']
            : ['kg', 'gram', 'piece', 'pack', 'box', 'can', 'bottle', 'bunch', 'liter']),
      iconName: requestMode === 'stuff' ? 'GlassWater' : 'Sparkles',
      currentStock: 0,
      parStock: 10,
      isCustom: true,
      requestType: requestMode,
    };

    setCustomItems((prev) => [newIngredient, ...prev]);
    setShowCustomModal(false);

    const newOrderItem: OrderItem = {
      ingredient: newIngredient,
      quantity: 1,
      unit: newIngredient.defaultUnit,
      pricePerUnit: newIngredient.defaultPrice,
      totalCost: newIngredient.defaultPrice,
      supplier: customCategory === 'Petty Cash & Tip Advance' ? 'Staff Member / Beneficiary' : (requestMode === 'stuff' ? 'Standard Equipment Vendor' : 'Local Market Vendor'),
      notes: customNameKh.trim() || customNameEn.trim(),
    };

    handleSaveOrderItem(newOrderItem);

    setCustomNameEn('');
    setCustomNameKh('');
    setCustomPrice(0);
  };

  const isCashItem = (item: OrderItem) => {
    return item.ingredient.category === 'Petty Cash & Tip Advance' ||
           item.ingredient.id.toLowerCase().includes('tip') ||
           item.ingredient.id.toLowerCase().includes('cash') ||
           item.ingredient.id.toLowerCase().includes('money') ||
           item.ingredient.id.toLowerCase().includes('reimburse') ||
           item.ingredient.nameEn.toLowerCase().includes('cash') ||
           item.ingredient.nameEn.toLowerCase().includes('tip');
  };

  const calculateTotalCostInCurrency = (items: OrderItem[], targetCurrency: 'KHR' | 'USD') => {
    return items.reduce((sum, item) => {
      if (isCashItem(item)) {
        if (targetCurrency === 'KHR') {
          return sum + (item.unit === 'KHR' ? item.totalCost : item.totalCost * 4000);
        } else {
          return sum + (item.unit === 'KHR' ? item.totalCost / 4000 : item.totalCost);
        }
      } else {
        return sum + (targetCurrency === 'KHR' ? item.totalCost * 4000 : item.totalCost);
      }
    }, 0);
  };

  // Submit Final Market List
  const handleSubmitOrder = () => {
    const itemsList = Object.values(orderItems);
    if (itemsList.length === 0 || !user) return;

    setSubmitting(true);

    try {
      const finalTotalCost = calculateTotalCostInCurrency(itemsList, currency);
      const totalStr = currency === 'KHR'
        ? `${Math.round(finalTotalCost).toLocaleString()} ៛`
        : `$${finalTotalCost.toFixed(2)}`;
      
      const newOrder: OrderRequest = {
        id: `ORD-${Date.now().toString().slice(-6)}`,
        status: 'pending',
        date: new Date().toISOString().split('T')[0],
        total: totalStr,
        currency: currency,
        requestType: requestMode,
        createdBy: user.name,
        notes: `${requestMode === 'stuff' ? 'Supplies, Glassware & Cash Requisition' : 'Market Shopping List'} submitted by ${user.name} (${itemsList.length} items selected). Delivery Date: ${deliveryDate}, Priority: ${priority}, Currency: ${currency}`,
        items: itemsList.map((item, idx) => ({
          id: `item-${idx + 1}`,
          nameEn: item.ingredient.nameEn,
          nameKh: item.ingredient.nameKh || item.ingredient.nameEn,
          unit: item.unit,
          ordered: item.quantity,
          icon: item.ingredient.iconName,
        })),
      };
      
      saveOrder(newOrder);

      setSubmitting(false);
      setSubmittedSuccess(true);

      setTimeout(() => {
        router.push('/requests');
      }, 1200);
    } catch (err) {
      alert('Error submitting market order / មានបញ្ហាក្នុងការបញ្ជូន');
      setSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500 font-bold">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <span>{t('common.loading')}</span>
        </div>
      </div>
    );
  }

  const itemsList = Object.values(orderItems);
  const totalItemCount = itemsList.length;
  const totalUnitsCount = itemsList.reduce((acc, curr) => acc + curr.quantity, 0);
  const estimatedTotalCost = useMemo(() => calculateTotalCostInCurrency(itemsList, currency), [itemsList, currency]);

  const formatMoney = (val: number) => currency === 'KHR' ? `${(val * 4000).toLocaleString()} ៛` : `$${val.toFixed(2)}`;

  return (
    <AppLayout 
      title={requestMode === 'stuff' ? t('market.stuffTitle') : t('market.title')} 
      subtitle={requestMode === 'stuff' ? t('market.stuffSubtitle') : t('market.subtitle')}
    >
      <div className="max-w-[1440px] mx-auto pb-24 space-y-6">
        {/* SECTION 1: HEADER & FILTER NAVIGATION */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-5">
          {/* Top Brand Bar & Shift Status */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div className="flex items-center gap-3.5">
              <div className={`w-12 h-12 rounded-2xl font-bold flex items-center justify-center shadow-md flex-shrink-0 transition-colors ${
                requestMode === 'stuff' ? 'bg-amber-600 text-white' : 'bg-primary text-primary-foreground'
              }`}>
                {requestMode === 'stuff' ? <GlassWater className="w-6 h-6 stroke-[2.5]" /> : <Store className="w-6 h-6 stroke-[2.5]" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-wider border bg-slate-100 text-slate-700 border-slate-200 shadow-2xs">
                    {requestMode === 'stuff' ? '⚡ ACTIVE SHIFT: CASH & SUPPLY REQUISITION' : '⚡ ACTIVE SHIFT: MORNING MARKET'}
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1">
                  {requestMode === 'stuff' ? 'Supplies, Equipment & Cash Requisition' : "Chef's Market Glossary"}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-3 self-end sm:self-auto">
              {/* Intentional Black CTA: Add Custom Item */}
              <button
                type="button"
                onClick={() => setShowCustomModal(true)}
                className="whitespace-nowrap px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-xs transition-all active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4 text-primary stroke-[3]" />
                <span>{requestMode === 'stuff' ? t('market.addCustomStuff') : t('market.addCustomItem')}</span>
              </button>
            </div>
          </div>

          {/* REQUISITION MODE SWITCHER */}
          <div className="space-y-2">
            <label className="block text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <span>🔄 Requisition Mode / ជ្រើសរើសប្រភេទសំណូមពរ</span>
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {/* Mode 1: Glossary (Fresh Food & Pantry) */}
              <button
                type="button"
                onClick={() => handleModeChange('glossary')}
                className={`group flex items-center justify-between p-4 rounded-xl border-2 text-left transition-all cursor-pointer ${
                  requestMode === 'glossary'
                    ? 'bg-primary/10 border-primary shadow-sm shadow-primary/10 ring-2 ring-primary/20 scale-[1.01]'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100/80 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                    requestMode === 'glossary' ? 'bg-primary text-primary-foreground shadow-sm font-bold' : 'bg-white text-slate-600 border border-slate-200'
                  }`}>
                    <Beef className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className={`text-sm sm:text-base font-black tracking-tight leading-snug truncate ${
                      requestMode === 'glossary' ? 'text-slate-900' : 'text-slate-700'
                    }`}>
                      Food Ingredients Catalog
                    </h3>
                  </div>
                </div>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ml-2 ${
                  requestMode === 'glossary' ? 'bg-primary text-primary-foreground font-black' : 'border border-slate-300 text-transparent'
                }`}>
                  ✓
                </div>
              </button>

              {/* Mode 2: Stuff (Glassware, Supplies & Tip Advance) */}
              <button
                type="button"
                onClick={() => handleModeChange('stuff')}
                className={`group flex items-center justify-between p-4 rounded-xl border-2 text-left transition-all cursor-pointer ${
                  requestMode === 'stuff'
                    ? 'bg-amber-500/15 border-amber-600 shadow-sm shadow-amber-500/10 ring-2 ring-amber-500/20 scale-[1.01]'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100/80 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                    requestMode === 'stuff' ? 'bg-amber-600 text-white shadow-sm font-bold' : 'bg-white text-slate-600 border border-slate-200'
                  }`}>
                    <GlassWater className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className={`text-sm sm:text-base font-black tracking-tight leading-snug truncate ${
                        requestMode === 'stuff' ? 'text-slate-900' : 'text-slate-700'
                      }`}>
                        Operational Supplies & Cash
                      </h3>
                      <span className="bg-amber-500 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full shadow-2xs">
                        NEW
                      </span>
                    </div>
                  </div>
                </div>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ml-2 ${
                  requestMode === 'stuff' ? 'bg-amber-600 text-white font-black' : 'border border-slate-300 text-transparent'
                }`}>
                  ✓
                </div>
              </button>
            </div>
          </div>

          {/* Compact Search Bar with Integrated Item Count Badge */}
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
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="text-xs font-bold bg-slate-200 hover:bg-slate-300 text-slate-700 px-2 py-1 rounded-lg transition-colors cursor-pointer"
                  >
                    {t('common.clear')}
                  </button>
                )}
                <span className="hidden sm:inline-flex items-center gap-1 bg-slate-200/80 text-slate-600 px-2.5 py-1 rounded-lg text-xs font-bold border border-slate-300/50">
                  <span>{filteredIngredients.length} items</span>
                </span>
              </div>
            </div>
          </div>

          {/* Category Bar Component (The Single Source of Category Filtering) */}
          <CategoryBar
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            categories={activeCategories}
            catalog={activeCatalog}
          />
        </div>

        {/* SECTION 2: MAIN 2-COLUMN WORKSPACE (Left: Ingredients List, Right: Basket Panel) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN: INGREDIENTS CATALOG (8 columns on desktop) */}
          <div className="lg:col-span-8 space-y-4">
            <IngredientList
              items={filteredIngredients}
              selectedCategory={selectedCategory}
              orderItems={orderItems}
              onSelectIngredient={handleSelectIngredient}
              currency={currency}
              onCurrencyChange={setCurrency}
            />
          </div>

          {/* RIGHT COLUMN: STICKY BASKET PANEL (4 columns on desktop) */}
          <div className="hidden lg:block lg:col-span-4">
            <BasketPanel
              orderItems={orderItems}
              onEditItem={(item) => setActiveModalItem({ ingredient: item.ingredient, orderItem: item })}
              onRemoveItem={handleRemoveOrderItem}
              onClearBasket={handleClearBasket}
              onSubmitOrder={() => setShowReviewModal(true)}
              submitting={submitting}
              currency={currency}
            />
          </div>
        </div>
      </div>

      {/* MOBILE FLOATING BOTTOM BAR & DRAWER (Visible below 1024px) */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-slate-900 text-white p-4 border-t border-slate-800 shadow-2xl flex items-center justify-between gap-4">
        <div 
          onClick={() => setShowMobileBasket(true)}
          className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
        >
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
              {totalItemCount === 0 ? t('basket.listEmpty') : `${totalItemCount} ${t('basket.items')} (${totalUnitsCount} ${t('basket.units')})`}
            </span>
            <div className="text-lg font-black text-white truncate inline-flex items-center gap-1 whitespace-nowrap">
              <span>{currency === 'KHR' ? `${Math.round(estimatedTotalCost).toLocaleString()}` : `$${estimatedTotalCost.toFixed(2)}`}</span>
              {currency === 'KHR' && <span>៛</span>}
              <span className="text-xs font-normal text-slate-400 ml-1">{t('basket.estTotal')}</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            if (totalItemCount > 0) {
              setShowReviewModal(true);
            } else {
              setShowMobileBasket(true);
            }
          }}
          disabled={totalItemCount === 0}
          className="whitespace-nowrap bg-primary text-primary-foreground font-bold shadow-sm hover:bg-primary-hover hover:text-primary active:bg-primary-active active:text-white transition-all py-3 px-5 rounded-xl flex items-center gap-2 active:scale-95 disabled:opacity-40 text-sm flex-shrink-0 cursor-pointer"
        >
          <span>{t('basket.reviewBtn')}</span>
          <ArrowRight className="w-4 h-4 stroke-[3]" />
        </button>
      </div>

      {/* MOBILE BASKET DRAWER MODAL */}
      <Modal
        isOpen={showMobileBasket}
        onClose={() => setShowMobileBasket(false)}
        title={t('basket.title')}
      >
        <div className="p-4">
          <BasketPanel
            orderItems={orderItems}
            onEditItem={(item) => {
              setShowMobileBasket(false);
              setActiveModalItem({ ingredient: item.ingredient, orderItem: item });
            }}
            onRemoveItem={handleRemoveOrderItem}
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

      {/* SECTION 3: MODAL DIALOGS */}
      {/* 1. ORDER ITEM MODAL (Opens when an ingredient row is clicked) */}
      <OrderModal
        isOpen={!!activeModalItem}
        onClose={() => setActiveModalItem(null)}
        ingredient={activeModalItem?.ingredient || null}
        initialOrderItem={activeModalItem?.orderItem}
        onSave={handleSaveOrderItem}
      />

      {/* 2. ADD CUSTOM INGREDIENT MODAL */}
      <Modal
        isOpen={showCustomModal}
        onClose={() => setShowCustomModal(false)}
        title={t('custom.title')}
        maxWidthClassName="max-w-xl sm:max-w-2xl"
      >
        <form onSubmit={handleCreateCustomItem} className="p-6 space-y-6">
          {requestMode === 'stuff' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 bg-slate-100/90 p-2 rounded-2xl border border-slate-200/80 shadow-inner">
              <button
                type="button"
                onClick={() => {
                  setCustomCategory('Glassware & Tableware');
                  setCustomUnit('piece');
                }}
                className={`py-3 px-4 rounded-xl transition-all flex items-center gap-3 cursor-pointer border ${
                  customCategory !== 'Petty Cash & Tip Advance' 
                    ? 'bg-white text-slate-900 border-slate-300/80 shadow-sm font-bold scale-[1.01]' 
                    : 'bg-transparent border-transparent text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <div className={`p-2 rounded-xl flex-shrink-0 transition-colors ${
                  customCategory !== 'Petty Cash & Tip Advance' ? 'bg-amber-100 text-amber-700 shadow-2xs' : 'bg-slate-200/80 text-slate-600'
                }`}>
                  <GlassWater className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div className="flex flex-col text-left min-w-0">
                  <span className="font-bold text-xs sm:text-sm leading-tight text-slate-900 truncate">
                    Supply / Equipment
                  </span>
                  <span className="font-kantumruy font-light text-[11px] text-slate-500 leading-tight mt-0.5 truncate">
                    សម្ភារៈ / ឧបករណ៍
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setCustomCategory('Petty Cash & Tip Advance');
                  setCustomUnit('USD');
                }}
                className={`py-3 px-4 rounded-xl transition-all flex items-center gap-3 cursor-pointer border ${
                  customCategory === 'Petty Cash & Tip Advance' 
                    ? 'bg-white text-slate-900 border-slate-300/80 shadow-sm font-bold scale-[1.01]' 
                    : 'bg-transparent border-transparent text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <div className={`p-2 rounded-xl flex-shrink-0 transition-colors ${
                  customCategory === 'Petty Cash & Tip Advance' ? 'bg-emerald-100 text-emerald-700 shadow-2xs' : 'bg-slate-200/80 text-slate-600'
                }`}>
                  <DollarSign className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div className="flex flex-col text-left min-w-0">
                  <span className="font-bold text-xs sm:text-sm leading-tight text-slate-900 truncate">
                    Request Money / Cash
                  </span>
                  <span className="font-kantumruy font-light text-[11px] text-slate-500 leading-tight mt-0.5 truncate">
                    ដកប្រាក់ / សំណូមពរសាច់ប្រាក់
                  </span>
                </div>
              </button>
            </div>
          )}

          {/* Neutral Info Banner (Slate/Gray info styling instead of brand yellow) */}
          <div className="p-4 rounded-2xl bg-slate-100 border border-slate-200/90 flex items-start gap-3.5 shadow-inner">
            <div className="p-2 rounded-xl bg-white text-slate-700 shadow-2xs flex-shrink-0 mt-0.5 border border-slate-200/60">
              <AlertCircle className="w-4 h-4 stroke-[2.5]" />
            </div>
            <p className="text-xs font-medium text-slate-700 leading-relaxed my-auto">
              {customCategory === 'Petty Cash & Tip Advance'
                ? 'សំណូមពរដកសាច់ប្រាក់ ឬ Tip Advance នឹងតម្រូវឱ្យបញ្ជាក់មូលហេតុ និងឈ្មោះអ្នកទទួលប្រាក់នៅជំហានបន្ទាប់។'
                : t('custom.alert')}
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block mb-1.5">
                <span className="block text-xs font-bold uppercase text-slate-700 tracking-wider">
                  {customCategory === 'Petty Cash & Tip Advance' ? 'Cash Request Title' : 'Item Name'} <span className="text-red-500">*</span>
                </span>
                <span className="block font-kantumruy font-light text-[11px] text-slate-400 mt-0.5">
                  {customCategory === 'Petty Cash & Tip Advance' ? 'ឈ្មោះ ឬចំណងជើងសំណូមពរដកប្រាក់' : 'ឈ្មោះមុខទំនិញ (អាចបញ្ចូលជាភាសាខ្មែរ ឬអង់គ្លេស)'}
                </span>
              </label>
              <input
                type="text"
                required
                value={customNameEn}
                onChange={(e) => setCustomNameEn(e.target.value)}
                placeholder={customCategory === 'Petty Cash & Tip Advance' ? "e.g., Staff Emergency Tip Advance / ដកប្រាក់រង្វាន់ Tip បន្ទាន់" : "e.g., Premium Truffle Oil / ប្រេងត្រាវហ្វលពិសេស"}
                className="w-full h-12 px-4 rounded-xl border border-slate-300 bg-white font-bold text-sm focus:outline-none focus:border-slate-800 focus:ring-2 focus:ring-slate-800/10"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1.5">
                  <span className="block text-xs font-bold uppercase text-slate-700 tracking-wider">
                    {t('custom.category')} <span className="text-red-500">*</span>
                  </span>
                  <span className="block font-kantumruy font-light text-[11px] text-slate-400 mt-0.5">
                    ប្រភេទមុខទំនិញ
                  </span>
                </label>
                <Select
                  value={customCategory}
                  onValueChange={(val) => setCustomCategory(val)}
                >
                  <SelectTrigger className="w-full h-12 px-3.5 rounded-xl border border-slate-300 bg-white font-bold text-sm focus:ring-2 focus:ring-slate-800/10 focus:border-slate-800 cursor-pointer shadow-none">
                    <SelectValue placeholder={t('custom.category')} />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border border-slate-200 bg-white shadow-xl max-h-[260px] z-[60]">
                    {activeCategories.filter(c => c.id !== 'all').map((cat) => (
                      <SelectItem key={cat.id} value={cat.id} className="font-bold text-sm py-2.5 px-3.5 rounded-lg cursor-pointer hover:bg-slate-100 focus:bg-slate-100 transition-colors">
                        {language === 'kh' ? (cat.nameKh || cat.nameEn) : cat.nameEn}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {customCategory === 'Petty Cash & Tip Advance' ? (
                <div>
                  <label className="block mb-1.5">
                    <span className="block text-xs font-bold uppercase text-slate-700 tracking-wider">
                      Currency <span className="text-red-500">*</span>
                    </span>
                    <span className="block font-kantumruy font-light text-[11px] text-slate-400 mt-0.5">
                      រូបិយប័ណ្ណសាច់ប្រាក់
                    </span>
                  </label>
                  <div className="grid grid-cols-2 gap-2 h-12 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setCurrency('KHR')}
                      className={`rounded-lg font-black text-xs transition-all flex items-center justify-center gap-1 cursor-pointer ${
                        currency === 'KHR'
                          ? 'bg-white text-orange-600 shadow-2xs border border-slate-200'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      ៛ KHR
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrency('USD')}
                      className={`rounded-lg font-black text-xs transition-all flex items-center justify-center gap-1 cursor-pointer ${
                        currency === 'USD'
                          ? 'bg-white text-blue-600 shadow-2xs border border-slate-200'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      $ USD
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block mb-1.5">
                    <span className="block text-xs font-bold uppercase text-slate-700 tracking-wider">
                      {t('custom.defaultUnit')} <span className="text-red-500">*</span>
                    </span>
                    <span className="block font-kantumruy font-light text-[11px] text-slate-400 mt-0.5">
                      ខ្នាតរង្វាស់រង្វាល់
                    </span>
                  </label>
                  <Select
                    value={customUnit}
                    onValueChange={(val) => setCustomUnit(val)}
                  >
                    <SelectTrigger className="w-full h-12 px-3.5 rounded-xl border border-slate-300 bg-white font-bold text-sm focus:ring-2 focus:ring-slate-800/10 focus:border-slate-800 cursor-pointer shadow-none">
                      <SelectValue placeholder={t('custom.defaultUnit')} />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border border-slate-200 bg-white shadow-xl max-h-[220px] z-[60]">
                      {(requestMode === 'stuff' 
                        ? ['piece', 'set', 'box', 'pack', 'bottle', 'gallon', 'tank', 'pair', 'roll'] 
                        : ['kg', 'gram', 'piece', 'pack', 'box', 'can', 'bottle', 'bunch', 'liter']
                      ).map((u) => (
                        <SelectItem key={u} value={u} className="font-bold text-sm py-2 px-3.5 rounded-lg cursor-pointer hover:bg-slate-100 focus:bg-slate-100 transition-colors">
                          {u.toUpperCase()} ({u})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
              {customCategory !== 'Petty Cash & Tip Advance' && (
                <div>
                  <label className="block mb-1.5">
                    <span className="block text-xs font-bold uppercase text-slate-700 tracking-wider">
                      Currency <span className="text-red-500">*</span>
                    </span>
                    <span className="block font-kantumruy font-light text-[11px] text-slate-400 mt-0.5">
                      រូបិយប័ណ្ណ
                    </span>
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
              )}

              <div className={customCategory === 'Petty Cash & Tip Advance' ? 'sm:col-span-2' : ''}>
                <label className="block mb-1.5">
                  <span className="block text-xs font-bold uppercase text-slate-700 tracking-wider">
                    {customCategory === 'Petty Cash & Tip Advance' ? 'Estimated Amount' : t('custom.priceUnit')} <span className="text-red-500">*</span>
                  </span>
                  <span className="block font-kantumruy font-light text-[11px] text-slate-400 mt-0.5">
                    {customCategory === 'Petty Cash & Tip Advance' ? 'ចំនួនប្រាក់ប៉ាន់ស្មាន' : 'តម្លៃប៉ាន់ស្មានក្នុងមួយឯកតា'}
                  </span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-black text-sm">
                    {currency === 'KHR' ? '៛ KHR' : '$ USD'}
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={customPrice === 0 ? '' : customPrice}
                    onChange={(e) => setCustomPrice(parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className="w-full h-12 pl-20 pr-4 rounded-xl border border-slate-300 bg-white font-black text-base focus:outline-none focus:border-slate-800 focus:ring-2 focus:ring-slate-800/10"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-200/80">
            <button
              type="button"
              onClick={() => setShowCustomModal(false)}
              className="whitespace-nowrap px-5 py-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 font-bold text-sm text-slate-700 transition-all cursor-pointer shadow-2xs"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              className="whitespace-nowrap px-6 py-3 rounded-xl bg-primary text-primary-foreground font-black text-sm shadow-md hover:bg-primary-hover hover:text-primary active:bg-primary-active active:text-white transition-all flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>{t('custom.createOrder')}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* 3. REVIEW & SUBMIT CONFIRMATION MODAL */}
      <Modal
        isOpen={showReviewModal}
        onClose={() => !submitting && setShowReviewModal(false)}
        title={t('review.title')}
        maxWidthClassName="max-w-3xl"
      >
        {submittedSuccess ? (
          <div className="py-12 px-6 text-center space-y-4 animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto shadow-lg animate-bounce">
              <CheckCircle2 className="w-10 h-10 stroke-[3]" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">
              {t('review.sentTitle')}
            </h3>
            <p className="text-sm text-slate-500 font-medium max-w-sm mx-auto leading-relaxed">
              {t('review.sentSub')}
            </p>
            <div className="pt-2">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 text-slate-700 font-bold text-xs">
                <div className="w-2 h-2 rounded-full bg-primary animate-ping" />
                <span>{t('review.redirecting')}</span>
              </span>
            </div>
          </div>
        ) : (
          <div className="space-y-5 flex flex-col flex-1 min-h-0">
            {/* Delivery Date & Priority Configuration */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 flex-shrink-0">
              <div className="sm:col-span-4">
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span>{t('review.targetDate')} <span className="text-red-500">*</span></span>
                </label>
                <input
                  type="date"
                  required
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl border border-slate-300 bg-white font-bold text-sm text-slate-800 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 cursor-pointer"
                />
                {deliveryDate && (
                  <span className="block text-[11px] font-bold text-primary mt-1.5 px-1">
                    📅 {(() => {
                      const [y, m, d] = deliveryDate.split('-');
                      if (!y || !m || !d) return deliveryDate;
                      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                      return `${d}/${m}/${y} (${d} ${months[parseInt(m, 10) - 1] || m} ${y})`;
                    })()}
                  </span>
                )}
              </div>

              <div className="sm:col-span-5">
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-primary" />
                  <span>{t('review.priority')}</span>
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="w-full h-11 px-3 rounded-xl border border-slate-300 bg-white font-bold text-sm text-slate-800 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 cursor-pointer truncate"
                  title={t(`review.priority${priority.charAt(0).toUpperCase() + priority.slice(1)}` as any) || priority}
                >
                  <option value="normal">{t('review.priorityNormal')}</option>
                  <option value="urgent">{t('review.priorityUrgent')}</option>
                  <option value="scheduled">{t('review.priorityScheduled')}</option>
                </select>
              </div>

              <div className="sm:col-span-3">
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <span className="text-primary font-black">៛/$</span>
                  <span>Currency / រូបិយប័ណ្ណ</span>
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

            {/* Selected Items Summary List */}
            <div className="space-y-2 flex-1 flex flex-col min-h-0">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider px-1 flex-shrink-0">
                <span>{t('review.selectedItems')} ({totalItemCount})</span>
                <span>{t('review.lineTotal')}</span>
              </div>

              <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-y-auto bg-white flex-1 min-h-[160px] max-h-[320px] shadow-2xs">
                {itemsList.map((item) => {
                  const itemIsCash = isCashItem(item);
                  const mainName = language === 'kh' ? (item.ingredient.nameKh || item.ingredient.nameEn) : item.ingredient.nameEn;
                  return (
                    <div key={item.ingredient.id} className="p-3.5 flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs flex-shrink-0 shadow-2xs ${
                          itemIsCash ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {itemIsCash ? (item.unit === 'USD' ? '$' : '៛') : item.quantity}
                        </div>
                        <div className="min-w-0">
                          <span className="font-bold text-sm text-slate-900 block line-clamp-2 leading-tight break-words" title={mainName}>
                            {mainName}
                          </span>
                          <span className="text-[11px] font-medium text-slate-400 block truncate mt-0.5">
                            {itemIsCash ? (
                              <>
                                {item.supplier || 'Staff Member / Beneficiary'} • {t('modal.amountRequested') || 'Amount Requested'}
                              </>
                            ) : (
                              <>
                                {item.quantity} {item.unit} × {formatMoney(item.pricePerUnit)} • {item.supplier || 'Morning Wet Market'}
                              </>
                            )}
                          </span>
                        </div>
                      </div>
                      <div className="font-black text-sm text-slate-900 flex-shrink-0 whitespace-nowrap inline-flex items-center gap-1">
                        {itemIsCash ? (
                          <>
                            <span>{item.unit === 'KHR' ? `${Number(item.totalCost).toLocaleString()}` : `$${Number(item.totalCost).toFixed(2)}`}</span>
                            <span>{item.unit === 'KHR' ? '៛' : 'USD'}</span>
                          </>
                        ) : (
                          <span>{formatMoney(item.totalCost)}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Final Cost Summary Box */}
            <div className="p-4 rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-between gap-4 flex-shrink-0">
              <div>
                <span className="text-xs font-black text-slate-800 uppercase tracking-wide block">
                  {t('review.totalCost')}
                </span>
                <span className="font-kantumruy text-xs text-slate-500 block mt-0.5">
                  {t('review.totalCostSub')}
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 bg-primary/20 px-3.5 py-1.5 rounded-xl border border-primary/30 inline-flex items-center gap-1.5 whitespace-nowrap flex-shrink-0">
                <span>{currency === 'KHR' ? `${Math.round(estimatedTotalCost).toLocaleString()}` : `$${estimatedTotalCost.toFixed(2)}`}</span>
                {currency === 'KHR' && <span>៛</span>}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2 flex-shrink-0">
              <button
                type="button"
                onClick={() => setShowReviewModal(false)}
                disabled={submitting}
                className="whitespace-nowrap px-6 py-3.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold text-sm transition-all cursor-pointer shadow-2xs"
              >
                {t('common.back')}
              </button>
              <button
                type="button"
                onClick={handleSubmitOrder}
                disabled={submitting}
                className="whitespace-nowrap flex-1 sm:flex-none px-8 py-3.5 rounded-xl bg-primary text-primary-foreground font-bold shadow-md hover:bg-primary-hover hover:text-primary active:bg-primary-active active:text-white transition-all text-base flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {submitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                    <span>{t('review.routing')}</span>
                  </div>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                    <span>{t('review.confirmSend')}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </AppLayout>
  );
}
