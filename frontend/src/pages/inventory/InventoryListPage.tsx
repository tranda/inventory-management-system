// InventoryListPage - User Story 4
// View, search, and filter inventory with list/grid toggle

import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, LayoutGrid, List, Download, Trash2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { DataTable, type Column } from '../../components/tables/DataTable';
import { ItemFilters, type ItemFiltersValue } from '../../components/inventory/ItemFilters';
import { ItemGridView } from '../../components/inventory/ItemGridView';
import { useItems, useBulkDeleteItems } from '../../services/items.service';
import { useHasPermission } from '../../contexts/AuthContext';
import { ITEM_STATUSES, ITEM_CONDITIONS, type Item } from '../../types/item';

// =============================================================================
// Component
// =============================================================================

export function InventoryListPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { canManageItems } = useHasPermission();

  // View state
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Parse query params
  const page = parseInt(searchParams.get('page') || '1', 10);
  const sortBy = searchParams.get('sortBy') || 'createdAt';
  const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';
  const filters: ItemFiltersValue = {
    search: searchParams.get('search') || undefined,
    category: searchParams.get('category') || undefined,
    status: searchParams.get('status') || undefined,
    condition: searchParams.get('condition') || undefined,
  };

  // Fetch items
  const { data, isLoading, refetch } = useItems({
    page,
    limit: 20,
    sortBy,
    sortOrder,
    search: filters.search,
    category: filters.category as any,
    status: filters.status as any,
    condition: filters.condition as any,
  });

  const bulkDelete = useBulkDeleteItems();

  const items = data?.data ?? [];
  const pagination = data?.pagination;

  // Update URL params
  const updateParams = (updates: Record<string, string | undefined>) => {
    const newParams = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        newParams.set(key, value);
      } else {
        newParams.delete(key);
      }
    });
    // Reset to page 1 when filters change
    if (!updates.page) {
      newParams.set('page', '1');
    }
    setSearchParams(newParams);
  };

  const handleFiltersChange = (newFilters: ItemFiltersValue) => {
    updateParams({
      search: newFilters.search,
      category: newFilters.category,
      status: newFilters.status,
      condition: newFilters.condition,
    });
  };

  const handleSort = (column: string) => {
    const newOrder = sortBy === column && sortOrder === 'asc' ? 'desc' : 'asc';
    updateParams({ sortBy: column, sortOrder: newOrder, page: String(page) });
  };

  const handlePageChange = (newPage: number) => {
    updateParams({ page: String(newPage) });
  };

  const handleRowClick = (item: Item) => {
    navigate(`/inventory/${item.id}`);
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;

    try {
      await bulkDelete.mutateAsync(selectedIds);
      setSelectedIds([]);
      setShowDeleteConfirm(false);
      refetch();
    } catch (error) {
      console.error('Bulk delete failed:', error);
    }
  };

  const handleExport = () => {
    // TODO: Implement CSV export
    const csvContent = [
      ['Asset ID', 'Name', 'Category', 'Status', 'Condition', 'Serial Number', 'Brand', 'Model'].join(','),
      ...items.map((item) =>
        [
          item.assetId,
          `"${item.name}"`,
          item.category,
          item.status,
          item.condition,
          item.serialNumber,
          item.brand || '',
          item.model || '',
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Table columns
  const columns: Column<Item>[] = [
    {
      key: 'assetId',
      header: 'Asset ID',
      sortable: true,
      render: (item) => (
        <span className="font-medium text-primary">{item.assetId}</span>
      ),
    },
    {
      key: 'name',
      header: 'Name',
      sortable: true,
      render: (item) => (
        <div className="flex items-center gap-3">
          {item.thumbnailUrl ? (
            <img
              src={item.thumbnailUrl}
              alt={item.name}
              className="h-10 w-10 rounded object-cover"
            />
          ) : (
            <div className="h-10 w-10 rounded bg-muted" />
          )}
          <div>
            <div className="font-medium">{item.name}</div>
            {item.brand && item.model && (
              <div className="text-xs text-muted-foreground">
                {item.brand} {item.model}
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      sortable: true,
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (item) => {
        const statusInfo = ITEM_STATUSES.find((s) => s.value === item.status);
        const variantMap: Record<string, 'success' | 'info' | 'warning' | 'secondary' | 'destructive' | 'default'> = {
          success: 'success',
          info: 'info',
          warning: 'warning',
          secondary: 'secondary',
          destructive: 'destructive',
        };
        return (
          <Badge variant={variantMap[statusInfo?.color || 'default'] || 'default'}>
            {statusInfo?.label || item.status}
          </Badge>
        );
      },
    },
    {
      key: 'condition',
      header: 'Condition',
      sortable: true,
      render: (item) => {
        const condInfo = ITEM_CONDITIONS.find((c) => c.value === item.condition);
        return condInfo?.label || item.condition;
      },
    },
    {
      key: 'assignedTo',
      header: 'Assigned To',
      render: (item) => {
        const activeAssignment = item.assignments?.find((a) => !a.returnedAt);
        if (!activeAssignment) return <span className="text-muted-foreground">-</span>;
        return (
          <span>
            {activeAssignment.employee.firstName} {activeAssignment.employee.lastName}
          </span>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Inventory</h1>
          <p className="text-muted-foreground">
            {pagination ? `${pagination.total} items` : 'Loading...'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canManageItems && (
            <Button onClick={() => navigate('/inventory/add')}>
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <ItemFilters value={filters} onChange={handleFiltersChange} />

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex rounded-md border">
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="rounded-r-none"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="rounded-l-none"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>

          {/* Bulk Actions */}
          {selectedIds.length > 0 && canManageItems && (
            <div className="flex items-center gap-2 ml-4">
              <span className="text-sm text-muted-foreground">
                {selectedIds.length} selected
              </span>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </div>
          )}
        </div>

        {/* Export */}
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Content */}
      {viewMode === 'list' ? (
        <DataTable
          data={items}
          columns={columns}
          keyField="id"
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
          selectable={canManageItems}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          pagination={pagination}
          onPageChange={handlePageChange}
          onRowClick={handleRowClick}
          isLoading={isLoading}
          emptyMessage="No items found. Try adjusting your filters."
        />
      ) : (
        <>
          <ItemGridView
            items={items}
            onItemClick={handleRowClick}
            selectable={canManageItems}
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
            isLoading={isLoading}
            emptyMessage="No items found. Try adjusting your filters."
          />
          {/* Grid Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex justify-center gap-2">
              <Button
                variant="outline"
                onClick={() => handlePageChange(page - 1)}
                disabled={page <= 1}
              >
                Previous
              </Button>
              <span className="flex items-center px-4 text-sm text-muted-foreground">
                Page {page} of {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= pagination.totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-md rounded-lg bg-background p-6 shadow-lg">
            <h3 className="text-lg font-semibold">Confirm Delete</h3>
            <p className="mt-2 text-muted-foreground">
              Are you sure you want to delete {selectedIds.length} item(s)? This action
              cannot be undone.
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Note: Items that are currently assigned cannot be deleted and will be skipped.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleBulkDelete}
                isLoading={bulkDelete.isPending}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
