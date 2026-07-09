'use client';

import React, { useState } from 'react';
import { IngredientItem, OrderItem } from '@/types/market';
import { useTranslation } from '@/lib/i18n';
import { 
  LayoutGrid, Beef, Fish, Carrot, Soup, Wheat, GlassWater, Package, Utensils,
  Egg, Droplets, CookingPot, Beer, Leaf, Store, CheckCircle2, Plus, Minus, Trash2
} from 'lucide-react';

interface IngredientListProps {
  items: IngredientItem[];
  orderItems: Record<string, OrderItem>;
  onInlineAdd: (item: OrderItem) => void;
  onInlineRemove: (ingredientId: string) => void;
  selectedCategory?: string;
  currency?: 'KHR' | 'USD';
  onCurrencyChange?: (currency: 'KHR' | 'USD') => void;
}

export const renderIngredientIcon = (iconName: string, className = "w-5 h-5") => {
  switch (iconName) {
    case 'LayoutGrid': return <LayoutGrid className={className} />;
    case 'Beef': case '🥩': case 'pork-belly': case 'beef-tenderloin': return <Beef className={className} />;
    case 'Fish': case '🐟': case '🦐': case 'river-fish': case 'shrimp': return <Fish className={className} />;
    case 'Carrot': case '🧄': case '🍋': case 'garlic': case 'lime': return <Carrot className={className} />;
    case 'Soup': return <Soup className={className} />;
    case 'Wheat': case '🍚': case '🌾': case 'jasmine-rice': return <Wheat className={className} />;
    case 'GlassWater': case '🍾': case '🧊': case 'oyster-sauce': case 'crushed-ice': return <GlassWater className={className} />;
    case 'Package': return <Package className={className} />;
    case 'Utensils': return <Utensils className={className} />;
    case 'Egg': case '🐓': case 'whole-chicken': return <Egg className={className} />;
    case 'Droplets': case '🧂': case 'fish-sauce': return <Droplets className={className} />;
    case 'CookingPot': return <CookingPot className={className} />;
    case 'Beer': return <Beer className={className} />;
    case 'Leaf': case '🌿': case '🌱': case 'lemongrass': case 'morning-glory': return <Leaf className={className} />;
    default:
      return <Package className={className} />;
  }
};

export function IngredientList({
  items,
  orderItems,
  onInlineAdd,
  onInlineRemove,
  currency = 'KHR',
  onCurrencyChange,
}: IngredientListProps) {
  const { t, language } = useTranslation();
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

  // Temporary state for the inline editor
  const [editQuantity, setEditQuantity] = useState<number>(1);
  const [editUnit, setEditUnit] = useState<string>('kg');
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editCurrency, setEditCurrency] = useState<'KHR' | 'USD'>('KHR');

  const isCashItem = (item: IngredientItem) => {
    return item.category === 'Petty Cash & Tip Advance' ||
           item.id.toLowerCase().includes('tip') ||
           item.id.toLowerCase().includes('cash') ||
           item.id.toLowerCase().includes('money') ||
           item.nameEn.toLowerCase().includes('cash') ||
           item.nameEn.toLowerCase().includes('tip');
  };

  const handleExpand = (item: IngredientItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (expandedItemId === item.id) {
      setExpandedItemId(null);
      return;
    }
    const existing = orderItems[item.id];
    if (existing) {
      if (isCashItem(item)) {
        setEditQuantity(1);
        setEditUnit(existing.unit);
        setEditPrice(existing.totalCost);
        setEditCurrency(existing.unit as 'KHR' | 'USD');
      } else {
        setEditQuantity(existing.quantity);
        setEditUnit(existing.unit);
        setEditPrice(existing.pricePerUnit);
      }
    } else {
      if (isCashItem(item)) {
        setEditQuantity(1);
        setEditUnit(item.defaultUnit === 'USD' ? 'USD' : 'KHR');
        setEditPrice(item.defaultPrice || 0);
        setEditCurrency(item.defaultUnit === 'USD' ? 'USD' : 'KHR');
      } else {
        setEditQuantity(1);
        setEditUnit(item.defaultUnit || (item.requestType === 'stuff' ? 'piece' : 'kg'));
        setEditPrice(item.defaultPrice || 0);
      }
    }
    setExpandedItemId(item.id);
  };

  const handleSave = (item: IngredientItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const cashItem = isCashItem(item);
    
    if (cashItem && editPrice <= 0) return;
    if (!cashItem && editQuantity <= 0) {
      onInlineRemove(item.id);
      setExpandedItemId(null);
      return;
    }

    const newOrderItem: OrderItem = {
      ingredient: item,
      quantity: cashItem ? 1 : editQuantity,
      unit: cashItem ? editCurrency : editUnit,
      pricePerUnit: cashItem ? editPrice : editPrice,
      totalCost: cashItem ? editPrice : Number((editQuantity * editPrice).toFixed(2)),
      supplier: cashItem ? 'Staff Member / Beneficiary' : (item.requestType === 'stuff' ? 'Standard Equipment Vendor' : 'Local Market Vendor'),
      notes: '',
    };
    onInlineAdd(newOrderItem);
    setExpandedItemId(null);
  };

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center space-y-3 shadow-xs">
        <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
          <Store className="w-7 h-7" />
        </div>
        <div>
          <h3 className="font-bold text-slate-800 text-base">{t('list.noItems')}</h3>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">{t('list.noItemsSub')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden pb-4">
      {/* Table Header */}
      <div className="grid grid-cols-12 gap-3 bg-slate-50 px-4 sm:px-6 py-3 border-b border-slate-200 items-center sticky top-0 z-10">
        <div className="col-span-6 sm:col-span-5 flex items-center">
          <span className="font-extrabold text-slate-700 text-xs leading-tight uppercase tracking-wider">{t('list.glossary')}</span>
        </div>
        <div className="col-span-3 text-left hidden sm:flex items-center">
          <span className="font-extrabold text-slate-700 text-xs leading-tight uppercase tracking-wider">{t('list.category')}</span>
        </div>
        <div className="col-span-2 text-center hidden sm:flex items-center justify-center gap-2">
          <span className="font-extrabold text-slate-700 text-xs leading-tight uppercase tracking-wider">{t('list.priceUnit')}</span>
        </div>
        <div className="col-span-6 sm:col-span-2 text-right flex items-center justify-end">
          <span className="font-extrabold text-slate-700 text-xs leading-tight uppercase tracking-wider">{t('list.status')}</span>
        </div>
      </div>

      {/* Item Rows */}
      <div className="divide-y divide-slate-100">
        {items.map((item) => {
          const inBasket = orderItems[item.id];
          const isExpanded = expandedItemId === item.id;
          const mainEn = item.nameEn;
          const cashItem = isCashItem(item);

          return (
            <div key={item.id} className="flex flex-col">
              <div
                onClick={(e) => handleExpand(item, e)}
                className={`group grid grid-cols-12 gap-3 px-4 sm:px-6 py-3.5 items-center transition-all duration-200 cursor-pointer ${
                  inBasket
                    ? 'bg-primary/5 hover:bg-primary/10 border-l-4 border-l-primary'
                    : isExpanded 
                    ? 'bg-slate-50 border-l-4 border-l-slate-400' 
                    : 'hover:bg-slate-50/80 border-l-4 border-l-transparent'
                }`}
              >
                {/* 1. Icon & Name */}
                <div className="col-span-6 sm:col-span-5 flex items-center gap-3.5 overflow-hidden">
                  <div
                    className={`p-2.5 rounded-xl flex-shrink-0 transition-colors shadow-2xs ${
                      inBasket
                        ? 'bg-primary text-primary-foreground font-bold shadow-xs'
                        : 'bg-slate-100 text-slate-600 group-hover:bg-primary/20 group-hover:text-slate-900 font-bold'
                    }`}
                  >
                    {renderIngredientIcon(item.iconName, "w-5 h-5")}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900 truncate">
                        {mainEn}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. Category Tag */}
                <div className="col-span-3 hidden sm:flex items-center">
                  <span className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 truncate">
                    {item.category}
                  </span>
                </div>

                {/* 3. Estimated Price */}
                <div className="col-span-2 hidden sm:flex flex-col items-center justify-center text-center">
                  <span className="font-black text-sm text-slate-800">
                    {currency === 'KHR' ? `${(item.defaultPrice * 4000).toLocaleString()} ៛` : `$${item.defaultPrice.toFixed(2)}`}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase">
                    {cashItem ? 'Est Amount' : `${t('list.per')} ${item.defaultUnit}`}
                  </span>
                </div>

                {/* 4. Action */}
                <div className="col-span-6 sm:col-span-2 flex items-center justify-end gap-2.5">
                  {inBasket ? (
                    <div className="flex items-center gap-2">
                      <span className="hidden md:inline-flex text-xs font-black text-slate-900 bg-primary/25 px-3 py-1 rounded-xl border border-primary/40 shadow-2xs">
                        {cashItem ? `${inBasket.totalCost} ${inBasket.unit}` : `${inBasket.quantity} ${inBasket.unit}`}
                      </span>
                      <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-xs">
                        <CheckCircle2 className="w-4 h-4 stroke-[3]" />
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-primary hover:text-primary-foreground text-slate-700 font-bold text-xs transition-all border border-slate-200 shadow-2xs">
                        <Plus className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Add</span>
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* INLINE EDIT ROW */}
              {isExpanded && (
                <div className="px-4 sm:px-6 py-4 bg-slate-50 border-t border-slate-100 shadow-inner flex flex-col sm:flex-row sm:items-center gap-4 justify-between border-l-4 border-l-slate-400">
                  {cashItem ? (
                    // Cash Item Controls
                    <div className="flex items-center gap-3">
                      <div className="flex items-center bg-white border border-slate-300 rounded-xl overflow-hidden shadow-2xs h-11">
                        <button
                          onClick={() => setEditCurrency('USD')}
                          className={`px-3 font-black text-xs h-full transition-colors ${editCurrency === 'USD' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                        >
                          $ USD
                        </button>
                        <button
                          onClick={() => setEditCurrency('KHR')}
                          className={`px-3 font-black text-xs h-full transition-colors ${editCurrency === 'KHR' ? 'bg-orange-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                        >
                          ៛ KHR
                        </button>
                      </div>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={editPrice === 0 ? '' : editPrice}
                        onChange={(e) => setEditPrice(parseFloat(e.target.value) || 0)}
                        placeholder="Amount"
                        className="h-11 w-32 px-3 border border-slate-300 rounded-xl font-bold text-sm bg-white focus:outline-none focus:border-primary shadow-2xs"
                      />
                    </div>
                  ) : (
                    // Standard Item Controls
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="flex items-center bg-white border border-slate-300 rounded-xl overflow-hidden shadow-2xs">
                        <button
                          onClick={() => setEditQuantity(q => Math.max(0.5, q - 1))}
                          className="w-11 h-11 flex items-center justify-center text-slate-600 hover:bg-slate-100 active:bg-slate-200 transition-colors"
                        >
                          <Minus className="w-4 h-4 stroke-[3]" />
                        </button>
                        <input
                          type="number"
                          min="0"
                          step="0.5"
                          value={editQuantity}
                          onChange={(e) => setEditQuantity(parseFloat(e.target.value) || 0)}
                          className="w-14 h-11 text-center font-black text-sm border-x border-slate-200 bg-white focus:outline-none"
                        />
                        <button
                          onClick={() => setEditQuantity(q => q + 1)}
                          className="w-11 h-11 flex items-center justify-center text-slate-600 hover:bg-slate-100 active:bg-slate-200 transition-colors"
                        >
                          <Plus className="w-4 h-4 stroke-[3]" />
                        </button>
                      </div>

                      <select
                        value={editUnit}
                        onChange={(e) => setEditUnit(e.target.value)}
                        className="h-11 px-3 border border-slate-300 rounded-xl font-bold text-sm bg-white focus:outline-none focus:border-primary shadow-2xs"
                      >
                        {(item.allowedUnits || [item.defaultUnit]).map(u => (
                          <option key={u} value={u}>{u}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="flex items-center gap-2 sm:ml-auto">
                    {inBasket && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onInlineRemove(item.id); setExpandedItemId(null); }}
                        className="px-4 h-11 rounded-xl text-red-600 bg-red-50 hover:bg-red-100 font-bold text-sm transition-colors border border-red-200 flex items-center justify-center"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={(e) => handleSave(item, e)}
                      className="px-6 h-11 rounded-xl bg-primary text-primary-foreground font-bold text-sm shadow-sm hover:bg-primary-hover active:scale-95 transition-all flex items-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      {inBasket ? 'Update' : 'Confirm'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
