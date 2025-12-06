// Confirm Dialog - Reusable confirmation modal
import { AlertTriangle, Info, HelpCircle } from 'lucide-react';
import { Button } from './Button';

// =============================================================================
// Types
// =============================================================================

type DialogVariant = 'danger' | 'warning' | 'info';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: DialogVariant;
  isLoading?: boolean;
}

// =============================================================================
// Component
// =============================================================================

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  isLoading = false,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const icons: Record<DialogVariant, React.ReactNode> = {
    danger: (
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
        <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
      </div>
    ),
    warning: (
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/20">
        <AlertTriangle className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
      </div>
    ),
    info: (
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/20">
        <Info className="h-6 w-6 text-blue-600 dark:text-blue-400" />
      </div>
    ),
  };

  const buttonVariants: Record<DialogVariant, 'destructive' | 'default'> = {
    danger: 'destructive',
    warning: 'default',
    info: 'default',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative mx-4 w-full max-w-md rounded-lg bg-background p-6 shadow-lg animate-in zoom-in-95 duration-200">
        <div className="flex gap-4">
          {icons[variant]}
          <div className="flex-1">
            <h3 className="text-lg font-semibold">{title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{description}</p>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            {cancelText}
          </Button>
          <Button
            variant={buttonVariants[variant]}
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Hook for easier usage
// =============================================================================

import { useState, useCallback } from 'react';

interface UseConfirmDialogOptions {
  onConfirm: () => void | Promise<void>;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: DialogVariant;
}

export function useConfirmDialog(options: UseConfirmDialogOptions) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  const handleConfirm = useCallback(async () => {
    setIsLoading(true);
    try {
      await options.onConfirm();
      setIsOpen(false);
    } finally {
      setIsLoading(false);
    }
  }, [options.onConfirm]);

  const dialogProps = {
    isOpen,
    onClose: close,
    onConfirm: handleConfirm,
    title: options.title,
    description: options.description,
    confirmText: options.confirmText,
    cancelText: options.cancelText,
    variant: options.variant,
    isLoading,
  };

  return {
    isOpen,
    open,
    close,
    dialogProps,
    ConfirmDialog: () => <ConfirmDialog {...dialogProps} />,
  };
}
