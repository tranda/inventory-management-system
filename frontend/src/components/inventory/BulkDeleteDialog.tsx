// BulkDeleteDialog - Confirmation dialog for bulk item deletion
import { useState } from 'react';
import { AlertTriangle, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Button } from '../ui/Button';

interface BulkDeleteDialogProps {
  isOpen: boolean;
  itemCount: number;
  onClose: () => void;
  onConfirm: () => Promise<{
    deleted: string[];
    skipped: { id: string; reason: string }[];
  }>;
}

type DialogState = 'confirm' | 'loading' | 'results';

export function BulkDeleteDialog({
  isOpen,
  itemCount,
  onClose,
  onConfirm,
}: BulkDeleteDialogProps) {
  const [state, setState] = useState<DialogState>('confirm');
  const [results, setResults] = useState<{
    deleted: string[];
    skipped: { id: string; reason: string }[];
  } | null>(null);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setState('loading');
    try {
      const result = await onConfirm();
      setResults(result);
      setState('results');
    } catch {
      setState('confirm');
    }
  };

  const handleClose = () => {
    setState('confirm');
    setResults(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 animate-in fade-in duration-200"
        onClick={state !== 'loading' ? handleClose : undefined}
      />

      {/* Dialog */}
      <div className="relative mx-4 w-full max-w-md rounded-lg bg-background p-6 shadow-lg animate-in zoom-in-95 duration-200">
        {state === 'confirm' && (
          <>
            <div className="flex gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold">Delete {itemCount} Items</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Are you sure you want to delete {itemCount} selected{' '}
                  {itemCount === 1 ? 'item' : 'items'}? This action cannot be undone.
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  <strong>Note:</strong> Items that are currently assigned will be skipped.
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleConfirm}>
                Delete Items
              </Button>
            </div>
          </>
        )}

        {state === 'loading' && (
          <div className="flex flex-col items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="mt-4 text-sm text-muted-foreground">Deleting items...</p>
          </div>
        )}

        {state === 'results' && results && (
          <>
            <h3 className="text-lg font-semibold">Deletion Complete</h3>

            <div className="mt-4 space-y-4">
              {/* Deleted Items */}
              {results.deleted.length > 0 && (
                <div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-900/20">
                  <CheckCircle className="mt-0.5 h-5 w-5 text-green-600 dark:text-green-400" />
                  <div>
                    <p className="font-medium text-green-800 dark:text-green-300">
                      {results.deleted.length} {results.deleted.length === 1 ? 'item' : 'items'}{' '}
                      deleted
                    </p>
                  </div>
                </div>
              )}

              {/* Skipped Items */}
              {results.skipped.length > 0 && (
                <div className="flex items-start gap-3 rounded-lg border border-yellow-200 bg-yellow-50 p-3 dark:border-yellow-800 dark:bg-yellow-900/20">
                  <XCircle className="mt-0.5 h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                  <div>
                    <p className="font-medium text-yellow-800 dark:text-yellow-300">
                      {results.skipped.length} {results.skipped.length === 1 ? 'item' : 'items'}{' '}
                      skipped
                    </p>
                    <ul className="mt-2 space-y-1 text-sm text-yellow-700 dark:text-yellow-400">
                      {results.skipped.slice(0, 5).map((item) => (
                        <li key={item.id}>
                          {item.id.slice(0, 8)}... - {item.reason}
                        </li>
                      ))}
                      {results.skipped.length > 5 && (
                        <li>...and {results.skipped.length - 5} more</li>
                      )}
                    </ul>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <Button onClick={handleClose}>Close</Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
