'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { IngredientItem, OrderItem, MARKET_SUPPLIERS, STUFF_SUPPLIERS } from '@/types/market';
import { renderIngredientIcon } from './ingredient-list';
import { useTranslation } from '@/lib/i18n';
import { 
  X, Plus, Minus, Sparkles, DollarSign, Store, FileText, 
  CheckCircle2, Calculator, ArrowRight
} from 'lucide-react';

interface OrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  ingredient: IngredientItem | null;
  initialOrderItem?: OrderItem;
  onSave: (orderItem: OrderItem) => void;
}

export function OrderModal({
  isOpen,
  onClose,
  ingredient,
  initialOrderItem,
  onSave,
}: OrderModalProps) {
  const { t, language } = useTranslation();
  const [quantity, setQuantity] = useState<number>(1);
  const [unit, setUnit] = useState<string>('kg');
  const [pricePerUnit, setPricePerUnit] = useState<number>(0);
  const [supplier, setSupplier] = useState<string>(MARKET_SUPPLIERS[0]);
  const [notes, setNotes] = useState<string>('');

  const supplierList = useMemo(() => {
    return ingredient?.requestType === 'stuff' ? STUFF_SUPPLIERS : MARKET_SUPPLIERS;
  }, [ingredient]);

  const allowedUnits = useMemo(() => {
    if (ingredient?.allowedUnits && ingredient.allowedUnits.length > 0) {
      return ingredient.allowedUnits;
    }
    if (ingredient?.requestType === 'stuff') {
      return ['piece', 'set', 'box', 'pack', 'bottle', 'gallon', 'tank', 'USD'];
    }
    return ['kg', 'gram', 'piece', 'pack', 'bottle', 'can'];
  }, [ingredient]);

  const isCashRequest = useMemo(() => {
    if (!ingredient) return false;
    return ingredient.category === 'Petty Cash & Tip Advance' ||
           ingredient.id.toLowerCase().includes('tip') ||
           ingredient.id.toLowerCase().includes('cash') ||
           ingredient.id.toLowerCase().includes('money') ||
           ingredient.id.toLowerCase().includes('reimburse') ||
           ingredient.nameEn.toLowerCase().includes('cash') ||
           ingredient.nameEn.toLowerCase().includes('tip');
  }, [ingredient]);

  // Sync state when modal opens or ingredient changes
  useEffect(() => {
    if (isOpen && ingredient) {
      if (initialOrderItem) {
        if (isCashRequest) {
          setQuantity(1);
          setUnit(initialOrderItem.unit === 'USD' ? 'USD' : 'KHR');
          setPricePerUnit(initialOrderItem.totalCost || initialOrderItem.pricePerUnit || 0);
          setSupplier(initialOrderItem.supplier || 'Staff Member / Beneficiary');
          setNotes(initialOrderItem.notes || '');
        } else {
          setQuantity(initialOrderItem.quantity);
          setUnit(initialOrderItem.unit);
          setPricePerUnit(initialOrderItem.pricePerUnit);
          setSupplier(initialOrderItem.supplier || supplierList[0]);
          setNotes(initialOrderItem.notes || '');
        }
      } else {
        if (isCashRequest) {
          setQuantity(1);
          setUnit(ingredient.defaultUnit === 'USD' ? 'USD' : 'KHR');
          setPricePerUnit(ingredient.defaultPrice || 0);
          setSupplier('Staff Member / Beneficiary');
          setNotes('');
        } else {
          setQuantity(1);
          setUnit(ingredient.defaultUnit || (ingredient.requestType === 'stuff' ? 'piece' : 'kg'));
          setPricePerUnit(ingredient.defaultPrice || 0);
          setSupplier(supplierList[0]);
          setNotes('');
        }
      }
    }
  }, [isOpen, ingredient, initialOrderItem, supplierList, isCashRequest]);

  // Keyboard Shortcuts (Enter to Submit, Esc to Close)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'Enter' && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
        e.preventDefault();
        handleSubmit();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, quantity, unit, pricePerUnit, supplier, notes]);

  const totalCost = useMemo(() => {
    if (isCashRequest) {
      return Number(pricePerUnit.toFixed(2));
    }
    return Number((quantity * pricePerUnit).toFixed(2));
  }, [quantity, pricePerUnit, isCashRequest]);

  if (!isOpen || !ingredient) return null;

  const handleStep = (delta: number) => {
    setQuantity((prev) => {
      const next = prev + delta;
      return next > 0 ? Number(next.toFixed(2)) : 0.5;
    });
  };

  const handleQuickAdd = (addAmount: number) => {
    setQuantity((prev) => Number((prev + addAmount).toFixed(2)));
  };

  const handleQuickAmountAdd = (addAmount: number) => {
    setPricePerUnit((prev) => Number((prev + addAmount).toFixed(2)));
  };

  const handleSubmit = () => {
    if (isCashRequest) {
      if (pricePerUnit <= 0) return;
      const newOrderItem: OrderItem = {
        ingredient,
        quantity: 1,
        unit: unit === 'USD' ? 'USD' : 'KHR',
        pricePerUnit: Number(pricePerUnit) || 0,
        totalCost: Number(pricePerUnit) || 0,
        supplier: supplier.trim() || 'Staff Member / Beneficiary',
        notes: notes.trim(),
      };
      onSave(newOrderItem);
      onClose();
      return;
    }

    if (quantity <= 0) return;

    const newOrderItem: OrderItem = {
      ingredient,
      quantity,
      unit,
      pricePerUnit,
      totalCost,
      supplier,
      notes: notes.trim(),
    };

    onSave(newOrderItem);
    onClose();
  };

  const isEditing = !!initialOrderItem;
  const mainName = language === 'kh' ? (ingredient.nameKh || ingredient.nameEn) : ingredient.nameEn;
  const subName = language === 'kh' ? ingredient.nameEn : ingredient.nameKh;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="p-6 flex items-start justify-between gap-4 relative overflow-hidden text-white bg-slate-900">
          <div className="absolute right-0 top-0 w-32 h-32 bg-primary/20 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
          
          <div className="flex items-start gap-4 z-10 min-w-0">
            <div className="p-3 rounded-2xl border shadow-inner flex-shrink-0 bg-white/10 text-primary border-white/10">
              {renderIngredientIcon(ingredient.iconName, "w-7 h-7")}
            </div>
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] uppercase font-black tracking-widest px-2.5 py-0.5 rounded-full bg-primary text-primary-foreground">
                  {ingredient.category}
                </span>
                {isEditing && (
                  <span className="text-[10px] uppercase font-black tracking-widest bg-amber-500 px-2.5 py-0.5 rounded-full text-white">
                    {t('modal.editing')}
                  </span>
                )}
              </div>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white line-clamp-2 leading-tight break-words">
                {mainName}
              </h2>
              {subName && (
                <p className="font-kantumruy text-sm font-light text-slate-300 line-clamp-2 leading-tight break-words">
                  {subName}
                </p>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-all z-10 focus:outline-none flex-shrink-0 cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Body (Scrollable) */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {isCashRequest ? (
            /* =========================================================
               SEPARATED CASH REQUEST FORM (Petty Cash, Tip Advance)
               ========================================================= */
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* 1. AMOUNT REQUESTED (*) WITH KHR/USD TOGGLE */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase tracking-wide text-slate-700">
                    {t('modal.amountRequested')} <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setUnit('USD')}
                      className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                        unit === 'USD' ? 'bg-white text-blue-600 shadow-2xs font-black' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      $ USD
                    </button>
                    <button
                      type="button"
                      onClick={() => setUnit('KHR')}
                      className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                        unit === 'KHR' ? 'bg-white text-orange-600 shadow-2xs font-black' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      ៛ KHR
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black text-xl">
                    {unit === 'KHR' ? '៛' : '$'}
                  </div>
                  <input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="any"
                    value={pricePerUnit === 0 ? '' : pricePerUnit}
                    onChange={(e) => setPricePerUnit(parseFloat(e.target.value) || 0)}
                    placeholder={unit === 'KHR' ? "0" : "0.00"}
                    className="w-full h-12 pl-10 pr-4 bg-slate-50 border border-slate-300 rounded-xl font-bold text-lg sm:text-xl text-slate-900 focus:outline-none focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-2xs"
                  />
                </div>

                {/* Quick Add Presets (Appropriate round numbers for Cash) */}
                <div className="flex items-center gap-1.5 pt-1 flex-wrap">
                  <span className="text-xs font-bold text-slate-400 mr-1">{t('modal.quickAdd')}</span>
                  {unit === 'KHR' ? (
                    <>
                      <button type="button" onClick={() => handleQuickAmountAdd(5000)} className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-primary/20 hover:text-slate-900 text-slate-700 font-bold text-xs transition-colors border border-slate-200 active:scale-95 cursor-pointer">+5,000 ៛</button>
                      <button type="button" onClick={() => handleQuickAmountAdd(10000)} className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-primary/20 hover:text-slate-900 text-slate-700 font-bold text-xs transition-colors border border-slate-200 active:scale-95 cursor-pointer">+10,000 ៛</button>
                      <button type="button" onClick={() => handleQuickAmountAdd(20000)} className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-primary/20 hover:text-slate-900 text-slate-700 font-bold text-xs transition-colors border border-slate-200 active:scale-95 cursor-pointer">+20,000 ៛</button>
                      <button type="button" onClick={() => handleQuickAmountAdd(50000)} className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-primary/20 hover:text-slate-900 text-slate-700 font-bold text-xs transition-colors border border-slate-200 active:scale-95 cursor-pointer">+50,000 ៛</button>
                      <button type="button" onClick={() => handleQuickAmountAdd(100000)} className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-primary/20 hover:text-slate-900 text-slate-700 font-bold text-xs transition-colors border border-slate-200 active:scale-95 cursor-pointer">+100,000 ៛</button>
                    </>
                  ) : (
                    <>
                      <button type="button" onClick={() => handleQuickAmountAdd(10)} className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-primary/20 hover:text-slate-900 text-slate-700 font-bold text-xs transition-colors border border-slate-200 active:scale-95 cursor-pointer">+$10</button>
                      <button type="button" onClick={() => handleQuickAmountAdd(20)} className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-primary/20 hover:text-slate-900 text-slate-700 font-bold text-xs transition-colors border border-slate-200 active:scale-95 cursor-pointer">+$20</button>
                      <button type="button" onClick={() => handleQuickAmountAdd(50)} className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-primary/20 hover:text-slate-900 text-slate-700 font-bold text-xs transition-colors border border-slate-200 active:scale-95 cursor-pointer">+$50</button>
                      <button type="button" onClick={() => handleQuickAmountAdd(100)} className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-primary/20 hover:text-slate-900 text-slate-700 font-bold text-xs transition-colors border border-slate-200 active:scale-95 cursor-pointer">+$100</button>
                    </>
                  )}
                </div>
              </div>

              {/* 2. PAID TO (*) */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wide text-slate-700 flex items-center gap-1.5">
                  <Store className="w-4 h-4 text-slate-400" />
                  <span>{t('modal.paidTo')} <span className="text-red-500">*</span></span>
                </label>
                <input
                  type="text"
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                  placeholder="e.g., Sokha - Kitchen Staff / Channary - Cashier"
                  className="w-full h-12 px-4 bg-slate-50 border border-slate-300 rounded-xl font-bold text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-2xs"
                />
              </div>

              {/* 3. NOTES (Optional) */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wide text-slate-700 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-slate-400" />
                  <span>{t('modal.notes')} <span className="text-slate-400 font-normal">({t('common.optional')})</span></span>
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={t('modal.notesPlaceholder')}
                  rows={2}
                  className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none shadow-2xs"
                />
              </div>
            </div>
          ) : (
            /* =========================================================
               STANDARD GLOSSARY / SUPPLIES REQUISITION FORM (Physical Items)
               ========================================================= */
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* 1. QUANTITY SECTION (*) */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase tracking-wide text-slate-700">
                    {t('modal.quantity')} <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[11px] font-semibold text-slate-400">{t('modal.stepTip')}</span>
                </div>

                {/* Stepper Control */}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleStep(-1)}
                    className="w-12 h-12 rounded-xl border border-slate-300 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 flex items-center justify-center transition-all shadow-2xs active:scale-95 flex-shrink-0 cursor-pointer"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="w-5 h-5 stroke-[3]" />
                  </button>

                  <div className="flex-1 relative">
                    <input
                      type="number"
                      inputMode="decimal"
                      min="0.1"
                      step="any"
                      value={quantity === 0 ? '' : quantity}
                      onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                      className="w-full h-12 px-4 text-center text-xl font-black bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 text-slate-900 shadow-2xs transition-all"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleStep(1)}
                    className="w-12 h-12 rounded-xl border border-slate-300 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 flex items-center justify-center transition-all shadow-2xs active:scale-95 flex-shrink-0 cursor-pointer"
                    aria-label="Increase quantity"
                  >
                    <Plus className="w-5 h-5 stroke-[3]" />
                  </button>
                </div>

                {/* Quick Actions Pills */}
                <div className="flex items-center gap-1.5 pt-1 flex-wrap">
                  <span className="text-xs font-bold text-slate-400 mr-1">{t('modal.quickAdd')}</span>
                  <button
                    type="button"
                    onClick={() => handleQuickAdd(1)}
                    className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-primary/20 hover:text-slate-900 text-slate-700 font-bold text-xs transition-colors border border-slate-200 active:scale-95 cursor-pointer"
                  >
                    +1 {unit}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickAdd(5)}
                    className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-primary/20 hover:text-slate-900 text-slate-700 font-bold text-xs transition-colors border border-slate-200 active:scale-95 cursor-pointer"
                  >
                    +5 {unit}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickAdd(10)}
                    className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-primary/20 hover:text-slate-900 text-slate-700 font-bold text-xs transition-colors border border-slate-200 active:scale-95 cursor-pointer"
                  >
                    +10 {unit}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickAdd(20)}
                    className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-primary/20 hover:text-slate-900 text-slate-700 font-bold text-xs transition-colors border border-slate-200 active:scale-95 cursor-pointer"
                  >
                    +20 {unit}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 2. UNIT SELECTOR (*) */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wide text-slate-700">
                    {t('modal.unit')} <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {allowedUnits.map((u) => {
                      const isSelected = unit === u;
                      return (
                        <button
                          key={u}
                          type="button"
                          onClick={() => setUnit(u)}
                          className={`px-3.5 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-slate-900 text-white shadow-xs scale-105'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200/80'
                          }`}
                        >
                          {u}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. ESTIMATED PRICE PER UNIT ($ / KHR) */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wide text-slate-700">
                    {t('modal.pricePerUnit')} ({unit === 'KHR' ? '៛ KHR' : '$ USD'}) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black">
                      {unit === 'KHR' ? '៛' : '$'}
                    </div>
                    <input
                      type="number"
                      inputMode="decimal"
                      min="0"
                      step="any"
                      value={pricePerUnit === 0 ? '' : pricePerUnit}
                      onChange={(e) => setPricePerUnit(parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      className="w-full h-12 pl-8 pr-4 bg-slate-50 border border-slate-300 rounded-xl font-black text-slate-900 focus:outline-none focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-2xs"
                    />
                  </div>
                </div>
              </div>

              {/* 4. PREFERRED SUPPLIER (*) */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wide text-slate-700 flex items-center gap-1.5">
                  <Store className="w-4 h-4 text-slate-400" />
                  <span>{t('modal.supplier')} <span className="text-red-500">*</span></span>
                </label>
                <select
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                  className="w-full h-12 px-3.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer shadow-2xs"
                >
                  {supplierList.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* 5. NOTES (Optional) */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wide text-slate-700 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-slate-400" />
                  <span>{t('modal.notes')} <span className="text-slate-400 font-normal">({t('common.optional')})</span></span>
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={t('modal.notesPlaceholder')}
                  rows={2}
                  className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none shadow-2xs"
                />
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Buttons */}
        <div className="bg-slate-50 p-6 border-t border-slate-200 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="whitespace-nowrap px-6 py-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold text-sm transition-all shadow-2xs active:scale-95 flex items-center justify-center cursor-pointer"
          >
            {t('modal.cancel')}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isCashRequest ? (pricePerUnit <= 0) : (quantity <= 0)}
            className="whitespace-nowrap flex-1 sm:flex-none px-8 py-3 rounded-xl font-bold shadow-sm transition-all text-sm sm:text-base flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer bg-primary text-primary-foreground hover:bg-primary-hover active:bg-primary-active"
          >
            <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
            <span>
              {isEditing ? t('modal.updateList') : t('modal.addToList')}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
