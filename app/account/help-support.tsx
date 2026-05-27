import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Modal,
  Linking,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, MessageCircle, Mail, Phone, ExternalLink, Send, X, CircleHelp as HelpCircle, Book, Video, Users, Clock, CircleCheck as CheckCircle, MapPin } from 'lucide-react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';
import { getColors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { useGlobalAlert } from '@/contexts/AlertContext';

/** Support inbox — must be a full address (`user@domain`) for mailto: to populate the To field. */
const SUPPORT_EMAIL = 'office-if@assetera.com';
const OFFICIAL_FAQS_URL = 'https://www.assetera.com/faqs';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: 'general' | 'investment' | 'technical' | 'account';
}

interface SupportOption {
  id: string;
  title: string;
  description: string;
  icon: any;
  action: () => void;
  available: boolean;
}

export default function HelpSupportScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [contactModalVisible, setContactModalVisible] = useState(false);
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);
  const [contactForm, setContactForm] = useState({
    subject: '',
    message: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
  });
  const { showAlert } = useGlobalAlert();
  const colors = getColors(theme);

  const openEmailSupport = async () => {
    const mailtoUrl = `mailto:${SUPPORT_EMAIL}`;
    const showUnavailable = () => {
      showAlert(
        t('common.error'),
        t('helpSupport.emailSupport.unavailable', { email: SUPPORT_EMAIL })
      );
    };

    try {
      // iOS: open Mail directly — canOpenURL often returns false despite a working mail app.
      if (Platform.OS === 'ios') {
        await Linking.openURL(mailtoUrl);
        return;
      }

      const canOpen = await Linking.canOpenURL(mailtoUrl);
      if (!canOpen) {
        showUnavailable();
        return;
      }
      await Linking.openURL(mailtoUrl);
    } catch {
      showUnavailable();
    }
  };

  const openOfficialFaqs = async () => {
    try {
      if (Platform.OS === 'ios') {
        await Linking.openURL(OFFICIAL_FAQS_URL);
        return;
      }
      const canOpen = await Linking.canOpenURL(OFFICIAL_FAQS_URL);
      if (!canOpen) {
        showAlert(t('common.error'), t('helpSupport.faq.linkUnavailable'));
        return;
      }
      await Linking.openURL(OFFICIAL_FAQS_URL);
    } catch {
      showAlert(t('common.error'), t('helpSupport.faq.linkUnavailable'));
    }
  };

  const faqItems: FAQItem[] = [
    {
      id: '1',
      question: t('helpSupport.faq.q1'),
      answer: t('helpSupport.faq.a1'),
      category: 'investment',
    },
    {
      id: '2',
      question: t('helpSupport.faq.q2'),
      answer: t('helpSupport.faq.a2'),
      category: 'account',
    },
    {
      id: '3',
      question: t('helpSupport.faq.q3'),
      answer: t('helpSupport.faq.a3'),
      category: 'investment',
    },
    {
      id: '4',
      question: t('helpSupport.faq.q4'),
      answer: t('helpSupport.faq.a4'),
      category: 'technical',
    },
    {
      id: '5',
      question: t('helpSupport.faq.q5'),
      answer: t('helpSupport.faq.a5'),
      category: 'general',
    },
    {
      id: '6',
      question: t('helpSupport.faq.q6'),
      answer: t('helpSupport.faq.a6'),
      category: 'investment',
    },
  ];

  const supportOptions: SupportOption[] = [
    // {
    //   id: 'chat',
    //   title: t('helpSupport.liveChat.title'),
    //   description: t('helpSupport.liveChat.description'),
    //   icon: MessageCircle,
    //   action: () => showAlert(t('helpSupport.liveChat.alertTitle'), t('helpSupport.liveChat.alertMsg')),
    //   available: false,
    // },
    {
      id: 'email',
      title: t('helpSupport.emailSupport.title'),
      description: t('helpSupport.emailSupport.description'),
      icon: Mail,
      action: () => void openEmailSupport(),
      available: true,
    },
    // {
    //   id: 'phone',
    //   title: t('helpSupport.phoneSupport.title'),
    //   description: t('helpSupport.phoneSupport.description'),
    //   icon: Phone,
    //   action: () => void Linking.openURL('tel:+1-555-899999'),
    //   available: true,
    // },
    // {
    //   id: 'docs',
    //   title: t('helpSupport.documentation.title'),
    //   description: t('helpSupport.documentation.description'),
    //   icon: Book,
    //   action: () => showAlert(t('helpSupport.documentation.alertTitle'), t('helpSupport.documentation.alertMsg')),
    //   available: false,
    // },
  ];

  const handleSendMessage = () => {
    if (!contactForm.subject || !contactForm.message) {
      showAlert(t('helpSupport.contactForm.errorTitle'), t('helpSupport.contactForm.errorMsg'));
      return;
    }

    setContactModalVisible(false);
    showAlert(t('helpSupport.contactForm.successTitle'), t('helpSupport.contactForm.successMsg'),
      {
        buttonText: "OK",
        buttonCallback: () => {
          setContactForm({
            subject: '',
            message: '',
            priority: 'medium',
          });
        },
      }
    )
  };

  const toggleFAQ = (faqId: string) => {
    setExpandedFAQ(expandedFAQ === faqId ? null : faqId);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return colors.error;
      case 'medium': return colors.warning;
      case 'low': return colors.success;
      default: return colors.text.secondary;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background.secondary }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 44) + 16, backgroundColor: colors.background.primary, borderBottomColor: colors.border.primary }]}>
        <TouchableOpacity style={[styles.backButton, { backgroundColor: colors.background.secondary }]} onPress={() => router.back()}>
          <ArrowLeft size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: colors.text.primary }]}>{t('helpSupport.title')}</Text>
          <Text style={[styles.headerSubtitle, { color: colors.text.secondary }]}>{t('helpSupport.subtitle')}</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Quick Support Options */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>{t('helpSupport.contactSupport')}</Text>

          <View style={styles.supportGrid}>
            {supportOptions.map((option) => {
              const IconComponent = option.icon;
              return (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.supportCard,
                    {
                      backgroundColor: colors.background.card,
                      borderColor: colors.border.primary,
                      opacity: option.available ? 1 : 0.6
                    }
                  ]}
                  onPress={option.available ? option.action : undefined}
                  disabled={!option.available}
                >
                  <View style={[styles.supportIcon, { backgroundColor: colors.interactive.hover }]}>
                    <IconComponent size={24} color={option.available ? colors.primary : colors.text.tertiary} />
                  </View>
                  <Text style={[styles.supportTitle, { color: colors.text.primary }]}>{option.title}</Text>
                  <Text style={[styles.supportDescription, { color: colors.text.secondary }]}>{option.description}</Text>
                  {!option.available && (
                    <View style={[styles.comingSoonBadge, { backgroundColor: colors.interactive.hover }]}>
                      <Clock size={12} color={colors.text.tertiary} />
                      <Text style={[styles.comingSoonText, { color: colors.text.tertiary }]}>{t('helpSupport.liveChat.badge')}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          <View
            style={[
              styles.addressCard,
              {
                backgroundColor: colors.background.card,
                borderColor: colors.border.primary,
              },
            ]}
          >
            <View style={styles.addressHeader}>
              <MapPin size={20} color={colors.primary} />
              <Text style={[styles.addressTitle, { color: colors.text.primary }]}>
                {t('helpSupport.address.title')}
              </Text>
            </View>
            <Text style={[styles.addressLine, { color: colors.text.secondary }]}>
              {t('helpSupport.address.companyLine')}
            </Text>
            <Text style={[styles.addressLine, { color: colors.text.secondary }]}>
              {t('helpSupport.address.streetLine')}
            </Text>
          </View>
        </View>

        {/* Business Hours */}
        {/* <View style={styles.section}>
          <View style={[styles.businessHoursCard, { backgroundColor: colors.background.card, borderColor: colors.border.primary }]}>
            <View style={styles.businessHoursHeader}>
              <Clock size={20} color={colors.info} />
              <Text style={[styles.businessHoursTitle, { color: colors.text.primary }]}>{t('helpSupport.businessHours.title')}</Text>
            </View>
            <View style={styles.businessHoursList}>
              <View style={styles.businessHoursItem}>
                <Text style={[styles.businessHoursDay, { color: colors.text.secondary }]}>{t('helpSupport.businessHours.monFri')}</Text>
                <Text style={[styles.businessHoursTime, { color: colors.text.primary }]}>9:00 AM - 6:00 PM CET</Text>
              </View>
              <View style={styles.businessHoursItem}>
                <Text style={[styles.businessHoursDay, { color: colors.text.secondary }]}>{t('helpSupport.businessHours.sat')}</Text>
                <Text style={[styles.businessHoursTime, { color: colors.text.primary }]}>10:00 AM - 4:00 PM CET</Text>
              </View>
              <View style={styles.businessHoursItem}>
                <Text style={[styles.businessHoursDay, { color: colors.text.secondary }]}>{t('helpSupport.businessHours.sun')}</Text>
                <Text style={[styles.businessHoursTime, { color: colors.text.tertiary }]}>{t('helpSupport.businessHours.closed')}</Text>
              </View>
            </View>
          </View>
        </View> */}

        {/* FAQ Section */}
        {/* <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>{t('helpSupport.faq.title')}</Text> */}

          {/* <View
            style={[
              styles.faqCard,
              {
                backgroundColor: colors.background.card,
                borderColor: colors.border.primary,
              },
            ]}
          >
            <Text style={[styles.faqWebsiteHint, { color: colors.text.secondary }]}>
              {t('helpSupport.faq.browseOfficialWebsite')}
            </Text>
            <TouchableOpacity
              style={styles.faqWebsiteLinkRow}
              onPress={() => void openOfficialFaqs()}
              activeOpacity={0.7}
              accessibilityRole="link"
              accessibilityLabel={t('helpSupport.faq.openOfficialWebsite')}
            >
              <Text style={[styles.faqWebsiteLink, { color: colors.primary }]}>
                {OFFICIAL_FAQS_URL}
              </Text>
              <ExternalLink size={16} color={colors.primary} />
            </TouchableOpacity>
          </View> */}

          {/* <View style={styles.faqList}>
            {faqItems.map((faq) => (
              <TouchableOpacity
                key={faq.id}
                style={[styles.faqItem, { backgroundColor: colors.background.card, borderColor: colors.border.primary }]}
                onPress={() => toggleFAQ(faq.id)}
              >
                <View style={styles.faqHeader}>
                  <HelpCircle size={20} color={colors.primary} />
                  <Text style={[styles.faqQuestion, { color: colors.text.primary }]}>{faq.question}</Text>
                </View>
                {expandedFAQ === faq.id && (
                  <Text style={[styles.faqAnswer, { color: colors.text.secondary }]}>{faq.answer}</Text>
                )}
              </TouchableOpacity>
            ))}
          </View> */}
        {/* </View> */}

        {/* Resources */}
        {/* <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>{t('helpSupport.resources.title')}</Text>

          <TouchableOpacity style={[styles.resourceItem, { backgroundColor: colors.background.card, borderColor: colors.border.primary }]}>
            <View style={[styles.resourceIcon, { backgroundColor: colors.interactive.hover }]}>
              <Book size={20} color={colors.info} />
            </View>
            <View style={styles.resourceContent}>
              <Text style={[styles.resourceTitle, { color: colors.text.primary }]}>{t('helpSupport.resources.guide.title')}</Text>
              <Text style={[styles.resourceDescription, { color: colors.text.secondary }]}>{t('helpSupport.resources.guide.description')}</Text>
            </View>
            <ExternalLink size={16} color={colors.text.tertiary} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.resourceItem, { backgroundColor: colors.background.card, borderColor: colors.border.primary }]}>
            <View style={[styles.resourceIcon, { backgroundColor: colors.interactive.hover }]}>
              <Video size={20} color={colors.warning} />
            </View>
            <View style={styles.resourceContent}>
              <Text style={[styles.resourceTitle, { color: colors.text.primary }]}>{t('helpSupport.resources.video.title')}</Text>
              <Text style={[styles.resourceDescription, { color: colors.text.secondary }]}>{t('helpSupport.resources.video.description')}</Text>
            </View>
            <ExternalLink size={16} color={colors.text.tertiary} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.resourceItem, { backgroundColor: colors.background.card, borderColor: colors.border.primary }]}>
            <View style={[styles.resourceIcon, { backgroundColor: colors.interactive.hover }]}>
              <Users size={20} color={colors.success} />
            </View>
            <View style={styles.resourceContent}>
              <Text style={[styles.resourceTitle, { color: colors.text.primary }]}>{t('helpSupport.resources.forum.title')}</Text>
              <Text style={[styles.resourceDescription, { color: colors.text.secondary }]}>{t('helpSupport.resources.forum.description')}</Text>
            </View>
            <ExternalLink size={16} color={colors.text.tertiary} />
          </TouchableOpacity>
        </View> */}
      </ScrollView>

      {/* Contact Form Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={contactModalVisible}
        onRequestClose={() => setContactModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.contactModal, { backgroundColor: colors.background.primary }]}>
            <View style={styles.contactModalHeader}>
              <Text style={[styles.contactModalTitle, { color: colors.text.primary }]}>{t('helpSupport.contactForm.title')}</Text>
              <TouchableOpacity
                style={[styles.closeButton, { backgroundColor: colors.background.secondary }]}
                onPress={() => setContactModalVisible(false)}
              >
                <X size={24} color={colors.text.secondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.contactModalContent} showsVerticalScrollIndicator={false}>
              <View style={styles.formSection}>
                <View style={styles.inputContainer}>
                  <Text style={[styles.inputLabel, { color: colors.text.primary }]}>{t('helpSupport.contactForm.subject')}</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.background.secondary, borderColor: colors.border.primary, color: colors.text.primary }]}
                    value={contactForm.subject}
                    onChangeText={(text) => setContactForm(prev => ({ ...prev, subject: text }))}
                    placeholder={t('helpSupport.contactForm.subjectPlaceholder')}
                    placeholderTextColor={colors.text.placeholder}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={[styles.inputLabel, { color: colors.text.primary }]}>{t('helpSupport.contactForm.priority')}</Text>
                  <View style={styles.prioritySelector}>
                    {['low', 'medium', 'high'].map((priority) => (
                      <TouchableOpacity
                        key={priority}
                        style={[
                          styles.priorityOption,
                          {
                            backgroundColor: contactForm.priority === priority ? getPriorityColor(priority) : colors.background.secondary,
                            borderColor: contactForm.priority === priority ? getPriorityColor(priority) : colors.border.primary
                          }
                        ]}
                        onPress={() => setContactForm(prev => ({ ...prev, priority: priority as any }))}
                      >
                        <Text style={[
                          styles.priorityText,
                          {
                            color: contactForm.priority === priority ? colors.text.inverse : colors.text.secondary,
                            fontFamily: contactForm.priority === priority ? Typography.fontFamily.semiBold : Typography.fontFamily.regular
                          }
                        ]}>
                          {t(`helpSupport.priority.${priority}`)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={[styles.inputLabel, { color: colors.text.primary }]}>{t('helpSupport.contactForm.message')}</Text>
                  <TextInput
                    style={[styles.textArea, { backgroundColor: colors.background.secondary, borderColor: colors.border.primary, color: colors.text.primary }]}
                    value={contactForm.message}
                    onChangeText={(text) => setContactForm(prev => ({ ...prev, message: text }))}
                    placeholder={t('helpSupport.contactForm.messagePlaceholder')}
                    placeholderTextColor={colors.text.placeholder}
                    multiline
                    numberOfLines={6}
                    textAlignVertical="top"
                  />
                </View>

                <TouchableOpacity
                  style={[styles.sendButton, { backgroundColor: colors.primary }]}
                  onPress={handleSendMessage}
                >
                  <Send size={20} color={colors.text.inverse} />
                  <Text style={[styles.sendButtonText, { color: colors.text.inverse }]}>{t('helpSupport.contactForm.send')}</Text>
                </TouchableOpacity>

                <View style={[styles.responseTimeCard, { backgroundColor: colors.interactive.hover }]}>
                  <CheckCircle size={16} color={colors.success} />
                  <Text style={[styles.responseTimeText, { color: colors.text.secondary }]}>
                    {t('helpSupport.contactForm.responseTime')}
                  </Text>
                </View>
              </View>
            </ScrollView>
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
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing['3xl'],
    paddingTop: Spacing.xl,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    marginBottom: Spacing.lg,
    letterSpacing: -0.2,
  },
  supportGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  supportCard: {
    width: '48%',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    ...Shadows.sm,
    position: 'relative',
  },
  supportIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  supportTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.semiBold,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  supportDescription: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    textAlign: 'center',
    lineHeight: 18,
  },
  comingSoonBadge: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  comingSoonText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    marginLeft: 2,
  },
  addressCard: {
    marginTop: Spacing.lg,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    borderWidth: 1,
  },
  addressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  addressTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.semiBold,
    marginLeft: Spacing.sm,
  },
  addressLine: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    lineHeight: 22,
    marginBottom: Spacing.xs,
  },
  businessHoursCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    borderWidth: 1,
    ...Shadows.sm,
  },
  businessHoursHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  businessHoursTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.semiBold,
    marginLeft: Spacing.sm,
  },
  businessHoursList: {
    gap: Spacing.md,
  },
  businessHoursItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  businessHoursDay: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
  },
  businessHoursTime: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
  },
  faqCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    borderWidth: 1,
    ...Shadows.sm,
  },
  faqWebsiteHint: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    lineHeight: 22,
    marginBottom: Spacing.md,
  },
  faqWebsiteLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  faqWebsiteLink: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
    flex: 1,
  },
  faqList: {
    gap: Spacing.md,
  },
  faqItem: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    ...Shadows.sm,
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  faqQuestion: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.semiBold,
    marginLeft: Spacing.sm,
    flex: 1,
  },
  faqAnswer: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    lineHeight: 22,
    marginTop: Spacing.sm,
    paddingLeft: 32,
  },
  resourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    ...Shadows.sm,
  },
  resourceIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.lg,
  },
  resourceContent: {
    flex: 1,
  },
  resourceTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.semiBold,
    marginBottom: Spacing.xs,
  },
  resourceDescription: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  contactModal: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingTop: Spacing.xl,
    maxHeight: '85%',
  },
  contactModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl,
    borderBottomWidth: 1,
  },
  contactModalTitle: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactModalContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
  },
  formSection: {
    paddingBottom: Spacing.xl,
  },
  inputContainer: {
    marginBottom: Spacing.lg,
  },
  inputLabel: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semiBold,
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.regular,
    borderWidth: 1,
  },
  textArea: {
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.regular,
    borderWidth: 1,
    height: 120,
  },
  prioritySelector: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  priorityOption: {
    flex: 1,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  priorityText: {
    fontSize: Typography.fontSize.base,
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
    ...Shadows.button,
  },
  sendButtonText: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.semiBold,
  },
  responseTimeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  responseTimeText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
  },
});