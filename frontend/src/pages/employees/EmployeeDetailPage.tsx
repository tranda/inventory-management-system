// EmployeeDetailPage - User Story 6
// View employee details and their assigned equipment

import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Edit,
  Mail,
  Phone,
  Building,
  Briefcase,
  Calendar,
  Package,
  UserX,
  UserCheck,
  RotateCcw,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { useEmployee, useDeactivateEmployee, useReactivateEmployee } from '../../services/employees.service';
import { useAssignments } from '../../services/assignments.service';
import { useHasPermission } from '../../contexts/AuthContext';
import { formatDate } from '../../lib/utils';
import { ITEM_STATUSES } from '../../types/item';

export function EmployeeDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { canManageItems } = useHasPermission();

  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);

  const { data: employee, isLoading, error, refetch } = useEmployee(id || '');
  const { data: assignmentsData } = useAssignments({
    employeeId: id,
    isActive: true,
  });

  const deactivateEmployee = useDeactivateEmployee();
  const reactivateEmployee = useReactivateEmployee();

  const activeAssignments = assignmentsData?.data ?? [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Employee Not Found</h1>
        </div>
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">
              The requested employee could not be found.
            </p>
            <Button className="mt-4" onClick={() => navigate('/employees')}>
              Back to Employees
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleDeactivate = async () => {
    await deactivateEmployee.mutateAsync(employee.id);
    setShowDeactivateConfirm(false);
    refetch();
  };

  const handleReactivate = async () => {
    await reactivateEmployee.mutateAsync(employee.id);
    refetch();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary text-xl font-semibold">
              {employee.firstName.charAt(0)}
              {employee.lastName.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">
                  {employee.firstName} {employee.lastName}
                </h1>
                <Badge variant={employee.isActive ? 'success' : 'secondary'}>
                  {employee.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <p className="text-muted-foreground">{employee.employeeId}</p>
            </div>
          </div>
        </div>

        {canManageItems && (
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => navigate(`/employees/${employee.id}/edit`)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
            {employee.isActive ? (
              <Button
                variant="destructive"
                onClick={() => setShowDeactivateConfirm(true)}
                disabled={activeAssignments.length > 0}
              >
                <UserX className="mr-2 h-4 w-4" />
                Deactivate
              </Button>
            ) : (
              <Button variant="default" onClick={handleReactivate}>
                <UserCheck className="mr-2 h-4 w-4" />
                Reactivate
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Warning if cannot deactivate */}
      {employee.isActive && activeAssignments.length > 0 && canManageItems && (
        <div className="rounded-md bg-yellow-100 p-4 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
          <p className="text-sm">
            This employee has {activeAssignments.length} active equipment assignment(s)
            and cannot be deactivated until all equipment is returned.
          </p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Contact Info */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <a
                    href={`mailto:${employee.email}`}
                    className="text-primary hover:underline"
                  >
                    {employee.email}
                  </a>
                </div>
              </div>
              {employee.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <a
                      href={`tel:${employee.phone}`}
                      className="text-primary hover:underline"
                    >
                      {employee.phone}
                    </a>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Employment Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {employee.department && (
                <div className="flex items-center gap-3">
                  <Building className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Department</p>
                    <p>{employee.department}</p>
                  </div>
                </div>
              )}
              {employee.position && (
                <div className="flex items-center gap-3">
                  <Briefcase className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Position</p>
                    <p>{employee.position}</p>
                  </div>
                </div>
              )}
              {employee.hireDate && (
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Hire Date</p>
                    <p>{formatDate(employee.hireDate)}</p>
                  </div>
                </div>
              )}
              {employee.manager && (
                <div className="flex items-center gap-3">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary text-xs">
                    {employee.manager.firstName.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Manager</p>
                    <p>
                      {employee.manager.firstName} {employee.manager.lastName}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Assigned Equipment */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Assigned Equipment ({activeAssignments.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activeAssignments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="mx-auto h-12 w-12 opacity-30" />
                  <p className="mt-4">No equipment currently assigned</p>
                  {canManageItems && employee.isActive && (
                    <Button
                      className="mt-4"
                      variant="outline"
                      onClick={() => navigate('/inventory?status=AVAILABLE')}
                    >
                      Assign Equipment
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {activeAssignments.map((assignment) => {
                    const statusInfo = ITEM_STATUSES.find(
                      (s) => s.value === assignment.item?.status
                    );
                    const variantMap: Record<string, 'success' | 'info' | 'warning' | 'secondary' | 'destructive' | 'default'> = {
                      success: 'success',
                      info: 'info',
                      warning: 'warning',
                      secondary: 'secondary',
                      destructive: 'destructive',
                    };

                    return (
                      <div
                        key={assignment.id}
                        className="flex items-center justify-between rounded-lg border p-4"
                      >
                        <div className="flex items-center gap-4">
                          {assignment.item?.thumbnailUrl ? (
                            <img
                              src={assignment.item.thumbnailUrl}
                              alt={assignment.item.name}
                              className="h-12 w-12 rounded object-cover"
                            />
                          ) : (
                            <div className="flex h-12 w-12 items-center justify-center rounded bg-muted">
                              <Package className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                          <div>
                            <button
                              className="font-medium hover:text-primary hover:underline text-left"
                              onClick={() => navigate(`/inventory/${assignment.item?.id}`)}
                            >
                              {assignment.item?.name}
                            </button>
                            <p className="text-sm text-muted-foreground">
                              {assignment.item?.assetId}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Assigned {formatDate(assignment.assignedAt)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge
                            variant={assignment.acknowledged ? 'success' : 'warning'}
                          >
                            {assignment.acknowledged ? 'Acknowledged' : 'Pending'}
                          </Badge>
                          {canManageItems && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                navigate(`/assignments/${assignment.id}/return`)
                              }
                            >
                              <RotateCcw className="mr-2 h-4 w-4" />
                              Return
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Deactivate Confirmation Modal */}
      {showDeactivateConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-md rounded-lg bg-background p-6 shadow-lg">
            <h3 className="text-lg font-semibold">Deactivate Employee</h3>
            <p className="mt-2 text-muted-foreground">
              Are you sure you want to deactivate {employee.firstName} {employee.lastName}?
              They will no longer appear in active employee lists.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowDeactivateConfirm(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeactivate}
                isLoading={deactivateEmployee.isPending}
              >
                Deactivate
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
