// AssignmentForm Component - User Story 2
// Form for assigning equipment to employees

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Label } from '../ui/Label';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { EmployeeSelect } from './EmployeeSelect';
import type { Item } from '../../types/item';

// =============================================================================
// Validation Schema
// =============================================================================

const assignmentFormSchema = z.object({
  employeeId: z.string().min(1, 'Please select an employee'),
  notes: z.string().max(2000).optional().or(z.literal('')),
  expectedReturnDate: z.string().optional().or(z.literal('')),
  acknowledged: z.boolean().default(false),
});

type AssignmentFormData = z.infer<typeof assignmentFormSchema>;

// =============================================================================
// Component Props
// =============================================================================

interface AssignmentFormProps {
  item: Item;
  onSubmit: (data: {
    itemId: string;
    employeeId: string;
    notes?: string;
    expectedReturnDate?: string;
    acknowledged?: boolean;
  }) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

// =============================================================================
// Component
// =============================================================================

export function AssignmentForm({ item, onSubmit, onCancel, isLoading }: AssignmentFormProps) {
  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<AssignmentFormData>({
    resolver: zodResolver(assignmentFormSchema),
    defaultValues: {
      employeeId: '',
      notes: '',
      expectedReturnDate: '',
      acknowledged: false,
    },
  });

  const acknowledged = watch('acknowledged');

  const handleFormSubmit = async (data: AssignmentFormData) => {
    await onSubmit({
      itemId: item.id,
      employeeId: data.employeeId,
      notes: data.notes || undefined,
      expectedReturnDate: data.expectedReturnDate || undefined,
      acknowledged: data.acknowledged,
    });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Item Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Equipment to Assign</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-4">
            {item.thumbnailUrl ? (
              <img
                src={item.thumbnailUrl}
                alt={item.name}
                className="h-20 w-20 rounded-lg object-cover border"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                No photo
              </div>
            )}
            <div className="flex-1">
              <h3 className="font-semibold text-lg">{item.name}</h3>
              <p className="text-sm text-muted-foreground">Asset ID: {item.assetId}</p>
              {item.brand && item.model && (
                <p className="text-sm text-muted-foreground">
                  {item.brand} {item.model}
                </p>
              )}
              <p className="text-sm text-muted-foreground">Serial: {item.serialNumber}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Employee Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Assign To</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="employeeId" required>Employee</Label>
            <Controller
              name="employeeId"
              control={control}
              render={({ field }) => (
                <EmployeeSelect
                  value={field.value}
                  onChange={(id) => field.onChange(id || '')}
                  error={!!errors.employeeId}
                  placeholder="Search and select an employee..."
                />
              )}
            />
            {errors.employeeId && (
              <p className="text-sm text-destructive">{errors.employeeId.message}</p>
            )}
          </div>

          {/* Expected Return Date */}
          <div className="space-y-2">
            <Label htmlFor="expectedReturnDate">Expected Return Date (Optional)</Label>
            <Input
              id="expectedReturnDate"
              type="date"
              {...register('expectedReturnDate')}
            />
            <p className="text-xs text-muted-foreground">
              Leave blank if the equipment is assigned indefinitely
            </p>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Assignment Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Any special instructions or notes about this assignment..."
              rows={3}
              {...register('notes')}
            />
          </div>
        </CardContent>
      </Card>

      {/* Acknowledgment - FR-015 */}
      <Card>
        <CardHeader>
          <CardTitle>Acknowledgment</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 rounded-md border p-4">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="acknowledged"
                className="mt-1 h-4 w-4 rounded border-input"
                {...register('acknowledged')}
              />
              <div>
                <Label htmlFor="acknowledged" className="font-normal cursor-pointer">
                  Employee has acknowledged receipt of equipment
                </Label>
                <p className="mt-1 text-xs text-muted-foreground">
                  Check this box if the employee has physically received and acknowledged the equipment.
                  If not checked now, the employee can acknowledge later.
                </p>
              </div>
            </div>

            {acknowledged && (
              <div className="rounded-md bg-primary/10 p-3 text-sm text-primary">
                Equipment will be marked as acknowledged upon submission.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isLoading}>
          Assign Equipment
        </Button>
      </div>
    </form>
  );
}
