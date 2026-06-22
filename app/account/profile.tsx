import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Image,
  Keyboard,
  ActivityIndicator,
  Switch,
  Modal,
  Pressable,
  Platform,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
  type LayoutChangeEvent,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, ChevronDown, Upload, Check, Eye, EyeOff } from 'lucide-react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '@/contexts/ThemeContext';
import { getColors } from '@/constants/theme';
import { mobileAppUserManagement } from '@/hooks/mobileApp';
import type { MobileAppUser } from '@/types/mobileAppApi';
import { useGlobalAlert } from '@/contexts/AlertContext';
import { messageFromApiError } from '@/utils/apiErrorMessage';
import { prepareProfilePicturePayload, type ProfilePicturePayload } from '@/utils/profilePictureUpload';
import { replaceLoginClearingAuthStack } from '@/utils/authNavigation';
import { ProfileScreenShimmer } from '@/components/Shimmer';
import { ProfilePhotoTopLeftIcon } from '@/components/ProfilePhotoTopLeftIcon';
import { ProfilePhotoBottomRightIcon } from '@/components/ProfilePhotoBottomRightIcon';

const ANREDE_OPTIONS = ['Herr', 'Frau', 'Divers', 'Keine Angabe'];

function genderFromApi(gender?: number | string): string {
  if (gender === 1 || gender === '1') return 'Herr';
  if (gender === 2 || gender === '2') return 'Frau';
  if (gender === 3 || gender === '3') return 'Divers';
  if (gender === 0 || gender === '0') return 'Keine Angabe';
  return '';
}

function genderToApi(anrede: string): number | undefined {
  const map: Record<string, number> = {
    Herr: 1,
    Frau: 2,
    Divers: 3,
    'Keine Angabe': 0,
  };
  return map[anrede];
}

function applyProfileToState(
  profile: MobileAppUser,
  setters: {
    setDisplayName: (v: string) => void;
    setFirstName: (v: string) => void;
    setLastName: (v: string) => void;
    setEmail: (v: string) => void;
    setUsername: (v: string) => void;
    setPhone: (v: string) => void;
    setStreet: (v: string) => void;
    setPostal: (v: string) => void;
    setCity: (v: string) => void;
    setCountry: (v: string) => void;
    setWeeklyNewsletter: (v: boolean) => void;
    setDailyNewsletter: (v: boolean) => void;
    setProfilePictureUrl: (v: string | null) => void;
    setAnrede: (v: string) => void;
  },
) {
  setters.setDisplayName(profile.displayName ?? profile.firstName ?? '');
  setters.setFirstName(profile.firstName ?? '');
  setters.setLastName(profile.lastName ?? '');
  setters.setEmail(profile.email ?? '');
  setters.setUsername(profile.username ?? profile.email ?? '');
  setters.setPhone(profile.telephone ?? '');
  setters.setStreet(profile.address ?? '');
  setters.setPostal(profile.zip ?? '');
  setters.setCity(profile.city ?? '');
  setters.setCountry(profile.country ?? '');
  setters.setWeeklyNewsletter(profile.newsletterWeekly ?? false);
  setters.setDailyNewsletter(profile.newsletterDaily ?? false);
  const pic = profile.profileImageUrl ?? profile.image;
  setters.setProfilePictureUrl(typeof pic === 'string' && pic.trim() ? pic : null);
  setters.setAnrede(genderFromApi(profile.gender));
}

const PROFILE_SWITCH = Platform.select({
  ios: {
    layoutWidth: 51,
    layoutHeight: 31,
    scale: 1,
  },
  android: {
    layoutWidth: 51,
    layoutHeight: 31,
    scale: 51 / 48,
  },
  default: {
    layoutWidth: 51,
    layoutHeight: 31,
    scale: 1,
  },
})!;

export default function ProfileScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const colors = getColors(theme);
  const isDark = theme === 'dark' || theme === 'darkGreen';
  const insets = useSafeAreaInsets();
  const { showAlert } = useGlobalAlert();
  const profileApi = useMemo(() => mobileAppUserManagement(), []);
  const initialLoadDone = useRef(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPicture, setUploadingPicture] = useState(false);

  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState('');

  const [anrede, setAnrede] = useState('');
  const [anredeOpen, setAnredeOpen] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [street, setStreet] = useState('');
  const [postal, setPostal] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [phone, setPhone] = useState('');

  const [weeklyNewsletter, setWeeklyNewsletter] = useState(false);
  const [dailyNewsletter, setDailyNewsletter] = useState(false);

  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const kasvRef = useRef<InstanceType<typeof KeyboardAwareScrollView> | null>(null);
  const [scrollY, setScrollY] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);
  const [actionsLayout, setActionsLayout] = useState({ y: 0, height: 0 });

  const showFixedActions =
    actionsLayout.height === 0 ||
    (viewportHeight > 0 && scrollY + viewportHeight < actionsLayout.y + actionsLayout.height);

  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    setScrollY(event.nativeEvent.contentOffset.y);
  }, []);

  const handleActionsLayout = useCallback((event: LayoutChangeEvent) => {
    const { y, height } = event.nativeEvent.layout;
    setActionsLayout({ y, height });
  }, []);

  const handleViewportLayout = useCallback((event: LayoutChangeEvent) => {
    setViewportHeight(event.nativeEvent.layout.height);
  }, []);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        screen: { flex: 1 },
        header: {
          paddingHorizontal: 26,
          paddingBottom: 4,
        },
        backCircle: {
          width: 40,
          height: 40,
          borderRadius: 20,
          borderWidth: 1,
          alignItems: 'center',
          justifyContent: 'center',
        },
        photoBlock: {
          alignItems: 'center',
          marginTop: 8,
          paddingTop: 30,
          paddingBottom: 4,
          gap: 0,
          overflow: 'visible',
        },
        photoOuter: {
          position: 'relative',
          width: 196,
          minHeight: 196,
          alignItems: 'center',
          justifyContent: 'flex-start',
          overflow: 'visible',
        },
        photoContainer: {
          position: 'relative',
          width: 160,
          height: 160,
          overflow: 'visible',
          zIndex: 2,
        },
        photoTopLeftIcon: {
          top: 0,
          left: -35,
        },
        photoBottomRightIcon: {
          bottom: 10,
          right: -45,
        },
        profilePhoto: { width: 160, height: 160, borderRadius: 80 },
        avatarFallback: { alignItems: 'center', justifyContent: 'center' },
        avatarInitial: { color: '#fff', fontSize: 56, fontFamily: 'PlayfairDisplay_700Bold' },
        photoUploadBtn: {
          position: 'absolute',
          bottom: -18,
          left: 62,
          width: 36,
          height: 36,
          borderRadius: 18,
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 5,
        },
        displayName: {
          fontFamily: 'PlayfairDisplay_700Bold',
          fontSize: 35,
          lineHeight: 48,
          letterSpacing: 0,
          textTransform: 'lowercase',
          marginTop: 10,
          marginBottom: 10,
        },
        section: {
          paddingHorizontal: 26,
          paddingTop: 28,
          gap: 12,
        },
        personalSection: {
          paddingTop: 12,
        },
        loginSection: {
          paddingTop: 50,
        },
        deleteSection: {
          paddingTop: 20,
        },
        actionsSection: {
          paddingTop: 50,
          paddingBottom: 4,
        },
        sectionTitle: {
          fontFamily: 'Roboto-Regular',
          fontSize: 17,
          lineHeight: 23,
          letterSpacing: 0,
        },
        sectionDesc: {
          fontFamily: 'Roboto-Light',
          fontSize: 15,
          lineHeight: 23,
          letterSpacing: 0,
          marginBottom: 4,
        },
        flex1: { flex: 1 },
        pillInput: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderWidth: 1,
          borderRadius: 9999,
          paddingHorizontal: 22,
          paddingVertical: 14,
          minHeight: 48,
        },
        pillInputText: {
          fontFamily: 'Roboto-Light',
          fontSize: 16,
          lineHeight: 22,
          letterSpacing: 0,
          flex: 1,
        },
        pillField: {
          fontFamily: 'Roboto-Light',
          fontSize: 16,
          lineHeight: 22,
          letterSpacing: 0,
          paddingVertical: 0,
        },
        passwordPillInput: {
          paddingVertical: 12,
          minHeight: 40,
        },
        eyeButton: {
          padding: 6,
          marginLeft: 4,
        },
        passwordEyeButton: {
          padding: 2,
          marginLeft: 4,
        },
        row2: {
          flexDirection: 'row',
          gap: 12,
        },
        plzField: { width: 118 },
        floatingFooter: {
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          paddingHorizontal: 26,
          paddingTop: 12,
          borderTopWidth: StyleSheet.hairlineWidth,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
          elevation: 8,
        },
        actionsRow: {
          flexDirection: 'row',
          gap: 12,
        },
        cancelBtn: {
          flex: 1,
          flexBasis: 0,
          paddingVertical: 12,
          borderRadius: 9999,
          borderWidth: 1,
          alignItems: 'center',
          justifyContent: 'center',
        },
        cancelText: {
          fontFamily: 'Roboto-Light',
          fontSize: 16,
          lineHeight: 20,
          letterSpacing: 0,
          textAlign: 'center',
        },
        saveBtn: {
          flex: 1,
          flexBasis: 0,
          paddingVertical: 12,
          borderRadius: 9999,
          alignItems: 'center',
          justifyContent: 'center',
        },
        saveBtnInner: {
          alignItems: 'center',
          justifyContent: 'center',
        },
        saveBtnTextHidden: { opacity: 0 },
        saveBtnLoader: { position: 'absolute' },
        saveBtnText: {
          color: isDark ? '#0D1117' : '#FFFFFF',
          fontFamily: 'Roboto-Regular',
          fontSize: 16,
          lineHeight: 20,
          letterSpacing: 0,
          textAlign: 'center',
        },
        toggleRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 14,
          paddingVertical: 6,
        },
        toggleSwitchWrap: {
          width: PROFILE_SWITCH.layoutWidth,
          height: PROFILE_SWITCH.layoutHeight,
          justifyContent: 'center',
          alignItems: 'center',
        },
        toggleSwitchScale: {
          transform: [{ scale: PROFILE_SWITCH.scale }],
        },
        toggleLabel: {
          flex: 1,
          fontFamily: 'Roboto-Light',
          fontSize: 17,
          lineHeight: 23,
          letterSpacing: 0,
        },
        deleteBtn: {
          paddingVertical: 14,
          borderRadius: 9999,
          alignItems: 'center',
          marginTop: 4,
        },
        deleteBtnText: {
          color: isDark ? '#0D1117' : '#FFFFFF',
          fontFamily: 'Roboto-Regular',
          fontSize: 17,
          lineHeight: 23,
          letterSpacing: 0,
          textAlign: 'center',
        },
        sheetOverlay: {
          flex: 1,
          backgroundColor: colors.background.overlay,
          justifyContent: 'flex-end',
        },
        sheet: {
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          paddingHorizontal: 26,
          paddingTop: 12,
        },
        sheetHandle: {
          width: 40,
          height: 4,
          borderRadius: 2,
          alignSelf: 'center',
          marginBottom: 16,
        },
        sheetTitle: {
          fontFamily: 'Roboto-Regular',
          fontSize: 17,
          lineHeight: 23,
          marginBottom: 8,
        },
        sheetRow: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingVertical: 16,
          borderBottomWidth: StyleSheet.hairlineWidth,
        },
        sheetRowText: {
          fontFamily: 'Roboto-Light',
          fontSize: 16,
          lineHeight: 22,
        },
      }),
    [colors.background.overlay, isDark]
  );

  const loadUser = useCallback(async () => {
    if (!initialLoadDone.current) {
      setLoading(true);
    }
    try {
      const data = await profileApi.getProfile();
      if (data.success && data.data) {
        applyProfileToState(data.data, {
          setDisplayName,
          setFirstName,
          setLastName,
          setEmail,
          setUsername,
          setPhone,
          setStreet,
          setPostal,
          setCity,
          setCountry,
          setWeeklyNewsletter,
          setDailyNewsletter,
          setProfilePictureUrl,
          setAnrede,
        });
      } else if (data.status === 401) {
        showAlert(t('profile.sessionExpired'), t('profile.loginAgain'));
        replaceLoginClearingAuthStack();
      } else {
        showAlert(t('common.error'), t('common.errorMessage'));
      }
    } finally {
      initialLoadDone.current = true;
      setLoading(false);
    }
  }, [profileApi, showAlert, t]);

  useFocusEffect(
    useCallback(() => {
      void loadUser();
    }, [loadUser])
  );

  const ensurePhotoPermission = useCallback(async (): Promise<boolean> => {
    const { status, canAskAgain } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status === 'granted') return true;
    const suffix = canAskAgain ? '' : ' Bitte erlaube den Zugriff in den Einstellungen.';
    showAlert(t('common.error'), t('profile.photoPermissionDenied') + suffix);
    return false;
  }, [showAlert, t]);

  const uploadPhoto = useCallback(async (payload: ProfilePicturePayload) => {
    setUploadingPicture(true);
    try {
      const upload = await profileApi.uploadProfileImage(payload);
      if (upload.success && upload.data) {
        const pic = upload.data.profileImageUrl ?? upload.data.image;
        setProfilePictureUrl(typeof pic === 'string' && pic.trim() ? pic : null);
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
  }, [profileApi, showAlert, t]);

  const handleChangeProfilePhoto = useCallback(async () => {
    if (uploadingPicture) return;
    try {
      if (!(await ensurePhotoPermission())) return;
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });
      if (result.canceled || !result.assets?.[0]?.uri) return;
      const asset = result.assets[0];
      const prepared = await prepareProfilePicturePayload(
        asset.uri,
        asset.mimeType ?? null,
        asset.fileSize ?? null
      );
      if (!prepared.ok) {
        const msg =
          prepared.error === 'tooLarge'
            ? t('profile.photoTooLarge')
            : prepared.error === 'unsupported'
              ? t('profile.photoUnsupportedFormat')
              : t('profile.photoUpdateFailed');
        showAlert(t('common.failed'), msg);
        return;
      }
      await uploadPhoto(prepared.payload);
    } catch (err: unknown) {
      showAlert(t('common.error'), err instanceof Error ? err.message : t('profile.photoUpdateFailed'));
    }
  }, [ensurePhotoPermission, showAlert, t, uploadPhoto, uploadingPicture]);

  const handleSave = () => {
    Keyboard.dismiss();
    const wantsPasswordChange = password.trim() || confirmPassword.trim();
    if (wantsPasswordChange) {
      if (!currentPassword.trim()) {
        showAlert(t('common.error'), t('profile.enterCurrentPassword'));
        return;
      }
      if (!password.trim()) {
        showAlert(t('common.error'), t('profile.enterNewPassword'));
        return;
      }
      const pwRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d])\S{8,}$/;
      if (!pwRegex.test(password)) {
        showAlert(t('common.error'), t('profile.validationError'));
        return;
      }
      if (password !== confirmPassword) {
        showAlert(t('common.error'), t('profile.doNotMatch'));
        return;
      }
    }

    setSaving(true);
    const gender = genderToApi(anrede);
    const profilePayload = {
      firstName,
      lastName,
      profileImageUrl: profilePictureUrl,
      newsletterDaily: dailyNewsletter,
      newsletterWeekly: weeklyNewsletter,
      ...(gender !== undefined ? { gender } : {}),
    };

    void (async () => {
      try {
        const profileResult = await profileApi.updateProfile(profilePayload);
        if (!profileResult.success) {
          if (profileResult.status === 401) {
            showAlert(t('profile.sessionExpired'), t('profile.loginAgain'));
            replaceLoginClearingAuthStack();
            return;
          }
          showAlert(
            t('common.failed'),
            messageFromApiError(profileResult.error, t('common.errorMessage')),
          );
          return;
        }

        if (wantsPasswordChange) {
          const passwordResult = await profileApi.changePassword({
            currentPassword: currentPassword.trim(),
            newPassword: password.trim(),
          });
          if (!passwordResult.success) {
            showAlert(
              t('common.failed'),
              messageFromApiError(passwordResult.error, t('profile.validationError')),
            );
            return;
          }
        }

        if (profileResult.data) {
          applyProfileToState(profileResult.data, {
            setDisplayName,
            setFirstName,
            setLastName,
            setEmail,
            setUsername,
            setPhone,
            setStreet,
            setPostal,
            setCity,
            setCountry,
            setWeeklyNewsletter,
            setDailyNewsletter,
            setProfilePictureUrl,
            setAnrede,
          });
        }

        setCurrentPassword('');
        setPassword('');
        setConfirmPassword('');
        setDisplayName(firstName);
        showAlert(t('common.success'), t('profile.success'));
      } finally {
        setSaving(false);
      }
    })();
  };

  const handleDeleteAccount = () => {
    showAlert(
      t('profile.profileScreen.deleteAccountConfirmTitle'),
      t('profile.profileScreen.deleteAccountConfirmMsg'),
      {
        buttonText: t('common.delete'),
        buttonCallback: () => {
          void (async () => {
            const result = await profileApi.deleteAccount();
            if (result.success) {
              replaceLoginClearingAuthStack();
              return;
            }
            if (result.status === 401) {
              showAlert(t('profile.sessionExpired'), t('profile.loginAgain'));
              replaceLoginClearingAuthStack();
              return;
            }
            showAlert(t('common.error'), messageFromApiError(result.error, t('common.errorMessage')));
          })();
        },
        secondaryButtonText: t('common.cancel'),
      }
    );
  };

  const pillBorder = { borderColor: colors.border.primary, backgroundColor: colors.background.card };
  const fieldColor = { color: colors.text.primary };
  const placeholderColor = colors.text.primary;
  const bottomBarInset = Math.max(insets.bottom, 16);

  const renderActionButtons = () => (
    <View style={styles.actionsRow}>
      <TouchableOpacity
        style={[styles.cancelBtn, { borderColor: colors.border.primary }]}
        onPress={() => router.back()}
        activeOpacity={0.7}
      >
        <Text style={[styles.cancelText, { color: colors.text.primary }]}>
          {t('profile.profileScreen.cancel')}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.saveBtn, { backgroundColor: colors.primary, opacity: saving ? 0.6 : 1 }]}
        onPress={handleSave}
        activeOpacity={0.85}
        disabled={saving}
      >
        <View style={styles.saveBtnInner}>
          <Text style={[styles.saveBtnText, saving && styles.saveBtnTextHidden]}>
            {t('profile.profileScreen.save')}
          </Text>
          {saving ? (
            <ActivityIndicator
              size="small"
              color={isDark ? '#0D1117' : '#FFFFFF'}
              style={styles.saveBtnLoader}
            />
          ) : null}
        </View>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return <ProfileScreenShimmer />;
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background.primary }]}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 44) + 12 }]}>
        <TouchableOpacity
          style={[styles.backCircle, { borderColor: colors.border.primary, backgroundColor: colors.background.card }]}
          onPress={() => router.back()}
          hitSlop={8}
          activeOpacity={0.7}
        >
          <ArrowLeft size={20} color={colors.text.primary} />
        </TouchableOpacity>
      </View>

      <KeyboardAwareScrollView
        ref={kasvRef}
        style={{ flex: 1 }}
        onLayout={handleViewportLayout}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingBottom: bottomBarInset + 16 }}
        showsVerticalScrollIndicator={false}
        enableOnAndroid
        keyboardShouldPersistTaps="handled"
        extraScrollHeight={120}
      >
        <View style={styles.photoBlock}>
          <View style={styles.photoOuter}>
            <View style={styles.photoContainer}>
              {profilePictureUrl ? (
                <Image source={{ uri: profilePictureUrl }} style={styles.profilePhoto} />
              ) : (
                <View style={[styles.profilePhoto, styles.avatarFallback, { backgroundColor: colors.primary }]}>
                  <Text style={styles.avatarInitial}>
                    {displayName ? displayName[0].toUpperCase() : '?'}
                  </Text>
                </View>
              )}
              <ProfilePhotoTopLeftIcon style={styles.photoTopLeftIcon} />
              <ProfilePhotoBottomRightIcon style={styles.photoBottomRightIcon} />
              <TouchableOpacity
                style={[
                  styles.photoUploadBtn,
                  { backgroundColor: colors.primary, opacity: uploadingPicture ? 0.6 : 1 },
                ]}
                onPress={handleChangeProfilePhoto}
                disabled={uploadingPicture}
                activeOpacity={0.8}
              >
                {uploadingPicture ? (
                  <ActivityIndicator size="small" color={isDark ? '#0D1117' : '#FFFFFF'} />
                ) : (
                  <Upload size={18} color={isDark ? '#0D1117' : '#FFFFFF'} strokeWidth={2.5} />
                )}
              </TouchableOpacity>
            </View>
          </View>
          <Text style={[styles.displayName, { color: colors.text.primary }]}>
            {displayName || '...'}
          </Text>
        </View>

        <View style={[styles.section, styles.personalSection]}>
          <TouchableOpacity
            style={[styles.pillInput, pillBorder]}
            onPress={() => setAnredeOpen(true)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.pillInputText,
                { color: anrede ? colors.text.primary : placeholderColor },
              ]}
            >
              {anrede || t('profile.profileScreen.anrede')}
            </Text>
            <ChevronDown size={18} color={colors.text.tertiary} />
          </TouchableOpacity>

          <View style={styles.row2}>
            <TextInput
              style={[styles.pillInput, styles.pillField, styles.flex1, pillBorder, fieldColor]}
              placeholder={t('profile.profileScreen.vorname')}
              placeholderTextColor={placeholderColor}
              value={firstName}
              onChangeText={setFirstName}
            />
            <TextInput
              style={[styles.pillInput, styles.pillField, styles.flex1, pillBorder, fieldColor]}
              placeholder={t('profile.profileScreen.nachname')}
              placeholderTextColor={placeholderColor}
              value={lastName}
              onChangeText={setLastName}
            />
          </View>

          <TextInput
            style={[styles.pillInput, styles.pillField, pillBorder, fieldColor]}
            placeholder={t('profile.profileScreen.strasse')}
            placeholderTextColor={placeholderColor}
            value={street}
            editable={false}
          />

          <View style={styles.row2}>
            <TextInput
              style={[styles.pillInput, styles.pillField, styles.plzField, pillBorder, fieldColor]}
              placeholder={t('profile.profileScreen.plz')}
              placeholderTextColor={placeholderColor}
              value={postal}
              editable={false}
            />
            <TextInput
              style={[styles.pillInput, styles.pillField, styles.flex1, pillBorder, fieldColor]}
              placeholder={t('profile.profileScreen.ort')}
              placeholderTextColor={placeholderColor}
              value={city}
              editable={false}
            />
          </View>

          <TextInput
            style={[styles.pillInput, styles.pillField, pillBorder, fieldColor]}
            placeholder={t('profile.profileScreen.land')}
            placeholderTextColor={placeholderColor}
            value={country}
            editable={false}
          />

          <TextInput
            style={[styles.pillInput, styles.pillField, pillBorder, fieldColor]}
            placeholder={t('profile.profileScreen.telefonnummer')}
            placeholderTextColor={placeholderColor}
            value={phone}
            editable={false}
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
            {t('profile.profileScreen.newsletter')}
          </Text>
          <Text style={[styles.sectionDesc, { color: colors.text.primary }]}>
            {t('profile.profileScreen.newsletterDesc')}
          </Text>
          <View style={styles.toggleRow}>
            <View style={styles.toggleSwitchWrap}>
              <View style={styles.toggleSwitchScale}>
                <Switch
                  value={weeklyNewsletter}
                  onValueChange={setWeeklyNewsletter}
                  trackColor={{ false: colors.border.primary, true: colors.primary }}
                  ios_backgroundColor={colors.border.primary}
                  thumbColor="#FFFFFF"
                />
              </View>
            </View>
            <Text style={[styles.toggleLabel, { color: colors.text.primary }]}>
              {t('profile.profileScreen.weeklyNewsletter')}
            </Text>
          </View>
          <View style={styles.toggleRow}>
            <View style={styles.toggleSwitchWrap}>
              <View style={styles.toggleSwitchScale}>
                <Switch
                  value={dailyNewsletter}
                  onValueChange={setDailyNewsletter}
                  trackColor={{ false: colors.border.primary, true: colors.primary }}
                  ios_backgroundColor={colors.border.primary}
                  thumbColor="#FFFFFF"
                />
              </View>
            </View>
            <Text style={[styles.toggleLabel, { color: colors.text.primary }]}>
              {t('profile.profileScreen.dailyNewsletter')}
            </Text>
          </View>
        </View>

        <View style={[styles.section, styles.loginSection]}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
            {t('profile.profileScreen.loginData')}
          </Text>
          <Text style={[styles.sectionDesc, { color: colors.text.primary }]}>
            {t('profile.profileScreen.loginDataDesc')}
          </Text>

          <TextInput
            style={[styles.pillInput, styles.pillField, pillBorder, fieldColor]}
            placeholder={t('profile.profileScreen.email')}
            placeholderTextColor={placeholderColor}
            value={email}
            editable={false}
            autoCapitalize="none"
          />
          <TextInput
            style={[styles.pillInput, styles.pillField, pillBorder, fieldColor]}
            placeholder={t('profile.profileScreen.username')}
            placeholderTextColor={placeholderColor}
            value={username}
            editable={false}
            autoCapitalize="none"
          />
          <View style={[styles.pillInput, styles.passwordPillInput, pillBorder]}>
            <TextInput
              style={[styles.pillField, styles.flex1, fieldColor]}
              placeholder={t('profile.currentPassword')}
              placeholderTextColor={placeholderColor}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry={!showCurrentPassword}
              autoComplete="password"
            />
            <TouchableOpacity
              style={styles.passwordEyeButton}
              onPress={() => setShowCurrentPassword((prev) => !prev)}
              hitSlop={8}
              activeOpacity={0.7}
            >
              {showCurrentPassword ? (
                <EyeOff size={18} color={colors.text.tertiary} />
              ) : (
                <Eye size={18} color={colors.text.tertiary} />
              )}
            </TouchableOpacity>
          </View>
          <View style={[styles.pillInput, styles.passwordPillInput, pillBorder]}>
            <TextInput
              style={[styles.pillField, styles.flex1, fieldColor]}
              placeholder={t('profile.newPassword')}
              placeholderTextColor={placeholderColor}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoComplete="password-new"
            />
            <TouchableOpacity
              style={styles.passwordEyeButton}
              onPress={() => setShowPassword((prev) => !prev)}
              hitSlop={8}
              activeOpacity={0.7}
            >
              {showPassword ? (
                <EyeOff size={18} color={colors.text.tertiary} />
              ) : (
                <Eye size={18} color={colors.text.tertiary} />
              )}
            </TouchableOpacity>
          </View>
          <View style={[styles.pillInput, styles.passwordPillInput, pillBorder]}>
            <TextInput
              style={[styles.pillField, styles.flex1, fieldColor]}
              placeholder={t('profile.confirmPassword')}
              placeholderTextColor={placeholderColor}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
              autoComplete="password-new"
            />
            <TouchableOpacity
              style={styles.passwordEyeButton}
              onPress={() => setShowConfirmPassword((prev) => !prev)}
              hitSlop={8}
              activeOpacity={0.7}
            >
              {showConfirmPassword ? (
                <EyeOff size={18} color={colors.text.tertiary} />
              ) : (
                <Eye size={18} color={colors.text.tertiary} />
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View
          style={[styles.section, styles.actionsSection]}
          onLayout={handleActionsLayout}
        >
          {renderActionButtons()}
        </View>

        <View style={[styles.section, styles.deleteSection]}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
            {t('profile.profileScreen.deleteAccount')}
          </Text>
          <Text style={[styles.sectionDesc, { color: colors.text.primary }]}>
            {t('profile.profileScreen.deleteAccountDesc')}
          </Text>
          <TouchableOpacity
            style={[styles.deleteBtn, { backgroundColor: colors.primary }]}
            onPress={handleDeleteAccount}
            activeOpacity={0.85}
          >
            <Text style={styles.deleteBtnText}>{t('profile.profileScreen.deleteAccountBtn')}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAwareScrollView>

      {showFixedActions ? (
        <View
          style={[
            styles.floatingFooter,
            {
              backgroundColor: colors.background.primary,
              borderTopColor: colors.border.primary,
              paddingBottom: bottomBarInset,
            },
          ]}
        >
          {renderActionButtons()}
        </View>
      ) : null}

      <Modal visible={anredeOpen} transparent animationType="slide" onRequestClose={() => setAnredeOpen(false)}>
        <Pressable style={styles.sheetOverlay} onPress={() => setAnredeOpen(false)}>
          <Pressable
            style={[
              styles.sheet,
              {
                backgroundColor: colors.background.card,
                paddingBottom: Math.max(insets.bottom, 16),
              },
            ]}
            onPress={e => e.stopPropagation()}
          >
            <View style={[styles.sheetHandle, { backgroundColor: colors.border.primary }]} />
            <Text style={[styles.sheetTitle, { color: colors.text.primary }]}>
              {t('profile.profileScreen.anredeChoose')}
            </Text>
            {ANREDE_OPTIONS.map(opt => (
              <TouchableOpacity
                key={opt}
                style={[styles.sheetRow, { borderBottomColor: colors.border.primary }]}
                onPress={() => {
                  setAnrede(opt);
                  setAnredeOpen(false);
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.sheetRowText, { color: colors.text.primary }]}>{opt}</Text>
                {anrede === opt ? <Check size={18} color={colors.primary} /> : null}
              </TouchableOpacity>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
