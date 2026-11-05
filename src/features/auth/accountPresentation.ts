import type { AuthSignInMethod } from "@/features/auth/types";

export function resolveSignInMethod(
  providerIds: readonly string[]
): AuthSignInMethod | null {
  if (providerIds.includes("google.com")) return "google";
  if (providerIds.includes("password")) return "password";
  return null;
}

export function getSignInMethodLabel(
  method: AuthSignInMethod | null
): string | null {
  if (method === "google") return "Entrou com Google";
  if (method === "password") return "Email e senha";
  return null;
}
