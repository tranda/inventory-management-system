// Dashboard Page - Main overview
import { useQuery } from '@tanstack/react-query';
import {
  Package,
  Users,
  ClipboardList,
  AlertTriangle,
  TrendingUp,
  Clock,
} from 'lucide-react';
import { Header } from '../components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { api } from '../lib/api';
import { formatRelativeTime, formatCurrency } from '../lib/utils';

interface DashboardStats {
  items: {
    total: number;
    byStatus: Record<string, number>;
    byCategory: Record<string, number>;
  };
  employees: {
    total: number;
    active: number;
  };
  assignments: {
    total: number;
    active: number;
    overdue: number;
    unacknowledged: number;
  };
  alerts: {
    lowStock: Array<{
      id: string;
      assetId: string;
      name: string;
      category: string;
      minStockLevel: number;
      currentStock: number;
      deficit: number;
    }>;
    overdueCount: number;
  };
  recentActivity: Array<{
    id: string;
    entityType: string;
    entityId: string;
    action: string;
    createdAt: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
    };
  }>;
}

function StatCard({
  title,
  value,
  icon: Icon,
  subtitle,
  trend,
}: {
  title: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && (
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            {trend === 'up' && <TrendingUp className="h-3 w-3 text-green-500" />}
            {subtitle}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export function DashboardPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: async () => {
      const response = await api.get<DashboardStats>('/dashboard/stats');
      return response.data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Header title="Dashboard" />
        <div className="mt-6 rounded-md bg-destructive/10 p-4 text-destructive">
          Failed to load dashboard data
        </div>
      </div>
    );
  }

  const stats = data!;

  return (
    <div>
      <Header title="Dashboard" subtitle="Overview of your IT inventory" />

      <div className="p-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Items"
            value={stats.items.total}
            icon={Package}
            subtitle={`${stats.items.byStatus.AVAILABLE || 0} available`}
          />
          <StatCard
            title="Active Employees"
            value={stats.employees.active}
            icon={Users}
            subtitle={`of ${stats.employees.total} total`}
          />
          <StatCard
            title="Active Assignments"
            value={stats.assignments.active}
            icon={ClipboardList}
            subtitle={`${stats.assignments.unacknowledged} unacknowledged`}
          />
          <StatCard
            title="Overdue Items"
            value={stats.assignments.overdue}
            icon={AlertTriangle}
            subtitle={stats.assignments.overdue > 0 ? 'Needs attention' : 'All on time'}
          />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Alerts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats.alerts.lowStock.length === 0 && stats.alerts.overdueCount === 0 ? (
                <p className="text-sm text-muted-foreground">No alerts at this time</p>
              ) : (
                <div className="space-y-3">
                  {stats.alerts.overdueCount > 0 && (
                    <div className="flex items-center justify-between rounded-md bg-orange-50 p-3 dark:bg-orange-950">
                      <div>
                        <p className="font-medium text-orange-800 dark:text-orange-200">
                          Overdue Assignments
                        </p>
                        <p className="text-sm text-orange-600 dark:text-orange-400">
                          {stats.alerts.overdueCount} item(s) past expected return date
                        </p>
                      </div>
                      <Badge variant="warning">{stats.alerts.overdueCount}</Badge>
                    </div>
                  )}
                  {stats.alerts.lowStock.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-md bg-red-50 p-3 dark:bg-red-950"
                    >
                      <div>
                        <p className="font-medium text-red-800 dark:text-red-200">
                          Low Stock: {item.name}
                        </p>
                        <p className="text-sm text-red-600 dark:text-red-400">
                          {item.currentStock} available, {item.deficit} below minimum
                        </p>
                      </div>
                      <Badge variant="destructive">{item.currentStock}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats.recentActivity.length === 0 ? (
                <p className="text-sm text-muted-foreground">No recent activity</p>
              ) : (
                <div className="space-y-3">
                  {stats.recentActivity.slice(0, 5).map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-center justify-between text-sm"
                    >
                      <div>
                        <span className="font-medium">
                          {activity.user.firstName} {activity.user.lastName}
                        </span>
                        <span className="text-muted-foreground">
                          {' '}
                          {activity.action.toLowerCase()} {activity.entityType.toLowerCase()}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatRelativeTime(activity.createdAt)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Items by Status */}
        <Card>
          <CardHeader>
            <CardTitle>Items by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {Object.entries(stats.items.byStatus).map(([status, count]) => (
                <div
                  key={status}
                  className="flex items-center gap-2 rounded-md border px-3 py-2"
                >
                  <Badge
                    variant={
                      status === 'AVAILABLE'
                        ? 'success'
                        : status === 'ASSIGNED'
                          ? 'info'
                          : status === 'IN_REPAIR'
                            ? 'warning'
                            : 'secondary'
                    }
                  >
                    {count}
                  </Badge>
                  <span className="text-sm">{status.replace('_', ' ')}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
