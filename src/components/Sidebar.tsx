"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import {
  LayoutDashboard,
  Package,
  Users,
  ShoppingCart,
  Wallet,
  Store,
  BarChart3,
  LogOut,
  Menu,
  X
} from "lucide-react"
import { useState } from "react"

const adminLinks = [
  { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/dashboard/boutiques", label: "Boutiques", icon: Store },
  { href: "/dashboard/produits", label: "Produits", icon: Package },
  { href: "/dashboard/ventes", label: "Ventes", icon: ShoppingCart },
  { href: "/dashboard/clients", label: "Clients", icon: Users },
  { href: "/dashboard/tresorerie", label: "Trésorerie", icon: Wallet },
  { href: "/dashboard/rapports", label: "Rapports", icon: BarChart3 },
]

const gestionnaireLinks = [
  { href: "/boutique", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/boutique/produits", label: "Produits", icon: Package },
  { href: "/boutique/ventes", label: "Ventes", icon: ShoppingCart },
  { href: "/boutique/clients", label: "Clients", icon: Users },
  { href: "/boutique/caisse", label: "Caisse", icon: Wallet },
]

export function Sidebar() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  const isAdmin = session?.user?.role === "ADMIN"
  const links = isAdmin ? adminLinks : gestionnaireLinks

  const SidebarContent = () => (
    <>
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-900">Gestion Commerce</h1>
        <p className="text-sm text-gray-600 mt-1">
          {session?.user?.name}
        </p>
        <p className="text-xs text-gray-500">
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
                  ? "bg-blue-50 text-blue-700 font-medium"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <Icon size={20} />
              <span>{link.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-gray-200">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors w-full"
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
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-lg"
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
        className={`lg:hidden fixed top-0 left-0 bottom-0 w-64 bg-white shadow-xl z-40 transform transition-transform ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          <SidebarContent />
        </div>
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-gray-200 h-screen sticky top-0">
        <SidebarContent />
      </aside>
    </>
  )
}
