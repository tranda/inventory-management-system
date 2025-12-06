// RecentActivity - Shows recent audit log entries
import { Activity, Package, Users, ClipboardList, UserCog } from 'lucide-react';
import { Card } from '../ui/Card';
import { formatDistanceToNow } from 'date-fns';

interface AuditLogEntry {
  id: string;
  entityType: 'Item' | 'Assignment' | 'Employee' | 'User';
  action: string;
  createdAt: string;
  user: {
    firstName: string;
    lastName: string;
  };
  metadata?: Record<string, unknown>;
}

interface RecentActivityProps {
  entries: AuditLogEntry[];
  isLoading?: boolean;
}

const entityIcons: Record<string, React.ReactNode> = {
  Item: <Package className="h-4 w-4" />,
  Assignment: <ClipboardList className="h-4 w-4" />,
  Employee: <Users className="h-4 w-4" />,
  User: <UserCog className="h-4 w-4" />,
};

const actionLabels: Record<string, string> = {
  CREATE: 'created',
  UPDATE: 'updated',
  DELETE: 'deleted',
  ASSIGN: 'assigned',
  RETURN: 'returned',
  TRANSFER: 'transferred',
  STATUS_CHANGE: 'changed status of',
  DECOMMISSION: 'decommissioned',
  LOGIN: 'logged in',
  LOGOUT: 'logged out',
  PASSWORD_CHANGE: 'changed password',
};

export function RecentActivity({ entries, isLoading }: RecentActivityProps) {
  if (isLoading) {
    return <RecentActivitySkeleton />;
  }

  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold">Recent Activity</h3>
        <Activity className="h-5 w-5 text-muted-foreground" />
      </div>

      {entries.length === 0 ? (
        <p className="text-sm text-muted-foreground">No recent activity</p>
      ) : (
        <div className="space-y-4">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="flex items-start gap-3 border-b pb-3 last:border-0 last:pb-0"
            >
              <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                {entityIcons[entry.entityType] || <Activity className="h-4 w-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm">
                  <span className="font-medium">
                    {entry.user.firstName} {entry.user.lastName}
                  </span>{' '}
                  <span className="text-muted-foreground">
                    {actionLabels[entry.action] || entry.action.toLowerCase()}
                  </span>{' '}
                  <span className="text-muted-foreground">
                    {entry.entityType === 'User' && entry.action === 'LOGIN'
                      ? ''
                      : `a ${entry.entityType.toLowerCase()}`}
                  </span>
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(entry.createdAt), { addSuffix: true })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function RecentActivitySkeleton() {
  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="h-5 w-32 animate-pulse rounded bg-muted" />
        <div className="h-5 w-5 animate-pulse rounded bg-muted" />
      </div>
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-start gap-3 border-b pb-3 last:border-0">
            <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
            <div className="flex-1">
              <div className="h-4 w-48 animate-pulse rounded bg-muted" />
              <div className="mt-1 h-3 w-24 animate-pulse rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
