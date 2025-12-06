// AssignItemPage - User Story 2
// Page for assigning equipment to employees

import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { AssignmentForm } from '../../components/forms/AssignmentForm';
import { useItem } from '../../services/items.service';
import { useCreateAssignment } from '../../services/assignments.service';

export function AssignItemPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const itemId = searchParams.get('itemId');

  const { data: item, isLoading: isLoadingItem, error: itemError } = useItem(itemId || '');
  const createAssignment = useCreateAssignment();

  const handleSubmit = async (data: {
    itemId: string;
    employeeId: string;
    notes?: string;
    expectedReturnDate?: string;
    acknowledged?: boolean;
  }) => {
    await createAssignment.mutateAsync(data);
    navigate('/inventory');
  };

  const handleCancel = () => {
    navigate(-1);
  };

  // No item ID provided
  if (!itemId) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Assign Equipment</h1>
          </div>
        </div>

        <Card>
          <CardContent className="py-8">
            <div className="flex flex-col items-center gap-4 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground" />
              <div>
                <h3 className="font-semibold">No Item Selected</h3>
                <p className="text-sm text-muted-foreground">
                  Please select an item from the inventory to assign.
                </p>
              </div>
              <Button onClick={() => navigate('/inventory')}>Go to Inventory</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Loading
  if (isLoadingItem) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // Item not found or error
  if (itemError || !item) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Assign Equipment</h1>
          </div>
        </div>

        <Card>
          <CardContent className="py-8">
            <div className="flex flex-col items-center gap-4 text-center">
              <AlertCircle className="h-12 w-12 text-destructive" />
              <div>
                <h3 className="font-semibold">Item Not Found</h3>
                <p className="text-sm text-muted-foreground">
                  The requested item could not be found.
                </p>
              </div>
              <Button onClick={() => navigate('/inventory')}>Go to Inventory</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Item not available
  if (item.status !== 'AVAILABLE') {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Assign Equipment</h1>
          </div>
        </div>

        <Card>
          <CardContent className="py-8">
            <div className="flex flex-col items-center gap-4 text-center">
              <AlertCircle className="h-12 w-12 text-warning" />
              <div>
                <h3 className="font-semibold">Item Not Available</h3>
                <p className="text-sm text-muted-foreground">
                  This item cannot be assigned because its current status is "{item.status}".
                </p>
              </div>
              <Button onClick={() => navigate(`/inventory/${item.id}`)}>View Item</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleCancel}
          className="shrink-0"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Assign Equipment</h1>
          <p className="text-muted-foreground">
            Assign this equipment to an employee
          </p>
        </div>
      </div>

      {createAssignment.isError && (
        <div className="rounded-md bg-destructive/10 p-4 text-destructive">
          <p className="font-medium">Failed to create assignment</p>
          <p className="text-sm">
            {createAssignment.error instanceof Error
              ? createAssignment.error.message
              : 'An unexpected error occurred'}
          </p>
        </div>
      )}

      <AssignmentForm
        item={item}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={createAssignment.isPending}
      />
    </div>
  );
}
