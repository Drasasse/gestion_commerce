import React from 'react';

interface Column {
  key: string;
  label: string;
  className?: string;
}

interface TableProps<T = Record<string, unknown>> {
  columns: Column[];
  data: T[];
  renderRow: (item: T, index: number) => React.ReactNode;
  className?: string;
  emptyMessage?: string;
}

export function Table<T = Record<string, unknown>>({ 
  columns, 
  data, 
  renderRow, 
  className = '',
  emptyMessage = 'Aucune donnée disponible'
}: TableProps<T>) {
  return (
    <div className={`table-base rounded-lg shadow overflow-hidden ${className}`}>
      <table className="min-w-full divide-y divide-border">
        <thead className="table-header">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className={`px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider ${column.className || ''}`}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-card divide-y divide-border">
          {data.length === 0 ? (
            <tr>
              <td 
                colSpan={columns.length} 
                className="px-6 py-8 text-center text-muted-foreground"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((item, index) => (
              <tr key={('id' in item && typeof item.id === 'string') ? item.id : index} className="table-row">
                {renderRow(item, index)}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

interface TableCellProps {
  children: React.ReactNode;
  className?: string;
}

export function TableCell({ children, className = '' }: TableCellProps) {
  return (
    <td className={`px-6 py-4 whitespace-nowrap ${className}`}>
      {children}
    </td>
  );
}