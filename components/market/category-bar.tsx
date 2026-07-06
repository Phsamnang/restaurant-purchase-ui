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
  LayoutGrid, Carrot, Drumstick, Fish, Milk, Wheat, Apple, Snowflake, 
  ChevronLeft, ChevronRight, Filter 
} from 'lucide-react';

export interface CategoryItem {
  id: string;
  nameEn: string;
  nameKh: string;
  icon: React.ElementType;
  count: number;
}

const CATEGORIES: CategoryItem[] = [
  { id: 'all', nameEn: 'All Ingredients', nameKh: 'ទាំងអស់', icon: LayoutGrid, count: 142 },
  { id: 'vegetables', nameEn: 'Vegetables & Herbs', nameKh: 'បន្លែ និងជី', icon: Carrot, count: 38 },
  { id: 'meat', nameEn: 'Meat & Poultry', nameKh: 'សាច់ និងបក្សី', icon: Drumstick, count: 24 },
  { id: 'seafood', nameEn: 'Seafood', nameKh: 'គ្រឿងសមុទ្រ', icon: Fish, count: 18 },
  { id: 'dairy', nameEn: 'Dairy & Eggs', nameKh: 'ទឹកដោះគោ និងស៊ុត', icon: Milk, count: 15 },
  { id: 'dry', nameEn: 'Dry Goods & Grain', nameKh: 'គ្រឿងទេស និងអង្ករ', icon: Wheat, count: 22 },
  { id: 'fruit', nameEn: 'Fresh Fruits', nameKh: 'ផ្លែឈើ', icon: Apple, count: 12 },
  { id: 'frozen', nameEn: 'Frozen Goods', nameKh: 'អាហារកក', icon: Snowflake, count: 13 },
];

function CategoryBarContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  
  const activeCategory = searchParams?.get('category') || 'all';
  const activeCatObj = CATEGORIES.find(c => c.id === activeCategory) || CATEGORIES[0];

  const handleSelectCategory = (categoryId: string) => {
    const params = new URLSearchParams(searchParams?.toString() || '');
    if (categoryId === 'all') {
      params.delete('category');
    } else {
      params.set('category', categoryId);
    }
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
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

  return (
    <div className="w-full bg-white border-b border-border py-2.5 px-4 sm:px-6 shadow-2xs">
      <div className="max-w-7xl mx-auto">
        {/* 1. MOBILE ACTION BAR & DRAWER (md:hidden for viewports under 768px) */}
        <div className="md:hidden">
          <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
            <DrawerTrigger asChild>
              <button
                className="w-full flex items-center justify-between gap-3 px-4 py-2.5 bg-emerald-600 text-white rounded-xl shadow-sm hover:bg-emerald-700 transition-all active:scale-[0.99] min-h-[48px]"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="p-1.5 bg-white/10 rounded-lg shrink-0">
                    <activeCatObj.icon className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col text-left overflow-hidden">
                    <span className="text-[10px] uppercase font-bold text-emerald-100 tracking-wider">
                      Filtering Category
                    </span>
                    <span className="font-semibold text-sm leading-tight truncate">
                      {activeCatObj.nameEn}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="px-2 py-0.5 bg-white/20 rounded-md text-xs font-bold">
                    {activeCatObj.count}
                  </span>
                  <Filter className="w-4 h-4 text-emerald-100" />
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
                {CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  const isSelected = activeCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => {
                        handleSelectCategory(cat.id);
                        setDrawerOpen(false);
                      }}
                      className={`group flex flex-col justify-between p-3.5 rounded-xl border text-left transition-all min-h-[72px] shadow-2xs ${
                        isSelected
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-100 ring-2 ring-emerald-600 ring-offset-2'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 active:bg-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-2">
                        <div className={`p-2 rounded-lg shrink-0 ${
                          isSelected ? 'bg-white/10 text-white' : 'bg-white text-slate-600 shadow-2xs'
                        }`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-md text-xs font-bold ${
                            isSelected
                              ? 'bg-white/20 text-white'
                              : 'bg-white border border-slate-200 text-slate-700'
                          }`}
                        >
                          {cat.count}
                        </span>
                      </div>

                      {/* Stacked bilingual text format */}
                      <div className="flex flex-col mt-1">
                        <span className={`font-semibold text-xs leading-tight tracking-tight ${
                          isSelected ? 'text-white' : 'text-slate-900'
                        }`}>
                          {cat.nameEn}
                        </span>
                        <span className={`font-kantumruy text-[11px] leading-relaxed mt-0.5 font-light ${
                          isSelected ? 'text-white/90' : 'text-slate-500'
                        }`}>
                          {cat.nameKh}
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
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 z-10 p-2 bg-white/95 hover:bg-slate-100 border border-slate-200 rounded-full shadow-md text-slate-700 transition-all opacity-0 group-hover/scroll:opacity-100 hidden md:flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-emerald-500"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Component Structure & Layout: Wide horizontal scroll container */}
          <ScrollArea ref={scrollRef} orientation="horizontal" className="w-full whitespace-nowrap">
            <div className="flex items-center gap-2.5 pb-2 pt-1 flex-nowrap">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isSelected = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => handleSelectCategory(cat.id)}
                    className={`group inline-flex items-center justify-between gap-3 px-3.5 py-2 rounded-xl border text-left transition-all flex-shrink-0 shadow-2xs ${
                      isSelected
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-100 scale-[1.01]'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                    }`}
                  >
                    {/* Visual Accents: Explicit Lucide Icon on Left */}
                    <div className={`p-1.5 rounded-lg flex-shrink-0 transition-colors ${
                      isSelected ? 'bg-white/10 text-white' : 'bg-white text-slate-500 group-hover:text-emerald-600 shadow-2xs'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>

                    {/* Localization & Text Stacking: Stacked vertically without inline slashes */}
                    <div className="flex flex-col py-0.5">
                      <span className={`font-semibold text-xs leading-tight tracking-tight ${
                        isSelected ? 'text-white' : 'text-slate-900'
                      }`}>
                        {cat.nameEn}
                      </span>
                      <span className={`font-kantumruy text-[11px] leading-relaxed mt-0.5 font-light tracking-normal ${
                        isSelected ? 'text-white/90' : 'text-slate-500'
                      }`}>
                        {cat.nameKh}
                      </span>
                    </div>

                    {/* Visual Accents: Compact Numeric Badge on Right */}
                    <span
                      className={`ml-1 px-2 py-0.5 rounded-md text-xs font-bold transition-colors ${
                        isSelected
                          ? 'bg-white/20 text-white'
                          : 'bg-white border border-slate-200 text-slate-700 group-hover:border-slate-300'
                      }`}
                    >
                      {cat.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </ScrollArea>

          {/* Right Scroll Arrow Button for Desktop Accessibility */}
          <button
            onClick={() => handleScroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 z-10 p-2 bg-white/95 hover:bg-slate-100 border border-slate-200 rounded-full shadow-md text-slate-700 transition-all opacity-0 group-hover/scroll:opacity-100 hidden md:flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-emerald-500"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function CategoryBar() {
  return (
    <Suspense fallback={<div className="h-16 w-full bg-white border-b border-border animate-pulse" />}>
      <CategoryBarContent />
    </Suspense>
  );
}
