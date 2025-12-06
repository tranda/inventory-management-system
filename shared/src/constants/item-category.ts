// Item category constants and helpers

import { ItemCategory } from '../types/item.types.js';

export const ITEM_CATEGORY_LABELS: Record<ItemCategory, string> = {
  [ItemCategory.LAPTOP]: 'Laptop',
  [ItemCategory.MONITOR]: 'Monitor',
  [ItemCategory.KEYBOARD]: 'Keyboard',
  [ItemCategory.MOUSE]: 'Mouse',
  [ItemCategory.HEADSET]: 'Headset',
  [ItemCategory.PHONE]: 'Phone',
  [ItemCategory.TABLET]: 'Tablet',
  [ItemCategory.CABLES]: 'Cables',
  [ItemCategory.SOFTWARE_LICENSE]: 'Software License',
  [ItemCategory.OTHER]: 'Other',
};

export const ITEM_CATEGORY_ICONS: Record<ItemCategory, string> = {
  [ItemCategory.LAPTOP]: 'laptop',
  [ItemCategory.MONITOR]: 'monitor',
  [ItemCategory.KEYBOARD]: 'keyboard',
  [ItemCategory.MOUSE]: 'mouse',
  [ItemCategory.HEADSET]: 'headphones',
  [ItemCategory.PHONE]: 'smartphone',
  [ItemCategory.TABLET]: 'tablet',
  [ItemCategory.CABLES]: 'cable',
  [ItemCategory.SOFTWARE_LICENSE]: 'key',
  [ItemCategory.OTHER]: 'package',
};

// Categories that are typically consumable (for low stock alerts)
export const CONSUMABLE_CATEGORIES: ItemCategory[] = [
  ItemCategory.KEYBOARD,
  ItemCategory.MOUSE,
  ItemCategory.HEADSET,
  ItemCategory.CABLES,
];

// Asset ID prefixes by category
export const ASSET_ID_PREFIXES: Record<ItemCategory, string> = {
  [ItemCategory.LAPTOP]: 'LT',
  [ItemCategory.MONITOR]: 'MN',
  [ItemCategory.KEYBOARD]: 'KB',
  [ItemCategory.MOUSE]: 'MS',
  [ItemCategory.HEADSET]: 'HS',
  [ItemCategory.PHONE]: 'PH',
  [ItemCategory.TABLET]: 'TB',
  [ItemCategory.CABLES]: 'CB',
  [ItemCategory.SOFTWARE_LICENSE]: 'SW',
  [ItemCategory.OTHER]: 'OT',
};

/**
 * Get all categories as array for select dropdowns
 */
export function getCategoryOptions(): Array<{ value: ItemCategory; label: string }> {
  return Object.entries(ITEM_CATEGORY_LABELS).map(([value, label]) => ({
    value: value as ItemCategory,
    label,
  }));
}
