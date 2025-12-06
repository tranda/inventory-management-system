// EmployeeSelect Component - User Story 2
// Searchable dropdown for selecting employees

import { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, X, User } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useEmployees, type Employee } from '../../services/employees.service';

interface EmployeeSelectProps {
  value?: string;
  onChange: (employeeId: string | undefined, employee?: Employee) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  className?: string;
  excludeIds?: string[];
}

export function EmployeeSelect({
  value,
  onChange,
  placeholder = 'Select employee...',
  disabled,
  error,
  className,
  excludeIds = [],
}: EmployeeSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch employees with search
  const { data, isLoading } = useEmployees({
    search: search || undefined,
    isActive: true,
    limit: 50,
  });

  const employees = data?.data?.filter((e) => !excludeIds.includes(e.id)) ?? [];
  const selectedEmployee = employees.find((e) => e.id === value) ||
    (value && data?.data?.find((e) => e.id === value));

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus input when opening
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (employee: Employee) => {
    onChange(employee.id, employee);
    setIsOpen(false);
    setSearch('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(undefined);
    setSearch('');
  };

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          error && 'border-destructive focus-visible:ring-destructive',
          disabled && 'cursor-not-allowed opacity-50'
        )}
      >
        {selectedEmployee ? (
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <User className="h-3.5 w-3.5" />
            </div>
            <div className="truncate">
              <span className="font-medium">
                {selectedEmployee.firstName} {selectedEmployee.lastName}
              </span>
              {selectedEmployee.department && (
                <span className="text-muted-foreground"> - {selectedEmployee.department}</span>
              )}
            </div>
          </div>
        ) : (
          <span className="text-muted-foreground">{placeholder}</span>
        )}
        <div className="flex items-center gap-1">
          {selectedEmployee && !disabled && (
            <X
              className="h-4 w-4 text-muted-foreground hover:text-foreground"
              onClick={handleClear}
            />
          )}
          <ChevronDown className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-180')} />
        </div>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md">
          {/* Search Input */}
          <div className="flex items-center border-b px-3">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search employees..."
              className="flex-1 bg-transparent px-2 py-2 text-sm outline-none"
            />
          </div>

          {/* Employee List */}
          <div className="max-h-60 overflow-auto p-1">
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : employees.length === 0 ? (
              <div className="py-4 text-center text-sm text-muted-foreground">
                {search ? 'No employees found' : 'No active employees'}
              </div>
            ) : (
              employees.map((employee) => (
                <button
                  key={employee.id}
                  type="button"
                  onClick={() => handleSelect(employee)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-sm px-2 py-2 text-sm hover:bg-accent',
                    value === employee.id && 'bg-accent'
                  )}
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <User className="h-4 w-4" />
                  </div>
                  <div className="flex-1 overflow-hidden text-left">
                    <div className="truncate font-medium">
                      {employee.firstName} {employee.lastName}
                    </div>
                    <div className="truncate text-xs text-muted-foreground">
                      {employee.employeeId}
                      {employee.department && ` - ${employee.department}`}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
