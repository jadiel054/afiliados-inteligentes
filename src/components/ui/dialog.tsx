import * as React from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

// Dialog Component
export interface DialogProps extends React.HTMLAttributes<HTMLDivElement> {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const Dialog = React.forwardRef<HTMLDivElement, DialogProps>(
  ({ open = false, onOpenChange, className, children, ...props }, ref) => {
    const [isOpen, setIsOpen] = React.useState(open);

    React.useEffect(() => {
      setIsOpen(open);
    }, [open]);

    const handleOpenChange = (newOpen: boolean) => {
      setIsOpen(newOpen);
      onOpenChange?.(newOpen);
    };

    // Fechar ao pressionar Escape
    React.useEffect(() => {
      const handleEscape = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          handleOpenChange(false);
        }
      };

      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }, []);

    // Fechar ao clicar fora
    const handleBackdropClick = (event: React.MouseEvent) => {
      if (event.target === event.currentTarget) {
        handleOpenChange(false);
      }
    };

    if (!isOpen) return null;

    return (
      <div
        ref={ref}
        className={cn(
          'fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in-0 duration-200',
          className
        )}
        onClick={handleBackdropClick}
        {...props}
      >
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child) && child.type === DialogContent) {
            return React.cloneElement(child, {
              onClose: () => handleOpenChange(false),
            });
          }
          return child;
        })}
      </div>
    );
  }
);
Dialog.displayName = 'Dialog';

// DialogTrigger Component
export interface DialogTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

const DialogTrigger = React.forwardRef<HTMLButtonElement, DialogTriggerProps>(
  ({ className, children, onClick, ...props }, ref) => (
    <button
      ref={ref}
      className={cn('', className)}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  )
);
DialogTrigger.displayName = 'DialogTrigger';

// DialogContent Component
export interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {
  onClose?: () => void;
  className?: string;
}

const DialogContent = React.forwardRef<HTMLDivElement, DialogContentProps>(
  ({ className, onClose, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'fixed left-1/2 top-1/2 z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 sm:rounded-lg',
        className
      )}
      {...props}
    >
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child) && child.type === DialogHeader) {
          return React.cloneElement(child, {
            onClose,
          });
        }
        return child;
      })}
      {children}
    </div>
  )
);
DialogContent.displayName = 'DialogContent';

// DialogHeader Component
export interface DialogHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  onClose?: () => void;
}

const DialogHeader = React.forwardRef<HTMLDivElement, DialogHeaderProps>(
  ({ className, onClose, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex flex-col space-y-1.5 text-center sm:text-left', className)}
      {...props}
    >
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child) && child.type === DialogTitle) {
          return React.cloneElement(child, {
            onClose,
          });
        }
        return child;
      })}
      {children}
    </div>
  )
);
DialogHeader.displayName = 'DialogHeader';

// DialogTitle Component
export interface DialogTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  onClose?: () => void;
}

const DialogTitle = React.forwardRef<HTMLHeadingElement, DialogTitleProps>(
  ({ className, onClose, children, ...props }, ref) => (
    <div className="flex items-center justify-between">
      <h2
        ref={ref}
        className={cn('text-lg font-semibold leading-none tracking-tight', className)}
        {...props}
      >
        {children}
      </h2>
      {onClose && (
        <button
          onClick={onClose}
          className="p-1 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  )
);
DialogTitle.displayName = 'DialogTitle';

// DialogDescription Component
export interface DialogDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

const DialogDescription = React.forwardRef<HTMLParagraphElement, DialogDescriptionProps>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  )
);
DialogDescription.displayName = 'DialogDescription';

// DialogFooter Component
export interface DialogFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

const DialogFooter = React.forwardRef<HTMLDivElement, DialogFooterProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex items-center justify-end gap-2', className)}
      {...props}
    />
  )
);
DialogFooter.displayName = 'DialogFooter';

export {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
};
