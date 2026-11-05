import { onAuthStateChanged } from "firebase/auth";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { auth } from "@/lib/firebase";
import { resolveSignInMethod } from "@/features/auth/accountPresentation";
import {
  sendPasswordReset,
  signInWithEmail,
  signInWithGoogle,
  signOutUser,
  signUpWithEmail,
} from "@/features/auth/authService";
import { signOutSession } from "@/features/auth/signOutSession";
import { clearInboxSnapshot, readInboxSnapshot } from "@/widgets/snapshot";
import { beginInboxSession } from "@/widgets/snapshot/session";
import { refreshInboxWidgets } from "@/widgets/refreshWidgets";
import type { AuthUser } from "@/features/auth/types";

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  signInWithGoogle: (onAccountSelected?: () => void) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (input: {
    name: string;
    email: string;
    password: string;
  }) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  signInWithGoogle,
  signInWithEmail,
  signUpWithEmail,
  sendPasswordReset,
  signOut: signOutUser,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{
    user: AuthUser | null;
    loading: boolean;
  }>({ user: null, loading: true });

  useEffect(() => {
    let version = 0;
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      const current = ++version;
      const owner = firebaseUser?.uid ?? null;
      // Reject old account producers before any asynchronous cache work.
      beginInboxSession(owner);
      void (async () => {
        try {
          const snapshot = await readInboxSnapshot();
          if (current !== version) return;
          // Restoring the same account can open an editor directly, without
          // mounting the inbox that would otherwise rebuild this cache.
          if (!owner || snapshot.uid !== owner) {
            await clearInboxSnapshot();
            if (current !== version) return;
            beginInboxSession(owner);
          }
          await refreshInboxWidgets();
        } catch {
          // Ownership checks keep a failed cleanup from exposing another account.
        }
        if (current !== version) return;
        setState({
          loading: false,
          user: firebaseUser
            ? {
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                displayName: firebaseUser.displayName,
                photoURL: firebaseUser.photoURL,
                signInMethod: resolveSignInMethod(
                  firebaseUser.providerData.map(
                    (provider) => provider.providerId,
                  ),
                ),
              }
            : null,
        });
      })();
    });
    return () => {
      version++;
      unsubscribe();
    };
  }, []);

  const signOut = signOutSession;

  return (
    <AuthContext.Provider
      value={{
        ...state,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        sendPasswordReset,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}
