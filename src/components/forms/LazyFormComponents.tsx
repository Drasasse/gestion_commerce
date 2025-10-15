/**
 * Composants de formulaires optimisés avec lazy loading
 * Réduit le bundle size initial en chargeant les bibliothèques lourdes seulement quand nécessaire
 */

import dynamic from 'next/dynamic';
import LoadingSkeleton from '@/components/LoadingSkeleton';

// Skeleton spécifique pour les formulaires
const FormSkeleton = () => (
  <div className="space-y-4">
    <div className="h-4 bg-gray-200 rounded animate-pulse w-1/4"></div>
    <div className="h-10 bg-gray-100 rounded animate-pulse"></div>
  </div>
);

// Skeleton pour les composants de date
const DatePickerSkeleton = () => (
  <div className="relative">
    <div className="h-10 bg-gray-100 rounded animate-pulse"></div>
    <div className="absolute right-3 top-3 h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
  </div>
);

// Skeleton pour les composants complexes
const ComplexFormSkeleton = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FormSkeleton />
      <FormSkeleton />
    </div>
    <div className="h-32 bg-gray-100 rounded animate-pulse"></div>
    <div className="flex justify-end space-x-2">
      <div className="h-10 w-20 bg-gray-200 rounded animate-pulse"></div>
      <div className="h-10 w-24 bg-blue-200 rounded animate-pulse"></div>
    </div>
  </div>
);

// Date Picker avec composant natif HTML5
export const LazyDatePicker = dynamic(
  () => Promise.resolve({ 
    default: ({ className = "", ...props }: React.InputHTMLAttributes<HTMLInputElement>) => (
      <input 
        type="date" 
        className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${className}`}
        {...props}
      />
    )
  }),
  {
    loading: () => <DatePickerSkeleton />,
    ssr: false,
  }
);

// Rich Text Editor avec lazy loading (si vous utilisez un éditeur riche)
export const LazyRichTextEditor = dynamic(
  () => import('@/components/forms/RichTextEditor').then((mod) => ({ default: mod.default })).catch(() => ({
    default: () => <textarea className="w-full px-3 py-2 border border-gray-300 rounded-md h-32" placeholder="Éditeur de texte..." />
  })),
  {
    loading: () => <div className="h-32 bg-gray-100 rounded animate-pulse"></div>,
    ssr: false,
  }
);

// Formulaire complexe avec validation avancée
export const LazyAdvancedForm = dynamic(
  () => import('@/components/forms/AdvancedForm').then((mod) => ({ default: mod.default })).catch(() => ({
    default: () => <div>Formulaire non disponible</div>
  })),
  {
    loading: () => <ComplexFormSkeleton />,
    ssr: false,
  }
);

// File Upload avec preview (composant lourd)
export const LazyFileUpload = dynamic(
  () => import('@/components/forms/FileUpload').then((mod) => ({ default: mod.default })).catch(() => ({
    default: () => <input type="file" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
  })),
  {
    loading: () => <div className="h-24 bg-gray-100 rounded animate-pulse border-2 border-dashed border-gray-300"></div>,
    ssr: false,
  }
);

// Multi-select avec recherche (composant lourd)
export const LazyMultiSelect = dynamic(
  () => import('@/components/forms/MultiSelect').then((mod) => ({ default: mod.default })).catch(() => ({
    default: () => <select className="w-full px-3 py-2 border border-gray-300 rounded-md" multiple />
  })),
  {
    loading: () => <FormSkeleton />,
    ssr: false,
  }
);

// Auto-complete avec recherche asynchrone
export const LazyAutoComplete = dynamic(
  () => import('@/components/forms/AutoComplete').then((mod) => ({ default: mod.default })).catch(() => ({
    default: () => <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md" placeholder="Rechercher..." />
  })),
  {
    loading: () => <FormSkeleton />,
    ssr: false,
  }
);

// Composant wrapper pour formulaires avec gestion d'erreur
interface LazyFormWrapperProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
  loading?: boolean;
}

export const LazyFormWrapper: React.FC<LazyFormWrapperProps> = ({ 
  children, 
  title, 
  className = "",
  loading = false
}) => {
  if (loading) {
    return <ComplexFormSkeleton />;
  }

  return (
    <div className={`bg-white rounded-xl shadow-sm p-6 border border-gray-100 ${className}`}>
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 mb-6">
          {title}
        </h3>
      )}
      <div className="space-y-6">
        {children}
      </div>
    </div>
  );
};

// Export par défaut avec tous les composants
export default {
  DatePicker: LazyDatePicker,
  RichTextEditor: LazyRichTextEditor,
  AdvancedForm: LazyAdvancedForm,
  FileUpload: LazyFileUpload,
  MultiSelect: LazyMultiSelect,
  AutoComplete: LazyAutoComplete,
  FormWrapper: LazyFormWrapper,
};