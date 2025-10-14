import React from 'react';
import { X } from 'lucide-react';
import { Button } from './Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
};

export function Modal({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  footer, 
  size = 'md',
  className = '' 
}: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.75)' }}>
      <div 
        className={`bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full ${sizeClasses[size]} ${className} border border-gray-200 dark:border-gray-700`}
        style={{ backgroundColor: 'var(--card)', color: 'var(--card-foreground)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 rounded-t-lg">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X size={16} />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 bg-white dark:bg-gray-800">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 rounded-b-lg">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}