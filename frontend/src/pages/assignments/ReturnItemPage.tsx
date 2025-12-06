// ReturnItemPage - User Story 3
// Page for processing equipment returns

import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { ReturnForm } from '../../components/forms/ReturnForm';
import { useAssignment, useReturnAssignment } from '../../services/assignments.service';

export function ReturnItemPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const { data: assignment, isLoading: isLoadingAssignment, error: assignmentError } = useAssignment(id || '');
  const returnAssignment = useReturnAssignment();

  const handleSubmit = async (data: {
    condition: 'NEW' | 'GOOD' | 'FAIR' | 'NEEDS_REPAIR' | 'DECOMMISSIONED';
    returnNotes?: string;
  }) => {
    if (!id) return;
    await returnAssignment.mutateAsync({ id, data });
    navigate('/assignments');
  };

  const handleCancel = () => {
    navigate(-1);
  };

  // No assignment ID provided
  if (!id) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Return Equipment</h1>
          </div>
        </div>

        <Card>
          <CardContent className="py-8">
            <div className="flex flex-col items-center gap-4 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground" />
              <div>
                <h3 className="font-semibold">No Assignment Selected</h3>
                <p className="text-sm text-muted-foreground">
                  Please select an assignment from the list to process a return.
                </p>
              </div>
              <Button onClick={() => navigate('/assignments')}>Go to Assignments</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Loading
  if (isLoadingAssignment) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // Assignment not found or error
  if (assignmentError || !assignment) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Return Equipment</h1>
          </div>
        </div>

        <Card>
          <CardContent className="py-8">
            <div className="flex flex-col items-center gap-4 text-center">
              <AlertCircle className="h-12 w-12 text-destructive" />
              <div>
                <h3 className="font-semibold">Assignment Not Found</h3>
                <p className="text-sm text-muted-foreground">
                  The requested assignment could not be found.
                </p>
              </div>
              <Button onClick={() => navigate('/assignments')}>Go to Assignments</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Already returned
  if (assignment.returnedAt) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Return Equipment</h1>
          </div>
        </div>

        <Card>
          <CardContent className="py-8">
            <div className="flex flex-col items-center gap-4 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground" />
              <div>
                <h3 className="font-semibold">Equipment Already Returned</h3>
                <p className="text-sm text-muted-foreground">
                  This equipment was returned on {new Date(assignment.returnedAt).toLocaleDateString()}.
                </p>
              </div>
              <Button onClick={() => navigate(`/assignments/${id}`)}>View Assignment</Button>
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
          <h1 className="text-2xl font-bold">Return Equipment</h1>
          <p className="text-muted-foreground">
            Process the return and assess the equipment condition
          </p>
        </div>
      </div>

      {returnAssignment.isError && (
        <div className="rounded-md bg-destructive/10 p-4 text-destructive">
          <p className="font-medium">Failed to process return</p>
          <p className="text-sm">
            {returnAssignment.error instanceof Error
              ? returnAssignment.error.message
              : 'An unexpected error occurred'}
          </p>
        </div>
      )}

      <ReturnForm
        assignment={assignment}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={returnAssignment.isPending}
      />
    </div>
  );
}
