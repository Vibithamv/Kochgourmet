import { platformValidation } from '@/hooks/platformValidation';
import { persistPlatformKeyProviderFromValidateResponse } from '@/constants/platformKeyProvider';
import {
  persistPlatformMagicFromValidateResponse,
  persistPlatformSignInOptionsFromValidateResponse,
} from '@/constants/platformSignInOptions';

/** Re-fetch `/validate-platform` and refresh persisted tenant + Magic config. */
export async function refreshPlatformValidateConfigFromRemote(): Promise<void> {
  const platform = platformValidation();
  const result = await platform.validatePlatform();
  if (!result.success || !result.data) {
    return;
  }
  await persistPlatformSignInOptionsFromValidateResponse(result.data);
  await persistPlatformKeyProviderFromValidateResponse(result.data);
  await persistPlatformMagicFromValidateResponse(result.data);
}
