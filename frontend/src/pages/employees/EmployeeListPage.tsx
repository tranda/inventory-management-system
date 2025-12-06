// EmployeeListPage - User Story 6
// View and search employees with their assigned equipment

import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Search, User, Package } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Card, CardContent } from '../../components/ui/Card';
import { DataTable, type Column } from '../../components/tables/DataTable';
import { useEmployees, type Employee } from '../../services/employees.service';
import { useHasPermission } from '../../contexts/AuthContext';

export function EmployeeListPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { canManageItems } = useHasPermission();

  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');

  // Parse query params
  const page = parseInt(searchParams.get('page') || '1', 10);
  const sortBy = searchParams.get('sortBy') || 'lastName';
  const sortOrder = (searchParams.get('sortOrder') || 'asc') as 'asc' | 'desc';
  const search = searchParams.get('search') || undefined;
  const isActive = searchParams.get('isActive') !== 'false';

  // Fetch employees
  const { data, isLoading } = useEmployees({
    page,
    limit: 20,
    sortBy,
    sortOrder,
    search,
    isActive,
  });

  const employees = data?.data ?? [];
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateParams({ search: searchInput || undefined });
  };

  const handleSort = (column: string) => {
    const newOrder = sortBy === column && sortOrder === 'asc' ? 'desc' : 'asc';
    updateParams({ sortBy: column, sortOrder: newOrder, page: String(page) });
  };

  const handlePageChange = (newPage: number) => {
    updateParams({ page: String(newPage) });
  };

  const handleRowClick = (employee: Employee) => {
    navigate(`/employees/${employee.id}`);
  };

  // Table columns
  const columns: Column<Employee>[] = [
    {
      key: 'name',
      header: 'Employee',
      sortable: true,
      render: (employee) => (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-medium">
            {employee.firstName.charAt(0)}
            {employee.lastName.charAt(0)}
          </div>
          <div>
            <div className="font-medium">
              {employee.firstName} {employee.lastName}
            </div>
            <div className="text-xs text-muted-foreground">
              {employee.employeeId}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'email',
      header: 'Email',
      sortable: true,
    },
    {
      key: 'department',
      header: 'Department',
      sortable: true,
      render: (employee) => employee.department || '-',
    },
    {
      key: 'position',
      header: 'Position',
      render: (employee) => employee.position || '-',
    },
    {
      key: 'equipment',
      header: 'Equipment',
      render: (employee) => {
        const count = employee._count?.assignments || 0;
        return (
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-muted-foreground" />
            <span>{count} item{count !== 1 ? 's' : ''}</span>
          </div>
        );
      },
    },
    {
      key: 'isActive',
      header: 'Status',
      render: (employee) => (
        <Badge variant={employee.isActive ? 'success' : 'secondary'}>
          {employee.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Employees</h1>
          <p className="text-muted-foreground">
            {pagination ? `${pagination.total} employees` : 'Loading...'}
          </p>
        </div>
        {canManageItems && (
          <Button onClick={() => navigate('/employees/add')}>
            <Plus className="mr-2 h-4 w-4" />
            Add Employee
          </Button>
        )}
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <form onSubmit={handleSearch} className="flex flex-1 gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by name, email, employee ID..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button type="submit" variant="secondary">
            Search
          </Button>
        </form>

        <div className="flex gap-2">
          <Button
            variant={isActive ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => updateParams({ isActive: 'true' })}
          >
            Active
          </Button>
          <Button
            variant={!isActive ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => updateParams({ isActive: 'false' })}
          >
            Inactive
          </Button>
        </div>
      </div>

      {/* Employee Table */}
      <DataTable
        data={employees}
        columns={columns}
        keyField="id"
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={handleSort}
        pagination={pagination}
        onPageChange={handlePageChange}
        onRowClick={handleRowClick}
        isLoading={isLoading}
        emptyMessage="No employees found."
      />
    </div>
  );
}
