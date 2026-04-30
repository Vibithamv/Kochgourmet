Apply dark/light/darkGreen theme support to the file specified: $ARGUMENTS

Steps:

1. Read the target file first.

2. Find every theme problem:
   - Hardcoded colors: 'white', 'black', 'grey', any #hex, any rgba(0,0,0,...)
   - Static Shadows spread: ...Shadows.sm, ...Shadows.lg, etc. — remove all
   - StyleSheet.create({}) that references colors.* outside a React.useMemo
   - Missing useTheme() / getColors(theme) imports
   - Logo without isDark branch
   - Button text using colors.text.inverse instead of isDark ? '#0D1117' : '#FFFFFF'
   - Modal overlays using rgba(0,0,0,x) instead of colors.background.overlay
   - ActivityIndicator — replace with appropriate shimmer from @/components/Shimmer

3. Fix using CLAUDE.md patterns:
   - Import useTheme, getColors if missing
   - const isDark = theme === 'dark' || theme === 'darkGreen'
   - Replace all hardcoded colors with colors.* tokens
   - Remove all ...Shadows.* spreads
   - Wrap any StyleSheet.create with colors.* in React.useMemo(() => StyleSheet.create({...}), [colors])
   - Fix logo: isDark ? require('...ownitnow.png') : require('...ownitnow-light.png')
   - Fix primary button text: isDark ? '#0D1117' : '#FFFFFF'

4. Change ONLY colors and theme awareness. Do not touch layout, logic, or functionality.

5. Remove unused imports after editing.
