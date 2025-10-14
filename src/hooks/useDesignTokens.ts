import { useMemo } from 'react';
import { 
  colors, 
  semanticTokens, 
  spacing, 
  borderRadius, 
  fontSize, 
  fontWeight, 
  shadows, 
  zIndex,
  animation,
  getColor,
  getSemanticColor
} from '@/styles/design-tokens';

export const useDesignTokens = () => {
  const tokens = useMemo(() => ({
    // Couleurs
    colors,
    semanticColors: semanticTokens.colors,
    
    // Espacements
    spacing,
    semanticSpacing: semanticTokens.spacing,
    
    // Autres tokens
    borderRadius,
    fontSize,
    fontWeight,
    shadows,
    zIndex,
    animation,
    
    // Utilitaires
    getColor,
    getSemanticColor,
    
    // Classes CSS générées
    css: {
      // Classes de couleurs de fond
      bg: {
        primary: `bg-[${semanticTokens.colors.background.primary}]`,
        secondary: `bg-[${semanticTokens.colors.background.secondary}]`,
        tertiary: `bg-[${semanticTokens.colors.background.tertiary}]`,
        success: `bg-[${semanticTokens.colors.feedback.successBg}]`,
        warning: `bg-[${semanticTokens.colors.feedback.warningBg}]`,
        error: `bg-[${semanticTokens.colors.feedback.errorBg}]`,
        info: `bg-[${semanticTokens.colors.feedback.infoBg}]`,
      },
      
      // Classes de couleurs de texte
      text: {
        primary: `text-[${semanticTokens.colors.text.primary}]`,
        secondary: `text-[${semanticTokens.colors.text.secondary}]`,
        tertiary: `text-[${semanticTokens.colors.text.tertiary}]`,
        inverse: `text-[${semanticTokens.colors.text.inverse}]`,
        link: `text-[${semanticTokens.colors.text.link}]`,
        success: `text-[${semanticTokens.colors.feedback.success}]`,
        warning: `text-[${semanticTokens.colors.feedback.warning}]`,
        error: `text-[${semanticTokens.colors.feedback.error}]`,
        info: `text-[${semanticTokens.colors.feedback.info}]`,
      },
      
      // Classes de bordures
      border: {
        primary: `border-[${semanticTokens.colors.border.primary}]`,
        secondary: `border-[${semanticTokens.colors.border.secondary}]`,
        focus: `border-[${semanticTokens.colors.border.focus}]`,
        error: `border-[${semanticTokens.colors.border.error}]`,
        success: `border-[${semanticTokens.colors.border.success}]`,
      },
      
      // Classes d'espacement
      spacing: {
        component: {
          xs: `p-[${semanticTokens.spacing.component.xs}]`,
          sm: `p-[${semanticTokens.spacing.component.sm}]`,
          md: `p-[${semanticTokens.spacing.component.md}]`,
          lg: `p-[${semanticTokens.spacing.component.lg}]`,
          xl: `p-[${semanticTokens.spacing.component.xl}]`,
        },
        layout: {
          xs: `p-[${semanticTokens.spacing.layout.xs}]`,
          sm: `p-[${semanticTokens.spacing.layout.sm}]`,
          md: `p-[${semanticTokens.spacing.layout.md}]`,
          lg: `p-[${semanticTokens.spacing.layout.lg}]`,
          xl: `p-[${semanticTokens.spacing.layout.xl}]`,
        },
      },
    },
  }), []);

  return tokens;
};

// Hook spécialisé pour les couleurs
export const useColors = () => {
  return useMemo(() => ({
    ...colors,
    semantic: semanticTokens.colors,
    get: getColor,
    getSemantic: getSemanticColor,
  }), []);
};

// Hook spécialisé pour les espacements
export const useSpacing = () => {
  return useMemo(() => ({
    ...spacing,
    semantic: semanticTokens.spacing,
  }), []);
};

// Hook pour générer des styles inline avec les tokens
export const useTokenStyles = () => {
  const tokens = useDesignTokens();
  
  const createStyle = useMemo(() => ({
    // Couleurs de fond
    backgroundColor: (colorPath: string) => ({
      backgroundColor: tokens.getSemanticColor(colorPath) || tokens.getColor(colorPath)
    }),
    
    // Couleurs de texte
    color: (colorPath: string) => ({
      color: tokens.getSemanticColor(colorPath) || tokens.getColor(colorPath)
    }),
    
    // Couleurs de bordure
    borderColor: (colorPath: string) => ({
      borderColor: tokens.getSemanticColor(colorPath) || tokens.getColor(colorPath)
    }),
    
    // Espacement
    padding: (spacingKey: keyof typeof spacing) => ({
      padding: tokens.spacing[spacingKey]
    }),
    
    margin: (spacingKey: keyof typeof spacing) => ({
      margin: tokens.spacing[spacingKey]
    }),
    
    // Bordures arrondies
    borderRadius: (radiusKey: keyof typeof borderRadius) => ({
      borderRadius: tokens.borderRadius[radiusKey]
    }),
    
    // Ombres
    boxShadow: (shadowKey: keyof typeof shadows) => ({
      boxShadow: tokens.shadows[shadowKey]
    }),
  }), [tokens]);
  
  return createStyle;
};

// Types pour l'autocomplétion
export type ColorToken = keyof typeof colors;
export type SemanticColorToken = keyof typeof semanticTokens.colors;
export type SpacingToken = keyof typeof spacing;
export type BorderRadiusToken = keyof typeof borderRadius;
export type ShadowToken = keyof typeof shadows;
