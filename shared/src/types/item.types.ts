// Item types for IT Inventory Management System

export const ItemCategory = {
  LAPTOP: 'LAPTOP',
  MONITOR: 'MONITOR',
  KEYBOARD: 'KEYBOARD',
  MOUSE: 'MOUSE',
  HEADSET: 'HEADSET',
  PHONE: 'PHONE',
  TABLET: 'TABLET',
  CABLES: 'CABLES',
  SOFTWARE_LICENSE: 'SOFTWARE_LICENSE',
  OTHER: 'OTHER',
} as const;

export type ItemCategory = (typeof ItemCategory)[keyof typeof ItemCategory];

export const ItemStatus = {
  AVAILABLE: 'AVAILABLE',
  ASSIGNED: 'ASSIGNED',
  RESERVED: 'RESERVED',
  IN_REPAIR: 'IN_REPAIR',
  DECOMMISSIONED: 'DECOMMISSIONED',
  LOST_STOLEN: 'LOST_STOLEN',
} as const;

export type ItemStatus = (typeof ItemStatus)[keyof typeof ItemStatus];

export const ItemCondition = {
  NEW: 'NEW',
  GOOD: 'GOOD',
  FAIR: 'FAIR',
  NEEDS_REPAIR: 'NEEDS_REPAIR',
  DECOMMISSIONED: 'DECOMMISSIONED',
} as const;

export type ItemCondition = (typeof ItemCondition)[keyof typeof ItemCondition];

export interface Item {
  id: string;
  assetId: string;
  name: string;
  category: ItemCategory;
  status: ItemStatus;
  condition: ItemCondition;
  brand: string | null;
  model: string | null;
  serialNumber: string;
  purchaseDate: Date | null;
  purchasePrice: number | null;
  warrantyExpiration: Date | null;
  location: string | null;
  notes: string | null;
  photoUrl: string | null;
  thumbnailUrl: string | null;
  deletedAt: Date | null;
  decommissionReason: string | null;
  isConsumable: boolean;
  minStockLevel: number | null;
  createdAt: Date;
  updatedAt: Date;
  createdById: string;
}

export interface ItemCreateInput {
  name: string;
  category: ItemCategory;
  serialNumber: string;
  assetId?: string; // Auto-generated if not provided
  condition?: ItemCondition;
  brand?: string;
  model?: string;
  purchaseDate?: Date;
  purchasePrice?: number;
  warrantyExpiration?: Date;
  location?: string;
  notes?: string;
  isConsumable?: boolean;
  minStockLevel?: number;
}

export interface ItemUpdateInput {
  name?: string;
  category?: ItemCategory;
  condition?: ItemCondition;
  brand?: string;
  model?: string;
  purchaseDate?: Date;
  purchasePrice?: number;
  warrantyExpiration?: Date;
  location?: string;
  notes?: string;
  isConsumable?: boolean;
  minStockLevel?: number;
}

export interface ItemStatusChangeInput {
  status: ItemStatus;
  reason: string;
}

export interface ItemListQuery {
  search?: string;
  category?: ItemCategory;
  status?: ItemStatus;
  condition?: ItemCondition;
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'assetId' | 'createdAt' | 'status';
  sortOrder?: 'asc' | 'desc';
  includeDeleted?: boolean;
}
