import React from 'react';
import Link from 'next/link';
import { LucideIcon } from 'lucide-react';

interface QuickAction {
  href: string;
  icon: LucideIcon;
  label: string;
  highlighted?: boolean;
}

interface QuickActionsProps {
  title: string;
  actions: QuickAction[];
  className?: string;
}

export function QuickActions({ title, actions, className = '' }: QuickActionsProps) {
  return (
    <div className={`bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-lg p-6 text-white ${className}`}>
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {actions.map((action, index) => {
          const Icon = action.icon;
          return (
            <Link
              key={index}
              href={action.href}
              className={`bg-white ${
                action.highlighted ? 'bg-opacity-30' : 'bg-opacity-20'
              } hover:bg-opacity-30 rounded-lg p-4 transition-all text-center`}
            >
              <Icon className="mx-auto mb-2" size={24} />
              <p className="text-sm font-medium">{action.label}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}