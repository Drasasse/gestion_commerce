import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"

export async function middleware(req: NextRequest) {
  // Vérifier si l'utilisateur est authentifié
  const token = await getToken({ 
    req, 
    secret: process.env.NEXTAUTH_SECRET 
  })

  // Si pas de token et que la route nécessite une authentification
  if (!token) {
    // Rediriger vers la page de connexion
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('callbackUrl', req.url)
    return NextResponse.redirect(loginUrl)
  }

  // Continuer avec la requête
  return NextResponse.next()
}

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
