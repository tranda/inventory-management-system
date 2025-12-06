// ReturnForm Component - User Story 3
// Form for processing equipment returns with condition assessment

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { Textarea } from '../ui/Textarea';
import { Label } from '../ui/Label';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { ITEM_CONDITIONS } from '../../types/item';
import type { Assignment } from '../../services/assignments.service';

// =============================================================================
// Validation Schema
// =============================================================================

const returnFormSchema = z.object({
  condition: z.enum(['NEW', 'GOOD', 'FAIR', 'NEEDS_REPAIR', 'DECOMMISSIONED'], {
    errorMap: () => ({ message: 'Please select the equipment condition' }),
  }),
  returnNotes: z.string().max(2000).optional().or(z.literal('')),
});

type ReturnFormData = z.infer<typeof returnFormSchema>;

// =============================================================================
// Component Props
// =============================================================================

interface ReturnFormProps {
  assignment: Assignment;
  onSubmit: (data: {
    condition: 'NEW' | 'GOOD' | 'FAIR' | 'NEEDS_REPAIR' | 'DECOMMISSIONED';
    returnNotes?: string;
  }) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

// =============================================================================
// Component
// =============================================================================

export function ReturnForm({ assignment, onSubmit, onCancel, isLoading }: ReturnFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ReturnFormData>({
    resolver: zodResolver(returnFormSchema),
    defaultValues: {
      condition: undefined,
      returnNotes: '',
    },
  });

  const selectedCondition = watch('condition');

  const handleFormSubmit = async (data: ReturnFormData) => {
    await onSubmit({
      condition: data.condition,
      returnNotes: data.returnNotes || undefined,
    });
  };

  // Helper to determine status message based on condition
  const getStatusMessage = (condition: string | undefined) => {
    switch (condition) {
      case 'NEW':
      case 'GOOD':
      case 'FAIR':
        return {
          type: 'success',
          message: 'Item will be returned to AVAILABLE status',
        };
      case 'NEEDS_REPAIR':
        return {
          type: 'warning',
          message: 'Item will be marked as IN REPAIR and won\'t be available for assignment',
        };
      case 'DECOMMISSIONED':
        return {
          type: 'destructive',
          message: 'Item will be DECOMMISSIONED and removed from active inventory',
        };
      default:
        return null;
    }
  };

  const statusMessage = getStatusMessage(selectedCondition);

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Assignment Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Equipment Being Returned</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-4">
            {assignment.item?.thumbnailUrl ? (
              <img
                src={assignment.item.thumbnailUrl}
                alt={assignment.item.name}
                className="h-20 w-20 rounded-lg object-cover border"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-muted text-muted-foreground text-xs">
                No photo
              </div>
            )}
            <div className="flex-1">
              <h3 className="font-semibold text-lg">{assignment.item?.name}</h3>
              <p className="text-sm text-muted-foreground">
                Asset ID: {assignment.item?.assetId}
              </p>
              {assignment.item?.brand && assignment.item?.model && (
                <p className="text-sm text-muted-foreground">
                  {assignment.item.brand} {assignment.item.model}
                </p>
              )}
              {assignment.item?.serialNumber && (
                <p className="text-sm text-muted-foreground">
                  Serial: {assignment.item.serialNumber}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Assignment Info */}
      <Card>
        <CardHeader>
          <CardTitle>Assignment Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Assigned To</span>
            <span className="font-medium">
              {assignment.employee?.firstName} {assignment.employee?.lastName}
            </span>
          </div>
          {assignment.employee?.department && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Department</span>
              <span>{assignment.employee.department}</span>
            </div>
          )}
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Assigned On</span>
            <span>{new Date(assignment.assignedAt).toLocaleDateString()}</span>
          </div>
          {assignment.assignedBy && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Assigned By</span>
              <span>
                {assignment.assignedBy.firstName} {assignment.assignedBy.lastName}
              </span>
            </div>
          )}
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Acknowledged</span>
            <Badge variant={assignment.acknowledged ? 'success' : 'warning'}>
              {assignment.acknowledged ? 'Yes' : 'No'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Condition Assessment */}
      <Card>
        <CardHeader>
          <CardTitle>Condition Assessment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="condition" required>Equipment Condition</Label>
            <Select
              id="condition"
              error={!!errors.condition}
              {...register('condition')}
            >
              <option value="">Select condition...</option>
              {ITEM_CONDITIONS.map((cond) => (
                <option key={cond.value} value={cond.value}>
                  {cond.label}
                </option>
              ))}
            </Select>
            {errors.condition && (
              <p className="text-sm text-destructive">{errors.condition.message}</p>
            )}
          </div>

          {/* Status Message */}
          {statusMessage && (
            <div
              className={`rounded-md p-3 text-sm ${
                statusMessage.type === 'success'
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                  : statusMessage.type === 'warning'
                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                  : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
              }`}
            >
              {statusMessage.message}
            </div>
          )}

          {/* Return Notes */}
          <div className="space-y-2">
            <Label htmlFor="returnNotes">Return Notes (Optional)</Label>
            <Textarea
              id="returnNotes"
              placeholder="Any notes about the condition, damage, or other observations..."
              rows={3}
              {...register('returnNotes')}
            />
            <p className="text-xs text-muted-foreground">
              Include details about any damage, missing accessories, or other relevant information.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isLoading}>
          Process Return
        </Button>
      </div>
    </form>
  );
}
