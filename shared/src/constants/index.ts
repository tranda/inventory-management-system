// Re-export all constants
export * from './item-status.js';
export * from './item-category.js';
export * from './user-roles.js';

// Export arrays for use in validators
import { ItemCategory, ItemStatus, ItemCondition } from '../types/item.types.js';
import { UserRole } from '../types/user.types.js';

export const ITEM_CATEGORIES = Object.values(ItemCategory) as [string, ...string[]];
export const ITEM_STATUSES = Object.values(ItemStatus) as [string, ...string[]];
export const ITEM_CONDITIONS = Object.values(ItemCondition) as [string, ...string[]];
export const USER_ROLES = Object.values(UserRole) as [string, ...string[]];
