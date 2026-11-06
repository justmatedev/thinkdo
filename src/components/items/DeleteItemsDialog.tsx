import { Text } from "react-native";
import { useTheme } from "@/lib/themeContext";
import { AppModal } from "@/components/ui/AppModal";
import { ModalActionRow } from "@/components/ui/ModalActionRow";

type Props = {
  visible: boolean;
  title: string;
  busy: boolean;
  error?: string | null;
  onClose: () => void;
  onConfirm: () => Promise<void>;
};

export function DeleteItemsDialog({
  visible,
  title,
  busy,
  error,
  onClose,
  onConfirm,
}: Props) {
  const { colors } = useTheme();
  return (
    <AppModal
      visible={visible}
      title={title}
      onClose={onClose}
      actions={
        <ModalActionRow
          confirmLabel="Excluir"
          variant="danger"
          busy={busy}
          onCancel={onClose}
          onConfirm={() => {
            void onConfirm();
          }}
        />
      }
    >
      {error ? <Text accessibilityRole="alert" style={{ color: colors.danger }}>{error}</Text> : null}
    </AppModal>
  );
}
