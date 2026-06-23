import AsyncStorage from '@react-native-async-storage/async-storage';
import { persistPlatformKeyProviderFromValidateResponse } from '@/constants/platformKeyProvider';
import { persistPlatformSignInOptionsFromValidateResponse } from '@/constants/platformSignInOptions';

type ValidatePlatformPayload = {
  data: {
    data: {
      tenant_id: string;
      selected_offerings: { id: string }[];
      key_provider?: string | null;
      sign_in_options?: {
        google?: boolean;
        facebook?: boolean;
        linkedIn?: boolean;
        wallet?: boolean;
      };
    };
  };
};

/** Persist tenant, offering, sign-in options, and key_provider from `/validate-platform`. */
export async function persistPlatformValidateResponse(
  data: ValidatePlatformPayload,
): Promise<void> {
  await AsyncStorage.setItem(
    'offeringID',
    data.data.data.selected_offerings[0].id,
  );
  await AsyncStorage.setItem('tenantID', data.data.data.tenant_id);
  await persistPlatformSignInOptionsFromValidateResponse(data);
  await persistPlatformKeyProviderFromValidateResponse(data);
}
