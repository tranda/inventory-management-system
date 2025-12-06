// ReportFilters - Filters for report generation
import { useState } from 'react';
import { Calendar, Filter } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Label } from '../ui/Label';

export type ReportType =
  | 'inventory-summary'
  | 'assignment-history'
  | 'equipment-by-employee'
  | 'warranty-status'
  | 'depreciation';

interface ReportFiltersProps {
  reportType: ReportType;
  onFilterChange: (filters: ReportFilters) => void;
  categories?: string[];
  departments?: string[];
}

export interface ReportFilters {
  startDate?: string;
  endDate?: string;
  category?: string;
  department?: string;
  status?: string;
}

const reportTypeLabels: Record<ReportType, string> = {
  'inventory-summary': 'Inventory Summary',
  'assignment-history': 'Assignment History',
  'equipment-by-employee': 'Equipment by Employee',
  'warranty-status': 'Warranty Status',
  depreciation: 'Depreciation Report',
};

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'AVAILABLE', label: 'Available' },
  { value: 'ASSIGNED', label: 'Assigned' },
  { value: 'IN_REPAIR', label: 'In Repair' },
  { value: 'DECOMMISSIONED', label: 'Decommissioned' },
];

export function ReportFilters({
  reportType,
  onFilterChange,
  categories = [],
  departments = [],
}: ReportFiltersProps) {
  const [filters, setFilters] = useState<ReportFilters>({});

  const handleChange = (key: keyof ReportFilters, value: string) => {
    const newFilters = { ...filters, [key]: value || undefined };
    setFilters(newFilters);
  };

  const handleApply = () => {
    onFilterChange(filters);
  };

  const handleReset = () => {
    setFilters({});
    onFilterChange({});
  };

  const showDateFilters = ['assignment-history'].includes(reportType);
  const showCategoryFilter = [
    'inventory-summary',
    'warranty-status',
    'depreciation',
  ].includes(reportType);
  const showDepartmentFilter = [
    'assignment-history',
    'equipment-by-employee',
  ].includes(reportType);
  const showStatusFilter = ['inventory-summary'].includes(reportType);

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="mb-4 flex items-center gap-2">
        <Filter className="h-5 w-5 text-muted-foreground" />
        <h3 className="font-medium">{reportTypeLabels[reportType]} Filters</h3>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {showDateFilters && (
          <>
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="startDate"
                  type="date"
                  value={filters.startDate || ''}
                  onChange={(e) => handleChange('startDate', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="endDate"
                  type="date"
                  value={filters.endDate || ''}
                  onChange={(e) => handleChange('endDate', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </>
        )}

        {showCategoryFilter && (
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select
              id="category"
              value={filters.category || ''}
              onChange={(e) => handleChange('category', e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.replace(/_/g, ' ')}
                </option>
              ))}
            </Select>
          </div>
        )}

        {showDepartmentFilter && (
          <div className="space-y-2">
            <Label htmlFor="department">Department</Label>
            <Select
              id="department"
              value={filters.department || ''}
              onChange={(e) => handleChange('department', e.target.value)}
            >
              <option value="">All Departments</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </Select>
          </div>
        )}

        {showStatusFilter && (
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              id="status"
              value={filters.status || ''}
              onChange={(e) => handleChange('status', e.target.value)}
            >
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
          </div>
        )}
      </div>

      <div className="mt-4 flex gap-2">
        <Button onClick={handleApply}>Apply Filters</Button>
        <Button variant="outline" onClick={handleReset}>
          Reset
        </Button>
      </div>
    </div>
  );
}
