// ReportViewer - Displays report data with export options
import { Download, FileSpreadsheet, FileText } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

interface Column {
  key: string;
  label: string;
  format?: (value: unknown) => string;
}

interface ReportViewerProps {
  title: string;
  description?: string;
  data: Record<string, unknown>[];
  columns: Column[];
  summary?: {
    label: string;
    value: string | number;
  }[];
  isLoading?: boolean;
  onExportCSV?: () => void;
  onExportExcel?: () => void;
}

export function ReportViewer({
  title,
  description,
  data,
  columns,
  summary,
  isLoading,
  onExportCSV,
  onExportExcel,
}: ReportViewerProps) {
  if (isLoading) {
    return <ReportViewerSkeleton />;
  }

  const formatValue = (column: Column, value: unknown): string => {
    if (value === null || value === undefined) return '-';
    if (column.format) return column.format(value);
    if (typeof value === 'number') return value.toLocaleString();
    if (value instanceof Date) return value.toLocaleDateString();
    return String(value);
  };

  return (
    <Card className="overflow-hidden">
      <div className="border-b bg-muted/50 px-6 py-4">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold">{title}</h2>
            {description && (
              <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          <div className="flex gap-2">
            {onExportCSV && (
              <Button variant="outline" size="sm" onClick={onExportCSV}>
                <FileText className="mr-2 h-4 w-4" />
                CSV
              </Button>
            )}
            {onExportExcel && (
              <Button variant="outline" size="sm" onClick={onExportExcel}>
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Excel
              </Button>
            )}
          </div>
        </div>

        {summary && summary.length > 0 && (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {summary.map((item) => (
              <div key={item.label} className="rounded-lg bg-background p-3">
                <p className="text-sm text-muted-foreground">{item.label}</p>
                <p className="text-xl font-bold">{item.value}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="px-4 py-3 text-left text-sm font-medium text-muted-foreground"
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  No data available
                </td>
              </tr>
            ) : (
              data.map((row, index) => (
                <tr
                  key={index}
                  className="border-b last:border-0 hover:bg-muted/50"
                >
                  {columns.map((column) => (
                    <td key={column.key} className="px-4 py-3 text-sm">
                      {formatValue(column, row[column.key])}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {data.length > 0 && (
        <div className="border-t bg-muted/50 px-6 py-3">
          <p className="text-sm text-muted-foreground">
            Showing {data.length} {data.length === 1 ? 'record' : 'records'}
          </p>
        </div>
      )}
    </Card>
  );
}

function ReportViewerSkeleton() {
  return (
    <Card className="overflow-hidden">
      <div className="border-b bg-muted/50 px-6 py-4">
        <div className="h-6 w-48 animate-pulse rounded bg-muted" />
        <div className="mt-2 h-4 w-64 animate-pulse rounded bg-muted" />
      </div>
      <div className="p-4">
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex gap-4">
              {[1, 2, 3, 4].map((j) => (
                <div
                  key={j}
                  className="h-8 flex-1 animate-pulse rounded bg-muted"
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

// Utility function to convert data to CSV
export function downloadCSV(data: Record<string, unknown>[], columns: Column[], filename: string) {
  const header = columns.map((c) => c.label).join(',');
  const rows = data.map((row) =>
    columns
      .map((col) => {
        const value = row[col.key];
        if (value === null || value === undefined) return '';
        const str = String(value);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      })
      .join(',')
  );

  const csv = [header, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}
