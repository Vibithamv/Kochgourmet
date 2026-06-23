import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Keyboard,
  Switch,
  Platform,
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
import { readBankDetailsFromUserResponse } from '@/utils/bankDetailsUtils';
import { BankDetailsShimmer } from '@/components/Shimmer';

export default function BankDetailsScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const colors = getColors(theme);
  const isDark = theme === 'dark' || theme === 'darkGreen';
  const insets = useSafeAreaInsets();
  const { showAlert } = useGlobalAlert();
  const userAccount = useMemo(() => userManagement(), []);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [accountHolderName, setAccountHolderName] = useState('');
  const [bankName, setBankName] = useState('');
  const [iban, setIban] = useState('');
  const [bic, setBic] = useState('');
  const [isBankPayout, setIsBankPayout] = useState(false);
  const [accountHolderFocused, setAccountHolderFocused] = useState(false);
  const [bankNameFocused, setBankNameFocused] = useState(false);
  const [ibanFocused, setIbanFocused] = useState(false);
  const [bicFocused, setBicFocused] = useState(false);

  const scrollRef = useRef<InstanceType<typeof KeyboardAwareScrollView> | null>(null);
  const bankNameRef = useRef<TextInput>(null);
  const ibanRef = useRef<TextInput>(null);
  const bicRef = useRef<TextInput>(null);

  const keyboardVerticalOffset = useMemo(
    () => Math.max(insets.top, 44) + 72,
    [insets.top],
  );

  const focusInput = useCallback((inputRef: React.RefObject<TextInput | null>) => {
    inputRef.current?.focus();
    requestAnimationFrame(() => {
      scrollRef.current?.scrollToFocusedInput(inputRef.current);
    });
  }, []);

  const loadBankDetails = useCallback(async () => {
    setLoading(true);
    const result = await userAccount.getUser();
    if (result.success && result.data) {
      const fields = readBankDetailsFromUserResponse(result.data);
      setAccountHolderName(fields.account_holder_name);
      setBankName(fields.bank_name);
      setIban(fields.iban);
      setBic(fields.bic);
      setIsBankPayout(fields.is_bank_payout);
      setLoading(false);
      return;
    }

    setLoading(false);
    if (result.status === 401) {
      showAlert(t('profile.sessionExpired'), t('profile.loginAgain'));
      replaceLoginClearingAuthStack();
      return;
    }
    showAlert(t('common.error'), t('common.errorMessage'));
  }, [showAlert, t, userAccount]);

  useFocusEffect(
    useCallback(() => {
      void loadBankDetails();
    }, [loadBankDetails]),
  );

  const handleSave = () => {
    Keyboard.dismiss();
    setSaving(true);
    void (async () => {
      try {
        const result = await userAccount.updateBankDetails({
          account_holder_name: accountHolderName.trim(),
          bank_name: bankName.trim(),
          iban: iban.trim(),
          bic: bic.trim(),
          is_bank_payout: isBankPayout,
        });

        if (!result.success) {
          if (result.status === 401) {
            showAlert(t('profile.sessionExpired'), t('profile.loginAgain'));
            replaceLoginClearingAuthStack();
            return;
          }
          showAlert(
            t('common.failed'),
            messageFromApiError(result.error, t('account.bankDetailsSaveFailed')),
          );
          return;
        }

        showAlert(t('common.success'), t('account.bankDetailsSaved'), {
          buttonText: t('common.ok'),
          buttonCallback: () => {
            setAccountHolderName('');
            setBankName('');
            setIban('');
            setBic('');
            setIsBankPayout(false);
          },
        });
      } finally {
        setSaving(false);
      }
    })();
  };

  const borderFor = (focused: boolean) => (focused ? colors.primary : colors.border.primary);

  if (loading) {
    return <BankDetailsShimmer />;
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
            {t('account.bankDetails')}
          </Text>
        </View>
      </View>

      <KeyboardAwareScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: 26,
          paddingTop: 24,
          paddingBottom: Math.max(insets.bottom, 16) + 100,
        }}
        showsVerticalScrollIndicator={false}
        enableOnAndroid
        enableAutomaticScroll
        keyboardShouldPersistTaps="handled"
        keyboardVerticalOffset={keyboardVerticalOffset}
        extraScrollHeight={120}
        extraHeight={Platform.OS === 'ios' ? 24 : 80}
      >
        <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
          {t('account.bankDetailsSubtitle')}
        </Text>

        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: colors.text.primary }]}>
            {t('account.bankDetailsAccountHolderName')}
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.background.card,
                borderColor: borderFor(accountHolderFocused),
                color: colors.text.primary,
              },
            ]}
            value={accountHolderName}
            onChangeText={setAccountHolderName}
            placeholder={t('account.bankDetailsAccountHolderNamePlaceholder')}
            placeholderTextColor={colors.text.tertiary}
            autoCapitalize="words"
            autoCorrect={false}
            onFocus={() => setAccountHolderFocused(true)}
            onBlur={() => setAccountHolderFocused(false)}
            returnKeyType="next"
            blurOnSubmit={false}
            onSubmitEditing={() => focusInput(bankNameRef)}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: colors.text.primary }]}>
            {t('account.bankDetailsBankName')}
          </Text>
          <TextInput
            ref={bankNameRef}
            style={[
              styles.input,
              {
                backgroundColor: colors.background.card,
                borderColor: borderFor(bankNameFocused),
                color: colors.text.primary,
              },
            ]}
            value={bankName}
            onChangeText={setBankName}
            placeholder={t('account.bankDetailsBankNamePlaceholder')}
            placeholderTextColor={colors.text.tertiary}
            autoCapitalize="words"
            autoCorrect={false}
            onFocus={() => setBankNameFocused(true)}
            onBlur={() => setBankNameFocused(false)}
            returnKeyType="next"
            blurOnSubmit={false}
            onSubmitEditing={() => focusInput(ibanRef)}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: colors.text.primary }]}>
            {t('account.bankDetailsIban')}
          </Text>
          <TextInput
            ref={ibanRef}
            style={[
              styles.input,
              {
                backgroundColor: colors.background.card,
                borderColor: borderFor(ibanFocused),
                color: colors.text.primary,
              },
            ]}
            value={iban}
            onChangeText={setIban}
            placeholder={t('account.bankDetailsIbanPlaceholder')}
            placeholderTextColor={colors.text.tertiary}
            autoCapitalize="characters"
            autoCorrect={false}
            onFocus={() => setIbanFocused(true)}
            onBlur={() => setIbanFocused(false)}
            returnKeyType="next"
            blurOnSubmit={false}
            onSubmitEditing={() => focusInput(bicRef)}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: colors.text.primary }]}>
            {t('account.bankDetailsBic')}
          </Text>
          <TextInput
            ref={bicRef}
            style={[
              styles.input,
              {
                backgroundColor: colors.background.card,
                borderColor: borderFor(bicFocused),
                color: colors.text.primary,
              },
            ]}
            value={bic}
            onChangeText={setBic}
            placeholder={t('account.bankDetailsBicPlaceholder')}
            placeholderTextColor={colors.text.tertiary}
            autoCapitalize="characters"
            autoCorrect={false}
            onFocus={() => setBicFocused(true)}
            onBlur={() => setBicFocused(false)}
            returnKeyType="done"
            onSubmitEditing={() => {
              Keyboard.dismiss();
              handleSave();
            }}
          />
        </View>

        <View style={styles.toggleRow}>
          <View style={styles.toggleSwitchWrap}>
            <View style={styles.toggleSwitchScale}>
              <Switch
                value={isBankPayout}
                onValueChange={setIsBankPayout}
                trackColor={{ false: colors.border.primary, true: colors.primary }}
                ios_backgroundColor={colors.border.primary}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>
          <Text style={[styles.toggleLabel, { color: colors.text.primary }]}>
            {t('account.bankDetailsIsBankPayout')}
          </Text>
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
          style={[styles.saveButton, { backgroundColor: colors.primary, opacity: saving ? 0.6 : 1 }]}
          onPress={handleSave}
          disabled={saving}
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
    gap: 8,
  },
  label: {
    fontFamily: 'Roboto-Regular',
    fontSize: 15,
    lineHeight: 21,
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
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 8,
    gap: 12,
  },
  toggleSwitchWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleSwitchScale: {
    transform: [{ scaleX: 0.9 }, { scaleY: 0.9 }],
  },
  toggleLabel: {
    flex: 1,
    fontFamily: 'Roboto-Regular',
    fontSize: 15,
    lineHeight: 21,
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
