import React from 'react';

interface Column {
  key: string;
  label: string;
  className?: string;
}

interface TableProps {
  columns: Column[];
  data: any[];
  renderRow: (item: any, index: number) => React.ReactNode;
  className?: string;
  emptyMessage?: string;
}

export function Table({ 
  columns, 
  data, 
  renderRow, 
  className = '',
  emptyMessage = 'Aucune donnée disponible'
}: TableProps) {
  return (
    <div className={`bg-white rounded-lg shadow overflow-hidden ${className}`}>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${column.className || ''}`}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.length === 0 ? (
            <tr>
              <td 
                colSpan={columns.length} 
                className="px-6 py-8 text-center text-gray-500"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((item, index) => (
              <tr key={item.id || index} className="hover:bg-gray-50">
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