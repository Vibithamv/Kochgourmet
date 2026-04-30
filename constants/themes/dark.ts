// KOCHGOURMET — dark mode (warm charcoal base, coral primary)
export const DarkTheme = {
  primary: '#F08A72',
  primaryDark: '#EE7B5F',
  secondary: '#C47A6E',
  accent: '#6BA888',
  success: '#7BC99A',
  warning: '#FBBF24',
  error: '#F87171',
  info: '#60A5FA',

  status: {
    privateSale: '#A78BFA',
    preSale: '#FBBF24',
    whitelist: '#9A928A',
    public: '#F08A72',
    announcement: '#60A5FA',
    finished: '#9A928A',
  },

  background: {
    primary: '#171311',
    secondary: '#1F1A18',
    tertiary: '#2A2420',
    card: '#221E1C',
    overlay: 'rgba(0, 0, 0, 0.78)',
  },

  text: {
    primary: '#FFF9F0',
    secondary: '#C9BEB5',
    tertiary: '#8A8278',
    inverse: '#171311',
    onPrimary: '#FFFFFF',
    placeholder: '#8A8278',
    disabled: '#5C5550',
  },

  border: {
    primary: '#3A322D',
    secondary: '#2E2824',
    focus: '#F08A72',
    error: '#7F1D1D',
  },

  shadow: {
    primary: '#000000',
    card: '#000000',
    button: '#EE7B5F',
  },

  gradient: {
    primary: ['#F08A72', '#D9624A'],
    secondary: ['#171311', '#1F1A18'],
    card: ['transparent', 'rgba(0,0,0,0.55)'],
  },

  interactive: {
    hover: '#2A2420',
    pressed: '#322B26',
    disabled: '#4A423C',
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
      shadowOpacity: 0.22,
      shadowRadius: 1,
      elevation: 1,
    },
    sm: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.28,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.35,
      shadowRadius: 8,
      elevation: 2,
    },
    lg: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.45,
      shadowRadius: 12,
      elevation: 4,
    },
    xl: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.5,
      shadowRadius: 16,
      elevation: 8,
    },
    button: {
      shadowColor: '#EE7B5F',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.35,
      shadowRadius: 8,
      elevation: 4,
    },
    card: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.45,
      shadowRadius: 12,
      elevation: 3,
    },
  },
} as const;
