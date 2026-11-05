import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { UserAvatar } from "@/components/brand/UserAvatar";
import { SettingsRow } from "@/components/settings/SettingsRow";
import { SettingsSection } from "@/components/settings/SettingsSection";
import { ThemeSegment } from "@/components/settings/ThemeSegment";
import { AppIcon } from "@/components/ui/AppIcon";
import { AppModal } from "@/components/ui/AppModal";
import { ModalActionRow } from "@/components/ui/ModalActionRow";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { getSignInMethodLabel } from "@/features/auth/accountPresentation";
import {
  getAccountDisplayName,
  getAvatarPresentation,
} from "@/features/auth/avatarPresentation";
import { useAuth } from "@/features/auth/AuthProvider";
import { getAppVersionLabel } from "@/lib/appVersion";
import { font, fontSize, iconSize, spacing, touchTarget } from "@/lib/theme";
import { useTheme } from "@/lib/themeContext";

export default function SettingsScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { colors, preference, setPreference } = useTheme();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState(false);
  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    setSignOutError(false);
    try { await signOut(); setConfirmOpen(false); }
    catch { setSignOutError(true); }
    finally { setSigningOut(false); }
  };

  const avatar = getAvatarPresentation({
    photoURL: user?.photoURL ?? null,
    displayName: user?.displayName ?? null,
    email: user?.email ?? null,
  });
  const accountName = getAccountDisplayName({
    displayName: user?.displayName ?? null,
    email: user?.email ?? null,
  });
  const signInMethodLabel = getSignInMethodLabel(user?.signInMethod ?? null);
  const appVersionLabel = getAppVersionLabel();

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScreenHeader title="Configurações" onBack={() => router.back()} />

      <View style={styles.body}>
        <SettingsSection title="Conta">
          <View style={styles.accountRow}>
            <UserAvatar
              uri={avatar.uri}
              initial={avatar.initial}
              size={56}
              accessibilityLabel="Avatar da conta"
            />
            <View style={styles.accountText}>
              <Text
                style={{
                  fontFamily: font.medium,
                  fontSize: fontSize.body,
                  color: colors.textPrimary,
                }}
                numberOfLines={1}
              >
                {accountName}
              </Text>
              {user?.email ? (
                <Text
                  style={{
                    fontFamily: font.regular,
                    fontSize: fontSize.meta,
                    color: colors.textSecondary,
                  }}
                  numberOfLines={1}
                >
                  {user.email}
                </Text>
              ) : null}
              {signInMethodLabel ? (
                <Text
                  style={{
                    fontFamily: font.regular,
                    fontSize: fontSize.meta,
                    color: colors.textSecondary,
                  }}
                  numberOfLines={1}
                >
                  {signInMethodLabel}
                </Text>
              ) : null}
            </View>
          </View>
        </SettingsSection>

        <SettingsSection title="Aparência" variant="inline">
          <ThemeSegment value={preference} onChange={setPreference} />
        </SettingsSection>

        <SettingsRow
          label="Sair"
          danger
          onPress={() => setConfirmOpen(true)}
          accessibilityLabel="Sair"
          trailing={
            <AppIcon name="logOut" size={iconSize.sm} color={colors.danger} />
          }
        />
      </View>

      <Text
        style={{
          fontFamily: font.regular,
          fontSize: fontSize.meta,
          color: colors.textSecondary,
          textAlign: "center",
        }}
        accessibilityRole="text"
      >
        {appVersionLabel}
      </Text>

      <AppModal
        visible={confirmOpen}
        title="Sair da conta?"
        onClose={() => { if (!signingOut) setConfirmOpen(false); }}
        actions={
          <ModalActionRow
            confirmLabel="Sair"
            variant="danger"
            busy={signingOut}
            onCancel={() => setConfirmOpen(false)}
            onConfirm={() => void handleSignOut()}
          />
        }
      >
        {signOutError ? <Text accessibilityRole="alert" style={{ color: colors.danger }}>Não foi possível sair. Tente novamente.</Text> : null}
      </AppModal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: spacing.md, gap: spacing.md },
  body: { flex: 1, gap: spacing.lg },
  accountRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    minHeight: touchTarget,
  },
  accountText: { flex: 1, gap: spacing.xs },
});
