import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  User,
  Settings,
  Shield,
  CreditCard,
  LogOut,
  ChevronRight,
  ChevronDown,
  Smartphone,
  Check,
  Plus,
  Building,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { router } from 'expo-router';
import LanguageSelector from '@/components/LanguageSelector';
import ThemeToggle from '@/components/ThemeToggle';
import {
  getColors,
  getTypography,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
} from '@/constants/theme';
import type { Accounts } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { userManagement } from '@/hooks/userManagement';
import { useFocusEffect } from '@react-navigation/native';
import { useGlobalAlert } from '@/contexts/AlertContext';
import { kycRequest } from '@/hooks/kycRequest';
import { useOfferingCheck } from '@/hooks/useOfferingCheck';

export default function AccountScreen() {
  const { t } = useTranslation();
  const { signOut } = useAuth();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const scrollViewRef = React.useRef<ScrollView>(null);
  const [kycStatus, setKycStatus] = useState<
    'PENDING' | 'CONFIRMED' | 'REJECTED' | ''
  >('');
  const [accountModalVisible, setAccountModalVisible] = useState(false);
  const [currentAccount, setCurrentAccount] = useState('');
  const [isConnectingAccount, setIsConnectingAccount] = useState(false);
  const [userName, setUserName] = useState('');
  const [email, setEmail] = useState('');
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(null);
  const userAccount = userManagement();
  const [accounts, setAccounts] = useState<Accounts[]>([]);
  const { showAlert } = useGlobalAlert();
  const [userID, setUserID] = useState('');
  const request = kycRequest();
  const { performOfferingCheck } = useOfferingCheck();

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    try {
      await performOfferingCheck();
      userAccount.getUser().then((data) => {
        if (data.success && data.data) {
          if (JSON.stringify(data.data.data.activeAccount) !== '{}') {
            setCurrentAccount(data.data.data.activeAccount.id);
            setKycStatus(data.data.data.activeAccount.kyc_status);
          }

          setUserName(
            data.data.data.activeAccount.name
          );
          setEmail(data.data.data.user.email);
          const picture = data.data.data.user.profile_picture;
          setProfilePictureUrl(
            typeof picture === 'string' && picture.trim() ? picture : null,
          );
          setUserID(data.data.data.user.id);
          if (data.data.data.accounts.length > 0) {
            const jsonObject = data.data.data.accounts;
            const mappedAccounts = jsonObject.map((accounts: any) => ({
              id: accounts.id,
              name: accounts.name,
              email: accounts.email,
              account_type: accounts.account_type,
            }));
            setAccounts(mappedAccounts);
          }
        } else {
          console.log('Failed to fetch account details:', data.error);
          if (data.status === 401) {
            showAlert(t('profile.sessionExpired'), t('profile.loginAgain'));
            router.replace("/auth/login");
          } else {
            showAlert(t('common.error'), t('common.errorMessage'));
          }
        }
      });
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const colors = getColors(theme);

  const getCurrentAccountData = () => {
    return accounts.find((acc) => acc.id === currentAccount) || accounts[0];
  };

  const handleAccountSwitch = (accountId: string) => {
    setAccountModalVisible(false);
    try {
      const selectedAccount = accounts.find((acc) => acc.id === accountId);
      if (selectedAccount) {
        userAccount.switchAccount(accountId).then(async (data) => {
          if (data.success && data.data) {
            setCurrentAccount(accountId);
            showAlert(
              t('account.accountSwitched'),
              `${t('account.nowUsing')} ${selectedAccount.name}`
            );
            await AsyncStorage.setItem('AccountID', accountId);
          }
        });
      }
    } catch (error: any) {
      showAlert(
        t('common.error'),
        error.message || 'Failed to switch account. Please try again.'
      );
    }
  };

  const handleAddAccount = async () => {
    setAccountModalVisible(false);
    setIsConnectingAccount(true);
    try {
      const result = await request.request(userID, 'COMPANY');
      if (result.success) {
        if (result.data === '') {
          showAlert(
            t('account.addAccount'),
            t('account.connectCompanyAccount')
          );
        } else {
          router.push({
            pathname: '/screens/KYCWebView',
            params: { url: result.data.verification_url },
          });
        }

        //   router.replace("/screens/kycWaiting")
      } else {
        //  router.replace("/screens/kycWaiting")
        showAlert(
          'KYC Request failed',
          result.error.message || 'Please try again.'
        );
      }
    } catch (error) {
      console.error(error);
      showAlert(
        t('common.error'),
        'An unexpected error occurred.'
      );
    } finally {
      setIsConnectingAccount(false);
    }
  };

  const handleLogout = async () => {
    await signOut(); // or the correct logout method you have
    router.replace('/auth/login');
  };

  const getKYCStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return colors.success;
      case 'PENDING':
        return colors.warning;
      case 'REJECTED':
        return colors.error;
      default:
        return colors.text.tertiary;
    }
  };

  const getKYCStatusText = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return t('account.kycStatus.verified');
      case 'PENDING':
        return t('account.kycStatus.pending');
      case 'REJECTED':
        return t('account.kycStatus.rejected');
      default:
        return t('account.kycStatus.notStarted');
    }
  };

  const styles = React.useMemo(() => {
    const accountBadgeBackgroundColor = `${colors.success}25`;

    return StyleSheet.create({
        container: {
          flex: 1,
        },
        scrollBody: {
          flex: 1,
        },
        header: {
          paddingHorizontal: 24,
          paddingBottom: 16,
          borderBottomWidth: 1,
        },
        headerInner: {
          flexDirection: 'row',
          alignItems: 'center',
        },
        headerLogoWrap: {
          width: 48,
          height: 48,
          marginRight: 25,
          justifyContent: 'center',
          alignItems: 'center',
          overflow: 'visible',
        },
        headerLogo: {
          position: 'absolute',
          width: 76,
          height: 76,
        },
        headerTitle: {
          fontSize: Typography.fontSize['2xl'],
          fontFamily: getTypography(theme).fontFamily.display,
          letterSpacing: -0.3,
          marginBottom: 2,
        },
        headerSubtitle: {
          fontSize: Typography.fontSize.sm,
          fontFamily: 'Inter-Regular',
        },
        profileSection: {
          paddingHorizontal: Spacing.xl,
          marginBottom: Spacing['2xl'],
        },
        profileCard: {
          borderRadius: BorderRadius.xl,
          padding: Spacing.xl,
          flexDirection: 'row',
          alignItems: 'center',
          ...Shadows.lg,
        },
        accountSwitcher: {
          flexDirection: 'row',
          alignItems: 'center',
          flex: 1,
        },
        avatarContainer: {
          position: 'relative',
          marginRight: Spacing.lg,
        },
        avatar: {
          width: 64,
          height: 64,
          borderRadius: 32,
        },
        cameraButton: {
          position: 'absolute',
          bottom: -4,
          right: -4,
          width: 24,
          height: 24,
          borderRadius: 12,
          backgroundColor: colors.primary,
          alignItems: 'center',
          justifyContent: 'center',
        },
        accountInfo: {
          flex: 1,
        },
        profileHeader: {
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: Spacing.xs,
        },
        profileName: {
          fontSize: Typography.fontSize.xl,
          fontFamily: Typography.fontFamily.bold,
          marginRight: Spacing.sm,
        },
        companyBadge: {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: accountBadgeBackgroundColor,
          paddingHorizontal: Spacing.xs,
          paddingVertical: 2,
          borderRadius: BorderRadius.sm,
        },
        companyText: {
          fontSize: Typography.fontSize.xs,
          fontFamily: Typography.fontFamily.semiBold,
          marginLeft: 2,
          color: colors.success,
        },
        profileEmail: {
          fontSize: Typography.fontSize.base,
          fontFamily: Typography.fontFamily.regular,
          marginBottom: Spacing.sm,
        },
        profileCompany: {
          fontSize: Typography.fontSize.sm,
          fontFamily: Typography.fontFamily.regular,
          marginBottom: Spacing.sm,
        },
        kycBadge: {
          flexDirection: 'row',
          alignItems: 'center',
          alignSelf: 'flex-start',
        },
        kycIndicator: {
          width: 8,
          height: 8,
          borderRadius: 4,
          marginRight: Spacing.xs,
        },
        kycText: {
          fontSize: Typography.fontSize.sm,
          fontFamily: Typography.fontFamily.semiBold,
        },
        section: {
          paddingHorizontal: Spacing.xl,
          marginBottom: Spacing.xl,
        },
        sectionTitle: {
          fontSize: Typography.fontSize.xl,
          fontFamily: Typography.fontFamily.bold,
          marginBottom: Spacing.lg,
        },
        menuItem: {
          flexDirection: 'row',
          alignItems: 'center',
          borderRadius: BorderRadius.md,
          padding: Spacing.lg,
          marginBottom: Spacing.sm,
          ...Shadows.sm,
          borderColor: colors.border.primary,
          borderWidth: 1,
        },
        menuIcon: {
          width: 40,
          height: 40,
          borderRadius: 20,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: Spacing.md,
        },
        menuContent: {
          flex: 1,
        },
        menuText: {
          fontFamily: Typography.fontFamily.semiBold,
          marginBottom: 2,
        },
        menuSubtext: {
          fontSize: Typography.fontSize.sm,
        },
        statusBadge: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: Spacing.sm,
          paddingVertical: Spacing.xs,
          borderRadius: BorderRadius.md,
        },
        statusDot: {
          width: 6,
          height: 6,
          borderRadius: 3,
          marginRight: Spacing.xs,
        },
        statusText: {
          fontSize: Typography.fontSize.sm,
        },
        signOutSection: {
          paddingHorizontal: Spacing.xl,
          paddingBottom: Spacing['4xl'],
        },
        signOutButton: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: BorderRadius.md,
          padding: Spacing.lg,
          borderWidth: 1,
        },
        signOutText: {
          fontSize: Typography.fontSize.lg,
          fontFamily: Typography.fontFamily.semiBold,
          marginLeft: Spacing.sm,
        },
        modalOverlay: {
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          justifyContent: 'flex-end',
          bottom: 20,
        },
        modalContent: {
          borderTopLeftRadius: BorderRadius.xl,
          borderTopRightRadius: BorderRadius.xl,
          paddingTop: Spacing.xl,
          maxHeight: '80%',
        },
        modalHeader: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: Spacing.xl,
          paddingBottom: Spacing.xl,
          borderBottomWidth: 1,
        },
        modalTitle: {
          fontSize: Typography.fontSize.xl,
          fontFamily: Typography.fontFamily.bold,
        },
        closeButton: {
          width: 30,
          height: 30,
          borderRadius: 15,
          alignItems: 'center',
          justifyContent: 'center',
        },
        closeButtonText: {
          fontSize: 20,
          fontWeight: 'bold',
        },
        accountsList: {
          paddingHorizontal: Spacing.xl,
          paddingTop: Spacing.md,
        },
        accountOption: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: Spacing.lg,
          borderBottomWidth: 1,
        },
        accountAvatar: {
          width: 48,
          height: 48,
          borderRadius: 24,
          marginRight: Spacing.lg,
        },
        accountDetails: {
          flex: 1,
        },
        accountHeader: {
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 2,
        },
        accountName: {
          fontSize: Typography.fontSize.lg,
          fontFamily: Typography.fontFamily.semiBold,
          marginRight: Spacing.sm,
        },
        accountTypeBadge: {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: accountBadgeBackgroundColor,
          paddingHorizontal: Spacing.xs,
          paddingVertical: 2,
          borderRadius: BorderRadius.sm,
        },
        accountTypeText: {
          fontSize: Typography.fontSize.xs,
          fontFamily: Typography.fontFamily.semiBold,
          marginLeft: 2,
          color: colors.success,
        },
        accountEmail: {
          fontSize: Typography.fontSize.base,
          fontFamily: Typography.fontFamily.regular,
          marginBottom: 2,
        },
        accountCompany: {
          fontSize: Typography.fontSize.sm,
          fontFamily: Typography.fontFamily.regular,
        },
        addAccountOption: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: Spacing.xl,
          paddingVertical: Spacing.lg,
          borderTopWidth: 1,
          marginTop: Spacing.sm,
        },
        addAccountIcon: {
          width: 48,
          height: 48,
          borderRadius: 24,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: Spacing.lg,
          backgroundColor: accountBadgeBackgroundColor,
        },
        addAccountDetails: {
          flex: 1,
        },
        addAccountText: {
          fontSize: Typography.fontSize.lg,
          fontFamily: Typography.fontFamily.semiBold,
          marginBottom: 2,
          color: colors.success,
        },
        addAccountSubtext: {
          fontSize: Typography.fontSize.base,
          fontFamily: Typography.fontFamily.regular,
        },
        alertModalOverlay: {
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.5)',
          justifyContent: 'center',
          alignItems: 'center',
        },

        modalBox: {
          width: '80%',
          padding: 20,
          borderRadius: 16,
          alignItems: 'center',
        },

        modalMessage: {
          fontSize: 16,
          textAlign: 'center',
          marginBottom: 20,
        },

        modalButtons: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          width: '100%',
        },

        cancelBtn: {
          flex: 1,
          paddingVertical: 12,
          borderRadius: 10,
          borderWidth: 1,
          marginRight: 10,
          alignItems: 'center',
        },

        okBtn: {
          flex: 1,
          paddingVertical: 12,
          borderRadius: 10,
          alignItems: 'center',
          marginLeft: 10,
        },

        cancelText: {
          fontSize: 16,
          fontWeight: '600',
        },

        okText: {
          fontSize: 16,
          fontWeight: '600',
        },
      });
  }, [colors, theme]);

  return (
    <>
      <View style={[styles.container, { backgroundColor: colors.background.secondary }]}>
        <View
          style={[
            styles.header,
            {
              paddingTop: Math.max(insets.top, 50),
              backgroundColor: colors.background.primary,
              borderBottomColor: colors.border.primary,
              marginBottom: Spacing.lg,
            },
          ]}
        >
          <View style={styles.headerInner}>
            <View style={styles.headerLogoWrap}>
              <Image
                source={require('../../assets/images/kochgourmet-logo.png')}
                style={styles.headerLogo}
                resizeMode="contain"
              />
            </View>
            <View>
              <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
                {t('account.title')}
              </Text>
              <Text style={[styles.headerSubtitle, { color: colors.text.secondary }]}>
                {t('account.subtitle')}
              </Text>
            </View>
          </View>
        </View>
        <ScrollView
          ref={scrollViewRef}
          style={[styles.scrollBody, { backgroundColor: colors.background.secondary }]}
          contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        >
      <View style={styles.profileSection}>
        <TouchableOpacity
          style={[
            styles.profileCard,
            { backgroundColor: colors.background.card, borderColor: colors.border.primary, borderWidth: 1 },
          ]}
          onPress={() => {}
           // setAccountModalVisible(true)
          }
          activeOpacity={0.7}
        >
          <View style={styles.accountSwitcher}>
            <View style={styles.avatarContainer}>
              {profilePictureUrl ? (
                <Image
                  source={{ uri: profilePictureUrl }}
                  style={styles.avatar}
                />
              ) : (
                <View
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: 25,
                    backgroundColor: `${colors.primary}25`,
                    borderWidth: 1,
                    borderColor: `${colors.primary}50`,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Text
                    style={{
                      color: colors.primary,
                      fontSize: 22,
                      fontFamily: 'Inter-Bold',
                    }}
                  >
                    {userName.charAt(0)}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.accountInfo}>
              <View style={styles.profileHeader}>
                <Text
                  style={[styles.profileName, { color: colors.text.primary }]}
                >
                  {userName}
                </Text>
                {getCurrentAccountData()?.account_type === 'COMPANY' && (
                  <View style={styles.companyBadge}>
                    <Building size={10} color={colors.success} />
                    <Text style={styles.companyText}>{t('account.company')}</Text>
                  </View>
                )}
              </View>
              <Text
                style={[styles.profileEmail, { color: colors.text.secondary }]}
              >
                {email}
              </Text>
              {getCurrentAccountData()?.account_type === 'COMPANY' && (
                <Text style={[styles.profileCompany, { color: colors.text.tertiary }]}>{getCurrentAccountData()?.account_type}</Text>
              )}
              <View style={styles.kycBadge}>
                <View
                  style={[
                    styles.kycIndicator,
                    { backgroundColor: getKYCStatusColor(kycStatus) },
                  ]}
                />
                <Text
                  style={[styles.kycText, { color: colors.text.secondary }]}
                >
                  {getKYCStatusText(kycStatus)}
                </Text>
              </View>
            </View>
          </View>
          {/* <ChevronDown size={20} color={colors.text.tertiary} /> */}
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
          {t('account.profileSection')}
        </Text>

        <TouchableOpacity
          style={[styles.menuItem, { backgroundColor: colors.background.card }]}
          onPress={() => {
            router.push('/account/profile');
          }}
        >
          <View
            style={[
              styles.menuIcon,
              { backgroundColor: colors.interactive.hover },
            ]}
          >
            <User size={20} color={colors.text.secondary} />
          </View>
          <View style={styles.menuContent}>
            <Text style={[styles.menuText, { color: colors.text.primary }]}>
              {t('account.changeProfile')}
            </Text>
            <Text
              style={[styles.menuSubtext, { color: colors.text.secondary }]}
            >
              {t('account.changeProfileDesc')}
            </Text>
          </View>
          <ChevronRight size={20} color={colors.text.tertiary} />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
          {t('account.accountInformation')}
        </Text>

        <TouchableOpacity
          style={[styles.menuItem, { backgroundColor: colors.background.card }]}
          onPress={() => {
            router.push('/account/account-info');
          }}
        >
          <View
            style={[
              styles.menuIcon,
              { backgroundColor: colors.interactive.hover },
            ]}
          >
            <User size={20} color={colors.text.secondary} />
          </View>
          <View style={styles.menuContent}>
            <Text style={[styles.menuText, { color: colors.text.primary }]}>
              {t('account.accountDetails')}
            </Text>
            <Text
              style={[styles.menuSubtext, { color: colors.text.secondary }]}
            >
              {t('account.accountDetailsDesc')}
            </Text>
          </View>
          <ChevronRight size={20} color={colors.text.tertiary} />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
          {t('account.securityVerification')}
        </Text>

        <TouchableOpacity
          style={[styles.menuItem, { backgroundColor: colors.background.card }]}
        //  onPress={handleKYC}
        >
          <View
            style={[
              styles.menuIcon,
              { backgroundColor: colors.interactive.hover },
            ]}
          >
            <Shield size={20} color={colors.text.secondary} />
          </View>
          <View style={styles.menuContent}>
            <Text style={[styles.menuText, { color: colors.text.primary }]}>
              {t('account.kycVerification')}
            </Text>
            <Text
              style={[styles.menuSubtext, { color: colors.text.secondary }]}
            >
              {t('account.completeIdentity')}
            </Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: colors.interactive.hover },
            ]}
          >
            <View
              style={[
                styles.statusDot,
                { backgroundColor: getKYCStatusColor(kycStatus) },
              ]}
            />
            <Text style={[styles.statusText, { color: colors.text.secondary }]}>
              {getKYCStatusText(kycStatus)}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
          {t('account.paymentWallets')}
        </Text>

        <TouchableOpacity
          style={[styles.menuItem, { backgroundColor: colors.background.card }]}
          onPress={() => {
            router.push('/account/payment-methods');
          }}
        >
          <View
            style={[
              styles.menuIcon,
              { backgroundColor: colors.interactive.hover },
            ]}
          >
            <CreditCard size={20} color={colors.text.secondary} />
          </View>
          <View style={styles.menuContent}>
            <Text style={[styles.menuText, { color: colors.text.primary }]}>
              {t('account.paymentMethods')}
            </Text>
            <Text
              style={[styles.menuSubtext, { color: colors.text.secondary }]}
            >
              {t('account.manageCards')}
            </Text>
          </View>
          <ChevronRight size={20} color={colors.text.tertiary} />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
          {t('account.platformSettings')}
        </Text>

        <View
          style={[styles.menuItem, { backgroundColor: colors.background.card }]}
        >
          <View
            style={[
              styles.menuIcon,
              { backgroundColor: colors.interactive.hover },
            ]}
          >
            <Settings size={20} color={colors.text.secondary} />
          </View>
          <View style={styles.menuContent}>
            <Text style={[styles.menuText, { color: colors.text.primary }]}>
              {t('account.theme')}
            </Text>
            <Text
              style={[styles.menuSubtext, { color: colors.text.secondary }]}
            >
              {t('account.themeDescription')}
            </Text>
          </View>
          <ThemeToggle />
        </View>

        <View
          style={[styles.menuItem, { backgroundColor: colors.background.card }]}
        >
          <View
            style={[
              styles.menuIcon,
              { backgroundColor: colors.interactive.hover },
            ]}
          >
            <Settings size={20} color={colors.text.secondary} />
          </View>
          <View style={styles.menuContent}>
            <Text style={[styles.menuText, { color: colors.text.primary }]}>
              {t('account.language')}
            </Text>
            <Text
              style={[styles.menuSubtext, { color: colors.text.secondary }]}
            >
              {t('account.selectLanguage')}
            </Text>
          </View>
          <LanguageSelector />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
          {t('account.supportLegal')}
        </Text>

        <TouchableOpacity
          style={[styles.menuItem, { backgroundColor: colors.background.card }]}
          onPress={() => {
            router.push('/account/help-support');
          }}
        >
          <View
            style={[
              styles.menuIcon,
              { backgroundColor: colors.interactive.hover },
            ]}
          >
            <Smartphone size={20} color={colors.text.secondary} />
          </View>
          <View style={styles.menuContent}>
            <Text style={[styles.menuText, { color: colors.text.primary }]}>
              {t('account.helpSupport')}
            </Text>
            <Text
              style={[styles.menuSubtext, { color: colors.text.secondary }]}
            >
              {t('account.contactUs')}
            </Text>
          </View>
          <ChevronRight size={20} color={colors.text.tertiary} />
        </TouchableOpacity>
      </View>

      <View style={styles.signOutSection}>
        <TouchableOpacity
          style={[
            styles.signOutButton,
            {
              backgroundColor: colors.background.card,
              borderColor: `${colors.error}40`,
            },
          ]}
          onPress={() => showAlert(
            t('common.logout'),
            t('common.logoutMsg'),
            {
              buttonText: t('common.logout'),
              buttonCallback: handleLogout,
              secondaryButtonText: t('common.cancel'),
            }
          )}

        >
          <LogOut size={20} color={colors.error} />
          <Text style={[styles.signOutText, { color: colors.error }]}>
            {t('account.signOut')}
          </Text>
        </TouchableOpacity>
      </View>
        </ScrollView>
      </View>

      {/* Account Switching Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={accountModalVisible}
        onRequestClose={() => setAccountModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: colors.background.primary },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text.primary }]}>
                {t('account.switchAccount')}
              </Text>
              <TouchableOpacity
                style={[
                  styles.closeButton,
                  { backgroundColor: colors.interactive.hover },
                ]}
                onPress={() => setAccountModalVisible(false)}
              >
                <Text
                  style={[
                    styles.closeButtonText,
                    { color: colors.text.secondary },
                  ]}
                >
                  ×
                </Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={accounts}
              keyExtractor={(item) => item.id}
              style={styles.accountsList}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.accountOption,
                    { borderBottomColor: colors.border.secondary },
                  ]}
                  onPress={() => handleAccountSwitch(item.id)}
                >
                  {/* <Image source={{ uri: item.avatar }} style={styles.accountAvatar} /> */}
                  <View style={styles.accountDetails}>
                    <View style={styles.accountHeader}>
                      <Text
                        style={[
                          styles.accountName,
                          { color: colors.text.primary },
                        ]}
                      >
                        {item.name}
                      </Text>
                      {item.account_type === 'COMPANY' && (
                        <View style={styles.accountTypeBadge}>
                          <Building size={10} color={colors.success} />
                          <Text style={styles.accountTypeText}>{t('account.company')}</Text>
                        </View>
                      )}
                    </View>
                    {item.email === null ? null : (
                      <Text
                        style={[
                          styles.accountEmail,
                          { color: colors.text.secondary },
                        ]}
                      >
                        {item.email}
                      </Text>
                    )}

                  </View>
                  {currentAccount === item.id && (
                    <Check size={20} color={colors.success} />
                  )}
                </TouchableOpacity>
              )}
            />

            <TouchableOpacity
              style={[
                styles.addAccountOption,
                { borderTopColor: colors.border.primary },
              ]}
              onPress={handleAddAccount}
            >
              <View style={styles.addAccountIcon}>
                <Plus size={20} color={colors.success} />
              </View>
              <View style={styles.addAccountDetails}>
                <Text style={styles.addAccountText}>
                  {t('account.connectNewAccount')}
                </Text>
                <Text
                  style={[
                    styles.addAccountSubtext,
                    { color: colors.text.secondary },
                  ]}
                >
                  {t('account.addAccountDescription')}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {/* Loading Modal */}
      <Modal
        transparent={true}
        visible={isConnectingAccount}
        animationType="fade"
      >
        <View style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: colors.background.overlay,
        }}>
          <View style={{
            backgroundColor: colors.background.primary,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: colors.border.primary,
            padding: 32,
            alignItems: 'center',
            gap: 12,
          }}>
            <View style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: `${colors.primary}20`,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <View style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                borderWidth: 3,
                borderColor: colors.primary,
                borderTopColor: 'transparent',
              }} />
            </View>
            <Text style={{ color: colors.text.primary, fontFamily: 'Inter-Medium', fontSize: 14 }}>
              {t('common.loading')}
            </Text>
          </View>
        </View>
      </Modal>
    </>
  );
}
