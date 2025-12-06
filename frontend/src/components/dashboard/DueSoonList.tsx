// DueSoonList - Shows items due for return soon
import { Link } from 'react-router-dom';
import { Clock, AlertCircle } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { formatDate } from '../../lib/utils';

interface DueSoonItem {
  id: string;
  item: {
    id: string;
    assetId: string;
    name: string;
  };
  employee: {
    id: string;
    firstName: string;
    lastName: string;
  };
  expectedReturnAt: string;
  daysRemaining: number;
}

interface DueSoonListProps {
  items: DueSoonItem[];
  isLoading?: boolean;
}

export function DueSoonList({ items, isLoading }: DueSoonListProps) {
  if (isLoading) {
    return <DueSoonListSkeleton />;
  }

  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold">Due Soon</h3>
        <Clock className="h-5 w-5 text-muted-foreground" />
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No items due soon</p>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-start justify-between border-b pb-3 last:border-0 last:pb-0"
            >
              <div className="flex-1 min-w-0">
                <Link
                  to={`/inventory/${item.item.id}`}
                  className="font-medium hover:text-primary hover:underline"
                >
                  {item.item.name}
                </Link>
                <p className="text-sm text-muted-foreground truncate">
                  {item.item.assetId} • {item.employee.firstName} {item.employee.lastName}
                </p>
              </div>
              <div className="ml-4 flex flex-col items-end">
                <Badge
                  variant={
                    item.daysRemaining < 0
                      ? 'destructive'
                      : item.daysRemaining <= 3
                        ? 'warning'
                        : 'secondary'
                  }
                >
                  {item.daysRemaining < 0 ? (
                    <>
                      <AlertCircle className="mr-1 h-3 w-3" />
                      {Math.abs(item.daysRemaining)} days overdue
                    </>
                  ) : item.daysRemaining === 0 ? (
                    'Due today'
                  ) : (
                    `${item.daysRemaining} days`
                  )}
                </Badge>
                <span className="mt-1 text-xs text-muted-foreground">
                  {formatDate(item.expectedReturnAt)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function DueSoonListSkeleton() {
  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="h-5 w-24 animate-pulse rounded bg-muted" />
        <div className="h-5 w-5 animate-pulse rounded bg-muted" />
      </div>
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-start justify-between border-b pb-3 last:border-0">
            <div className="flex-1">
              <div className="h-4 w-32 animate-pulse rounded bg-muted" />
              <div className="mt-1 h-3 w-48 animate-pulse rounded bg-muted" />
            </div>
            <div className="ml-4">
              <div className="h-5 w-16 animate-pulse rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
