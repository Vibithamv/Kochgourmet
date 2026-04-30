Create a new themed screen at the path specified: $ARGUMENTS

The path argument should be like: app/account/my-screen.tsx

Use this exact template structure:

```tsx
import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';
import { getColors, Typography, Spacing, BorderRadius } from '@/constants/theme';
import { useGlobalAlert } from '@/contexts/AlertContext';

export default function MyScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const colors = getColors(theme);
  const isDark = theme === 'dark' || theme === 'darkGreen';
  const insets = useSafeAreaInsets();
  const { showAlert } = useGlobalAlert();
  const [loading, setLoading] = useState(true);

  // if (loading) return <MyScreenShimmer />;   ← add shimmer before data renders

  return (
    <View style={[styles.container, { backgroundColor: colors.background.secondary }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 44) + 16, backgroundColor: colors.background.primary, borderBottomColor: colors.border.primary }]}>
        <TouchableOpacity style={[styles.backButton, { backgroundColor: colors.background.secondary }]} onPress={() => router.back()}>
          <ArrowLeft size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: colors.text.primary }]}>{t('screen.title')}</Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: insets.bottom + 40 }} showsVerticalScrollIndicator={false}>
        {/* content here */}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
  },
  backButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md },
  headerContent: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: Typography.fontSize.xl, fontFamily: 'Inter-Bold', letterSpacing: -0.3 },
  headerRight: { width: 40 },
  content: { flex: 1 },
});
```

Rules:
- Never hardcode colors — always use colors.* tokens
- Never use Shadows static import — omit shadows
- Always use t() for any visible text
- Always include the back button pattern shown above
- Add a shimmer screen to Shimmer.tsx if there is a loading state
