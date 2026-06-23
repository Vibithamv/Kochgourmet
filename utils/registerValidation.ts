import {
  extractErrorRecord,
  extractHydraViolations,
  type HydraViolation,
  messageFromApiError,
  readHydraErrorCode,
} from '@/utils/apiErrorMessage';
import { isPasswordRequirementsError } from '@/utils/passwordValidation';

export type RegisterFieldErrors = Record<string, string>;

export type RegisterFormValues = {
  firstName: string;
  lastName: string;
  displayName: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
  acceptPrivacy: boolean;
};

/** 409 — email already registered. */
export const REGISTER_EMAIL_IN_USE_HYDRA_CODE = 1748500040;

type RegisterFieldKey =
  | 'firstName'
  | 'lastName'
  | 'displayName'
  | 'email'
  | 'pwField'
  | 'acceptTerms'
  | 'acceptPrivacy';

const PROPERTY_PATH_FIELD: Record<string, RegisterFieldKey> = {
  displayName: 'displayName',
  email: 'email',
  password: 'pwField',
  firstName: 'firstName',
  lastName: 'lastName',
  acceptTerms: 'acceptTerms',
  acceptPrivacy: 'acceptPrivacy',
};

const PROPERTY_PATH_DEFAULT_I18N: Record<RegisterFieldKey, string> = {
  firstName: 'auth.register.enterFirstName',
  lastName: 'auth.register.enterLastName',
  displayName: 'auth.register.enterDisplayName',
  email: 'auth.register.enterValidEmail',
  pwField: 'auth.register.enterPassword',
  acceptTerms: 'auth.register.acceptTermsRequired',
  acceptPrivacy: 'auth.register.acceptPrivacyRequired',
};

const VIOLATION_MESSAGE_I18N: Record<string, string> = {
  'Display name is already taken': 'auth.register.displayNameTaken',
  'This value should not be blank.': 'auth.register.fieldRequired',
  'This value should not be null.': 'auth.register.fieldRequired',
  'This value is not a valid email address.': 'auth.register.enterValidEmail',
  'This value is too short. It should have 8 characters or more.':
    'auth.register.passwordReqMinLength',
  'Password does not meet requirements': 'auth.register.passwordRequirementsIntro',
};

function validateEmailFormat(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function mapPropertyPathToField(propertyPath?: string): RegisterFieldKey | undefined {
  if (!propertyPath) return undefined;
  return PROPERTY_PATH_FIELD[propertyPath];
}

function mapViolationMessageToI18n(
  violation: HydraViolation,
  password: string,
): string | undefined {
  const message = violation.message?.trim();
  if (message && VIOLATION_MESSAGE_I18N[message]) {
    return VIOLATION_MESSAGE_I18N[message];
  }

  const lower = (message ?? '').toLowerCase();
  if (lower.includes('display name') && (lower.includes('taken') || lower.includes('unique'))) {
    return 'auth.register.displayNameTaken';
  }
  if (
    lower.includes('email') &&
    (lower.includes('already') || lower.includes('in use') || lower.includes('exists'))
  ) {
    return 'auth.register.userAlreadyExists';
  }
  if (lower.includes('must not contain') && lower.includes('space')) {
    return 'auth.register.displayNameNoSpaces';
  }
  if (lower.includes('password')) {
    if (isPasswordRequirementsError(message)) {
      return getRegisterPasswordErrorKey(password) ?? 'auth.register.passwordRequirementsIntro';
    }
    if (lower.includes('uppercase')) return 'auth.register.passwordReqUppercase';
    if (lower.includes('digit') || lower.includes('number')) return 'auth.register.passwordReqNumber';
    if (lower.includes('special')) return 'auth.register.passwordReqSpecialChar';
    if (lower.includes('8 character') || lower.includes('too short')) {
      return 'auth.register.passwordReqMinLength';
    }
  }
  if (lower.includes('terms')) return 'auth.register.acceptTermsRequired';
  if (lower.includes('privacy')) return 'auth.register.acceptPrivacyRequired';

  return undefined;
}

function mapViolationToFieldError(
  violation: HydraViolation,
  password: string,
): { field: RegisterFieldKey; i18nKey: string } | undefined {
  const field = mapPropertyPathToField(violation.propertyPath);
  if (!field) return undefined;

  const i18nKey =
    mapViolationMessageToI18n(violation, password) ?? PROPERTY_PATH_DEFAULT_I18N[field];
  return { field, i18nKey };
}

/** Web/mobile-app register password rules (min 8, digit, uppercase, special). */
export function getRegisterPasswordErrorKey(password: string): string | undefined {
  if (!password) return 'auth.register.enterPassword';
  if (password.length < 8) return 'auth.register.passwordReqMinLength';
  if (!/[A-Z]/.test(password)) return 'auth.register.passwordReqUppercase';
  if (!/\d/.test(password)) return 'auth.register.passwordReqNumber';
  if (!/[^A-Za-z0-9]/.test(password)) return 'auth.register.passwordReqSpecialChar';
  return undefined;
}

export function buildRegisterFieldErrors(values: RegisterFormValues): RegisterFieldErrors {
  const next: RegisterFieldErrors = {};

  if (!values.firstName.trim()) {
    next.firstName = 'auth.register.enterFirstName';
  }
  if (!values.lastName.trim()) {
    next.lastName = 'auth.register.enterLastName';
  }

  const displayName = values.displayName.trim();
  if (!displayName) {
    next.displayName = 'auth.register.enterDisplayName';
  } else if (/\s/.test(values.displayName)) {
    next.displayName = 'auth.register.displayNameNoSpaces';
  }

  const email = values.email.trim();
  if (!email) {
    next.email = 'auth.register.enterEmail';
  } else if (!validateEmailFormat(email)) {
    next.email = 'auth.register.enterValidEmail';
  }

  const passwordError = getRegisterPasswordErrorKey(values.password);
  if (passwordError) {
    next.pwField = passwordError;
  }

  if (values.confirmPassword && values.password !== values.confirmPassword) {
    next.cpwField = 'auth.register.passwordsDontMatch';
  }

  if (!values.acceptTerms) {
    next.acceptTerms = 'auth.register.acceptTermsRequired';
  }
  if (!values.acceptPrivacy) {
    next.acceptPrivacy = 'auth.register.acceptPrivacyRequired';
  }

  return next;
}

export function getRegisterApiFieldErrors(
  error: unknown,
  status: number | undefined,
  password: string,
): RegisterFieldErrors {
  const mapped: RegisterFieldErrors = {};
  const record = extractErrorRecord(error);
  const hydraCode = record ? readHydraErrorCode(record) : undefined;

  if (status === 409 && hydraCode === REGISTER_EMAIL_IN_USE_HYDRA_CODE) {
    mapped.email = 'auth.register.userAlreadyExists';
    return mapped;
  }

  const violations = extractHydraViolations(error);
  if (status === 400 && violations.length > 0) {
    for (const violation of violations) {
      const mappedViolation = mapViolationToFieldError(violation, password);
      if (!mappedViolation || mapped[mappedViolation.field]) continue;
      mapped[mappedViolation.field] = mappedViolation.i18nKey;
    }
    if (Object.keys(mapped).length > 0) return mapped;
  }

  const message = messageFromApiError(error, '');
  if (isPasswordRequirementsError(message)) {
    mapped.pwField =
      getRegisterPasswordErrorKey(password) ?? 'auth.register.passwordRequirementsIntro';
    return mapped;
  }

  return mapped;
}
