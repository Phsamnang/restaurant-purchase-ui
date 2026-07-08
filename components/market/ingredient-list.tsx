'use client';

import React from 'react';
import { IngredientItem, OrderItem } from '@/types/market';
import { useTranslation } from '@/lib/i18n';
import { 
  LayoutGrid, Beef, Fish, Carrot, Soup, Wheat, GlassWater, Package, Utensils,
  Egg, Droplets, CookingPot, Beer, Leaf, Store, ChevronRight, CheckCircle2
} from 'lucide-react';

interface IngredientListProps {
  items: IngredientItem[];
  orderItems: Record<string, OrderItem>;
  onSelectIngredient: (item: IngredientItem) => void;
  selectedCategory?: string;
}

export const renderIngredientIcon = (iconName: string, className = "w-5 h-5") => {
  switch (iconName) {
    case 'LayoutGrid': return <LayoutGrid className={className} />;
    case 'Beef': return <Beef className={className} />;
    case 'Fish': return <Fish className={className} />;
    case 'Carrot': return <Carrot className={className} />;
    case 'Soup': return <Soup className={className} />;
    case 'Wheat': return <Wheat className={className} />;
    case 'GlassWater': return <GlassWater className={className} />;
    case 'Package': return <Package className={className} />;
    case 'Utensils': return <Utensils className={className} />;
    case 'Egg': return <Egg className={className} />;
    case 'Droplets': return <Droplets className={className} />;
    case 'CookingPot': return <CookingPot className={className} />;
    case 'Beer': return <Beer className={className} />;
    case 'Leaf': return <Leaf className={className} />;
    default:
      if (iconName && !iconName.match(/^[a-zA-Z]/)) {
        return <span className="text-xl leading-none">{iconName}</span>;
      }
      return <Store className={className} />;
  }
};

export function IngredientList({
  items,
  orderItems,
  onSelectIngredient,
}: IngredientListProps) {
  const { t, language } = useTranslation();

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
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Table Header - Digital Glossary Checklist */}
      <div className="grid grid-cols-12 gap-3 bg-slate-50 px-4 sm:px-6 py-3 border-b border-slate-200 text-[11px] font-black uppercase tracking-wider text-slate-500">
        <div className="col-span-6 sm:col-span-5 flex items-center gap-2">
          <span>{t('list.glossary')}</span>
        </div>
        <div className="col-span-3 text-left hidden sm:block">
          <span>{t('list.category')}</span>
        </div>
        <div className="col-span-2 text-center hidden sm:block">
          <span>{t('list.priceUnit')}</span>
        </div>
        <div className="col-span-6 sm:col-span-2 text-right">
          <span>{t('list.status')}</span>
        </div>
      </div>

      {/* Glossary Rows */}
      <div className="divide-y divide-slate-100">
        {items.map((item) => {
          const inBasket = orderItems[item.id];
          const mainName = language === 'kh' ? (item.nameKh || item.nameEn) : item.nameEn;
          const subName = language === 'kh' ? item.nameEn : item.nameKh;

          return (
            <div
              key={item.id}
              onClick={() => onSelectIngredient(item)}
              className={`group grid grid-cols-12 gap-3 px-4 sm:px-6 py-3.5 items-center transition-all duration-200 cursor-pointer ${
                inBasket
                  ? 'bg-primary/10 border-l-4 border-l-primary border-y border-y-primary/20 hover:bg-primary/20'
                  : 'hover:bg-primary/10 border-l-4 border-l-transparent'
              }`}
            >
              {/* 1. Icon & Bilingual Name */}
              <div className="col-span-6 sm:col-span-5 flex items-center gap-3.5 overflow-hidden">
                <div
                  className={`p-2.5 rounded-xl flex-shrink-0 transition-colors shadow-2xs ${
                    inBasket
                      ? 'bg-primary text-primary-foreground font-bold shadow-xs'
                      : 'bg-slate-100 text-slate-600 group-hover:bg-primary/30 group-hover:text-primary-foreground font-bold'
                  }`}
                >
                  {renderIngredientIcon(item.iconName, "w-5 h-5")}
                </div>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900 truncate">
                      {mainName}
                    </span>
                    {inBasket && (
                      <span className="hidden lg:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-primary text-primary-foreground shadow-2xs">
                        <CheckCircle2 className="w-3 h-3 stroke-[3]" />
                        <span>{t('list.inList')}</span>
                      </span>
                    )}
                  </div>
                  {subName && (
                    <span className="font-kantumruy text-xs text-slate-500 font-medium truncate mt-0.5">
                      {subName}
                    </span>
                  )}
                </div>
              </div>

              {/* 2. Category Tag (Desktop) */}
              <div className="col-span-3 hidden sm:flex items-center">
                <span className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 truncate">
                  {item.category}
                </span>
              </div>

              {/* 3. Estimated Price & Default Unit (Desktop) */}
              <div className="col-span-2 hidden sm:flex flex-col items-center justify-center text-center">
                <span className="font-black text-sm text-slate-800">
                  ${item.defaultPrice.toFixed(2)}
                </span>
                <span className="text-[11px] font-semibold text-slate-400 uppercase">
                  {t('list.per')} {item.defaultUnit}
                </span>
              </div>

              {/* 4. Action Arrow / In List Status */}
              <div className="col-span-6 sm:col-span-2 flex items-center justify-end gap-2.5">
                {inBasket ? (
                  <div className="flex items-center gap-2">
                    <span className="sm:hidden inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-primary text-primary-foreground">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{t('list.inList')}</span>
                    </span>
                    <span className="hidden md:inline-flex text-xs font-black text-slate-900 bg-primary/20 px-2.5 py-0.5 rounded-lg border border-primary/30">
                      {inBasket.quantity} {inBasket.unit}
                    </span>
                    <div className="w-8 h-8 rounded-full bg-primary/25 text-slate-900 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <ChevronRight className="w-4 h-4 stroke-[2.5]" />
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-slate-400 group-hover:text-slate-900 transition-colors">
                    <span className="text-xs font-bold hidden md:inline-block opacity-0 group-hover:opacity-100 transition-opacity">
                      {t('list.select')}
                    </span>
                    <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 group-hover:bg-primary group-hover:text-primary-foreground flex items-center justify-center transition-all shadow-2xs">
                      <ChevronRight className="w-4 h-4 stroke-[2.5]" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
