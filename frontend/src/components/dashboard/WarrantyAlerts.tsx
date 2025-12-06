// WarrantyAlerts - Shows items with expiring or expired warranties
import { Link } from 'react-router-dom';
import { Shield, AlertTriangle, CheckCircle } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { formatDate } from '../../lib/utils';

interface WarrantyItem {
  id: string;
  assetId: string;
  name: string;
  category: string;
  warrantyExpiry: string;
  daysRemaining: number;
  status: 'expired' | 'expiring_soon' | 'valid';
}

interface WarrantyAlertsProps {
  items: WarrantyItem[];
  isLoading?: boolean;
}

export function WarrantyAlerts({ items, isLoading }: WarrantyAlertsProps) {
  if (isLoading) {
    return <WarrantyAlertsSkeleton />;
  }

  // Filter to only show expired or expiring soon
  const alertItems = items.filter((item) => item.status !== 'valid');

  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold">Warranty Alerts</h3>
        <Shield className="h-5 w-5 text-muted-foreground" />
      </div>

      {alertItems.length === 0 ? (
        <div className="flex items-center gap-2 text-sm text-green-600">
          <CheckCircle className="h-4 w-4" />
          All warranties up to date
        </div>
      ) : (
        <div className="space-y-4">
          {alertItems.map((item) => (
            <div
              key={item.id}
              className="flex items-start justify-between border-b pb-3 last:border-0 last:pb-0"
            >
              <div className="flex-1 min-w-0">
                <Link
                  to={`/inventory/${item.id}`}
                  className="font-medium hover:text-primary hover:underline"
                >
                  {item.name}
                </Link>
                <p className="text-sm text-muted-foreground truncate">
                  {item.assetId} • {item.category}
                </p>
              </div>
              <div className="ml-4 flex flex-col items-end">
                <Badge
                  variant={item.status === 'expired' ? 'destructive' : 'warning'}
                >
                  {item.status === 'expired' ? (
                    <>
                      <AlertTriangle className="mr-1 h-3 w-3" />
                      Expired
                    </>
                  ) : (
                    `${item.daysRemaining} days left`
                  )}
                </Badge>
                <span className="mt-1 text-xs text-muted-foreground">
                  {formatDate(item.warrantyExpiry)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function WarrantyAlertsSkeleton() {
  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="h-5 w-32 animate-pulse rounded bg-muted" />
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
