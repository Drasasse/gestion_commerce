import NextAuth, { User } from "next-auth"
import type { NextAuthConfig } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { Adapter } from "next-auth/adapters"
import { JWT } from "next-auth/jwt"
import { Session } from "next-auth"
import { prisma } from "./prisma"
import bcrypt from "bcryptjs"

// Types pour l'utilisateur étendu
interface UserWithBoutique extends User {
  id: string;
  email: string;
  name: string | null;
  role: string;
  boutiqueId: string | null;
  boutique?: {
    id: string;
    nom: string;
  } | null;
}

// Les types NextAuth sont définis dans src/types/next-auth.d.ts

export const authOptions: NextAuthConfig = {
  adapter: PrismaAdapter(prisma) as Adapter,
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" }
      },
      async authorize(credentials): Promise<UserWithBoutique | null> {
        if (!credentials?.email || !credentials?.password || 
            typeof credentials.password !== 'string' || typeof credentials.email !== 'string') {
          throw new Error("Email et mot de passe requis")
        }
        
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: { boutique: true }
        }) as {
          id: string;
          email: string;
          name: string;
          password: string;
          role: string;
          boutiqueId: string | null;
          boutique: {
            id: string;
            nom: string;
          } | null;
        } | null
        
        if (!user || !user.password) {
          throw new Error("Identifiants invalides")
        }
        
        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        )
        
        if (!isPasswordValid) {
          throw new Error("Identifiants invalides")
        }
        
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          boutiqueId: user.boutiqueId,
          boutique: user.boutique ? {
            id: user.boutique.id,
            nom: user.boutique.nom
          } : null
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }: { token: JWT; user?: User }): Promise<JWT> {
      if (user) {
        token.id = user.id || ""
        token.role = (user as UserWithBoutique).role
        token.boutiqueId = (user as UserWithBoutique).boutiqueId
        token.boutique = (user as UserWithBoutique).boutique
      }
      return token
    },
    async session({ session, token }: { session: Session; token: JWT }): Promise<Session> {
      if (session.user && token) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.boutiqueId = token.boutiqueId as string | null
        session.user.boutique = token.boutique as { id: string; nom: string } | null
      }
      return session
    }
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
  // Configuration CSRF pour NextAuth v5
  useSecureCookies: process.env.NODE_ENV === "production",
  cookies: {
    sessionToken: {
      name: `${process.env.NODE_ENV === "production" ? "__Secure-" : ""}next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
    callbackUrl: {
      name: `${process.env.NODE_ENV === "production" ? "__Secure-" : ""}next-auth.callback-url`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
    csrfToken: {
      name: `${process.env.NODE_ENV === "production" ? "__Host-" : ""}next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
}

// Export auth function for server-side session access
const { auth, handlers, signIn, signOut } = NextAuth(authOptions);

export { auth, handlers, signIn, signOut };
