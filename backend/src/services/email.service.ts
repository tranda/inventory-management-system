// Email Service - Constitution Art. 5.4: Notification system
// Handles email sending with Nodemailer

import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

// =============================================================================
// Configuration
// =============================================================================

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from: string;
}

function getEmailConfig(): EmailConfig {
  return {
    host: process.env.SMTP_HOST || 'smtp.ethereal.email',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
    },
    from: process.env.SMTP_FROM || 'IT Inventory <noreply@inventory.local>',
  };
}

// =============================================================================
// Types
// =============================================================================

export interface EmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
}

export interface AssignmentEmailData {
  employeeName: string;
  employeeEmail: string;
  itemName: string;
  assetId: string;
  category: string;
  assignedBy: string;
  assignedAt: Date;
  expectedReturnDate?: Date | null;
  notes?: string | null;
}

export interface ReturnReminderEmailData {
  employeeName: string;
  employeeEmail: string;
  itemName: string;
  assetId: string;
  expectedReturnDate: Date;
  daysUntilDue: number;
  isOverdue: boolean;
}

export interface WarrantyAlertEmailData {
  adminEmail: string;
  items: Array<{
    name: string;
    assetId: string;
    warrantyExpiry: Date;
    daysRemaining: number;
  }>;
}

export interface LowStockAlertEmailData {
  adminEmail: string;
  items: Array<{
    category: string;
    availableCount: number;
    minStockLevel: number;
  }>;
}

// =============================================================================
// Transporter
// =============================================================================

let transporter: Transporter | null = null;

export function getTransporter(): Transporter {
  if (!transporter) {
    const config = getEmailConfig();
    transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: config.auth.user
        ? {
            user: config.auth.user,
            pass: config.auth.pass,
          }
        : undefined,
    });
  }
  return transporter;
}

/**
 * Verify email connection is working
 */
export async function verifyEmailConnection(): Promise<boolean> {
  try {
    const transport = getTransporter();
    await transport.verify();
    return true;
  } catch (error) {
    console.error('Email connection verification failed:', error);
    return false;
  }
}

// =============================================================================
// Send Email
// =============================================================================

/**
 * Send an email
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  const config = getEmailConfig();

  try {
    const transport = getTransporter();
    await transport.sendMail({
      from: config.from,
      to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });
    return true;
  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
}

// =============================================================================
// Email Templates
// =============================================================================

/**
 * Send assignment notification email
 */
export async function sendAssignmentNotification(data: AssignmentEmailData): Promise<boolean> {
  const subject = `Equipment Assigned: ${data.itemName}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9fafb; }
        .item-details { background-color: white; padding: 15px; border-radius: 8px; margin: 15px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        .label { font-weight: bold; color: #374151; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Equipment Assigned</h1>
        </div>
        <div class="content">
          <p>Hello ${data.employeeName},</p>
          <p>The following equipment has been assigned to you:</p>

          <div class="item-details">
            <p><span class="label">Item:</span> ${data.itemName}</p>
            <p><span class="label">Asset ID:</span> ${data.assetId}</p>
            <p><span class="label">Category:</span> ${data.category}</p>
            <p><span class="label">Assigned By:</span> ${data.assignedBy}</p>
            <p><span class="label">Assigned On:</span> ${data.assignedAt.toLocaleDateString()}</p>
            ${data.expectedReturnDate ? `<p><span class="label">Expected Return:</span> ${data.expectedReturnDate.toLocaleDateString()}</p>` : ''}
            ${data.notes ? `<p><span class="label">Notes:</span> ${data.notes}</p>` : ''}
          </div>

          <p>Please take good care of this equipment. If you have any questions, contact the IT department.</p>
        </div>
        <div class="footer">
          <p>IT Inventory Management System</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Equipment Assigned: ${data.itemName}

Hello ${data.employeeName},

The following equipment has been assigned to you:

Item: ${data.itemName}
Asset ID: ${data.assetId}
Category: ${data.category}
Assigned By: ${data.assignedBy}
Assigned On: ${data.assignedAt.toLocaleDateString()}
${data.expectedReturnDate ? `Expected Return: ${data.expectedReturnDate.toLocaleDateString()}` : ''}
${data.notes ? `Notes: ${data.notes}` : ''}

Please take good care of this equipment. If you have any questions, contact the IT department.

IT Inventory Management System
  `;

  return sendEmail({
    to: data.employeeEmail,
    subject,
    html,
    text,
  });
}

/**
 * Send return reminder email
 */
export async function sendReturnReminder(data: ReturnReminderEmailData): Promise<boolean> {
  const subject = data.isOverdue
    ? `OVERDUE: Equipment Return Required - ${data.itemName}`
    : `Reminder: Equipment Return Due Soon - ${data.itemName}`;

  const statusText = data.isOverdue
    ? `is <strong style="color: #dc2626;">overdue by ${Math.abs(data.daysUntilDue)} day(s)</strong>`
    : `is due in <strong>${data.daysUntilDue} day(s)</strong>`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: ${data.isOverdue ? '#dc2626' : '#f59e0b'}; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9fafb; }
        .item-details { background-color: white; padding: 15px; border-radius: 8px; margin: 15px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        .label { font-weight: bold; color: #374151; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${data.isOverdue ? 'Equipment Return Overdue' : 'Equipment Return Reminder'}</h1>
        </div>
        <div class="content">
          <p>Hello ${data.employeeName},</p>
          <p>This is a reminder that the following equipment ${statusText}:</p>

          <div class="item-details">
            <p><span class="label">Item:</span> ${data.itemName}</p>
            <p><span class="label">Asset ID:</span> ${data.assetId}</p>
            <p><span class="label">Return Date:</span> ${data.expectedReturnDate.toLocaleDateString()}</p>
          </div>

          <p>Please return this equipment to the IT department at your earliest convenience.</p>
        </div>
        <div class="footer">
          <p>IT Inventory Management System</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
${data.isOverdue ? 'OVERDUE: ' : ''}Equipment Return ${data.isOverdue ? 'Required' : 'Reminder'}: ${data.itemName}

Hello ${data.employeeName},

This is a reminder that the following equipment ${data.isOverdue ? `is overdue by ${Math.abs(data.daysUntilDue)} day(s)` : `is due in ${data.daysUntilDue} day(s)`}:

Item: ${data.itemName}
Asset ID: ${data.assetId}
Return Date: ${data.expectedReturnDate.toLocaleDateString()}

Please return this equipment to the IT department at your earliest convenience.

IT Inventory Management System
  `;

  return sendEmail({
    to: data.employeeEmail,
    subject,
    html,
    text,
  });
}

/**
 * Send warranty expiry alert email
 */
export async function sendWarrantyAlert(data: WarrantyAlertEmailData): Promise<boolean> {
  const subject = `Warranty Alert: ${data.items.length} item(s) expiring soon`;

  const itemsList = data.items
    .map(
      (item) => `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${item.name}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${item.assetId}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${item.warrantyExpiry.toLocaleDateString()}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; ${item.daysRemaining <= 0 ? 'color: #dc2626; font-weight: bold;' : ''}">${item.daysRemaining <= 0 ? 'EXPIRED' : `${item.daysRemaining} days`}</td>
        </tr>
      `
    )
    .join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #f59e0b; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9fafb; }
        table { width: 100%; border-collapse: collapse; background-color: white; }
        th { background-color: #374151; color: white; padding: 10px; text-align: left; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Warranty Expiry Alert</h1>
        </div>
        <div class="content">
          <p>The following items have warranties expiring soon or already expired:</p>

          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Asset ID</th>
                <th>Expiry Date</th>
                <th>Days Remaining</th>
              </tr>
            </thead>
            <tbody>
              ${itemsList}
            </tbody>
          </table>

          <p style="margin-top: 20px;">Please take appropriate action to renew warranties or plan for replacements.</p>
        </div>
        <div class="footer">
          <p>IT Inventory Management System</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Warranty Expiry Alert

The following items have warranties expiring soon or already expired:

${data.items.map((item) => `- ${item.name} (${item.assetId}): ${item.daysRemaining <= 0 ? 'EXPIRED' : `${item.daysRemaining} days remaining`}`).join('\n')}

Please take appropriate action to renew warranties or plan for replacements.

IT Inventory Management System
  `;

  return sendEmail({
    to: data.adminEmail,
    subject,
    html,
    text,
  });
}

/**
 * Send low stock alert email
 */
export async function sendLowStockAlert(data: LowStockAlertEmailData): Promise<boolean> {
  const subject = `Low Stock Alert: ${data.items.length} category(ies) below minimum level`;

  const itemsList = data.items
    .map(
      (item) => `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${item.category}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; color: #dc2626; font-weight: bold;">${item.availableCount}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${item.minStockLevel}</td>
        </tr>
      `
    )
    .join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #dc2626; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9fafb; }
        table { width: 100%; border-collapse: collapse; background-color: white; }
        th { background-color: #374151; color: white; padding: 10px; text-align: left; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Low Stock Alert</h1>
        </div>
        <div class="content">
          <p>The following consumable categories are below minimum stock levels:</p>

          <table>
            <thead>
              <tr>
                <th>Category</th>
                <th>Available</th>
                <th>Minimum Required</th>
              </tr>
            </thead>
            <tbody>
              ${itemsList}
            </tbody>
          </table>

          <p style="margin-top: 20px;">Please order additional inventory to maintain adequate stock levels.</p>
        </div>
        <div class="footer">
          <p>IT Inventory Management System</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Low Stock Alert

The following consumable categories are below minimum stock levels:

${data.items.map((item) => `- ${item.category}: ${item.availableCount} available (minimum: ${item.minStockLevel})`).join('\n')}

Please order additional inventory to maintain adequate stock levels.

IT Inventory Management System
  `;

  return sendEmail({
    to: data.adminEmail,
    subject,
    html,
    text,
  });
}
