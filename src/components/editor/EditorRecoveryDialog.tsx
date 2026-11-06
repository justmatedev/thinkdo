import { useState } from 'react';
import { ScrollView, Text } from 'react-native';
import { AppModal } from '@/components/ui/AppModal';
import { ModalActionRow } from '@/components/ui/ModalActionRow';
import { useTheme } from '@/lib/themeContext';
import type { EditorDraft } from '@/features/editor/editorDrafts';

type Props = {
  draft: EditorDraft;
  missing: boolean;
  hasConflicts: boolean;
  storageError: boolean;
  onRecover: () => void;
  onDiscard: () => Promise<void>;
  onClose: () => void;
};

export function EditorRecoveryDialog({ draft, missing, hasConflicts, storageError, onRecover, onDiscard, onClose }: Props) {
  const { colors } = useTheme();
  const [busy, setBusy] = useState(false);
  const content = { ...draft.original, ...draft.patch };
  const text = [content.title, content.body].filter(Boolean).join('\n\n');
  const discard = async () => {
    if (busy) return;
    setBusy(true);
    try { await onDiscard(); } finally { setBusy(false); }
  };
  return (
    <AppModal visible title={missing ? 'Este item foi excluído' : 'Rascunho encontrado'}
      onClose={() => { if (!busy) onClose(); }}
      actions={<ModalActionRow cancelLabel="Descartar" confirmLabel={missing ? 'Voltar' : 'Recuperar'}
        busy={busy} onCancel={() => { void discard(); }} onConfirm={missing ? onClose : onRecover} />}>
      <Text style={{ color: colors.textPrimary }}>
        {missing ? 'O rascunho continua neste aparelho. Selecione o texto abaixo para copiar antes de descartar.'
          : hasConflicts ? 'Este item mudou desde a edição local. Recuperar vai substituir os campos alterados pelos valores do rascunho.'
          : 'Há alterações neste aparelho que ainda não foram enviadas. Deseja recuperá-las?'}
      </Text>
      {missing ? <ScrollView style={{ maxHeight: 240 }}><Text selectable style={{ color: colors.textPrimary }}>{text}</Text></ScrollView> : null}
      {storageError ? <Text accessibilityRole="alert" style={{ color: colors.warning }}>Não foi possível remover o rascunho. Tente novamente.</Text> : null}
    </AppModal>
  );
}
