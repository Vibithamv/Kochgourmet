import type { TFunction } from 'i18next';

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 20;

export type PasswordRequirementCode =
  | 'minLength'
  | 'maxLength'
  | 'uppercase'
  | 'lowercase'
  | 'number'
  | 'specialChar'
  | 'noSpaces';

const PASSWORD_REQUIREMENT_I18N: Record<PasswordRequirementCode, string> = {
  minLength: 'auth.register.passwordReqMinLength',
  maxLength: 'auth.register.passwordReqMaxLength',
  uppercase: 'auth.register.passwordReqUppercase',
  lowercase: 'auth.register.passwordReqLowercase',
  number: 'auth.register.passwordReqNumber',
  specialChar: 'auth.register.passwordReqSpecialChar',
  noSpaces: 'auth.register.passwordReqNoSpaces',
};

export const PASSWORD_REQUIREMENTS_ERROR_MESSAGE = 'Password does not meet requirements';

export function getUnmetPasswordRequirementCodes(password: string): PasswordRequirementCode[] {
  const unmet: PasswordRequirementCode[] = [];
  if (password.length < PASSWORD_MIN_LENGTH) unmet.push('minLength');
  if (password.length > PASSWORD_MAX_LENGTH) unmet.push('maxLength');
  if (!/[a-z]/.test(password)) unmet.push('lowercase');
  if (!/[A-Z]/.test(password)) unmet.push('uppercase');
  if (!/\d/.test(password)) unmet.push('number');
  if (!/[^A-Za-z\d]/.test(password)) unmet.push('specialChar');
  if (/\s/.test(password)) unmet.push('noSpaces');
  return unmet;
}

export function isPasswordRequirementsMet(password: string): boolean {
  return getUnmetPasswordRequirementCodes(password).length === 0;
}

export function isPasswordRequirementsError(message: string | undefined | null): boolean {
  return message === PASSWORD_REQUIREMENTS_ERROR_MESSAGE;
}

export function formatPasswordRequirementsAlertMessage(
  codes: readonly PasswordRequirementCode[],
  t: TFunction
): string {
  const intro = t('auth.register.passwordRequirementsIntro');
  const bullets = codes.map((code) => `• ${t(PASSWORD_REQUIREMENT_I18N[code])}`).join('\n');
  return `${intro}\n\n${bullets}`;
}
