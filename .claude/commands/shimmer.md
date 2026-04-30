Add shimmer loading animation to the screen specified: $ARGUMENTS

Steps:

1. Read the target screen file.

2. Identify all loading states:
   - Any ActivityIndicator usage
   - Any loading boolean state
   - Any spinner or placeholder shown during data fetch

3. Check what shimmer components already exist in @/components/Shimmer.tsx. 
   Existing exports: DashboardShimmer, ProjectsShimmer, ProjectDetailShimmer,
   InvestmentShimmer, WalletsShimmer, AccountInfoShimmer, PortfolioChartShimmer,
   PortfolioInvestmentRowShimmer, PortfolioOverviewShimmer, PortfolioTransactionRowShimmer,
   ProjectCardShimmer, ShimmerBlock, useShimmerAnim

4. If a matching shimmer exists — import and use it directly.

5. If no matching shimmer exists — add one to Shimmer.tsx:
   - Build it to visually match the real screen's layout (header, cards, text lines)
   - Use ShimmerBlock for each element with realistic width/height proportions
   - Mirror the real header: same paddingTop, same logo placement, same background
   - Use colors.background.* and colors.border.primary for all containers
   - Export it from Shimmer.tsx

6. Apply to the screen:
   - Full-screen shimmer: use early return pattern — if (loading) return <ScreenShimmer />;
   - Section shimmer: const shimmerAnim = useShimmerAnim(); then {loading ? <SectionShimmer anim={shimmerAnim} /> : <RealContent />}

7. Remove ActivityIndicator import if no longer used.

8. Do not change any data fetching logic, only the loading UI.
