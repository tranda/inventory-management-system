// Item status constants and helpers

import { ItemStatus } from '../types/item.types.js';

export const ITEM_STATUS_LABELS: Record<ItemStatus, string> = {
  [ItemStatus.AVAILABLE]: 'Available',
  [ItemStatus.ASSIGNED]: 'Assigned',
  [ItemStatus.RESERVED]: 'Reserved',
  [ItemStatus.IN_REPAIR]: 'In Repair',
  [ItemStatus.DECOMMISSIONED]: 'Decommissioned',
  [ItemStatus.LOST_STOLEN]: 'Lost/Stolen',
};

export const ITEM_STATUS_COLORS: Record<ItemStatus, string> = {
  [ItemStatus.AVAILABLE]: 'green',
  [ItemStatus.ASSIGNED]: 'blue',
  [ItemStatus.RESERVED]: 'yellow',
  [ItemStatus.IN_REPAIR]: 'orange',
  [ItemStatus.DECOMMISSIONED]: 'gray',
  [ItemStatus.LOST_STOLEN]: 'red',
};

// Valid status transitions based on data-model.md state diagram
export const VALID_STATUS_TRANSITIONS: Record<ItemStatus, ItemStatus[]> = {
  [ItemStatus.AVAILABLE]: [
    ItemStatus.ASSIGNED,
    ItemStatus.RESERVED,
    ItemStatus.DECOMMISSIONED,
    ItemStatus.LOST_STOLEN,
  ],
  [ItemStatus.ASSIGNED]: [
    ItemStatus.AVAILABLE, // Return with good condition
    ItemStatus.IN_REPAIR, // Return with needs repair
    ItemStatus.DECOMMISSIONED,
    ItemStatus.LOST_STOLEN,
  ],
  [ItemStatus.RESERVED]: [
    ItemStatus.ASSIGNED, // Fulfill reservation
    ItemStatus.AVAILABLE, // Cancel reservation
    ItemStatus.DECOMMISSIONED,
    ItemStatus.LOST_STOLEN,
  ],
  [ItemStatus.IN_REPAIR]: [
    ItemStatus.AVAILABLE, // Repair complete
    ItemStatus.RESERVED, // Repair complete, reserve for someone
    ItemStatus.DECOMMISSIONED,
    ItemStatus.LOST_STOLEN,
  ],
  [ItemStatus.DECOMMISSIONED]: [], // Terminal state
  [ItemStatus.LOST_STOLEN]: [], // Terminal state
};

/**
 * Check if a status transition is valid
 */
export function isValidStatusTransition(from: ItemStatus, to: ItemStatus): boolean {
  return VALID_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

/**
 * Get valid next statuses for an item
 */
export function getValidNextStatuses(currentStatus: ItemStatus): ItemStatus[] {
  return VALID_STATUS_TRANSITIONS[currentStatus] ?? [];
}

/**
 * Check if status requires a reason to change to it
 */
export function requiresReason(status: ItemStatus): boolean {
  return status === ItemStatus.DECOMMISSIONED || status === ItemStatus.LOST_STOLEN;
}
