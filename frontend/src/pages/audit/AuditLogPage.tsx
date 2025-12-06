// AuditLogPage - User Story 11
// View system audit logs (Admin only)

import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, Filter, History, User, Package, Users, ClipboardList } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { DataTable, type Column } from '../../components/tables/DataTable';
import { api } from '../../lib/api';
import { formatDateTime, formatRelativeTime } from '../../lib/utils';

// =============================================================================
// Types
// =============================================================================

interface AuditLog {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  changes: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface AuditLogQuery {
  page?: number;
  limit?: number;
  entityType?: string;
  action?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
}

// =============================================================================
// Component
// =============================================================================

export function AuditLogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);

  // Parse query params
  const page = parseInt(searchParams.get('page') || '1', 10);
  const entityType = searchParams.get('entityType') || '';
  const action = searchParams.get('action') || '';

  // Fetch audit logs
  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', page, entityType, action],
    queryFn: async () => {
      const params: Record<string, string | number> = { page, limit: 50 };
      if (entityType) params.entityType = entityType;
      if (action) params.action = action;
      const response = await api.getPaginated<AuditLog>('/audit', { params });
      return response;
    },
  });

  const logs = data?.data ?? [];
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

  const handlePageChange = (newPage: number) => {
    updateParams({ page: String(newPage) });
  };

  const getEntityIcon = (type: string) => {
    switch (type.toUpperCase()) {
      case 'ITEM':
        return <Package className="h-4 w-4" />;
      case 'EMPLOYEE':
        return <Users className="h-4 w-4" />;
      case 'ASSIGNMENT':
        return <ClipboardList className="h-4 w-4" />;
      case 'USER':
        return <User className="h-4 w-4" />;
      default:
        return <History className="h-4 w-4" />;
    }
  };

  const getActionBadge = (action: string) => {
    const actionLower = action.toLowerCase();
    if (actionLower === 'create') return <Badge variant="success">Create</Badge>;
    if (actionLower === 'update') return <Badge variant="info">Update</Badge>;
    if (actionLower === 'delete') return <Badge variant="destructive">Delete</Badge>;
    if (actionLower.includes('status')) return <Badge variant="warning">Status Change</Badge>;
    return <Badge variant="secondary">{action}</Badge>;
  };

  // Table columns
  const columns: Column<AuditLog>[] = [
    {
      key: 'createdAt',
      header: 'Time',
      width: '180px',
      render: (log) => (
        <div>
          <div className="font-medium">{formatDateTime(log.createdAt)}</div>
          <div className="text-xs text-muted-foreground">
            {formatRelativeTime(log.createdAt)}
          </div>
        </div>
      ),
    },
    {
      key: 'user',
      header: 'User',
      render: (log) => (
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-xs">
            {log.user.firstName.charAt(0)}
            {log.user.lastName.charAt(0)}
          </div>
          <div>
            <div className="font-medium">
              {log.user.firstName} {log.user.lastName}
            </div>
            <div className="text-xs text-muted-foreground">{log.user.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'action',
      header: 'Action',
      render: (log) => getActionBadge(log.action),
    },
    {
      key: 'entityType',
      header: 'Entity',
      render: (log) => (
        <div className="flex items-center gap-2">
          {getEntityIcon(log.entityType)}
          <span>{log.entityType}</span>
        </div>
      ),
    },
    {
      key: 'entityId',
      header: 'Entity ID',
      render: (log) => (
        <code className="rounded bg-muted px-2 py-1 text-xs">
          {log.entityId.substring(0, 8)}...
        </code>
      ),
    },
    {
      key: 'changes',
      header: 'Details',
      render: (log) => {
        if (!log.changes) return <span className="text-muted-foreground">-</span>;
        const changeCount = Object.keys(log.changes).length;
        return (
          <span className="text-sm text-muted-foreground">
            {changeCount} field{changeCount !== 1 ? 's' : ''} changed
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
          <h1 className="text-2xl font-bold">Audit Log</h1>
          <p className="text-muted-foreground">
            View all system activity and changes
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="mr-2 h-4 w-4" />
          Filters
        </Button>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Filters</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4">
            <div className="w-48">
              <label className="text-sm font-medium">Entity Type</label>
              <Select
                value={entityType}
                onChange={(e) => updateParams({ entityType: e.target.value || undefined })}
              >
                <option value="">All Types</option>
                <option value="ITEM">Item</option>
                <option value="EMPLOYEE">Employee</option>
                <option value="ASSIGNMENT">Assignment</option>
                <option value="USER">User</option>
              </Select>
            </div>
            <div className="w-48">
              <label className="text-sm font-medium">Action</label>
              <Select
                value={action}
                onChange={(e) => updateParams({ action: e.target.value || undefined })}
              >
                <option value="">All Actions</option>
                <option value="CREATE">Create</option>
                <option value="UPDATE">Update</option>
                <option value="DELETE">Delete</option>
                <option value="STATUS_CHANGE">Status Change</option>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                variant="ghost"
                onClick={() => {
                  setSearchParams(new URLSearchParams());
                }}
              >
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 text-green-600">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Items</p>
              <p className="text-xl font-bold">
                {logs.filter((l) => l.entityType === 'ITEM').length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Employees</p>
              <p className="text-xl font-bold">
                {logs.filter((l) => l.entityType === 'EMPLOYEE').length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
              <ClipboardList className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Assignments</p>
              <p className="text-xl font-bold">
                {logs.filter((l) => l.entityType === 'ASSIGNMENT').length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 text-orange-600">
              <User className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Users</p>
              <p className="text-xl font-bold">
                {logs.filter((l) => l.entityType === 'USER').length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Audit Log Table */}
      <DataTable
        data={logs}
        columns={columns}
        keyField="id"
        pagination={pagination}
        onPageChange={handlePageChange}
        isLoading={isLoading}
        emptyMessage="No audit logs found."
      />
    </div>
  );
}
