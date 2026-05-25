import React, { useEffect, useRef } from 'react';
import {
  View,
  Animated,
  Easing,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { getColors } from '@/constants/theme';
import AsseteraLogo from '@/components/AsseteraLogo';

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useShimmerAnim(): Animated.Value {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(anim, {
        toValue: 1,
        duration: 1200,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [anim]);

  return anim;
}

// ---------------------------------------------------------------------------
// ShimmerBlock — base animated rectangle
// ---------------------------------------------------------------------------

interface ShimmerBlockProps {
  anim: Animated.Value;
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

export function ShimmerBlock({
  anim,
  width = '100%',
  height = 16,
  borderRadius = 6,
  style,
}: Readonly<ShimmerBlockProps>) {
  const { theme } = useTheme();
  const isDark = theme === 'dark' || theme === 'darkGreen';

  const baseColor = isDark ? '#2A2F38' : '#E8EBEF';
  const highlightColor = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.75)';

  const translateX = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [-200, 500],
  });

  return (
    <View
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: baseColor,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <Animated.View
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          width: 200,
          transform: [{ translateX }],
        }}
      >
        <LinearGradient
          colors={[baseColor, highlightColor, baseColor]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// ProjectCardShimmer
// ---------------------------------------------------------------------------

interface ProjectCardShimmerProps {
  anim: Animated.Value;
}

export function ProjectCardShimmer({ anim }: Readonly<ProjectCardShimmerProps>) {
  const { theme } = useTheme();
  const colors = getColors(theme);

  return (
    <View
      style={{
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: colors.border.primary,
      }}
    >
      {/* Image placeholder */}
      <ShimmerBlock anim={anim} width="100%" height={200} borderRadius={0} />

      {/* Content */}
      <View style={{ padding: 16 }}>
        {/* Title */}
        <ShimmerBlock anim={anim} width="65%" height={18} borderRadius={6} style={{ marginBottom: 8 }} />

        {/* Description lines */}
        <ShimmerBlock anim={anim} width="90%" height={12} borderRadius={4} style={{ marginBottom: 4 }} />
        <ShimmerBlock anim={anim} width="75%" height={12} borderRadius={4} style={{ marginBottom: 16 }} />

        {/* Stats row */}
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 0 }}>
          <ShimmerBlock anim={anim} width={undefined} height={40} borderRadius={8} style={{ flex: 1 }} />
          <ShimmerBlock anim={anim} width={undefined} height={40} borderRadius={8} style={{ flex: 1 }} />
          <ShimmerBlock anim={anim} width={undefined} height={40} borderRadius={8} style={{ flex: 1 }} />
        </View>

        {/* Button */}
        <ShimmerBlock anim={anim} width="100%" height={44} borderRadius={12} style={{ marginTop: 12 }} />
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// DashboardShimmer
// ---------------------------------------------------------------------------

export function DashboardShimmer() {
  const { theme } = useTheme();
  const colors = getColors(theme);
  const isDark = theme === 'dark' || theme === 'darkGreen';
  const insets = useSafeAreaInsets();
  const anim = useShimmerAnim();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background.secondary }}>
      {/* Fake header */}
      <View
        style={{
          paddingTop: Math.max(insets.top, 50),
          paddingHorizontal: 24,
          paddingBottom: 16,
          backgroundColor: colors.background.primary,
          borderBottomWidth: 1,
          borderBottomColor: colors.border.primary,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View
            style={{
              height: 28,
              marginRight: 16,
              justifyContent: 'center',
            }}
          >
            <AsseteraLogo width={130} height={25} />
          </View>
          <View style={{ flex: 1, gap: 6 }}>
            <ShimmerBlock anim={anim} width="35%" height={10} borderRadius={4} />
            <ShimmerBlock anim={anim} width="50%" height={16} borderRadius={6} />
          </View>
        </View>
      </View>

      {/* Section header */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 20,
          paddingTop: 24,
          paddingBottom: 12,
        }}
      >
        <ShimmerBlock anim={anim} width="35%" height={20} borderRadius={6} />
        <ShimmerBlock anim={anim} width="12%" height={14} borderRadius={4} />
      </View>

      {/* Project cards */}
      <View style={{ paddingHorizontal: 24, gap: 16 }}>
        <ProjectCardShimmer anim={anim} />
        <ProjectCardShimmer anim={anim} />
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// ProjectsShimmer
// ---------------------------------------------------------------------------

export function ProjectsShimmer() {
  const { theme } = useTheme();
  const colors = getColors(theme);
  const insets = useSafeAreaInsets();
  const anim = useShimmerAnim();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background.secondary }}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingTop: 20,
          paddingBottom: insets.bottom + 100,
          gap: 16,
        }}
        showsVerticalScrollIndicator={false}
      >
        <ProjectCardShimmer anim={anim} />
        <ProjectCardShimmer anim={anim} />
        <ProjectCardShimmer anim={anim} />
        <ProjectCardShimmer anim={anim} />
      </ScrollView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// PortfolioChartShimmer
// ---------------------------------------------------------------------------

interface PortfolioChartShimmerProps {
  anim: Animated.Value;
}

export function PortfolioChartShimmer({ anim }: Readonly<PortfolioChartShimmerProps>) {
  return (
    <ShimmerBlock anim={anim} width="100%" height={200} borderRadius={12} />
  );
}

// ---------------------------------------------------------------------------
// PortfolioInvestmentRowShimmer
// ---------------------------------------------------------------------------

interface PortfolioInvestmentRowShimmerProps {
  anim: Animated.Value;
}

export function PortfolioInvestmentRowShimmer({ anim }: Readonly<PortfolioInvestmentRowShimmerProps>) {
  const { theme } = useTheme();
  const colors = getColors(theme);

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        backgroundColor: colors.background.card,
      }}
    >
      {/* Circle avatar */}
      <ShimmerBlock anim={anim} width={48} height={48} borderRadius={24} style={{ marginRight: 12 }} />

      {/* Text lines */}
      <View style={{ flex: 1, gap: 6 }}>
        <ShimmerBlock anim={anim} width="50%" height={14} borderRadius={4} />
        <ShimmerBlock anim={anim} width="30%" height={10} borderRadius={4} />
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// ProjectDetailShimmer
// ---------------------------------------------------------------------------

export function ProjectDetailShimmer() {
  const { theme } = useTheme();
  const colors = getColors(theme);
  const insets = useSafeAreaInsets();
  const anim = useShimmerAnim();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background.secondary }}>
      {/* Fake header bar */}
      <View
        style={{
          paddingTop: insets.top + 16,
          paddingBottom: 16,
          paddingHorizontal: 16,
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.background.primary,
          height: insets.top + 16 + 60,
        }}
      >
        <ShimmerBlock anim={anim} width={40} height={40} borderRadius={20} />
        <View style={{ flex: 1, alignItems: 'center' }}>
          <ShimmerBlock anim={anim} width="40%" height={16} borderRadius={6} />
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Hero image */}
      <ShimmerBlock anim={anim} width="100%" height={280} borderRadius={0} />

      {/* Content */}
      <ScrollView
        contentContainerStyle={{
          padding: 24,
          paddingBottom: insets.bottom + 40,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Badge + title row */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <ShimmerBlock anim={anim} width={60} height={24} borderRadius={8} />
          <ShimmerBlock anim={anim} width="55%" height={22} borderRadius={6} />
        </View>

        {/* Description lines */}
        <ShimmerBlock anim={anim} width="90%" height={14} borderRadius={4} style={{ marginBottom: 8 }} />
        <ShimmerBlock anim={anim} width="85%" height={14} borderRadius={4} style={{ marginBottom: 8 }} />
        <ShimmerBlock anim={anim} width="60%" height={14} borderRadius={4} style={{ marginBottom: 24 }} />

        {/* Stats grid 2×2 */}
        <View style={{ gap: 12, marginBottom: 24 }}>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <ShimmerBlock anim={anim} width={undefined} height={80} borderRadius={12} style={{ flex: 1 }} />
            <ShimmerBlock anim={anim} width={undefined} height={80} borderRadius={12} style={{ flex: 1 }} />
          </View>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <ShimmerBlock anim={anim} width={undefined} height={80} borderRadius={12} style={{ flex: 1 }} />
            <ShimmerBlock anim={anim} width={undefined} height={80} borderRadius={12} style={{ flex: 1 }} />
          </View>
        </View>

        {/* Section rows: label + value */}
        {[0, 1].map((i) => (
          <View
            key={i}
            style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}
          >
            <ShimmerBlock anim={anim} width="30%" height={14} borderRadius={4} />
            <ShimmerBlock anim={anim} width="45%" height={14} borderRadius={4} />
          </View>
        ))}

        {/* Button */}
        <ShimmerBlock anim={anim} width="100%" height={52} borderRadius={14} style={{ marginTop: 20 }} />
      </ScrollView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// InvestmentShimmer
// ---------------------------------------------------------------------------

export function InvestmentShimmer() {
  const { theme } = useTheme();
  const colors = getColors(theme);
  const insets = useSafeAreaInsets();
  const anim = useShimmerAnim();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background.secondary }}>
      {/* Fake header bar */}
      <View
        style={{
          paddingTop: insets.top + 16,
          paddingBottom: 16,
          paddingHorizontal: 16,
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.background.primary,
          height: insets.top + 16 + 56,
        }}
      >
        <ShimmerBlock anim={anim} width={40} height={40} borderRadius={20} />
        <View style={{ flex: 1, alignItems: 'center' }}>
          <ShimmerBlock anim={anim} width="40%" height={16} borderRadius={6} />
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Step indicator bar */}
      <View
        style={{
          paddingHorizontal: 24,
          paddingVertical: 16,
          gap: 8,
          backgroundColor: colors.background.primary,
          borderBottomWidth: 1,
          borderBottomColor: colors.border.primary,
        }}
      >
        <ShimmerBlock anim={anim} width="30%" height={12} borderRadius={4} />
        <ShimmerBlock anim={anim} width="100%" height={6} borderRadius={3} />
      </View>

      {/* Content */}
      <ScrollView
        contentContainerStyle={{
          padding: 24,
          paddingBottom: insets.bottom + 40,
          alignItems: 'center',
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header icon */}
        <ShimmerBlock anim={anim} width={64} height={64} borderRadius={32} />

        {/* Title */}
        <ShimmerBlock anim={anim} width="70%" height={20} borderRadius={6} style={{ marginTop: 16 }} />

        {/* Subtitle */}
        <ShimmerBlock anim={anim} width="50%" height={14} borderRadius={4} style={{ marginTop: 8, marginBottom: 24 }} />

        {/* Detail card */}
        <View
          style={{
            width: '100%',
            borderRadius: 16,
            borderWidth: 1,
            borderColor: colors.border.primary,
            padding: 20,
            marginBottom: 24,
          }}
        >
          {[0, 1, 2, 3].map((i) => (
            <View
              key={i}
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: i < 3 ? 16 : 0,
              }}
            >
              <ShimmerBlock anim={anim} width="35%" height={14} borderRadius={4} />
              <ShimmerBlock anim={anim} width="30%" height={14} borderRadius={4} />
            </View>
          ))}
        </View>

        {/* Form: 2 input groups */}
        {[0, 1].map((i) => (
          <View key={i} style={{ width: '100%', marginBottom: 16 }}>
            <ShimmerBlock anim={anim} width="25%" height={12} borderRadius={4} style={{ marginBottom: 8 }} />
            <ShimmerBlock anim={anim} width="100%" height={56} borderRadius={12} />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// PortfolioOverviewShimmer
// ---------------------------------------------------------------------------

interface PortfolioOverviewShimmerProps {
  anim: Animated.Value;
}

export function PortfolioOverviewShimmer({ anim }: Readonly<PortfolioOverviewShimmerProps>) {
  const { theme } = useTheme();
  const colors = getColors(theme);

  return (
    <View
      style={{
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.border.primary,
        backgroundColor: colors.background.card,
        padding: 16,
      }}
    >
      {/* Icon + label row */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <ShimmerBlock anim={anim} width={20} height={20} borderRadius={4} />
        <ShimmerBlock anim={anim} width="40%" height={12} borderRadius={4} />
      </View>
      {/* Value */}
      <ShimmerBlock anim={anim} width="55%" height={22} borderRadius={6} style={{ marginBottom: 8 }} />
      {/* Sublabel */}
      <ShimmerBlock anim={anim} width="35%" height={10} borderRadius={4} />
    </View>
  );
}

// ---------------------------------------------------------------------------
// PortfolioTransactionRowShimmer
// ---------------------------------------------------------------------------

interface PortfolioTransactionRowShimmerProps {
  anim: Animated.Value;
}

export function PortfolioTransactionRowShimmer({ anim }: Readonly<PortfolioTransactionRowShimmerProps>) {
  const { theme } = useTheme();
  const colors = getColors(theme);

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: colors.border.primary,
      }}
    >
      {/* Icon circle */}
      <ShimmerBlock anim={anim} width={36} height={36} borderRadius={18} style={{ marginRight: 12 }} />

      {/* Description + date */}
      <View style={{ flex: 1, gap: 6 }}>
        <ShimmerBlock anim={anim} width="55%" height={13} borderRadius={4} />
        <ShimmerBlock anim={anim} width="30%" height={10} borderRadius={4} />
      </View>

      {/* Amount + status */}
      <View style={{ alignItems: 'flex-end', gap: 6 }}>
        <ShimmerBlock anim={anim} width={70} height={13} borderRadius={4} />
        <ShimmerBlock anim={anim} width={50} height={10} borderRadius={4} />
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// AccountInfoShimmer
// ---------------------------------------------------------------------------

interface AccountInfoFieldShimmerProps {
  anim: Animated.Value;
  borderColor: string;
  backgroundColor: string;
  labelWidth: string;
  valueWidth: string;
}

function AccountInfoFieldShimmer({ anim, borderColor, backgroundColor, labelWidth, valueWidth }: Readonly<AccountInfoFieldShimmerProps>) {
  return (
    <View
      style={{
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor,
        backgroundColor,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <ShimmerBlock anim={anim} width={32} height={32} borderRadius={16} />
        <ShimmerBlock anim={anim} width={labelWidth as any} height={11} borderRadius={4} />
      </View>
      <ShimmerBlock anim={anim} width={valueWidth as any} height={16} borderRadius={5} />
    </View>
  );
}

export function AccountInfoShimmer() {
  const { theme } = useTheme();
  const colors = getColors(theme);
  const insets = useSafeAreaInsets();
  const anim = useShimmerAnim();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background.secondary }}>
      {/* Fake header */}
      <View
        style={{
          paddingTop: Math.max(insets.top, 44) + 16,
          paddingBottom: 16,
          paddingHorizontal: 20,
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.background.primary,
          borderBottomWidth: 1,
          borderBottomColor: colors.border.primary,
        }}
      >
        <ShimmerBlock anim={anim} width={40} height={40} borderRadius={20} style={{ marginRight: 12 }} />
        <View style={{ flex: 1, alignItems: 'center', gap: 6 }}>
          <ShimmerBlock anim={anim} width="40%" height={16} borderRadius={6} />
          <ShimmerBlock anim={anim} width="55%" height={11} borderRadius={4} />
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Personal info section */}
      <View style={{ paddingHorizontal: 20, paddingTop: 20 }}>
        <ShimmerBlock anim={anim} width="45%" height={18} borderRadius={6} style={{ marginBottom: 16 }} />
        <AccountInfoFieldShimmer anim={anim} borderColor={colors.border.primary} backgroundColor={colors.background.card} labelWidth="30%" valueWidth="55%" />
        <AccountInfoFieldShimmer anim={anim} borderColor={colors.border.primary} backgroundColor={colors.background.card} labelWidth="35%" valueWidth="45%" />
        <AccountInfoFieldShimmer anim={anim} borderColor={colors.border.primary} backgroundColor={colors.background.card} labelWidth="25%" valueWidth="75%" />
        <AccountInfoFieldShimmer anim={anim} borderColor={colors.border.primary} backgroundColor={colors.background.card} labelWidth="30%" valueWidth="40%" />
      </View>

      {/* KYC section */}
      <View style={{ paddingHorizontal: 20, paddingTop: 24 }}>
        <ShimmerBlock anim={anim} width="50%" height={18} borderRadius={6} style={{ marginBottom: 16 }} />
        <View
          style={{
            borderRadius: 16,
            padding: 20,
            borderWidth: 1,
            borderColor: colors.border.primary,
            backgroundColor: colors.background.card,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <ShimmerBlock anim={anim} width={48} height={48} borderRadius={24} />
            <View style={{ flex: 1, gap: 8 }}>
              <ShimmerBlock anim={anim} width="55%" height={14} borderRadius={5} />
              <ShimmerBlock anim={anim} width="80%" height={11} borderRadius={4} />
            </View>
          </View>
          <ShimmerBlock anim={anim} width="100%" height={11} borderRadius={4} style={{ marginBottom: 6 }} />
          <ShimmerBlock anim={anim} width="85%" height={11} borderRadius={4} />
        </View>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// WalletsShimmer
// ---------------------------------------------------------------------------

export function WalletsShimmer() {
  const { theme } = useTheme();
  const colors = getColors(theme);
  const insets = useSafeAreaInsets();
  const anim = useShimmerAnim();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background.secondary }}>
      {/* Fake header bar */}
      <View
        style={{
          paddingTop: insets.top + 16,
          paddingBottom: 16,
          paddingHorizontal: 16,
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.background.primary,
          borderBottomWidth: 1,
          borderBottomColor: colors.border.primary,
          height: insets.top + 16 + 56,
        }}
      >
        <ShimmerBlock anim={anim} width={40} height={40} borderRadius={20} />
        <View style={{ flex: 1, alignItems: 'center' }}>
          <ShimmerBlock anim={anim} width="40%" height={16} borderRadius={6} />
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Content */}
      <ScrollView
        contentContainerStyle={{
          padding: 20,
          paddingBottom: insets.bottom + 40,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* 4 wallet item rows */}
        {[0, 1, 2, 3].map((i) => (
          <View
            key={i}
            style={{
              borderRadius: 12,
              borderWidth: 1,
              borderColor: colors.border.primary,
              padding: 16,
              marginBottom: 12,
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            {/* Icon circle */}
            <ShimmerBlock anim={anim} width={40} height={40} borderRadius={20} style={{ marginRight: 12 }} />

            {/* Right content */}
            <View style={{ flex: 1, gap: 6 }}>
              <ShimmerBlock anim={anim} width="35%" height={12} borderRadius={4} />
              <ShimmerBlock anim={anim} width="70%" height={14} borderRadius={4} />
            </View>

            {/* Copy icon circle */}
            <ShimmerBlock anim={anim} width={20} height={20} borderRadius={10} style={{ marginLeft: 8 }} />
          </View>
        ))}

        {/* Add button */}
        <ShimmerBlock anim={anim} width="100%" height={52} borderRadius={12} style={{ marginTop: 8 }} />
      </ScrollView>
    </View>
  );
}
