import { AppModal } from "@/components/ui/AppModal";
import { ModalActionRow } from "@/components/ui/ModalActionRow";

type Props = {
  visible: boolean;
  title: string;
  busy: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
};

export function DeleteItemsDialog({
  visible,
  title,
  busy,
  onClose,
  onConfirm,
}: Props) {
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
    />
  );
}
