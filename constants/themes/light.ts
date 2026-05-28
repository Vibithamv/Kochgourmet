// KOCHGOURMET.com — light theme (warm cream surfaces, coral primary, burgundy + forest accents)
export const LightTheme = {
  primary: '#EE7051',
  primaryDark: '#D9623F',
  secondary: '#8B2323',
  accent: '#2D4635',
  success: '#2D5A42',
  warning: '#F59E0B',
  error: '#DC2626',
  info: '#2563EB',

  status: {
    privateSale: '#8B5CF6',
    preSale: '#F59E0B',
    whitelist: '#8A8278',
    public: '#EE7B5F',
    announcement: '#2563EB',
    finished: '#8A8278',
  },

  background: {
    primary: '#FEFFFF',
    secondary: '#FFF6EA',
    tertiary: '#F5EDE4',
    card: '#FEFFFF',
    overlay: 'rgba(45, 70, 53, 0.45)',
  },

  text: {
    primary: '#141414',
    secondary: '#333333',
    tertiary: '#6B6560',
    inverse: '#FFFFFF',
    onPrimary: '#FFFFFF',
    placeholder: '#9A928A',
    disabled: '#C5BDB5',
  },

  border: {
    primary: '#E5DDD4',
    secondary: '#EFE8E0',
    focus: '#EE7B5F',
    error: '#FEE2E2',
  },

  shadow: {
    primary: '#2D4635',
    card: '#2D4635',
    button: '#EE7B5F',
  },

  gradient: {
    primary: ['#EE7B5F', '#D9624A'],
    secondary: ['#8B2323', '#6E1C1C'],
    card: ['transparent', 'rgba(45, 70, 53, 0.12)'],
  },

  interactive: {
    hover: '#FFF3E8',
    pressed: '#F5E8DC',
    disabled: '#E8E0D8',
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
      shadowColor: '#2D4635',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 1,
      elevation: 1,
    },
    sm: {
      shadowColor: '#2D4635',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: '#2D4635',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 2,
    },
    lg: {
      shadowColor: '#2D4635',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 12,
      elevation: 4,
    },
    xl: {
      shadowColor: '#2D4635',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.14,
      shadowRadius: 16,
      elevation: 8,
    },
    button: {
      shadowColor: '#EE7B5F',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.28,
      shadowRadius: 8,
      elevation: 4,
    },
    card: {
      shadowColor: '#2D4635',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 3,
    },
  },
} as const;
