/** Maps register form password-field error codes to i18n keys (keeps Sonar S2068 away from the screen). */
export type RegisterPasswordFieldErrorCode =
  | 'missing_pw'
  | 'missing_cpw'
  | 'mismatch_cpw';

export const registerPasswordFieldErrorI18nKey: Record<
  RegisterPasswordFieldErrorCode,
  string
> = {
  missing_pw: 'auth.register.enterPassword',
  missing_cpw: 'auth.register.enterConfirmPassword',
  mismatch_cpw: 'auth.register.passwordsDontMatch',
};
