'use client';

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Pencil, Check, X } from 'lucide-react';

export interface EditableTableColumn {
  key: string;
  label: string;
  editable?: boolean;
  type?: 'text' | 'number' | 'email';
}

export interface EditableTableProps {
  data: Record<string, unknown>[];
  columns: EditableTableColumn[];
  onUpdate?: (id: string | number, field: string, value: unknown) => Promise<void>;
  onDelete?: (id: string | number) => Promise<void>;
  idField?: string;
  className?: string;
}

export default function EditableTable({
  data,
  columns,
  onUpdate,
  onDelete,
  idField = 'id',
  className = ''
}: EditableTableProps) {
  const [editingCell, setEditingCell] = useState<{ rowId: string | number; field: string } | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [loading, setLoading] = useState<string | null>(null);

  const startEdit = useCallback((rowId: string | number, field: string, currentValue: unknown) => {
    setEditingCell({ rowId, field });
    setEditValue(String(currentValue || ''));
  }, []);

  const cancelEdit = useCallback(() => {
    setEditingCell(null);
    setEditValue('');
  }, []);

  const saveEdit = useCallback(async () => {
    if (!editingCell || !onUpdate) return;

    const { rowId, field } = editingCell;
    setLoading(`${rowId}-${field}`);

    try {
      await onUpdate(rowId, field, editValue);
      setEditingCell(null);
      setEditValue('');
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
    } finally {
      setLoading(null);
    }
  }, [editingCell, editValue, onUpdate]);

  const handleDelete = useCallback(async (rowId: string | number) => {
    if (!onDelete) return;

    setLoading(`delete-${rowId}`);
    try {
      await onDelete(rowId);
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
    } finally {
      setLoading(null);
    }
  }, [onDelete]);

  const renderCell = (row: Record<string, unknown>, column: EditableTableColumn): React.ReactNode => {
    const rowId = row[idField] as string | number;
    const value = String(row[column.key] || '');
    const isEditing = editingCell?.rowId === rowId && editingCell?.field === column.key;
    const isLoading = loading === `${rowId}-${column.key}`;

    if (isEditing) {
      return (
        <div className="flex items-center gap-2">
          <Input
            type={column.type || 'text'}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="h-8"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') saveEdit();
              if (e.key === 'Escape') cancelEdit();
            }}
          />
          <Button
            size="sm"
            variant="ghost"
            onClick={saveEdit}
            disabled={isLoading}
            className="h-8 w-8 p-0"
          >
            <Check className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={cancelEdit}
            disabled={isLoading}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      );
    }

    return (
      <div className="flex items-center justify-between group">
        <span>{value}</span>
        {column.editable && onUpdate && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => startEdit(rowId, column.key, value)}
            className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Pencil className="h-4 w-4" />
          </Button>
        )}
      </div>
    );
  };

  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full border-collapse border border-gray-200 dark:border-gray-700">
        <thead>
          <tr className="bg-gray-50 dark:bg-gray-800">
            {columns.map((column) => (
              <th
                key={column.key}
                className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-left font-medium"
              >
                {column.label}
              </th>
            ))}
            {onDelete && (
              <th className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-left font-medium">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => {
            const rowId = row[idField] as string | number;
            return (
              <tr key={String(rowId || index)} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className="border border-gray-200 dark:border-gray-700 px-4 py-2"
                  >
                    {renderCell(row, column)}
                  </td>
                ))}
                {onDelete && (
                  <td className="border border-gray-200 dark:border-gray-700 px-4 py-2">
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleDelete(rowId)}
                      disabled={loading === `delete-${rowId}`}
                    >
                      {loading === `delete-${rowId}` ? 'Suppression...' : 'Supprimer'}
                    </Button>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}