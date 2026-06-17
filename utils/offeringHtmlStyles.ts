import type { MixedStyleDeclaration } from 'react-native-render-html';
import type { getColors } from '@/constants/theme';

/**
 * Canonical RenderHTML styles for offering API HTML.
 * Kept in sync with the legacy project detail screen — do not change
 * unless the API HTML rendering requirements change.
 */
type AppColors = ReturnType<typeof getColors>;

export function getOfferingDescriptionHtmlProps(
  colors: AppColors,
  contentWidth: number,
  html: string,
) {
  return {
    contentWidth,
    source: { html },
    enableCSSInlineProcessing: true as const,
    classesStyles: {
      title: {
        color: colors.text.primary,
        backgroundColor: 'transparent',
        marginTop: 12,
        marginBottom: 8,
      },
      desc: {
        color: colors.text.primary,
        backgroundColor: 'transparent',
        textAlign: 'justify' as const,
        marginBottom: 10,
      },
    },
    baseStyle: {
      color: colors.text.primary,
      textAlign: 'justify' as const,
    },
    tagsStyles: getOfferingDescriptionTagsStyles(colors),
  };
}

export function getOfferingFaqHtmlProps(
  colors: AppColors,
  contentWidth: number,
  html: string,
) {
  return {
    contentWidth,
    source: { html },
    enableCSSInlineProcessing: true as const,
    classesStyles: {
      'faq-answer': {
        color: colors.text.primary,
        backgroundColor: 'transparent',
        marginTop: 6,
        marginBottom: 16,
      },
      'faq-question': {
        color: colors.text.primary,
        backgroundColor: 'transparent',
        marginTop: 20,
        marginBottom: 8,
        fontWeight: '600' as const,
      },
    },
    baseStyle: {
      color: colors.text.primary,
    },
    tagsStyles: getOfferingFaqTagsStyles(colors),
  };
}

function getOfferingDescriptionTagsStyles(
  colors: AppColors,
): Record<string, MixedStyleDeclaration> {
  return {
    body: { textAlign: 'justify', marginBottom: 4 },
    div: { textAlign: 'justify', marginBottom: 10 },
    p: {
      fontSize: 14,
      lineHeight: 22,
      color: colors.text.secondary,
      textAlign: 'justify',
      marginTop: 0,
      marginBottom: 12,
    },
    ul: {
      marginTop: 4,
      marginBottom: 12,
      paddingLeft: 20,
    },
    ol: {
      marginTop: 4,
      marginBottom: 12,
      paddingLeft: 20,
    },
    li: {
      marginBottom: 8,
      lineHeight: 22,
      textAlign: 'justify',
    },
    h1: {
      fontSize: 22,
      fontWeight: '700',
      marginTop: 8,
      marginBottom: 10,
      color: colors.text.primary,
      textAlign: 'left',
    },
    h2: {
      fontSize: 18,
      fontWeight: '600',
      marginTop: 8,
      marginBottom: 8,
      color: colors.text.primary,
      textAlign: 'left',
    },
    h3: {
      fontSize: 16,
      fontWeight: '600',
      marginTop: 12,
      marginBottom: 6,
      color: colors.text.primary,
      textAlign: 'left',
    },
    h4: {
      fontSize: 15,
      fontWeight: '600',
      marginTop: 10,
      marginBottom: 4,
      color: colors.text.primary,
      textAlign: 'left',
    },
    strong: { fontWeight: 'bold' },
    hr: {
      height: 1,
      marginVertical: 14,
      backgroundColor: colors.border.primary,
    },
    dl: { marginBottom: 12 },
    dt: {
      fontWeight: '600',
      marginTop: 12,
      marginBottom: 4,
      color: colors.text.primary,
    },
    dd: {
      marginBottom: 10,
      marginLeft: 8,
      color: colors.text.secondary,
      lineHeight: 22,
      textAlign: 'justify',
    },
    span: { textAlign: 'justify' },
  };
}

function getOfferingFaqTagsStyles(
  colors: AppColors,
): Record<string, MixedStyleDeclaration> {
  return {
    body: { marginBottom: 4 },
    div: { marginBottom: 10 },
    p: {
      fontSize: 14,
      lineHeight: 22,
      color: colors.text.secondary,
      marginTop: 0,
      marginBottom: 12,
    },
    ul: {
      marginTop: 4,
      marginBottom: 12,
      paddingLeft: 20,
    },
    ol: {
      marginTop: 4,
      marginBottom: 12,
      paddingLeft: 20,
    },
    li: {
      marginBottom: 8,
      lineHeight: 22,
    },
    h1: {
      fontSize: 22,
      fontWeight: '700',
      marginTop: 8,
      marginBottom: 10,
      color: colors.text.primary,
    },
    h2: {
      fontSize: 18,
      fontWeight: '600',
      marginTop: 8,
      marginBottom: 8,
      color: colors.text.primary,
    },
    h3: {
      fontSize: 16,
      fontWeight: '600',
      marginTop: 12,
      marginBottom: 6,
      color: colors.text.primary,
    },
    h4: {
      fontSize: 15,
      fontWeight: '600',
      marginTop: 10,
      marginBottom: 4,
      color: colors.text.primary,
    },
    strong: { fontWeight: 'bold' },
    hr: {
      height: 1,
      marginVertical: 14,
      backgroundColor: colors.border.primary,
    },
    dl: { marginBottom: 12 },
    dt: {
      fontWeight: '600',
      marginTop: 12,
      marginBottom: 4,
      color: colors.text.primary,
    },
    dd: {
      marginBottom: 10,
      marginLeft: 8,
      color: colors.text.secondary,
      lineHeight: 22,
    },
  };
}
