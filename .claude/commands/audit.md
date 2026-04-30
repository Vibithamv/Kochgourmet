Audit the file or directory specified for theme, shimmer, and code quality issues: $ARGUMENTS

Report findings grouped by severity. Do not make any edits — only report.

Check for:

CRITICAL (breaks dark mode):
- Hardcoded colors: 'white', 'black', 'grey', #hex values, rgba(0,0,...) overlays
- StyleSheet.create({}) with colors.* outside a React.useMemo (stale after theme change)
- Button text using colors.text.inverse on primary background (use isDark pattern)
- ActivityIndicator anywhere (should be replaced with shimmer)
- Missing useTheme()/getColors(theme) in a component that renders color

MEDIUM (visual inconsistency):
- ...Shadows.* spread (always LightTheme, doesn't adapt)
- Logo image without isDark branch
- Missing borderBottomColor on headers
- profileCard/menuItem with hardcoded backgroundColor

LOW (cleanup):
- Unused imports
- console.log statements
- Commented-out JSX blocks that are no longer needed

For each issue found: report the file, line number, the bad code, and the correct fix.
Format as a checklist so items can be tracked.
