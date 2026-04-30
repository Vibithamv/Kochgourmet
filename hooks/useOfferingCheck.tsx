import { useCallback } from 'react';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { listOfferings } from '@/hooks/listOfferings';
import { whitelistManagement } from '@/hooks/whitelistManagement';
import { useGlobalAlert } from '@/contexts/AlertContext';
import { useTranslation } from 'react-i18next';

export const useOfferingCheck = () => {
    const router = useRouter();
    const offeringsHook = listOfferings();
    const whitelistHook = whitelistManagement();
    const { showAlert } = useGlobalAlert();
    const { t } = useTranslation();

    const checkStatus = useCallback(async () => {
        try {
            const offeringID = (await AsyncStorage.getItem('offeringID')) ?? '';
            const accountID = (await AsyncStorage.getItem('AccountID')) ?? '';

            if (!offeringID || !accountID) return 'REQUEST';

            const result = await whitelistHook.checkWhitelistStatus(accountID, offeringID);
            if (result.success && result.data) {
                if (result.data.data.whitelistRequestData && result.data.data.whitelistRequestData.length > 0) {
                    if (result.data.data.whitelistRequestData[0].status === 'APPROVED') {
                        return 'APPROVED';
                    } else {
                        return 'PENDING';
                    }
                } else {
                    return 'REQUEST';
                }
            } else {
                // Only show alert if it's not a 401 (which is handled by global logic)
                if (result.status !== 401) {
                    showAlert(t('common.error'), result.error?.message || t('common.tryAgain'));
                }
                return 'ERROR';
            }
        } catch (error) {
            console.error('Error in checkStatus:', error);
            return 'ERROR';
        }
    }, [whitelistHook, showAlert, t]);

    const performOfferingCheck = useCallback(async () => {
        try {
            const res = await offeringsHook.offerings();
            if (res.success && res.data) {
                if (res.data.data.investWidget.selected_offerings.length > 0) {
                    const activeOffering = res.data.data.investWidget.selected_offerings[0];
                    await AsyncStorage.setItem('offeringID', activeOffering.id);
                    if (activeOffering.details.visibility_status === 'privatesale' || activeOffering.details.visibility_status === 'whitelisting') {
                        const status = await checkStatus();
                        if (status === 'PENDING') {
                            router.replace('/screens/whitelistResponseWaiting');
                            return false;
                        } else if (status === 'REQUEST') {
                            router.replace('/auth/whitelistRequest');
                            return false;
                        }
                    }
                }
                return true;
            } else {
                console.error('Failed to fetch offerings in hook:', res.error);
                return false;
            }
        } catch (error) {
            console.error('Error in performOfferingCheck:', error);
            return false;
        }
    }, [offeringsHook, checkStatus, router]);

    return { performOfferingCheck };
};
