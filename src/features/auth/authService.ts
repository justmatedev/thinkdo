import {
  GoogleSignin,
  isSuccessResponse,
} from "@react-native-google-signin/google-signin";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signInWithCredential,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
});

export async function signInWithGoogle(
  onAccountSelected?: () => void
): Promise<void> {
  await GoogleSignin.hasPlayServices();
  const response = await GoogleSignin.signIn();
  // User dismissed the account picker — treat as a no-op, not an error.
  if (!isSuccessResponse(response)) return;
  const idToken = response.data.idToken;
  if (!idToken) throw new Error("Google sign-in did not return an idToken");
  onAccountSelected?.();
  const credential = GoogleAuthProvider.credential(idToken);
  await signInWithCredential(auth, credential);
}

export async function signInWithEmail(
  email: string,
  password: string
): Promise<void> {
  await signInWithEmailAndPassword(auth, email.trim(), password);
}

export async function signUpWithEmail(input: {
  name: string;
  email: string;
  password: string;
}): Promise<void> {
  const credential = await createUserWithEmailAndPassword(
    auth,
    input.email.trim(),
    input.password
  );
  await updateProfile(credential.user, { displayName: input.name.trim() });
}

export async function sendPasswordReset(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email.trim());
}

export async function signOutUser(): Promise<void> {
  await signOut(auth);
  try {
    await GoogleSignin.signOut();
  } catch {
    // Email/password sessions have no Google session to clear; ignore.
  }
}
