'use client';

import { useState } from 'react';
import { Download, FileSpreadsheet, FileText } from 'lucide-react';

interface ExportButtonProps {
  onExportExcel: () => void;
  onExportCSV: () => void;
  disabled?: boolean;
  label?: string;
}

export default function ExportButton({
  onExportExcel,
  onExportCSV,
  disabled = false,
  label = 'Exporter',
}: ExportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <Download className="w-4 h-4" />
        {label}
      </button>

      {isOpen && (
        <>
          {/* Backdrop pour fermer le menu */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Menu déroulant */}
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
            <button
              onClick={() => {
                onExportExcel();
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4 text-green-600" />
              <span>Excel (.xlsx)</span>
            </button>

            <button
              onClick={() => {
                onExportCSV();
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <FileText className="w-4 h-4 text-blue-600" />
              <span>CSV (.csv)</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
