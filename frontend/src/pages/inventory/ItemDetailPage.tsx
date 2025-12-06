// ItemDetailPage - User Story 5
// View item details, history, and perform actions

import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Edit,
  Trash2,
  UserPlus,
  RotateCcw,
  AlertTriangle,
  Package,
  Calendar,
  DollarSign,
  MapPin,
  Tag,
  Shield,
  RefreshCw,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { ItemTimeline, convertAuditToTimeline } from '../../components/inventory/ItemTimeline';
import { PhotoUpload } from '../../components/forms/PhotoUpload';
import { StatusChangeForm } from '../../components/forms/StatusChangeForm';
import { useItem, useDeleteItem, useUploadItemPhoto, useDecommissionItem, useChangeItemStatus } from '../../services/items.service';
import { useHasPermission } from '../../contexts/AuthContext';
import { ITEM_STATUSES, ITEM_CONDITIONS } from '../../types/item';
import { formatDate, formatCurrency } from '../../lib/utils';

// =============================================================================
// Component
// =============================================================================

export function ItemDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { canManageItems } = useHasPermission();

  const [activeTab, setActiveTab] = useState<'details' | 'history' | 'assignments'>('details');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDecommissionConfirm, setShowDecommissionConfirm] = useState(false);
  const [showStatusChange, setShowStatusChange] = useState(false);
  const [decommissionReason, setDecommissionReason] = useState('');

  const { data: item, isLoading, error, refetch } = useItem(id || '');
  const deleteItem = useDeleteItem();
  const uploadPhoto = useUploadItemPhoto();
  const decommissionItem = useDecommissionItem();
  const changeStatus = useChangeItemStatus();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Item Not Found</h1>
        </div>
        <Card>
          <CardContent className="py-8 text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">
              The requested item could not be found.
            </p>
            <Button className="mt-4" onClick={() => navigate('/inventory')}>
              Back to Inventory
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusInfo = ITEM_STATUSES.find((s) => s.value === item.status);
  const conditionInfo = ITEM_CONDITIONS.find((c) => c.value === item.condition);
  const activeAssignment = item.assignments?.find((a) => !a.returnedAt);

  const handleDelete = async () => {
    await deleteItem.mutateAsync(item.id);
    navigate('/inventory');
  };

  const handleDecommission = async () => {
    if (!decommissionReason.trim()) return;
    await decommissionItem.mutateAsync({ id: item.id, reason: decommissionReason });
    setShowDecommissionConfirm(false);
    refetch();
  };

  const handlePhotoUpload = async (file: File) => {
    await uploadPhoto.mutateAsync({ id: item.id, file });
    refetch();
  };

  const handleStatusChange = async (status: string, reason: string) => {
    await changeStatus.mutateAsync({ id: item.id, status, reason });
    setShowStatusChange(false);
    refetch();
  };

  const variantMap: Record<string, 'success' | 'info' | 'warning' | 'secondary' | 'destructive' | 'default'> = {
    success: 'success',
    info: 'info',
    warning: 'warning',
    secondary: 'secondary',
    destructive: 'destructive',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{item.name}</h1>
              <Badge variant={variantMap[statusInfo?.color || 'default'] || 'default'}>
                {statusInfo?.label || item.status}
              </Badge>
            </div>
            <p className="text-muted-foreground">{item.assetId}</p>
          </div>
        </div>

        {canManageItems && (
          <div className="flex flex-wrap gap-2">
            {item.status === 'AVAILABLE' && (
              <Button onClick={() => navigate(`/assignments/new?itemId=${item.id}`)}>
                <UserPlus className="mr-2 h-4 w-4" />
                Assign
              </Button>
            )}
            <Button variant="outline" onClick={() => navigate(`/inventory/${item.id}/edit`)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
            {item.status !== 'DECOMMISSIONED' && (
              <Button variant="outline" onClick={() => setShowStatusChange(true)}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Change Status
              </Button>
            )}
            {item.status !== 'DECOMMISSIONED' && item.status !== 'ASSIGNED' && (
              <Button
                variant="outline"
                onClick={() => setShowDecommissionConfirm(true)}
              >
                <AlertTriangle className="mr-2 h-4 w-4" />
                Decommission
              </Button>
            )}
            {item.status === 'AVAILABLE' && (
              <Button
                variant="destructive"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Photo and Quick Info */}
        <div className="space-y-6">
          <Card>
            <CardContent className="p-4">
              {canManageItems ? (
                <PhotoUpload
                  currentPhotoUrl={item.photoUrl}
                  thumbnailUrl={item.thumbnailUrl}
                  onUpload={handlePhotoUpload}
                  isLoading={uploadPhoto.isPending}
                />
              ) : item.photoUrl ? (
                <img
                  src={item.photoUrl}
                  alt={item.name}
                  className="w-full rounded-lg object-cover"
                />
              ) : (
                <div className="flex aspect-square items-center justify-center rounded-lg bg-muted">
                  <Package className="h-16 w-16 text-muted-foreground/30" />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Tag className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Condition:</span>
                <span>{conditionInfo?.label || item.condition}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Package className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Category:</span>
                <span>{item.category}</span>
              </div>
              {item.location && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Location:</span>
                  <span>{item.location}</span>
                </div>
              )}
              {item.purchasePrice && (
                <div className="flex items-center gap-2 text-sm">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Value:</span>
                  <span>{formatCurrency(item.purchasePrice)}</span>
                </div>
              )}
              {item.warrantyExpiration && (
                <div className="flex items-center gap-2 text-sm">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Warranty:</span>
                  <span>{formatDate(item.warrantyExpiration)}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Current Assignment */}
          {activeAssignment && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Currently Assigned To</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    {activeAssignment.employee.firstName.charAt(0)}
                    {activeAssignment.employee.lastName.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium">
                      {activeAssignment.employee.firstName} {activeAssignment.employee.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {activeAssignment.employee.email}
                    </p>
                  </div>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">
                  Assigned on {formatDate(activeAssignment.assignedAt || '')}
                </p>
                {canManageItems && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 w-full"
                    onClick={() => navigate(`/assignments/${activeAssignment.id}/return`)}
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Process Return
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Details Tabs */}
        <div className="lg:col-span-2">
          {/* Tab Navigation */}
          <div className="flex border-b mb-6">
            <button
              onClick={() => setActiveTab('details')}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
                activeTab === 'details'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Details
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
                activeTab === 'history'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              History
            </button>
            <button
              onClick={() => setActiveTab('assignments')}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
                activeTab === 'assignments'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Assignments
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'details' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Asset ID</p>
                    <p className="font-medium">{item.assetId}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Serial Number</p>
                    <p className="font-medium">{item.serialNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Brand</p>
                    <p className="font-medium">{item.brand || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Model</p>
                    <p className="font-medium">{item.model || '-'}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Purchase Information</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Purchase Date</p>
                    <p className="font-medium">
                      {item.purchaseDate ? formatDate(item.purchaseDate) : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Purchase Price</p>
                    <p className="font-medium">
                      {item.purchasePrice ? formatCurrency(item.purchasePrice) : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Warranty Expiration</p>
                    <p className="font-medium">
                      {item.warrantyExpiration ? formatDate(item.warrantyExpiration) : '-'}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {item.notes && (
                <Card>
                  <CardHeader>
                    <CardTitle>Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-wrap">{item.notes}</p>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>Record Information</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Created</p>
                    <p className="font-medium">{formatDate(item.createdAt)}</p>
                    {item.createdBy && (
                      <p className="text-sm text-muted-foreground">
                        by {item.createdBy.firstName} {item.createdBy.lastName}
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Last Updated</p>
                    <p className="font-medium">{formatDate(item.updatedAt)}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'history' && (
            <Card>
              <CardHeader>
                <CardTitle>Item History</CardTitle>
              </CardHeader>
              <CardContent>
                <ItemTimeline
                  events={[
                    {
                      id: 'created',
                      type: 'created',
                      date: item.createdAt,
                      description: 'Item added to inventory',
                      user: item.createdBy,
                    },
                    // TODO: Add actual audit log events
                  ]}
                />
              </CardContent>
            </Card>
          )}

          {activeTab === 'assignments' && (
            <Card>
              <CardHeader>
                <CardTitle>Assignment History</CardTitle>
              </CardHeader>
              <CardContent>
                {item.assignments && item.assignments.length > 0 ? (
                  <div className="space-y-4">
                    {item.assignments.map((assignment) => (
                      <div
                        key={assignment.id}
                        className="flex items-center justify-between rounded-lg border p-4"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                            {assignment.employee.firstName.charAt(0)}
                            {assignment.employee.lastName.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium">
                              {assignment.employee.firstName} {assignment.employee.lastName}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {assignment.employee.email}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant={assignment.returnedAt ? 'secondary' : 'success'}>
                            {assignment.returnedAt ? 'Returned' : 'Active'}
                          </Badge>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {formatDate(assignment.assignedAt || '')}
                            {assignment.returnedAt && ` - ${formatDate(assignment.returnedAt)}`}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center py-8 text-muted-foreground">
                    This item has never been assigned.
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-md rounded-lg bg-background p-6 shadow-lg">
            <h3 className="text-lg font-semibold">Delete Item</h3>
            <p className="mt-2 text-muted-foreground">
              Are you sure you want to delete "{item.name}"? This action cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                isLoading={deleteItem.isPending}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Decommission Confirmation Modal */}
      {showDecommissionConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-md rounded-lg bg-background p-6 shadow-lg">
            <h3 className="text-lg font-semibold">Decommission Item</h3>
            <p className="mt-2 text-muted-foreground">
              This will permanently remove the item from active inventory.
            </p>
            <div className="mt-4">
              <label className="text-sm font-medium">Reason for decommissioning</label>
              <textarea
                value={decommissionReason}
                onChange={(e) => setDecommissionReason(e.target.value)}
                placeholder="Enter reason..."
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                rows={3}
              />
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDecommissionConfirm(false);
                  setDecommissionReason('');
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDecommission}
                isLoading={decommissionItem.isPending}
                disabled={!decommissionReason.trim()}
              >
                Decommission
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Status Change Modal */}
      {showStatusChange && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-md rounded-lg bg-background p-6 shadow-lg">
            <h3 className="text-lg font-semibold mb-4">Change Item Status</h3>
            <StatusChangeForm
              currentStatus={item.status}
              onSubmit={handleStatusChange}
              onCancel={() => setShowStatusChange(false)}
              isLoading={changeStatus.isPending}
            />
          </div>
        </div>
      )}
    </div>
  );
}
