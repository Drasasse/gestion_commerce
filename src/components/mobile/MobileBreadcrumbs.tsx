"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRight, Home } from "lucide-react"

interface BreadcrumbItem {
  label: string
  href?: string
  current?: boolean
}

interface MobileBreadcrumbsProps {
  items: BreadcrumbItem[]
  className?: string
}

export function MobileBreadcrumbs({ items, className = "" }: MobileBreadcrumbsProps) {
  // Sur mobile, on affiche seulement les 2 derniers éléments pour économiser l'espace
  const mobileItems = items.length > 2 ? items.slice(-2) : items
  
  return (
    <nav 
      aria-label="Fil d'Ariane" 
      className={`flex items-center space-x-1 text-sm ${className}`}
    >
      {/* Icône Home toujours visible */}
      <Link 
        href="/dashboard" 
        className="p-2 rounded-lg hover:bg-accent transition-colors touch-manipulation"
        aria-label="Accueil"
      >
        <Home className="h-4 w-4 text-muted-foreground" />
      </Link>

      {/* Indicateur de troncature si nécessaire */}
      {items.length > 2 && (
        <>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">...</span>
        </>
      )}

      {/* Breadcrumbs mobiles */}
      {mobileItems.map((item, index) => (
        <div key={index} className="flex items-center space-x-1">
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          
          {item.href && !item.current ? (
            <Link
              href={item.href}
              className="px-2 py-1 rounded-md hover:bg-accent transition-colors text-muted-foreground hover:text-foreground touch-manipulation"
            >
              {item.label}
            </Link>
          ) : (
            <span 
              className={`px-2 py-1 rounded-md font-medium ${
                item.current 
                  ? 'text-foreground bg-accent/50' 
                  : 'text-muted-foreground'
              }`}
              aria-current={item.current ? "page" : undefined}
            >
              {item.label}
            </span>
          )}
        </div>
      ))}
    </nav>
  )
}

// Hook utilitaire pour générer automatiquement les breadcrumbs
export function useBreadcrumbs(pathname: string): BreadcrumbItem[] {
  if (!pathname) {
    return []
  }
  
  const segments = pathname.split('/').filter(Boolean)
  
  if (segments.length === 0) {
    return []
  }
  
  const breadcrumbs: BreadcrumbItem[] = []
  
  // Mapping des segments vers des labels lisibles
  const segmentLabels: Record<string, string> = {
    'dashboard': 'Tableau de bord',
    'boutique': 'Boutique',
    'boutiques': 'Boutiques',
    'utilisateurs': 'Utilisateurs',
    'capital': 'Capital',
    'rapports': 'Rapports',
    'categories': 'Catégories',
    'produits': 'Produits',
    'stocks': 'Stocks',
    'fournisseurs': 'Fournisseurs',
    'commandes': 'Commandes',
    'ventes': 'Ventes',
    'clients': 'Clients',
    'paiements': 'Paiements',
    'transactions': 'Transactions',
  }
  
  let currentPath = ''
  
  segments.forEach((segment, index) => {
    currentPath += `/${segment}`
    const isLast = index === segments.length - 1
    
    breadcrumbs.push({
      label: segmentLabels[segment] || segment,
      href: isLast ? undefined : currentPath,
      current: isLast
    })
  })
  
  return breadcrumbs
}

// Hook qui utilise automatiquement usePathname
export function useBreadcrumbsAuto(): BreadcrumbItem[] {
  const pathname = usePathname()
  return useBreadcrumbs(pathname || '')
}

// Composant qui génère automatiquement les breadcrumbs
export function MobileBreadcrumbsAuto({ className = "" }: { className?: string }) {
  const breadcrumbs = useBreadcrumbsAuto()
  return <MobileBreadcrumbs items={breadcrumbs} className={className} />
}