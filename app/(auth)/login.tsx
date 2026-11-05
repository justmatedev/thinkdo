import { Link, type Href } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { AuthScreenShell } from "@/features/auth/components/AuthScreenShell";
import { AuthTextField } from "@/features/auth/components/AuthTextField";
import { GoogleGlyph } from "@/features/auth/components/GoogleGlyph";
import { PasswordResetModal } from "@/features/auth/components/PasswordResetModal";
import { PrimaryButton } from "@/features/auth/components/PrimaryButton";
import { useAuth } from "@/features/auth/AuthProvider";
import {
  getAuthErrorMessage,
  getPasswordResetErrorMessage,
} from "@/features/auth/authErrors";
import {
  validatePasswordReset,
  validateSignIn,
} from "@/features/auth/emailAuthValidation";
import { getAuthPalette } from "@/features/auth/authPalette";
import { font, fontSize, radius, spacing, touchTarget } from "@/lib/theme";
import { useTheme } from "@/lib/themeContext";

export default function LoginScreen() {
  const { colors, themeName } = useTheme();
  const { signInWithEmail, signInWithGoogle, sendPasswordReset } = useAuth();
  const palette = getAuthPalette(colors, themeName);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState<"email" | "google" | null>(null);
  const [resetVisible, setResetVisible] = useState(false);
  const googleInFlight = useRef(false);

  const handleEmailSignIn = async () => {
    const nextErrors = validateSignIn({ email, password });
    setErrors(nextErrors);
    if (nextErrors.email || nextErrors.password) return;
    setBusy("email");
    setFormError(null);
    try {
      await signInWithEmail(email, password);
    } catch (err) {
      setFormError(getAuthErrorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  const handleGoogleSignIn = async () => {
    if (googleInFlight.current || busy !== null) return;
    googleInFlight.current = true;
    setFormError(null);
    try {
      // Busy only after the native account picker succeeds — cancel stays silent.
      await signInWithGoogle(() => setBusy("google"));
    } catch (err) {
      console.error("[login] Google sign-in failed:", err);
      setFormError(getAuthErrorMessage(err));
    } finally {
      setBusy(null);
      googleInFlight.current = false;
    }
  };

  const anyBusy = busy !== null;

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <AuthScreenShell
        heroBackground={palette.heroBackground}
        logoColor={palette.logo}
        taglineColor={palette.tagline}
        taglineOpacity={palette.taglineOpacity}
        dockBackground={palette.dockBackground}
      >
        <AuthTextField
          label="Email"
          value={email}
          onChangeText={setEmail}
          palette={palette}
          error={errors.email}
          keyboardType="email-address"
          textContentType="emailAddress"
          autoComplete="email"
          returnKeyType="next"
        />
        <AuthTextField
          label="Senha"
          value={password}
          onChangeText={setPassword}
          palette={palette}
          error={errors.password}
          secureTextEntry
          textContentType="password"
          autoComplete="password"
          returnKeyType="done"
          onSubmitEditing={handleEmailSignIn}
        />

        <PrimaryButton
          label="Entrar"
          busyLabel="Entrando…"
          busy={busy === "email"}
          disabled={anyBusy && busy !== "email"}
          onPress={handleEmailSignIn}
          palette={palette}
          style={styles.primaryCta}
        />

        <Pressable
          accessibilityRole="button"
          hitSlop={spacing.md}
          onPress={() => setResetVisible(true)}
          style={styles.linkRow}
        >
          <Text style={[styles.link, { color: palette.link }]}>
            Esqueci minha senha
          </Text>
        </Pressable>

        <View style={styles.dividerRow}>
          <View style={[styles.dividerLine, { backgroundColor: palette.divider }]} />
          <Text style={[styles.dividerText, { color: palette.dividerText }]}>
            ou
          </Text>
          <View style={[styles.dividerLine, { backgroundColor: palette.divider }]} />
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Entrar com Google"
          accessibilityState={{ disabled: anyBusy, busy: busy === "google" }}
          disabled={anyBusy}
          onPress={handleGoogleSignIn}
          style={({ pressed }) => [
            styles.google,
            {
              backgroundColor: pressed
                ? palette.googlePressed
                : palette.googleBackground,
              borderColor: palette.googleBorder,
              opacity: anyBusy ? 0.65 : 1,
            },
          ]}
        >
          <View style={styles.googleIcon}>
            <GoogleGlyph />
          </View>
          <Text style={[styles.googleLabel, { color: palette.googleText }]}>
            {busy === "google" ? "Entrando…" : "Entrar com Google"}
          </Text>
        </Pressable>

        {formError ? (
          <Text
            accessibilityRole="alert"
            style={[styles.error, { color: palette.fieldError }]}
          >
            {formError}
          </Text>
        ) : null}

        <Link href={"/signup" as Href} asChild>
          <Pressable
            accessibilityRole="button"
            hitSlop={spacing.md}
            style={styles.linkRow}
          >
            <Text style={[styles.link, { color: palette.link }]}>
              Criar conta
            </Text>
          </Pressable>
        </Link>
      </AuthScreenShell>

      <PasswordResetModal
        visible={resetVisible}
        palette={palette}
        initialEmail={email}
        onClose={() => setResetVisible(false)}
        onSubmit={sendPasswordReset}
        validateEmail={(value) => validatePasswordReset({ email: value }).email}
        mapError={getPasswordResetErrorMessage}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  primaryCta: {
    marginTop: spacing.sm,
  },
  linkRow: {
    alignSelf: "center",
    paddingVertical: spacing.xs,
    alignItems: "center",
    justifyContent: "center",
  },
  link: {
    fontFamily: font.medium,
    fontSize: fontSize.meta,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  dividerText: {
    fontFamily: font.regular,
    fontSize: fontSize.meta,
  },
  google: {
    alignSelf: "stretch",
    minHeight: touchTarget,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  googleIcon: {
    height: 18,
    width: 18,
    alignItems: "center",
    justifyContent: "center",
    // Optical nudge: SVG box sits slightly low vs Poppins metrics
    transform: [{ translateY: -1 }],
  },
  googleLabel: {
    fontFamily: font.medium,
    fontSize: fontSize.body,
    lineHeight: 18,
    includeFontPadding: false,
  },
  error: {
    fontFamily: font.regular,
    fontSize: fontSize.meta,
    textAlign: "center",
  },
});
