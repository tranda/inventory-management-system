// ItemForm Component - User Story 1
// Form for creating and editing inventory items

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Textarea } from '../ui/Textarea';
import { Label } from '../ui/Label';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { ITEM_CATEGORIES, ITEM_CONDITIONS, type ItemCreateInput, type Item } from '../../types/item';

// =============================================================================
// Validation Schema
// =============================================================================

const itemFormSchema = z.object({
  assetId: z
    .string()
    .min(1, 'Asset ID is required')
    .max(50, 'Asset ID must be 50 characters or less')
    .regex(/^[A-Z0-9-]+$/, 'Asset ID must contain only uppercase letters, numbers, and hyphens'),
  name: z.string().min(1, 'Name is required').max(200, 'Name must be 200 characters or less'),
  category: z.enum([
    'LAPTOP', 'MONITOR', 'KEYBOARD', 'MOUSE', 'HEADSET',
    'PHONE', 'TABLET', 'CABLES', 'SOFTWARE_LICENSE', 'OTHER',
  ], { errorMap: () => ({ message: 'Please select a category' }) }),
  condition: z.enum(['NEW', 'GOOD', 'FAIR', 'NEEDS_REPAIR', 'DECOMMISSIONED']).default('NEW'),
  brand: z.string().max(100).optional().or(z.literal('')),
  model: z.string().max(100).optional().or(z.literal('')),
  serialNumber: z.string().min(1, 'Serial number is required').max(100),
  purchaseDate: z.string().optional().or(z.literal('')),
  purchasePrice: z.coerce.number().min(0, 'Price must be positive').optional().or(z.literal('')),
  warrantyExpiration: z.string().optional().or(z.literal('')),
  location: z.string().max(200).optional().or(z.literal('')),
  notes: z.string().max(2000).optional().or(z.literal('')),
  isConsumable: z.boolean().default(false),
  minStockLevel: z.coerce.number().int().min(0).optional().or(z.literal('')),
});

type ItemFormData = z.infer<typeof itemFormSchema>;

// =============================================================================
// Component Props
// =============================================================================

interface ItemFormProps {
  initialData?: Item;
  onSubmit: (data: ItemCreateInput) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

// =============================================================================
// Component
// =============================================================================

export function ItemForm({ initialData, onSubmit, onCancel, isLoading }: ItemFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ItemFormData>({
    resolver: zodResolver(itemFormSchema),
    defaultValues: {
      assetId: initialData?.assetId || '',
      name: initialData?.name || '',
      category: initialData?.category || undefined,
      condition: initialData?.condition || 'NEW',
      brand: initialData?.brand || '',
      model: initialData?.model || '',
      serialNumber: initialData?.serialNumber || '',
      purchaseDate: initialData?.purchaseDate?.split('T')[0] || '',
      purchasePrice: initialData?.purchasePrice ?? '',
      warrantyExpiration: initialData?.warrantyExpiration?.split('T')[0] || '',
      location: initialData?.location || '',
      notes: initialData?.notes || '',
      isConsumable: initialData?.isConsumable || false,
      minStockLevel: initialData?.minStockLevel ?? '',
    },
  });

  const isConsumable = watch('isConsumable');

  const handleFormSubmit = async (data: ItemFormData) => {
    const submitData: ItemCreateInput = {
      assetId: data.assetId,
      name: data.name,
      category: data.category,
      condition: data.condition,
      serialNumber: data.serialNumber,
      brand: data.brand || undefined,
      model: data.model || undefined,
      purchaseDate: data.purchaseDate || undefined,
      purchasePrice: typeof data.purchasePrice === 'number' ? data.purchasePrice : undefined,
      warrantyExpiration: data.warrantyExpiration || undefined,
      location: data.location || undefined,
      notes: data.notes || undefined,
      isConsumable: data.isConsumable,
      minStockLevel: typeof data.minStockLevel === 'number' ? data.minStockLevel : undefined,
    };

    await onSubmit(submitData);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Asset ID */}
            <div className="space-y-2">
              <Label htmlFor="assetId" required>Asset ID</Label>
              <Input
                id="assetId"
                placeholder="IT-2024-001"
                error={!!errors.assetId}
                disabled={!!initialData}
                {...register('assetId')}
              />
              {errors.assetId && (
                <p className="text-sm text-destructive">{errors.assetId.message}</p>
              )}
            </div>

            {/* Serial Number */}
            <div className="space-y-2">
              <Label htmlFor="serialNumber" required>Serial Number</Label>
              <Input
                id="serialNumber"
                placeholder="Enter serial number"
                error={!!errors.serialNumber}
                {...register('serialNumber')}
              />
              {errors.serialNumber && (
                <p className="text-sm text-destructive">{errors.serialNumber.message}</p>
              )}
            </div>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name" required>Name</Label>
            <Input
              id="name"
              placeholder="Dell Latitude 5540"
              error={!!errors.name}
              {...register('name')}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category" required>Category</Label>
              <Select
                id="category"
                error={!!errors.category}
                {...register('category')}
              >
                <option value="">Select category...</option>
                {ITEM_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </Select>
              {errors.category && (
                <p className="text-sm text-destructive">{errors.category.message}</p>
              )}
            </div>

            {/* Condition */}
            <div className="space-y-2">
              <Label htmlFor="condition">Condition</Label>
              <Select
                id="condition"
                error={!!errors.condition}
                {...register('condition')}
              >
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
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Brand */}
            <div className="space-y-2">
              <Label htmlFor="brand">Brand</Label>
              <Input
                id="brand"
                placeholder="Dell, Apple, Lenovo..."
                {...register('brand')}
              />
            </div>

            {/* Model */}
            <div className="space-y-2">
              <Label htmlFor="model">Model</Label>
              <Input
                id="model"
                placeholder="Model number"
                {...register('model')}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Purchase Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            {/* Purchase Date */}
            <div className="space-y-2">
              <Label htmlFor="purchaseDate">Purchase Date</Label>
              <Input
                id="purchaseDate"
                type="date"
                {...register('purchaseDate')}
              />
            </div>

            {/* Purchase Price */}
            <div className="space-y-2">
              <Label htmlFor="purchasePrice">Purchase Price ($)</Label>
              <Input
                id="purchasePrice"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                error={!!errors.purchasePrice}
                {...register('purchasePrice')}
              />
              {errors.purchasePrice && (
                <p className="text-sm text-destructive">{errors.purchasePrice.message}</p>
              )}
            </div>

            {/* Warranty Expiration */}
            <div className="space-y-2">
              <Label htmlFor="warrantyExpiration">Warranty Expiration</Label>
              <Input
                id="warrantyExpiration"
                type="date"
                {...register('warrantyExpiration')}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Additional Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location">Storage Location</Label>
            <Input
              id="location"
              placeholder="IT Storage Room A"
              {...register('location')}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Additional notes about this item..."
              rows={3}
              {...register('notes')}
            />
          </div>

          {/* Consumable Settings */}
          <div className="space-y-4 rounded-md border p-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isConsumable"
                className="h-4 w-4 rounded border-input"
                {...register('isConsumable')}
              />
              <Label htmlFor="isConsumable" className="font-normal">
                This is a consumable item (for low stock alerts)
              </Label>
            </div>

            {isConsumable && (
              <div className="space-y-2">
                <Label htmlFor="minStockLevel">Minimum Stock Level</Label>
                <Input
                  id="minStockLevel"
                  type="number"
                  min="0"
                  placeholder="5"
                  className="w-32"
                  {...register('minStockLevel')}
                />
                <p className="text-xs text-muted-foreground">
                  Alert will trigger when available count falls below this level
                </p>
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
          {initialData ? 'Update Item' : 'Add Item'}
        </Button>
      </div>
    </form>
  );
}
