export type SignInErrors = { email?: string; password?: string };
export type SignUpErrors = {
  name?: string;
  email?: string;
  password?: string;
  confirm?: string;
};
export type PasswordResetErrors = { email?: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD = 6;

const MSG = {
  nameEmpty: "Digite seu nome.",
  emailInvalid: "Digite um email válido.",
  passwordEmpty: "Digite sua senha.",
  passwordShort: "Use uma senha com pelo menos 6 caracteres.",
  confirmMismatch: "As senhas não coincidem.",
} as const;

function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email.trim());
}

export function validateSignIn(input: {
  email: string;
  password: string;
}): SignInErrors {
  const errors: SignInErrors = {};
  if (!isValidEmail(input.email)) errors.email = MSG.emailInvalid;
  if (input.password.length === 0) errors.password = MSG.passwordEmpty;
  return errors;
}

export function validateSignUp(input: {
  name: string;
  email: string;
  password: string;
  confirm: string;
}): SignUpErrors {
  const errors: SignUpErrors = {};
  if (input.name.trim().length === 0) errors.name = MSG.nameEmpty;
  if (!isValidEmail(input.email)) errors.email = MSG.emailInvalid;
  if (input.password.length < MIN_PASSWORD) errors.password = MSG.passwordShort;
  if (input.confirm !== input.password) errors.confirm = MSG.confirmMismatch;
  return errors;
}

export function validatePasswordReset(input: {
  email: string;
}): PasswordResetErrors {
  const errors: PasswordResetErrors = {};
  if (!isValidEmail(input.email)) errors.email = MSG.emailInvalid;
  return errors;
}
