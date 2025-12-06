// EmployeeEquipmentList - Shows equipment assigned to an employee
import { Link } from 'react-router-dom';
import { Package, Calendar, ArrowRight } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { formatDate } from '../../lib/utils';

interface AssignedItem {
  id: string;
  item: {
    id: string;
    assetId: string;
    name: string;
    category: string;
    status: string;
    condition: string;
  };
  assignedAt: string;
  expectedReturnAt?: string | null;
  acknowledged: boolean;
}

interface HistoricalAssignment {
  id: string;
  item: {
    id: string;
    assetId: string;
    name: string;
    category: string;
  };
  assignedAt: string;
  returnedAt: string;
  conditionAtReturn: string;
}

interface EmployeeEquipmentListProps {
  employeeId: string;
  currentAssignments: AssignedItem[];
  historicalAssignments: HistoricalAssignment[];
  isLoading?: boolean;
  showReturnButton?: boolean;
  onReturn?: (assignmentId: string) => void;
}

export function EmployeeEquipmentList({
  currentAssignments,
  historicalAssignments,
  isLoading,
  showReturnButton,
  onReturn,
}: EmployeeEquipmentListProps) {
  if (isLoading) {
    return <EmployeeEquipmentListSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Current Assignments */}
      <div>
        <h3 className="mb-4 font-semibold">
          Current Equipment ({currentAssignments.length})
        </h3>
        {currentAssignments.length === 0 ? (
          <Card className="p-6">
            <p className="text-center text-muted-foreground">
              No equipment currently assigned
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {currentAssignments.map((assignment) => (
              <Card key={assignment.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Package className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <Link
                        to={`/inventory/${assignment.item.id}`}
                        className="font-medium hover:text-primary hover:underline"
                      >
                        {assignment.item.name}
                      </Link>
                      <p className="text-sm text-muted-foreground">
                        {assignment.item.assetId} • {assignment.item.category.replace(/_/g, ' ')}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Badge variant="secondary">{assignment.item.condition}</Badge>
                        {!assignment.acknowledged && (
                          <Badge variant="warning">Not Acknowledged</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      {formatDate(assignment.assignedAt)}
                    </div>
                    {assignment.expectedReturnAt && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Due: {formatDate(assignment.expectedReturnAt)}
                      </p>
                    )}
                    {showReturnButton && onReturn && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-2"
                        onClick={() => onReturn(assignment.id)}
                      >
                        Return
                        <ArrowRight className="ml-1 h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Historical Assignments */}
      {historicalAssignments.length > 0 && (
        <div>
          <h3 className="mb-4 font-semibold">
            Assignment History ({historicalAssignments.length})
          </h3>
          <Card className="overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    Item
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    Category
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    Assigned
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    Returned
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    Condition
                  </th>
                </tr>
              </thead>
              <tbody>
                {historicalAssignments.map((assignment) => (
                  <tr key={assignment.id} className="border-b last:border-0">
                    <td className="px-4 py-3">
                      <Link
                        to={`/inventory/${assignment.item.id}`}
                        className="font-medium hover:text-primary hover:underline"
                      >
                        {assignment.item.name}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {assignment.item.assetId}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {assignment.item.category.replace(/_/g, ' ')}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {formatDate(assignment.assignedAt)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {formatDate(assignment.returnedAt)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary" className="text-xs">
                        {assignment.conditionAtReturn}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      )}
    </div>
  );
}

function EmployeeEquipmentListSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <div className="mb-4 h-5 w-40 animate-pulse rounded bg-muted" />
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <Card key={i} className="p-4">
              <div className="flex gap-4">
                <div className="h-10 w-10 animate-pulse rounded-lg bg-muted" />
                <div className="flex-1">
                  <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                  <div className="mt-2 h-3 w-48 animate-pulse rounded bg-muted" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
