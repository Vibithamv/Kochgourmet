# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this app is

Kochgourmet is a white-labeled real-estate / asset-tokenization investing app built on the **Floris / SimplyTokenized** multi-tenant platform. The same codebase powers other brands (e.g. OwnItNow); brand selection happens at runtime via `platformValidation()` against API keys in [config/apiHeaderConfig.tsx](config/apiHeaderConfig.tsx). Bundle ID `com.kochgourmet.app`, scheme `kochgourmet`, backend `stage.go.floris3.com/portal` (see [config/environment.tsx](config/environment.tsx)).

## Stack

- **Framework**: Expo SDK 54, Expo Router v6 (file-based routing), React Native 0.81.4, React 19, New Arch enabled, Hermes
- **Language**: TypeScript strict
- **UI**: `react-native-paper`, `lucide-react-native`, Inter family + Playfair Display
- **i18n**: `react-i18next` — locales in [i18n/locales/](i18n/locales/) (`de`, `en`, `es`). Always use `t('key')`, never hardcode UI strings.
- **Navigation**: `expo-router` (`router.push/replace/back()`) + `useFocusEffect` from `@react-navigation/native`
- **Wallets / Web3**: Thirdweb v5, Coinbase Mobile SDK, WalletConnect, ethers v5
- **Push**: `@react-native-firebase/messaging` + `expo-notifications`
- **Storage**: AsyncStorage (auth tokens, `offeringID`, `tenantID`, `AccountID`) + MMKV

## Commands

```bash
yarn dev               # expo start (telemetry off)
yarn dev:clear         # expo start --clear (use when bundler cache misbehaves)
yarn dev:android       # expo start --android --clear
yarn ios               # expo run:ios (native rebuild)
yarn android           # expo run:android (native rebuild)
yarn lint              # expo lint
yarn build:web         # expo export --platform web
yarn androidRelease    # JS bundle + clean drawables + ./gradlew assembleRelease
```

No test runner is configured. For type checking, run `tsc --noEmit` directly (no script alias).

## Bootstrap flow — read before touching auth / routing

[app/_layout.tsx](app/_layout.tsx) runs this sequence on cold start (`runAuthRouting`):

1. `platformValidation.validatePlatform()` hits the backend with the API key in [config/apiHeaderConfig.tsx](config/apiHeaderConfig.tsx). Failure → `/screens/platformError`. Success persists `offeringID` (first selected offering) + `tenantID` to AsyncStorage and stores allowed sign-in providers via `persistPlatformSignInOptionsFromValidateResponse`.
2. No `AccessToken`/`RefreshToken` → `/auth/login`. If the cold-start URL is an OAuth callback (`parseOAuthCallbackUrl`), the code + provider are passed to login as params.
3. With tokens, `userManagement.getUser()` runs and branches on `activeAccount.kyc_status`:
   - `CONFIRMED` + visibility `privatesale` / `whitelisting` → check `checkWhitelistStatus(AccountID, offeringID)` → tabs / `/screens/whitelistResponseWaiting` / `/auth/whitelistRequest`.
   - `CONFIRMED` otherwise → `/(tabs)`.
   - `REQUIRED` → `/auth/kycRequest`.
   - else → `/screens/kycWaiting`.
4. Android `BackHandler.exitApp()` writes `ASYNC_STORAGE_EXIT_RESET_TO_HOME=1` ([constants/navigation.ts](constants/navigation.ts)). On resume the root layout consumes the flag and replaces to `/(tabs)` so the user doesn't return to a stale stack.

Module-level flags `splashInitialNavigationDone` and `splashAuthBootstrapCompleted` guard against duplicate cold-start navigations and prevent `AppState` from eating the exit-home flag before bootstrap finishes — do not convert them to component state.

## Provider order

`app/_layout.tsx`:
`ThirdwebProvider > PaperProvider > TenantProvider > ThemeProvider > FcmNotificationBridge > AlertProvider > AuthProvider > Stack`.

`TenantProvider` must wrap `ThemeProvider` because tenant data can influence theming.

## File structure

```
app/
  _layout.tsx          — providers + cold-start auth routing
  (tabs)/              — Home (index), Projects, Portfolio, Account; engagement is registered but href:null
  project/[id].tsx     — offering / token detail (very large file)
  investment/[id].tsx  — purchase flow
  investment/success.tsx
  portfolio/transfer.tsx
  account/             — account-info, wallets, profile, payment-methods, personal-info, help-support
  auth/                — login, register(+Confirm,+Success), forgotPassword, kycRequest, whitelistRequest, callback, OAuth utils
  screens/             — KYC webview, doc sign webview, doc webview, payment webview, platform error, KYC waiting, whitelist gates

components/Shimmer.tsx          — every shimmer variant + useShimmerAnim()
components/ProjectCard.tsx      — reusable offering card
components/CustomSplash.tsx     — Modal-based splash shown ~3s after native splash hides
components/FcmNotificationBridge.{native,}.tsx — platform split

contexts/AlertContext.tsx       — useGlobalAlert() → showAlert / hideAlert
contexts/AuthContext.tsx        — useAuth() → { user, signOut }
contexts/ThemeContext.tsx       — useTheme() → { theme, setTheme }
contexts/TenantContext.tsx      — useTenant()

hooks/                 — thin wrappers around NetworkService. Every method returns
                        { success, data, error, status }. Call performOfferingCheck()
                        before any offering fetch.
services/NetworkService.tsx     — single HTTP entry point used by all hooks
config/                — apiHeaderConfig.tsx (tenant keys), environment.tsx (base URL), buildConfig.tsx
constants/themes/      — light.ts, dark.ts, darkGreen.ts; aggregated via constants/theme.ts
i18n/                  — index.ts + locales/{de,en,es}.json
```

The `engagement` tab and its file ([app/(tabs)/engagement.tsx](app/(tabs)/engagement.tsx)) exist but are intentionally hidden (`href: null` in the tabs layout) — do not add it to the visible tab bar without product confirmation.

`React.lazy(() => import('./index'))` etc. in [app/(tabs)/_layout.tsx](app/(tabs)/_layout.tsx) are unused — `Tabs.Screen` resolves by `name`, so those imports are dead code (safe to ignore, but don't model new screens on them).

## Theme system — READ THIS FIRST

Every screen/component must support all three themes.

```ts
const { theme } = useTheme();               // 'light' | 'dark' | 'darkGreen'
const colors = getColors(theme);            // from '@/constants/theme'
const isDark = theme === 'dark' || theme === 'darkGreen';
```

### Color tokens (always use these — never hardcode hex)

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

### Theme rules (each one has bitten us before)

- **Button text on primary background** is unreliable via `colors.text.inverse`. Use `isDark ? '#0D1117' : '#FFFFFF'`.
- **Never** import the static `Shadows` constant (`export const Shadows = LightTheme.shadows`) — it does not adapt to dark mode. Omit shadows or use `colors.shadow.primary`.
- **Never** use `StyleSheet.create({...})` with `colors.*` values — styles become stale when the theme changes. Use inline styles or `React.useMemo(() => StyleSheet.create({...}), [colors])`.
- **Never** hardcode `'grey'` / `'white'` / `'black'` or raw `rgba(0,0,0,0.x)` overlays — use color tokens and `colors.background.overlay`.

### Logo (single asset — *not* theme-paired)

Kochgourmet uses one logo file regardless of theme:

```tsx
<Image source={require('../assets/images/kochgourmet-logo.png')} />
```

(Some shared boilerplate may still reference `ownitnow.png` / `ownitnow-light.png` from sibling brands — replace those with `kochgourmet-logo.png` when touched.)

## Standard header patterns

Tab header:
```tsx
<View style={[styles.header, { paddingTop: Math.max(insets.top, 50), backgroundColor: colors.background.primary, borderBottomColor: colors.border.primary }]}>
  <View style={styles.headerInner}>
    <Image source={require('../../assets/images/kochgourmet-logo.png')} style={styles.headerLogo} resizeMode="contain" />
    <Text style={[styles.headerTitle, { color: colors.text.primary }]}>{t('tab.title')}</Text>
  </View>
</View>
// header: { paddingHorizontal: 24, paddingBottom: 16, borderBottomWidth: 1 }
// headerInner: { flexDirection: 'row', alignItems: 'center' }
// headerLogo: { width: 40, height: 40, marginRight: 12 }
// headerTitle: { fontSize: 20, fontFamily: 'Inter-Bold', letterSpacing: -0.3 }
```

Sub-screen header:
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

## Shimmer (never use `ActivityIndicator`)

All screens use shimmer from [components/Shimmer.tsx](components/Shimmer.tsx):

```tsx
import { DashboardShimmer, ProjectsShimmer, PortfolioOverviewShimmer,
         PortfolioChartShimmer, PortfolioInvestmentRowShimmer,
         PortfolioTransactionRowShimmer, ProjectDetailShimmer,
         InvestmentShimmer, WalletsShimmer, AccountInfoShimmer,
         useShimmerAnim, ShimmerBlock } from '@/components/Shimmer';

if (loading) return <ScreenNameShimmer />;             // early return for full screens

const shimmerAnim = useShimmerAnim();                  // for inline sub-section shimmers
{loading ? <SomeShimmer anim={shimmerAnim} /> : <RealContent />}
```

## Alert (global modal — never use RN `Alert.alert`)

```tsx
const { showAlert } = useGlobalAlert();
showAlert(t('title'), t('message'), {
  buttonText: t('confirm'),
  buttonCallback: () => { /* primary action */ },
  secondaryButtonText: t('cancel'),     // optional
  secondaryButtonCallback: () => {},    // optional
});
```

## API hook contract

Every hook in `hooks/` wraps [services/NetworkService.tsx](services/NetworkService.tsx) and returns `{ success, data, error, status }`. Standard call site:

```tsx
const result = await someHook.method();
if (result.success && result.data) {
  // use result.data.data.*   (NetworkService nests once, the backend nests again)
} else if (result.status === 401) {
  showAlert(t('profile.sessionExpired'), t('profile.loginAgain'));
  router.replace('/auth/login');
} else {
  showAlert(t('common.error'), t('common.errorMessage'));
}
```

Auth headers (Bearer `IDToken`, `x-refresh-token` from `RefreshToken`) are attached per-call inside each hook, not by a global interceptor. `API_HEADER_CONFIG` (tenant `Api-Key` / `Invest-Key`) must be spread into every request.

## Key rules

1. Screen data loading uses `useFocusEffect(useCallback(() => { loadData(); }, []))`, not `useEffect`.
2. Always call `performOfferingCheck()` ([hooks/useOfferingCheck.tsx](hooks/useOfferingCheck.tsx)) before fetching offerings.
3. On 401 anywhere: `showAlert` + `router.replace('/auth/login')`.
4. `RefreshControl`: `tintColor={colors.primary}` and `colors={[colors.primary]}`.
5. The big screens (`portfolio.tsx` ~1.7k, `project/[id].tsx` ~2k, `investment/[id].tsx` ~1.6k, `engagement.tsx` ~1.5k) intentionally hold a lot of logic — split into hooks/sub-components when adding, don't pile on.
6. Console output is heavily suppressed at root ([app/_layout.tsx:41-73](app/_layout.tsx#L41-L73)) for "Samsung compatibility." When debugging, comment those filters out locally rather than scattering `console.log`s.

## Typography / spacing scale

```
fontSize:     xs=10, sm=12, base=14, lg=16, xl=18, 2xl=20, 3xl=24, 4xl=28
spacing:      xs=4,  sm=8,  md=12,   lg=16, xl=20, 2xl=24, 3xl=32, 4xl=48
borderRadius: xs=4,  sm=8,  md=12,   lg=16, xl=20, 2xl=24
```
