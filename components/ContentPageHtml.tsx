import React, { useMemo } from 'react';
import { Dimensions } from 'react-native';
import RenderHTML from 'react-native-render-html';
import { useTheme } from '@/contexts/ThemeContext';
import { getColors } from '@/constants/theme';
import { getOfferingDescriptionHtmlProps } from '@/utils/offeringHtmlStyles';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type ContentPageHtmlProps = Readonly<{
  html: string;
  horizontalPadding?: number;
}>;

export default function ContentPageHtml({ html, horizontalPadding = 48 }: ContentPageHtmlProps) {
  const { theme } = useTheme();
  const colors = getColors(theme);

  const props = useMemo(
    () => getOfferingDescriptionHtmlProps(colors, SCREEN_WIDTH - horizontalPadding, html),
    [colors, html, horizontalPadding],
  );

  if (!html?.trim()) return null;

  return <RenderHTML {...props} />;
}
