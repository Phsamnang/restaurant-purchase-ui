'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { IngredientItem, OrderItem, MARKET_SUPPLIERS } from '@/types/market';
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

  // Sync state when modal opens or ingredient changes
  useEffect(() => {
    if (isOpen && ingredient) {
      if (initialOrderItem) {
        setQuantity(initialOrderItem.quantity);
        setUnit(initialOrderItem.unit);
        setPricePerUnit(initialOrderItem.pricePerUnit);
        setSupplier(initialOrderItem.supplier || MARKET_SUPPLIERS[0]);
        setNotes(initialOrderItem.notes || '');
      } else {
        setQuantity(1);
        setUnit(ingredient.defaultUnit || 'kg');
        setPricePerUnit(ingredient.defaultPrice || 0);
        setSupplier(MARKET_SUPPLIERS[0]);
        setNotes('');
      }
    }
  }, [isOpen, ingredient, initialOrderItem]);

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
    return Number((quantity * pricePerUnit).toFixed(2));
  }, [quantity, pricePerUnit]);

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

  const handleSubmit = () => {
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
        <div className="bg-slate-900 text-white p-6 flex items-start justify-between gap-4 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-32 h-32 bg-primary/20 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
          
          <div className="flex items-start gap-4 z-10 min-w-0">
            <div className="p-3 bg-white/10 rounded-2xl border border-white/10 text-primary shadow-inner flex-shrink-0">
              {renderIngredientIcon(ingredient.iconName, "w-7 h-7")}
            </div>
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] uppercase font-black tracking-widest bg-primary text-primary-foreground px-2.5 py-0.5 rounded-full">
                  {ingredient.category}
                </span>
                {isEditing && (
                  <span className="text-[10px] uppercase font-black tracking-widest bg-amber-500 px-2.5 py-0.5 rounded-full text-white">
                    {t('modal.editing')}
                  </span>
                )}
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white truncate">
                {mainName}
              </h2>
              {subName && (
                <p className="font-kantumruy text-sm font-light text-slate-300 truncate">
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

        {/* Modal Form Body (Scrollable) - Consistent Form Styles & Heights */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* 1. QUANTITY SECTION (*) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wide text-slate-700">
                {t('modal.quantity')} <span className="text-red-500">*</span>
              </label>
              <span className="text-[11px] font-semibold text-slate-400">{t('modal.stepTip')}</span>
            </div>

            {/* Stepper Control with Consistent h-12 Height and Slate-300 Border */}
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
            {/* 2. UNIT DROPDOWN (*) */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wide text-slate-700">
                {t('modal.unit')} <span className="text-red-500">*</span>
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full h-12 px-3.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer shadow-2xs"
              >
                {(ingredient.allowedUnits?.length ? ingredient.allowedUnits : ['kg', 'gram', 'piece', 'pack']).map((u) => (
                  <option key={u} value={u} className="font-bold">
                    {u.toUpperCase()} ({u})
                  </option>
                ))}
              </select>
            </div>

            {/* 3. PURCHASE PRICE (*) */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wide text-slate-700">
                {t('modal.price')} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                  $
                </div>
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  value={pricePerUnit === 0 ? '' : pricePerUnit}
                  onChange={(e) => setPricePerUnit(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className="w-full h-12 pl-8 pr-3.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-2xs"
                />
              </div>
            </div>
          </div>

          {/* Real-Time Total Calculation Box */}
          <div className="bg-slate-900 text-white rounded-2xl p-4 flex items-center justify-between gap-4 shadow-md">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-primary text-primary-foreground font-bold rounded-xl shadow-xs">
                <Calculator className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wide block">
                  {t('modal.lineTotal')}
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  {quantity} {unit} × ${pricePerUnit.toFixed(2)}
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-2xl sm:text-3xl font-black text-primary bg-white/10 px-3.5 py-1 rounded-xl border border-white/10">
                ${totalCost.toFixed(2)}
              </span>
            </div>
          </div>

          {/* 4. SUPPLIER (Optional) */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wide text-slate-700 flex items-center gap-1.5">
              <Store className="w-4 h-4 text-slate-400" />
              <span>{t('modal.vendor')} <span className="text-slate-400 font-normal">({t('common.optional')})</span></span>
            </label>
            <select
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
              className="w-full h-12 px-3.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer shadow-2xs"
            >
              {MARKET_SUPPLIERS.map((s) => (
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

        {/* Modal Footer Buttons - Prevent Wrapping with whitespace-nowrap */}
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
            disabled={quantity <= 0}
            className="whitespace-nowrap flex-1 sm:flex-none px-8 py-3 rounded-xl bg-primary text-primary-foreground font-bold shadow-sm hover:bg-primary-hover hover:text-primary active:bg-primary-active active:text-white transition-all text-sm sm:text-base flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
          >
            <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
            <span>{isEditing ? t('modal.updateList') : t('modal.addToList')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
