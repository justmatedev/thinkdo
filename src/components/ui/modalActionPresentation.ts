import type { ThemeColors } from "@/lib/theme";

export type ModalActionVariant = "default" | "danger";

export function getConfirmButtonColors(
  variant: ModalActionVariant,
  colors: ThemeColors
): { background: string; pressed: string; text: string } {
  if (variant === "danger") {
    return {
      background: colors.danger,
      pressed: colors.danger,
      text: colors.textInverse,
    };
  }
  return {
    background: colors.action,
    pressed: colors.actionPressed,
    text: colors.textInverse,
  };
}
