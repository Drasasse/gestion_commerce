/**
 * Composants de graphiques optimisés avec lazy loading
 * Réduit le bundle size initial en chargeant recharts seulement quand nécessaire
 */

import dynamic from 'next/dynamic';

// Skeleton spécifique pour les graphiques
const ChartSkeleton = () => (
  <div className="w-full h-64 bg-gray-100 rounded-lg animate-pulse flex items-center justify-center">
    <div className="text-gray-400 text-sm">Chargement du graphique...</div>
  </div>
);

// LineChart avec lazy loading
export const LazyLineChart = dynamic(
  () => import('recharts').then((mod) => mod.LineChart),
  {
    loading: () => <ChartSkeleton />,
    ssr: false, // Les graphiques n'ont pas besoin du SSR
  }
);

// BarChart avec lazy loading
export const LazyBarChart = dynamic(
  () => import('recharts').then((mod) => mod.BarChart),
  {
    loading: () => <ChartSkeleton />,
    ssr: false,
  }
);

// PieChart avec lazy loading
export const LazyPieChart = dynamic(
  () => import('recharts').then((mod) => mod.PieChart),
  {
    loading: () => <ChartSkeleton />,
    ssr: false,
  }
);

// ResponsiveContainer avec lazy loading
export const LazyResponsiveContainer = dynamic(
  () => import('recharts').then((mod) => mod.ResponsiveContainer),
  {
    loading: () => <div className="w-full h-64" />,
    ssr: false,
  }
);

// Autres composants recharts couramment utilisés
export const LazyLine = dynamic(
  () => import('recharts').then((mod) => mod.Line),
  { ssr: false }
);

export const LazyBar = dynamic(
  () => import('recharts').then((mod) => mod.Bar),
  { ssr: false }
);

export const LazyPie = dynamic(
  () => import('recharts').then((mod) => mod.Pie),
  { ssr: false }
);

export const LazyCell = dynamic(
  () => import('recharts').then((mod) => mod.Cell),
  { ssr: false }
);

export const LazyXAxis = dynamic(
  () => import('recharts').then((mod) => mod.XAxis),
  { ssr: false }
);

export const LazyYAxis = dynamic(
  () => import('recharts').then((mod) => mod.YAxis),
  { ssr: false }
);

export const LazyCartesianGrid = dynamic(
  () => import('recharts').then((mod) => mod.CartesianGrid),
  { ssr: false }
);

export const LazyTooltip = dynamic(
  () => import('recharts').then((mod) => mod.Tooltip),
  { ssr: false }
);

// Wrapper pour faciliter l'utilisation un graphique complet avec gestion d'erreur
interface LazyChartWrapperProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
}

export const LazyChartWrapper: React.FC<LazyChartWrapperProps> = ({ 
  children, 
  title, 
  className = "" 
}) => {
  return (
    <div className={`bg-white rounded-xl shadow-sm p-6 border border-gray-100 ${className}`}>
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {title}
        </h3>
      )}
      <div className="w-full">
        {children}
      </div>
    </div>
  );
};

const LazyCharts = {
  LineChart: LazyLineChart,
  BarChart: LazyBarChart,
  PieChart: LazyPieChart,
  ResponsiveContainer: LazyResponsiveContainer,
  Line: LazyLine,
  Bar: LazyBar,
  Pie: LazyPie,
  Cell: LazyCell,
  XAxis: LazyXAxis,
  YAxis: LazyYAxis,
  CartesianGrid: LazyCartesianGrid,
  Tooltip: LazyTooltip,
  ChartWrapper: LazyChartWrapper,
};

export default LazyCharts;