// ItemGridView Component - User Story 4 (FR-010)
// Card-based grid view for inventory items

import { Package } from 'lucide-react';
import { Card, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { cn } from '../../lib/utils';
import { ITEM_STATUSES, ITEM_CONDITIONS, type Item } from '../../types/item';

// =============================================================================
// Types
// =============================================================================

interface ItemGridViewProps {
  items: Item[];
  onItemClick?: (item: Item) => void;
  selectable?: boolean;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  isLoading?: boolean;
  emptyMessage?: string;
  className?: string;
}

// =============================================================================
// Component
// =============================================================================

export function ItemGridView({
  items,
  onItemClick,
  selectable,
  selectedIds = [],
  onSelectionChange,
  isLoading,
  emptyMessage = 'No items found',
  className,
}: ItemGridViewProps) {
  const handleSelectItem = (item: Item, e: React.MouseEvent) => {
    if (!selectable || !onSelectionChange) return;
    e.stopPropagation();

    const id = item.id;
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter((sid) => sid !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusInfo = ITEM_STATUSES.find((s) => s.value === status);
    const variantMap: Record<string, 'success' | 'info' | 'warning' | 'secondary' | 'destructive' | 'default'> = {
      success: 'success',
      info: 'info',
      warning: 'warning',
      secondary: 'secondary',
      destructive: 'destructive',
    };
    return (
      <Badge variant={variantMap[statusInfo?.color || 'default'] || 'default'}>
        {statusInfo?.label || status}
      </Badge>
    );
  };

  const getConditionLabel = (condition: string) => {
    return ITEM_CONDITIONS.find((c) => c.value === condition)?.label || condition;
  };

  if (isLoading) {
    return (
      <div className={cn('grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4', className)}>
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <div className="aspect-square bg-muted" />
            <CardContent className="p-4 space-y-2">
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="h-3 bg-muted rounded w-1/2" />
              <div className="h-3 bg-muted rounded w-2/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Package className="h-12 w-12 text-muted-foreground/50" />
        <p className="mt-4 text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={cn('grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4', className)}>
      {items.map((item) => {
        const isSelected = selectedIds.includes(item.id);

        return (
          <Card
            key={item.id}
            className={cn(
              'overflow-hidden transition-all hover:shadow-md',
              onItemClick && 'cursor-pointer',
              isSelected && 'ring-2 ring-primary'
            )}
            onClick={() => onItemClick?.(item)}
          >
            {/* Image */}
            <div className="relative aspect-square bg-muted">
              {item.thumbnailUrl ? (
                <img
                  src={item.thumbnailUrl}
                  alt={item.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <Package className="h-16 w-16 text-muted-foreground/30" />
                </div>
              )}

              {/* Selection Checkbox */}
              {selectable && (
                <div
                  className="absolute left-2 top-2"
                  onClick={(e) => handleSelectItem(item, e)}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => {}}
                    className="h-5 w-5 rounded border-2 border-white shadow-md"
                  />
                </div>
              )}

              {/* Status Badge */}
              <div className="absolute right-2 top-2">
                {getStatusBadge(item.status)}
              </div>
            </div>

            {/* Content */}
            <CardContent className="p-4">
              <h3 className="font-semibold truncate">{item.name}</h3>
              <p className="text-sm text-muted-foreground truncate">
                {item.assetId}
              </p>
              {item.brand && item.model && (
                <p className="text-sm text-muted-foreground truncate">
                  {item.brand} {item.model}
                </p>
              )}
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {getConditionLabel(item.condition)}
                </span>
                {item.assignments && item.assignments.length > 0 && !item.assignments[0].returnedAt && (
                  <span className="text-xs text-muted-foreground truncate max-w-[120px]">
                    {item.assignments[0].employee?.firstName} {item.assignments[0].employee?.lastName}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
