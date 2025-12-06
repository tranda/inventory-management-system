// AuditLogTable - Table component for displaying audit logs
import { useState } from 'react';
import { ChevronDown, ChevronRight, Clock, Globe, Monitor } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { cn, formatDate } from '../../lib/utils';
import {
  type AuditLogEntry,
  ACTION_LABELS,
  ACTION_COLORS,
  ENTITY_TYPE_LABELS,
} from '../../services/audit.service';

interface AuditLogTableProps {
  logs: AuditLogEntry[];
  isLoading?: boolean;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function AuditLogTable({
  logs,
  isLoading,
  page,
  totalPages,
  onPageChange,
}: AuditLogTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  if (isLoading) {
    return <AuditLogTableSkeleton />;
  }

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="w-10 px-4 py-3" />
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                Timestamp
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                User
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                Action
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                Entity
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                IP Address
              </th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  No audit logs found
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <>
                  <tr
                    key={log.id}
                    className="border-b hover:bg-muted/50 cursor-pointer"
                    onClick={() => toggleRow(log.id)}
                  >
                    <td className="px-4 py-3">
                      {expandedRows.has(log.id) ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        {formatDate(log.createdAt, true)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div>
                        <span className="font-medium">
                          {log.user.firstName} {log.user.lastName}
                        </span>
                        <p className="text-xs text-muted-foreground">{log.user.email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'inline-flex rounded-full px-2 py-1 text-xs font-medium',
                          ACTION_COLORS[log.action]
                        )}
                      >
                        {ACTION_LABELS[log.action]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <Badge variant="outline">{ENTITY_TYPE_LABELS[log.entityType]}</Badge>
                      <span className="ml-2 text-xs text-muted-foreground">
                        {log.entityId.slice(0, 8)}...
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-1">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        {log.metadata.ipAddress}
                      </div>
                    </td>
                  </tr>
                  {expandedRows.has(log.id) && (
                    <tr key={`${log.id}-expanded`} className="bg-muted/25">
                      <td colSpan={6} className="px-4 py-4">
                        <div className="space-y-4">
                          {/* User Agent */}
                          <div className="flex items-start gap-2">
                            <Monitor className="h-4 w-4 mt-0.5 text-muted-foreground" />
                            <div>
                              <p className="text-xs font-medium text-muted-foreground">User Agent</p>
                              <p className="text-sm break-all">{log.metadata.userAgent}</p>
                            </div>
                          </div>

                          {/* Before/After Changes */}
                          <div className="grid gap-4 sm:grid-cols-2">
                            {log.before && Object.keys(log.before).length > 0 && (
                              <div className="rounded-lg border bg-background p-3">
                                <p className="mb-2 text-xs font-medium text-muted-foreground">
                                  Before
                                </p>
                                <pre className="text-xs overflow-auto max-h-40">
                                  {JSON.stringify(log.before, null, 2)}
                                </pre>
                              </div>
                            )}
                            {log.after && Object.keys(log.after).length > 0 && (
                              <div className="rounded-lg border bg-background p-3">
                                <p className="mb-2 text-xs font-medium text-muted-foreground">
                                  After
                                </p>
                                <pre className="text-xs overflow-auto max-h-40">
                                  {JSON.stringify(log.after, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>

                          {/* Additional Metadata */}
                          {Object.keys(log.metadata).filter(
                            (k) => !['ipAddress', 'userAgent'].includes(k)
                          ).length > 0 && (
                            <div className="rounded-lg border bg-background p-3">
                              <p className="mb-2 text-xs font-medium text-muted-foreground">
                                Additional Info
                              </p>
                              <pre className="text-xs">
                                {JSON.stringify(
                                  Object.fromEntries(
                                    Object.entries(log.metadata).filter(
                                      ([k]) => !['ipAddress', 'userAgent'].includes(k)
                                    )
                                  ),
                                  null,
                                  2
                                )}
                              </pre>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t px-4 py-3">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}

function AuditLogTableSkeleton() {
  return (
    <Card className="overflow-hidden">
      <div className="p-4 space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex gap-4">
            {[1, 2, 3, 4, 5, 6].map((j) => (
              <div
                key={j}
                className="h-10 flex-1 animate-pulse rounded bg-muted"
              />
            ))}
          </div>
        ))}
      </div>
    </Card>
  );
}
