// Email Processor - Processes email jobs from the Bull queue
// Constitution Art. 5.4: Notification system

import { emailQueue } from './email.queue.js';
import {
  sendAssignmentNotification,
  sendReturnReminder,
  sendWarrantyAlert,
  sendLowStockAlert,
  type AssignmentEmailData,
  type ReturnReminderEmailData,
  type WarrantyAlertEmailData,
  type LowStockAlertEmailData,
} from '../services/email.service.js';

// =============================================================================
// Processor
// =============================================================================

/**
 * Process email jobs
 */
emailQueue.process(async (job) => {
  const { type, data } = job.data;

  console.log(`Processing email job ${job.id}: ${type}`);

  let success = false;

  switch (type) {
    case 'assignment':
      success = await sendAssignmentNotification(data as AssignmentEmailData);
      break;

    case 'return-reminder':
      success = await sendReturnReminder(data as ReturnReminderEmailData);
      break;

    case 'warranty-alert':
      success = await sendWarrantyAlert(data as WarrantyAlertEmailData);
      break;

    case 'low-stock-alert':
      success = await sendLowStockAlert(data as LowStockAlertEmailData);
      break;

    default:
      throw new Error(`Unknown email job type: ${type}`);
  }

  if (!success) {
    throw new Error(`Failed to send ${type} email`);
  }

  return { sent: true, type };
});

/**
 * Start the email processor
 */
export function startEmailProcessor(): void {
  console.log('Email processor started');
}

/**
 * Gracefully shutdown the email processor
 */
export async function shutdownEmailProcessor(): Promise<void> {
  await emailQueue.close();
  console.log('Email processor shut down');
}
