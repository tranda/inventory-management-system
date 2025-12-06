// AssignmentsListPage - View and manage all assignments
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, RotateCcw, UserPlus, CheckCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { DataTable, type Column } from '../../components/tables/DataTable';
import { useAssignments, type Assignment } from '../../services/assignments.service';
import { useHasPermission } from '../../contexts/AuthContext';
import { formatDate, formatRelativeTime } from '../../lib/utils';

export function AssignmentsListPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { canManageItems } = useHasPermission();

  const [searchInput, setSearchInput] = useState('');

  // Parse query params
  const page = parseInt(searchParams.get('page') || '1', 10);
  const sortBy = searchParams.get('sortBy') || 'assignedAt';
  const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';
  const isActive = searchParams.get('isActive') !== 'false';

  // Fetch assignments
  const { data, isLoading } = useAssignments({
    page,
    limit: 20,
    sortBy,
    sortOrder,
    isActive,
  });

  const assignments = data?.data ?? [];
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
    if (!updates.page) {
      newParams.set('page', '1');
    }
    setSearchParams(newParams);
  };

  const handleSort = (column: string) => {
    const newOrder = sortBy === column && sortOrder === 'asc' ? 'desc' : 'asc';
    updateParams({ sortBy: column, sortOrder: newOrder, page: String(page) });
  };

  const handlePageChange = (newPage: number) => {
    updateParams({ page: String(newPage) });
  };

  const handleRowClick = (assignment: Assignment) => {
    navigate(`/assignments/${assignment.id}`);
  };

  // Table columns
  const columns: Column<Assignment>[] = [
    {
      key: 'item',
      header: 'Item',
      sortable: false,
      render: (assignment) => (
        <div className="flex items-center gap-3">
          {assignment.item?.thumbnailUrl ? (
            <img
              src={assignment.item.thumbnailUrl}
              alt={assignment.item.name}
              className="h-10 w-10 rounded object-cover"
            />
          ) : (
            <div className="h-10 w-10 rounded bg-muted" />
          )}
          <div>
            <div className="font-medium">{assignment.item?.name}</div>
            <div className="text-xs text-muted-foreground">
              {assignment.item?.assetId}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'employee',
      header: 'Assigned To',
      sortable: false,
      render: (assignment) => (
        <div>
          <div className="font-medium">
            {assignment.employee?.firstName} {assignment.employee?.lastName}
          </div>
          <div className="text-xs text-muted-foreground">
            {assignment.employee?.department || 'No department'}
          </div>
        </div>
      ),
    },
    {
      key: 'assignedAt',
      header: 'Assigned',
      sortable: true,
      render: (assignment) => (
        <div>
          <div>{formatDate(assignment.assignedAt)}</div>
          <div className="text-xs text-muted-foreground">
            {formatRelativeTime(assignment.assignedAt)}
          </div>
        </div>
      ),
    },
    {
      key: 'acknowledged',
      header: 'Acknowledged',
      sortable: true,
      render: (assignment) => (
        <Badge variant={assignment.acknowledged ? 'success' : 'warning'}>
          {assignment.acknowledged ? 'Yes' : 'Pending'}
        </Badge>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (assignment) => {
        if (assignment.returnedAt) {
          return (
            <Badge variant="secondary">
              Returned {formatDate(assignment.returnedAt)}
            </Badge>
          );
        }
        if (assignment.expectedReturnDate && new Date(assignment.expectedReturnDate) < new Date()) {
          return <Badge variant="destructive">Overdue</Badge>;
        }
        return <Badge variant="success">Active</Badge>;
      },
    },
    {
      key: 'actions',
      header: '',
      render: (assignment) => {
        if (assignment.returnedAt || !canManageItems) return null;
        return (
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/assignments/${assignment.id}/return`);
            }}
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Return
          </Button>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Assignments</h1>
          <p className="text-muted-foreground">
            {pagination ? `${pagination.total} assignments` : 'Loading...'}
          </p>
        </div>
        {canManageItems && (
          <Button onClick={() => navigate('/inventory?status=AVAILABLE')}>
            <UserPlus className="mr-2 h-4 w-4" />
            New Assignment
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex gap-2">
          <Button
            variant={isActive ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => updateParams({ isActive: 'true' })}
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            Active
          </Button>
          <Button
            variant={!isActive ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => updateParams({ isActive: 'false' })}
          >
            Returned
          </Button>
        </div>
      </div>

      {/* Assignments Table */}
      <DataTable
        data={assignments}
        columns={columns}
        keyField="id"
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={handleSort}
        pagination={pagination}
        onPageChange={handlePageChange}
        onRowClick={handleRowClick}
        isLoading={isLoading}
        emptyMessage="No assignments found."
      />
    </div>
  );
}
