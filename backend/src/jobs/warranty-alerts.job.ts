// Warranty Alerts Job - Scheduled job for warranty expiry alerts
// Constitution Art. 5.4: FR-037 (warranty expiry notifications)

import { prisma } from '../app.js';
import { queueWarrantyAlert } from './email.queue.js';

// =============================================================================
// Configuration
// =============================================================================

const WARRANTY_ALERT_DAYS = 30; // Alert 30 days before warranty expiry

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
 * Process warranty expiry alerts
 * Sends alerts for items with warranties expiring within WARRANTY_ALERT_DAYS
 */
export async function processWarrantyAlerts(): Promise<number> {
  const now = new Date();
  const alertDate = new Date(now.getTime() + WARRANTY_ALERT_DAYS * 24 * 60 * 60 * 1000);

  // Find items with warranties expiring soon or already expired
  const items = await prisma.item.findMany({
    where: {
      deletedAt: null,
      warrantyExpiration: {
        lte: alertDate,
      },
      status: {
        not: 'DECOMMISSIONED',
      },
    },
    select: {
      name: true,
      assetId: true,
      warrantyExpiration: true,
    },
    orderBy: {
      warrantyExpiration: 'asc',
    },
  });

  if (items.length === 0) {
    console.log('No warranty alerts to send');
    return 0;
  }

  const adminEmails = await getAdminEmails();

  if (adminEmails.length === 0) {
    console.warn('No admin users found to send warranty alerts');
    return 0;
  }

  // Group items by alert status
  const alertItems = items.map((item) => {
    const daysRemaining = Math.ceil(
      (new Date(item.warrantyExpiration!).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    return {
      name: item.name,
      assetId: item.assetId,
      warrantyExpiration: new Date(item.warrantyExpiration!),
      daysRemaining,
    };
  });

  // Send alert to each admin
  for (const adminEmail of adminEmails) {
    await queueWarrantyAlert({
      adminEmail,
      items: alertItems,
    });
  }

  console.log(`Queued warranty alerts for ${items.length} items to ${adminEmails.length} admin(s)`);
  return items.length;
}

/**
 * Run warranty alerts job
 */
export async function runWarrantyAlertsJob(): Promise<void> {
  console.log('Running warranty alerts job...');

  try {
    await processWarrantyAlerts();
    console.log('Warranty alerts job completed');
  } catch (error) {
    console.error('Warranty alerts job failed:', error);
    throw error;
  }
}
