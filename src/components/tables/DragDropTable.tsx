'use client';

import React, { useState, useCallback } from 'react';
import { GripVertical } from 'lucide-react';

export interface DragDropTableColumn {
  key: string;
  label: string;
  render?: (value: unknown, row: Record<string, unknown>) => React.ReactNode;
}

export interface DragDropTableProps {
  data: Record<string, unknown>[];
  columns: DragDropTableColumn[];
  onReorder?: (newOrder: Record<string, unknown>[]) => void;
  idField?: string;
  className?: string;
  dragHandle?: boolean;
}

export default function DragDropTable({
  data,
  columns,
  onReorder,
  idField = 'id',
  className = '',
  dragHandle = true
}: DragDropTableProps) {
  const [draggedItem, setDraggedItem] = useState<number | null>(null);
  const [dragOverItem, setDragOverItem] = useState<number | null>(null);

  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    setDraggedItem(index);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverItem(index);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverItem(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (draggedItem === null || draggedItem === dropIndex) {
      setDraggedItem(null);
      setDragOverItem(null);
      return;
    }

    const newData = [...data];
    const draggedRow = newData[draggedItem];
    
    // Remove dragged item
    newData.splice(draggedItem, 1);
    
    // Insert at new position
    const insertIndex = draggedItem < dropIndex ? dropIndex - 1 : dropIndex;
    newData.splice(insertIndex, 0, draggedRow);

    setDraggedItem(null);
    setDragOverItem(null);

    if (onReorder) {
      onReorder(newData);
    }
  }, [data, draggedItem, onReorder]);

  const handleDragEnd = useCallback(() => {
    setDraggedItem(null);
    setDragOverItem(null);
  }, []);

  const renderCell = (row: Record<string, unknown>, column: DragDropTableColumn): React.ReactNode => {
    const value = row[column.key];
    
    if (column.render) {
      return column.render(value, row);
    }
    
    return String(value || '');
  };

  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full border-collapse border border-gray-200 dark:border-gray-700">
        <thead>
          <tr className="bg-gray-50 dark:bg-gray-800">
            {dragHandle && (
              <th className="border border-gray-200 dark:border-gray-700 px-2 py-2 w-8">
                <span className="sr-only">Drag Handle</span>
              </th>
            )}
            {columns.map((column) => (
              <th
                key={column.key}
                className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-left font-medium"
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => {
            const rowId = String(row[idField] || index);
            const isDragging = draggedItem === index;
            const isDragOver = dragOverItem === index;
            
            return (
              <tr
                key={rowId}
                draggable={true}
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                className={`
                  transition-all duration-200
                  ${isDragging ? 'opacity-50 bg-blue-50 dark:bg-blue-900/20' : ''}
                  ${isDragOver ? 'border-t-2 border-blue-500' : ''}
                  ${!isDragging && !isDragOver ? 'hover:bg-gray-50 dark:hover:bg-gray-800' : ''}
                  cursor-move
                `}
              >
                {dragHandle && (
                  <td className="border border-gray-200 dark:border-gray-700 px-2 py-2 text-center">
                    <GripVertical className="h-4 w-4 text-gray-400" />
                  </td>
                )}
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className="border border-gray-200 dark:border-gray-700 px-4 py-2"
                  >
                    {renderCell(row, column)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
      
      {data.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          Aucune donnée à afficher
        </div>
      )}
    </div>
  );
}