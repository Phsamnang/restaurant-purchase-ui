export interface IngredientItem {
  id: string;
  nameEn: string;
  nameKh: string;
  category: string;
  iconName: string;
  currentStock: number;
  parStock: number;
  defaultUnit: string;
  allowedUnits: string[];
  defaultPrice: number; // USD per default unit
  lowStockThreshold?: number;
  isCustom?: boolean;
  name?: string; // Legacy alias for nameEn + nameKh
  unit?: string; // Legacy alias for defaultUnit
}

export interface OrderItem {
  ingredient: IngredientItem;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  totalCost: number;
  supplier?: string;
  notes?: string;
}

export interface CategoryItem {
  id: string;
  nameEn: string;
  nameKh: string;
  iconName: string;
}

export const MARKET_CATEGORIES: CategoryItem[] = [
  { id: 'all', nameEn: 'All Ingredients', nameKh: 'មុខទំនិញទាំងអស់', iconName: 'LayoutGrid' },
  { id: 'Meat & Poultry', nameEn: 'Meat & Poultry', nameKh: 'សាច់ និងបក្សី', iconName: 'Beef' },
  { id: 'Seafood & Fish', nameEn: 'Seafood & Fish', nameKh: 'គ្រឿងសមុទ្រ និងត្រី', iconName: 'Fish' },
  { id: 'Vegetables & Herbs', nameEn: 'Vegetables & Herbs', nameKh: 'បន្លែ និងគ្រឿងទេស', iconName: 'Carrot' },
  { id: 'Sauces & Pantry', nameEn: 'Sauces & Pantry', nameKh: 'គ្រឿងផ្សំ និងទឹកជ្រលក់', iconName: 'Soup' },
  { id: 'Rice & Noodles', nameEn: 'Rice & Noodles', nameKh: 'អង្ករ និងមី/គុយទាវ', iconName: 'Wheat' },
  { id: 'Beverages & Ice', nameEn: 'Beverages & Ice', nameKh: 'ភេសជ្ជៈ និងទឹកកក', iconName: 'GlassWater' },
];

export const MARKET_SUPPLIERS = [
  'Morning Wet Market - Vendor A (ផ្សារព្រឹក)',
  'Orussey Wholesale Market (ផ្សារអូរឫស្សី)',
  'Makro Wholesale Cambodia (ម៉ាក្រូ)',
  'Super Duper Direct (ស៊ុបភើរឌូបភើរ)',
  'Local Farm Direct (កសិដ្ឋានក្នុងស្រុក)',
  'Seafood Direct Sihanoukville (គ្រឿងសមុទ្រកំពង់សោម)',
];

export const ALL_AVAILABLE_UNITS = [
  'kg',
  'gram',
  'bird',
  'piece',
  'bottle',
  'pack',
  'box',
  'bag'
];

export const DEFAULT_MARKET_CATALOG: IngredientItem[] = [
  // Meat & Poultry
  {
    id: 'pork-belly',
    nameEn: 'Pork Belly',
    nameKh: 'សាច់ជ្រូកបីជាន់',
    category: 'Meat & Poultry',
    iconName: 'Beef',
    currentStock: 2,
    parStock: 10,
    defaultUnit: 'kg',
    allowedUnits: ['kg', 'gram', 'piece', 'box'],
    defaultPrice: 5.80,
    lowStockThreshold: 3,
  },
  {
    id: 'ground-pork',
    nameEn: 'Ground Pork',
    nameKh: 'សាច់ជ្រូកចិញ្ច្រាំ',
    category: 'Meat & Poultry',
    iconName: 'Beef',
    currentStock: 5,
    parStock: 12,
    defaultUnit: 'kg',
    allowedUnits: ['kg', 'gram', 'pack'],
    defaultPrice: 4.50,
    lowStockThreshold: 4,
  },
  {
    id: 'chicken-breast',
    nameEn: 'Chicken Breast',
    nameKh: 'ទ្រូងមាន់ស្រស់',
    category: 'Meat & Poultry',
    iconName: 'Utensils',
    currentStock: 12,
    parStock: 15,
    defaultUnit: 'kg',
    allowedUnits: ['kg', 'gram', 'piece', 'box'],
    defaultPrice: 3.80,
    lowStockThreshold: 5,
  },
  {
    id: 'whole-chicken',
    nameEn: 'Whole Chicken',
    nameKh: 'មាន់មូលស្រស់',
    category: 'Meat & Poultry',
    iconName: 'Egg',
    currentStock: 3,
    parStock: 12,
    defaultUnit: 'bird',
    allowedUnits: ['bird', 'kg', 'piece'],
    defaultPrice: 6.50,
    lowStockThreshold: 4,
  },
  {
    id: 'beef-tenderloin',
    nameEn: 'Beef Tenderloin',
    nameKh: 'សាច់គោពិសេស',
    category: 'Meat & Poultry',
    iconName: 'Beef',
    currentStock: 1.5,
    parStock: 6,
    defaultUnit: 'kg',
    allowedUnits: ['kg', 'gram', 'piece'],
    defaultPrice: 12.50,
    lowStockThreshold: 2,
  },
  {
    id: 'fresh-duck',
    nameEn: 'Fresh Duck',
    nameKh: 'ទាស្រស់',
    category: 'Meat & Poultry',
    iconName: 'Utensils',
    currentStock: 2,
    parStock: 8,
    defaultUnit: 'bird',
    allowedUnits: ['bird', 'piece', 'kg'],
    defaultPrice: 7.20,
    lowStockThreshold: 3,
  },

  // Seafood & Fish
  {
    id: 'river-fish',
    nameEn: 'River Fish',
    nameKh: 'ត្រីរៀល / ត្រីទន្លេ',
    category: 'Seafood & Fish',
    iconName: 'Fish',
    currentStock: 3,
    parStock: 10,
    defaultUnit: 'kg',
    allowedUnits: ['kg', 'gram', 'piece'],
    defaultPrice: 4.20,
    lowStockThreshold: 3,
  },
  {
    id: 'tiger-prawns',
    nameEn: 'Tiger Prawns / Shrimp',
    nameKh: 'បង្គាខ្លាស្រស់',
    category: 'Seafood & Fish',
    iconName: 'Fish',
    currentStock: 2,
    parStock: 8,
    defaultUnit: 'kg',
    allowedUnits: ['kg', 'gram', 'box'],
    defaultPrice: 11.00,
    lowStockThreshold: 3,
  },
  {
    id: 'squid-fresh',
    nameEn: 'Fresh Squid',
    nameKh: 'មឹកស្រស់',
    category: 'Seafood & Fish',
    iconName: 'Fish',
    currentStock: 6,
    parStock: 10,
    defaultUnit: 'kg',
    allowedUnits: ['kg', 'gram', 'box'],
    defaultPrice: 7.50,
    lowStockThreshold: 3,
  },
  {
    id: 'mud-crab',
    nameEn: 'Fresh Mud Crab',
    nameKh: 'ក្តាមថ្មស្រស់',
    category: 'Seafood & Fish',
    iconName: 'Fish',
    currentStock: 4,
    parStock: 10,
    defaultUnit: 'kg',
    allowedUnits: ['kg', 'piece'],
    defaultPrice: 14.00,
    lowStockThreshold: 4,
  },

  // Vegetables & Herbs
  {
    id: 'lemongrass',
    nameEn: 'Lemongrass',
    nameKh: 'ស្លឹកគ្រៃស្រស់',
    category: 'Vegetables & Herbs',
    iconName: 'Leaf',
    currentStock: 4,
    parStock: 15,
    defaultUnit: 'kg',
    allowedUnits: ['kg', 'gram', 'piece', 'bag'],
    defaultPrice: 1.50,
    lowStockThreshold: 5,
  },
  {
    id: 'garlic-bulbs',
    nameEn: 'Garlic Bulbs',
    nameKh: 'ខ្ទឹមស',
    category: 'Vegetables & Herbs',
    iconName: 'Carrot',
    currentStock: 3,
    parStock: 10,
    defaultUnit: 'kg',
    allowedUnits: ['kg', 'gram', 'bag', 'box'],
    defaultPrice: 2.20,
    lowStockThreshold: 3,
  },
  {
    id: 'red-shallots',
    nameEn: 'Red Shallots',
    nameKh: 'ខ្ទឹមក្រហម',
    category: 'Vegetables & Herbs',
    iconName: 'Carrot',
    currentStock: 5,
    parStock: 12,
    defaultUnit: 'kg',
    allowedUnits: ['kg', 'gram', 'bag'],
    defaultPrice: 2.80,
    lowStockThreshold: 4,
  },
  {
    id: 'kaffir-lime-leaves',
    nameEn: 'Kaffir Lime Leaves',
    nameKh: 'ស្លឹកក្រូចសើច',
    category: 'Vegetables & Herbs',
    iconName: 'Leaf',
    currentStock: 2,
    parStock: 8,
    defaultUnit: 'bag',
    allowedUnits: ['bag', 'gram', 'piece'],
    defaultPrice: 0.80,
    lowStockThreshold: 3,
  },
  {
    id: 'morning-glory',
    nameEn: 'Morning Glory',
    nameKh: 'ត្រកួនស្រស់',
    category: 'Vegetables & Herbs',
    iconName: 'Leaf',
    currentStock: 10,
    parStock: 25,
    defaultUnit: 'kg',
    allowedUnits: ['kg', 'gram', 'piece', 'bag'],
    defaultPrice: 1.20,
    lowStockThreshold: 8,
  },
  {
    id: 'fresh-lime',
    nameEn: 'Fresh Lime',
    nameKh: 'ក្រូចឆ្មា',
    category: 'Vegetables & Herbs',
    iconName: 'Carrot',
    currentStock: 3,
    parStock: 15,
    defaultUnit: 'kg',
    allowedUnits: ['kg', 'gram', 'piece', 'bag'],
    defaultPrice: 2.50,
    lowStockThreshold: 5,
  },

  // Sauces & Pantry
  {
    id: 'fish-sauce-premium',
    nameEn: 'Premium Fish Sauce',
    nameKh: 'ទឹកត្រីពិសេស',
    category: 'Sauces & Pantry',
    iconName: 'Soup',
    currentStock: 6,
    parStock: 20,
    defaultUnit: 'bottle',
    allowedUnits: ['bottle', 'pack', 'box'],
    defaultPrice: 1.80,
    lowStockThreshold: 6,
  },
  {
    id: 'oyster-sauce',
    nameEn: 'Oyster Sauce',
    nameKh: 'ប្រេងខ្យង',
    category: 'Sauces & Pantry',
    iconName: 'Soup',
    currentStock: 4,
    parStock: 12,
    defaultUnit: 'bottle',
    allowedUnits: ['bottle', 'pack', 'box'],
    defaultPrice: 2.50,
    lowStockThreshold: 4,
  },
  {
    id: 'palm-sugar',
    nameEn: 'Palm Sugar',
    nameKh: 'ស្ករត្នោតធម្មជាតិ',
    category: 'Sauces & Pantry',
    iconName: 'CookingPot',
    currentStock: 5,
    parStock: 15,
    defaultUnit: 'kg',
    allowedUnits: ['kg', 'gram', 'pack', 'bag'],
    defaultPrice: 2.00,
    lowStockThreshold: 5,
  },
  {
    id: 'coconut-milk-can',
    nameEn: 'Coconut Milk',
    nameKh: 'ខ្ទិះដូងកំប៉ុង',
    category: 'Sauces & Pantry',
    iconName: 'Package',
    currentStock: 10,
    parStock: 24,
    defaultUnit: 'box',
    allowedUnits: ['box', 'pack', 'bottle'],
    defaultPrice: 1.40,
    lowStockThreshold: 8,
  },

  // Rice & Noodles
  {
    id: 'jasmine-rice-25kg',
    nameEn: 'Jasmine Rice (25kg)',
    nameKh: 'អង្ករម្លិះលេខ១ (២៥គីឡូ)',
    category: 'Rice & Noodles',
    iconName: 'Wheat',
    currentStock: 1,
    parStock: 6,
    defaultUnit: 'bag',
    allowedUnits: ['bag', 'pack', 'kg'],
    defaultPrice: 22.00,
    lowStockThreshold: 2,
  },
  {
    id: 'rice-noodles-kuyteav',
    nameEn: 'Fresh Rice Noodles',
    nameKh: 'គុយទាវស្រស់',
    category: 'Rice & Noodles',
    iconName: 'Wheat',
    currentStock: 8,
    parStock: 20,
    defaultUnit: 'kg',
    allowedUnits: ['kg', 'gram', 'pack', 'bag'],
    defaultPrice: 1.30,
    lowStockThreshold: 6,
  },
  {
    id: 'egg-noodles-yellow',
    nameEn: 'Yellow Egg Noodles',
    nameKh: 'មីលឿងពិសេស',
    category: 'Rice & Noodles',
    iconName: 'Package',
    currentStock: 15,
    parStock: 30,
    defaultUnit: 'pack',
    allowedUnits: ['pack', 'box', 'kg', 'bag'],
    defaultPrice: 0.90,
    lowStockThreshold: 10,
  },

  // Beverages & Ice
  {
    id: 'drinking-water-case',
    nameEn: 'Drinking Water Case',
    nameKh: 'ទឹកបរិសុទ្ធកេស',
    category: 'Beverages & Ice',
    iconName: 'Droplets',
    currentStock: 5,
    parStock: 20,
    defaultUnit: 'box',
    allowedUnits: ['box', 'pack', 'bottle'],
    defaultPrice: 3.50,
    lowStockThreshold: 6,
  },
  {
    id: 'crushed-ice-sack',
    nameEn: 'Crushed Hygienic Ice',
    nameKh: 'ទឹកកកអនាម័យ',
    category: 'Beverages & Ice',
    iconName: 'GlassWater',
    currentStock: 2,
    parStock: 10,
    defaultUnit: 'bag',
    allowedUnits: ['bag', 'kg', 'box'],
    defaultPrice: 2.00,
    lowStockThreshold: 3,
  },
];
