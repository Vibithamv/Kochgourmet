import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, User, MapPin, Calendar, Building, Shield, Check, ExternalLink } from 'lucide-react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { getColors, Typography, Spacing, BorderRadius } from '@/constants/theme';
import { AccountInfoShimmer } from '@/components/Shimmer';
import { useGlobalAlert } from '@/contexts/AlertContext';
import { userManagement } from '@/hooks/userManagement';

export default function AccountInfoScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [editMode] = useState(false);
  const [sumsubModalVisible, setSumsubModalVisible] = useState(false);
  const { showAlert } = useGlobalAlert();
  const [accountInfo, setAccountInfo] = useState({
    fullName: user?.firstName || 'Demo User',
    companyName: '',
    address: '123 Investment Street, New York, NY 10001',
    dateOfBirth: '1990-05-15',
    occupation: 'Software Engineer',
    annualIncome: '$75,000 - $100,000',
    investmentExperience: 'Intermediate',
    riskTolerance: 'Moderate',
  });
  const userProfile = userManagement();
  const [dob, setDOB] = useState('');
  const [fullName, setFullName] = useState('');
  const [address, setAddress] = useState('');
  const [kycStatus, setKycStatus] = useState<
    'PENDING' | 'CONFIRMED' | 'REJECTED' | ''
  >('');
  const colors = getColors(theme);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUser(); // just call it directly
  }, []);

  const getUser = async () => {
    try {
      setLoading(true)
      userProfile.getUser().then((data) => {
        if (data.success && data.data) {
          setLoading(false)
          if (JSON.stringify(data.data.data.activeAccount) !== '{}') {
            setFullName(data.data.data.activeAccount.name)
            setAddress(data.data.data.activeAccount.address.city + ' ' + data.data.data.activeAccount.address.country + ' ' +
              data.data.data.activeAccount.address.postalCode + ' ' + data.data.data.activeAccount.address.state + ' ' +
              data.data.data.activeAccount.address.street
            )
            setKycStatus(data.data.data.activeAccount.kyc_status)
            if (data.data.data.activeAccount.account_type === 'INDIVIDUAL') {
              const [year, month, day] = data.data.data.activeAccount.individual.dateOfBirth.split("-");
              setDOB(`${day}-${month}-${year}`);
            }
            else {
              const [year, month, day] = data.data.data.activeAccount.company.dateOfBirth.split("-");
              setDOB(`${day}-${month}-${year}`);
            }
          }

        }
        else {
          setLoading(false)
          if (data.status === 401) {
            showAlert(t('profile.sessionExpired'), t('profile.loginAgain'));
            router.replace("/auth/login");
          } else {
            showAlert(t('common.error'), t('common.errorMessage'));
          }
        }
      })
    } catch (error) {
      setLoading(false)
      console.error('Error while fetching user data:', error);
    }
  };

  const handleSumsubVerification = () => {
    setSumsubModalVisible(false);
    showAlert(t('account.kycVerification'), t('account.redirectingSumsub'),
      {
        buttonText: t('account.continue'),
        buttonCallback: () => {
          showAlert(t('account.demoMode'), t('account.productionMsg'));
        },
        secondaryButtonText: t('common.cancel'),
        // secondaryButtonCallback: handleCancel,
      }
    )
  };

  const renderKycStatusBadge = () => {
    if (kycStatus === 'CONFIRMED') {
      return (
        <View style={[styles.kycStatus, { backgroundColor: `${colors.success}15` }]}>
          <View style={[styles.kycStatusDot, { backgroundColor: colors.success }]} />
          <Text style={[styles.kycStatusText, { color: colors.success }]}>{kycStatus}</Text>
        </View>
      );
    }
    if (kycStatus === 'PENDING') {
      return (
        <View style={[styles.kycStatus, { backgroundColor: `${colors.warning}15` }]}>
          <View style={[styles.kycStatusDot, { backgroundColor: colors.warning }]} />
          <Text style={[styles.kycStatusText, { color: colors.warning }]}>{kycStatus}</Text>
        </View>
      );
    }
    if (kycStatus === 'REJECTED') {
      return (
        <View style={[styles.kycStatus, { backgroundColor: `${colors.error}15` }]}>
          <View style={[styles.kycStatusDot, { backgroundColor: colors.error }]} />
          <Text style={[styles.kycStatusText, { color: colors.error }]}>{kycStatus}</Text>
        </View>
      );
    }
    return null;
  };

  if (loading) {
    return <AccountInfoShimmer />;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background.secondary }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 44) + 16, backgroundColor: colors.background.primary, borderBottomColor: colors.border.primary }]}>
        <TouchableOpacity style={[styles.backButton, { backgroundColor: colors.background.secondary }]} onPress={() => router.back()}>
          <ArrowLeft size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: colors.text.primary }]}>{t('account.accountInformation')}</Text>
          <Text style={[styles.headerSubtitle, { color: colors.text.secondary }]}>{t('account.accountSubtitle')}</Text>
        </View>
        {/* <TouchableOpacity 
          style={[styles.editButton, { backgroundColor: editMode ? colors.success : colors.primary }]}
          onPress={editMode ? handleSaveChanges : () => setEditMode(true)}
        >
          {editMode ? (
            <Check size={20} color={colors.text.inverse} />
          ) : (
            <Edit3 size={20} color={colors.text.inverse} />
          )}
        </TouchableOpacity> */}
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Personal Details */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>{t('account.personalInformation')}</Text>

          <AccountInfoField
            editMode={editMode}
            colors={colors}
            icon={User}
            label={t('account.fullNameLabel')}
            value={fullName}
            onChangeText={(text) => setAccountInfo(prev => ({ ...prev, fullName: text }))}
          />

          {/* <AccountInfoField
            editMode={editMode}
            colors={colors}
            icon={Building}
            label={t('account.companyNameLabel')}
            value={accountInfo.companyName}
            onChangeText={(text) => setAccountInfo(prev => ({ ...prev, companyName: text }))}
          /> */}

          <AccountInfoField
            editMode={editMode}
            colors={colors}
            icon={MapPin}
            label={t('account.addressLabel')}
            value={address}
            onChangeText={(text) => setAccountInfo(prev => ({ ...prev, address: text }))}
            multiline={true}
          />

          <AccountInfoField
            editMode={editMode}
            colors={colors}
            icon={Calendar}
            label={t('account.dobLabel')}
            value={dob}
            editable={false}
          />
        </View>

        {/* Professional Information */}
        {/* <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Professional Information</Text>
          
          <InfoField
            icon={Building}
            label="Occupation"
            value={accountInfo.occupation}
            onChangeText={(text) => setAccountInfo(prev => ({ ...prev, occupation: text }))}
          />

          <InfoField
            icon={CreditCard}
            label="Annual Income"
            value={accountInfo.annualIncome}
            onChangeText={(text) => setAccountInfo(prev => ({ ...prev, annualIncome: text }))}
          />
        </View> */}

        {/* Investment Profile */}
        {/* <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Investment Profile</Text>
          
          <InfoField
            icon={Shield}
            label="Investment Experience"
            value={accountInfo.investmentExperience}
            onChangeText={(text) => setAccountInfo(prev => ({ ...prev, investmentExperience: text }))}
          />

          <InfoField
            icon={Shield}
            label="Risk Tolerance"
            value={accountInfo.riskTolerance}
            onChangeText={(text) => setAccountInfo(prev => ({ ...prev, riskTolerance: text }))}
          />
        </View> */}

        {/* KYC Verification Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>{t('account.identityVerification')}</Text>

          <View style={[styles.kycCard, { backgroundColor: colors.background.card, borderColor: colors.border.primary }]}>
            <View style={styles.kycHeader}>
              <View style={[styles.kycIcon, { backgroundColor: `${colors.warning}15` }]}>
                <Shield size={24} color={colors.warning} />
              </View>
              <View style={styles.kycInfo}>
                <Text style={[styles.kycTitle, { color: colors.text.primary }]}>{t('account.kycVerification')}</Text>
                <Text style={[styles.kycSubtitle, { color: colors.text.secondary }]}>
                  {t('account.kycSubtitle')}
                </Text>
              </View>
              {renderKycStatusBadge()}

            </View>

            <View style={styles.kycDescription}>
              <Text style={[styles.kycDescriptionText, { color: colors.text.secondary }]}>
                {t('account.kycDescription')}
              </Text>
            </View>

            {/* <TouchableOpacity 
              style={[styles.sumsubButton, { backgroundColor: colors.primary }]}
              onPress={() => setSumsubModalVisible(true)}
            >
              <Shield size={20} color={colors.text.inverse} />
              <Text style={[styles.sumsubButtonText, { color: colors.text.inverse }]}>
                Start Verification with Sumsub
              </Text>
              <ExternalLink size={16} color={colors.text.inverse} />
            </TouchableOpacity> */}
          </View>
        </View>
      </ScrollView>

      {/* Sumsub Verification Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={sumsubModalVisible}
        onRequestClose={() => setSumsubModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.sumsubModal, { backgroundColor: colors.background.primary }]}>
            <View style={styles.sumsubModalHeader}>
              <Text style={[styles.sumsubModalTitle, { color: colors.text.primary }]}>{t('account.identityVerification')}</Text>
              <TouchableOpacity
                style={[styles.closeButton, { backgroundColor: colors.background.secondary }]}
                onPress={() => setSumsubModalVisible(false)}
              >
                <Text style={[styles.closeButtonText, { color: colors.text.secondary }]}>×</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.sumsubContent}>
              <View style={[styles.sumsubIcon, { backgroundColor: `${colors.primary}15` }]}>
                <Shield size={48} color={colors.primary} />
              </View>

              <Text style={[styles.sumsubTitle, { color: colors.text.primary }]}>
                {t('account.secureIdentityVerification')}
              </Text>

              <Text style={[styles.sumsubDescription, { color: colors.text.secondary }]}>
                {t('account.sumsubDescription')}
              </Text>

              <View style={styles.sumsubFeatures}>
                <View style={styles.sumsubFeature}>
                  <Check size={16} color={colors.success} />
                  <Text style={[styles.sumsubFeatureText, { color: colors.text.secondary }]}>
                    {t('account.bankGradeSecurity')}
                  </Text>
                </View>
                <View style={styles.sumsubFeature}>
                  <Check size={16} color={colors.success} />
                  <Text style={[styles.sumsubFeatureText, { color: colors.text.secondary }]}>
                    {t('account.gdprCompliant')}
                  </Text>
                </View>
                <View style={styles.sumsubFeature}>
                  <Check size={16} color={colors.success} />
                  <Text style={[styles.sumsubFeatureText, { color: colors.text.secondary }]}>
                    {t('account.quickProcess')}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.proceedButton, { backgroundColor: colors.primary }]}
                onPress={handleSumsubVerification}
              >
                <Shield size={20} color={colors.text.inverse} />
                <Text style={[styles.proceedButtonText, { color: colors.text.inverse }]}>
                  {t('account.proceedSumsub')}
                </Text>
                <ExternalLink size={16} color={colors.text.inverse} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.cancelButton, { backgroundColor: colors.background.secondary, borderColor: colors.border.primary }]}
                onPress={() => setSumsubModalVisible(false)}
              >
                <Text style={[styles.cancelButtonText, { color: colors.text.secondary }]}>
                  {t('account.maybeLater')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    textAlign: 'center',
    marginTop: 2,
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.md,
  },
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing['2xl'],
    paddingTop: Spacing.xl,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    marginBottom: Spacing.lg,
    letterSpacing: -0.2,
  },
  infoField: {
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
  },
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  fieldIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  fieldLabel: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  fieldValue: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.regular,
    lineHeight: 22,
  },
  fieldInput: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.regular,
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    borderWidth: 1,
  },
  fieldInputMultiline: {
    height: 80,
    textAlignVertical: 'top',
  },
  kycCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    borderWidth: 1,
  },
  kycHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  kycIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.lg,
  },
  kycInfo: {
    flex: 1,
  },
  kycTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.semiBold,
    marginBottom: Spacing.xs,
  },
  kycSubtitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
  },
  kycStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  kycStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: Spacing.xs,
  },
  kycStatusText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semiBold,
  },
  kycDescription: {
    marginBottom: Spacing.xl,
  },
  kycDescriptionText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    lineHeight: 20,
  },
  sumsubButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  sumsubButtonText: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.semiBold,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sumsubModal: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    margin: Spacing.xl,
    alignItems: 'center',
  },
  sumsubModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: Spacing.xl,
  },
  sumsubModalTitle: {
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
    fontSize: Typography.fontSize.xl,
    fontWeight: 'bold',
  },
  sumsubContent: {
    alignItems: 'center',
    width: '100%',
  },
  sumsubIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  sumsubTitle: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  sumsubDescription: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },
  sumsubFeatures: {
    width: '100%',
    marginBottom: Spacing.xl,
  },
  sumsubFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sumsubFeatureText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    marginLeft: Spacing.sm,
  },
  proceedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
    width: '100%',
    marginBottom: Spacing.md,
  },
  proceedButtonText: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.semiBold,
  },
  cancelButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    width: '100%',
  },
  cancelButtonText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
    textAlign: 'center',
  },
});

type AccountInfoFieldColors = ReturnType<typeof getColors>;

type AccountInfoFieldProps = Readonly<{
  icon: React.ComponentType<{ size?: number; color?: string }>;
  label: string;
  value: string;
  onChangeText?: (text: string) => void;
  editable?: boolean;
  multiline?: boolean;
  editMode: boolean;
  colors: AccountInfoFieldColors;
}>;

function AccountInfoField({
  icon: Icon,
  label,
  value,
  onChangeText,
  editable = true,
  multiline = false,
  editMode,
  colors,
}: AccountInfoFieldProps) {
  return (
    <View
      style={[
        styles.infoField,
        {
          backgroundColor: colors.background.card,
          borderColor: colors.border.primary,
        },
      ]}
    >
      <View style={styles.fieldHeader}>
        <View
          style={[
            styles.fieldIcon,
            { backgroundColor: colors.interactive.hover },
          ]}
        >
          <Icon size={18} color={colors.text.secondary} />
        </View>
        <Text style={[styles.fieldLabel, { color: colors.text.secondary }]}>
          {label}
        </Text>
      </View>
      {editMode && editable ? (
        <TextInput
          style={[
            styles.fieldInput,
            {
              color: colors.text.primary,
              backgroundColor: colors.background.secondary,
              borderColor: colors.border.primary,
            },
            multiline && styles.fieldInputMultiline,
          ]}
          value={value}
          onChangeText={onChangeText}
          multiline={multiline}
          numberOfLines={multiline ? 3 : 1}
        />
      ) : (
        <Text style={[styles.fieldValue, { color: colors.text.primary }]}>
          {value}
        </Text>
      )}
    </View>
  );
}