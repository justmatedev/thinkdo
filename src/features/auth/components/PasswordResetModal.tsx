import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { AppModal } from "@/components/ui/AppModal";
import { font, fontSize, spacing, touchTarget } from "@/lib/theme";
import { useTheme } from "@/lib/themeContext";
import { AuthTextField } from "@/features/auth/components/AuthTextField";
import type { AuthPalette } from "@/features/auth/authPalette";
import { PrimaryButton } from "@/features/auth/components/PrimaryButton";

type PasswordResetModalProps = {
  visible: boolean;
  palette: AuthPalette;
  initialEmail?: string;
  onClose: () => void;
  onSubmit: (email: string) => Promise<void>;
  validateEmail: (email: string) => string | undefined;
  mapError: (error: unknown) => string;
};

export function PasswordResetModal({
  visible,
  onClose,
  palette,
  initialEmail = "",
  onSubmit,
  validateEmail,
  mapError,
}: PasswordResetModalProps) {
  if (!visible) {
    return (
      <AppModal
        visible={false}
        title="Redefinir senha"
        onClose={onClose}
        actions={<View />}
      />
    );
  }

  return (
    <PasswordResetModalSession
      key={initialEmail}
      onClose={onClose}
      palette={palette}
      initialEmail={initialEmail}
      onSubmit={onSubmit}
      validateEmail={validateEmail}
      mapError={mapError}
    />
  );
}

function PasswordResetModalSession({
  onClose,
  palette,
  initialEmail = "",
  onSubmit,
  validateEmail,
  mapError,
}: Omit<PasswordResetModalProps, "visible">) {
  const { colors } = useTheme();
  const [email, setEmail] = useState(initialEmail);
  const [fieldError, setFieldError] = useState<string | undefined>(undefined);
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [busy, setBusy] = useState(false);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const handleSubmit = async () => {
    const nextError = validateEmail(email);
    setFieldError(nextError);
    if (nextError) return;
    setBusy(true);
    setFormError(null);
    try {
      await onSubmit(email.trim());
      if (!isMounted.current) return;
      setSuccess(true);
    } catch (err) {
      if (!isMounted.current) return;
      setFormError(mapError(err));
    } finally {
      if (isMounted.current) {
        setBusy(false);
      }
    }
  };

  return (
    <AppModal
      visible
      title="Redefinir senha"
      onClose={onClose}
      actions={
        <>
          {success ? (
            <PrimaryButton
              label="Fechar"
              busyLabel="Fechar"
              busy={false}
              onPress={onClose}
              palette={palette}
            />
          ) : (
            <PrimaryButton
              label="Enviar link"
              busyLabel="Enviando…"
              busy={busy}
              onPress={handleSubmit}
              palette={palette}
            />
          )}
          <Pressable
            accessibilityRole="button"
            hitSlop={spacing.sm}
            onPress={onClose}
            style={styles.cancel}
          >
            <Text style={[styles.cancelText, { color: palette.link }]}>
              {success ? "Voltar" : "Cancelar"}
            </Text>
          </Pressable>
        </>
      }
    >
      {success ? (
        <Text style={[styles.success, { color: colors.success }]}>
          Enviamos um link para redefinir sua senha.
        </Text>
      ) : (
        <AuthTextField
          label="Email"
          value={email}
          onChangeText={setEmail}
          palette={palette}
          error={fieldError}
          keyboardType="email-address"
          textContentType="emailAddress"
          autoComplete="email"
          returnKeyType="done"
          onSubmitEditing={handleSubmit}
        />
      )}
      {formError ? (
        <Text
          accessibilityRole="alert"
          style={[styles.error, { color: palette.fieldError }]}
        >
          {formError}
        </Text>
      ) : null}
    </AppModal>
  );
}

const styles = StyleSheet.create({
  success: {
    fontFamily: font.regular,
    fontSize: fontSize.body,
  },
  error: {
    fontFamily: font.regular,
    fontSize: fontSize.meta,
  },
  cancel: {
    minHeight: touchTarget,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelText: {
    fontFamily: font.medium,
    fontSize: fontSize.meta,
  },
});
