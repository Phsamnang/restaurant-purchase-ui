'use client';

import React from 'react';
import { OrderItem } from '@/types/market';
import { renderIngredientIcon } from './ingredient-list';
import { useTranslation } from '@/lib/i18n';
import { 
  ShoppingCart, Trash2, Edit3, ArrowRight, CheckCircle2, Package, ClipboardList
} from 'lucide-react';

interface BasketPanelProps {
  orderItems: Record<string, OrderItem>;
  onEditItem: (item: OrderItem) => void;
  onRemoveItem: (itemId: string) => void;
  onClearBasket: () => void;
  onSubmitOrder: () => void;
  submitting?: boolean;
  currency?: 'KHR' | 'USD';
}

export function BasketPanel({
  orderItems,
  onEditItem,
  onRemoveItem,
  onClearBasket,
  onSubmitOrder,
  submitting = false,
  currency = 'KHR',
}: BasketPanelProps) {
  const { t, language } = useTranslation();
  const itemsList = Object.values(orderItems);
  const totalItemsCount = itemsList.length;
  
  const totalUnits = itemsList.reduce((acc, curr) => acc + curr.quantity, 0);
  const estimatedTotalCost = itemsList.reduce((acc, curr) => acc + curr.totalCost, 0);

  const formatMoney = (val: number) => currency === 'KHR' ? `${(val * 4000).toLocaleString()} ៛` : `$${val.toFixed(2)}`;

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden flex flex-col h-full max-h-[calc(100vh-6.5rem)] sticky top-24 transition-all">
      {/* Panel Header */}
      <div className="bg-slate-900 text-white p-5 sm:p-6 flex items-center justify-between gap-3 border-b border-slate-800 flex-shrink-0 relative overflow-hidden">
        <div className="absolute right-0 bottom-0 w-32 h-32 bg-primary/20 rounded-full blur-2xl -mr-10 -mb-10 pointer-events-none" />
        
        <div className="flex items-center gap-3 z-10">
          <div className="p-2.5 bg-primary text-primary-foreground font-bold rounded-2xl shadow-md flex items-center justify-center">
            <ClipboardList className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <h3 className="font-black text-lg text-white tracking-tight flex items-center gap-2">
              <span>{t('basket.title')}</span>
              {totalItemsCount > 0 && (
                <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-full">
                  {totalItemsCount}
                </span>
              )}
            </h3>
            <p className="font-kantumruy text-xs text-slate-400 font-light">
              {t('basket.subtitle')}
            </p>
          </div>
        </div>

        {totalItemsCount > 0 && (
          <button
            onClick={onClearBasket}
            className="text-xs font-bold text-slate-400 hover:text-red-400 bg-white/5 hover:bg-red-500/10 px-2.5 py-1.5 rounded-xl transition-all border border-white/10 hover:border-red-500/30 z-10 cursor-pointer"
            title="Clear all items from list"
          >
            {t('basket.clearList')}
          </button>
        )}
      </div>

      {/* Basket Items List (Scrollable) */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 divide-y divide-slate-100">
        {totalItemsCount === 0 ? (
          <div className="py-16 text-center space-y-4 my-auto">
            <div className="w-16 h-16 rounded-3xl bg-slate-100 text-slate-300 flex items-center justify-center mx-auto border border-slate-200">
              <ClipboardList className="w-8 h-8 stroke-[1.5]" />
            </div>
            <div className="max-w-[240px] mx-auto">
              <h4 className="font-bold text-slate-700 text-base">{t('basket.emptyTitle')}</h4>
              <p className="font-kantumruy text-xs text-slate-400 mt-1">
                {t('basket.emptySub')}
              </p>
            </div>
            <p className="text-[11px] text-slate-500 font-semibold max-w-[250px] mx-auto bg-slate-50 p-3.5 rounded-2xl border border-slate-200 leading-relaxed">
              {t('basket.chefTip')}
            </p>
          </div>
        ) : (
          itemsList.map((item) => {
            const mainName = language === 'kh' ? (item.ingredient.nameKh || item.ingredient.nameEn) : item.ingredient.nameEn;
            const subName = language === 'kh' ? item.ingredient.nameEn : item.ingredient.nameKh;

            return (
              <div 
                key={item.ingredient.id} 
                className="pt-3 first:pt-0 group flex items-start justify-between gap-3 transition-all"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="p-2 rounded-xl bg-primary/20 text-slate-900 font-bold flex-shrink-0 mt-0.5">
                    {renderIngredientIcon(item.ingredient.iconName, "w-4 h-4")}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="font-bold text-sm text-slate-900 truncate">
                        {mainName}
                      </h4>
                    </div>
                    {subName && (
                      <p className="font-kantumruy text-xs text-slate-500 truncate">
                        {subName}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap text-xs">
                      <span className="font-black text-slate-900 bg-primary/20 px-2 py-0.5 rounded-lg border border-primary/30">
                        {item.quantity} {item.unit}
                      </span>
                      <span className="text-slate-400 font-medium">@</span>
                      <span className="text-slate-600 font-bold">
                        {formatMoney(item.pricePerUnit)}
                      </span>
                      <span className="text-slate-300 font-medium">=</span>
                      <span className="text-slate-900 font-black">
                        {formatMoney(item.totalCost)}
                      </span>
                    </div>

                    {item.notes && (
                      <p className="text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md mt-1 italic border border-amber-200/60 inline-block max-w-full truncate">
                        📝 {item.notes}
                      </p>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => onEditItem(item)}
                    className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-primary hover:text-primary-foreground text-slate-600 flex items-center justify-center transition-all shadow-2xs active:scale-90 font-bold cursor-pointer"
                    title="Edit item quantity or price"
                  >
                    <Edit3 className="w-3.5 h-3.5 stroke-[2.5]" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onRemoveItem(item.ingredient.id)}
                    className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-red-600 hover:text-white text-slate-400 hover:text-white flex items-center justify-center transition-all shadow-2xs active:scale-90 cursor-pointer"
                    title="Remove from list"
                  >
                    <Trash2 className="w-3.5 h-3.5 stroke-[2.5]" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Panel Bottom Summary & Checkout CTA */}
      <div className="bg-slate-50 p-5 sm:p-6 border-t border-slate-200 space-y-4 flex-shrink-0">
        {/* Hero Financial Highlight */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0A8F4D] to-[#065F33] p-4 text-white shadow-md shadow-[#0A8F4D]/10">
          <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-white/10 blur-xl pointer-events-none" />
          <div className="relative z-10 space-y-2">
            <div className="flex items-center justify-between text-white/80 text-xs font-semibold uppercase tracking-wider">
              <span>{t('basket.estCost')}</span>
              <span className="bg-white/20 px-2 py-0.5 rounded-full text-[11px] font-bold text-white shadow-2xs">
                {totalItemsCount} {t('basket.items')}
              </span>
            </div>
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-3xl font-black tracking-tight text-white drop-shadow-xs">
                {formatMoney(estimatedTotalCost)}
              </span>
              <span className="text-xs font-medium text-emerald-100">
                {totalUnits} {t('basket.units')}
              </span>
            </div>
            <p className="font-kantumruy text-[11px] text-emerald-100 pt-1 border-t border-white/15">
              {t('basket.estCostSub')}
            </p>
          </div>
        </div>

        {/* Large Review & Submit CTA Button */}
        <button
          type="button"
          onClick={onSubmitOrder}
          disabled={totalItemsCount === 0 || submitting}
          className="whitespace-nowrap w-full bg-primary text-primary-foreground font-bold shadow-sm hover:bg-primary-hover hover:text-primary active:bg-primary-active active:text-white transition-all py-4 px-6 rounded-2xl flex items-center justify-center gap-2.5 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none disabled:shadow-none text-base cursor-pointer"
        >
          {submitting ? (
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
              <span>{t('basket.sending')}</span>
            </div>
          ) : (
            <>
              <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
              <span>{t('basket.reviewSend')}</span>
              <ArrowRight className="w-5 h-5 stroke-[2.5] ml-1" />
            </>
          )}
        </button>

        <p className="text-[11px] text-center text-slate-400 font-medium">
          {t('basket.paperTip')}
        </p>
      </div>
    </div>
  );
}
