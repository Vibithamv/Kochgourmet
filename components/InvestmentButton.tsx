import React, { useState } from 'react';
import {
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator
} from 'react-native';
import { DollarSign, Users, Lock, Clock } from 'lucide-react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { useGlobalAlert } from '@/contexts/AlertContext';

type ProjectStatus = 'PRIVATESALE' | 'PRESALE' | 'WHITELISTING' | 'ANNOUNCEMENT' | 'PRESALEANNOUNCEMENT' | 'PUBLIC' | 'FINISHED' | 'draft';

interface ExtendedProject {
  id: string;
  title: string;
  description: string;
  location: string;
  target_amount: number;
  raised_amount: number;
  minimum_investment: number;
  expected_return: number;
  duration_months: number;
  image_url: string;
  status: ProjectStatus;
  created_at: string;
  tenant_id: string;
  announcement_date?: string;
  presale_start_date?: string;
  is_whitelisted?: boolean;
}

interface InvestmentButtonProps {
  project: ExtendedProject;
}

export default function InvestmentButton({
  project,
}: Readonly<InvestmentButtonProps>) {
  const { t } = useTranslation();
  const [isWhitelisting, setIsWhitelisting] = useState(false);
  const [isWhitelisted, setIsWhitelisted] = useState(project.is_whitelisted || false);
  const { showAlert } = useGlobalAlert();
  const handleButtonPress = async () => {
    switch (project.status) {
      case 'WHITELISTING':
        handleWhitelistRequest();
        break;
      case 'PRIVATESALE':
        if (isWhitelisted) {
          router.push(`/investment/${project.id}`);
        } else {
          await handleWhitelistRequest();
        }
        break;
      case 'PUBLIC':
      case 'PRESALE':
        router.push(`/investment/${project.id}`);
        break;
      default:
        showAlert(t('investment.notAvailable'), t('investment.investmentNotAvailable'));
    }
  };

  const handleWhitelistRequest = async () => {
    setIsWhitelisting(true);

    // Mock 2-second whitelist process
    setTimeout(() => {
      setIsWhitelisted(true);
      setIsWhitelisting(false);
      showAlert(
        t('investment.whitelistSuccess'),
        t('investment.whitelistApproved'),
        {
          buttonText: t('dashboard.investNow'),
          buttonCallback: () =>
            router.push(`/investment/${project.id}`),
          secondaryButtonText: t('common.cancel'),
        }
      );
    }, 2000);
  };

  const getButtonText = () => {
    if (isWhitelisting) return t('investment.whitelisting');

    switch (project.status) {
      case 'WHITELISTING':
        return t('dashboard.registerForWhitelist');
      case 'PRIVATESALE':
        return isWhitelisted ? t('dashboard.investNow') : t('investment.requestWhitelist');
      case 'PUBLIC':
      case 'PRESALE':
        return t('dashboard.investNow');
      case 'ANNOUNCEMENT':
        return `${t('dashboard.startsOn')} ${new Date(project.announcement_date!).toLocaleDateString()}`;
      case 'PRESALEANNOUNCEMENT':
        return t('dashboard.investNow');
      case 'FINISHED':
        return t('dashboard.investmentEnded');
      default:
        return t('projects.notAvailable');
    }
  };

  const getButtonIcon = () => {
    if (isWhitelisting) return null;

    switch (project.status) {
      case 'WHITELISTING':
        return <Users size={20} color="#FFFFFF" />;
      case 'PRIVATESALE':
        return isWhitelisted ? <DollarSign size={20} color="#FFFFFF" /> : <Lock size={20} color="#FFFFFF" />;
      case 'PUBLIC':
      case 'PRESALE':
        return <DollarSign size={20} color="#FFFFFF" />;
      default:
        return <Clock size={20} color="#FFFFFF" />;
    }
  };

  const isButtonDisabled = () => {
    return isWhitelisting ||
      project.status === 'FINISHED' ||
      project.status === 'ANNOUNCEMENT' ||
      (project.status === 'PRIVATESALE' && !isWhitelisted && !isWhitelisting);
  };

  const getButtonStyle = () => {
    if (isButtonDisabled()) {
      return [styles.investButton, styles.buttonDisabled];
    }

    switch (project.status) {
      case 'WHITELISTING':
        return [styles.investButton, styles.whitelistButton];
      case 'PRIVATESALE':
        return [styles.investButton, isWhitelisted ? styles.privateButton : styles.whitelistButton];
      case 'PUBLIC':
        return [styles.investButton, styles.publicButton];
      case 'PRESALE':
        return [styles.investButton, styles.presaleButton];
      default:
        return [styles.investButton, styles.buttonDisabled];
    }
  };

  return (
    <TouchableOpacity
      style={getButtonStyle()}
      onPress={handleButtonPress}
      disabled={isButtonDisabled()}
    >
      {isWhitelisting ? (
        <ActivityIndicator size="small" />
      ) : (
        getButtonIcon()
      )}
      <Text style={styles.investButtonText}>{getButtonText()}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  investButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    ...Shadows.button,
  },
  publicButton: {
    backgroundColor: Colors.primary,
  },
  presaleButton: {
    backgroundColor: '#F59E0B',
  },
  privateButton: {
    backgroundColor: '#8B5CF6',
  },
  whitelistButton: {
    backgroundColor: '#6B7280',
  },
  buttonDisabled: {
    backgroundColor: Colors.border.primary,
    shadowOpacity: 0,
  },
  investButtonText: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.text.inverse,
    marginLeft: Spacing.sm,
  },
});