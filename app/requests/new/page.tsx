'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/app-layout';
import { useAuth } from '@/lib/auth-context';
import { useTranslation } from '@/lib/i18n';
import { Modal } from '@/components/shared/modal';
import { 
  Store, Search, Filter, Plus, Calendar, Clock, ShoppingCart, 
  CheckCircle2, AlertCircle, ArrowRight, LayoutGrid, Package, ChevronRight
} from 'lucide-react';

import { IngredientItem, OrderItem, MARKET_CATEGORIES, DEFAULT_MARKET_CATALOG } from '@/types/market';
import { getOrders, saveOrder, OrderRequest } from '@/lib/orders';
import { CategoryBar } from '@/components/market/category-bar';
import { IngredientList } from '@/components/market/ingredient-list';
import { BasketPanel } from '@/components/market/basket-panel';
import { OrderModal } from '@/components/market/order-modal';

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

  // Master Ingredient Catalog State
  const [ingredients, setIngredients] = useState<IngredientItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

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
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submittedSuccess, setSubmittedSuccess] = useState<boolean>(false);

  // Initialize Catalog and set default tomorrow delivery date
  useEffect(() => {
    setIngredients(DEFAULT_MARKET_CATALOG);

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yyyy = tomorrow.getFullYear();
    const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const dd = String(tomorrow.getDate()).padStart(2, '0');
    setDeliveryDate(`${yyyy}-${mm}-${dd}`);
  }, []);

  // Filter Ingredients based on Category and Search Query (Bilingual search)
  const filteredIngredients = useMemo(() => {
    return ingredients.filter((item) => {
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      if (!matchesCategory) return false;

      if (!searchQuery.trim()) return true;

      const query = searchQuery.toLowerCase().trim();
      const matchEn = item.nameEn.toLowerCase().includes(query);
      const matchKh = item.nameKh ? item.nameKh.toLowerCase().includes(query) : false;
      const matchCat = item.category.toLowerCase().includes(query);

      return matchEn || matchKh || matchCat;
    });
  }, [ingredients, selectedCategory, searchQuery]);

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
      defaultUnit: customUnit,
      defaultPrice: Number(customPrice) || 0,
      allowedUnits: [customUnit, 'kg', 'gram', 'piece', 'pack', 'box', 'can', 'bottle'],
      iconName: 'Sparkles',
      currentStock: 0,
      parStock: 10,
      isCustom: true,
    };

    setIngredients((prev) => [newIngredient, ...prev]);
    setShowCustomModal(false);

    setCustomNameEn('');
    setCustomNameKh('');
    setCustomPrice(0);

    setActiveModalItem({
      ingredient: newIngredient,
    });
  };

  // Submit Final Market List
  const handleSubmitOrder = () => {
    const itemsList = Object.values(orderItems);
    if (itemsList.length === 0 || !user) return;

    setSubmitting(true);

    try {
      const totalCost = itemsList.reduce((sum, item) => sum + item.totalCost, 0);
      
      const newOrder: OrderRequest = {
        id: `ORD-${Date.now().toString().slice(-6)}`,
        status: 'pending',
        date: new Date().toISOString().split('T')[0],
        total: `$${totalCost.toFixed(2)}`,
        createdBy: user.name,
        notes: `Market Shopping List submitted by ${user.name} (${itemsList.length} items selected). Delivery Date: ${deliveryDate}, Priority: ${priority}`,
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
  const estimatedTotalCost = itemsList.reduce((acc, curr) => acc + curr.totalCost, 0);

  return (
    <AppLayout title={t('market.title')} subtitle={t('market.subtitle')}>
      <div className="max-w-[1440px] mx-auto pb-24 space-y-6">
        {/* SECTION 1: HEADER & FILTER NAVIGATION */}
        <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-5">
          {/* Top Brand Bar & User Profile */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-primary text-primary-foreground font-bold flex items-center justify-center shadow-md flex-shrink-0">
                <Store className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-black bg-primary/20 text-slate-900 px-2.5 py-0.5 rounded-full tracking-wider border border-primary/30">
                    {t('market.posVersion')}
                  </span>
                  <span className="text-xs font-bold text-slate-400">|</span>
                  <span className="text-xs font-bold text-slate-600 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-primary" />
                    <span>{t('market.morningMarket')} - {t('market.chefAuthorized')}</span>
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1">
                  {t('market.title')}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-3 self-end sm:self-auto">
              <button
                type="button"
                onClick={() => setShowCustomModal(true)}
                className="whitespace-nowrap px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-xs transition-all active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4 text-primary stroke-[3]" />
                <span>{t('market.addCustomItem')}</span>
              </button>
            </div>
          </div>

          {/* Search Bar & Stats */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-2xl">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('market.searchPlaceholder')}
                className="w-full h-12 pl-12 pr-10 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/15 transition-all shadow-inner"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold bg-slate-200 hover:bg-slate-300 text-slate-700 px-2 py-1 rounded-lg transition-colors cursor-pointer"
                >
                  {t('common.clear')}
                </button>
              )}
            </div>

            <div className="flex items-center justify-between md:justify-end gap-3 text-xs font-bold text-slate-500 bg-slate-50 px-4 py-3 rounded-2xl border border-slate-200/80">
              <span className="flex items-center gap-1.5">
                <Package className="w-4 h-4 text-primary" />
                <span>{filteredIngredients.length} {t('market.itemsAvailable')}</span>
              </span>
              <span className="hidden sm:inline text-slate-300">|</span>
              <span className="hidden sm:inline font-normal text-slate-400">
                {t('market.clickTip')}
              </span>
            </div>
          </div>

          {/* Category Bar Component */}
          <CategoryBar
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
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
            <span className="text-lg font-black text-white truncate block">
              ${estimatedTotalCost.toFixed(2)} <span className="text-xs font-normal text-slate-400">{t('basket.estTotal')}</span>
            </span>
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
      >
        <form onSubmit={handleCreateCustomItem} className="p-6 space-y-5">
          <div className="p-4 rounded-2xl bg-primary/15 border border-primary/30 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <p className="text-xs font-medium text-slate-700 leading-relaxed">
              {t('custom.alert')}
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5">
                {t('custom.enName')} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={customNameEn}
                onChange={(e) => setCustomNameEn(e.target.value)}
                placeholder="e.g., Premium Truffle Oil, Fresh Scallops"
                className="w-full h-12 px-4 rounded-xl border border-slate-300 bg-white font-bold text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5 font-kantumruy">
                {t('custom.khName')} <span className="text-slate-400 font-normal">({t('common.optional')})</span>
              </label>
              <input
                type="text"
                value={customNameKh}
                onChange={(e) => setCustomNameKh(e.target.value)}
                placeholder="e.g., ប្រេងត្រាវហ្វលពិសេស, ខ្យងសមុទ្រស្រស់"
                className="w-full h-12 px-4 rounded-xl border border-slate-300 bg-white font-bold text-sm font-kantumruy focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5">
                  {t('custom.category')} <span className="text-red-500">*</span>
                </label>
                <select
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  className="w-full h-12 px-3.5 rounded-xl border border-slate-300 bg-white font-bold text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 cursor-pointer"
                >
                  {MARKET_CATEGORIES.filter(c => c.id !== 'all').map((cat) => (
                    <option key={cat.id} value={cat.id}>{language === 'kh' ? cat.nameKh : cat.nameEn}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5">
                  {t('custom.defaultUnit')} <span className="text-red-500">*</span>
                </label>
                <select
                  value={customUnit}
                  onChange={(e) => setCustomUnit(e.target.value)}
                  className="w-full h-12 px-3.5 rounded-xl border border-slate-300 bg-white font-bold text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 cursor-pointer"
                >
                  {['kg', 'gram', 'piece', 'pack', 'box', 'can', 'bottle', 'bunch', 'liter'].map((u) => (
                    <option key={u} value={u}>{u.toUpperCase()} ({u})</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5">
                {t('custom.priceUnit')} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={customPrice === 0 ? '' : customPrice}
                  onChange={(e) => setCustomPrice(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className="w-full h-12 pl-8 pr-4 rounded-xl border border-slate-300 bg-white font-black text-base focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
          </div>

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowCustomModal(false)}
              className="whitespace-nowrap px-5 py-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 font-bold text-sm text-slate-700 transition-all cursor-pointer"
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
          <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
            {/* Delivery Date & Priority Configuration */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div>
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
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-primary" />
                  <span>{t('review.priority')}</span>
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="w-full h-11 px-3 rounded-xl border border-slate-300 bg-white font-bold text-sm text-slate-800 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 cursor-pointer"
                >
                  <option value="normal">{t('review.priorityNormal')}</option>
                  <option value="urgent">{t('review.priorityUrgent')}</option>
                  <option value="scheduled">{t('review.priorityScheduled')}</option>
                </select>
              </div>
            </div>

            {/* Selected Items Summary List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
                <span>{t('review.selectedItems')} ({totalItemCount})</span>
                <span>{t('review.lineTotal')}</span>
              </div>

              <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-white max-h-60 overflow-y-auto shadow-2xs">
                {itemsList.map((item) => (
                  <div key={item.ingredient.id} className="p-3.5 flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center font-black text-slate-700 text-xs flex-shrink-0">
                        {item.quantity}
                      </div>
                      <div className="min-w-0">
                        <span className="font-bold text-sm text-slate-900 block truncate">
                          {language === 'kh' ? (item.ingredient.nameKh || item.ingredient.nameEn) : item.ingredient.nameEn}
                        </span>
                        <span className="text-[11px] font-medium text-slate-400">
                          {item.quantity} {item.unit} × ${item.pricePerUnit.toFixed(2)} • {item.supplier || 'Morning Wet Market'}
                        </span>
                      </div>
                    </div>
                    <span className="font-black text-sm text-slate-900 flex-shrink-0">
                      ${item.totalCost.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Final Cost Summary Box */}
            <div className="p-4 rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-between gap-4">
              <div>
                <span className="text-xs font-black text-slate-800 uppercase tracking-wide block">
                  {t('review.totalCost')}
                </span>
                <span className="font-kantumruy text-xs text-slate-500">
                  {t('review.totalCostSub')}
                </span>
              </div>
              <span className="text-2xl sm:text-3xl font-black text-slate-900 bg-primary/20 px-3 py-1 rounded-xl border border-primary/30">
                ${estimatedTotalCost.toFixed(2)}
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowReviewModal(false)}
                disabled={submitting}
                className="whitespace-nowrap px-6 py-3.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold text-sm transition-all cursor-pointer"
              >
                {t('common.back')}
              </button>
              <button
                type="button"
                onClick={handleSubmitOrder}
                disabled={submitting}
                className="whitespace-nowrap flex-1 sm:flex-none px-8 py-3.5 rounded-xl bg-primary text-primary-foreground font-bold shadow-sm hover:bg-primary-hover hover:text-primary active:bg-primary-active active:text-white transition-all text-base flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
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
