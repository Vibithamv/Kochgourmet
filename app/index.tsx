// Routing is handled entirely by runAuthRouting in app/_layout.tsx.
// This file must exist so Expo Router has a root index route,
// but it renders nothing — the CustomSplash modal covers the screen
// until _layout.tsx completes its auth routing.
export default function IndexScreen() {
  return null;
}
