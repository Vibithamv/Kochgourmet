import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  PanResponder,
  type LayoutChangeEvent,
  type GestureResponderEvent,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';
import { getColors, getTypography, Spacing, BorderRadius } from '@/constants/theme';
import {
  computeOfferingTokenMetrics,
  formatOfferingCurrency,
  formatOwnershipPercent,
  formatSliderScaleLabel,
  offeringSliderScaleLabels,
} from '@/utils/offeringTokenMetrics';

const THUMB_SIZE = 24;
const TRACK_HEIGHT = 6;

type TrackLayout = {
  width: number;
  pageX: number;
};

type OfferingTokenSliderProps = Readonly<{
  tokenSymbol: string;
  currency: string;
  minTokens: number;
  maxTokens: number;
  annualIncomeBase: number;
  value: number;
  onChange: (tokens: number) => void;
}>;

function tokensFromRatio(
  ratio: number,
  safeMin: number,
  safeMax: number
): number {
  const r = Math.max(0, Math.min(1, ratio));
  return Math.round(safeMin + r * (safeMax - safeMin));
}

function ratioFromTokens(
  tokens: number,
  safeMin: number,
  safeMax: number
): number {
  if (safeMax <= safeMin) return 0;
  return (tokens - safeMin) / (safeMax - safeMin);
}

export default function OfferingTokenSlider({
  tokenSymbol,
  currency,
  minTokens,
  maxTokens,
  annualIncomeBase,
  value,
  onChange,
}: OfferingTokenSliderProps) {
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();
  const colors = getColors(theme);
  const typo = useMemo(() => getTypography(theme), [theme]);

  const trackLayoutRef = useRef<TrackLayout>({ width: 0, pageX: 0 });
  const trackHitRef = useRef<View>(null);
  const isDraggingRef = useRef(false);

  const safeMin = Math.max(0, Math.round(minTokens));
  const safeMax = Math.max(safeMin, Math.round(maxTokens));
  const clampedValue = Math.min(safeMax, Math.max(safeMin, Math.round(value)));
  const committedRatio = ratioFromTokens(clampedValue, safeMin, safeMax);

  /** Continuous 0–1 position while dragging (smooth thumb). */
  const [dragRatio, setDragRatio] = useState<number | null>(null);

  useEffect(() => {
    if (!isDraggingRef.current) {
      setDragRatio(null);
    }
  }, [clampedValue]);

  const displayRatio = dragRatio ?? committedRatio;
  const displayTokens = tokensFromRatio(displayRatio, safeMin, safeMax);

  const measureTrack = useCallback(() => {
    trackHitRef.current?.measureInWindow((x, _y, width) => {
      if (width > 0) {
        trackLayoutRef.current = { width, pageX: x };
      }
    });
  }, []);

  const updateFromPageX = useCallback(
    (pageX: number, commitToParent: boolean) => {
      const { width, pageX: trackPageX } = trackLayoutRef.current;
      if (width <= 0) return;

      const x = pageX - trackPageX;
      const ratio = Math.max(0, Math.min(1, x / width));
      setDragRatio(ratio);

      if (commitToParent) {
        onChange(tokensFromRatio(ratio, safeMin, safeMax));
      }
    },
    [onChange, safeMax, safeMin]
  );

  const handleGesturePageX = useCallback(
    (evt: GestureResponderEvent, commitToParent: boolean) => {
      updateFromPageX(evt.nativeEvent.pageX, commitToParent);
    },
    [updateFromPageX]
  );

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderTerminationRequest: () => false,
        onShouldBlockNativeResponder: () => true,
        onPanResponderGrant: (evt) => {
          isDraggingRef.current = true;
          measureTrack();
          handleGesturePageX(evt, false);
        },
        onPanResponderMove: (evt) => {
          handleGesturePageX(evt, false);
        },
        onPanResponderRelease: (evt) => {
          isDraggingRef.current = false;
          handleGesturePageX(evt, true);
          setDragRatio(null);
        },
        onPanResponderTerminate: () => {
          isDraggingRef.current = false;
          setDragRatio(null);
        },
      }),
    [handleGesturePageX, measureTrack]
  );

  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          borderRadius: BorderRadius.lg,
          borderWidth: 1,
          padding: Spacing.lg,
          marginTop: Spacing.lg,
        },
        headerRow: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: Spacing.lg,
        },
        headerLabel: {
          fontSize: typo.fontSize.base,
          fontFamily: typo.fontFamily.regular,
        },
        headerValue: {
          fontSize: typo.fontSize.base,
          fontFamily: typo.fontFamily.semiBold,
        },
        trackHitArea: {
          height: 44,
          justifyContent: 'center',
          marginBottom: Spacing.sm,
        },
        track: {
          height: TRACK_HEIGHT,
          borderRadius: TRACK_HEIGHT / 2,
          overflow: 'visible',
        },
        trackFill: {
          position: 'absolute',
          left: 0,
          top: 0,
          height: TRACK_HEIGHT,
          borderRadius: TRACK_HEIGHT / 2,
        },
        thumb: {
          position: 'absolute',
          width: THUMB_SIZE,
          height: THUMB_SIZE,
          borderRadius: THUMB_SIZE / 2,
          top: -(THUMB_SIZE - TRACK_HEIGHT) / 2,
          marginLeft: -THUMB_SIZE / 2,
        },
        scaleRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginBottom: Spacing.lg,
        },
        scaleLabel: {
          fontSize: typo.fontSize.xs,
          fontFamily: typo.fontFamily.regular,
        },
        metricsBlock: {
          gap: Spacing.md,
        },
        metricRow: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        },
        metricLabel: {
          fontSize: typo.fontSize.sm,
          fontFamily: typo.fontFamily.regular,
        },
        metricValue: {
          fontSize: typo.fontSize.sm,
          fontFamily: typo.fontFamily.semiBold,
        },
      }),
    [typo]
  );

  const metrics = useMemo(
    () => computeOfferingTokenMetrics(displayTokens, annualIncomeBase, safeMax),
    [annualIncomeBase, displayTokens, safeMax]
  );

  const scaleLabels = useMemo(
    () => offeringSliderScaleLabels(safeMax),
    [safeMax]
  );

  const locale = i18n.language;
  const thumbPercent = `${displayRatio * 100}%`;

  const handleTrackLayout = (e: LayoutChangeEvent) => {
    trackLayoutRef.current.width = e.nativeEvent.layout.width;
    measureTrack();
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.background.card,
          borderColor: colors.border.primary,
        },
      ]}
    >
      <View style={styles.headerRow}>
        <Text style={[styles.headerLabel, { color: colors.text.secondary }]}>
          {t('projectDetail.selectTokens')}
        </Text>
        <Text style={[styles.headerValue, { color: colors.primary }]}>
          {displayTokens} {tokenSymbol}
        </Text>
      </View>

      <View
        ref={trackHitRef}
        style={styles.trackHitArea}
        onLayout={handleTrackLayout}
        {...panResponder.panHandlers}
      >
        <View
          style={[styles.track, { backgroundColor: colors.border.secondary }]}
        >
          <View
            style={[
              styles.trackFill,
              {
                backgroundColor: colors.primary,
                width: thumbPercent,
              },
            ]}
          />
          <View
            style={[
              styles.thumb,
              {
                backgroundColor: colors.primary,
                left: thumbPercent,
              },
            ]}
          />
        </View>
      </View>

      <View style={styles.scaleRow}>
        {scaleLabels.map((tick) => (
          <Text
            key={`scale-${tick}`}
            style={[styles.scaleLabel, { color: colors.text.tertiary }]}
          >
            {formatSliderScaleLabel(tick)}
          </Text>
        ))}
      </View>

      <View style={styles.metricsBlock}>
        <View style={styles.metricRow}>
          <Text style={[styles.metricLabel, { color: colors.text.secondary }]}>
            {t('projectDetail.annualIncome')}
          </Text>
          <Text style={[styles.metricValue, { color: colors.text.primary }]}>
            {formatOfferingCurrency(metrics.annualIncome, currency, locale)}
          </Text>
        </View>
        <View style={styles.metricRow}>
          <Text style={[styles.metricLabel, { color: colors.text.secondary }]}>
            {t('projectDetail.monthlyIncome')}
          </Text>
          <Text style={[styles.metricValue, { color: colors.text.primary }]}>
            {formatOfferingCurrency(metrics.monthlyIncome, currency, locale)}
          </Text>
        </View>
        <View style={styles.metricRow}>
          <Text style={[styles.metricLabel, { color: colors.text.secondary }]}>
            {t('projectDetail.projected5Year')}
          </Text>
          <Text style={[styles.metricValue, { color: colors.text.primary }]}>
            {formatOfferingCurrency(metrics.projected5Year, currency, locale)}
          </Text>
        </View>
        <View style={styles.metricRow}>
          <Text style={[styles.metricLabel, { color: colors.text.secondary }]}>
            {t('projectDetail.ownership')}
          </Text>
          <Text style={[styles.metricValue, { color: colors.primary }]}>
            {formatOwnershipPercent(metrics.ownershipPercent)}
          </Text>
        </View>
      </View>
    </View>
  );
}
