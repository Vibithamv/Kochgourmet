import { useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { listOfferings } from '@/hooks/listOfferings';

export const useOfferingCheck = () => {
  const offeringsHook = listOfferings();

  const performOfferingCheck = useCallback(async () => {
    try {
      const res = await offeringsHook.offerings();
      if (res.success && res.data) {
        if (res.data.data.investWidget.selected_offerings.length > 0) {
          const activeOffering = res.data.data.investWidget.selected_offerings[0];
          await AsyncStorage.setItem('offeringID', activeOffering.id);
        }
        return true;
      }
      console.error('Failed to fetch offerings in hook:', res.error);
      return false;
    } catch (error) {
      console.error('Error in performOfferingCheck:', error);
      return false;
    }
  }, [offeringsHook]);

  return { performOfferingCheck };
};
