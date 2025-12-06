// ItemTimeline Component - User Story 5
// Displays the history and timeline of an item

import { ArrowRight, Package, User, Wrench, XCircle, CheckCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { formatDate } from '../../lib/utils';

// =============================================================================
// Types
// =============================================================================

interface TimelineEvent {
  id: string;
  type: 'created' | 'assigned' | 'returned' | 'status_change' | 'updated' | 'decommissioned';
  date: string;
  description: string;
  user?: {
    firstName: string;
    lastName: string;
  };
  details?: Record<string, unknown>;
}

interface ItemTimelineProps {
  events: TimelineEvent[];
  isLoading?: boolean;
  className?: string;
}

// =============================================================================
// Component
// =============================================================================

export function ItemTimeline({ events, isLoading, className }: ItemTimelineProps) {
  const getEventIcon = (type: TimelineEvent['type']) => {
    switch (type) {
      case 'created':
        return <Package className="h-4 w-4" />;
      case 'assigned':
        return <User className="h-4 w-4" />;
      case 'returned':
        return <CheckCircle className="h-4 w-4" />;
      case 'status_change':
        return <ArrowRight className="h-4 w-4" />;
      case 'updated':
        return <Wrench className="h-4 w-4" />;
      case 'decommissioned':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const getEventColor = (type: TimelineEvent['type']) => {
    switch (type) {
      case 'created':
        return 'bg-green-500';
      case 'assigned':
        return 'bg-blue-500';
      case 'returned':
        return 'bg-green-500';
      case 'status_change':
        return 'bg-yellow-500';
      case 'updated':
        return 'bg-gray-500';
      case 'decommissioned':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (isLoading) {
    return (
      <div className={cn('space-y-4', className)}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-4 animate-pulse">
            <div className="h-8 w-8 rounded-full bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted rounded w-1/3" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className={cn('text-center py-8 text-muted-foreground', className)}>
        No history available
      </div>
    );
  }

  return (
    <div className={cn('relative', className)}>
      {/* Timeline Line */}
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />

      {/* Events */}
      <div className="space-y-6">
        {events.map((event, index) => (
          <div key={event.id} className="relative flex gap-4 pl-10">
            {/* Event Dot */}
            <div
              className={cn(
                'absolute left-0 flex h-8 w-8 items-center justify-center rounded-full text-white',
                getEventColor(event.type)
              )}
            >
              {getEventIcon(event.type)}
            </div>

            {/* Event Content */}
            <div className="flex-1 pb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                <p className="font-medium">{event.description}</p>
                <time className="text-sm text-muted-foreground">
                  {formatDate(event.date)}
                </time>
              </div>
              {event.user && (
                <p className="text-sm text-muted-foreground">
                  by {event.user.firstName} {event.user.lastName}
                </p>
              )}
              {event.details && Object.keys(event.details).length > 0 && (
                <div className="mt-2 rounded-md bg-muted/50 p-3 text-sm">
                  {Object.entries(event.details).map(([key, value]) => (
                    <div key={key} className="flex gap-2">
                      <span className="text-muted-foreground capitalize">
                        {key.replace(/_/g, ' ')}:
                      </span>
                      <span>{String(value)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// Helper to convert audit logs to timeline events
// =============================================================================

export function convertAuditToTimeline(auditLogs: Array<{
  id: string;
  action: string;
  createdAt: string;
  user?: { firstName: string; lastName: string };
  changes?: Record<string, unknown>;
}>): TimelineEvent[] {
  return auditLogs.map((log) => {
    let type: TimelineEvent['type'] = 'updated';
    let description = 'Item updated';

    if (log.action === 'CREATE') {
      type = 'created';
      description = 'Item added to inventory';
    } else if (log.action === 'UPDATE') {
      if (log.changes?.status === 'ASSIGNED') {
        type = 'assigned';
        description = 'Item assigned';
      } else if (log.changes?.status === 'AVAILABLE') {
        type = 'returned';
        description = 'Item returned';
      } else if (log.changes?.status === 'DECOMMISSIONED') {
        type = 'decommissioned';
        description = 'Item decommissioned';
      } else if (log.changes?.status) {
        type = 'status_change';
        description = `Status changed to ${log.changes.status}`;
      }
    }

    return {
      id: log.id,
      type,
      date: log.createdAt,
      description,
      user: log.user,
      details: log.changes,
    };
  });
}
