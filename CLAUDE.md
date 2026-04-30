# OwnItNow — React Native Mobile App

## Stack
- **Framework**: Expo (Expo Router v3, file-based routing)
- **Language**: TypeScript (strict)
- **UI**: React Native + `react-native-paper` (Paper) + `lucide-react-native` icons
- **Fonts**: Inter family — `Inter-Regular`, `Inter-Medium`, `Inter-SemiBold`, `Inter-Bold`
- **i18n**: `react-i18next` — always use `t('key')`, never hardcode UI strings
- **Navigation**: `expo-router` (`router.push/replace/back()`) + `useFocusEffect` from `@react-navigation/native`

## Theme System — READ THIS FIRST

Every screen/component must support all three themes.

```ts
const { theme } = useTheme();               // 'light' | 'dark' | 'darkGreen'
const colors = getColors(theme);            // from '@/constants/theme'
const isDark = theme === 'dark' || theme === 'darkGreen';
```

### Color tokens (always use these — never hardcode hex):
| Token | Light | Dark |
|---|---|---|
| `colors.primary` | `#8DC640` | `#98D147` |
| `colors.background.primary` | `#FFFFFF` | `#14181F` |
| `colors.background.secondary` | `#F5F6F8` | `#1E2229` |
| `colors.background.card` | `#FFFFFF` | `#1E2229` |
| `colors.background.overlay` | `rgba(20,24,31,0.5)` | `rgba(0,0,0,0.8)` |
| `colors.text.primary` | `#14181F` | `#F2F2F2` |
| `colors.text.secondary` | `#4A5568` | `#8F96A3` |
| `colors.text.tertiary` | `#8F96A3` | `#636B78` |
| `colors.text.inverse` | `#FFFFFF` | `#14181F` |
| `colors.border.primary` | `#DDE1E8` | `#32363E` |
| `colors.interactive.hover` | `#F0F2F5` | `#2E3138` |
| `colors.success` | `#8DC640` | `#98D147` |
| `colors.error` | `#EF4444` | `#EF4444` |
| `colors.warning` | `#F59E0B` | `#F59E0B` |

### Button text on primary background:
```ts
// NEVER use colors.text.inverse — use this pattern:
const primaryBtnTextColor = isDark ? '#0D1117' : '#FFFFFF';
```

### Logo images (theme-aware):
```tsx
<Image source={isDark ? require('../assets/images/ownitnow.png') : require('../assets/images/ownitnow-light.png')} />
```

### Rules:
- **Never** use `Shadows` from static import (`export const Shadows = LightTheme.shadows`) — these don't adapt to dark mode. Omit shadows or use `colors.shadow.primary`.
- **Never** use `StyleSheet.create({...})` with `colors.*` values — styles become stale on theme change. Use inline styles or `React.useMemo(() => StyleSheet.create({...}), [colors])`.
- **Never** hardcode colors: `'grey'`, `'white'`, `'black'`, `rgba(0,0,0,...)`. Use color tokens.
- **Never** use raw `rgba(0,0,0,0.x)` overlays — use `colors.background.overlay`.

## File Structure
```
app/
  _layout.tsx          — root layout (providers: ThirdwebProvider > PaperProvider > TenantProvider > ThemeProvider > AlertProvider > AuthProvider)
  (tabs)/
    index.tsx          — Home/Dashboard tab
    projects.tsx       — Token list tab
    portfolio.tsx      — Portfolio tab
    account.tsx        — Account tab
  project/[id].tsx     — Project detail screen
  investment/[id].tsx  — Token purchase flow
  account/
    account-info.tsx   — Account info screen
    wallets.tsx        — Wallet management
    profile.tsx        — Profile edit
    payment-methods.tsx
  auth/
    login.tsx
    register.tsx
    forgotPassword.tsx
  screens/             — Webview screens (KYC, doc signing, payment)

components/
  Shimmer.tsx          — All shimmer loading components + useShimmerAnim()
  ProjectCard.tsx      — Reusable project/offering card
  CustomSplash.tsx     — In-app splash (after native hides; ~3s + theme + logo)
  AlertContext.tsx     — Global alert modal (showAlert)
  LanguageSelector.tsx — Language bottom sheet
  ThemeToggle.tsx      — Theme switcher

hooks/                 — API hooks (return { success, data, error, status })
  userManagement.tsx   — getUser(), switchAccount()
  listOfferings.tsx    — offerings()
  portfolio.tsx        — getPortfolio(), portfolioActivities()
  useOfferingCheck.tsx — performOfferingCheck() (call before any offering fetch)

contexts/
  ThemeContext.tsx     — useTheme() → { theme, setTheme }
  AuthContext.tsx      — useAuth() → { user, signOut }
  AlertContext.tsx     — useGlobalAlert() → { showAlert, hideAlert }
  TenantContext.tsx    — useTenant()
```

## Standard Tab Header Pattern
All 4 tabs use this identical header pattern:
```tsx
<View style={[styles.header, { paddingTop: Math.max(insets.top, 50), backgroundColor: colors.background.primary, borderBottomColor: colors.border.primary }]}>
  <View style={styles.headerInner}>
    <Image source={isDark ? require('../../assets/images/ownitnow.png') : require('../../assets/images/ownitnow-light.png')} style={styles.headerLogo} resizeMode="contain" />
    <Text style={[styles.headerTitle, { color: colors.text.primary }]}>{t('tab.title')}</Text>
  </View>
</View>

// styles:
header: { paddingHorizontal: 24, paddingBottom: 16, borderBottomWidth: 1 }
headerInner: { flexDirection: 'row', alignItems: 'center' }
headerLogo: { width: 40, height: 40, marginRight: 12 }
headerTitle: { fontSize: 20, fontFamily: 'Inter-Bold', letterSpacing: -0.3 }
```

## Standard Sub-Screen Header Pattern
```tsx
<View style={[styles.header, { paddingTop: Math.max(insets.top, 44) + 16, backgroundColor: colors.background.primary, borderBottomColor: colors.border.primary }]}>
  <TouchableOpacity style={[styles.backButton, { backgroundColor: colors.background.secondary }]} onPress={() => router.back()}>
    <ArrowLeft size={24} color={colors.text.primary} />
  </TouchableOpacity>
  <View style={styles.headerContent}>
    <Text style={[styles.headerTitle, { color: colors.text.primary }]}>{t('screen.title')}</Text>
  </View>
</View>
```

## Shimmer Loading Pattern
Never use `ActivityIndicator`. All screens use shimmer from `@/components/Shimmer`:

```tsx
import { DashboardShimmer, ProjectsShimmer, PortfolioOverviewShimmer,
         PortfolioChartShimmer, PortfolioInvestmentRowShimmer,
         PortfolioTransactionRowShimmer, ProjectDetailShimmer,
         InvestmentShimmer, WalletsShimmer, AccountInfoShimmer,
         useShimmerAnim, ShimmerBlock } from '@/components/Shimmer';

// Early return pattern:
if (loading) return <ScreenNameShimmer />;

// Inline shimmer (for sub-sections):
const shimmerAnim = useShimmerAnim();
{loading ? <SomeShimmer anim={shimmerAnim} /> : <RealContent />}
```

## Alert Pattern
```tsx
const { showAlert } = useGlobalAlert();
showAlert(t('title'), t('message'), {
  buttonText: t('confirm'),
  buttonCallback: () => { /* primary action */ },
  secondaryButtonText: t('cancel'),   // optional
  secondaryButtonCallback: () => {},  // optional
});
```

## API Hook Pattern
```tsx
const result = await someHook.method();
if (result.success && result.data) {
  // use result.data.data.*
} else if (result.status === 401) {
  showAlert(t('profile.sessionExpired'), t('profile.loginAgain'));
  router.replace('/auth/login');
} else {
  showAlert(t('common.error'), t('common.errorMessage'));
}
```

## Typography Scale
```
xs=10, sm=12, base=14, lg=16, xl=18, 2xl=20, 3xl=24, 4xl=28
Spacing: xs=4, sm=8, md=12, lg=16, xl=20, 2xl=24, 3xl=32, 4xl=48
BorderRadius: xs=4, sm=8, md=12, lg=16, xl=20, 2xl=24
```

## Key Rules
1. Use `useFocusEffect(useCallback(() => { loadData(); }, []))` for screen data loading (not `useEffect`)
2. Always call `performOfferingCheck()` before fetching offerings
3. Session expiry (401) → `showAlert` + `router.replace('/auth/login')`
4. `RefreshControl` always uses `tintColor={colors.primary}` and `colors={[colors.primary]}`
5. Static `Shadows` import is always LightTheme — never spread it onto cards/buttons
6. `colors.text.inverse` is unreliable for button text — use `isDark ? '#0D1117' : '#FFFFFF'`
