# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this app is

Kochgourmet is a real-estate / asset-tokenization investing app (kochgourmet.com) built on the **Floris / SimplyTokenized** white-label multi-tenant platform. Brand selection happens at runtime via `platformValidation()` against API keys in [config/apiHeaderConfig.tsx](config/apiHeaderConfig.tsx). Backend: `stage.go.floris3.com/portal` (see [config/environment.tsx](config/environment.tsx)).

## Stack

- **Framework**: Expo SDK 54, Expo Router v6 (file-based routing), React Native 0.81.4, React 19, New Arch enabled, Hermes
- **Language**: TypeScript strict
- **UI**: `react-native-paper`, `lucide-react-native`, **Inter** (`Inter-Regular`, `Inter-Medium`, `Inter-SemiBold`, `Inter-Bold`) + **Playfair Display** (`PlayfairDisplay_700Bold`, `PlayfairDisplay_500Medium`) for display/heading text
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
yarn build:web         # expo export --platform web → dist/
yarn androidRelease    # JS bundle + clean drawables + ./gradlew assembleRelease
```

No test runner is configured. For type checking, run `tsc --noEmit` directly (no script alias).

## Bootstrap flow — read before touching auth / routing

[app/_layout.tsx](app/_layout.tsx) runs `runAuthRouting` on cold start:

1. `platformValidation.validatePlatform()` hits the backend with the API key from [config/apiHeaderConfig.tsx](config/apiHeaderConfig.tsx). Failure → `/screens/platformError`. Success persists `offeringID` + `tenantID` to AsyncStorage and stores allowed sign-in providers via `persistPlatformSignInOptionsFromValidateResponse`.
2. No `AccessToken`/`RefreshToken` → `/auth/login`. If the cold-start URL is an OAuth callback (`parseOAuthCallbackUrl`), the code + provider are passed to login as params.
3. With tokens, `userManagement.getUser()` runs and branches on `activeAccount.kyc_status`:
   - `CONFIRMED` + visibility `privatesale` / `whitelisting` → check `checkWhitelistStatus` → tabs / `/screens/whitelistResponseWaiting` / `/auth/whitelistRequest`.
   - `CONFIRMED` otherwise → `/(tabs)`.
   - `REQUIRED` → `/auth/kycRequest`.
   - else → `/screens/kycWaiting`.
4. Android `BackHandler.exitApp()` writes `ASYNC_STORAGE_EXIT_RESET_TO_HOME=1`. On resume the root layout consumes the flag and replaces to `/(tabs)`.

Module-level flags `splashInitialNavigationDone` and `splashAuthBootstrapCompleted` guard against duplicate cold-start navigations — do not convert them to component state.

## Provider order

`ThirdwebProvider > PaperProvider > TenantProvider > ThemeProvider > FcmNotificationBridge > AlertProvider > AuthProvider > FavouritesProvider > FoldersProvider > Stack`

`TenantProvider` must wrap `ThemeProvider`. Note: `TenantContext` holds hardcoded placeholder defaults — actual brand/tenant behavior is driven by `platformValidation()` results persisted to AsyncStorage, not by `useTenant()`.

## Tabs — current layout (redesigned for demo)

The tab bar was redesigned with food/cooking themed labels for the demo. Underlying routes and screens are unchanged:

| Tab name | Route | Icon | Label |
|---|---|---|---|
| `index` | `/` | Star | Rezepte |
| `projects` | `/projects` | ChefHat | Magazin |
| `portfolio` | `/portfolio` | Heart | Favoriten |
| `offerings` | `/offerings` | TrendingUp | Bonus |
| `account` | `/account` | Menu | Menü |
| `engagement` | hidden (`href: null`) | — | — |

Do not make `engagement` visible without product confirmation.

## File structure

```
app/
  _layout.tsx          — providers + cold-start auth routing
  (tabs)/              — Rezepte (index), Magazin (projects), Favoriten (portfolio), Bonus (offerings), Menü (account); Engagement hidden
  project/[id].tsx     — offering / token detail
  investment/[id].tsx  — purchase flow
  investment/success.tsx
  portfolio/transfer.tsx
  recipe/[id].tsx      — recipe detail (demo, uses mockRecipeDetails.ts)
  recipe/filter.tsx    — recipe filter screen (demo)
  magazin/[id].tsx     — article/magazine detail (demo, uses mockArticleDetails.ts)
  favoriten/[id].tsx   — folder detail for saved recipes (demo, uses FoldersContext)
  account/             — account-info, wallets, profile, payment-methods, personal-info, help-support, settings, datenschutz, impressum
  auth/                — login, register(+Confirm,+Success), forgotPassword, kycRequest, whitelistRequest, callback, OAuth utils
  screens/             — KYC webview, doc sign webview, doc webview, payment webview, platform error, KYC waiting, whitelist gates
  screens/portfolio.tsx  — standalone portfolio screen (non-tab route)
  screens/projects.tsx   — standalone projects screen (non-tab route)

components/
  Shimmer.tsx                          — every shimmer variant + useShimmerAnim()
  ProjectCard.tsx                      — reusable offering card
  RecipeCard.tsx                       — reusable recipe card (demo)
  CustomSplash.tsx                     — Modal-based splash shown ~3s after native splash hides
  FcmNotificationBridge.{native,}.tsx  — platform-split (see below)
  ThemeToggle.tsx                      — theme switcher (used in settings screen)
  LanguageSelector.tsx                 — language picker (used in settings screen)
  OptimizedImage.tsx                   — image with fade-in / error fallback
  InvestmentButton.tsx                 — CTA button for investment flow
  OfferingTokenSlider.tsx              — token quantity slider in investment flow
  TransactionDetailsModal.tsx          — bottom sheet for transaction details
  ConfirmationCodeInput.tsx            — OTP/code input for register confirm
  paymentProviderDropdown.tsx          — payment method selector
  walletAddressDropdown.tsx            — wallet address selector

contexts/
  AlertContext.tsx          — useGlobalAlert() → showAlert / hideAlert
  AuthContext.tsx           — useAuth() → { user, signOut }
  ThemeContext.tsx          — useTheme() → { theme, setTheme }
  TenantContext.tsx         — useTenant() (stub — see note above)
  FavouritesContext.tsx     — useFavourites() → { recipes, favourites, toggleFavourite } (in-memory, demo)
  FoldersContext.tsx        — useFolders() → { folders, getFolder, renameFolder, removeRecipeFromFolder } (in-memory, demo)
  RegisterPendingContext.tsx — useRegisterPending() — holds registration form data across confirm-code step

hooks/                 — thin wrappers around NetworkService, each returns { success, data, error, status }
services/NetworkService.tsx     — single HTTP entry point used by all hooks
config/                — apiHeaderConfig.tsx (tenant keys), environment.tsx (base URL), buildConfig.tsx
constants/themes/      — light.ts, dark.ts, darkGreen.ts; aggregated via constants/themes/index.ts
i18n/                  — index.ts + locales/{de,en,es}.json

utils/
  authNavigation.ts           — replaceLoginClearingAuthStack() — use this instead of raw router.replace
  authUtils.ts                — updateAuthTokensFromHeaders / updateAuthTokensFromResponse
  offeringLocalizedContent.ts — getLocalizedOfferingField() helpers
  offeringTokenMetrics.ts     — computeOfferingTokenMetrics() (income/ownership calculations)
  walletUtils.ts              — wallet address formatting helpers
  mockData.ts                 — DO NOT use in production code paths
  mockRecipeDetails.ts        — DO NOT use in production code paths (demo recipe data)
  mockArticleDetails.ts       — DO NOT use in production code paths (demo article data)
```

## Platform-split files

Push notification and FCM utilities follow Expo's `.native.ts` / `.ts` convention. When adding new platform-split code, always create both the `.native.ts` implementation and a no-op `.ts` web stub.

## Theme system — READ THIS FIRST

Every screen/component must support all three themes.

```ts
const { theme } = useTheme();
const colors = getColors(theme);            // from '@/constants/theme'
const isDark = theme === 'dark' || theme === 'darkGreen';
```

Additional theme-aware getters (all from `@/constants/theme`):

```ts
getTypography(theme)    // .fontFamily.display → PlayfairDisplay_700Bold for headings
getSpacing(theme)
getBorderRadius(theme)
getShadows(theme)       // use this — never the static Shadows export
getLayout(theme)
```

### Color tokens (always use these — never hardcode hex)

Palette: warm cream surfaces, coral primary, burgundy secondary, forest accent.

| Token | Light | Dark |
|---|---|---|
| `colors.primary` | `#EE7B5F` | `#F08A72` |
| `colors.secondary` | `#8B2323` | `#C47A6E` |
| `colors.accent` | `#2D4635` | `#6BA888` |
| `colors.background.primary` | `#FFFFFF` | `#171311` |
| `colors.background.secondary` | `#FFF9F0` | `#1F1A18` |
| `colors.background.tertiary` | `#F5EDE4` | `#2A2420` |
| `colors.background.card` | `#FFFFFF` | `#221E1C` |
| `colors.background.overlay` | `rgba(45,70,53,0.45)` | `rgba(0,0,0,0.78)` |
| `colors.text.primary` | `#141414` | `#FFF9F0` |
| `colors.text.secondary` | `#333333` | `#C9BEB5` |
| `colors.text.tertiary` | `#6B6560` | `#8A8278` |
| `colors.text.inverse` | `#FFFFFF` | `#171311` |
| `colors.border.primary` | `#E5DDD4` | `#3A322D` |
| `colors.interactive.hover` | `#FFF3E8` | `#2A2420` |
| `colors.success` | `#2D5A42` | `#7BC99A` |
| `colors.error` | `#DC2626` | `#F87171` |
| `colors.warning` | `#F59E0B` | `#FBBF24` |

The `darkGreen` theme is a forest-night variant (`#0F1612` bg, same coral primary, sage accents).

### Component radius tokens

`colors.componentRadius` provides semantic radius values:

| Key | Value | Use for |
|---|---|---|
| `button` | `9999` | pill buttons |
| `card` | `16` | cards |
| `modal` | `20` | bottom sheets / modals |
| `input` | `9999` | text inputs |

### Theme rules (each has caused bugs before)

- **Button text on primary background**: `colors.text.inverse` is unreliable — use `isDark ? '#0D1117' : '#FFFFFF'`.
- **Never** use the static `Shadows` export — it is always LightTheme and won't adapt. Use `getShadows(theme).card` etc.
- **Never** use `StyleSheet.create({...})` with `colors.*` values — styles go stale on theme change. Use inline styles or `React.useMemo(() => StyleSheet.create({...}), [colors])`.
- **Never** hardcode `'grey'` / `'white'` / `'black'` or raw `rgba(0,0,0,x)` overlays — use tokens.

### Logo

The Kochgourmet logo is a PNG at `assets/images/kochgourmet-logo.png`. Standard header usage:

```tsx
<View style={styles.headerLogoWrap}>
  <Image source={require('../../assets/images/kochgourmet-logo.png')} style={styles.headerLogo} resizeMode="contain" />
</View>
// headerLogoWrap: { width: 48, height: 48, marginRight: 25, justifyContent: 'center', alignItems: 'center', overflow: 'visible' }
// headerLogo:     { position: 'absolute', width: 76, height: 76 }
```

## Standard header patterns

Tab header:
```tsx
<View style={[styles.header, { paddingTop: Math.max(insets.top, 50), backgroundColor: colors.background.primary, borderBottomColor: colors.border.primary }]}>
  <View style={styles.headerInner}>
    <View style={styles.headerLogoWrap}>
      <Image source={require('../../assets/images/kochgourmet-logo.png')} style={styles.headerLogo} resizeMode="contain" />
    </View>
    <Text style={[styles.headerTitle, { color: colors.text.primary }]}>{t('tab.title')}</Text>
  </View>
</View>
// header:      { paddingHorizontal: 24, paddingBottom: 16, borderBottomWidth: 1 }
// headerInner: { flexDirection: 'row', alignItems: 'center' }
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

```tsx
import { DashboardShimmer, ProjectsShimmer, PortfolioOverviewShimmer,
         PortfolioChartShimmer, PortfolioInvestmentRowShimmer,
         PortfolioTransactionRowShimmer, ProjectDetailShimmer,
         InvestmentShimmer, WalletsShimmer, AccountInfoShimmer,
         useShimmerAnim, ShimmerBlock } from '@/components/Shimmer';

if (loading) return <ScreenNameShimmer />;   // full-screen early return

const shimmerAnim = useShimmerAnim();
{loading ? <SomeShimmer anim={shimmerAnim} /> : <RealContent />}
```

## Alert (global modal — never use RN `Alert.alert`)

```tsx
const { showAlert } = useGlobalAlert();
showAlert(t('title'), t('message'), {
  buttonText: t('confirm'),
  buttonCallback: () => {},
  secondaryButtonText: t('cancel'),     // optional
  secondaryButtonCallback: () => {},    // optional
});
```

## NetworkService and auth headers

[services/NetworkService.tsx](services/NetworkService.tsx) has **global axios interceptors** that automatically attach `Authorization: Bearer <IDToken>` and `x-refresh-token` on every request, and silently persist refreshed tokens from response headers via `updateAuthTokensFromHeaders`.

Existing hooks also manually pass auth headers per-call — this is redundant legacy code predating the interceptor. New hooks should rely on the interceptor and only spread `API_HEADER_CONFIG`:

```tsx
const response = await NetworkService.get('/endpoint', {}, {
  ...API_HEADER_CONFIG,
});
```

## Two backends — Floris portal vs Kochgourmet API

This app talks to **two independent backends** with separate services, auth tokens, and hook families. Pick the right one for the feature:

| | Floris / SimplyTokenized portal | Kochgourmet API (SimplyTokenized proxy) |
|---|---|---|
| Domain | tokenization: offerings, KYC, wallets, portfolio, investments | content: recipes, magazine, favorites/folders, app user profile |
| Base URL | `stage.go.floris3.com/portal` ([config/environment.tsx](config/environment.tsx)) | `dev.go.simplytokenized.com/kochgourmet` ([config/kochgourmetApiConfig.ts](config/kochgourmetApiConfig.ts)) |
| Service | [services/NetworkService.tsx](services/NetworkService.tsx) | [services/KochgourmetApiService.ts](services/KochgourmetApiService.ts) |
| Headers | `API_HEADER_CONFIG` (`apiHeaderConfig.tsx`) | `KOCHGOURMET_API_HEADERS` (`Api-Key` / `Invest-Key`) |
| Hooks | top-level [hooks/](hooks/) (e.g. `userManagement`, `listOfferings`) | [hooks/mobileApp/](hooks/mobileApp/) (re-exported via [hooks/mobileApp/index.ts](hooks/mobileApp/index.ts)) |
| Types | [types/index.ts](types/index.ts) | [types/mobileAppApi.ts](types/mobileAppApi.ts) (Hydra collections) |

The **Kochgourmet API is the live content/auth integration** (active on `feature/api-integration`); the demo screens that used `mockRecipeDetails.ts` / `mockArticleDetails.ts` / `FavouritesContext` / `FoldersContext` are being migrated to it.

- `KochgourmetApiService` is a **proxy**: every call goes through an operation key from `KOCHGOURMET_OPERATIONS` ([config/kochgourmetApi.ts](config/kochgourmetApi.ts)) — use `proxyGet(op, {pathParams, query})` / `proxyPost(...)`, never raw paths. Returns the same `{ success, data, error, status }` contract as portal hooks.
- It has its **own axios interceptors** that attach the Kochgourmet JWT and auto-refresh on expiry via [utils/kochgourmetTokenRefresh.ts](utils/kochgourmetTokenRefresh.ts) — independent of NetworkService's interceptors.
- App auth now flows through the Kochgourmet login. `persistMobileAppAuth` ([utils/mobileAppAuthUtils.ts](utils/mobileAppAuthUtils.ts)) stores the JWT under `MobileAppJwtToken` / `MobileAppRefreshToken` **and** mirrors it into the legacy `IDToken` / `AccessToken` / `RefreshToken` keys so portal calls and the bootstrap flow keep working.

## API hook contract

```tsx
const result = await someHook.method();
if (result.success && result.data) {
  // use result.data.data.*   (NetworkService nests once, backend nests again)
} else if (result.status === 401) {
  showAlert(t('profile.sessionExpired'), t('profile.loginAgain'));
  replaceLoginClearingAuthStack();   // utils/authNavigation.ts — handles iOS modal stack safely
} else {
  showAlert(t('common.error'), t('common.errorMessage'));
}
```

Use `replaceLoginClearingAuthStack()` instead of `router.replace('/auth/login')` from auth/modal screens — it calls `router.dismissAll()` first to avoid iOS errors when the stack has only one screen.

## Unused installed packages

`@tanstack/react-query` and `lib/supabase.ts` (`@supabase/supabase-js`) are installed but not wired into any app hooks. Do not model new data-fetching code on them without an intentional adoption decision.

## Key rules

1. Screen data loading uses `useFocusEffect(useCallback(() => { loadData(); }, []))`, not `useEffect`.
2. Always call `performOfferingCheck()` ([hooks/useOfferingCheck.tsx](hooks/useOfferingCheck.tsx)) before fetching offerings.
3. On 401 anywhere: `showAlert` + `replaceLoginClearingAuthStack()`.
4. `RefreshControl`: `tintColor={colors.primary}` and `colors={[colors.primary]}`.
5. The big screens (`portfolio.tsx`, `project/[id].tsx`, `investment/[id].tsx`) intentionally hold a lot of logic — split into hooks/sub-components when adding, don't pile on.
6. Console output is heavily suppressed at root ([app/_layout.tsx](app/_layout.tsx)) for Samsung compatibility. When debugging, comment those filters out locally.

## Typography / spacing scale

```
fontSize:      xs=10, sm=12, base=14, lg=16, xl=18, 2xl=20, 3xl=24, 4xl=28, 5xl=32, 6xl=36
spacing:       xs=4,  sm=8,  md=12,  lg=16,  xl=20, 2xl=24, 3xl=32, 4xl=48, 5xl=64, 6xl=80, 7xl=96
borderRadius:  xs=4,  sm=8,  md=12,  lg=16,  xl=20, 2xl=24, 3xl=32, full=9999
```
