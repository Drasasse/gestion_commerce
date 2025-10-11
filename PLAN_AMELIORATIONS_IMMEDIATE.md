# 🚀 PLAN D'AMÉLIORATIONS IMMÉDIATES

**Objectif**: Passer de MVP à Production-Ready en 8-10 semaines

---

## 📅 PHASE 1: SÉCURITÉ CRITIQUE (Semaines 1-2)

### 🔴 URGENT - Ne pas déployer en production sans ces fixes

#### 1.1 Rate Limiting (3 jours) - **COMMENCER ICI**

**Installation**:
```bash
npm install @upstash/ratelimit @upstash/redis
```

**Fichier**: `src/lib/rate-limiter.ts`
```typescript
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Configuration Redis
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Rate limiter pour login
export const loginRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "1 m"), // 5 tentatives/minute
  analytics: true,
  prefix: "ratelimit:login",
});

// Rate limiter pour API
export const apiRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, "1 m"), // 100 req/minute
  analytics: true,
  prefix: "ratelimit:api",
});

// Helper pour middleware
export async function checkRateLimit(
  limiter: Ratelimit,
  identifier: string
): Promise<{ success: boolean; remaining: number; reset: number }> {
  const { success, limit, reset, remaining } = await limiter.limit(identifier);

  if (!success) {
    throw new RateLimitError(
      `Too many requests. Try again in ${Math.ceil((reset - Date.now()) / 1000)} seconds.`,
      { limit, reset, remaining: 0 }
    );
  }

  return { success, remaining, reset };
}
```

**Fichier**: `middleware.ts`
```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { apiRateLimiter, checkRateLimit } from '@/lib/rate-limiter';

export async function middleware(request: NextRequest) {
  // Rate limit sur routes API
  if (request.nextUrl.pathname.startsWith('/api')) {
    const ip = request.ip ?? request.headers.get('x-forwarded-for') ?? 'unknown';

    try {
      await checkRateLimit(apiRateLimiter, ip);
    } catch (error) {
      return NextResponse.json(
        { error: 'Too many requests', message: error.message },
        { status: 429 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
```

**Fichier**: `src/app/api/auth/[...nextauth]/route.ts`
```typescript
import { loginRateLimiter, checkRateLimit } from '@/lib/rate-limiter';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      async authorize(credentials, req) {
        // Rate limit par email
        try {
          await checkRateLimit(loginRateLimiter, credentials.email);
        } catch (error) {
          throw new Error('Too many login attempts');
        }

        // ... reste du code
      },
    }),
  ],
};
```

**.env à mettre à jour**:
```env
# Upstash Redis (gratuit jusqu'à 10k requêtes/jour)
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token
```

#### 1.2 CSRF Protection (1 jour)

**Installation**:
```bash
npm install edge-csrf
```

**Fichier**: `middleware.ts` (à fusionner avec rate limiting)
```typescript
import { createCsrfProtect } from 'edge-csrf';

const csrfProtect = createCsrfProtect({
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    name: '__Host-csrf-token',
  },
});

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // CSRF protection sur mutations
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
    const csrfError = await csrfProtect(request, response);

    if (csrfError) {
      return NextResponse.json(
        { error: 'Invalid CSRF token' },
        { status: 403 }
      );
    }
  }

  // ... rate limiting

  return response;
}
```

#### 1.3 Input Validation Client (2 jours)

**Installation**:
```bash
npm install react-hook-form @hookform/resolvers
```

**Fichier**: `src/hooks/useZodForm.ts`
```typescript
import { useForm, UseFormProps } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z, ZodSchema } from 'zod';

export function useZodForm<T extends ZodSchema>(
  schema: T,
  options?: Omit<UseFormProps<z.infer<T>>, 'resolver'>
) {
  return useForm<z.infer<T>>({
    ...options,
    resolver: zodResolver(schema),
  });
}
```

**Exemple d'utilisation**: `src/app/boutique/produits/page.tsx`
```typescript
import { useZodForm } from '@/hooks/useZodForm';
import { produitSchema } from '@/lib/schemas';  // Réutiliser schémas API !

function NouveauProduitForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useZodForm(produitSchema);

  const onSubmit = async (data) => {
    const response = await fetch('/api/produits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      toast.success('Produit créé');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <label>Nom</label>
        <input {...register('nom')} />
        {errors.nom && <span className="text-red-500">{errors.nom.message}</span>}
      </div>

      <div>
        <label>Prix d'achat</label>
        <input type="number" {...register('prixAchat', { valueAsNumber: true })} />
        {errors.prixAchat && <span className="text-red-500">{errors.prixAchat.message}</span>}
      </div>

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
      </button>
    </form>
  );
}
```

#### 1.4 Password Policy (1 jour)

**Fichier**: `src/lib/schemas/auth.schema.ts`
```typescript
import { z } from 'zod';

export const passwordSchema = z
  .string()
  .min(8, 'Minimum 8 caractères')
  .regex(/[a-z]/, 'Doit contenir une minuscule')
  .regex(/[A-Z]/, 'Doit contenir une majuscule')
  .regex(/[0-9]/, 'Doit contenir un chiffre')
  .regex(/[^a-zA-Z0-9]/, 'Doit contenir un caractère spécial');

export const registerSchema = z.object({
  name: z.string().min(2, 'Nom trop court'),
  email: z.string().email('Email invalide'),
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
});

export const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
});
```

---

## 📊 PHASE 2: DESIGN SYSTEM (Semaines 3-4)

### 🎨 Objectif: Code cohérent et maintenable

#### 2.1 Setup Tokens (2 jours)

**Fichier**: `src/design-system/tokens.ts`
```typescript
export const tokens = {
  // Palette de couleurs principale
  colors: {
    brand: {
      primary: {
        50: '#eff6ff',
        100: '#dbeafe',
        200: '#bfdbfe',
        300: '#93c5fd',
        400: '#60a5fa',
        500: '#3b82f6',  // DEFAULT
        600: '#2563eb',
        700: '#1d4ed8',
        800: '#1e40af',
        900: '#1e3a8a',
        950: '#172554',
      },
      secondary: {
        50: '#faf5ff',
        500: '#a855f7',  // DEFAULT
        950: '#3b0764',
      },
    },

    // Couleurs sémantiques
    semantic: {
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6',
    },

    // Neutrals
    neutral: {
      0: '#ffffff',
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827',
      950: '#030712',
      1000: '#000000',
    },
  },

  // Espacements
  spacing: {
    '0': '0',
    'px': '1px',
    '0.5': '0.125rem',  // 2px
    '1': '0.25rem',     // 4px
    '1.5': '0.375rem',  // 6px
    '2': '0.5rem',      // 8px
    '2.5': '0.625rem',  // 10px
    '3': '0.75rem',     // 12px
    '3.5': '0.875rem',  // 14px
    '4': '1rem',        // 16px
    '5': '1.25rem',     // 20px
    '6': '1.5rem',      // 24px
    '7': '1.75rem',     // 28px
    '8': '2rem',        // 32px
    '9': '2.25rem',     // 36px
    '10': '2.5rem',     // 40px
    '12': '3rem',       // 48px
    '14': '3.5rem',     // 56px
    '16': '4rem',       // 64px
  },

  // Typographie
  typography: {
    fontFamily: {
      sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      mono: ['Fira Code', 'Monaco', 'Courier New', 'monospace'],
    },

    fontSize: {
      xs: ['0.75rem', { lineHeight: '1rem', letterSpacing: '0.025em' }],
      sm: ['0.875rem', { lineHeight: '1.25rem' }],
      base: ['1rem', { lineHeight: '1.5rem' }],
      lg: ['1.125rem', { lineHeight: '1.75rem' }],
      xl: ['1.25rem', { lineHeight: '1.75rem' }],
      '2xl': ['1.5rem', { lineHeight: '2rem' }],
      '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
      '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
      '5xl': ['3rem', { lineHeight: '1' }],
    },

    fontWeight: {
      thin: '100',
      light: '300',
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800',
      black: '900',
    },
  },

  // Border radius
  borderRadius: {
    none: '0',
    sm: '0.125rem',
    DEFAULT: '0.375rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    '2xl': '1.5rem',
    '3xl': '2rem',
    full: '9999px',
  },

  // Shadows
  shadows: {
    none: 'none',
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
  },

  // Transitions
  transitions: {
    fast: '100ms',
    base: '150ms',
    slow: '300ms',
    slower: '500ms',
  },

  // Z-index
  zIndex: {
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modalBackdrop: 1040,
    modal: 1050,
    popover: 1060,
    tooltip: 1070,
  },
} as const;

export type Tokens = typeof tokens;
```

**Fichier**: `tailwind.config.ts`
```typescript
import type { Config } from 'tailwindcss';
import { tokens } from './src/design-system/tokens';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: tokens.colors.brand,
        ...tokens.colors.semantic,
        neutral: tokens.colors.neutral,
      },
      spacing: tokens.spacing,
      fontFamily: tokens.typography.fontFamily,
      fontSize: tokens.typography.fontSize,
      fontWeight: tokens.typography.fontWeight,
      borderRadius: tokens.borderRadius,
      boxShadow: tokens.shadows,
      transitionDuration: tokens.transitions,
      zIndex: tokens.zIndex,
    },
  },
  plugins: [],
};

export default config;
```

#### 2.2 Composants Atomiques (3 jours)

**Installation**:
```bash
npm install class-variance-authority clsx tailwind-merge
```

**Fichier**: `src/lib/utils.ts`
```typescript
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

**Fichier**: `src/design-system/Button.tsx`
```typescript
import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  // Base styles
  'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-brand-primary-500 text-white shadow hover:bg-brand-primary-600 focus-visible:ring-brand-primary-500',
        secondary: 'bg-brand-secondary-500 text-white shadow hover:bg-brand-secondary-600 focus-visible:ring-brand-secondary-500',
        outline: 'border-2 border-brand-primary-500 text-brand-primary-600 hover:bg-brand-primary-50 dark:hover:bg-brand-primary-950',
        ghost: 'text-brand-primary-600 hover:bg-brand-primary-50 dark:hover:bg-brand-primary-950',
        danger: 'bg-error text-white shadow hover:bg-red-600 focus-visible:ring-error',
        success: 'bg-success text-white shadow hover:bg-green-600 focus-visible:ring-success',
      },
      size: {
        sm: 'h-9 px-3 text-sm',
        md: 'h-10 px-4 text-base',
        lg: 'h-11 px-6 text-lg',
        xl: 'h-12 px-8 text-xl',
        icon: 'h-10 w-10',
      },
      fullWidth: {
        true: 'w-full',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      fullWidth,
      isLoading,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size, fullWidth, className }))}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
        {!isLoading && leftIcon && <span>{leftIcon}</span>}
        {children}
        {!isLoading && rightIcon && <span>{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
```

**Utilisation**:
```tsx
// Au lieu de:
<button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">
  Enregistrer
</button>

// Utiliser:
<Button variant="primary" size="md">
  Enregistrer
</Button>

<Button variant="danger" isLoading>
  Suppression...
</Button>

<Button variant="outline" leftIcon={<Plus />}>
  Nouveau produit
</Button>
```

**Autres composants à créer** (même pattern):
- `Input.tsx`
- `Select.tsx`
- `Card.tsx`
- `Badge.tsx`
- `Alert.tsx`
- `Modal.tsx`
- `Tooltip.tsx`

#### 2.3 Storybook (2 jours)

**Installation**:
```bash
npx storybook@latest init
```

**Fichier**: `src/design-system/Button.stories.tsx`
```tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from './Button';

const meta: Meta<typeof Button> = {
  title: 'Design System/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'outline', 'ghost', 'danger', 'success'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl', 'icon'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Primary Button',
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="space-x-2">
        <Button variant="primary">Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="danger">Danger</Button>
        <Button variant="success">Success</Button>
      </div>
    </div>
  ),
};

export const WithIcons: Story = {
  render: () => (
    <div className="space-x-2">
      <Button leftIcon={<Plus />}>Nouveau</Button>
      <Button variant="danger" leftIcon={<Trash2 />}>Supprimer</Button>
      <Button variant="outline" rightIcon={<Plus />}>Ajouter</Button>
    </div>
  ),
};

export const Loading: Story = {
  args: {
    isLoading: true,
    children: 'Loading...',
  },
};
```

---

## ⚡ PHASE 3: PERFORMANCES (Semaines 5-6)

### 🚀 Objectif: -50% temps de chargement

#### 3.1 Redis Caching (3 jours)

**Installation**:
```bash
npm install ioredis
```

**Fichier**: `src/lib/redis.ts`
```typescript
import Redis from 'ioredis';

const getRedisUrl = () => {
  if (process.env.REDIS_URL) {
    return process.env.REDIS_URL;
  }

  throw new Error('REDIS_URL is not defined');
};

export const redis = new Redis(getRedisUrl());

// Helper pour cache simple
export async function cached<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 300 // 5 minutes par défaut
): Promise<T> {
  // Essayer de récupérer du cache
  const cached = await redis.get(key);

  if (cached) {
    return JSON.parse(cached);
  }

  // Sinon, exécuter fetcher
  const data = await fetcher();

  // Mettre en cache
  await redis.setex(key, ttl, JSON.stringify(data));

  return data;
}

// Invalidation par pattern
export async function invalidateCache(pattern: string) {
  const keys = await redis.keys(pattern);

  if (keys.length > 0) {
    await redis.del(...keys);
  }
}
```

**Exemple d'utilisation**: `src/app/api/produits/route.ts`
```typescript
import { cached, invalidateCache } from '@/lib/redis';

export const GET = withErrorHandler(async (request) => {
  const session = await getServerSession(authOptions);
  const boutiqueId = await getBoutiqueIdFromSession(request);

  // Cache key unique par boutique
  const cacheKey = `produits:${boutiqueId}`;

  const produits = await cached(
    cacheKey,
    async () => {
      return prisma.produit.findMany({
        where: { boutiqueId },
        include: { categorie: true, stocks: true },
      });
    },
    300 // 5 minutes
  );

  return NextResponse.json(
    { produits },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    }
  );
});

export const POST = withErrorHandler(async (request) => {
  // ... création produit

  // Invalider cache après mutation
  await invalidateCache(`produits:${boutiqueId}`);

  return NextResponse.json(produit);
});
```

#### 3.2 Code Splitting (2 jours)

**Fichier**: `next.config.ts`
```typescript
const nextConfig = {
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'recharts',
      '@tanstack/react-query',
    ],
  },

  // Webpack optimization
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          default: false,
          vendors: false,
          // Vendor chunk (node_modules)
          vendor: {
            name: 'vendor',
            chunks: 'all',
            test: /node_modules/,
            priority: 20,
          },
          // Common chunk (réutilisé 2+ fois)
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            priority: 10,
            reuseExistingChunk: true,
            enforce: true,
          },
          // Recharts à part (lourd)
          recharts: {
            name: 'recharts',
            test: /[\\/]node_modules[\\/]recharts[\\/]/,
            chunks: 'all',
            priority: 30,
          },
        },
      };
    }

    return config;
  },
};

export default nextConfig;
```

**Dynamic imports** pour composants lourds:
```typescript
// src/app/dashboard/rapports/page.tsx
import dynamic from 'next/dynamic';

// ❌ AVANT: Import direct
import { LineChart } from 'recharts';

// ✅ APRÈS: Dynamic import
const LineChart = dynamic(
  () => import('recharts').then((mod) => mod.LineChart),
  {
    loading: () => <Skeleton className="h-64" />,
    ssr: false, // Graphique pas besoin SSR
  }
);

const RapportsPage = () => {
  return (
    <div>
      <h1>Rapports</h1>
      {/* Chargé seulement quand visible */}
      <LineChart data={data} />
    </div>
  );
};
```

#### 3.3 Database Indexes (1 jour)

**Fichier**: `prisma/schema.prisma` - Ajouter indexes critiques:
```prisma
model Vente {
  // ...existant

  // ⭐ Indexes pour requêtes fréquentes
  @@index([boutiqueId, dateVente(sort: Desc)])  // Dashboard
  @@index([boutiqueId, statut])                 // Filtrer par statut
  @@index([clientId, dateVente])                // Historique client
  @@index([userId, dateVente])                  // Ventes par vendeur
}

model Produit {
  // ⭐ Recherche texte
  @@index([boutiqueId, nom])
  @@index([categorieId, nom])

  // ⭐ Tri par prix
  @@index([boutiqueId, prixVente])
}

model Stock {
  // ⭐ Alertes stock
  @@index([boutiqueId, quantite])
  @@index([quantite])  // Tous stocks faibles
}
```

Après modification schema:
```bash
npx prisma migrate dev --name add_performance_indexes
```

---

## 🧪 PHASE 4: TESTS (Semaines 7-8)

### ✅ Objectif: 60% coverage minimum

#### 4.1 Setup Testing (1 jour)

**Installation**:
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
npm install -D @vitejs/plugin-react
```

**Fichier**: `vitest.config.ts`
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/design-system/**/*.stories.tsx',
        '**/*.d.ts',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

**Fichier**: `vitest.setup.ts`
```typescript
import '@testing-library/jest-dom';
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Cleanup après chaque test
afterEach(() => {
  cleanup();
});
```

**Fichier**: `package.json`
```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  }
}
```

#### 4.2 Tests Unitaires (3 jours)

**Exemple**: `src/lib/error-handler.test.ts`
```typescript
import { describe, it, expect } from 'vitest';
import {
  AppError,
  ValidationError,
  NotFoundError,
  formatZodErrors,
} from './error-handler';

describe('AppError', () => {
  it('should create error with correct properties', () => {
    const error = new AppError('Test error', 400);

    expect(error.message).toBe('Test error');
    expect(error.statusCode).toBe(400);
    expect(error.isOperational).toBe(true);
  });
});

describe('ValidationError', () => {
  it('should format Zod errors correctly', () => {
    const zodIssues = [
      { path: ['email'], message: 'Invalid email' },
      { path: ['password'], message: 'Too short' },
    ];

    const formatted = formatZodErrors(zodIssues);

    expect(formatted).toEqual({
      email: ['Invalid email'],
      password: ['Too short'],
    });
  });
});

describe('NotFoundError', () => {
  it('should have 404 status code', () => {
    const error = new NotFoundError('User not found');

    expect(error.statusCode).toBe(404);
    expect(error.message).toBe('User not found');
  });
});
```

**Exemple**: `src/design-system/Button.test.tsx`
```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('renders correctly', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled when isLoading is true', () => {
    render(<Button isLoading>Loading</Button>);

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('renders correct variant classes', () => {
    const { container } = render(<Button variant="danger">Delete</Button>);

    expect(container.firstChild).toHaveClass('bg-error');
  });
});
```

#### 4.3 Tests d'Intégration (2 jours)

**Exemple**: `src/app/api/produits/route.test.ts`
```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GET, POST } from './route';
import { prisma } from '@/lib/prisma';

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    produit: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
  },
}));

// Mock NextAuth
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(() => ({
    user: {
      id: 'user-1',
      boutiqueId: 'boutique-1',
      role: 'GESTIONNAIRE',
    },
  })),
}));

describe('GET /api/produits', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return produits for authenticated user', async () => {
    const mockProduits = [
      { id: '1', nom: 'Produit 1', prixVente: 1000 },
      { id: '2', nom: 'Produit 2', prixVente: 2000 },
    ];

    vi.mocked(prisma.produit.findMany).mockResolvedValue(mockProduits);

    const request = new Request('http://localhost:3000/api/produits');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.produits).toEqual(mockProduits);
  });

  it('should return 401 for unauthenticated user', async () => {
    vi.mocked(getServerSession).mockResolvedValue(null);

    const request = new Request('http://localhost:3000/api/produits');
    const response = await GET(request);

    expect(response.status).toBe(401);
  });
});

describe('POST /api/produits', () => {
  it('should create produit with valid data', async () => {
    const mockProduit = { id: '1', nom: 'Nouveau produit' };
    vi.mocked(prisma.produit.create).mockResolvedValue(mockProduit);

    const request = new Request('http://localhost:3000/api/produits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nom: 'Nouveau produit',
        prixAchat: 500,
        prixVente: 1000,
        categorieId: 'cat-1',
        seuilAlerte: 5,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data).toEqual(mockProduit);
  });

  it('should return 400 for invalid data', async () => {
    const request = new Request('http://localhost:3000/api/produits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nom: '',  // Invalide
        prixAchat: -100,  // Invalide
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
  });
});
```

#### 4.4 Tests E2E (2 jours)

**Installation**:
```bash
npm install -D @playwright/test
npx playwright install
```

**Fichier**: `e2e/login.spec.ts`
```typescript
import { test, expect } from '@playwright/test';

test.describe('Login Flow', () => {
  test('should login successfully with valid credentials', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[name="email"]', 'admin@test.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Devrait rediriger vers dashboard
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('h1')).toContainText('Dashboard');
  });

  test('should show error with invalid credentials', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[name="email"]', 'wrong@test.com');
    await page.fill('input[name="password"]', 'wrongpass');
    await page.click('button[type="submit"]');

    // Devrait afficher erreur
    await expect(page.locator('.error')).toBeVisible();
    await expect(page.locator('.error')).toContainText('Identifiants invalides');
  });
});
```

**Fichier**: `e2e/produits.spec.ts`
```typescript
import { test, expect } from '@playwright/test';

test.describe('Produits Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login avant chaque test
    await page.goto('/login');
    await page.fill('input[name="email"]', 'gestionnaire@test.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/boutique');
  });

  test('should create new product', async ({ page }) => {
    await page.goto('/boutique/produits');
    await page.click('button:has-text("Nouveau produit")');

    // Remplir formulaire
    await page.fill('input[name="nom"]', 'Produit Test');
    await page.fill('input[name="prixAchat"]', '500');
    await page.fill('input[name="prixVente"]', '1000');
    await page.selectOption('select[name="categorieId"]', { index: 1 });
    await page.fill('input[name="seuilAlerte"]', '5');

    await page.click('button[type="submit"]');

    // Vérifier toast success
    await expect(page.locator('.toast')).toContainText('Produit créé');

    // Vérifier dans liste
    await expect(page.locator('table')).toContainText('Produit Test');
  });

  test('should delete product', async ({ page }) => {
    await page.goto('/boutique/produits');

    // Cliquer sur bouton supprimer
    await page.click('button[aria-label="Supprimer"]:first-of-type');

    // Confirmer modal
    await page.click('button:has-text("Confirmer")');

    // Vérifier toast
    await expect(page.locator('.toast')).toContainText('Produit supprimé');
  });
});
```

---

## 📦 LIVRABLES

### Semaine 2: Sécurité
- [ ] Rate limiting opérationnel
- [ ] CSRF protection activée
- [ ] Input validation sur 5+ pages
- [ ] Password policy stricte
- [ ] Documentation sécurité

### Semaine 4: Design System
- [ ] Tokens centralisés
- [ ] 8+ composants atomiques
- [ ] Storybook déployé
- [ ] Guide d'utilisation
- [ ] Migrer 10+ pages

### Semaine 6: Performances
- [ ] Redis configuré
- [ ] Cache sur 10+ endpoints
- [ ] Code splitting actif
- [ ] Bundle size -30%
- [ ] Indexes database

### Semaine 8: Tests
- [ ] 60% code coverage
- [ ] Tests unitaires (50+)
- [ ] Tests intégration (20+)
- [ ] Tests E2E (10+)
- [ ] CI/CD avec tests

---

## 🎯 MESURES DE SUCCÈS

| Métrique | Avant | Cible | KPI |
|----------|-------|-------|-----|
| **Sécurité** | | | |
| Vulnérabilités critiques | 4 | 0 | ✅ |
| Rate limit coverage | 0% | 100% | ✅ |
| **Performance** | | | |
| Time to Interactive | 4.2s | <3.0s | -28% |
| Bundle size | 350kb | <250kb | -29% |
| Cache hit rate | 0% | >80% | +80% |
| **Qualité** | | | |
| Code coverage | 0% | 60% | +60% |
| Components DS | 0 | 15 | +15 |
| Storybook stories | 0 | 30 | +30 |
| **UX** | | | |
| Form errors instant | 0% | 100% | +100% |
| Loading states | 60% | 100% | +40% |

---

## 💰 ESTIMATION BUDGET TEMPS

| Phase | Jours | Coût Dev (500€/j) |
|-------|-------|-------------------|
| Phase 1: Sécurité | 7j | 3,500€ |
| Phase 2: Design System | 7j | 3,500€ |
| Phase 3: Performances | 6j | 3,000€ |
| Phase 4: Tests | 8j | 4,000€ |
| **TOTAL** | **28j** | **14,000€** |

**ROI Estimé**:
- Réduction bugs: -70% (économie support)
- Temps développement futurs: -40% (design system)
- Satisfaction utilisateur: +50% (UX améliorée)
- Sécurité données: Invaluable

---

## ✅ PRÊT À COMMENCER ?

**Commande pour démarrer Phase 1**:
```bash
# 1. Créer branche
git checkout -b feature/security-improvements

# 2. Installer dépendances
npm install @upstash/ratelimit @upstash/redis edge-csrf react-hook-form @hookform/resolvers

# 3. Créer fichiers
mkdir -p src/lib
touch src/lib/rate-limiter.ts
touch middleware.ts
touch src/hooks/useZodForm.ts

# 4. Suivre le plan ci-dessus !
```

**Questions ? Bloqué ?**
Référez-vous à `AUDIT_RAPPORT_COMPLET.md` pour le contexte complet.

---

**Document créé le**: 11 Octobre 2025
**Dernière mise à jour**: 11 Octobre 2025
**Auteur**: Équipe de développement Gestion Commerce
