// Assetera — dark theme (#151421 base, lifted indigo primary, yellow accent for active state)
export const DarkTheme = {
  primary: '#6F61F2',
  primaryDark: '#412EE5',
  secondary: '#E5CE45',
  accent: '#E5CE45',
  success: '#34D399',
  warning: '#FBBF24',
  error: '#F87171',
  info: '#60A5FA',

  status: {
    privateSale: '#A78BFA',
    preSale: '#FBBF24',
    whitelist: '#989898',
    public: '#6F61F2',
    announcement: '#60A5FA',
    finished: '#989898',
  },

  background: {
    primary: '#151421',
    secondary: '#21202B',
    tertiary: '#2A2935',
    card: '#21202B',
    overlay: 'rgba(0, 0, 0, 0.7)',
  },

  text: {
    primary: '#F2F2F2',
    secondary: '#C0C0C8',
    tertiary: '#989898',
    inverse: '#151421',
    onPrimary: '#FFFFFF',
    placeholder: '#6B6B7A',
    disabled: '#4D4D5C',
  },

  border: {
    primary: 'rgba(255, 255, 255, 0.10)',
    secondary: 'rgba(255, 255, 255, 0.06)',
    focus: '#6F61F2',
    error: '#7F1D1D',
  },

  shadow: {
    primary: '#000000',
    card: '#000000',
    button: '#412EE5',
  },

  gradient: {
    primary: ['#6F61F2', '#412EE5'],
    secondary: ['#151421', '#21202B'],
    card: ['transparent', 'rgba(0, 0, 0, 0.55)'],
  },

  interactive: {
    hover: '#2A2935',
    pressed: '#322F42',
    disabled: '#3A3849',
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
      shadowColor: '#412EE5',
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
