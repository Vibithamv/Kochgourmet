// Assetera — "indigo midnight" variant (deeper bg than `dark`, slightly cooler surfaces, same indigo accents)
// Kept under the historical `darkGreen` name to avoid breaking ThemeContext consumers.
export const DarkGreenTheme = {
  primary: '#7468F5',
  primaryDark: '#5545E5',
  secondary: '#E5CE45',
  accent: '#E5CE45',
  success: '#34D399',
  warning: '#FBBF24',
  error: '#F87171',
  info: '#60A5FA',

  status: {
    privateSale: '#A78BFA',
    preSale: '#FBBF24',
    whitelist: '#7A7A85',
    public: '#7468F5',
    announcement: '#60A5FA',
    finished: '#7A7A85',
  },

  background: {
    primary: '#0E0D1A',
    secondary: '#1A1828',
    tertiary: '#23213A',
    card: '#1A1828',
    overlay: 'rgba(0, 0, 0, 0.78)',
  },

  text: {
    primary: '#F2F2F2',
    secondary: '#B8B8C8',
    tertiary: '#8B8B98',
    inverse: '#0E0D1A',
    onPrimary: '#FFFFFF',
    placeholder: '#5E5E70',
    disabled: '#42424F',
  },

  border: {
    primary: 'rgba(255, 255, 255, 0.10)',
    secondary: 'rgba(255, 255, 255, 0.06)',
    focus: '#7468F5',
    error: '#7F1D1D',
  },

  shadow: {
    primary: '#000000',
    card: '#000000',
    button: '#5545E5',
  },

  gradient: {
    primary: ['#7468F5', '#5545E5'],
    secondary: ['#0E0D1A', '#1A1828'],
    card: ['transparent', 'rgba(0, 0, 0, 0.55)'],
  },

  interactive: {
    hover: '#23213A',
    pressed: '#2C2A45',
    disabled: '#34324A',
  },

  typography: {
    fontSize: {
      xs: 10,
      sm: 12,
      base: 14,
      lg: 16,
      xl: 18,
      '2xl': 20,
      '3xl': 24,
      '4xl': 28,
      '5xl': 32,
      '6xl': 36,
    },
    fontFamily: {
      regular: 'Inter-Regular',
      medium: 'Inter-Medium',
      semiBold: 'Inter-SemiBold',
      bold: 'Inter-Bold',
      display: 'PlayfairDisplay_700Bold',
      displayMedium: 'PlayfairDisplay_500Medium',
    },
    lineHeight: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.75,
    },
    letterSpacing: {
      tight: -0.5,
      normal: -0.2,
      wide: 0.1,
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semiBold: '600',
      bold: '700',
    },
  },

  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    '2xl': 24,
    '3xl': 32,
    '4xl': 48,
    '5xl': 64,
    '6xl': 80,
    '7xl': 96,
  },

  layout: {
    headerHeight: 60,
    tabBarHeight: 60,
    cardPadding: 20,
    screenPadding: 24,
    sectionSpacing: 32,
  },

  borderRadius: {
    none: 0,
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    '2xl': 24,
    '3xl': 32,
    full: 9999,
  },

  componentRadius: {
    button: 9999,
    card: 16,
    modal: 20,
    input: 9999,
    badge: 8,
    avatar: 9999,
  },

  shadows: {
    none: {
      shadowColor: 'transparent',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },
    xs: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.25,
      shadowRadius: 1,
      elevation: 1,
    },
    sm: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.32,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.4,
      shadowRadius: 8,
      elevation: 2,
    },
    lg: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.48,
      shadowRadius: 12,
      elevation: 4,
    },
    xl: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.55,
      shadowRadius: 16,
      elevation: 8,
    },
    button: {
      shadowColor: '#5545E5',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.42,
      shadowRadius: 8,
      elevation: 4,
    },
    card: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.55,
      shadowRadius: 12,
      elevation: 3,
    },
  },
} as const;
