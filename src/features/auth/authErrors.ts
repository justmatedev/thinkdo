const FALLBACK = "Não foi possível concluir. Tente de novo.";

const MESSAGES: Record<string, string> = {
  "auth/invalid-credential": "Email ou senha incorretos.",
  "auth/wrong-password": "Email ou senha incorretos.",
  "auth/user-not-found": "Email ou senha incorretos.",
  "auth/email-already-in-use": "Já existe uma conta com este email.",
  "auth/weak-password": "Use uma senha com pelo menos 6 caracteres.",
  "auth/invalid-email": "Digite um email válido.",
  "auth/too-many-requests": "Muitas tentativas. Tente mais tarde.",
  "auth/network-request-failed": "Sem conexão. Verifique a internet.",
};

const PASSWORD_RESET_MESSAGES: Record<string, string> = {
  "auth/invalid-email": "Digite um email válido.",
  "auth/too-many-requests": "Muitas tentativas. Tente mais tarde.",
  "auth/network-request-failed": "Sem conexão. Verifique a internet.",
  "auth/user-not-found": FALLBACK,
  "auth/invalid-credential": FALLBACK,
};

function getErrorCode(error: unknown): string | undefined {
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? (error as { code?: unknown }).code
      : undefined;
  return typeof code === "string" ? code : undefined;
}

export function getAuthErrorMessage(error: unknown): string {
  const code = getErrorCode(error);
  if (code && code in MESSAGES) return MESSAGES[code];
  return FALLBACK;
}

export function getPasswordResetErrorMessage(error: unknown): string {
  const code = getErrorCode(error);
  if (code && code in PASSWORD_RESET_MESSAGES) {
    return PASSWORD_RESET_MESSAGES[code];
  }
  return FALLBACK;
}
