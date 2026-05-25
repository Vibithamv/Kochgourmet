// Assetera — light theme (white surfaces, indigo primary, butter-yellow accent, near-black text)
export const LightTheme = {
  primary: '#5545E5',
  primaryDark: '#412EE5',
  secondary: '#E5CE45',
  accent: '#151421',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#DC2626',
  info: '#2563EB',

  status: {
    privateSale: '#8B5CF6',
    preSale: '#F59E0B',
    whitelist: '#737373',
    public: '#5545E5',
    announcement: '#2563EB',
    finished: '#737373',
  },

  background: {
    primary: '#FFFFFF',
    secondary: '#F3F2F7',
    tertiary: '#F0EDFF',
    card: '#FFFFFF',
    overlay: 'rgba(21, 20, 33, 0.5)',
  },

  text: {
    primary: '#151421',
    secondary: '#3D3D55',
    tertiary: '#737373',
    inverse: '#FFFFFF',
    onPrimary: '#FFFFFF',
    placeholder: '#A0A0A8',
    disabled: '#C8C8D0',
  },

  border: {
    primary: '#E1DFE8',
    secondary: '#EDEBF2',
    focus: '#5545E5',
    error: '#FEE2E2',
  },

  shadow: {
    primary: '#151421',
    card: '#151421',
    button: '#5545E5',
  },

  gradient: {
    primary: ['#5545E5', '#412EE5'],
    secondary: ['#E5CE45', '#C7B238'],
    card: ['transparent', 'rgba(85, 69, 229, 0.08)'],
  },

  interactive: {
    hover: '#F0EDFF',
    pressed: '#E0DAFA',
    disabled: '#E8E6F0',
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
      shadowColor: '#151421',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 1,
      elevation: 1,
    },
    sm: {
      shadowColor: '#151421',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: '#151421',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 2,
    },
    lg: {
      shadowColor: '#151421',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 12,
      elevation: 4,
    },
    xl: {
      shadowColor: '#151421',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.14,
      shadowRadius: 16,
      elevation: 8,
    },
    button: {
      shadowColor: '#5545E5',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.28,
      shadowRadius: 8,
      elevation: 4,
    },
    card: {
      shadowColor: '#151421',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 3,
    },
  },
} as const;
