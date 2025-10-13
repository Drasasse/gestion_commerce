import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
)

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*", 
    "/boutique/:path*",
    "/api/boutiques/:path*",
    "/api/capital/:path*",
    "/api/categories/:path*",
    "/api/clients/:path*",
    "/api/commandes/:path*",
    "/api/fournisseurs/:path*",
    "/api/mouvements-stock/:path*",
    "/api/paiements/:path*",
    "/api/produits/:path*",
    "/api/rapports/:path*",
    "/api/stocks/:path*",
    "/api/transactions/:path*",
    "/api/utilisateurs/:path*",
    "/api/ventes/:path*",
  ]
}
