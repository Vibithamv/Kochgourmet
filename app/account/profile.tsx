import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Keyboard,
  ActivityIndicator,
  findNodeHandle,
  Platform,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, User, Mail, Lock, Check, Eye, EyeOff, Edit } from 'lucide-react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';
import { getColors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { userManagement } from '@/hooks/userManagement';
import { useGlobalAlert } from '@/contexts/AlertContext';

type ProfileInfoFieldIcon = React.ComponentType<{ size?: number; color?: string }>;
type ProfileInfoFieldColors = ReturnType<typeof getColors>;

/** Splits `activeAccount.name` into given / family name using the first space. */
function splitNameOnFirstSpace(fullName: string | undefined | null): {
  firstName: string;
  lastName: string;
} {
  const trimmed = (fullName ?? '').trim();
  if (!trimmed) return { firstName: '', lastName: '' };
  const i = trimmed.indexOf(' ');
  if (i === -1) return { firstName: trimmed, lastName: '' };
  return {
    firstName: trimmed.slice(0, i).trimEnd(),
    lastName: trimmed.slice(i + 1).trim(),
  };
}

function ProfileInfoField({
  icon: Icon,
  label,
  value,
  onChangeText,
  editable = true,
  secureTextEntry = false,
  showPassword = false,
  onTogglePassword,
  colors,
  editMode,
  onTextInputNativeFocus,
}: Readonly<{
  icon: ProfileInfoFieldIcon;
  label: string;
  value: string;
  onChangeText?: (text: string) => void;
  editable?: boolean;
  secureTextEntry?: boolean;
  showPassword?: boolean;
  onTogglePassword?: () => void;
  colors: ProfileInfoFieldColors;
  editMode: boolean;
  onTextInputNativeFocus?: (nativeTag: number | null) => void;
}>) {
  const textInputRef = useRef<TextInput>(null);

  return (
    <View style={[styles.infoField, { backgroundColor: colors.background.card, borderColor: colors.border.primary }]}>
      <View style={styles.fieldHeader}>
        <View style={[styles.fieldIcon, { backgroundColor: colors.interactive.hover }]}>
          <Icon size={18} color={colors.text.secondary} />
        </View>
        <Text style={[styles.fieldLabel, { color: colors.text.secondary }]}>{label}</Text>
      </View>
      {editMode && editable ? (
        <View style={styles.inputContainer}>
          <TextInput
            ref={textInputRef}
            style={[
              styles.fieldInput,
              {
                color: colors.text.primary,
                backgroundColor: colors.background.secondary,
                borderColor: colors.border.primary,
              },
            ]}
            value={value}
            onChangeText={onChangeText}
            secureTextEntry={secureTextEntry && !showPassword}
            placeholder={secureTextEntry ? '••••••••' : ''}
            placeholderTextColor={colors.text.placeholder}
            onFocus={() => {
              const tag = findNodeHandle(textInputRef.current);
              onTextInputNativeFocus?.(tag);
            }}
          />
          {secureTextEntry && onTogglePassword && (
            <TouchableOpacity style={styles.eyeButton} onPress={onTogglePassword}>
              {showPassword ? (
                <EyeOff size={20} color={colors.text.placeholder} />
              ) : (
                <Eye size={20} color={colors.text.placeholder} />
              )}
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <Text style={[styles.fieldValue, { color: colors.text.primary }]}>
          {secureTextEntry ? '••••••••' : value}
        </Text>
      )}
    </View>
  );
}

export default function ProfileScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [editMode, setEditMode] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const userProfile = userManagement();
  const { showAlert } = useGlobalAlert();
  const [loading, setLoading] = useState(true);
  const newPasswordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);
  const currentPasswordRef = useRef<TextInput>(null);
  const kasvRef = useRef<InstanceType<typeof KeyboardAwareScrollView> | null>(null);

  useEffect(() => {
    getUser(); // just call it directly
  }, []);

  const scrollFocusedInputAboveKeyboard = useCallback((nativeTag: number | null) => {
    if (nativeTag == null || !kasvRef.current) return;
    requestAnimationFrame(() => {
      kasvRef.current?.scrollToFocusedInput(nativeTag, 160, 100);
    });
  }, []);

  const getUser = async () => {
    try {
      setLoading(true)
      userProfile.getUser().then((data: any) => {
        setLoading(false)
        if (data.success && data.data) {
          const accountName = data.data.data.activeAccount?.name;
          if (typeof accountName === 'string' && accountName.trim()) {
            const { firstName: fn, lastName: ln } = splitNameOnFirstSpace(accountName);
            setFirstName(fn);
            setLastName(ln);
          } else {
            setFirstName(data.data.data.user.first_name ?? '');
            setLastName(data.data.data.user.last_name ?? '');
          }
          setEmail(data.data.data.user.email);
        } else if (data.status === 401) {
          showAlert(t('profile.sessionExpired'), t('profile.loginAgain'));
          router.replace("/auth/login");
        } else {
          showAlert(t('common.error'), t('common.errorMessage'));
        }
      })
    } catch (error) {
      console.error('Error while fetching user data:', error);
    }
  };


  const colors = getColors(theme);

  const hasProfileEdit = React.useMemo(
    () =>
      password.trim().length > 0 ||
      newPassword.trim().length > 0 ||
      confirmPassword.trim().length > 0,
    [password, newPassword, confirmPassword]
  );

  const handleSaveChanges = () => {
    Keyboard.dismiss(); // hides keyboard
    if (!hasProfileEdit) {
      setPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
      setError('');
      setEditMode(false);
      return;
    }

    if (!password) return setError(t('profile.enterPassword'));
    if (!newPassword) return setError(t('profile.enterNewPassword'));
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d])\S{8,}$/;
    if (!regex.test(newPassword)) return setError(t('profile.validationError'));
    if (!confirmPassword) return setError(t('profile.enterConfirmPassword'));
    if (newPassword !== confirmPassword) return setError(t('profile.doNotMatch'));
    setError('');

    setEditMode(false);
    setConfirmPassword('');
    setNewPassword('');
    setPassword('');
    setLoading(true);
    userProfile.updateProfile(firstName, lastName, password, newPassword).then((data) => {
      setLoading(false)
      if (data.success && data.data) {
        showAlert(t('common.success'), t('profile.success'));
      } else if (data.status === 401) {
        if (data.error.error.message === 'Current password is incorrect') {
          showAlert(t('common.failed'), data.error.error.message);
          return;
        } 
        showAlert(t('profile.sessionExpired'), t('profile.loginAgain'));
        router.replace("/auth/login");
      } else {
        showAlert(t('common.failed'), data.error.message);
      }
    })

  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background.secondary }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 44) + 16, backgroundColor: colors.background.primary, borderBottomColor: colors.border.primary }]}>
        <TouchableOpacity style={[styles.backButton, { backgroundColor: colors.background.secondary }]} onPress={() => router.back()}>
          <ArrowLeft size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: colors.text.primary }]}>{t('profile.settingsTitle')}</Text>
          <Text style={[styles.headerSubtitle, { color: colors.text.secondary }]}>{t('profile.settingsSubtitle')}</Text>
        </View>
        <TouchableOpacity
          style={[
            styles.editButton,
            {
              backgroundColor: editMode ? colors.success : colors.primary,
              opacity: editMode && !hasProfileEdit ? 0.45 : 1,
            },
          ]}
          disabled={editMode && !hasProfileEdit}
          onPress={editMode ? handleSaveChanges : () => setEditMode(true)}
        >
          {editMode ? (
            <Check size={20} color={colors.text.inverse} />
          ) : (
            <Edit size={20} color={colors.text.inverse} />
          )}
        </TouchableOpacity>
      </View>

      <KeyboardAwareScrollView
        ref={kasvRef}
        style={styles.content}
        contentContainerStyle={{ paddingBottom: insets.bottom + 50 }}
        showsVerticalScrollIndicator={false}
        enableOnAndroid
        enableAutomaticScroll
        keyboardShouldPersistTaps="handled"
        keyboardOpeningTime={Platform.OS === 'ios' ? 250 : 100}
        extraScrollHeight={120}
        extraHeight={120}
      >
        {/* Profile Photo Section */}
        <View style={styles.photoSection}>
          <View style={[styles.photoCard, { backgroundColor: colors.background.card, borderColor: colors.border.primary }]}>
            <View style={styles.photoContainer}>
              <View style={{
                width: 70, // diameter
                height: 70,
                borderRadius: 35, // make it round
                backgroundColor: 'grey',
                justifyContent: 'center',
                alignItems: 'center',
              }}>
                <Text style={{
                  color: 'white',
                  fontSize: 40,
                  fontWeight: 'bold',
                  textAlign: 'center', // Add this for extra safety
                }}>{firstName.charAt(0)}</Text>
              </View>
            </View>
            <Text style={[styles.photoLabel, { color: colors.text.primary }]}>{t('profile.photo')}</Text>
            {/* <Text style={[styles.photoSubtext, { color: colors.text.secondary }]}>Update your profile picture</Text> */}
          </View>
        </View>

        {/* Basic Profile Information */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>{t('profile.basicInfo')}</Text>

          <ProfileInfoField
            colors={colors}
            editMode={editMode}
            icon={User}
            label={t('profile.firstName')}
            value={firstName}
            editable={false}
          />

          <ProfileInfoField
            colors={colors}
            editMode={editMode}
            icon={User}
            label={t('profile.lastName')}
            value={lastName}
            editable={false}
          />

          <ProfileInfoField
            colors={colors}
            editMode={editMode}
            icon={Mail}
            label={t('profile.emailLabel')}
            value={email}
            editable={false}
          />
        </View>

        {/* Password Section — tighter bottom than other sections (confirm password sits last) */}
        <View style={[styles.section, { marginBottom: Spacing.lg }]}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>{t('profile.security')}</Text>

          {editMode && (
            <>
              <View style={[styles.infoField, { backgroundColor: colors.background.card, borderColor: colors.border.primary }]}>
                <View style={styles.fieldHeader}>
                  <View style={[styles.fieldIcon, { backgroundColor: colors.interactive.hover }]}>
                    <Lock size={18} color={colors.text.secondary} />
                  </View>
                  <Text style={[styles.fieldLabel, { color: colors.text.secondary }]}>{t('profile.currentPassword')}</Text>
                </View>
                <View style={[styles.passwordContainer, { backgroundColor: colors.background.secondary, borderColor: colors.border.primary }]}>
                  <TextInput
                    ref={currentPasswordRef}
                    style={[styles.passwordInput, { color: colors.text.primary }]}
                    value={password}
                    onChangeText={(text) => setPassword(text)}
                    placeholder={t('profile.currentPassword')}
                    placeholderTextColor={colors.text.placeholder}
                    secureTextEntry={!showCurrentPassword}
                    returnKeyType="next"
                    onFocus={() =>
                      scrollFocusedInputAboveKeyboard(findNodeHandle(currentPasswordRef.current))
                    }
                    onSubmitEditing={() => newPasswordRef.current?.focus()}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? (
                      <EyeOff size={20} color={colors.text.placeholder} />
                    ) : (
                      <Eye size={20} color={colors.text.placeholder} />
                    )}
                  </TouchableOpacity>

                </View>
              </View>

              <View style={[styles.infoField, { backgroundColor: colors.background.card, borderColor: colors.border.primary }]}>
                <View style={styles.fieldHeader}>
                  <View style={[styles.fieldIcon, { backgroundColor: colors.interactive.hover }]}>
                    <Lock size={18} color={colors.text.secondary} />
                  </View>
                  <Text style={[styles.fieldLabel, { color: colors.text.secondary }]}>{t('profile.newPassword')}</Text>
                </View>
                <View style={[styles.passwordContainer, { backgroundColor: colors.background.secondary, borderColor: colors.border.primary }]}>
                  <TextInput
                    ref={newPasswordRef}
                    style={[styles.passwordInput, { color: colors.text.primary }]}
                    value={newPassword}
                    onChangeText={(text) => setNewPassword(text)}
                    placeholder={t('profile.newPassword')}
                    placeholderTextColor={colors.text.placeholder}
                    secureTextEntry={!showNewPassword}
                    returnKeyType="next"
                    onFocus={() =>
                      scrollFocusedInputAboveKeyboard(findNodeHandle(newPasswordRef.current))
                    }
                    onSubmitEditing={() => confirmPasswordRef.current?.focus()}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? (
                      <EyeOff size={20} color={colors.text.placeholder} />
                    ) : (
                      <Eye size={20} color={colors.text.placeholder} />
                    )}
                  </TouchableOpacity>

                </View>
              </View>

              <View
                style={[
                  styles.infoField,
                  { backgroundColor: colors.background.card, borderColor: colors.border.primary, marginBottom: Spacing.xs },
                ]}
              >
                <View style={styles.fieldHeader}>
                  <View style={[styles.fieldIcon, { backgroundColor: colors.interactive.hover }]}>
                    <Lock size={18} color={colors.text.secondary} />
                  </View>
                  <Text style={[styles.fieldLabel, { color: colors.text.secondary }]}>{t('profile.confirmPassword')}</Text>
                </View>
                <View style={[styles.passwordContainer, { backgroundColor: colors.background.secondary, borderColor: colors.border.primary }]}>
                  <TextInput
                    ref={confirmPasswordRef}
                    style={[styles.passwordInput, { color: colors.text.primary }]}
                    value={confirmPassword}
                    onChangeText={(text) => setConfirmPassword(text)}
                    placeholder={t('profile.confirmPassword')}
                    placeholderTextColor={colors.text.placeholder}
                    secureTextEntry={!showConfirmPassword}
                    returnKeyType="done"
                    onFocus={() =>
                      scrollFocusedInputAboveKeyboard(findNodeHandle(confirmPasswordRef.current))
                    }
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={20} color={colors.text.placeholder} />
                    ) : (
                      <Eye size={20} color={colors.text.placeholder} />
                    )}
                  </TouchableOpacity>

                </View>
              </View>

              <Text style={{ color: 'red', textAlign: 'center', marginTop: 5, marginBottom: 5 }}>{error}</Text>
            </>
          )}

          {!editMode && (
            <View style={[styles.passwordCard, { backgroundColor: colors.background.card, borderColor: colors.border.primary }]}>
              <View style={styles.passwordHeader}>
                <View style={[styles.passwordIcon, { backgroundColor: colors.interactive.hover }]}>
                  <Lock size={20} color={colors.text.secondary} />
                </View>
                <View style={styles.passwordInfo}>
                  <Text style={[styles.passwordTitle, { color: colors.text.primary }]}>{t('profile.passwordLabel')}</Text>
                  <Text style={[styles.passwordSubtitle, { color: colors.text.secondary }]}>
                    {t('profile.lastChanged')}
                  </Text>
                </View>
              </View>
              <Text style={[styles.passwordValue, { color: colors.text.primary }]}>••••••••</Text>
            </View>
          )}
        </View>
      </KeyboardAwareScrollView>
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}
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
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)', // optional dim
    zIndex: 1000,
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
    ...Shadows.sm,
  },
  content: {
    flex: 1,
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
    ...Shadows.sm,
  },
  photoContainer: {
    position: 'relative',
    marginBottom: Spacing.lg,
  },
  profilePhoto: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  photoEditButton: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm,
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
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  passwordInput: {
    flex: 1,
    padding: Spacing.lg,
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.regular,
  },
  infoField: {
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    ...Shadows.xs,
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
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fieldInput: {
    flex: 1,
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.regular,
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    borderWidth: 1,
  },
  eyeButton: {
    position: 'absolute',
    right: Spacing.md,
    padding: Spacing.xs,
  },
  passwordCard: {
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    borderWidth: 1,
    ...Shadows.xs,
  },
  passwordHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  passwordIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  passwordInfo: {
    flex: 1,
  },
  passwordTitle: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  passwordSubtitle: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
  },
  passwordValue: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.regular,
  },
});