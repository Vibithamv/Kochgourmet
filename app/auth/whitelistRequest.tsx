import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  getColors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
} from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { whitelistManagement } from '@/hooks/whitelistManagement';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useGlobalAlert } from '@/contexts/AlertContext';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut } from 'lucide-react-native';
import { userManagement } from '@/hooks/userManagement';
import { useFocusEffect } from '@react-navigation/native';

export default function WhitelistRequestScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const colors = getColors(theme);
  const request = whitelistManagement();
  const { showAlert } = useGlobalAlert();
  const { signOut } = useAuth();
  const userInfo = userManagement();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  const [loading, setLoading] = React.useState(false);

  useFocusEffect(
    React.useCallback(() => {
      void getUser();
      return () => {};
    }, [])
  );

  useEffect(() => {
    void getUser();
  }, []);

  const getUser = async () => {
    userInfo.getUser().then(async (data) => {
      if (data.success && data.data) {
        await AsyncStorage.setItem('AccountID', data.data.data.activeAccount.id);
      } else if (data.status === 401) {
        showAlert('Session Expired', 'Please login again....');
        router.replace('/auth/login');
      }
    });
  };

  const handleRequest = async () => {
    setLoading(true);
    const offeringID = (await AsyncStorage.getItem('offeringID')) ?? '';
    const result = await request.whiteListRequest(
      await AsyncStorage.getItem('AccountID'),
      offeringID
    );
    setLoading(false);
    if (result.success) {
      router.replace('/screens/whitelistResponseWaiting');
    } else {
      showAlert(t('common.error'), result.error.message || t('common.tryAgain'));
    }
  };

  const handleLogout = async () => {
    await signOut();
    router.replace('/auth/login');
  };

  return (
    <LinearGradient colors={colors.gradient.secondary} style={styles.gradient}>
      <TouchableOpacity
        style={[
          styles.logoutBtn,
          { top: insets.top + 10, backgroundColor: colors.background.card },
        ]}
        onPress={() =>
          showAlert(t('common.logout'), t('common.logoutMsg'), {
            buttonText: t('common.logout'),
            buttonCallback: () => {
              void handleLogout();
            },
            secondaryButtonText: t('common.cancel'),
          })
        }
      >
        <LogOut size={22} color={colors.text.primary} />
      </TouchableOpacity>
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingBottom: Math.max(insets.bottom, 30) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[styles.card, { backgroundColor: colors.background.card }]}
        >
          <Text style={[styles.title, { color: colors.text.primary }]}>
            {t('whitelistRequest.title')}
          </Text>

          <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
            {t('whitelistRequest.subtitle')}
          </Text>

          <TouchableOpacity
            style={[styles.buttonPrimary, { backgroundColor: colors.primary }]}
            disabled={loading}
            onPress={() => {
              void handleRequest();
            }}
          >
            {loading ? (
              <ActivityIndicator size="small" color={colors.text.inverse} />
            ) : (
              <Text style={[styles.buttonText, { color: colors.text.inverse }]}>
                {t('whitelistRequest.requestAccess')}
              </Text>
            )}
          </TouchableOpacity>

          <View style={styles.footerNote}>
            <View style={styles.dot} />
            <Text style={[styles.noteText, { color: colors.text.secondary }]}>
              {t('whitelistRequest.reviewNotice')}
            </Text>
          </View>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.text.secondary }]}>
              {t('common.poweredBy')}{' '}
            </Text>
            <Text style={[styles.brandText, { color: colors.primary }]}>
              {t('common.brandName')}
            </Text>
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const createStyles = (colors: ReturnType<typeof getColors>) =>
  StyleSheet.create({
    gradient: {
      flex: 1,
    },
    container: {
      flexGrow: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: Spacing['3xl'],
      paddingTop: Spacing['5xl'],
    },
    card: {
      borderRadius: Spacing['3xl'],
      padding: Spacing['3xl'],
      ...Shadows.lg,
      width: '100%',
    },
    title: {
      fontSize: Typography.fontSize['5xl'],
      fontFamily: Typography.fontFamily.bold,
      textAlign: 'center',
      marginBottom: Spacing.lg,
    },
    subtitle: {
      fontSize: Typography.fontSize.base,
      fontFamily: Typography.fontFamily.regular,
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: Spacing['4xl'],
    },
    buttonPrimary: {
      width: '100%',
      borderRadius: BorderRadius.md,
      paddingVertical: Spacing.lg,
      alignItems: 'center',
      marginBottom: Spacing.md,
      ...Shadows.button,
    },
    buttonText: {
      fontSize: Typography.fontSize.lg,
      fontFamily: Typography.fontFamily.semiBold,
    },
    footerNote: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: Spacing['5xl'],
    },
    dot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.text.tertiary,
      marginRight: 8,
    },
    noteText: {
      fontSize: Typography.fontSize.sm,
      fontFamily: Typography.fontFamily.regular,
      textAlign: 'center',
    },
    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'center',
    },
    footerText: {
      fontSize: Typography.fontSize.sm,
      fontFamily: Typography.fontFamily.regular,
    },
    brandText: {
      fontSize: Typography.fontSize.sm,
      fontFamily: Typography.fontFamily.medium,
    },
    logoutBtn: {
      position: 'absolute',
      right: 20,
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 10,
      zIndex: 999,
    },
  });
