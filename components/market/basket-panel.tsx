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
  
  const isCashItem = (item: any) => {
    return item.ingredient.category === 'Petty Cash & Tip Advance' ||
           item.ingredient.id.toLowerCase().includes('tip') ||
           item.ingredient.id.toLowerCase().includes('cash') ||
           item.ingredient.id.toLowerCase().includes('money') ||
           item.ingredient.id.toLowerCase().includes('reimburse') ||
           item.ingredient.nameEn.toLowerCase().includes('cash') ||
           item.ingredient.nameEn.toLowerCase().includes('tip');
  };

  const estimatedTotalCost = itemsList.reduce((acc, curr) => {
    if (isCashItem(curr)) {
      if (currency === 'KHR') {
        return acc + (curr.unit === 'KHR' ? curr.totalCost : curr.totalCost * 4000);
      } else {
        return acc + (curr.unit === 'KHR' ? curr.totalCost / 4000 : curr.totalCost);
      }
    } else {
      return acc + (currency === 'KHR' ? curr.totalCost * 4000 : curr.totalCost);
    }
  }, 0);

  const formatMoney = (val: number) => currency === 'KHR' ? `${(val * 4000).toLocaleString()} ៛` : `$${val.toFixed(2)}`;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full max-h-[calc(100vh-6.5rem)] sticky top-24 transition-all">
      {/* Panel Header - Clean & Light */}
      <div className="bg-slate-50 p-4 sm:p-5 flex items-center justify-between gap-3 border-b border-slate-200 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/20 text-slate-900 font-bold rounded-xl flex items-center justify-center">
            <ClipboardList className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-900 tracking-tight flex items-center gap-2">
              <span>{t('basket.title')}</span>
              {totalItemsCount > 0 && (
                <span className="bg-slate-900 text-white text-[11px] font-black px-2 py-0.5 rounded-full shadow-2xs">
                  {totalItemsCount}
                </span>
              )}
            </h3>
          </div>
        </div>

        {totalItemsCount > 0 && (
          <button
            type="button"
            onClick={onClearBasket}
            className="text-[11px] font-bold text-slate-500 hover:text-red-600 bg-white hover:bg-red-50 px-2.5 py-1.5 rounded-xl transition-all border border-slate-200 hover:border-red-200 shadow-2xs cursor-pointer"
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
            <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto border border-slate-200">
              <ClipboardList className="w-8 h-8 stroke-[1.5]" />
            </div>
            <div className="max-w-[240px] mx-auto">
              <h4 className="font-bold text-slate-700 text-base">{t('basket.emptyTitle')}</h4>
              <p className="font-kantumruy text-xs text-slate-400 mt-1 font-light">
                {t('basket.emptySub')}
              </p>
            </div>
            <p className="text-[11px] text-slate-500 font-medium max-w-[250px] mx-auto bg-slate-50 p-3.5 rounded-xl border border-slate-200 leading-relaxed">
              💡 {t('basket.chefTip')}
            </p>
          </div>
        ) : (
          itemsList.map((item) => {
            const mainName = language === 'kh' ? (item.ingredient.nameKh || item.ingredient.nameEn) : item.ingredient.nameEn;
            const subName = language === 'kh' ? item.ingredient.nameEn : item.ingredient.nameKh;
            const isItemMoney = item.ingredient.category === 'Petty Cash & Tip Advance' ||
                                item.ingredient.id.includes('tip') ||
                                item.ingredient.id.includes('cash') ||
                                item.ingredient.id.includes('money') ||
                                item.ingredient.nameEn.toLowerCase().includes('cash') ||
                                item.ingredient.nameEn.toLowerCase().includes('tip');

            return (
              <div 
                key={item.ingredient.id} 
                className="pt-3 first:pt-0 group flex items-start justify-between gap-3 transition-all"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className={`p-2 rounded-xl font-bold flex-shrink-0 mt-0.5 shadow-2xs ${
                    isItemMoney ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {renderIngredientIcon(item.ingredient.iconName, "w-4 h-4")}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="font-bold text-sm text-slate-900 truncate">
                        {mainName}
                      </h4>
                      {isItemMoney && (
                        <span className="text-[10px] font-black uppercase bg-emerald-500 text-white px-1.5 py-0.5 rounded-md">
                          CASH
                        </span>
                      )}
                    </div>
                    
                    {isItemMoney ? (
                      <div className="space-y-1.5 mt-1.5">
                        <div className="flex items-center gap-2 flex-wrap text-xs">
                          <span className="font-black text-emerald-950 bg-emerald-100 px-2.5 py-0.5 rounded-lg border border-emerald-300 shadow-2xs">
                            💵 {item.unit === 'KHR' ? `${(item.totalCost).toLocaleString()} ៛ KHR` : `$${item.totalCost.toFixed(2)} USD`}
                          </span>
                          {item.supplier && (
                            <span className="font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md text-[11px] border border-slate-200">
                              👤 {item.supplier}
                            </span>
                          )}
                        </div>
                        {item.notes && (
                          <p className="text-[11px] text-emerald-950 bg-emerald-50/90 p-2 rounded-lg border border-emerald-200/80 font-medium font-kantumruy block leading-relaxed">
                            <span className="font-bold text-emerald-800">Reason:</span> {item.notes}
                          </p>
                        )}
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap text-xs">
                          <span className="font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
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
                          <p className="text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md mt-1.5 italic border border-amber-200/60 inline-block max-w-full truncate">
                            📝 {item.notes}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => onEditItem(item)}
                    className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-all shadow-2xs active:scale-90 font-bold cursor-pointer"
                    title="Edit item quantity or price"
                  >
                    <Edit3 className="w-3.5 h-3.5 stroke-[2.5]" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onRemoveItem(item.ingredient.id)}
                    className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-red-600 hover:text-white text-slate-400 flex items-center justify-center transition-all shadow-2xs active:scale-90 cursor-pointer"
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
      <div className="bg-slate-50 p-4 sm:p-5 border-t border-slate-200 space-y-4 flex-shrink-0">
        {/* Cost Summary Box */}
        <div className="rounded-xl bg-white p-4 border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>{t('basket.estCost')}</span>
            <span className="bg-slate-100 px-2 py-0.5 rounded-full text-[11px] font-bold text-slate-700">
              {totalItemsCount} {t('basket.items')}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <div className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 inline-flex items-center gap-1.5 whitespace-nowrap">
              <span>{currency === 'KHR' ? `${Math.round(estimatedTotalCost).toLocaleString()}` : `$${estimatedTotalCost.toFixed(2)}`}</span>
              {currency === 'KHR' && <span>៛</span>}
            </div>
            <span className="text-xs font-semibold text-slate-500">
              {totalUnits} {t('basket.units')}
            </span>
          </div>
          <p className="font-kantumruy text-[11px] text-slate-400 pt-1 border-t border-slate-100 font-light">
            {t('basket.estCostSub')}
          </p>
        </div>

        {/* High-Impact Review & Send CTA Button */}
        <button
          type="button"
          onClick={onSubmitOrder}
          disabled={totalItemsCount === 0 || submitting}
          className="whitespace-nowrap w-full bg-[#0A8F4D] hover:bg-[#08733E] text-white font-black shadow-lg shadow-emerald-700/20 transition-all py-4 px-6 rounded-xl flex items-center justify-center gap-2.5 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none disabled:shadow-none text-sm sm:text-base cursor-pointer border border-[#0A8F4D]/30"
        >
          {submitting ? (
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>{t('basket.sending')}</span>
            </div>
          ) : (
            <>
              <CheckCircle2 className="w-5 h-5 stroke-[2.5] text-white" />
              <span>{t('basket.reviewSend')}</span>
              <ArrowRight className="w-5 h-5 stroke-[2.5] ml-1 text-white" />
            </>
          )}
        </button>

        <p className="text-[11px] text-center text-slate-400 font-light">
          {t('basket.paperTip')}
        </p>
      </div>
    </div>
  );
}
