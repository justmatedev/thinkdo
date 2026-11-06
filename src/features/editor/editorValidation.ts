export const EDITOR_TITLE_LIMIT = 500;
export const EDITOR_BODY_LIMIT = 100000;
export type EditorFieldErrors = { title?: string; body?: string };

export function validateEditorText(item: { title: string; body: string }): EditorFieldErrors {
  const errors: EditorFieldErrors = {};
  // Firestore rules String.size() counts UTF-16 units (verified in the emulator).
  if (!item.title.trim()) errors.title = 'Informe um título.';
  else if (item.title.trim().length > EDITOR_TITLE_LIMIT)
    errors.title = 'O título pode ter até 500 caracteres.';
  if (item.body.length > EDITOR_BODY_LIMIT)
    errors.body = 'O texto pode ter até 100.000 caracteres.';
  return errors;
}
