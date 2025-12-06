// Low Stock Alerts Job - Scheduled job for low stock alerts
// Constitution Art. 5.4: FR-038 (low stock notifications)

import { prisma } from '../app.js';
import { queueLowStockAlert } from './email.queue.js';

// =============================================================================
// Job Functions
// =============================================================================

/**
 * Get admin emails for alerts
 */
async function getAdminEmails(): Promise<string[]> {
  const admins = await prisma.user.findMany({
    where: {
      role: 'ADMIN',
      isActive: true,
    },
    select: {
      email: true,
    },
  });

  return admins.map((admin) => admin.email);
}

/**
 * Process low stock alerts
 * Checks consumable items and alerts if available count is below minimum stock level
 */
export async function processLowStockAlerts(): Promise<number> {
  // Get available counts by category for consumable items
  const stockLevels = await prisma.item.groupBy({
    by: ['category'],
    where: {
      deletedAt: null,
      isConsumable: true,
      status: 'AVAILABLE',
    },
    _count: {
      id: true,
    },
  });

  // Get minimum stock levels for each category
  const minStockLevels = await prisma.item.findMany({
    where: {
      deletedAt: null,
      isConsumable: true,
      minStockLevel: {
        not: null,
        gt: 0,
      },
    },
    select: {
      category: true,
      minStockLevel: true,
    },
    distinct: ['category'],
  });

  // Create a map of category to minimum stock level
  const minStockMap = new Map<string, number>();
  for (const item of minStockLevels) {
    if (item.minStockLevel) {
      const existing = minStockMap.get(item.category);
      if (!existing || item.minStockLevel > existing) {
        minStockMap.set(item.category, item.minStockLevel);
      }
    }
  }

  // Find categories with low stock
  const lowStockCategories: Array<{
    category: string;
    availableCount: number;
    minStockLevel: number;
  }> = [];

  for (const level of stockLevels) {
    const minStock = minStockMap.get(level.category);
    if (minStock && level._count.id < minStock) {
      lowStockCategories.push({
        category: level.category,
        availableCount: level._count.id,
        minStockLevel: minStock,
      });
    }
  }

  // Also check for categories that have no available items
  for (const [category, minStock] of minStockMap) {
    const existing = stockLevels.find((s) => s.category === category);
    if (!existing) {
      lowStockCategories.push({
        category,
        availableCount: 0,
        minStockLevel: minStock,
      });
    }
  }

  if (lowStockCategories.length === 0) {
    console.log('No low stock alerts to send');
    return 0;
  }

  const adminEmails = await getAdminEmails();

  if (adminEmails.length === 0) {
    console.warn('No admin users found to send low stock alerts');
    return 0;
  }

  // Send alert to each admin
  for (const adminEmail of adminEmails) {
    await queueLowStockAlert({
      adminEmail,
      items: lowStockCategories,
    });
  }

  console.log(
    `Queued low stock alerts for ${lowStockCategories.length} categories to ${adminEmails.length} admin(s)`
  );
  return lowStockCategories.length;
}

/**
 * Run low stock alerts job
 */
export async function runLowStockAlertsJob(): Promise<void> {
  console.log('Running low stock alerts job...');

  try {
    await processLowStockAlerts();
    console.log('Low stock alerts job completed');
  } catch (error) {
    console.error('Low stock alerts job failed:', error);
    throw error;
  }
}
