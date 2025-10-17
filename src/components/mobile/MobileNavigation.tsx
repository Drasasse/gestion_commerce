"use client"

import { useState } from "react"
import { useSession, signOut } from "next-auth/react"
import { 
  Menu, 
  LogOut, 
  User, 
  Settings, 
  Bell,
  LayoutDashboard,
  Store,
  UserCog,
  DollarSign,
  BarChart3,
  Tags,
  Package,
  Archive,
  Truck,
  FileText,
  ShoppingCart,
  Users,
  CreditCard,
  TrendingUp
} from "lucide-react"
import { MobileDrawer } from "./MobileDrawer"
import { MobileNavLink } from "./MobileNavLink"
import ThemeToggle from "../ThemeToggle"

// Import des liens depuis la sidebar existante
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

export function MobileNavigation() {
  const { data: session } = useSession()
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  const isAdmin = session?.user?.role === "ADMIN"
  const links = isAdmin ? adminLinks : gestionnaireLinks

  const handleLinkClick = () => {
    setIsDrawerOpen(false)
  }

  const handleSignOut = () => {
    setIsDrawerOpen(false)
    signOut()
  }

  return (
    <>
      {/* Menu Button - Visible uniquement sur mobile */}
      <button
        onClick={() => setIsDrawerOpen(true)}
        className="fixed top-4 left-4 z-30 p-3 bg-background text-foreground rounded-xl shadow-lg border border-border md:hidden touch-manipulation"
        aria-label="Ouvrir le menu"
      >
        <Menu className="h-6 w-6" />
      </button>

      {/* Mobile Drawer */}
      <MobileDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title="Navigation"
      >
        {/* User Profile Section */}
        <div className="p-6 border-b border-border bg-gradient-to-r from-primary/5 to-primary/10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground text-lg">
                {session?.user?.name || "Utilisateur"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {isAdmin ? "Administrateur" : session?.user?.boutique?.nom || "Gestionnaire"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <button className="p-2 rounded-lg hover:bg-accent transition-colors">
                <Bell className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="p-4 space-y-2">
          {links.map((link) => (
            <MobileNavLink
              key={link.href}
              href={link.href}
              label={link.label}
              icon={link.icon}
              onClick={handleLinkClick}
            />
          ))}
        </nav>

        {/* Bottom Actions */}
        <div className="mt-auto p-4 border-t border-border bg-muted/30">
          <div className="space-y-2">
            <button
              onClick={handleLinkClick}
              className="flex items-center gap-4 px-4 py-3 rounded-xl text-foreground hover:bg-accent transition-all w-full touch-manipulation"
            >
              <div className="p-2 rounded-lg bg-muted/50">
                <Settings className="h-5 w-5" />
              </div>
              <span className="text-base font-medium">Paramètres</span>
            </button>
            
            <button
              onClick={handleSignOut}
              className="flex items-center gap-4 px-4 py-3 rounded-xl text-destructive hover:bg-destructive/10 transition-all w-full touch-manipulation"
            >
              <div className="p-2 rounded-lg bg-destructive/10">
                <LogOut className="h-5 w-5" />
              </div>
              <span className="text-base font-medium">Déconnexion</span>
            </button>
          </div>
        </div>
      </MobileDrawer>
    </>
  )
}