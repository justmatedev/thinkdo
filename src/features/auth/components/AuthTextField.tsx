import { useRef, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { AppIcon } from "@/components/ui/AppIcon";
import { font, fontSize, iconSize, radius, spacing, touchTarget } from "@/lib/theme";
import type { AuthPalette } from "@/features/auth/authPalette";
import { useAuthFieldScroll } from "@/features/auth/components/AuthScreenShell";

type AuthTextFieldProps = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  palette: AuthPalette;
  error?: string;
  secureTextEntry?: boolean;
  autoCapitalize?: "none" | "sentences" | "words";
  keyboardType?: "default" | "email-address";
  textContentType?:
    | "none"
    | "emailAddress"
    | "password"
    | "name"
    | "newPassword";
  autoComplete?: "off" | "email" | "password" | "name" | "password-new";
  returnKeyType?: "next" | "done";
  onSubmitEditing?: () => void;
};

export function AuthTextField({
  label,
  value,
  onChangeText,
  palette,
  error,
  secureTextEntry = false,
  autoCapitalize = "none",
  keyboardType = "default",
  textContentType = "none",
  autoComplete = "off",
  returnKeyType,
  onSubmitEditing,
}: AuthTextFieldProps) {
  const { scrollFieldIntoView } = useAuthFieldScroll();
  const wrapperRef = useRef<View>(null);
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(secureTextEntry);

  return (
    <View ref={wrapperRef} style={styles.wrapper}>
      <Text style={[styles.label, { color: palette.label }]}>{label}</Text>
      <View
        style={[
          styles.inputRow,
          {
            backgroundColor: palette.inputBackground,
            borderColor: error
              ? palette.fieldError
              : focused
                ? palette.inputFocusBorder
                : palette.inputBorder,
          },
        ]}
      >
        <TextInput
          style={[styles.input, { color: palette.inputText }]}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => {
            setFocused(true);
            scrollFieldIntoView(wrapperRef.current);
          }}
          onBlur={() => setFocused(false)}
          placeholderTextColor={palette.placeholder}
          secureTextEntry={hidden}
          autoCapitalize={autoCapitalize}
          keyboardType={keyboardType}
          textContentType={textContentType}
          autoComplete={autoComplete}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          autoCorrect={false}
        />
        {secureTextEntry ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={hidden ? "Mostrar senha" : "Ocultar senha"}
            hitSlop={spacing.sm}
            onPress={() => setHidden((prev) => !prev)}
            style={styles.toggle}
          >
            <AppIcon
              name={hidden ? "eye" : "eyeOff"}
              size={iconSize.lg}
              color={palette.link}
            />
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <Text
          accessibilityRole="alert"
          style={[styles.error, { color: palette.fieldError }]}
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignSelf: "stretch",
    gap: spacing.xs,
  },
  label: {
    fontFamily: font.medium,
    fontSize: fontSize.meta,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: touchTarget,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    fontFamily: font.regular,
    fontSize: fontSize.body,
    paddingVertical: spacing.sm,
  },
  toggle: {
    minWidth: touchTarget,
    minHeight: touchTarget,
    alignItems: "center",
    justifyContent: "center",
  },
  error: {
    fontFamily: font.regular,
    fontSize: fontSize.meta,
  },
});
