import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  ListRenderItem,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  CreditCard,
  Building2,
  Plus,
  X,
  User
} from 'lucide-react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';
import { getColors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { listOfferings } from '@/hooks/listOfferings';
import { useGlobalAlert } from '@/contexts/AlertContext';

interface PaymentMethod {

  id: string;
  type: string;
  bankName: string;
  accountNumber: string;
  accountName: string
  expiryDate?: string;
  accountType?: string;

}

const createStyles = (colors: any) => StyleSheet.create({
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
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.md,
    ...Shadows.sm,
  },
  paymentsList: {
    padding: Spacing.xl,
  },
  paymentCard: {
    backgroundColor: colors.background.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: colors.border.primary,
    ...Shadows.md,
  },
  paymentHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
  },
  paymentIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.lg,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  paymentName: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.semiBold,
    color: colors.text.teritory,
    marginRight: Spacing.sm,
  },
  primaryBadge: {
    backgroundColor: colors.warning,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  primaryText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.bold,
    color: colors.text.inverse,
    marginLeft: 2,
  },
  paymentDetails: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    color: colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  paymentExpiry: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
    color: colors.text.black,
  },
  paymentActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.primary,
  },
  setPrimaryButton: {
    borderColor: colors.success,
    backgroundColor: `${colors.success}10`,
  },
  removeButton: {
    borderColor: colors.error,
    backgroundColor: `${colors.error}10`,
  },
  actionButtonText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semiBold,
    color: colors.text.primary,
    marginLeft: Spacing.xs,
  },
  setPrimaryButtonText: {
    color: colors.success,
  },
  removeButtonText: {
    color: colors.error,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing['5xl'],
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.interactive.hover,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    color: colors.text.primary,
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: Spacing['3xl'],
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    ...Shadows.md,
  },
  emptyButtonText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semiBold,
    color: colors.text.inverse,
    marginLeft: Spacing.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background.primary,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingTop: Spacing.xl,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing['3xl'],
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    color: colors.text.primary,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSubtitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    color: colors.text.secondary,
    marginBottom: Spacing.xl,
  },
  paymentTypesList: {
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  paymentTypeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.primary,
  },
  paymentTypeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.lg,
  },
  paymentTypeInfo: {
    flex: 1,
  },
  paymentTypeName: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.semiBold,
    color: colors.text.primary,
  },
  paymentTypeDescription: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: colors.text.secondary,
    marginTop: 2,
  },
  formSection: {
    gap: Spacing.lg,
  },
  inputContainer: {
    marginBottom: Spacing.lg,
  },
  inputLabel: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semiBold,
    color: colors.text.primary,
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: colors.background.secondary,
    borderColor: colors.border.primary,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.regular,
    color: colors.text.primary,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderColor: colors.border.primary,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
  },
  inputIcon: {
    marginLeft: Spacing.lg,
  },
  inputWithIconField: {
    flex: 1,
    padding: Spacing.lg,
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.regular,
    color: colors.text.primary,
  },
  expiryRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  expiryInput: {
    flex: 1,
  },
  addPaymentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
    ...Shadows.button,
  },
  addPaymentButtonText: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.semiBold,
    color: colors.text.inverse,
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
});

export default function PaymentMethodsScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const colors = getColors(theme);
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);

  const [addPaymentModalVisible, setAddPaymentModalVisible] = useState(false);
  const [selectedPaymentType, setSelectedPaymentType] = useState<'card' | 'bank' | null>(null);
  const [newPaymentData, setNewPaymentData] = useState({
    cardNumber: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
    cardholderName: '',
    bankName: '',
    accountNumber: '',
    routingNumber: '',
    accountType: 'checking',
  });
  const [loading, setLoading] = useState(true);
  const offerings = listOfferings();
  let paymentMethodData: PaymentMethod[] = [];
  const { showAlert } = useGlobalAlert();
  useEffect(() => {
    loadPaymentMethods();
  }, []);

  const loadPaymentMethods = () => {
    setLoading(true);
    offerings.offerings().then(res => {
      setLoading(false);
      let i = 0;
      if (res.success && res.data) {
        paymentMethodData = res.data.data.investWidget.selected_offerings[0].details.paymentProviderList.map((p: any, index: number) => ({
          id: p.id,
          type: p.payment_provider_type,
          accountName: p.payment_account_name,
          accountNumber: p.payment_account_nr,
          bankName: p.payment_banking_name,

        }));
        setPaymentMethods(paymentMethodData)
      }
      else {
        console.log('Failed to fetch paymentMethods:', res.error);
      }
    });
  };

  const getPaymentIcon = (type: string) => {
    if (type === 'CUSTOMIBAN') {
      return <Building2 size={24} color={colors.info} />;
    }
    return <CreditCard size={24} color={colors.primary} />;
  };

  const getPaymentTypeColor = (type: string) => {
    return type === 'bank' ? colors.info : colors.primary;
  };

  const handleAddPayment = () => {
    if (!selectedPaymentType) return;

    if (selectedPaymentType === 'card') {
      if (!newPaymentData.cardNumber || !newPaymentData.expiryMonth || !newPaymentData.expiryYear || !newPaymentData.cvv || !newPaymentData.cardholderName) {
        showAlert(t('common.error'), t('auth.errors.fillAllFields'));
        return;
      }
    } else if (!newPaymentData.bankName || !newPaymentData.accountNumber || !newPaymentData.routingNumber) {
      showAlert(t('common.error'), t('auth.errors.fillAllFields'));
      return;
    }

    showAlert(t('common.success'), 'Payment method added successfully');
  };

  const renderPaymentMethod: ListRenderItem<PaymentMethod> = ({ item: payment }) => (
    <View style={styles.paymentCard}>
      <View style={styles.paymentHeader}>
        <View style={[styles.paymentIcon, { backgroundColor: `${getPaymentTypeColor(payment.type)}20` }]}>
          {getPaymentIcon(payment.type)}
        </View>
        <View style={styles.paymentInfo}>

          {/* <Text style={styles.paymentDetails}>
            {payment.type === 'card' 
              ? `•••• •••• •••• ${payment.last4}`
              : `${payment.accountType} •••• ${payment.last4}`
            }
          </Text> */}

          {payment.type.length > 0 && (
            <Text style={[styles.paymentExpiry, { color: colors.text.primary }]}>
              {payment.type}
            </Text>
          )}
          <View style={styles.paymentTitleRow}>
            <Text style={[styles.paymentName, { color: colors.text.primary }]}>
              {payment.bankName}
            </Text>
          </View>
          {payment.accountName !== '' && (
            <Text style={styles.paymentDetails}>
              {payment.accountName}
            </Text>
          )}

          <Text style={styles.paymentDetails}>
            {payment.accountNumber !== '' && (
              <Text style={styles.paymentExpiry}>
                {payment.accountNumber}
              </Text>
            )}
            {payment.expiryDate && (
              <Text style={styles.paymentExpiry}>
                Expires {payment.expiryDate}
              </Text>
            )}
          </Text>
        </View>
      </View>

      <View style={styles.paymentActions}>
        {/* <TouchableOpacity 
          style={[styles.actionButton, styles.removeButton]}
          onPress={() => removePayment(payment.id)}
        >
          <Trash2 size={16} color={colors.error} />
          <Text style={[styles.actionButtonText, styles.removeButtonText]}>Remove</Text>
        </TouchableOpacity> */}
      </View>
    </View>
  );

  const renderCardForm = () => (
    <View style={styles.formSection}>
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Cardholder Name</Text>
        <View style={styles.inputWithIcon}>
          <User size={20} color={colors.text.placeholder} style={styles.inputIcon} />
          <TextInput
            style={styles.inputWithIconField}
            value={newPaymentData.cardholderName}
            onChangeText={(text) => setNewPaymentData(prev => ({ ...prev, cardholderName: text }))}
            placeholder="John Doe"
            placeholderTextColor={colors.text.placeholder}
          />
        </View>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Card Number</Text>
        <View style={styles.inputWithIcon}>
          <CreditCard size={20} color={colors.text.placeholder} style={styles.inputIcon} />
          <TextInput
            style={styles.inputWithIconField}
            value={newPaymentData.cardNumber}
            onChangeText={(text) => setNewPaymentData(prev => ({ ...prev, cardNumber: text.replaceAll(/\s/g, '') }))}
            placeholder="1234 5678 9012 3456"
            placeholderTextColor={colors.text.placeholder}
            keyboardType="numeric"
            maxLength={16}
          />
        </View>
      </View>

      <View style={styles.expiryRow}>
        <View style={[styles.inputContainer, styles.expiryInput]}>
          <Text style={styles.inputLabel}>Expiry Month</Text>
          <TextInput
            style={styles.input}
            value={newPaymentData.expiryMonth}
            onChangeText={(text) => setNewPaymentData(prev => ({ ...prev, expiryMonth: text }))}
            placeholder="12"
            placeholderTextColor={colors.text.placeholder}
            keyboardType="numeric"
            maxLength={2}
          />
        </View>
        <View style={[styles.inputContainer, styles.expiryInput]}>
          <Text style={styles.inputLabel}>Expiry Year</Text>
          <TextInput
            style={styles.input}
            value={newPaymentData.expiryYear}
            onChangeText={(text) => setNewPaymentData(prev => ({ ...prev, expiryYear: text }))}
            placeholder="26"
            placeholderTextColor={colors.text.placeholder}
            keyboardType="numeric"
            maxLength={2}
          />
        </View>
        <View style={[styles.inputContainer, styles.expiryInput]}>
          <Text style={styles.inputLabel}>CVV</Text>
          <TextInput
            style={styles.input}
            value={newPaymentData.cvv}
            onChangeText={(text) => setNewPaymentData(prev => ({ ...prev, cvv: text }))}
            placeholder="123"
            placeholderTextColor={colors.text.placeholder}
            keyboardType="numeric"
            maxLength={4}
            secureTextEntry
          />
        </View>
      </View>
    </View>
  );

  const renderBankForm = () => (
    <View style={styles.formSection}>
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Bank Name</Text>
        <View style={styles.inputWithIcon}>
          <Building2 size={20} color={colors.text.placeholder} style={styles.inputIcon} />
          <TextInput
            style={styles.inputWithIconField}
            value={newPaymentData.bankName}
            onChangeText={(text) => setNewPaymentData(prev => ({ ...prev, bankName: text }))}
            placeholder="JPMorgan Chase"
            placeholderTextColor={colors.text.placeholder}
          />
        </View>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Account Number</Text>
        <TextInput
          style={styles.input}
          value={newPaymentData.accountNumber}
          onChangeText={(text) => setNewPaymentData(prev => ({ ...prev, accountNumber: text }))}
          placeholder="1234567890"
          placeholderTextColor={colors.text.placeholder}
          keyboardType="numeric"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Routing Number</Text>
        <TextInput
          style={styles.input}
          value={newPaymentData.routingNumber}
          onChangeText={(text) => setNewPaymentData(prev => ({ ...prev, routingNumber: text }))}
          placeholder="021000021"
          placeholderTextColor={colors.text.placeholder}
          keyboardType="numeric"
          maxLength={9}
        />
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background.secondary }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 44) + 16, backgroundColor: colors.background.primary, borderBottomColor: colors.border.primary }]}>
        <TouchableOpacity style={[styles.backButton, { backgroundColor: colors.background.secondary }]} onPress={() => router.back()}>
          <ArrowLeft size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: colors.text.primary }]}>Payment Methods</Text>
          <Text style={[styles.headerSubtitle, { color: colors.text.primary }]}>
            {paymentMethods.length} {paymentMethods.length === 1 ? 'method' : 'methods'} added
          </Text>
        </View>
        {/* <TouchableOpacity 
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={() => setAddPaymentModalVisible(true)}
        >
          <Plus size={24} color={colors.text.inverse} />
        </TouchableOpacity> */}
      </View>

      {/* Payment Methods List */}
      <FlatList
        data={paymentMethods}
        renderItem={renderPaymentMethod}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.paymentsList,
          { paddingBottom: insets.bottom + 20 }
        ]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          loading ? null : (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <CreditCard size={32} color={colors.text.tertiary} />
              </View>
              <Text style={styles.emptyTitle}>No Payment Methods</Text>
              <Text style={styles.emptySubtitle}>
                Add your first payment method to start investing in real estate projects
              </Text>
              {/* <TouchableOpacity 
              style={styles.emptyButton}
              onPress={() => setAddPaymentModalVisible(true)}
            >
              <Plus size={20} color={colors.text.inverse} />
              <Text style={styles.emptyButtonText}>Add Payment Method</Text>
            </TouchableOpacity> */}
            </View>
          )
        }
      />

      {/* Add Payment Method Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={addPaymentModalVisible}
        onRequestClose={() => setAddPaymentModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Payment Method</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => {
                  setAddPaymentModalVisible(false);
                  setSelectedPaymentType(null);
                }}
              >
                <X size={24} color={colors.text.secondary} />
              </TouchableOpacity>
            </View>
            <ScrollView
              style={{ flexGrow: 1 }}
              contentContainerStyle={{ paddingBottom: 40 }}
              showsVerticalScrollIndicator={false}
            >

              {renderBankForm()}


              {selectedPaymentType ? (
                <>
                  <Text style={styles.modalSubtitle}>
                    {selectedPaymentType === 'card' ? 'Add Credit/Debit Card' : 'Add Bank Account'}
                  </Text>

                  {selectedPaymentType === 'card' ? renderCardForm() : renderBankForm()}

                  <TouchableOpacity
                    style={styles.addPaymentButton}
                    onPress={handleAddPayment}
                  >
                    <Plus size={20} color={colors.text.inverse} />
                    <Text style={styles.addPaymentButtonText}>Add Payment Method</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Text style={styles.modalSubtitle}>Choose a payment method type</Text>
                  <View style={styles.paymentTypesList}>
                    <TouchableOpacity
                      style={styles.paymentTypeOption}
                      onPress={() => setSelectedPaymentType('card')}
                    >
                      <View style={[styles.paymentTypeIcon, { backgroundColor: `${colors.primary}20` }]}>
                        <CreditCard size={24} color={colors.primary} />
                      </View>
                      <View style={styles.paymentTypeInfo}>
                        <Text style={styles.paymentTypeName}>Credit/Debit Card</Text>
                        <Text style={styles.paymentTypeDescription}>Add a Visa, Mastercard, or other card</Text>
                      </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.paymentTypeOption}
                      onPress={() => setSelectedPaymentType('bank')}
                    >
                      <View style={[styles.paymentTypeIcon, { backgroundColor: `${colors.info}20` }]}>
                        <Building2 size={24} color={colors.info} />
                      </View>
                      <View style={styles.paymentTypeInfo}>
                        <Text style={styles.paymentTypeName}>Bank Account</Text>
                        <Text style={styles.paymentTypeDescription}>Connect your checking or savings account</Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}
    </View>
  );
}