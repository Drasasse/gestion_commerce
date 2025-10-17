'use client';

import React from 'react';
import { ChevronRight, MoreVertical } from 'lucide-react';

interface MobileCardField {
  label: string;
  value: React.ReactNode;
  primary?: boolean;
  secondary?: boolean;
  badge?: boolean;
  icon?: React.ReactNode;
}

interface MobileCardProps {
  fields: MobileCardField[];
  onTap?: () => void;
  onLongPress?: () => void;
  selected?: boolean;
  actions?: React.ReactNode;
  className?: string;
  avatar?: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export function MobileCard({
  fields,
  onTap,
  onLongPress,
  selected = false,
  actions,
  className = '',
  avatar,
  title,
  subtitle
}: MobileCardProps) {
  const [isPressed, setIsPressed] = React.useState(false);
  const [longPressTimer, setLongPressTimer] = React.useState<NodeJS.Timeout | null>(null);

  const handleTouchStart = () => {
    setIsPressed(true);
    if (onLongPress) {
      const timer = setTimeout(() => {
        onLongPress();
        setIsPressed(false);
      }, 500);
      setLongPressTimer(timer);
    }
  };

  const handleTouchEnd = () => {
    setIsPressed(false);
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  const handleClick = () => {
    if (onTap && !longPressTimer) {
      onTap();
    }
  };

  return (
    <div
      className={`
        bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700
        transition-all duration-200 ease-in-out
        ${selected ? 'ring-2 ring-blue-500 border-blue-500' : ''}
        ${onTap ? 'cursor-pointer hover:shadow-md active:scale-[0.98]' : ''}
        ${isPressed ? 'scale-[0.98] shadow-lg' : 'shadow-sm'}
        ${className}
      `}
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleTouchStart}
      onMouseUp={handleTouchEnd}
      onMouseLeave={handleTouchEnd}
    >
      {/* Header avec avatar et titre */}
      {(avatar || title || actions) && (
        <div className="flex items-center justify-between p-4 pb-2">
          <div className="flex items-center space-x-3">
            {avatar && (
              <div className="flex-shrink-0">
                {avatar}
              </div>
            )}
            {title && (
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {title}
                </h3>
                {subtitle && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {subtitle}
                  </p>
                )}
              </div>
            )}
          </div>
          {actions && (
            <div className="flex-shrink-0">
              {actions}
            </div>
          )}
        </div>
      )}

      {/* Contenu principal */}
      <div className="p-4 pt-2">
        <div className="space-y-3">
          {fields.map((field, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center space-x-2 min-w-0 flex-1">
                {field.icon && (
                  <div className="flex-shrink-0 text-gray-400 dark:text-gray-500">
                    {field.icon}
                  </div>
                )}
                <span className={`
                  text-xs font-medium text-gray-500 dark:text-gray-400 truncate
                  ${field.primary ? 'text-gray-900 dark:text-gray-100 text-sm' : ''}
                `}>
                  {field.label}
                </span>
              </div>
              <div className="flex-shrink-0 ml-2">
                {field.badge ? (
                  <span className={`
                    inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                    ${field.primary ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' : ''}
                    ${field.secondary ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200' : ''}
                    ${!field.primary && !field.secondary ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : ''}
                  `}>
                    {field.value}
                  </span>
                ) : (
                  <span className={`
                    text-sm text-gray-900 dark:text-gray-100 font-medium
                    ${field.primary ? 'text-base font-semibold' : ''}
                    ${field.secondary ? 'text-gray-600 dark:text-gray-300' : ''}
                  `}>
                    {field.value}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Indicateur de navigation */}
        {onTap && (
          <div className="flex justify-end mt-3 pt-2 border-t border-gray-100 dark:border-gray-700">
            <ChevronRight className="h-4 w-4 text-gray-400" />
          </div>
        )}
      </div>
    </div>
  );
}

// Composant pour les actions de carte
interface MobileCardActionsProps {
  onEdit?: () => void;
  onDelete?: () => void;
  onMore?: () => void;
  customActions?: Array<{
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
    destructive?: boolean;
  }>;
}

export function MobileCardActions({
  onEdit,
  onDelete,
  onMore,
  customActions = []
}: MobileCardActionsProps) {
  const [showMenu, setShowMenu] = React.useState(false);

  return (
    <div className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setShowMenu(!showMenu);
        }}
        className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      >
        <MoreVertical className="h-4 w-4 text-gray-500" />
      </button>

      {showMenu && (
        <>
          {/* Overlay pour fermer le menu */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowMenu(false)}
          />
          
          {/* Menu */}
          <div className="absolute right-0 top-8 z-20 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 min-w-[120px]">
            {onEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                  setShowMenu(false);
                }}
                className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Modifier
              </button>
            )}
            
            {customActions.map((action, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  action.onClick();
                  setShowMenu(false);
                }}
                className={`
                  w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700
                  ${action.destructive 
                    ? 'text-red-600 dark:text-red-400' 
                    : 'text-gray-700 dark:text-gray-300'
                  }
                `}
              >
                <div className="flex items-center space-x-2">
                  {action.icon && <span className="flex-shrink-0">{action.icon}</span>}
                  <span>{action.label}</span>
                </div>
              </button>
            ))}
            
            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                  setShowMenu(false);
                }}
                className="w-full px-3 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Supprimer
              </button>
            )}
            
            {onMore && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onMore();
                  setShowMenu(false);
                }}
                className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Plus d'options
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}