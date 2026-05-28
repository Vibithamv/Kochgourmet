import React, { useCallback, useEffect, useRef, useState } from 'react';
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
  Platform,
  Modal,
  Pressable,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, ChevronDown, Upload, Check } from 'lucide-react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';
import { getColors, getTypography } from '@/constants/theme';
import { userManagement } from '@/hooks/userManagement';
import { useGlobalAlert } from '@/contexts/AlertContext';
import { messageFromApiError } from '@/utils/apiErrorMessage';
import { prepareProfilePicturePayload } from '@/utils/profilePictureUpload';

const ANREDE_OPTIONS = ['Herr', 'Frau', 'Divers', 'Keine Angabe'];

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

export default function ProfileScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const colors = getColors(theme);
  const typography = getTypography(theme);
  const insets = useSafeAreaInsets();
  const { showAlert } = useGlobalAlert();
  const userProfile = userManagement();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPicture, setUploadingPicture] = useState(false);

  // Top section
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState('');

  // Personal info fields
  const [anrede, setAnrede] = useState('');
  const [anredeOpen, setAnredeOpen] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [street, setStreet] = useState('');
  const [postal, setPostal] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [phone, setPhone] = useState('');

  // Newsletter
  const [weeklyNewsletter, setWeeklyNewsletter] = useState(true);
  const [dailyNewsletter, setDailyNewsletter] = useState(true);

  // Login data
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const kasvRef = useRef<InstanceType<typeof KeyboardAwareScrollView> | null>(null);

  useEffect(() => { void loadUser(); }, []);

  const loadUser = async () => {
    setLoading(true);
    try {
      const data = await userProfile.getUser();
      if (data.success && data.data) {
        const u = data.data.data.user;
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
        // Username is independent from email — leave it blank when the backend
        // doesn't return one, so the field doesn't duplicate the email above.
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
        router.replace('/auth/login');
      } else {
        showAlert(t('common.error'), t('common.errorMessage'));
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Photo upload ───────────────────────────────────────────────────────────
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
        router.replace('/auth/login');
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
        mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.85,
      });
      if (result.canceled || !result.assets?.[0]?.uri) return;
      const asset = result.assets[0];
      const prepared = await prepareProfilePicturePayload(asset.uri, asset.mimeType ?? null, asset.fileSize ?? null);
      if (!prepared.ok) {
        const msg = prepared.error === 'tooLarge' ? t('profile.photoTooLarge')
          : prepared.error === 'unsupported' ? t('profile.photoUnsupportedFormat')
          : t('profile.photoUpdateFailed');
        showAlert(t('common.failed'), msg);
        return;
      }
      await uploadPhoto(prepared.payload.image, prepared.payload.contentType);
    } catch (err: unknown) {
      showAlert(t('common.error'), err instanceof Error ? err.message : t('profile.photoUpdateFailed'));
    }
  }, [ensurePhotoPermission, showAlert, t, uploadPhoto, uploadingPicture]);

  // ── Save ───────────────────────────────────────────────────────────────────
  const handleSave = () => {
    Keyboard.dismiss();
    const wantsPasswordChange =
      currentPassword.trim() || newPassword.trim() || confirmPassword.trim();
    if (wantsPasswordChange) {
      if (!currentPassword) return showAlert(t('common.error'), t('profile.enterPassword'));
      if (!newPassword) return showAlert(t('common.error'), t('profile.enterNewPassword'));
      const pwRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d])\S{8,}$/;
      if (!pwRegex.test(newPassword)) return showAlert(t('common.error'), t('profile.validationError'));
      if (newPassword !== confirmPassword) return showAlert(t('common.error'), t('profile.doNotMatch'));
    }
    setSaving(true);
    userProfile.updateProfile(firstName, lastName, currentPassword, wantsPasswordChange ? newPassword : '').then(data => {
      setSaving(false);
      if (data.success) {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setDisplayName(firstName);
        showAlert(t('common.success'), t('profile.success'));
      } else if (data.status === 401) {
        showAlert(t('profile.sessionExpired'), t('profile.loginAgain'));
        router.replace('/auth/login');
      } else {
        showAlert(t('common.failed'), data.error?.error?.message ?? data.error?.message ?? t('common.errorMessage'));
      }
    });
  };

  const handleDeleteAccount = () => {
    showAlert(
      'Konto löschen',
      'Möchtest du dein Konto wirklich endgültig löschen?',
      {
        buttonText: 'Löschen',
        buttonCallback: () => {
          showAlert(t('common.error'), 'Konto-Löschung im Demo-Modus nicht aktiv.');
        },
        secondaryButtonText: 'Abbrechen',
      }
    );
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <View style={[styles.screen, { backgroundColor: colors.background.primary }]}>
      {/* Mini header — just the back arrow */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 44) + 12 }]}>
        <TouchableOpacity
          style={[styles.backCircle, { borderColor: colors.border.primary }]}
          onPress={() => router.back()}
          hitSlop={8}
          activeOpacity={0.7}
        >
          <ArrowLeft size={20} color={colors.text.primary} />
        </TouchableOpacity>
      </View>

      <KeyboardAwareScrollView
        ref={kasvRef}
        contentContainerStyle={{ paddingBottom: insets.bottom + 50 }}
        showsVerticalScrollIndicator={false}
        enableOnAndroid
        keyboardShouldPersistTaps="handled"
        extraScrollHeight={120}
      >
        {/* Profile photo + name */}
        <View style={styles.photoBlock}>
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
              style={[styles.photoUploadBtn, {
                backgroundColor: colors.primary,
                opacity: uploadingPicture ? 0.6 : 1,
              }]}
              onPress={handleChangeProfilePhoto}
              disabled={uploadingPicture}
              activeOpacity={0.8}
            >
              <Upload size={18} color="#fff" strokeWidth={2.5} />
            </TouchableOpacity>
          </View>
          <Text style={[styles.displayName, {
            color: colors.text.primary,
            fontFamily: typography.fontFamily.display,
          }]}>
            {displayName || '...'}
          </Text>
        </View>

        {/* Personal info form */}
        <View style={styles.section}>
          {/* Anrede dropdown */}
          <View>
            <Text style={[styles.fieldLabel, { color: colors.text.tertiary }]}>Anrede</Text>
            <TouchableOpacity
              style={[styles.pillInput, { borderColor: colors.border.primary, backgroundColor: colors.background.card }]}
              onPress={() => setAnredeOpen(true)}
              activeOpacity={0.7}
            >
              <Text style={[styles.pillInputText, { color: anrede ? colors.text.primary : colors.text.tertiary }]}>
                {anrede || 'Anrede wählen'}
              </Text>
              <ChevronDown size={18} color={colors.text.tertiary} />
            </TouchableOpacity>
          </View>

          {/* Vorname / Nachname */}
          <View style={styles.row2}>
            <View style={styles.flex1}>
              <Text style={[styles.fieldLabel, { color: colors.text.tertiary }]}>Vorname</Text>
              <TextInput
                style={[styles.pillInput, styles.pillField, { borderColor: colors.border.primary, backgroundColor: colors.background.card, color: colors.text.primary }]}
                placeholder="Vorname"
                placeholderTextColor={colors.text.tertiary}
                value={firstName}
                onChangeText={setFirstName}
              />
            </View>
            <View style={styles.flex1}>
              <Text style={[styles.fieldLabel, { color: colors.text.tertiary }]}>Nachname</Text>
              <TextInput
                style={[styles.pillInput, styles.pillField, { borderColor: colors.border.primary, backgroundColor: colors.background.card, color: colors.text.primary }]}
                placeholder="Nachname"
                placeholderTextColor={colors.text.tertiary}
                value={lastName}
                onChangeText={setLastName}
              />
            </View>
          </View>

          <View>
            <Text style={[styles.fieldLabel, { color: colors.text.tertiary }]}>Straße</Text>
            <TextInput
              style={[styles.pillInput, styles.pillField, { borderColor: colors.border.primary, backgroundColor: colors.background.card, color: colors.text.primary }]}
              placeholder="Straße & Hausnummer"
              placeholderTextColor={colors.text.tertiary}
              value={street}
              onChangeText={setStreet}
            />
          </View>

          <View style={styles.row2}>
            <View style={{ width: 120 }}>
              <Text style={[styles.fieldLabel, { color: colors.text.tertiary }]}>PLZ</Text>
              <TextInput
                style={[styles.pillInput, styles.pillField, styles.pillFlex0, { borderColor: colors.border.primary, backgroundColor: colors.background.card, color: colors.text.primary }]}
                placeholder="PLZ"
                placeholderTextColor={colors.text.tertiary}
                value={postal}
                onChangeText={setPostal}
                keyboardType="number-pad"
              />
            </View>
            <View style={styles.flex1}>
              <Text style={[styles.fieldLabel, { color: colors.text.tertiary }]}>Ort</Text>
              <TextInput
                style={[styles.pillInput, styles.pillField, { borderColor: colors.border.primary, backgroundColor: colors.background.card, color: colors.text.primary }]}
                placeholder="Ort"
                placeholderTextColor={colors.text.tertiary}
                value={city}
                onChangeText={setCity}
              />
            </View>
          </View>

          <View>
            <Text style={[styles.fieldLabel, { color: colors.text.tertiary }]}>Land</Text>
            <TextInput
              style={[styles.pillInput, styles.pillField, { borderColor: colors.border.primary, backgroundColor: colors.background.card, color: colors.text.primary }]}
              placeholder="Land"
              placeholderTextColor={colors.text.tertiary}
              value={country}
              onChangeText={setCountry}
            />
          </View>

          <View>
            <Text style={[styles.fieldLabel, { color: colors.text.tertiary }]}>Telefonnummer</Text>
            <TextInput
              style={[styles.pillInput, styles.pillField, { borderColor: colors.border.primary, backgroundColor: colors.background.card, color: colors.text.primary }]}
              placeholder="z. B. +49 151 1234567"
              placeholderTextColor={colors.text.tertiary}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
          </View>

          {/* Action buttons */}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.cancelBtn, { borderColor: colors.border.primary }]}
              onPress={() => router.back()}
              activeOpacity={0.7}
            >
              <Text style={[styles.cancelText, { color: colors.text.primary }]}>Abbrechen</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: colors.primary }]}
              onPress={handleSave}
              activeOpacity={0.85}
              disabled={saving}
            >
              {saving
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.saveBtnText}>Speichern</Text>}
            </TouchableOpacity>
          </View>
        </View>

        {/* Newsletter */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Newsletter</Text>
          <Text style={[styles.sectionDesc, { color: colors.text.primary }]}>
            Lass dir unsere Rezept Empfehlungen täglich oder wöchentlich zuschicken. 😊
          </Text>
          <View style={styles.toggleRow}>
            <Switch
              value={weeklyNewsletter}
              onValueChange={setWeeklyNewsletter}
              trackColor={{ false: colors.border.primary, true: colors.primary }}
              thumbColor="#fff"
            />
            <Text style={[styles.toggleLabel, { color: colors.text.primary }]}>Wöchentlicher Newsletter</Text>
          </View>
          <View style={styles.toggleRow}>
            <Switch
              value={dailyNewsletter}
              onValueChange={setDailyNewsletter}
              trackColor={{ false: colors.border.primary, true: colors.primary }}
              thumbColor="#fff"
            />
            <Text style={[styles.toggleLabel, { color: colors.text.primary }]}>Täglicher Newsletter</Text>
          </View>
        </View>

        {/* Login Daten */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Login Daten</Text>
          <Text style={[styles.sectionDesc, { color: colors.text.primary }]}>
            Ändere deine E-Mail Adresse, Benutzernamen oder dein Passwort.
          </Text>

          <View>
            <Text style={[styles.fieldLabel, { color: colors.text.tertiary }]}>E-Mail Adresse</Text>
            <TextInput
              style={[styles.pillInput, styles.pillField, { borderColor: colors.border.primary, backgroundColor: colors.background.card, color: colors.text.primary }]}
              placeholder="name@example.com"
              placeholderTextColor={colors.text.tertiary}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>
          <View>
            <Text style={[styles.fieldLabel, { color: colors.text.tertiary }]}>Benutzername</Text>
            <TextInput
              style={[styles.pillInput, styles.pillField, { borderColor: colors.border.primary, backgroundColor: colors.background.card, color: colors.text.primary }]}
              placeholder="Benutzername"
              placeholderTextColor={colors.text.tertiary}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />
          </View>
          <View>
            <Text style={[styles.fieldLabel, { color: colors.text.tertiary }]}>Aktuelles Passwort</Text>
            <TextInput
              style={[styles.pillInput, styles.pillField, { borderColor: colors.border.primary, backgroundColor: colors.background.card, color: colors.text.primary }]}
              placeholder="••••••••"
              placeholderTextColor={colors.text.tertiary}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry
            />
          </View>
          <View>
            <Text style={[styles.fieldLabel, { color: colors.text.tertiary }]}>Neues Passwort</Text>
            <TextInput
              style={[styles.pillInput, styles.pillField, { borderColor: colors.border.primary, backgroundColor: colors.background.card, color: colors.text.primary }]}
              placeholder="Mind. 8 Zeichen, Groß-/Kleinbuchstaben, Zahl, Sonderzeichen"
              placeholderTextColor={colors.text.tertiary}
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
            />
          </View>
          <View>
            <Text style={[styles.fieldLabel, { color: colors.text.tertiary }]}>Passwort bestätigen</Text>
            <TextInput
              style={[styles.pillInput, styles.pillField, { borderColor: colors.border.primary, backgroundColor: colors.background.card, color: colors.text.primary }]}
              placeholder="Neues Passwort wiederholen"
              placeholderTextColor={colors.text.tertiary}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />
          </View>
        </View>

        {/* Konto löschen */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Konto löschen</Text>
          <Text style={[styles.sectionDesc, { color: colors.text.primary }]}>
            Willst du wirklich dein Konto löschen? 🥺
          </Text>
          <TouchableOpacity
            style={[styles.deleteBtn, { backgroundColor: colors.primary }]}
            onPress={handleDeleteAccount}
            activeOpacity={0.85}
          >
            <Text style={styles.deleteBtnText}>Konto löschen</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAwareScrollView>

      {(loading || saving || uploadingPicture) && (
        <View style={[styles.loadingOverlay, { backgroundColor: colors.background.overlay }]} pointerEvents="auto">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}

      {/* Anrede dropdown sheet */}
      <Modal
        visible={anredeOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setAnredeOpen(false)}
      >
        <Pressable style={styles.sheetOverlay} onPress={() => setAnredeOpen(false)}>
          <Pressable
            style={[styles.sheet, { backgroundColor: colors.background.card, paddingBottom: Math.max(insets.bottom, 16) }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={[styles.sheetHandle, { backgroundColor: colors.border.primary }]} />
            <Text style={[styles.sheetTitle, { color: colors.text.primary }]}>Anrede wählen</Text>
            {ANREDE_OPTIONS.map(opt => (
              <TouchableOpacity
                key={opt}
                style={[styles.sheetRow, { borderBottomColor: colors.border.primary }]}
                onPress={() => { setAnrede(opt); setAnredeOpen(false); }}
                activeOpacity={0.7}
              >
                <Text style={[styles.sheetRowText, { color: colors.text.primary }]}>{opt}</Text>
                {anrede === opt && <Check size={18} color={colors.primary} />}
              </TouchableOpacity>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 4,
  },
  backCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Photo + name
  photoBlock: {
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 8,
    gap: 16,
  },
  photoContainer: {
    position: 'relative',
    width: 160,
    height: 160,
  },
  profilePhoto: { width: 160, height: 160, borderRadius: 80 },
  avatarFallback: { alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { color: '#fff', fontSize: 56, fontFamily: 'Inter-Bold' },
  photoUploadBtn: {
    position: 'absolute',
    bottom: 6,
    left: 62,   // (160 - 36) / 2 — centres the 36px button in the 160px circle
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  displayName: {
    fontSize: 32,
    lineHeight: 40,
    letterSpacing: -0.3,
  },

  // Generic section
  section: {
    paddingHorizontal: 20,
    paddingTop: 24,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
  },
  sectionDesc: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
    marginBottom: 8,
  },

  // Field labels (small caps above each pill input)
  fieldLabel: {
    fontSize: 11,
    fontFamily: 'Inter-SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 6,
    marginLeft: 22,
  },
  flex1: { flex: 1 },

  // Pill inputs
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
    fontSize: 15,
    fontFamily: 'Inter-Regular',
  },
  pillField: {
    fontSize: 15,
    fontFamily: 'Inter-Regular',
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
  },
  pillFlex0: { flexGrow: 0 },
  row2: {
    flexDirection: 'row',
    gap: 12,
  },

  // Actions
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 9999,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelText: { fontSize: 15, fontFamily: 'Inter-SemiBold' },
  saveBtn: {
    flex: 1.6,
    paddingVertical: 14,
    borderRadius: 9999,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 15,
    fontFamily: 'Inter-SemiBold',
  },

  // Toggles
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  toggleLabel: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Inter-Regular',
  },

  // Delete button
  deleteBtn: {
    paddingVertical: 14,
    borderRadius: 9999,
    alignItems: 'center',
    marginTop: 4,
  },
  deleteBtnText: {
    color: '#fff',
    fontSize: 15,
    fontFamily: 'Inter-SemiBold',
  },

  // Loading overlay
  loadingOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },

  // Bottom sheet (Anrede dropdown)
  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  sheetHandle: {
    width: 40, height: 4, borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 8,
  },
  sheetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sheetRowText: { fontSize: 15, fontFamily: 'Inter-Regular' },
});
