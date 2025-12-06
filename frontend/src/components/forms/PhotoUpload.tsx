// PhotoUpload Component - User Story 1
// Component for uploading item photos with preview

import { useState, useRef, type ChangeEvent } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';

interface PhotoUploadProps {
  currentPhotoUrl?: string | null;
  thumbnailUrl?: string | null;
  onUpload: (file: File) => Promise<void>;
  onRemove?: () => Promise<void>;
  isLoading?: boolean;
  className?: string;
}

export function PhotoUpload({
  currentPhotoUrl,
  thumbnailUrl,
  onUpload,
  onRemove,
  isLoading,
  className,
}: PhotoUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const displayUrl = previewUrl || thumbnailUrl || currentPhotoUrl;

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Please upload a JPEG, PNG, or WebP image');
      return;
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setError('File size must be less than 10MB');
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload
    try {
      await onUpload(file);
    } catch {
      setError('Failed to upload photo');
      setPreviewUrl(null);
    }
  };

  const handleRemove = async () => {
    if (!onRemove) return;

    try {
      await onRemove();
      setPreviewUrl(null);
    } catch {
      setError('Failed to remove photo');
    }
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  return (
    <div className={cn('space-y-2', className)}>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        className="hidden"
      />

      {displayUrl ? (
        <div className="relative inline-block">
          <img
            src={displayUrl}
            alt="Item photo"
            className="h-40 w-40 rounded-lg object-cover border"
          />
          <div className="absolute -right-2 -top-2 flex gap-1">
            <Button
              type="button"
              size="icon"
              variant="secondary"
              className="h-8 w-8"
              onClick={handleClick}
              disabled={isLoading}
            >
              <Upload className="h-4 w-4" />
            </Button>
            {onRemove && (
              <Button
                type="button"
                size="icon"
                variant="destructive"
                className="h-8 w-8"
                onClick={handleRemove}
                disabled={isLoading}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleClick}
          disabled={isLoading}
          className={cn(
            'flex h-40 w-40 flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/50 transition-colors hover:border-muted-foreground/50 hover:bg-muted',
            isLoading && 'cursor-not-allowed opacity-50'
          )}
        >
          {isLoading ? (
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          ) : (
            <>
              <ImageIcon className="h-10 w-10 text-muted-foreground/50" />
              <span className="mt-2 text-sm text-muted-foreground">Upload Photo</span>
            </>
          )}
        </button>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <p className="text-xs text-muted-foreground">
        JPEG, PNG, or WebP. Max 10MB.
      </p>
    </div>
  );
}
