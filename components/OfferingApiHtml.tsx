import React, { useMemo } from 'react';
import { Dimensions } from 'react-native';
import RenderHTML from 'react-native-render-html';
import { useTheme } from '@/contexts/ThemeContext';
import { getColors } from '@/constants/theme';
import {
  getOfferingDescriptionHtmlProps,
  getOfferingFaqHtmlProps,
} from '@/utils/offeringHtmlStyles';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type OfferingApiHtmlProps = Readonly<{
  html: string;
}>;

/** Project description HTML — same RenderHTML config as the legacy project detail screen. */
export function OfferingDescriptionHtml({ html }: OfferingApiHtmlProps) {
  const { theme } = useTheme();
  const colors = getColors(theme);

  const props = useMemo(
    () => getOfferingDescriptionHtmlProps(colors, SCREEN_WIDTH, html),
    [colors, html],
  );

  if (!html) return null;

  return <RenderHTML {...props} />;
}

/** FAQ HTML — same RenderHTML config as the legacy project detail screen. */
export function OfferingFaqHtml({ html }: OfferingApiHtmlProps) {
  const { theme } = useTheme();
  const colors = getColors(theme);

  const props = useMemo(
    () => getOfferingFaqHtmlProps(colors, SCREEN_WIDTH, html),
    [colors, html],
  );

  if (!html) return null;

  return <RenderHTML {...props} />;
}
