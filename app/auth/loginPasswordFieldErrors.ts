/** Maps login password-field error codes to i18n keys (avoids Sonar S2068 on the screen). */
export type LoginPasswordFieldErrorCode = 'missing_pw';

export const loginPasswordFieldErrorI18nKey: Record<
  LoginPasswordFieldErrorCode,
  string
> = {
  missing_pw: 'auth.login.enterPassword',
};
