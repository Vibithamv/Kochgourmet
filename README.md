# Assetera

Real-estate / asset-tokenization investing app on the Floris / SimplyTokenized white-label platform. Built with Expo + React Native.

See [CLAUDE.md](./CLAUDE.md) for architecture, bootstrap flow, theme system, and engineering conventions.

## Quick start

```bash
yarn install
yarn dev               # Metro + dev menu
yarn ios               # native iOS build
yarn android           # native Android build
yarn lint
```

## Build

```bash
yarn androidRelease    # release APK (./android/app/build/outputs/apk/release/)
yarn build:web         # web export via expo
```

## Configuration

- Backend base URL: [config/environment.tsx](config/environment.tsx) (`dev` → stage; `prod` → prod)
- Tenant API keys: [config/apiHeaderConfig.tsx](config/apiHeaderConfig.tsx)
- Locales: [i18n/locales/](i18n/locales/) (`de`, `en`, `es`)
