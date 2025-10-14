'use client';

import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';

interface SortableHeaderProps {
  label: string;
  field: string;
  currentSort: { field: string; direction: 'asc' | 'desc' } | null;
  onSort: (field: string) => void;
  className?: string;
}

export default function SortableHeader({
  label,
  field,
  currentSort,
  onSort,
  className = '',
}: SortableHeaderProps) {
  const isActive = currentSort?.field === field;
  const direction = isActive ? currentSort.direction : null;

  return (
    <th
      className={`
        px-6 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider
        cursor-pointer transition-colors hover:bg-muted/50 select-none
        ${className}
      `}
      onClick={() => onSort(field)}
    >
      <div className="flex items-center gap-2">
        <span>{label}</span>
        {isActive ? (
          direction === 'asc' ? (
            <ArrowUp className="w-4 h-4 text-primary" />
          ) : (
            <ArrowDown className="w-4 h-4 text-primary" />
          )
        ) : (
          <ArrowUpDown className="w-4 h-4 text-muted-foreground/50" />
        )}
      </div>
    </th>
  );
}
