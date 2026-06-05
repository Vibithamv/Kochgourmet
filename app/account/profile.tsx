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
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import * as ImagePicker from 'expo-image-picker';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, ChevronDown, Upload, Check } from 'lucide-react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '@/contexts/ThemeContext';
import { getColors } from '@/constants/theme';
import { userManagement } from '@/hooks/userManagement';
import { useGlobalAlert } from '@/contexts/AlertContext';
import { messageFromApiError } from '@/utils/apiErrorMessage';
import { prepareProfilePicturePayload } from '@/utils/profilePictureUpload';
import { replaceLoginClearingAuthStack } from '@/utils/authNavigation';
import { AccountInfoShimmer } from '@/components/Shimmer';

const ANREDE_OPTIONS = ['Herr', 'Frau', 'Divers', 'Keine Angabe'];

const NATIVE_SWITCH_SIZE = Platform.select({
  ios: { width: 51, height: 31 },
  android: { width: 48, height: 28 },
  default: { width: 51, height: 31 },
});

const NEWSLETTER_SWITCH_SCALE =
  26.756 / NATIVE_SWITCH_SIZE.width;
const NEWSLETTER_SWITCH_LAYOUT = {
  width: NATIVE_SWITCH_SIZE.width * NEWSLETTER_SWITCH_SCALE,
  height: NATIVE_SWITCH_SIZE.height * NEWSLETTER_SWITCH_SCALE,
};

function splitNameOnFirstSpace(fullName: string | undefined | null): { firstName: string; lastName: string } {
  const trimmed = (fullName ?? '').trim();
  if (!trimmed) return { firstName: '', lastName: '' };
  const i = trimmed.indexOf(' ');
  if (i === -1) return { firstName: trimmed, lastName: '' };
  return {
    firstName: trimmed.slice(0, i).trimEnd(),
    lastName: trimmed.slice(i + 1).trim(),
  };
}

function addressFromRaw(raw: unknown): { street: string; postal: string; city: string; country: string } {
  if (!raw) return { street: '', postal: '', city: '', country: '' };
  if (typeof raw === 'object') {
    const r = raw as Record<string, string | undefined>;
    return {
      street: r.street ?? '',
      postal: r.postalCode ?? '',
      city: r.city ?? '',
      country: r.country ?? '',
    };
  }
  return { street: String(raw), postal: '', city: '', country: '' };
}

function ProfilePhotoDecorations({ color }: Readonly<{ color: string }>) {
  return (
    <Svg width={220} height={220} style={StyleSheet.absoluteFill} pointerEvents="none">
      <Path
        d="M 36 58 Q 10 98 30 148"
        stroke={color}
        strokeWidth={2}
        fill="none"
        strokeLinecap="round"
      />
      <Path
        d="M 184 58 Q 210 98 190 148"
        stroke={color}
        strokeWidth={2}
        fill="none"
        strokeLinecap="round"
      />
      <Path
        d="M 72 16 Q 110 2 148 20"
        stroke={color}
        strokeWidth={2}
        fill="none"
        strokeLinecap="round"
      />
    </Svg>
  );
}

export default function ProfileScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const colors = getColors(theme);
  const isDark = theme === 'dark' || theme === 'darkGreen';
  const insets = useSafeAreaInsets();
  const { showAlert } = useGlobalAlert();
  const userProfile = useMemo(() => userManagement(), []);
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

  const [weeklyNewsletter, setWeeklyNewsletter] = useState(true);
  const [dailyNewsletter, setDailyNewsletter] = useState(true);

  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const kasvRef = useRef<InstanceType<typeof KeyboardAwareScrollView> | null>(null);

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
          marginTop: 45,
          paddingTop: 30,
          paddingBottom: 4,
          gap: 0,
          overflow: 'visible',
        },
        photoOuter: {
          width: 181,
          minHeight: 181,
          alignItems: 'center',
          justifyContent: 'flex-start',
          overflow: 'visible',
        },
        photoContainer: {
          position: 'relative',
          width: 160,
          height: 160,
          overflow: 'visible',
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
          zIndex: 2,
        },
        displayName: {
          fontFamily: 'PlayfairDisplay_700Bold',
          fontSize: 35,
          lineHeight: 35,
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
          paddingTop: 50,
        },
        sectionTitle: {
          fontFamily: 'Roboto-Regular',
          fontSize: 17,
          lineHeight: 17,
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
          lineHeight: 16,
          letterSpacing: 0,
          flex: 1,
        },
        pillField: {
          fontFamily: 'Roboto-Light',
          fontSize: 16,
          lineHeight: 16,
          letterSpacing: 0,
          paddingVertical: 0,
        },
        row2: {
          flexDirection: 'row',
          gap: 12,
        },
        plzField: { width: 118 },
        actionsRow: {
          flexDirection: 'row',
          gap: 12,
          marginTop: 20,
          marginBottom: 20,
        },
        cancelBtn: {
          flex: 1,
          flexBasis: 0,
          paddingVertical: 14,
          borderRadius: 9999,
          borderWidth: 1,
          alignItems: 'center',
          justifyContent: 'center',
        },
        cancelText: {
          fontFamily: 'Roboto-Light',
          fontSize: 17,
          lineHeight: 17,
          letterSpacing: 0,
          textAlign: 'center',
        },
        saveBtn: {
          flex: 1,
          flexBasis: 0,
          paddingVertical: 14,
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
          fontSize: 17,
          lineHeight: 17,
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
          width: NEWSLETTER_SWITCH_LAYOUT.width,
          height: NEWSLETTER_SWITCH_LAYOUT.height,
          justifyContent: 'center',
          alignItems: 'center',
        },
        toggleSwitchScale: {
          transform: [{ scale: NEWSLETTER_SWITCH_SCALE }],
        },
        toggleLabel: {
          flex: 1,
          fontFamily: 'Roboto-Light',
          fontSize: 17,
          lineHeight: 17,
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
          lineHeight: 17,
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
          lineHeight: 17,
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
          lineHeight: 16,
        },
      }),
    [colors.background.overlay, isDark]
  );

  const loadUser = useCallback(async () => {
    if (!initialLoadDone.current) {
      setLoading(true);
    }
    try {
      const data = await userProfile.getUser();
      if (data.success && data.data?.data) {
        const u = data.data.data.user ?? {};
        const acc = data.data.data.activeAccount ?? {};
        const accountName = acc.name;
        if (typeof accountName === 'string' && accountName.trim()) {
          const { firstName: fn, lastName: ln } = splitNameOnFirstSpace(accountName);
          setFirstName(fn);
          setLastName(ln);
          setDisplayName(fn || accountName);
        } else {
          setFirstName(u.first_name ?? '');
          setLastName(u.last_name ?? '');
          setDisplayName(u.first_name ?? u.email ?? '');
        }
        setEmail(u.email ?? '');
        setUsername(typeof u.username === 'string' ? u.username : '');
        setPhone(u.phone_number ?? acc.phone_number ?? '');
        const addr = addressFromRaw(u.address ?? acc.address);
        setStreet(addr.street);
        setPostal(addr.postal);
        setCity(addr.city);
        setCountry(addr.country);
        const pic = u.profile_picture;
        setProfilePictureUrl(typeof pic === 'string' && pic.trim() ? pic : null);
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
  }, [showAlert, t, userProfile]);

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

  const uploadPhoto = useCallback(async (image: string, contentType: string) => {
    setUploadingPicture(true);
    try {
      const upload = await userProfile.updateProfilePicture(image, contentType);
      if (upload.success) {
        const refreshed = await userProfile.getUser();
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
  }, [showAlert, t, userProfile]);

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
      await uploadPhoto(prepared.payload.image, prepared.payload.contentType);
    } catch (err: unknown) {
      showAlert(t('common.error'), err instanceof Error ? err.message : t('profile.photoUpdateFailed'));
    }
  }, [ensurePhotoPermission, showAlert, t, uploadPhoto, uploadingPicture]);

  const handleSave = () => {
    Keyboard.dismiss();
    const wantsPasswordChange = password.trim() || confirmPassword.trim();
    if (wantsPasswordChange) {
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
    userProfile
      .updateProfile(firstName, lastName, '', wantsPasswordChange ? password : '')
      .then(data => {
        setSaving(false);
        if (data.success) {
          setPassword('');
          setConfirmPassword('');
          setDisplayName(firstName);
          showAlert(t('common.success'), t('profile.success'));
        } else if (data.status === 401) {
          showAlert(t('profile.sessionExpired'), t('profile.loginAgain'));
          replaceLoginClearingAuthStack();
        } else {
          showAlert(
            t('common.failed'),
            data.error?.error?.message ?? data.error?.message ?? t('common.errorMessage')
          );
        }
      });
  };

  const handleDeleteAccount = () => {
    showAlert(
      t('profile.profileScreen.deleteAccountConfirmTitle'),
      t('profile.profileScreen.deleteAccountConfirmMsg'),
      {
        buttonText: t('common.delete'),
        buttonCallback: () => {
          showAlert(t('common.error'), t('profile.profileScreen.deleteAccountDemo'));
        },
        secondaryButtonText: t('common.cancel'),
      }
    );
  };

  const pillBorder = { borderColor: colors.border.primary, backgroundColor: colors.background.card };
  const fieldColor = { color: colors.text.primary };
  const placeholderColor = colors.text.primary;

  if (loading) {
    return <AccountInfoShimmer />;
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background.primary }]}>
      {/* <View style={[styles.header, { paddingTop: Math.max(insets.top, 44) + 12 }]}>
        <TouchableOpacity
          style={[styles.backCircle, { borderColor: colors.border.primary }]}
          onPress={() => router.back()}
          hitSlop={8}
          activeOpacity={0.7}
        >
          <ArrowLeft size={20} color={colors.text.primary} />
        </TouchableOpacity>
      </View> */}

      <KeyboardAwareScrollView
        ref={kasvRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 16) + 90 }}
        showsVerticalScrollIndicator={false}
        enableOnAndroid
        keyboardShouldPersistTaps="handled"
        extraScrollHeight={120}
      >
        <View style={styles.photoBlock}>
          <View style={styles.photoOuter}>
            {/* <ProfilePhotoDecorations color={colors.primary} /> */}
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
            onChangeText={setStreet}
          />

          <View style={styles.row2}>
            <TextInput
              style={[styles.pillInput, styles.pillField, styles.plzField, pillBorder, fieldColor]}
              placeholder={t('profile.profileScreen.plz')}
              placeholderTextColor={placeholderColor}
              value={postal}
              onChangeText={setPostal}
              keyboardType="number-pad"
            />
            <TextInput
              style={[styles.pillInput, styles.pillField, styles.flex1, pillBorder, fieldColor]}
              placeholder={t('profile.profileScreen.ort')}
              placeholderTextColor={placeholderColor}
              value={city}
              onChangeText={setCity}
            />
          </View>

          <TextInput
            style={[styles.pillInput, styles.pillField, pillBorder, fieldColor]}
            placeholder={t('profile.profileScreen.land')}
            placeholderTextColor={placeholderColor}
            value={country}
            onChangeText={setCountry}
          />

          <TextInput
            style={[styles.pillInput, styles.pillField, pillBorder, fieldColor]}
            placeholder={t('profile.profileScreen.telefonnummer')}
            placeholderTextColor={placeholderColor}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />

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
                  thumbColor="#fff"
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
                  thumbColor="#fff"
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
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextInput
            style={[styles.pillInput, styles.pillField, pillBorder, fieldColor]}
            placeholder={t('profile.profileScreen.username')}
            placeholderTextColor={placeholderColor}
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />
          <TextInput
            style={[styles.pillInput, styles.pillField, pillBorder, fieldColor]}
            placeholder={t('profile.profileScreen.password')}
            placeholderTextColor={placeholderColor}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <TextInput
            style={[styles.pillInput, styles.pillField, pillBorder, fieldColor]}
            placeholder={t('profile.confirmPassword')}
            placeholderTextColor={placeholderColor}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />
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
