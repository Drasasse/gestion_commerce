'use client';

import { useState, useEffect } from 'react';

interface ScreenSize {
  width: number;
  height: number;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isSmall: boolean;
  isMedium: boolean;
  isLarge: boolean;
  isXLarge: boolean;
}

interface UseScreenSizeOptions {
  mobileBreakpoint?: number;
  tabletBreakpoint?: number;
  desktopBreakpoint?: number;
  debounceMs?: number;
}

const defaultOptions: Required<UseScreenSizeOptions> = {
  mobileBreakpoint: 768,
  tabletBreakpoint: 1024,
  desktopBreakpoint: 1280,
  debounceMs: 100,
};

export function useScreenSize(options: UseScreenSizeOptions = {}): ScreenSize {
  const opts = { ...defaultOptions, ...options };
  
  const [screenSize, setScreenSize] = useState<ScreenSize>(() => {
    // Valeurs par défaut pour le SSR
    if (typeof window === 'undefined') {
      return {
        width: 1024,
        height: 768,
        isMobile: false,
        isTablet: true,
        isDesktop: false,
        isSmall: false,
        isMedium: true,
        isLarge: false,
        isXLarge: false,
      };
    }

    const width = window.innerWidth;
    const height = window.innerHeight;

    return {
      width,
      height,
      isMobile: width < opts.mobileBreakpoint,
      isTablet: width >= opts.mobileBreakpoint && width < opts.desktopBreakpoint,
      isDesktop: width >= opts.desktopBreakpoint,
      isSmall: width < 640,
      isMedium: width >= 640 && width < 1024,
      isLarge: width >= 1024 && width < 1280,
      isXLarge: width >= 1280,
    };
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let timeoutId: NodeJS.Timeout;

    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const width = window.innerWidth;
        const height = window.innerHeight;

        setScreenSize({
          width,
          height,
          isMobile: width < opts.mobileBreakpoint,
          isTablet: width >= opts.mobileBreakpoint && width < opts.desktopBreakpoint,
          isDesktop: width >= opts.desktopBreakpoint,
          isSmall: width < 640,
          isMedium: width >= 640 && width < 1024,
          isLarge: width >= 1024 && width < 1280,
          isXLarge: width >= 1280,
        });
      }, opts.debounceMs);
    };

    window.addEventListener('resize', handleResize);
    
    // Appel initial pour s'assurer que les valeurs sont correctes
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
    };
  }, [opts.mobileBreakpoint, opts.tabletBreakpoint, opts.desktopBreakpoint, opts.debounceMs]);

  return screenSize;
}

// Hook simplifié pour détecter uniquement si on est sur mobile
export function useIsMobile(breakpoint: number = 768): boolean {
  const { isMobile } = useScreenSize({ mobileBreakpoint: breakpoint });
  return isMobile;
}

// Hook pour détecter l'orientation
export function useOrientation() {
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>(() => {
    if (typeof window === 'undefined') return 'landscape';
    return window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOrientationChange = () => {
      setOrientation(window.innerHeight > window.innerWidth ? 'portrait' : 'landscape');
    };

    window.addEventListener('resize', handleOrientationChange);
    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      window.removeEventListener('resize', handleOrientationChange);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  return orientation;
}

// Hook pour détecter si l'utilisateur préfère les animations réduites
export function usePrefersReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  return prefersReducedMotion;
}

// Hook pour détecter le thème préféré du système
export function usePrefersColorScheme(): 'light' | 'dark' {
  const [colorScheme, setColorScheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setColorScheme(mediaQuery.matches ? 'dark' : 'light');

    const handleChange = (event: MediaQueryListEvent) => {
      setColorScheme(event.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  return colorScheme;
}