// AddItemPage - User Story 1
// Page for adding new equipment to inventory

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { ItemForm } from '../../components/forms/ItemForm';
import { PhotoUpload } from '../../components/forms/PhotoUpload';
import { useCreateItem, useUploadItemPhoto } from '../../services/items.service';
import type { ItemCreateInput } from '../../types/item';

export function AddItemPage() {
  const navigate = useNavigate();
  const [createdItemId, setCreatedItemId] = useState<string | null>(null);
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);

  const createItem = useCreateItem();
  const uploadPhoto = useUploadItemPhoto();

  const handleSubmit = async (data: ItemCreateInput) => {
    const item = await createItem.mutateAsync(data);
    setCreatedItemId(item.id);
    setShowPhotoUpload(true);
  };

  const handlePhotoUpload = async (file: File) => {
    if (!createdItemId) return;
    await uploadPhoto.mutateAsync({ id: createdItemId, file });
  };

  const handleCancel = () => {
    navigate('/inventory');
  };

  const handleComplete = () => {
    navigate('/inventory');
  };

  const handleSkipPhoto = () => {
    navigate('/inventory');
  };

  if (showPhotoUpload && createdItemId) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Add Photo</h1>
          <p className="text-muted-foreground">
            Optionally add a photo of the equipment
          </p>
        </div>

        <div className="max-w-md">
          <PhotoUpload
            onUpload={handlePhotoUpload}
            isLoading={uploadPhoto.isPending}
          />

          {uploadPhoto.isError && (
            <p className="mt-2 text-sm text-destructive">
              Failed to upload photo. Please try again.
            </p>
          )}

          <div className="mt-6 flex gap-4">
            <Button onClick={handleComplete}>
              {uploadPhoto.isSuccess ? 'Done' : 'Skip Photo'}
            </Button>
            {!uploadPhoto.isSuccess && (
              <Button variant="ghost" onClick={handleSkipPhoto}>
                Skip for now
              </Button>
            )}
          </div>
        </div>
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
          <h1 className="text-2xl font-bold">Add New Equipment</h1>
          <p className="text-muted-foreground">
            Enter the details of the new inventory item
          </p>
        </div>
      </div>

      {createItem.isError && (
        <div className="rounded-md bg-destructive/10 p-4 text-destructive">
          <p className="font-medium">Failed to create item</p>
          <p className="text-sm">
            {createItem.error instanceof Error
              ? createItem.error.message
              : 'An unexpected error occurred'}
          </p>
        </div>
      )}

      <ItemForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={createItem.isPending}
      />
    </div>
  );
}
