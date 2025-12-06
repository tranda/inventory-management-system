// StatusChangeForm - US10 Manual Status Change
// Component for changing item status with required reason

import { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { Badge } from '../ui/Badge';
import { ITEM_STATUSES, type ItemStatus } from '../../types/item';

// =============================================================================
// Types
// =============================================================================

interface StatusChangeFormProps {
  currentStatus: ItemStatus;
  onSubmit: (status: ItemStatus, reason: string) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

// Define allowed status transitions
const STATUS_TRANSITIONS: Record<ItemStatus, ItemStatus[]> = {
  AVAILABLE: ['RESERVED', 'IN_REPAIR', 'DECOMMISSIONED', 'LOST_STOLEN'],
  ASSIGNED: ['IN_REPAIR', 'LOST_STOLEN'], // Cannot change to AVAILABLE directly - must go through return process
  RESERVED: ['AVAILABLE', 'IN_REPAIR', 'DECOMMISSIONED'],
  IN_REPAIR: ['AVAILABLE', 'DECOMMISSIONED'],
  DECOMMISSIONED: [], // Terminal state - no transitions allowed
  LOST_STOLEN: ['AVAILABLE', 'DECOMMISSIONED'], // Can be recovered or written off
};

// =============================================================================
// Component
// =============================================================================

export function StatusChangeForm({
  currentStatus,
  onSubmit,
  onCancel,
  isLoading = false,
}: StatusChangeFormProps) {
  const [newStatus, setNewStatus] = useState<ItemStatus | ''>('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  const allowedStatuses = STATUS_TRANSITIONS[currentStatus] || [];
  const currentStatusInfo = ITEM_STATUSES.find((s) => s.value === currentStatus);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!newStatus) {
      setError('Please select a new status');
      return;
    }

    if (!reason.trim()) {
      setError('Please provide a reason for the status change');
      return;
    }

    if (reason.trim().length < 10) {
      setError('Reason must be at least 10 characters');
      return;
    }

    try {
      await onSubmit(newStatus, reason.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change status');
    }
  };

  const variantMap: Record<string, 'success' | 'info' | 'warning' | 'secondary' | 'destructive' | 'default'> = {
    success: 'success',
    info: 'info',
    warning: 'warning',
    secondary: 'secondary',
    destructive: 'destructive',
  };

  if (allowedStatuses.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20">
          <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
          <div>
            <p className="font-medium text-yellow-800 dark:text-yellow-200">
              Status cannot be changed
            </p>
            <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
              Items with "{currentStatusInfo?.label}" status are in a terminal state and cannot be changed.
            </p>
          </div>
        </div>
        <div className="flex justify-end">
          <Button variant="outline" onClick={onCancel}>
            Close
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Current Status */}
      <div>
        <label className="text-sm font-medium text-muted-foreground">Current Status</label>
        <div className="mt-1">
          <Badge variant={variantMap[currentStatusInfo?.color || 'default'] || 'default'}>
            {currentStatusInfo?.label || currentStatus}
          </Badge>
        </div>
      </div>

      {/* New Status Selection */}
      <div>
        <label htmlFor="newStatus" className="text-sm font-medium">
          New Status <span className="text-destructive">*</span>
        </label>
        <Select
          id="newStatus"
          value={newStatus}
          onChange={(e) => setNewStatus(e.target.value as ItemStatus)}
          className="mt-1"
        >
          <option value="">Select new status...</option>
          {allowedStatuses.map((status) => {
            const statusInfo = ITEM_STATUSES.find((s) => s.value === status);
            return (
              <option key={status} value={status}>
                {statusInfo?.label || status}
              </option>
            );
          })}
        </Select>
      </div>

      {/* Reason */}
      <div>
        <label htmlFor="reason" className="text-sm font-medium">
          Reason for Change <span className="text-destructive">*</span>
        </label>
        <textarea
          id="reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Enter the reason for this status change (minimum 10 characters)..."
          className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          rows={3}
        />
        <p className="mt-1 text-xs text-muted-foreground">
          This reason will be recorded in the audit log.
        </p>
      </div>

      {/* Status-specific warnings */}
      {newStatus === 'LOST_STOLEN' && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
          <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
          <div>
            <p className="font-medium text-red-800 dark:text-red-200">
              Mark as Lost/Stolen
            </p>
            <p className="mt-1 text-sm text-red-700 dark:text-red-300">
              This will flag the item as lost or stolen. Consider filing an incident report.
            </p>
          </div>
        </div>
      )}

      {newStatus === 'DECOMMISSIONED' && (
        <div className="flex items-start gap-3 rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20">
          <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
          <div>
            <p className="font-medium text-yellow-800 dark:text-yellow-200">
              Decommission Item
            </p>
            <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
              This action is permanent. Decommissioned items cannot be returned to active inventory.
            </p>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200">
          <AlertTriangle className="h-4 w-4" />
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isLoading} disabled={!newStatus || !reason.trim()}>
          Change Status
        </Button>
      </div>
    </form>
  );
}
