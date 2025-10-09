import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: string
      boutiqueId: string | null
      boutique?: {
        id: string
        nom: string
      } | null
    } & DefaultSession["user"]
  }

  interface User {
    role: string
    boutiqueId: string | null
    boutique?: {
      id: string
      nom: string
    } | null
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: string
    boutiqueId: string | null
    boutique?: {
      id: string
      nom: string
    } | null
  }
}
