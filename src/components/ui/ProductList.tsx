import React from 'react';
import Link from 'next/link';
import { Card } from './Card';

interface Product {
  nom: string;
  quantite: number;
  ca: number;
}

interface ProductListProps {
  title: string;
  products: Product[];
  viewAllHref?: string;
  formatAmount: (amount: number) => string;
  className?: string;
}

export function ProductList({ 
  title, 
  products, 
  viewAllHref, 
  formatAmount, 
  className = '' 
}: ProductListProps) {
  return (
    <Card className={className}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {viewAllHref && (
          <Link href={viewAllHref} className="text-sm text-blue-600 hover:text-blue-800">
            Voir tout
          </Link>
        )}
      </div>
      <div className="space-y-3">
        {products.map((product, index) => (
          <div 
            key={index} 
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-semibold text-sm">
                #{index + 1}
              </div>
              <div>
                <p className="font-medium text-gray-900">{product.nom}</p>
                <p className="text-sm text-gray-600">{product.quantite} vendus</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-semibold text-gray-900">{formatAmount(product.ca)}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}