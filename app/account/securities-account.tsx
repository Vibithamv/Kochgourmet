import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '@/contexts/ThemeContext';
import { getColors } from '@/constants/theme';
import { useGlobalAlert } from '@/contexts/AlertContext';
import { userManagement } from '@/hooks/userManagement';
import { replaceLoginClearingAuthStack } from '@/utils/authNavigation';
import { messageFromApiError } from '@/utils/apiErrorMessage';
import { readSecuritiesAccountFromUserResponse } from '@/utils/securitiesAccountUtils';
import { SecuritiesAccountShimmer } from '@/components/Shimmer';

export default function SecuritiesAccountScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const colors = getColors(theme);
  const isDark = theme === 'dark' || theme === 'darkGreen';
  const insets = useSafeAreaInsets();
  const { showAlert } = useGlobalAlert();
  const userAccount = useMemo(() => userManagement(), []);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [accountNumber, setAccountNumber] = useState('');
  const [bicSwiftCode, setBicSwiftCode] = useState('');
  const [accountFocused, setAccountFocused] = useState(false);
  const [bicFocused, setBicFocused] = useState(false);
  const isInitialLoad = useRef(true);

  const loadSecuritiesAccount = useCallback(async () => {
    const showShimmer = isInitialLoad.current;
    if (showShimmer) {
      setLoading(true);
    }

    const result = await userAccount.getUser();
    if (result.success && result.data) {
      const fields = readSecuritiesAccountFromUserResponse(result.data);
      setAccountNumber((prev) => fields.securities_account_number || prev);
      setBicSwiftCode((prev) => fields.securities_bic_swift_code || prev);
      if (showShimmer) {
        setLoading(false);
        isInitialLoad.current = false;
      }
      return;
    }

    if (showShimmer) {
      setLoading(false);
      isInitialLoad.current = false;
    }
    if (result.status === 401) {
      showAlert(t('profile.sessionExpired'), t('profile.loginAgain'));
      replaceLoginClearingAuthStack();
      return;
    }
    showAlert(t('common.error'), t('common.errorMessage'));
  }, [showAlert, t, userAccount]);

  useFocusEffect(
    useCallback(() => {
      void loadSecuritiesAccount();
    }, [loadSecuritiesAccount]),
  );

  const handleSave = () => {
    Keyboard.dismiss();

    const trimmedAccountNumber = accountNumber.trim();
    const trimmedBicSwiftCode = bicSwiftCode.trim();

    if (!trimmedAccountNumber || !trimmedBicSwiftCode) {
      showAlert(t('common.error'), t('auth.errors.fillAllFields'));
      return;
    }

    setSaving(true);
    void (async () => {
      try {
        const result = await userAccount.updateSecuritiesAccount({
          securities_account_number: trimmedAccountNumber,
          securities_bic_swift_code: trimmedBicSwiftCode,
        });

        if (!result.success) {
          if (result.status === 401) {
            showAlert(t('profile.sessionExpired'), t('profile.loginAgain'));
            replaceLoginClearingAuthStack();
            return;
          }
          showAlert(
            t('common.failed'),
            messageFromApiError(result.error, t('account.securitiesAccountSaveFailed')),
          );
          return;
        }

        setAccountNumber(trimmedAccountNumber);
        setBicSwiftCode(trimmedBicSwiftCode);
        showAlert(t('common.success'), t('account.securitiesAccountSaved'), {
          buttonText: t('common.ok'),
        });
      } finally {
        setSaving(false);
      }
    })();
  };

  const borderFor = (focused: boolean) => (focused ? colors.primary : colors.border.primary);
  const canSave =
    accountNumber.trim().length > 0 && bicSwiftCode.trim().length > 0 && !saving;

  if (loading) {
    return <SecuritiesAccountShimmer />;
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background.primary }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop: Math.max(insets.top, 44) + 16,
            backgroundColor: colors.background.primary,
            borderBottomColor: colors.border.primary,
          },
        ]}
      >
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: colors.background.secondary }]}
          onPress={() => router.back()}
          hitSlop={8}
          activeOpacity={0.7}
        >
          <ArrowLeft size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text
            style={[styles.headerTitle, { color: colors.text.primary }]}
            numberOfLines={2}
          >
            {t('account.securitiesAccount')}
          </Text>
        </View>
      </View>

      <KeyboardAwareScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: 26,
          paddingTop: 24,
          paddingBottom: Math.max(insets.bottom, 16) + 100,
        }}
        showsVerticalScrollIndicator={false}
        enableOnAndroid
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
          {t('account.securitiesAccountSubtitle')}
        </Text>

        <View style={styles.fieldGroup}>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.background.card,
                borderColor: borderFor(accountFocused),
                color: colors.text.primary,
              },
            ]}
            value={accountNumber}
            onChangeText={setAccountNumber}
            placeholder={t('account.securitiesAccountNumberPlaceholder')}
            placeholderTextColor={colors.text.tertiary}
            autoCapitalize="none"
            autoCorrect={false}
            onFocus={() => setAccountFocused(true)}
            onBlur={() => setAccountFocused(false)}
            returnKeyType="next"
          />
        </View>

        <View style={styles.fieldGroup}>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.background.card,
                borderColor: borderFor(bicFocused),
                color: colors.text.primary,
              },
            ]}
            value={bicSwiftCode}
            onChangeText={setBicSwiftCode}
            placeholder={t('account.securitiesBicSwiftCodePlaceholder')}
            placeholderTextColor={colors.text.tertiary}
            autoCapitalize="characters"
            autoCorrect={false}
            onFocus={() => setBicFocused(true)}
            onBlur={() => setBicFocused(false)}
            returnKeyType="done"
            onSubmitEditing={handleSave}
          />
        </View>
      </KeyboardAwareScrollView>

      <View
        style={[
          styles.footer,
          {
            paddingBottom: Math.max(insets.bottom, 16) + 90,
            backgroundColor: colors.background.primary,
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.saveButton,
            {
              backgroundColor: colors.primary,
              opacity: canSave ? 1 : 0.6,
            },
          ]}
          onPress={handleSave}
          disabled={!canSave}
          activeOpacity={0.85}
        >
          <View style={styles.saveButtonInner}>
            <Text style={[styles.saveButtonText, saving && styles.saveButtonTextHidden]}>
              {t('common.save')}
            </Text>
            {saving ? (
              <ActivityIndicator
                size="small"
                color={isDark ? '#0D1117' : '#FFFFFF'}
                style={styles.saveButtonLoader}
              />
            ) : null}
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerContent: { flex: 1, paddingRight: 8 },
  headerTitle: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 28,
    lineHeight: 36,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontFamily: 'Roboto-Light',
    fontSize: 16,
    lineHeight: 23,
    marginBottom: 28,
  },
  fieldGroup: {
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderRadius: 9999,
    paddingHorizontal: 22,
    paddingVertical: 14,
    fontFamily: 'Roboto-Light',
    fontSize: 16,
    lineHeight: 22,
    minHeight: 48,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 26,
    paddingTop: 16,
  },
  saveButton: {
    borderRadius: 9999,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    fontFamily: 'Roboto-Regular',
    fontSize: 17,
    lineHeight: 23,
    color: '#FFFFFF',
  },
  saveButtonTextHidden: {
    opacity: 0,
  },
  saveButtonLoader: {
    position: 'absolute',
  },
});
