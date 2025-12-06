// Email Queue - Bull queue for async email processing
// Constitution Art. 5.4: Notification system

import Bull from 'bull';
import type {
  AssignmentEmailData,
  ReturnReminderEmailData,
  WarrantyAlertEmailData,
  LowStockAlertEmailData,
} from '../services/email.service.js';

// =============================================================================
// Types
// =============================================================================

export type EmailJobType =
  | 'assignment'
  | 'return-reminder'
  | 'warranty-alert'
  | 'low-stock-alert';

export interface EmailJobData {
  type: EmailJobType;
  data: AssignmentEmailData | ReturnReminderEmailData | WarrantyAlertEmailData | LowStockAlertEmailData;
}

// =============================================================================
// Queue Configuration
// =============================================================================

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

export const emailQueue = new Bull<EmailJobData>('email', REDIS_URL, {
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: 100, // Keep last 100 completed jobs
    removeOnFail: 50, // Keep last 50 failed jobs
  },
});

// =============================================================================
// Queue Methods
// =============================================================================

/**
 * Add an assignment notification email to the queue
 */
export async function queueAssignmentEmail(data: AssignmentEmailData): Promise<Bull.Job<EmailJobData>> {
  return emailQueue.add({
    type: 'assignment',
    data,
  });
}

/**
 * Add a return reminder email to the queue
 */
export async function queueReturnReminder(data: ReturnReminderEmailData): Promise<Bull.Job<EmailJobData>> {
  return emailQueue.add({
    type: 'return-reminder',
    data,
  });
}

/**
 * Add a warranty alert email to the queue
 */
export async function queueWarrantyAlert(data: WarrantyAlertEmailData): Promise<Bull.Job<EmailJobData>> {
  return emailQueue.add({
    type: 'warranty-alert',
    data,
  });
}

/**
 * Add a low stock alert email to the queue
 */
export async function queueLowStockAlert(data: LowStockAlertEmailData): Promise<Bull.Job<EmailJobData>> {
  return emailQueue.add({
    type: 'low-stock-alert',
    data,
  });
}

// =============================================================================
// Queue Events
// =============================================================================

emailQueue.on('completed', (job) => {
  console.log(`Email job ${job.id} completed: ${job.data.type}`);
});

emailQueue.on('failed', (job, error) => {
  console.error(`Email job ${job?.id} failed:`, error.message);
});

emailQueue.on('error', (error) => {
  console.error('Email queue error:', error);
});
