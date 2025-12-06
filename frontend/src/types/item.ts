// Item Types for Frontend

export type ItemCategory =
  | 'LAPTOP'
  | 'MONITOR'
  | 'KEYBOARD'
  | 'MOUSE'
  | 'HEADSET'
  | 'PHONE'
  | 'TABLET'
  | 'CABLES'
  | 'SOFTWARE_LICENSE'
  | 'OTHER';

export type ItemStatus =
  | 'AVAILABLE'
  | 'ASSIGNED'
  | 'RESERVED'
  | 'IN_REPAIR'
  | 'DECOMMISSIONED'
  | 'LOST_STOLEN';

export type ItemCondition =
  | 'NEW'
  | 'GOOD'
  | 'FAIR'
  | 'NEEDS_REPAIR'
  | 'DECOMMISSIONED';

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
  purchaseDate: string | null;
  purchasePrice: number | null;
  warrantyExpiration: string | null;
  location: string | null;
  notes: string | null;
  photoUrl: string | null;
  thumbnailUrl: string | null;
  isConsumable: boolean;
  minStockLevel: number | null;
  deletedAt: string | null;
  decommissionReason: string | null;
  createdAt: string;
  updatedAt: string;
  createdById: string;
  createdBy?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  assignments?: Array<{
    id: string;
    returnedAt: string | null;
    employee: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    };
  }>;
}

export interface ItemCreateInput {
  assetId: string;
  name: string;
  category: ItemCategory;
  condition?: ItemCondition;
  brand?: string;
  model?: string;
  serialNumber: string;
  purchaseDate?: string;
  purchasePrice?: number;
  warrantyExpiration?: string;
  location?: string;
  notes?: string;
  isConsumable?: boolean;
  minStockLevel?: number;
}

export interface ItemUpdateInput {
  name?: string;
  category?: ItemCategory;
  condition?: ItemCondition;
  brand?: string | null;
  model?: string | null;
  purchaseDate?: string | null;
  purchasePrice?: number | null;
  warrantyExpiration?: string | null;
  location?: string | null;
  notes?: string | null;
  isConsumable?: boolean;
  minStockLevel?: number | null;
}

export interface ItemListQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  category?: ItemCategory;
  status?: ItemStatus;
  condition?: ItemCondition;
  includeDeleted?: boolean;
}

// Category options for forms
export const ITEM_CATEGORIES: { value: ItemCategory; label: string }[] = [
  { value: 'LAPTOP', label: 'Laptop' },
  { value: 'MONITOR', label: 'Monitor' },
  { value: 'KEYBOARD', label: 'Keyboard' },
  { value: 'MOUSE', label: 'Mouse' },
  { value: 'HEADSET', label: 'Headset' },
  { value: 'PHONE', label: 'Phone' },
  { value: 'TABLET', label: 'Tablet' },
  { value: 'CABLES', label: 'Cables' },
  { value: 'SOFTWARE_LICENSE', label: 'Software License' },
  { value: 'OTHER', label: 'Other' },
];

// Status options for display
export const ITEM_STATUSES: { value: ItemStatus; label: string; color: string }[] = [
  { value: 'AVAILABLE', label: 'Available', color: 'success' },
  { value: 'ASSIGNED', label: 'Assigned', color: 'info' },
  { value: 'RESERVED', label: 'Reserved', color: 'warning' },
  { value: 'IN_REPAIR', label: 'In Repair', color: 'warning' },
  { value: 'DECOMMISSIONED', label: 'Decommissioned', color: 'secondary' },
  { value: 'LOST_STOLEN', label: 'Lost/Stolen', color: 'destructive' },
];

// Condition options for forms
export const ITEM_CONDITIONS: { value: ItemCondition; label: string }[] = [
  { value: 'NEW', label: 'New' },
  { value: 'GOOD', label: 'Good' },
  { value: 'FAIR', label: 'Fair' },
  { value: 'NEEDS_REPAIR', label: 'Needs Repair' },
  { value: 'DECOMMISSIONED', label: 'Decommissioned' },
];
