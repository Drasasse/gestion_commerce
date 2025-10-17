"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import {
  LayoutDashboard,
  Package,
  Users,
  ShoppingCart,
  Store,
  BarChart3,
  LogOut,
  UserCog,
  TrendingUp,
  Archive,
  DollarSign,
  Tags,
  FileText,
  CreditCard,
  Truck
} from "lucide-react"
import ThemeToggle from "./ThemeToggle"
import { MobileNavigation } from "./mobile"

const adminLinks = [
  { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/dashboard/boutiques", label: "Boutiques", icon: Store },
  { href: "/dashboard/utilisateurs", label: "Utilisateurs", icon: UserCog },
  { href: "/dashboard/capital", label: "Capital", icon: DollarSign },
  { href: "/dashboard/rapports", label: "Rapports", icon: BarChart3 },
]

const gestionnaireLinks = [
  { href: "/boutique", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/boutique/categories", label: "Catégories", icon: Tags },
  { href: "/boutique/produits", label: "Produits", icon: Package },
  { href: "/boutique/stocks", label: "Stocks", icon: Archive },
  { href: "/boutique/fournisseurs", label: "Fournisseurs", icon: Truck },
  { href: "/boutique/commandes", label: "Commandes", icon: FileText },
  { href: "/boutique/ventes", label: "Ventes", icon: ShoppingCart },
  { href: "/boutique/clients", label: "Clients", icon: Users },
  { href: "/boutique/paiements", label: "Paiements", icon: CreditCard },
  { href: "/boutique/transactions", label: "Transactions", icon: TrendingUp },
  { href: "/boutique/rapports", label: "Rapports", icon: BarChart3 },
]

export function Sidebar() {
  const { data: session } = useSession()
  const pathname = usePathname()

  const isAdmin = session?.user?.role === "ADMIN"
  const links = isAdmin ? adminLinks : gestionnaireLinks

  const DesktopSidebarContent = () => (
    <>
      <div className="p-6 border-b border-border">
        <div className="flex items-start justify-between mb-3">
          <h1 className="text-xl font-bold text-foreground">Gestion Commerce</h1>
          <ThemeToggle />
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          {session?.user?.name}
        </p>
        <p className="text-xs text-muted-foreground">
          {isAdmin ? "Administrateur" : session?.user?.boutique?.nom || "Gestionnaire"}
        </p>
      </div>

      <nav className="flex-1 overflow-y-auto p-4 flex flex-col gap-1">
        {links.map((link) => {
          const isActive = pathname === link.href
          const Icon = link.icon
          
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`
                flex items-center gap-3 px-4 py-2 rounded-lg transition-all
                ${isActive 
                  ? 'bg-primary/10 text-primary font-medium' 
                  : 'text-foreground hover:bg-accent hover:text-accent-foreground'
                }
              `}
            >
              <Icon className="h-5 w-5" />
              {link.label}
            </Link>
          )
        })}
        
        <div className="mt-auto pt-4">
          <button
            onClick={() => signOut()}
            className="flex items-center gap-3 px-4 py-2 rounded-lg text-destructive hover:bg-destructive/10 transition-all w-full"
          >
            <LogOut className="h-5 w-5" />
            Déconnexion
          </button>
        </div>
      </nav>
    </>
  )

  return (
    <>
      {/* Navigation mobile améliorée */}
      <MobileNavigation />

      {/* Desktop sidebar */}
      <div className="hidden md:flex w-64 bg-background border-r border-border h-screen sticky top-0 flex-col">
        <DesktopSidebarContent />
      </div>
    </>
  )
}
