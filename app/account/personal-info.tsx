import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  TextInput,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, User, Mail, Phone, MapPin, Calendar, Shield, CreditCard as Edit3, Camera, Check, ExternalLink, Building, CreditCard, Globe } from 'lucide-react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { getColors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { useGlobalAlert } from '@/contexts/AlertContext';

type InfoFieldIcon = React.ComponentType<{ size?: number; color?: string }>;
type InfoFieldColors = ReturnType<typeof getColors>;

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
  icon: InfoFieldIcon;
  label: string;
  value: string;
  onChangeText?: (text: string) => void;
  editable?: boolean;
  multiline?: boolean;
  colors: InfoFieldColors;
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
        <Text style={[styles.fieldValue, { color: colors.text.primary }]}>{value}</Text>
      )}
    </View>
  );
}

export default function PersonalInfoScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [editMode, setEditMode] = useState(false);
  const [sumsubModalVisible, setSumsubModalVisible] = useState(false);
  const { showAlert } = useGlobalAlert();
  // Mock user data - in real app this would come from user context/API
  const [userInfo, setUserInfo] = useState({
    fullName: user?.firstName + ' ' + user?.lastName || 'Demo User',
    email: user?.email || 'demo@example.com',
    phone: '+1 (555) 123-4567',
    dateOfBirth: '1990-05-15',
    address: '123 Investment Street, New York, NY 10001',
    nationality: 'United States',
    occupation: 'Software Engineer',
    annualIncome: '$75,000 - $100,000',
    investmentExperience: 'Intermediate',
    riskTolerance: 'Moderate',
  });

  const colors = getColors(theme);

  const handleSumsubVerification = () => {
    setSumsubModalVisible(false);
    Alert.alert(
      'KYC Verification',
      'Redirecting to Sumsub for secure identity verification. This process typically takes 5-10 minutes.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Continue', 
          onPress: () => {
            // In a real app, this would open Sumsub SDK or web interface
            showAlert('Demo Mode', 'In production, this would open the Sumsub verification flow.');
          }
        }
      ]
    );
  };

  const handleSaveChanges = () => {
    setEditMode(false);
    showAlert(t('common.success'), 'Your information has been updated successfully.');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background.secondary }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 44) + 16, backgroundColor: colors.background.primary, borderBottomColor: colors.border.primary }]}>
        <TouchableOpacity style={[styles.backButton, { backgroundColor: colors.background.secondary }]} onPress={() => router.back()}>
          <ArrowLeft size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: colors.text.primary }]}>Personal Information</Text>
          <Text style={[styles.headerSubtitle, { color: colors.text.secondary }]}>Manage your profile details</Text>
        </View>
        <TouchableOpacity 
          style={[styles.editButton, { backgroundColor: editMode ? colors.success : colors.primary }]}
          onPress={editMode ? handleSaveChanges : () => setEditMode(true)}
        >
          {editMode ? (
            <Check size={20} color={colors.text.inverse} />
          ) : (
            <Edit3 size={20} color={colors.text.inverse} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Photo Section */}
        <View style={styles.photoSection}>
          <View style={[styles.photoCard, { backgroundColor: colors.background.card, borderColor: colors.border.primary }]}>
            <View style={styles.photoContainer}>
              <Image 
                source={{ uri: 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop' }}
                style={styles.profilePhoto}
              />
              <TouchableOpacity style={[styles.photoEditButton, { backgroundColor: colors.primary }]}>
                <Camera size={16} color={colors.text.inverse} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.photoLabel, { color: colors.text.primary }]}>Profile Photo</Text>
            <Text style={[styles.photoSubtext, { color: colors.text.secondary }]}>Update your profile picture</Text>
          </View>
        </View>

        {/* Basic Information */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Basic Information</Text>
          
          <InfoField
            colors={colors}
            editMode={editMode}
            icon={User}
            label="Full Name"
            value={userInfo.fullName}
            onChangeText={(text) => setUserInfo(prev => ({ ...prev, fullName: text }))}
          />

          <InfoField
            colors={colors}
            editMode={editMode}
            icon={Mail}
            label="Email Address"
            value={userInfo.email}
            editable={false}
          />

          <InfoField
            colors={colors}
            editMode={editMode}
            icon={Phone}
            label="Phone Number"
            value={userInfo.phone}
            onChangeText={(text) => setUserInfo(prev => ({ ...prev, phone: text }))}
          />

          <InfoField
            colors={colors}
            editMode={editMode}
            icon={Calendar}
            label="Date of Birth"
            value={new Date(userInfo.dateOfBirth).toLocaleDateString()}
            editable={false}
          />

          <InfoField
            colors={colors}
            editMode={editMode}
            icon={MapPin}
            label="Address"
            value={userInfo.address}
            onChangeText={(text) => setUserInfo(prev => ({ ...prev, address: text }))}
            multiline={true}
          />

          <InfoField
            colors={colors}
            editMode={editMode}
            icon={Globe}
            label="Nationality"
            value={userInfo.nationality}
            onChangeText={(text) => setUserInfo(prev => ({ ...prev, nationality: text }))}
          />
        </View>

        {/* Professional Information */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Professional Information</Text>
          
          <InfoField
            colors={colors}
            editMode={editMode}
            icon={Building}
            label="Occupation"
            value={userInfo.occupation}
            onChangeText={(text) => setUserInfo(prev => ({ ...prev, occupation: text }))}
          />

          <InfoField
            colors={colors}
            editMode={editMode}
            icon={CreditCard}
            label="Annual Income"
            value={userInfo.annualIncome}
            onChangeText={(text) => setUserInfo(prev => ({ ...prev, annualIncome: text }))}
          />
        </View>

        {/* Investment Profile */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Investment Profile</Text>
          
          <InfoField
            colors={colors}
            editMode={editMode}
            icon={Shield}
            label="Investment Experience"
            value={userInfo.investmentExperience}
            onChangeText={(text) => setUserInfo(prev => ({ ...prev, investmentExperience: text }))}
          />

          <InfoField
            colors={colors}
            editMode={editMode}
            icon={Shield}
            label="Risk Tolerance"
            value={userInfo.riskTolerance}
            onChangeText={(text) => setUserInfo(prev => ({ ...prev, riskTolerance: text }))}
          />
        </View>

        {/* KYC Verification Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Identity Verification</Text>
          
          <View style={[styles.kycCard, { backgroundColor: colors.background.card, borderColor: colors.border.primary }]}>
            <View style={styles.kycHeader}>
              <View style={[styles.kycIcon, { backgroundColor: `${colors.warning}15` }]}>
                <Shield size={24} color={colors.warning} />
              </View>
              <View style={styles.kycInfo}>
                <Text style={[styles.kycTitle, { color: colors.text.primary }]}>KYC Verification</Text>
                <Text style={[styles.kycSubtitle, { color: colors.text.secondary }]}>
                  Complete identity verification to unlock all features
                </Text>
              </View>
              <View style={[styles.kycStatus, { backgroundColor: `${colors.warning}15` }]}>
                <View style={[styles.kycStatusDot, { backgroundColor: colors.warning }]} />
                <Text style={[styles.kycStatusText, { color: colors.warning }]}>Pending</Text>
              </View>
            </View>

            <View style={styles.kycDescription}>
              <Text style={[styles.kycDescriptionText, { color: colors.text.secondary }]}>
                Verify your identity with our secure partner Sumsub to access advanced features and higher investment limits.
              </Text>
            </View>

            <TouchableOpacity 
              style={[styles.sumsubButton, { backgroundColor: colors.primary }]}
              onPress={() => setSumsubModalVisible(true)}
            >
              <Shield size={20} color={colors.text.inverse} />
              <Text style={[styles.sumsubButtonText, { color: colors.text.inverse }]}>
                Start Verification with Sumsub
              </Text>
              <ExternalLink size={16} color={colors.text.inverse} />
            </TouchableOpacity>
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
              <Text style={[styles.sumsubModalTitle, { color: colors.text.primary }]}>Identity Verification</Text>
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
                Secure Identity Verification
              </Text>
              
              <Text style={[styles.sumsubDescription, { color: colors.text.secondary }]}>
                We use Sumsub, a leading identity verification provider, to ensure the security and compliance of our platform. The process is quick, secure, and typically takes 5-10 minutes.
              </Text>

              <View style={styles.sumsubFeatures}>
                <View style={styles.sumsubFeature}>
                  <Check size={16} color={colors.success} />
                  <Text style={[styles.sumsubFeatureText, { color: colors.text.secondary }]}>
                    Bank-grade security
                  </Text>
                </View>
                <View style={styles.sumsubFeature}>
                  <Check size={16} color={colors.success} />
                  <Text style={[styles.sumsubFeatureText, { color: colors.text.secondary }]}>
                    GDPR compliant
                  </Text>
                </View>
                <View style={styles.sumsubFeature}>
                  <Check size={16} color={colors.success} />
                  <Text style={[styles.sumsubFeatureText, { color: colors.text.secondary }]}>
                    Quick 5-minute process
                  </Text>
                </View>
              </View>

              <TouchableOpacity 
                style={[styles.proceedButton, { backgroundColor: colors.primary }]}
                onPress={handleSumsubVerification}
              >
                <Shield size={20} color={colors.text.inverse} />
                <Text style={[styles.proceedButtonText, { color: colors.text.inverse }]}>
                  Proceed to Sumsub
                </Text>
                <ExternalLink size={16} color={colors.text.inverse} />
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.cancelButton, { backgroundColor: colors.background.secondary, borderColor: colors.border.primary }]}
                onPress={() => setSumsubModalVisible(false)}
              >
                <Text style={[styles.cancelButtonText, { color: colors.text.secondary }]}>
                  Maybe Later
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
    ...Shadows.md,
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
    ...Shadows.button,
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
    ...Shadows.xl,
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
    ...Shadows.button,
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