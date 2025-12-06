// TransferPage - User Story 8
// Page for transferring equipment between employees

import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { TransferForm } from '../../components/forms/TransferForm';
import { useAssignment, useTransferAssignment } from '../../services/assignments.service';
import { useToast } from '../../components/ui/Toast';

export function TransferPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();

  const { data: assignment, isLoading: isLoadingAssignment, error: assignmentError } = useAssignment(id || '');
  const transferAssignment = useTransferAssignment();

  const handleSubmit = async (data: {
    toEmployeeId: string;
    reason?: string;
    notes?: string;
  }) => {
    if (!id) return;

    await transferAssignment.mutateAsync({
      id,
      data: {
        newEmployeeId: data.toEmployeeId,
        transferNotes: [data.reason, data.notes].filter(Boolean).join(' - ') || undefined,
      },
    });

    toast({
      title: 'Transfer Complete',
      description: 'Equipment has been successfully transferred to the new employee.',
    });

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
            <h1 className="text-2xl font-bold">Transfer Equipment</h1>
          </div>
        </div>

        <Card>
          <CardContent className="py-8">
            <div className="flex flex-col items-center gap-4 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground" />
              <div>
                <h3 className="font-semibold">No Assignment Selected</h3>
                <p className="text-sm text-muted-foreground">
                  Please select an active assignment from the list to transfer equipment.
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
            <h1 className="text-2xl font-bold">Transfer Equipment</h1>
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

  // Already returned - cannot transfer
  if (assignment.returnedAt) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Transfer Equipment</h1>
          </div>
        </div>

        <Card>
          <CardContent className="py-8">
            <div className="flex flex-col items-center gap-4 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground" />
              <div>
                <h3 className="font-semibold">Cannot Transfer Returned Equipment</h3>
                <p className="text-sm text-muted-foreground">
                  This equipment was returned on {new Date(assignment.returnedAt).toLocaleDateString()}.
                  Only active assignments can be transferred.
                </p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => navigate(`/assignments/${id}`)}>
                  View Assignment
                </Button>
                <Button onClick={() => navigate('/assignments')}>Go to Assignments</Button>
              </div>
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
          <h1 className="text-2xl font-bold">Transfer Equipment</h1>
          <p className="text-muted-foreground">
            Transfer this equipment to a different employee without returning it first
          </p>
        </div>
      </div>

      {transferAssignment.isError && (
        <div className="rounded-md bg-destructive/10 p-4 text-destructive">
          <p className="font-medium">Failed to transfer equipment</p>
          <p className="text-sm">
            {transferAssignment.error instanceof Error
              ? transferAssignment.error.message
              : 'An unexpected error occurred'}
          </p>
        </div>
      )}

      <TransferForm
        assignment={assignment}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={transferAssignment.isPending}
      />
    </div>
  );
}
