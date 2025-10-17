"use client"

import Link from "next/link"
import { LucideIcon } from "lucide-react"
import { usePathname } from "next/navigation"

interface MobileNavLinkProps {
  href: string
  label: string
  icon: LucideIcon
  onClick?: () => void
  badge?: string | number
}

export function MobileNavLink({ 
  href, 
  label, 
  icon: Icon, 
  onClick,
  badge 
}: MobileNavLinkProps) {
  const pathname = usePathname()
  const isActive = pathname === href

  return (
    <Link
      href={href}
      onClick={onClick}
      className={`
        flex items-center gap-4 px-4 py-4 rounded-xl transition-all
        touch-manipulation min-h-[56px] relative
        ${isActive 
          ? 'bg-primary/15 text-primary font-medium border-l-4 border-primary' 
          : 'text-foreground hover:bg-accent/50 active:bg-accent'
        }
      `}
    >
      <div className={`
        p-2 rounded-lg transition-colors
        ${isActive ? 'bg-primary/20' : 'bg-muted/50'}
      `}>
        <Icon className="h-5 w-5" />
      </div>
      
      <span className="flex-1 text-base font-medium">
        {label}
      </span>

      {badge && (
        <div className="bg-destructive text-destructive-foreground text-xs font-bold px-2 py-1 rounded-full min-w-[20px] text-center">
          {badge}
        </div>
      )}

      {/* Ripple effect pour le feedback tactile */}
      <div className="absolute inset-0 rounded-xl overflow-hidden">
        <div className="absolute inset-0 bg-current opacity-0 transition-opacity duration-150 hover:opacity-5 active:opacity-10" />
      </div>
    </Link>
  )
}