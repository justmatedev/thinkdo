export type AuthSignInMethod = "google" | "password";

export type AuthUser = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  signInMethod: AuthSignInMethod | null;
};
