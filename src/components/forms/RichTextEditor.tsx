'use client';

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { 
  Bold, 
  Italic, 
  Underline, 
  List, 
  ListOrdered, 
  Link,
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight
} from 'lucide-react';

export interface RichTextEditorProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  minHeight?: number;
}

export default function RichTextEditor({
  value = '',
  onChange,
  placeholder = 'Tapez votre texte ici...',
  className = '',
  disabled = false,
  minHeight = 200
}: RichTextEditorProps) {
  const [content, setContent] = useState(value);

  const handleContentChange = useCallback((newContent: string) => {
    setContent(newContent);
    onChange?.(newContent);
  }, [onChange]);

  const execCommand = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value);
    const editor = document.getElementById('rich-text-editor');
    if (editor) {
      handleContentChange(editor.innerHTML);
    }
  }, [handleContentChange]);

  const formatText = useCallback((format: string) => {
    execCommand(format);
  }, [execCommand]);

  const insertLink = useCallback(() => {
    const url = prompt('Entrez l\'URL du lien:');
    if (url) {
      execCommand('createLink', url);
    }
  }, [execCommand]);

  const handleInput = useCallback((e: React.FormEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    handleContentChange(target.innerHTML);
  }, [handleContentChange]);

  const toolbarButtons = [
    { icon: Bold, command: 'bold', title: 'Gras' },
    { icon: Italic, command: 'italic', title: 'Italique' },
    { icon: Underline, command: 'underline', title: 'Souligné' },
    { icon: List, command: 'insertUnorderedList', title: 'Liste à puces' },
    { icon: ListOrdered, command: 'insertOrderedList', title: 'Liste numérotée' },
    { icon: AlignLeft, command: 'justifyLeft', title: 'Aligner à gauche' },
    { icon: AlignCenter, command: 'justifyCenter', title: 'Centrer' },
    { icon: AlignRight, command: 'justifyRight', title: 'Aligner à droite' },
  ];

  return (
    <div className={`border border-gray-200 dark:border-gray-700 rounded-md ${className}`}>
      {/* Toolbar */}
      <div className="flex flex-wrap gap-1 p-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        {toolbarButtons.map(({ icon: Icon, command, title }) => (
          <Button
            key={command}
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => formatText(command)}
            disabled={disabled}
            title={title}
            className="h-8 w-8 p-0"
          >
            <Icon className="h-4 w-4" />
          </Button>
        ))}
        
        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
        
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={insertLink}
          disabled={disabled}
          title="Insérer un lien"
          className="h-8 w-8 p-0"
        >
          <Link className="h-4 w-4" />
        </Button>
        
        <select
          onChange={(e) => execCommand('fontSize', e.target.value)}
          disabled={disabled}
          className="ml-2 text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700"
        >
          <option value="1">Très petit</option>
          <option value="2">Petit</option>
          <option value="3" selected>Normal</option>
          <option value="4">Grand</option>
          <option value="5">Très grand</option>
        </select>
      </div>

      {/* Editor */}
      <div
        id="rich-text-editor"
        contentEditable={!disabled}
        onInput={handleInput}
        dangerouslySetInnerHTML={{ __html: content }}
        className={`
          p-4 outline-none min-h-[${minHeight}px] max-h-96 overflow-y-auto
          ${disabled ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed' : 'bg-white dark:bg-gray-900'}
          ${!content && !disabled ? 'empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400' : ''}
        `}
        data-placeholder={placeholder}
        style={{ minHeight: `${minHeight}px` }}
      />
      
      {/* Character count */}
      <div className="px-4 py-2 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700">
        {content.replace(/<[^>]*>/g, '').length} caractères
      </div>
    </div>
  );
}