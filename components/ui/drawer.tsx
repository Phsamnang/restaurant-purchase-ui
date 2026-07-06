'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

interface DrawerContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const DrawerContext = React.createContext<DrawerContextValue | null>(null);

const useDrawer = () => {
  const context = React.useContext(DrawerContext);
  if (!context) {
    throw new Error('useDrawer must be used within a <Drawer />');
  }
  return context;
};

export interface DrawerProps {
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultOpen?: boolean;
}

const Drawer = ({ children, open: controlledOpen, onOpenChange, defaultOpen = false }: DrawerProps) => {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;

  const setOpen = React.useCallback((newOpen: boolean) => {
    if (!isControlled) {
      setUncontrolledOpen(newOpen);
    }
    onOpenChange?.(newOpen);
  }, [isControlled, onOpenChange]);

  return (
    <DrawerContext.Provider value={{ open, setOpen }}>
      {children}
    </DrawerContext.Provider>
  );
};
Drawer.displayName = 'Drawer';

const DrawerTrigger = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }>(
  ({ className, onClick, children, asChild = false, ...props }, ref) => {
    const { setOpen, open } = useDrawer();
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      onClick?.(e);
      setOpen(!open);
    };

    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children as React.ReactElement<any>, {
        onClick: (e: React.MouseEvent<any>) => {
          children.props.onClick?.(e);
          setOpen(!open);
        },
        ref,
      });
    }

    return (
      <button ref={ref} onClick={handleClick} className={className} {...props}>
        {children}
      </button>
    );
  }
);
DrawerTrigger.displayName = 'DrawerTrigger';

const DrawerPortal = ({ children }: { children?: React.ReactNode }) => {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  if (!mounted || typeof document === 'undefined') return null;
  return createPortal(children, document.body);
};
DrawerPortal.displayName = 'DrawerPortal';

const DrawerOverlay = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const { open, setOpen } = useDrawer();
    if (!open) return null;

    return (
      <div
        ref={ref}
        onClick={() => setOpen(false)}
        className={cn('fixed inset-0 z-50 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in-0 duration-300', className)}
        {...props}
      />
    );
  }
);
DrawerOverlay.displayName = 'DrawerOverlay';

const DrawerContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => {
    const { open } = useDrawer();
    const contentRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
      if (open && contentRef.current) {
        contentRef.current.scrollTop = 0;
        const t1 = setTimeout(() => { if (contentRef.current) contentRef.current.scrollTop = 0; }, 10);
        const t2 = setTimeout(() => { if (contentRef.current) contentRef.current.scrollTop = 0; }, 100);
        const t3 = setTimeout(() => { if (contentRef.current) contentRef.current.scrollTop = 0; }, 350);
        const t4 = setTimeout(() => { if (contentRef.current) contentRef.current.scrollTop = 0; }, 500);
        return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
      }
    }, [open]);

    if (!open) return null;

    return (
      <DrawerPortal>
        <DrawerOverlay />
        <div
          ref={ref}
          className={cn(
            'fixed inset-x-0 bottom-0 z-50 flex h-auto max-h-[85vh] flex-col rounded-t-2xl border border-slate-200 bg-white shadow-2xl transition-all animate-in slide-in-from-bottom duration-300',
            className
          )}
          {...props}
        >
          {/* Thumb drag handle pill */}
          <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-slate-300 shrink-0" />
          <div ref={contentRef} className="overflow-y-auto max-h-[calc(85vh-2rem)] pb-6">
            {children}
          </div>
        </div>
      </DrawerPortal>
    );
  }
);
DrawerContent.displayName = 'DrawerContent';

const DrawerHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div tabIndex={-1} className={cn('grid gap-1.5 p-4 text-center sm:text-left focus:outline-none', className)} {...props} />
);
DrawerHeader.displayName = 'DrawerHeader';

const DrawerFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('mt-auto flex flex-col gap-2 p-4', className)} {...props} />
);
DrawerFooter.displayName = 'DrawerFooter';

const DrawerTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} tabIndex={0} autoFocus className={cn('text-lg font-bold leading-none tracking-tight text-slate-900 focus:outline-none', className)} {...props} />
  )
);
DrawerTitle.displayName = 'DrawerTitle';

const DrawerDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn('text-sm font-medium text-slate-500 mt-1', className)} {...props} />
  )
);
DrawerDescription.displayName = 'DrawerDescription';

const DrawerClose = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }>(
  ({ className, onClick, children, asChild = false, ...props }, ref) => {
    const { setOpen } = useDrawer();
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      onClick?.(e);
      setOpen(false);
    };

    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children as React.ReactElement<any>, {
        onClick: (e: React.MouseEvent<any>) => {
          children.props.onClick?.(e);
          setOpen(false);
        },
        ref,
      });
    }

    return (
      <button ref={ref} onClick={handleClick} className={className} {...props}>
        {children}
      </button>
    );
  }
);
DrawerClose.displayName = 'DrawerClose';

export {
  Drawer,
  DrawerPortal,
  DrawerOverlay,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
};
