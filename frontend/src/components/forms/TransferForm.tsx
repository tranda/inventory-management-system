// TransferForm Component - User Story 8
// Form for transferring equipment between employees

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowRight, User, Package } from 'lucide-react';
import { Button } from '../ui/Button';
import { Textarea } from '../ui/Textarea';
import { Label } from '../ui/Label';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { EmployeeSelect } from './EmployeeSelect';
import type { Assignment } from '../../services/assignments.service';

// =============================================================================
// Validation Schema
// =============================================================================

const transferFormSchema = z.object({
  toEmployeeId: z.string().min(1, 'Please select an employee to transfer to'),
  reason: z.string().max(500).optional().or(z.literal('')),
  notes: z.string().max(2000).optional().or(z.literal('')),
});

type TransferFormData = z.infer<typeof transferFormSchema>;

// =============================================================================
// Component Props
// =============================================================================

interface TransferFormProps {
  assignment: Assignment;
  onSubmit: (data: {
    toEmployeeId: string;
    reason?: string;
    notes?: string;
  }) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

// =============================================================================
// Component
// =============================================================================

export function TransferForm({ assignment, onSubmit, onCancel, isLoading }: TransferFormProps) {
  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TransferFormData>({
    resolver: zodResolver(transferFormSchema),
    defaultValues: {
      toEmployeeId: '',
      reason: '',
      notes: '',
    },
  });

  const handleFormSubmit = async (data: TransferFormData) => {
    await onSubmit({
      toEmployeeId: data.toEmployeeId,
      reason: data.reason || undefined,
      notes: data.notes || undefined,
    });
  };

  const currentEmployee = assignment.employee;
  const item = assignment.item;

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Current Assignment Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Current Assignment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Equipment Info */}
          <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Package className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">{item?.name}</h3>
              <p className="text-sm text-muted-foreground">
                {item?.assetId} &bull; {item?.category}
              </p>
              {item?.brand && item?.model && (
                <p className="text-sm text-muted-foreground">
                  {item.brand} {item.model}
                </p>
              )}
            </div>
          </div>

          {/* Current Employee */}
          <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/20">
              <User className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Currently assigned to</p>
              <h3 className="font-semibold">
                {currentEmployee?.firstName} {currentEmployee?.lastName}
              </h3>
              <p className="text-sm text-muted-foreground">
                {currentEmployee?.email}
                {currentEmployee?.department && ` &bull; ${currentEmployee.department}`}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transfer Arrow */}
      <div className="flex justify-center">
        <div className="flex items-center justify-center h-12 w-12 rounded-full bg-primary/10">
          <ArrowRight className="h-6 w-6 text-primary" />
        </div>
      </div>

      {/* New Employee Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Transfer To</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="toEmployeeId">New Employee *</Label>
            <Controller
              name="toEmployeeId"
              control={control}
              render={({ field }) => (
                <EmployeeSelect
                  value={field.value}
                  onChange={field.onChange}
                  excludeIds={currentEmployee?.id ? [currentEmployee.id] : []}
                  placeholder="Select employee to transfer to..."
                />
              )}
            />
            {errors.toEmployeeId && (
              <p className="mt-1 text-sm text-destructive">{errors.toEmployeeId.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="reason">Transfer Reason</Label>
            <Textarea
              id="reason"
              placeholder="Why is this equipment being transferred? (e.g., employee role change, department transfer)"
              className="min-h-[80px]"
              {...register('reason')}
            />
            {errors.reason && (
              <p className="mt-1 text-sm text-destructive">{errors.reason.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              placeholder="Any additional notes for this transfer..."
              className="min-h-[80px]"
              {...register('notes')}
            />
            {errors.notes && (
              <p className="mt-1 text-sm text-destructive">{errors.notes.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Transferring...' : 'Transfer Equipment'}
        </Button>
      </div>
    </form>
  );
}
