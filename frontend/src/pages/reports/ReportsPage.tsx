// ReportsPage - User Story 8
// Generate and export inventory reports

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  FileText,
  Download,
  Package,
  Users,
  DollarSign,
  Calendar,
  BarChart3,
  PieChart,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { api } from '../../lib/api';
import { formatCurrency, formatDate } from '../../lib/utils';
import { ITEM_CATEGORIES, ITEM_STATUSES } from '../../types/item';

// =============================================================================
// Types
// =============================================================================

interface InventoryReport {
  summary: {
    totalItems: number;
    totalValue: number;
    availableItems: number;
    assignedItems: number;
  };
  byCategory: Array<{
    category: string;
    count: number;
    totalValue: number;
  }>;
  byStatus: Array<{
    status: string;
    count: number;
  }>;
}

interface AssignmentsReport {
  summary: {
    totalAssignments: number;
    activeAssignments: number;
    returnedThisMonth: number;
    overdueAssignments: number;
  };
  byDepartment: Array<{
    department: string;
    activeAssignments: number;
    totalValue: number;
  }>;
  topEmployees: Array<{
    employeeId: string;
    name: string;
    department: string;
    assignedItemsCount: number;
  }>;
}

// =============================================================================
// Component
// =============================================================================

export function ReportsPage() {
  const [reportType, setReportType] = useState<'inventory' | 'assignments' | 'depreciation'>('inventory');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Fetch inventory report
  const inventoryReport = useQuery({
    queryKey: ['reports', 'inventory', categoryFilter, statusFilter],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (categoryFilter) params.category = categoryFilter;
      if (statusFilter) params.status = statusFilter;
      const response = await api.get<InventoryReport>('/reports/inventory', { params });
      return response.data;
    },
    enabled: reportType === 'inventory',
  });

  // Fetch assignments report
  const assignmentsReport = useQuery({
    queryKey: ['reports', 'assignments'],
    queryFn: async () => {
      const response = await api.get<AssignmentsReport>('/reports/assignments');
      return response.data;
    },
    enabled: reportType === 'assignments',
  });

  // Handle export
  const handleExport = async (format: 'csv' | 'excel') => {
    try {
      const endpoint = reportType === 'inventory' ? '/reports/inventory/export' : '/reports/assignments/export';
      const params: Record<string, string> = { format };
      if (categoryFilter) params.category = categoryFilter;
      if (statusFilter) params.status = statusFilter;

      // For CSV, we can generate it client-side from the data we have
      if (format === 'csv' && reportType === 'inventory' && inventoryReport.data) {
        const data = inventoryReport.data;
        const csvLines = [
          'Report Type,Inventory Summary',
          `Generated,${new Date().toISOString()}`,
          '',
          'Summary',
          `Total Items,${data.summary.totalItems}`,
          `Total Value,${data.summary.totalValue}`,
          `Available Items,${data.summary.availableItems}`,
          `Assigned Items,${data.summary.assignedItems}`,
          '',
          'By Category',
          'Category,Count,Total Value',
          ...data.byCategory.map((c) => `${c.category},${c.count},${c.totalValue}`),
          '',
          'By Status',
          'Status,Count',
          ...data.byStatus.map((s) => `${s.status},${s.count}`),
        ];

        const blob = new Blob([csvLines.join('\n')], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `inventory-report-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Reports</h1>
          <p className="text-muted-foreground">
            Generate and export inventory reports
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleExport('csv')}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Report Type Selector */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={reportType === 'inventory' ? 'default' : 'outline'}
          onClick={() => setReportType('inventory')}
        >
          <Package className="mr-2 h-4 w-4" />
          Inventory
        </Button>
        <Button
          variant={reportType === 'assignments' ? 'default' : 'outline'}
          onClick={() => setReportType('assignments')}
        >
          <Users className="mr-2 h-4 w-4" />
          Assignments
        </Button>
        <Button
          variant={reportType === 'depreciation' ? 'default' : 'outline'}
          onClick={() => setReportType('depreciation')}
        >
          <DollarSign className="mr-2 h-4 w-4" />
          Depreciation
        </Button>
      </div>

      {/* Filters */}
      {reportType === 'inventory' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Filters</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4">
            <div className="w-48">
              <label className="text-sm font-medium">Category</label>
              <Select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="">All Categories</option>
                {ITEM_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="w-48">
              <label className="text-sm font-medium">Status</label>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Statuses</option>
                {ITEM_STATUSES.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Inventory Report */}
      {reportType === 'inventory' && (
        <div className="space-y-6">
          {inventoryReport.isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : inventoryReport.error ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-destructive mb-2">Failed to load inventory report</p>
                <p className="text-sm text-muted-foreground">Please try refreshing the page</p>
              </CardContent>
            </Card>
          ) : inventoryReport.data ? (
            <>
              {/* Summary Cards */}
              <div className="grid gap-4 md:grid-cols-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Total Items
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {inventoryReport.data.summary.totalItems}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Total Value
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatCurrency(inventoryReport.data.summary.totalValue)}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Available
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {inventoryReport.data.summary.availableItems}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Assigned
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">
                      {inventoryReport.data.summary.assignedItems}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* By Category */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5" />
                    Items by Category
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {inventoryReport.data.byCategory.map((cat) => (
                      <div key={cat.category} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-32 font-medium">
                            {ITEM_CATEGORIES.find((c) => c.value === cat.category)?.label || cat.category}
                          </div>
                          <Badge variant="secondary">{cat.count} items</Badge>
                        </div>
                        <div className="text-muted-foreground">
                          {formatCurrency(cat.totalValue)}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* By Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Items by Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-4">
                    {inventoryReport.data.byStatus.map((status) => {
                      const statusInfo = ITEM_STATUSES.find((s) => s.value === status.status);
                      const variantMap: Record<string, 'success' | 'info' | 'warning' | 'secondary' | 'destructive' | 'default'> = {
                        success: 'success',
                        info: 'info',
                        warning: 'warning',
                        secondary: 'secondary',
                        destructive: 'destructive',
                      };
                      return (
                        <div
                          key={status.status}
                          className="flex items-center gap-2 rounded-lg border px-4 py-3"
                        >
                          <Badge variant={variantMap[statusInfo?.color || 'default'] || 'default'}>
                            {status.count}
                          </Badge>
                          <span>{statusInfo?.label || status.status}</span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No data available
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Assignments Report */}
      {reportType === 'assignments' && (
        <div className="space-y-6">
          {assignmentsReport.isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : assignmentsReport.error ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-destructive mb-2">Failed to load assignments report</p>
                <p className="text-sm text-muted-foreground">Please try refreshing the page</p>
              </CardContent>
            </Card>
          ) : assignmentsReport.data ? (
            <>
              {/* Summary Cards */}
              <div className="grid gap-4 md:grid-cols-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Total Assignments
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {assignmentsReport.data.summary.totalAssignments}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Active
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">
                      {assignmentsReport.data.summary.activeAssignments}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Returned This Month
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {assignmentsReport.data.summary.returnedThisMonth}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Overdue
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">
                      {assignmentsReport.data.summary.overdueAssignments}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* By Department */}
              <Card>
                <CardHeader>
                  <CardTitle>Assignments by Department</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {assignmentsReport.data.byDepartment.map((dept) => (
                      <div
                        key={dept.department}
                        className="flex items-center justify-between rounded-lg border px-4 py-3"
                      >
                        <div className="font-medium">{dept.department || 'No Department'}</div>
                        <div className="flex items-center gap-4">
                          <Badge variant="info">{dept.activeAssignments} active</Badge>
                          <span className="text-muted-foreground">
                            {formatCurrency(dept.totalValue)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Top Employees */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Employees by Equipment</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {assignmentsReport.data.topEmployees.map((emp, index) => (
                      <div
                        key={emp.employeeId}
                        className="flex items-center gap-4"
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-medium">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">{emp.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {emp.department || 'No Department'}
                          </div>
                        </div>
                        <Badge>{emp.assignedItemsCount} items</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No data available
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Depreciation Report */}
      {reportType === 'depreciation' && (
        <Card>
          <CardContent className="py-12 text-center">
            <DollarSign className="mx-auto h-12 w-12 text-muted-foreground/30" />
            <h3 className="mt-4 font-semibold">Depreciation Report</h3>
            <p className="mt-2 text-muted-foreground">
              Coming soon - Track asset depreciation over time
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
