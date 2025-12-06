// ItemFilters Component - User Story 4
// Filters panel for inventory list

import { useState } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Badge } from '../ui/Badge';
import { cn } from '../../lib/utils';
import { ITEM_CATEGORIES, ITEM_STATUSES, ITEM_CONDITIONS } from '../../types/item';

// =============================================================================
// Types
// =============================================================================

export interface ItemFiltersValue {
  search?: string;
  category?: string;
  status?: string;
  condition?: string;
}

interface ItemFiltersProps {
  value: ItemFiltersValue;
  onChange: (filters: ItemFiltersValue) => void;
  className?: string;
}

// =============================================================================
// Component
// =============================================================================

export function ItemFilters({ value, onChange, className }: ItemFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchInput, setSearchInput] = useState(value.search || '');

  const activeFiltersCount = [value.category, value.status, value.condition].filter(Boolean).length;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onChange({ ...value, search: searchInput || undefined });
  };

  const handleFilterChange = (key: keyof ItemFiltersValue, newValue: string | undefined) => {
    onChange({ ...value, [key]: newValue || undefined });
  };

  const handleClearAll = () => {
    setSearchInput('');
    onChange({});
  };

  const hasActiveFilters = value.search || value.category || value.status || value.condition;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Search and Filter Toggle */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <form onSubmit={handleSearchSubmit} className="flex flex-1 gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by name, asset ID, serial number..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button type="submit" variant="secondary">
            Search
          </Button>
        </form>

        <Button
          type="button"
          variant="outline"
          onClick={() => setIsExpanded(!isExpanded)}
          className="gap-2"
        >
          <Filter className="h-4 w-4" />
          Filters
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="ml-1">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </div>

      {/* Expanded Filters */}
      {isExpanded && (
        <div className="rounded-lg border bg-card p-4">
          <div className="grid gap-4 sm:grid-cols-3">
            {/* Category */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <Select
                value={value.category || ''}
                onChange={(e) => handleFilterChange('category', e.target.value)}
              >
                <option value="">All categories</option>
                {ITEM_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </Select>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select
                value={value.status || ''}
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <option value="">All statuses</option>
                {ITEM_STATUSES.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </Select>
            </div>

            {/* Condition */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Condition</label>
              <Select
                value={value.condition || ''}
                onChange={(e) => handleFilterChange('condition', e.target.value)}
              >
                <option value="">All conditions</option>
                {ITEM_CONDITIONS.map((cond) => (
                  <option key={cond.value} value={cond.value}>
                    {cond.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </div>
      )}

      {/* Active Filters Tags */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Active filters:</span>

          {value.search && (
            <Badge variant="secondary" className="gap-1">
              Search: "{value.search}"
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => {
                  setSearchInput('');
                  handleFilterChange('search', undefined);
                }}
              />
            </Badge>
          )}

          {value.category && (
            <Badge variant="secondary" className="gap-1">
              Category: {ITEM_CATEGORIES.find((c) => c.value === value.category)?.label}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => handleFilterChange('category', undefined)}
              />
            </Badge>
          )}

          {value.status && (
            <Badge variant="secondary" className="gap-1">
              Status: {ITEM_STATUSES.find((s) => s.value === value.status)?.label}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => handleFilterChange('status', undefined)}
              />
            </Badge>
          )}

          {value.condition && (
            <Badge variant="secondary" className="gap-1">
              Condition: {ITEM_CONDITIONS.find((c) => c.value === value.condition)?.label}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => handleFilterChange('condition', undefined)}
              />
            </Badge>
          )}

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClearAll}
            className="text-muted-foreground"
          >
            Clear all
          </Button>
        </div>
      )}
    </div>
  );
}
