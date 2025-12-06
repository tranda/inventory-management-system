// Return Reminders Job - Scheduled job for return reminders
// Constitution Art. 5.4: FR-035 (upcoming returns), FR-036 (overdue returns)

import { prisma } from '../app.js';
import { queueReturnReminder } from './email.queue.js';

// =============================================================================
// Configuration
// =============================================================================

const REMINDER_DAYS_BEFORE = 3; // Send reminder 3 days before due date

// =============================================================================
// Job Functions
// =============================================================================

/**
 * Process upcoming return reminders
 * Sends reminders for assignments due within REMINDER_DAYS_BEFORE days
 */
export async function processUpcomingReturnReminders(): Promise<number> {
  const now = new Date();
  const reminderDate = new Date(now.getTime() + REMINDER_DAYS_BEFORE * 24 * 60 * 60 * 1000);

  // Find assignments due within reminder window that haven't been returned
  const assignments = await prisma.assignment.findMany({
    where: {
      returnedAt: null,
      expectedReturnDate: {
        gte: now,
        lte: reminderDate,
      },
    },
    include: {
      item: {
        select: {
          name: true,
          assetId: true,
        },
      },
      employee: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  });

  let sentCount = 0;

  for (const assignment of assignments) {
    if (!assignment.employee?.email) continue;

    const daysUntilDue = Math.ceil(
      (new Date(assignment.expectedReturnDate!).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    await queueReturnReminder({
      employeeName: `${assignment.employee.firstName} ${assignment.employee.lastName}`,
      employeeEmail: assignment.employee.email,
      itemName: assignment.item.name,
      assetId: assignment.item.assetId,
      expectedReturnDate: new Date(assignment.expectedReturnDate!),
      daysUntilDue,
      isOverdue: false,
    });

    sentCount++;
  }

  console.log(`Queued ${sentCount} upcoming return reminders`);
  return sentCount;
}

/**
 * Process overdue return reminders
 * Sends reminders for assignments past their expected return date
 */
export async function processOverdueReturnReminders(): Promise<number> {
  const now = new Date();

  // Find overdue assignments that haven't been returned
  const assignments = await prisma.assignment.findMany({
    where: {
      returnedAt: null,
      expectedReturnDate: {
        lt: now,
      },
    },
    include: {
      item: {
        select: {
          name: true,
          assetId: true,
        },
      },
      employee: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  });

  let sentCount = 0;

  for (const assignment of assignments) {
    if (!assignment.employee?.email) continue;

    const daysOverdue = Math.floor(
      (now.getTime() - new Date(assignment.expectedReturnDate!).getTime()) / (1000 * 60 * 60 * 24)
    );

    await queueReturnReminder({
      employeeName: `${assignment.employee.firstName} ${assignment.employee.lastName}`,
      employeeEmail: assignment.employee.email,
      itemName: assignment.item.name,
      assetId: assignment.item.assetId,
      expectedReturnDate: new Date(assignment.expectedReturnDate!),
      daysUntilDue: -daysOverdue, // Negative for overdue
      isOverdue: true,
    });

    sentCount++;
  }

  console.log(`Queued ${sentCount} overdue return reminders`);
  return sentCount;
}

/**
 * Run all return reminder jobs
 */
export async function runReturnRemindersJob(): Promise<void> {
  console.log('Running return reminders job...');

  try {
    await processUpcomingReturnReminders();
    await processOverdueReturnReminders();
    console.log('Return reminders job completed');
  } catch (error) {
    console.error('Return reminders job failed:', error);
    throw error;
  }
}
