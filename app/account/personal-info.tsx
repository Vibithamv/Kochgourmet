import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Shield,
  Globe,
  Building,
  CreditCard,
  Check,
  Camera,
  Edit3,
} from 'lucide-react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';
import { getColors, Typography, Spacing, BorderRadius } from '@/constants/theme';
import { useGlobalAlert } from '@/contexts/AlertContext';
import { userManagement } from '@/hooks/userManagement';
import { useFocusEffect } from '@react-navigation/native';
import { replaceLoginClearingAuthStack } from '@/utils/authNavigation';
import { AccountInfoShimmer } from '@/components/Shimmer';
import * as ImagePicker from 'expo-image-picker';
import { prepareProfilePicturePayload } from '@/utils/profilePictureUpload';
import { messageFromApiError } from '@/utils/apiErrorMessage';

type FieldColors = ReturnType<typeof getColors>;

function InfoField({
  icon: Icon,
  label,
  value,
  onChangeText,
  editable = true,
  multiline = false,
  colors,
  editMode,
}: Readonly<{
  icon: React.ComponentType<{ size?: number; color?: string }>;
  label: string;
  value: string;
  onChangeText?: (text: string) => void;
  editable?: boolean;
  multiline?: boolean;
  colors: FieldColors;
  editMode: boolean;
}>) {
  return (
    <View style={[styles.infoField, { backgroundColor: colors.background.card, borderColor: colors.border.primary }]}>
      <View style={styles.fieldHeader}>
        <View style={[styles.fieldIcon, { backgroundColor: colors.interactive.hover }]}>
          <Icon size={18} color={colors.text.secondary} />
        </View>
        <Text style={[styles.fieldLabel, { color: colors.text.secondary }]}>{label}</Text>
      </View>
      {editMode && editable ? (
        <TextInput
          style={[
            styles.fieldInput,
            { color: colors.text.primary, backgroundColor: colors.background.secondary, borderColor: colors.border.primary },
            multiline && styles.fieldInputMultiline,
          ]}
          value={value}
          onChangeText={onChangeText}
          multiline={multiline}
          numberOfLines={multiline ? 3 : 1}
        />
      ) : (
        <Text style={[styles.fieldValue, { color: colors.text.primary }]}>{value}</Text>
      )}
    </View>
  );
}

export default function PersonalInfoScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const colors = getColors(theme);
  const insets = useSafeAreaInsets();
  const { showAlert } = useGlobalAlert();
  const userAccount = userManagement();

  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploadingPicture, setUploadingPicture] = useState(false);
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState({
    fullName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    address: '',
    nationality: '',
    occupation: '',
    annualIncome: '',
    investmentExperience: '',
    riskTolerance: '',
  });

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      userAccount.getUser().then(res => {
        setLoading(false);
        if (res.success && res.data) {
          const u = res.data.data.user;
          const acc = res.data.data.activeAccount ?? {};
          const pic = u.profile_picture;
          setProfilePictureUrl(typeof pic === 'string' && pic.trim() ? pic : null);
          const rawAddress = u.address ?? acc.address;
          const addressString = (() => {
            if (!rawAddress) return '';
            if (typeof rawAddress === 'string') return rawAddress;
            if (typeof rawAddress === 'object') {
              const { street, city, state, postalCode, country } = rawAddress as Record<string, string | undefined>;
              return [street, city, state, postalCode, country].filter(Boolean).join(', ');
            }
            return String(rawAddress);
          })();

          setUserInfo(prev => ({
            ...prev,
            fullName: [u.first_name, u.last_name].filter(Boolean).join(' '),
            email: u.email ?? '',
            phone: u.phone_number ?? acc.phone_number ?? '',
            dateOfBirth: u.date_of_birth ?? acc.date_of_birth ?? '',
            address: addressString,
            nationality: u.nationality ?? acc.nationality ?? '',
            occupation: u.occupation ?? acc.occupation ?? '',
            annualIncome: u.annual_income ?? acc.annual_income ?? '',
            investmentExperience: u.investment_experience ?? acc.investment_experience ?? '',
            riskTolerance: u.risk_tolerance ?? acc.risk_tolerance ?? '',
          }));
        } else if (res.status === 401) {
          showAlert(t('profile.sessionExpired'), t('profile.loginAgain'));
          replaceLoginClearingAuthStack();
        } else {
          showAlert(t('common.error'), t('common.errorMessage'));
        }
      });
    }, [])
  );

  const handleSave = () => {
    setEditMode(false);
    showAlert(t('common.success'), t('profile.success'));
  };

  const prepareErrorMessage = useCallback((error: string): string => {
    if (error === 'tooLarge') return t('profile.photoTooLarge');
    if (error === 'unsupported') return t('profile.photoUnsupportedFormat');
    return t('profile.photoUpdateFailed');
  }, [t]);

  const doUploadPhoto = useCallback(async (image: string, contentType: string) => {
    setUploadingPicture(true);
    try {
      const upload = await userAccount.updateProfilePicture(image, contentType);
      if (upload.success) {
        const refreshed = await userAccount.getUser();
        if (refreshed.success && refreshed.data) {
          const pic = refreshed.data.data.user.profile_picture;
          setProfilePictureUrl(typeof pic === 'string' && pic.trim() ? pic : null);
        }
        showAlert(t('common.success'), t('profile.photoUpdateSuccess'));
      } else if (upload.status === 401) {
        showAlert(t('profile.sessionExpired'), t('profile.loginAgain'));
        replaceLoginClearingAuthStack();
      } else {
        showAlert(t('common.failed'), messageFromApiError(upload.error, t('profile.photoUpdateFailed')));
      }
    } finally {
      setUploadingPicture(false);
    }
  }, [showAlert, t, userAccount]);

  const handleChangeProfilePhoto = useCallback(async () => {
    if (uploadingPicture) return;
    try {
      const { status, canAskAgain } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        const suffix = canAskAgain ? '' : ' Bitte erlaube den Zugriff in den Einstellungen.';
        showAlert(t('common.error'), t('profile.photoPermissionDenied') + suffix);
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });
      if (result.canceled || !result.assets?.[0]?.uri) return;
      const asset = result.assets[0];
      const prepared = await prepareProfilePicturePayload(asset.uri, asset.mimeType ?? null, asset.fileSize ?? null);
      if (!prepared.ok) {
        showAlert(t('common.failed'), prepareErrorMessage(prepared.error));
        return;
      }
      await doUploadPhoto(prepared.payload.image, prepared.payload.contentType);
    } catch (err: unknown) {
      showAlert(t('common.error'), err instanceof Error ? err.message : t('profile.photoUpdateFailed'));
    }
  }, [doUploadPhoto, prepareErrorMessage, showAlert, t, uploadingPicture]);

  const notSpecified = t('account.notSpecified');

  if (loading) return <AccountInfoShimmer />;

  return (
    <View style={[styles.container, { backgroundColor: colors.background.secondary }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 44) + 16, backgroundColor: colors.background.primary, borderBottomColor: colors.border.primary }]}>
        <TouchableOpacity style={[styles.backButton, { backgroundColor: colors.background.secondary }]} onPress={() => router.back()}>
          <ArrowLeft size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
            {t('account.personalInfoTitle')}
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.text.secondary }]}>
            {t('account.personalInfoSubtitle')}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.editButton, { backgroundColor: editMode ? colors.success : colors.primary }]}
          onPress={editMode ? handleSave : () => setEditMode(true)}
        >
          {editMode ? (
            <Check size={20} color="#fff" />
          ) : (
            <Edit3 size={20} color="#fff" />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile photo */}
        <View style={styles.photoSection}>
          <View style={[styles.photoCard, { backgroundColor: colors.background.card, borderColor: colors.border.primary }]}>
            <View style={styles.photoContainer}>
              {profilePictureUrl ? (
                <Image source={{ uri: profilePictureUrl }} style={styles.profilePhoto} />
              ) : (
                <View style={[styles.profilePhoto, styles.avatarFallback, { backgroundColor: colors.primary }]}>
                  <Text style={styles.avatarInitial}>
                    {userInfo.fullName ? userInfo.fullName[0].toUpperCase() : '?'}
                  </Text>
                </View>
              )}
              <TouchableOpacity
                style={[styles.photoEditButton, { backgroundColor: colors.primary, opacity: uploadingPicture ? 0.6 : 1 }]}
                onPress={handleChangeProfilePhoto}
                disabled={uploadingPicture}
              >
                <Camera size={16} color="#fff" />
              </TouchableOpacity>
            </View>
            <Text style={[styles.photoLabel, { color: colors.text.primary }]}>{t('account.profilePhoto')}</Text>
            <Text style={[styles.photoSubtext, { color: colors.text.secondary }]}>{t('account.updatePhoto')}</Text>
          </View>
        </View>

        {/* Basic information */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>{t('account.basicInfo')}</Text>

          <InfoField colors={colors} editMode={editMode} icon={User}
            label={t('account.fullNameFieldLabel')}
            value={userInfo.fullName || notSpecified}
            onChangeText={v => setUserInfo(p => ({ ...p, fullName: v }))}
          />
          <InfoField colors={colors} editMode={editMode} icon={Mail} editable={false}
            label={t('account.emailFieldLabel')}
            value={userInfo.email || notSpecified}
          />
          <InfoField colors={colors} editMode={editMode} icon={Phone}
            label={t('account.phoneFieldLabel')}
            value={userInfo.phone || notSpecified}
            onChangeText={v => setUserInfo(p => ({ ...p, phone: v }))}
          />
          <InfoField colors={colors} editMode={editMode} icon={Calendar} editable={false}
            label={t('account.dobFieldLabel')}
            value={userInfo.dateOfBirth || notSpecified}
          />
          <InfoField colors={colors} editMode={editMode} icon={MapPin} multiline
            label={t('account.addressFieldLabel')}
            value={userInfo.address || notSpecified}
            onChangeText={v => setUserInfo(p => ({ ...p, address: v }))}
          />
          <InfoField colors={colors} editMode={editMode} icon={Globe}
            label={t('account.nationalityFieldLabel')}
            value={userInfo.nationality || notSpecified}
            onChangeText={v => setUserInfo(p => ({ ...p, nationality: v }))}
          />
        </View>

        {/* Professional information */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>{t('account.professionalInfo')}</Text>

          <InfoField colors={colors} editMode={editMode} icon={Building}
            label={t('account.occupationFieldLabel')}
            value={userInfo.occupation || notSpecified}
            onChangeText={v => setUserInfo(p => ({ ...p, occupation: v }))}
          />
          <InfoField colors={colors} editMode={editMode} icon={CreditCard}
            label={t('account.annualIncomeFieldLabel')}
            value={userInfo.annualIncome || notSpecified}
            onChangeText={v => setUserInfo(p => ({ ...p, annualIncome: v }))}
          />
        </View>

        {/* Investment profile */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>{t('account.investmentProfile')}</Text>

          <InfoField colors={colors} editMode={editMode} icon={Shield}
            label={t('account.investmentExperienceLabel')}
            value={userInfo.investmentExperience || notSpecified}
            onChangeText={v => setUserInfo(p => ({ ...p, investmentExperience: v }))}
          />
          <InfoField colors={colors} editMode={editMode} icon={Shield}
            label={t('account.riskToleranceLabel')}
            value={userInfo.riskTolerance || notSpecified}
            onChangeText={v => setUserInfo(p => ({ ...p, riskTolerance: v }))}
          />
        </View>

        {/* KYC */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>{t('account.identityVerification')}</Text>
          <View style={[styles.kycCard, { backgroundColor: colors.background.card, borderColor: colors.border.primary }]}>
            <View style={styles.kycHeader}>
              <View style={[styles.kycIconWrap, { backgroundColor: `${colors.warning}18` }]}>
                <Shield size={24} color={colors.warning} />
              </View>
              <View style={styles.kycInfo}>
                <Text style={[styles.kycTitle, { color: colors.text.primary }]}>
                  {t('account.kycVerification')}
                </Text>
                <Text style={[styles.kycSubtitle, { color: colors.text.secondary }]}>
                  {t('account.kycSubtitle')}
                </Text>
              </View>
            </View>
            <Text style={[styles.kycDesc, { color: colors.text.secondary }]}>
              {t('account.kycDescription')}
            </Text>
            <TouchableOpacity
              style={[styles.kycButton, { backgroundColor: colors.primary }]}
              onPress={() => router.push('/auth/kycRequest')}
              activeOpacity={0.8}
            >
              <Shield size={18} color="#fff" />
              <Text style={styles.kycButtonText}>{t('account.proceedSumsub')}</Text>
            </TouchableOpacity>
          </View>
        </View>
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
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  headerContent: { flex: 1, alignItems: 'center' },
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
  photoSection: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  photoCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
  },
  photoContainer: { position: 'relative', marginBottom: Spacing.lg },
  profilePhoto: { width: 80, height: 80, borderRadius: 40 },
  avatarFallback: { alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { color: '#fff', fontSize: 28, fontFamily: 'Inter-Bold' },
  photoEditButton: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoLabel: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.semiBold,
    marginBottom: Spacing.xs,
  },
  photoSubtext: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing['3xl'],
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
  fieldHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm },
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
  fieldInputMultiline: { height: 80, textAlignVertical: 'top' },
  kycCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    borderWidth: 1,
    gap: Spacing.lg,
  },
  kycHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md },
  kycIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kycInfo: { flex: 1, gap: 4 },
  kycTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.semiBold,
  },
  kycSubtitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
  },
  kycDesc: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    lineHeight: 20,
  },
  kycButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  kycButtonText: {
    color: '#fff',
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.semiBold,
  },
});
