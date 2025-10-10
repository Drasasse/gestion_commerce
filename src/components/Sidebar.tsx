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
  Menu,
  X,
  UserCog,
  TrendingUp,
  Archive,
  DollarSign,
  Tags,
  FileText,
  CreditCard,
  Truck
} from "lucide-react"
import { useState } from "react"
import ThemeToggle from "./ThemeToggle"

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
  const [mobileOpen, setMobileOpen] = useState(false)

  const isAdmin = session?.user?.role === "ADMIN"
  const links = isAdmin ? adminLinks : gestionnaireLinks

  const SidebarContent = () => (
    <>
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-start justify-between mb-2">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Gestion Commerce</h1>
          <ThemeToggle />
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
          {session?.user?.name}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {isAdmin ? "Administrateur" : session?.user?.boutique?.nom || "Gestionnaire"}
        </p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {links.map((link) => {
          const Icon = link.icon
          const isActive = pathname === link.href || pathname.startsWith(link.href + "/")
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? "bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-medium"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              <Icon size={20} />
              <span>{link.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors w-full"
        >
          <LogOut size={20} />
          <span>Déconnexion</span>
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg shadow-lg"
      >
        {mobileOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside
        className={`lg:hidden fixed top-0 left-0 bottom-0 w-64 bg-white dark:bg-gray-900 shadow-xl z-40 transform transition-transform ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          <SidebarContent />
        </div>
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 h-screen sticky top-0">
        <SidebarContent />
      </aside>
    </>
  )
}
