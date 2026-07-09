'use client';

import React, { useEffect } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidthClassName?: string;
}

export function Modal({ isOpen, onClose, title, children, footer, maxWidthClassName = "max-w-md" }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className={`bg-card rounded-t-2xl sm:rounded-2xl w-full sm:w-[95%] ${maxWidthClassName} max-h-[90vh] flex flex-col shadow-xl animate-in slide-in-from-bottom-4 duration-300 border border-border overflow-hidden`}>
        <div className="sticky top-0 z-10 bg-card/95 backdrop-blur-sm border-b border-border p-4 sm:p-5 flex items-center justify-between flex-shrink-0">
          <h2 className="text-lg font-bold tracking-tight line-clamp-1">{title}</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer flex-shrink-0"
            aria-label="Close modal"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 flex flex-col min-h-0">{children}</div>
        {footer && <div className="border-t border-border p-4 sm:p-5 bg-secondary/30 flex-shrink-0">{footer}</div>}
      </div>
    </div>
  );
}
