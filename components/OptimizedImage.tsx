import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Image, View, StyleSheet, Animated, Platform } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { getColors } from '@/constants/theme';
import AsseteraLogo from '@/components/AsseteraLogo';

const LOAD_TIMEOUT_MS = 2500;
const isIos = Platform.OS === 'ios';

interface OptimizedImageProps {
  source: { uri: string };
  style?: any;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'repeat' | 'center';
  placeholder?: React.ReactNode;
}

function LogoShimmer({ style }: Readonly<{ style?: any }>) {
  const { theme } = useTheme();
  const colors = getColors(theme);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.15,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 0.4,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [scaleAnim, opacityAnim]);

  return (
    <View style={[styles.shimmerContainer, { backgroundColor: colors.background.secondary }, style]}>
      <Animated.View
        style={[
          styles.shimmerLogo,
          { transform: [{ scale: scaleAnim }], opacity: opacityAnim },
        ]}
      >
        <AsseteraLogo width="100%" height="100%" />
      </Animated.View>
    </View>
  );
}

function OptimizedImage({
  source,
  style,
  resizeMode = 'cover',
  placeholder,
}: Readonly<OptimizedImageProps>) {
  const { theme } = useTheme();
  const colors = getColors(theme);
  const [loading, setLoading] = useState(!isIos);
  const [error, setError] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearLoadTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const handleLoadStart = useCallback(() => {
    setLoading(true);
    setError(false);
  }, []);

  const handleLoad = useCallback(() => {
    clearLoadTimeout();
    setLoading(false);
  }, [clearLoadTimeout]);

  const handleLoadEnd = useCallback(() => {
    clearLoadTimeout();
    setLoading(false);
  }, [clearLoadTimeout]);

  const handleError = useCallback(() => {
    clearLoadTimeout();
    setLoading(false);
    setError(true);
  }, [clearLoadTimeout]);

  useEffect(() => {
    if (!loading) return;
    timeoutRef.current = setTimeout(() => {
      timeoutRef.current = null;
      setLoading(false);
    }, LOAD_TIMEOUT_MS);
    return clearLoadTimeout;
  }, [loading, source.uri, clearLoadTimeout]);

  const optimizedUri = (() => {
    const { uri } = source;
    if (!uri?.includes('pexels.com')) return uri;
    return uri.includes('?')
      ? `${uri}&w=400&h=300&fit=crop&auto=compress&cs=tinysrgb`
      : `${uri}?w=400&h=300&fit=crop&auto=compress&cs=tinysrgb`;
  })();

  const optimizedSource = { ...source, uri: optimizedUri };
  const hasValidUri = Boolean(optimizedSource.uri?.trim());

  if (error || !hasValidUri) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.background.secondary }, style]}>
        <View style={[styles.errorBlock, { backgroundColor: colors.border.primary }]} />
      </View>
    );
  }

  return (
    <View style={[style, { overflow: 'hidden' }]}>
      <Image
        source={optimizedSource}
        style={[StyleSheet.absoluteFillObject, { resizeMode }]}
        onLoadStart={handleLoadStart}
        onLoad={handleLoad}
        onLoadEnd={handleLoadEnd}
        onError={handleError}
      />
      {loading && (
        <View style={StyleSheet.absoluteFillObject}>
          {placeholder || <LogoShimmer style={StyleSheet.absoluteFillObject} />}
        </View>
      )}
    </View>
  );
}

const MemoizedOptimizedImage = React.memo(OptimizedImage);
MemoizedOptimizedImage.displayName = 'OptimizedImage';

const styles = StyleSheet.create({
  shimmerContainer: {
    backgroundColor: '#1E2229',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shimmerLogo: {
    width: 100,
    aspectRatio: 243 / 46,
  },
  errorContainer: {
    backgroundColor: '#1E2229',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorBlock: {
    width: '60%',
    height: '60%',
    backgroundColor: '#2A2F38',
    borderRadius: 8,
  },
});

export default MemoizedOptimizedImage;
