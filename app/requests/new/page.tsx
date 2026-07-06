'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/app-layout';
import { Modal } from '@/components/shared/modal';
import { 
  Search, Plus, Minus, ShoppingCart, Trash2, CheckCircle2, Sparkles, AlertCircle,
  LayoutGrid, Beef, Fish, Carrot, Soup, Wheat, GlassWater, Package, Utensils,
  Egg, Droplets, CookingPot, Beer, Leaf, Store, ArrowRight, Flame, ChevronLeft, ChevronRight, Filter
} from 'lucide-react';
import { saveOrder, OrderRequest } from '@/lib/orders';
import { ProductTable } from '@/components/market/product-table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Drawer, 
  DrawerTrigger, 
  DrawerContent, 
  DrawerHeader, 
  DrawerTitle, 
  DrawerDescription 
} from '@/components/ui/drawer';

export interface IngredientItem {
  id: string;
  name: string;
  category: string;
  unit: string;
  iconName: string;
  stockLeft?: number;
  parLevel?: number;
  isCustom?: boolean;
}

const renderIcon = (iconName: string, className = "w-4 h-4") => {
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
    default: return <Store className={className} />;
  }
};

const CATEGORIES = [
  { id: 'all', nameEn: 'All Items', nameKh: 'ទាំងអស់', iconName: 'LayoutGrid' },
  { id: 'Meat & Poultry', nameEn: 'Meat & Poultry', nameKh: 'សាច់ និងបក្សី', iconName: 'Beef' },
  { id: 'Seafood & Fish', nameEn: 'Seafood & Fish', nameKh: 'គ្រឿងសមុទ្រ និងត្រី', iconName: 'Fish' },
  { id: 'Vegetables & Herbs', nameEn: 'Vegetables & Herbs', nameKh: 'បន្លែ និងគ្រឿងទេស', iconName: 'Carrot' },
  { id: 'Sauces & Pantry', nameEn: 'Sauces & Pantry', nameKh: 'គ្រឿងផ្សំ និងទឹកជ្រលក់', iconName: 'Soup' },
  { id: 'Rice & Noodles', nameEn: 'Rice & Noodles', nameKh: 'អង្ករ និងមី/គុយទាវ', iconName: 'Wheat' },
  { id: 'Beverages & Ice', nameEn: 'Beverages & Ice', nameKh: 'ភេសជ្ជៈ និងទឹកកក', iconName: 'GlassWater' },
];

const DEFAULT_INGREDIENTS: IngredientItem[] = [
  // Meat & Poultry
  { id: 'pork-belly', name: 'Pork Belly (សាច់ជ្រូកបីជាន់)', category: 'Meat & Poultry', unit: 'kg', iconName: 'Beef', stockLeft: 2, parLevel: 10 },
  { id: 'ground-pork', name: 'Ground Pork · សាច់ជ្រូកចិញ្ច្រាំ', category: 'Meat & Poultry', unit: 'kg', iconName: 'Beef', stockLeft: 5, parLevel: 8 },
  { id: 'chicken-breast', name: 'Chicken Breast', category: 'Meat & Poultry', unit: 'kg', iconName: 'Utensils', stockLeft: 12, parLevel: 15 },
  { id: 'whole-chicken', name: 'មាន់មូល (Whole Chicken)', category: 'Meat & Poultry', unit: 'bird', iconName: 'Egg', stockLeft: 4, parLevel: 12 },
  { id: 'beef-tenderloin', name: 'Beef Tenderloin (សាច់គោ)', category: 'Meat & Poultry', unit: 'kg', iconName: 'Beef', stockLeft: 1.5, parLevel: 5 },
  { id: 'duck', name: 'ទា · Fresh Duck', category: 'Meat & Poultry', unit: 'bird', iconName: 'Utensils', stockLeft: 3, parLevel: 6 },

  // Seafood & Fish
  { id: 'river-fish', name: 'River Fish / ត្រីរៀល', category: 'Seafood & Fish', unit: 'kg', iconName: 'Fish', stockLeft: 3, parLevel: 10 },
  { id: 'shrimp', name: 'Shrimp / Prawns (បង្គា)', category: 'Seafood & Fish', unit: 'kg', iconName: 'Fish', stockLeft: 2, parLevel: 8 },
  { id: 'squid', name: 'មឹកស្រស់ (Squid)', category: 'Seafood & Fish', unit: 'kg', iconName: 'Fish', stockLeft: 6, parLevel: 10 },
  { id: 'crab', name: 'Fresh Crab · ក្តាមស្រស់', category: 'Seafood & Fish', unit: 'kg', iconName: 'Fish', stockLeft: 4, parLevel: 8 },

  // Vegetables & Herbs
  { id: 'lemongrass', name: 'Lemongrass (ស្លឹកគ្រៃ)', category: 'Vegetables & Herbs', unit: 'bundle', iconName: 'Leaf', stockLeft: 4, parLevel: 15 },
  { id: 'garlic', name: 'ខ្ទឹមស (Garlic)', category: 'Vegetables & Herbs', unit: 'kg', iconName: 'Carrot', stockLeft: 3, parLevel: 10 },
  { id: 'shallots', name: 'Shallots / Red Onion', category: 'Vegetables & Herbs', unit: 'kg', iconName: 'Carrot', stockLeft: 5, parLevel: 12 },
  { id: 'kaffir-lime', name: 'ស្លឹកក្រូចសើច (Kaffir Lime Leaves)', category: 'Vegetables & Herbs', unit: 'bundle', iconName: 'Leaf', stockLeft: 8, parLevel: 15 },
  { id: 'galangal', name: 'Galangal (រំដេង)', category: 'Vegetables & Herbs', unit: 'kg', iconName: 'Carrot', stockLeft: 2, parLevel: 6 },
  { id: 'morning-glory', name: 'Morning Glory · ត្រកួន', category: 'Vegetables & Herbs', unit: 'bundle', iconName: 'Leaf', stockLeft: 10, parLevel: 20 },
  { id: 'holy-basil', name: 'ម្រះព្រៅ (Holy Basil)', category: 'Vegetables & Herbs', unit: 'bundle', iconName: 'Leaf', stockLeft: 5, parLevel: 12 },
  { id: 'thai-eggplant', name: 'Thai Eggplant (ត្រប់)', category: 'Vegetables & Herbs', unit: 'kg', iconName: 'Carrot', stockLeft: 4, parLevel: 10 },
  { id: 'lime', name: 'ក្រូចឆ្មា · Fresh Lime', category: 'Vegetables & Herbs', unit: 'kg', iconName: 'Carrot', stockLeft: 3, parLevel: 15 },
  { id: 'chili', name: 'Red Chili (ម្ទេសស្រស់)', category: 'Vegetables & Herbs', unit: 'kg', iconName: 'Carrot', stockLeft: 2.5, parLevel: 5 },

  // Sauces & Pantry
  { id: 'fish-sauce', name: 'Fish Sauce (ទឹកត្រី)', category: 'Sauces & Pantry', unit: 'bottle', iconName: 'Soup', stockLeft: 6, parLevel: 20 },
  { id: 'oyster-sauce', name: 'ប្រេងខ្យង (Oyster Sauce)', category: 'Sauces & Pantry', unit: 'bottle', iconName: 'Soup', stockLeft: 4, parLevel: 12 },
  { id: 'palm-sugar', name: 'Palm Sugar · ស្ករត្នោត', category: 'Sauces & Pantry', unit: 'kg', iconName: 'CookingPot', stockLeft: 5, parLevel: 10 },
  { id: 'msg-soup-powder', name: 'MSG / Soup Powder (ម្សៅស៊ុប)', category: 'Sauces & Pantry', unit: 'pack', iconName: 'Package', stockLeft: 8, parLevel: 15 },
  { id: 'soy-sauce', name: 'Soy Sauce (ទឹកស៊ីអ៊ីវ)', category: 'Sauces & Pantry', unit: 'bottle', iconName: 'Soup', stockLeft: 5, parLevel: 15 },
  { id: 'coconut-milk', name: 'ខ្ទិះដូង · Coconut Milk', category: 'Sauces & Pantry', unit: 'can', iconName: 'Package', stockLeft: 10, parLevel: 24 },

  // Rice & Noodles
  { id: 'jasmine-rice', name: 'Jasmine Rice 25kg (អង្ករម្លិះ)', category: 'Rice & Noodles', unit: 'sack', iconName: 'Wheat', stockLeft: 1, parLevel: 5 },
  { id: 'kuyteav', name: 'គុយទាវ (Rice Noodles)', category: 'Rice & Noodles', unit: 'kg', iconName: 'Wheat', stockLeft: 8, parLevel: 20 },
  { id: 'egg-noodles', name: 'Egg Noodles · មីលឿង', category: 'Rice & Noodles', unit: 'pack', iconName: 'Package', stockLeft: 15, parLevel: 30 },
  { id: 'rice-paper', name: 'នំបញ្ចុក / Rice Paper', category: 'Rice & Noodles', unit: 'pack', iconName: 'Package', stockLeft: 6, parLevel: 15 },

  // Beverages & Ice
  { id: 'drinking-water', name: 'Drinking Water (ទឹកបរិសុទ្ធ)', category: 'Beverages & Ice', unit: 'case', iconName: 'Droplets', stockLeft: 5, parLevel: 20 },
  { id: 'crushed-ice', name: 'ទឹកកកអនាម័យ (Crushed Ice)', category: 'Beverages & Ice', unit: 'sack', iconName: 'GlassWater', stockLeft: 2, parLevel: 10 },
  { id: 'cooking-wine', name: 'Cooking Wine / Beer', category: 'Beverages & Ice', unit: 'case', iconName: 'Beer', stockLeft: 3, parLevel: 8 },
];

const COMMON_UNITS = [
  'kg',
  'g',
  'bundle',
  'bottle',
  'sack',
  'pack',
  'can',
  'case',
  'bird',
  'piece'
];

export default function NewRequestPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // State
  const categoryScrollRef = React.useRef<HTMLDivElement>(null);
  const handleCategoryScroll = (direction: 'left' | 'right') => {
    if (categoryScrollRef.current) {
      const scrollAmount = 320;
      categoryScrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  const [ingredients, setIngredients] = useState<IngredientItem[]>(DEFAULT_INGREDIENTS);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [categoryDrawerOpen, setCategoryDrawerOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [orderItems, setOrderItems] = useState<Record<string, { item: IngredientItem; quantity: number; unit?: string }>>({});
  const [customUnits, setCustomUnits] = useState<Record<string, string>>({});
  
  // Modals & UI states
  const [showCustomModal, setShowCustomModal] = useState<boolean>(false);
  const [showReviewModal, setShowReviewModal] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submittedSuccess, setSubmittedSuccess] = useState<boolean>(false);

  // Custom Item Form State
  const [customName, setCustomName] = useState<string>('');
  const [customCategory, setCustomCategory] = useState<string>('Vegetables & Herbs');
  const [customUnit, setCustomUnit] = useState<string>('kg');
  const [customQty, setCustomQty] = useState<number>(1);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Filtered ingredients
  const filteredIngredients = useMemo(() => {
    return ingredients.filter((item) => {
      const matchesSearch =
        searchQuery.trim() === '' ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [ingredients, searchQuery]);

  // Grouped by category for rendering sections
  const groupedIngredients = useMemo(() => {
    const groups: Record<string, IngredientItem[]> = {};
    filteredIngredients.forEach((item) => {
      if (selectedCategory !== 'all' && item.category !== selectedCategory) {
        return;
      }
      if (!groups[item.category]) {
        groups[item.category] = [];
      }
      groups[item.category].push(item);
    });
    return groups;
  }, [filteredIngredients, selectedCategory]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: ingredients.length };
    ingredients.forEach((item) => {
      counts[item.category] = (counts[item.category] || 0) + 1;
    });
    return counts;
  }, [ingredients]);

  // Order Calculations
  const selectedList = useMemo(() => Object.values(orderItems), [orderItems]);
  const totalItemCount = selectedList.length;
  const totalUnits = useMemo(() => selectedList.reduce((sum, { quantity }) => sum + quantity, 0), [selectedList]);

  // Handlers for Quantity Stepper & Quick-Add Chips
  const handleUpdateUnit = (item: IngredientItem, newUnit: string) => {
    setCustomUnits((prev) => ({ ...prev, [item.id]: newUnit }));
    setOrderItems((prev) => {
      if (!prev[item.id]) return prev;
      return {
        ...prev,
        [item.id]: { ...prev[item.id], unit: newUnit },
      };
    });
  };

  const handleAddUnit = (item: IngredientItem, amount = 1) => {
    setOrderItems((prev) => {
      const currentQty = prev[item.id]?.quantity || 0;
      return {
        ...prev,
        [item.id]: { item, quantity: currentQty + amount, unit: prev[item.id]?.unit || customUnits[item.id] || item.unit },
      };
    });
  };

  const handleRemoveUnit = (item: IngredientItem, amount = 1) => {
    setOrderItems((prev) => {
      const currentQty = prev[item.id]?.quantity || 0;
      if (currentQty <= amount) {
        const next = { ...prev };
        delete next[item.id];
        return next;
      }
      return {
        ...prev,
        [item.id]: { ...prev[item.id], quantity: currentQty - amount },
      };
    });
  };

  const handleSetExactQuantity = (item: IngredientItem, qty: number) => {
    if (qty <= 0 || isNaN(qty)) {
      setOrderItems((prev) => {
        const next = { ...prev };
        delete next[item.id];
        return next;
      });
      return;
    }
    setOrderItems((prev) => ({
      ...prev,
      [item.id]: { item, quantity: qty, unit: prev[item.id]?.unit || customUnits[item.id] || item.unit },
    }));
  };


  const handleRemoveAllOfItem = (itemId: string) => {
    setOrderItems((prev) => {
      const next = { ...prev };
      delete next[itemId];
      return next;
    });
  };

  // Card click anywhere (except stepper controls) focuses input
  const handleCardClick = (e: React.MouseEvent, itemId: string) => {
    if (!(e.target as HTMLElement).closest('.stepper-control')) {
      const inputEl = document.getElementById(`qty-input-${itemId}`) as HTMLInputElement | null;
      if (inputEl) {
        inputEl.focus();
        inputEl.select();
      }
    }
  };

  // Add Custom Item
  const handleCreateCustomItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;

    const newItem: IngredientItem = {
      id: `custom-${Date.now()}`,
      name: customName.trim(),
      category: customCategory,
      unit: customUnit,
      iconName: 'Package',
      isCustom: true,
    };

    setIngredients((prev) => [newItem, ...prev]);
    setOrderItems((prev) => ({
      ...prev,
      [newItem.id]: { item: newItem, quantity: customQty, unit: customUnit },
    }));

    setCustomName('');
    setCustomQty(1);
    setShowCustomModal(false);
  };

  // Submit Order
  const handleSubmitOrder = async () => {
    if (totalItemCount === 0) return;
    setSubmitting(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 800));

      const newOrder: OrderRequest = {
        id: `ORD-2026-${Math.floor(100 + Math.random() * 900)}`,
        status: 'pending',
        date: new Date().toISOString().split('T')[0],
        total: `$${(totalUnits * 4.5).toFixed(2)}`,
        createdBy: user?.name ? `${user.name} (ចុងភៅ)` : 'Staff (ចុងភៅ)',
        items: selectedList.map(({ item, quantity, unit }) => ({
          id: item.id,
          nameEn: item.name,
          nameKh: '',
          unit: unit || customUnits[item.id] || item.unit,
          ordered: quantity,
          icon: item.iconName,
        })),
      };
      saveOrder(newOrder);

      setSubmitting(false);
      setSubmittedSuccess(true);

      setTimeout(() => {
        router.push('/requests');
      }, 1200);
    } catch (err) {
      alert('Error submitting request / មានបញ្ហាក្នុងការបញ្ជូន');
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground font-medium">Loading market order...</div>;
  }

  if (!user) {
    return null;
  }

  return (
    <AppLayout title="Create Market Order / បង្ហោះការបញ្ជាទិញ">
      <datalist id="common-units-list">
        {COMMON_UNITS.map((u) => (
          <option key={u} value={u} />
        ))}
      </datalist>
      <div className="space-y-6 pb-32">
        {/* Sticky Search & Category Header (Food Delivery Style) */}
        <div className="sticky top-0 z-30 -mx-4 sm:-mx-6 px-4 sm:px-6 py-3.5 bg-background/95 backdrop-blur-md border-b border-border/80 shadow-xs space-y-3.5 transition-all">
          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-col">
              <h2 className="text-base sm:text-lg font-black text-foreground flex items-center gap-1.5">
                <Flame className="w-5 h-5 text-[#0A8F4D] fill-[#0A8F4D]" />
                <span>Quick Order Basket / បង្ហោះការបញ្ជាទិញ</span>
              </h2>
              <p className="text-[11px] text-muted-foreground font-medium">
                Tap cards to type exact quantity · 48x48px touch controls
              </p>
            </div>
            <button
              onClick={() => setShowCustomModal(true)}
              className="inline-flex items-center justify-center gap-1.5 bg-[#0A8F4D]/10 hover:bg-[#0A8F4D]/20 text-[#0A8F4D] font-bold px-3 py-2 rounded-xl text-xs transition-all border border-[#0A8F4D]/30 active:scale-95 flex-shrink-0"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Custom Item</span>
            </button>
          </div>

          {/* Sticky Search Bar (No Barcode Icon as requested) */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search ingredient (e.g., Pork, ស្លឹកគ្រៃ, Rice)..."
              className="w-full pl-10 pr-12 py-2.5 bg-secondary/70 border border-border/80 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#0A8F4D] focus:border-[#0A8F4D] transition-all placeholder:text-muted-foreground/50 shadow-2xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground hover:text-foreground bg-background border border-border px-2 py-1 rounded-md transition-colors"
              >
                Clear
              </button>
            )}
          </div>

          {/* 1. MOBILE ACTION BAR & DRAWER (md:hidden under 768px) */}
          <div className="md:hidden mt-2">
            <Drawer open={categoryDrawerOpen} onOpenChange={setCategoryDrawerOpen}>
              <DrawerTrigger asChild>
                <button
                  className="w-full flex items-center justify-between gap-3 px-4 py-2.5 bg-emerald-600 text-white rounded-xl shadow-sm hover:bg-emerald-700 transition-all active:scale-[0.99] min-h-[48px]"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="p-1.5 bg-white/10 rounded-lg shrink-0">
                      {renderIcon(CATEGORIES.find(c => c.id === selectedCategory)?.iconName || 'LayoutGrid', "w-5 h-5")}
                    </div>
                    <div className="flex flex-col text-left overflow-hidden">
                      <span className="text-[10px] uppercase font-bold text-emerald-100 tracking-wider">
                        Filtering Category
                      </span>
                      <span className="font-semibold text-sm leading-tight truncate">
                        {CATEGORIES.find(c => c.id === selectedCategory)?.nameEn || 'All Ingredients'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="px-2 py-0.5 bg-white/20 rounded-md text-xs font-bold">
                      {categoryCounts[selectedCategory] || categoryCounts['all'] || 142}
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
                    const isSelected = selectedCategory === cat.id;
                    const count = categoryCounts[cat.id] || 0;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => {
                          setSelectedCategory(cat.id);
                          setCategoryDrawerOpen(false);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
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
                            {renderIcon(cat.iconName, "w-5 h-5")}
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
            <button
              onClick={() => handleCategoryScroll('left')}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 z-10 p-2 bg-white/95 hover:bg-slate-100 border border-slate-200 rounded-full shadow-md text-slate-700 transition-all opacity-0 group-hover/scroll:opacity-100 hidden sm:flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-emerald-500"
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <ScrollArea ref={categoryScrollRef} orientation="horizontal" className="w-full whitespace-nowrap">
              <div className="flex items-center gap-2.5 pb-2 pt-1 flex-nowrap">
                {CATEGORIES.map((cat) => {
                  const isSelected = selectedCategory === cat.id;
                  const count = categoryCounts[cat.id] || 0;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setSelectedCategory(cat.id);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className={`group inline-flex items-center justify-between gap-3 px-3.5 py-2 rounded-xl border text-left transition-all flex-shrink-0 shadow-2xs ${
                        isSelected
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-100 scale-[1.01]'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                      }`}
                    >
                      {/* 3. Visual Accents: Explicit Lucide Icon on Left */}
                      <div className={`p-1.5 rounded-lg flex-shrink-0 transition-colors ${
                        isSelected ? 'bg-white/10 text-white' : 'bg-white text-slate-500 group-hover:text-emerald-600 shadow-2xs'
                      }`}>
                        {renderIcon(cat.iconName, "w-4 h-4")}
                      </div>

                      {/* 2. Localization & Text Stacking: Stacked vertically without inline slashes */}
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

                      {/* 3. Visual Accents: Compact Numeric Badge on Right */}
                      <span
                        className={`ml-1 px-2 py-0.5 rounded-md text-xs font-bold transition-colors ${
                          isSelected
                            ? 'bg-white/20 text-white'
                            : 'bg-white border border-slate-200 text-slate-700 group-hover:border-slate-300'
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </ScrollArea>

            <button
              onClick={() => handleCategoryScroll('right')}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 z-10 p-2 bg-white/95 hover:bg-slate-100 border border-slate-200 rounded-full shadow-md text-slate-700 transition-all opacity-0 group-hover/scroll:opacity-100 hidden sm:flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-emerald-500"
              aria-label="Scroll right"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Product Cards Grid (Food Delivery Style) */}
        {filteredIngredients.length === 0 ? (
          <div className="bg-card border border-dashed border-border rounded-2xl p-12 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-secondary text-muted-foreground flex items-center justify-center mx-auto">
              <Search className="w-7 h-7" />
            </div>
            <div>
              <h3 className="font-bold text-foreground text-base">No ingredients found</h3>
              <p className="text-xs text-muted-foreground mt-0.5 font-medium">រកមិនឃើញមុខទំនិញដែលអ្នកស្វែងរកទេ</p>
            </div>
            <p className="text-xs text-muted-foreground font-medium">
              Try a different keyword or click &quot;Custom Item&quot; above to add it manually.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedIngredients).map(([category, items]) => {
              const catMeta = CATEGORIES.find(c => c.id === category) || { nameEn: category, nameKh: '', iconName: 'LayoutGrid', id: category };
              return (
                <div key={category} id={`cat-section-${catMeta.id}`} className="space-y-3 scroll-mt-36">
                  {/* Category Title Banner */}
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 rounded-lg bg-[#0A8F4D]/10 text-[#0A8F4D]">
                        {renderIcon(catMeta.iconName, "w-4 h-4")}
                      </span>
                      <h3 className="font-black text-base sm:text-lg text-foreground tracking-tight flex items-center gap-2">
                        <span>{catMeta.nameEn}</span>
                        {catMeta.nameKh && <span className="font-kantumruy text-sm font-normal text-muted-foreground">{catMeta.nameKh}</span>}
                      </h3>
                      <span className="text-xs font-bold text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                        {items.length}
                      </span>
                    </div>
                  </div>

                  {/* High-Density Enterprise TanStack Data Table */}
                  <ProductTable
                    items={items}
                    orderItems={orderItems}
                    onQuantityChange={handleSetExactQuantity}
                    customUnits={customUnits}
                    onUnitChange={handleUpdateUnit}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating Order Summary Basket (Food Delivery App Style) */}
      <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-8 sm:w-[420px] z-40 transition-all transform animate-in slide-in-from-bottom-6 duration-300">
        <div
          onClick={() => totalItemCount > 0 && setShowReviewModal(true)}
          className={`rounded-2xl p-4 shadow-2xl border transition-all flex items-center justify-between gap-4 ${
            totalItemCount > 0
              ? 'bg-[#0A8F4D] text-white border-[#0A8F4D]/80 hover:bg-[#0A8F4D]/95 cursor-pointer active:scale-[0.99] shadow-[#0A8F4D]/30'
              : 'bg-card text-muted-foreground border-border opacity-75 cursor-not-allowed'
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div className={`relative p-2.5 rounded-xl font-bold flex items-center justify-center ${
              totalItemCount > 0 ? 'bg-white text-[#0A8F4D]' : 'bg-secondary text-muted-foreground'
            }`}>
              <ShoppingCart className="w-6 h-6 stroke-[2.5]" />
              {totalItemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[11px] font-black w-6 h-6 rounded-full flex items-center justify-center shadow-md animate-bounce">
                  {totalItemCount}
                </span>
              )}
            </div>
            <div className="flex flex-col">
              <span className={`text-base font-black leading-tight ${totalItemCount > 0 ? 'text-white' : 'text-foreground'}`}>
                {totalItemCount === 0 ? 'Basket Empty / មិនទាន់ជ្រើសរើស' : 'View Order Basket'}
              </span>
              <span className={`text-xs font-semibold ${totalItemCount > 0 ? 'text-white/90' : 'text-muted-foreground'}`}>
                {totalItemCount === 0 ? 'Tap cards above to add items' : `${totalItemCount} items · ${totalUnits} total units`}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`text-sm font-black px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all ${
              totalItemCount > 0 ? 'bg-white/20 text-white hover:bg-white/30' : 'bg-secondary text-muted-foreground'
            }`}>
              <span>Review</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </span>
          </div>
        </div>
      </div>

      {/* Review & Submit Checkout Modal */}
      <Modal
        isOpen={showReviewModal}
        onClose={() => !submitting && setShowReviewModal(false)}
        title="Review Order Basket / ពិនិត្យបញ្ជីទំនិញ"
      >
        {submittedSuccess ? (
          <div className="py-12 text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/50 text-[#0A8F4D] rounded-full flex items-center justify-center mx-auto animate-bounce shadow-md">
              <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-xl font-black text-foreground">Order Sent to Supplier!</h3>
              <p className="text-sm text-muted-foreground mt-1 font-medium">ការបញ្ជាទិញរបស់អ្នកត្រូវបានបញ្ជូនទៅកាន់អ្នកផ្គត់ផ្គង់ហើយ</p>
            </div>
            <p className="text-xs text-muted-foreground font-bold animate-pulse">Redirecting to orders list...</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3.5 text-xs text-amber-700 dark:text-amber-400 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-500 stroke-[2.5]" />
              <div className="flex flex-col gap-0.5">
                <span className="font-bold">Please review quantities and units before sending to market supplier.</span>
                <span className="text-[11px] font-medium opacity-90">សូមពិនិត្យចំនួនទំនិញមុនពេលបញ្ជូនទៅអ្នកផ្គត់ផ្គង់</span>
              </div>
            </div>

            {/* List of Ordered Items */}
            <div className="max-h-80 overflow-y-auto divide-y divide-border border border-border rounded-xl bg-card shadow-2xs">
              {selectedList.map(({ item, quantity }) => (
                <div key={item.id} className="p-3.5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-[#0A8F4D]/10 text-[#0A8F4D] flex-shrink-0 font-bold">
                      {renderIcon(item.iconName, "w-5 h-5")}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-foreground">{item.name}</h4>
                      <p className="text-xs text-muted-foreground font-medium">{item.category}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 text-right">
                      <span className="font-black text-base text-foreground">{quantity}</span>
                      <input
                        type="text"
                        list="common-units-list"
                        value={customUnits[item.id] || item.unit}
                        onChange={(e) => handleUpdateUnit(item, e.target.value)}
                        placeholder="unit"
                        className="w-16 px-1.5 py-0.5 text-xs font-black text-center bg-background border border-border/80 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0A8F4D] text-[#0A8F4D] shadow-2xs"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveAllOfItem(item.id)}
                      className="text-muted-foreground hover:text-red-600 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors"
                      title="Remove item"
                    >
                      <Trash2 className="w-4 h-4 stroke-[2.5]" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Total Summary */}
            <div className="bg-secondary/70 rounded-xl p-4 flex items-center justify-between border border-border/80">
              <div>
                <span className="text-sm font-bold text-foreground">Total Procurement Basket</span>
                <p className="text-xs text-muted-foreground font-medium">ទំហំបញ្ជាទិញសរុប</p>
              </div>
              <div className="text-right">
                <span className="text-xl font-black text-[#0A8F4D]">{totalUnits}</span>
                <span className="text-xs text-muted-foreground ml-1 font-bold">units across {totalItemCount} items</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={submitting}
                onClick={() => setShowReviewModal(false)}
                className="px-5 py-2.5 rounded-xl border border-border bg-transparent hover:bg-secondary text-sm font-bold text-foreground transition-all"
              >
                Cancel / បោះបង់
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleSubmitOrder}
                className="bg-[#0A8F4D] hover:bg-[#0A8F4D]/90 text-white px-6 py-2.5 rounded-xl font-black text-sm transition-all shadow-md flex items-center gap-2 disabled:opacity-50 active:scale-95"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Sending Order...</span>
                  </>
                ) : (
                  <>
                    <span>Send Order Now</span>
                    <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Custom Item Modal */}
      <Modal
        isOpen={showCustomModal}
        onClose={() => setShowCustomModal(false)}
        title="Add Custom Item / បន្ថែមមុខទំនិញផ្សេង"
      >
        <form onSubmit={handleCreateCustomItem} className="space-y-4">
          <div className="bg-[#0A8F4D]/10 p-3.5 rounded-xl text-xs text-[#0A8F4D] flex items-center gap-2.5 font-bold">
            <Sparkles className="w-5 h-5 flex-shrink-0" />
            <span>Add an unlisted ingredient directly to your current order basket.</span>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-foreground mb-1">
                Item Name <span className="text-muted-foreground font-medium">/ ឈ្មោះទំនិញ (English, Khmer, or mixed)</span>
              </label>
              <input
                type="text"
                required
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="e.g., Fresh Bamboo Shoots · ទំពាំងស្រស់"
                className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#0A8F4D] focus:border-[#0A8F4D]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-foreground mb-1">
                  Category <span className="text-muted-foreground font-medium">/ ប្រភេទ</span>
                </label>
                <select
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#0A8F4D] focus:border-[#0A8F4D]"
                >
                  {CATEGORIES.filter((c) => c.id !== 'all').map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nameEn} ({c.nameKh})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1">
                  Unit <span className="text-muted-foreground font-medium">/ ខ្នាត</span>
                </label>
                <input
                  type="text"
                  list="common-units-list"
                  value={customUnit}
                  onChange={(e) => setCustomUnit(e.target.value)}
                  placeholder="kg, pack, box..."
                  className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#0A8F4D] focus:border-[#0A8F4D]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-foreground mb-1">
                Initial Quantity <span className="text-muted-foreground font-medium">/ ចំនួនចាប់ផ្តើម</span>
              </label>
              <input
                type="number"
                step="any"
                min="0.1"
                required
                value={customQty}
                onChange={(e) => setCustomQty(parseFloat(e.target.value) || 0)}
                className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#0A8F4D] focus:border-[#0A8F4D]"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={() => setShowCustomModal(false)}
              className="px-4 py-2.5 rounded-xl border border-border bg-transparent hover:bg-secondary text-sm font-bold text-foreground transition-all"
            >
              Cancel / បោះបង់
            </button>
            <button
              type="submit"
              className="bg-[#0A8F4D] hover:bg-[#0A8F4D]/90 text-white px-6 py-2.5 rounded-xl font-black text-sm transition-all shadow-md flex items-center gap-2 active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Add to Basket</span>
            </button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  );
}
