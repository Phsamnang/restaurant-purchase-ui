'use client';

import React, { Suspense, useRef, useState } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Drawer, 
  DrawerTrigger, 
  DrawerContent, 
  DrawerHeader, 
  DrawerTitle, 
  DrawerDescription 
} from '@/components/ui/drawer';
import { 
  ChevronLeft, ChevronRight, Filter 
} from 'lucide-react';
import { MARKET_CATEGORIES, DEFAULT_MARKET_CATALOG, CategoryItem, IngredientItem } from '@/types/market';
import { renderIngredientIcon } from './ingredient-list';
import { useTranslation } from '@/lib/i18n';

interface CategoryBarProps {
  selectedCategory?: string;
  onSelectCategory?: (categoryId: string) => void;
  categories?: CategoryItem[];
  catalog?: IngredientItem[];
}

function CategoryBarContent({ 
  selectedCategory, 
  onSelectCategory,
  categories = MARKET_CATEGORIES,
  catalog = DEFAULT_MARKET_CATALOG
}: CategoryBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { language } = useTranslation();
  
  const activeCategory = selectedCategory || searchParams?.get('category') || 'all';
  const activeCatObj = categories.find(c => c.id === activeCategory) || categories[0] || MARKET_CATEGORIES[0];

  const handleSelectCategory = (categoryId: string) => {
    if (onSelectCategory) {
      onSelectCategory(categoryId);
    }
    const params = new URLSearchParams(searchParams?.toString() || '');
    if (categoryId === 'all') {
      params.delete('category');
    } else {
      params.set('category', categoryId);
    }
    try {
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    } catch (e) {
      // Ignore navigation error during static rendering or tests
    }
  };

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 320;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  const getCategoryCount = (catId: string) => {
    if (catId === 'all') return catalog.length;
    return catalog.filter(item => item.category === catId).length;
  };

  return (
    <div className="w-full bg-white border-b border-border py-2.5 px-4 sm:px-6 shadow-2xs">
      <div className="max-w-7xl mx-auto">
        {/* 1. MOBILE ACTION BAR & DRAWER (md:hidden for viewports under 768px) */}
        <div className="md:hidden">
          <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
            <DrawerTrigger asChild>
              <button
                className="w-full flex items-center justify-between gap-3 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl shadow-sm hover:bg-primary-hover hover:text-primary transition-all active:scale-[0.99] min-h-[48px] font-bold cursor-pointer"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="p-1.5 bg-black/10 dark:bg-white/10 rounded-lg shrink-0">
                    {renderIngredientIcon(activeCatObj.iconName, "w-5 h-5")}
                  </div>
                  <div className="flex flex-col text-left overflow-hidden">
                    <span className="text-[10px] uppercase font-extrabold text-primary-foreground/80 tracking-wider">
                      Filtering Category
                    </span>
                    <span className="font-bold text-sm leading-tight truncate">
                      {activeCatObj.name}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="px-2 py-0.5 bg-black/10 dark:bg-white/20 rounded-md text-xs font-bold">
                    {getCategoryCount(activeCatObj.id)}
                  </span>
                  <Filter className="w-4 h-4 text-primary-foreground" />
                </div>
              </button>
            </DrawerTrigger>

            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>Select Category / ជ្រើសរើសប្រភេទ</DrawerTitle>
                <DrawerDescription>
                  Filter ingredient catalog by category
                </DrawerDescription>
              </DrawerHeader>

              {/* 2. MOBILE DRILL-DOWN GRID (Inside Drawer): 2-column vertical grid */}
              <div className="p-4 grid grid-cols-2 gap-3">
                {categories.map((cat) => {
                  const isSelected = activeCategory === cat.id;
                  const count = getCategoryCount(cat.id);
                  return (
                    <button
                      key={cat.id}
                      onClick={() => {
                        handleSelectCategory(cat.id);
                        setDrawerOpen(false);
                      }}
                      className={`group flex flex-col justify-between p-3.5 rounded-xl border text-left transition-all min-h-[72px] shadow-2xs cursor-pointer ${
                        isSelected
                          ? 'bg-primary text-primary-foreground border-primary shadow-sm shadow-primary/20 ring-2 ring-primary ring-offset-2 font-bold'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 active:bg-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-2">
                        <div className={`p-2 rounded-lg shrink-0 ${
                          isSelected ? 'bg-black/10 dark:bg-white/10 text-primary-foreground' : 'bg-white text-slate-600 shadow-2xs'
                        }`}>
                          {renderIngredientIcon(cat.iconName, "w-5 h-5")}
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-md text-xs font-bold ${
                            isSelected
                              ? 'bg-white/20 text-white'
                              : 'bg-white border border-slate-200 text-slate-700'
                          }`}
                        >
                          {count}
                        </span>
                      </div>
                      <div className="mt-2">
                        <span className={`font-bold text-xs leading-tight tracking-tight block ${
                          isSelected ? 'text-white' : 'text-slate-900'
                        }`}>
                          {cat.name}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </DrawerContent>
          </Drawer>
        </div>

        {/* 3. DESKTOP PRESERVATION (hidden md:block for viewports 768px and up) */}
        <div className="hidden md:block relative group/scroll">
          {/* Left Scroll Arrow Button for Desktop Accessibility */}
          <button
            onClick={() => handleScroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 z-10 p-2 bg-white/95 hover:bg-slate-100 border border-slate-200 rounded-full shadow-md text-slate-700 transition-all opacity-0 group-hover/scroll:opacity-100 hidden md:flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Component Structure & Layout: Wide horizontal scroll container */}
          <ScrollArea ref={scrollRef} className="w-full whitespace-nowrap">
            <div className="flex items-center gap-2.5 pb-2 pt-1 flex-nowrap">
              {categories.map((cat) => {
                const isSelected = activeCategory === cat.id;
                const count = getCategoryCount(cat.id);
                return (
                  <button
                    key={cat.id}
                    onClick={() => handleSelectCategory(cat.id)}
                    className={`group inline-flex items-center justify-between gap-2.5 px-3.5 py-2 rounded-xl border text-left transition-all flex-shrink-0 shadow-2xs cursor-pointer ${
                      isSelected
                        ? 'bg-primary text-primary-foreground border-primary shadow-sm shadow-primary/20 scale-[1.01] font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                    }`}
                  >
                    {/* Visual Accents: Explicit Lucide Icon on Left */}
                    <div className={`p-1.5 rounded-lg flex-shrink-0 transition-colors ${
                      isSelected ? 'bg-black/10 dark:bg-white/10 text-primary-foreground' : 'bg-white text-slate-500 group-hover:text-primary-hover dark:group-hover:text-primary shadow-2xs'
                    }`}>
                      {renderIngredientIcon(cat.iconName, "w-4 h-4")}
                    </div>

                    {/* Single-line Label without secondary clutter */}
                    <span className={`font-bold text-xs sm:text-sm tracking-tight ${
                      isSelected ? 'text-primary-foreground' : 'text-slate-900'
                    }`}>
                      {cat.name}
                    </span>

                    {/* Visual Accents: Compact Numeric Badge on Right */}
                    <span className={`ml-1 px-2 py-0.5 rounded-md text-xs font-bold transition-colors ${
                      isSelected ? 'bg-black/15 text-primary-foreground font-black' : 'bg-white border border-slate-200 text-slate-700 group-hover:border-slate-300 shadow-2xs'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </ScrollArea>

          {/* Right Scroll Arrow Button for Desktop Accessibility */}
          <button
            onClick={() => handleScroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 z-10 p-2 bg-white/95 hover:bg-slate-100 border border-slate-200 rounded-full shadow-md text-slate-700 transition-all opacity-0 group-hover/scroll:opacity-100 hidden md:flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function CategoryBar(props: CategoryBarProps) {
  return (
    <Suspense fallback={<div className="h-16 w-full bg-white border-b border-border animate-pulse" />}>
      <CategoryBarContent {...props} />
    </Suspense>
  );
}
