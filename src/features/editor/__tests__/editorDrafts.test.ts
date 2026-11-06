import AsyncStorage from '@react-native-async-storage/async-storage';
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
import { readEditorDraft, writeEditorDraft, clearEditorDraft } from '../editorDrafts';
import { validateEditorText } from '../editorValidation';

beforeEach(async () => { await AsyncStorage.clear(); jest.clearAllMocks(); });
const draft = (revision = '1') => ({ version: 1 as const, uid: 'u1', itemId: 'a', revision, patch: { body: 'Keep' }, original: { body: 'Original' } });
test('persists and isolates drafts by account and item', async () => {
  await writeEditorDraft(draft());
  expect(await readEditorDraft('u1', 'a')).toEqual(draft());
  expect(await readEditorDraft('u2', 'a')).toBeNull();
  expect(await readEditorDraft('u1', 'b')).toBeNull();
});
test('an old acknowledgement cannot remove a newer draft', async () => {
  await writeEditorDraft(draft());
  await writeEditorDraft(draft('2'));
  await clearEditorDraft('u1', 'a', '1');
  expect((await readEditorDraft('u1', 'a'))?.revision).toBe('2');
  await clearEditorDraft('u1', 'a', '2');
  expect(await readEditorDraft('u1', 'a')).toBeNull();
});
test('revives once reminder dates and rejects malformed stored data', async () => {
  const reminder = { kind: 'once' as const, at: new Date('2030-01-01') };
  await writeEditorDraft({ ...draft(), patch: { reminder }, original: { reminder: null } });
  expect((await readEditorDraft('u1', 'a'))?.patch.reminder).toEqual(reminder);
  jest.spyOn(AsyncStorage, 'getItem').mockResolvedValueOnce('{broken');
  await expect(readEditorDraft('u1', 'a')).rejects.toThrow();
});
test('storage failures propagate and do not poison the mutation queue', async () => {
  jest.spyOn(AsyncStorage, 'setItem').mockRejectedValueOnce(new Error('full'));
  await expect(writeEditorDraft(draft())).rejects.toThrow('full');
  await writeEditorDraft(draft('2'));
  expect((await readEditorDraft('u1', 'a'))?.revision).toBe('2');
});
test('validates exact limits using Firestore-compatible Unicode lengths without truncating', () => {
  expect(validateEditorText({ title: '😀'.repeat(250), body: 'é'.repeat(100000) })).toEqual({});
  expect(validateEditorText({ title: '😀'.repeat(251), body: 'é'.repeat(100001) })).toEqual({ title: expect.any(String), body: expect.any(String) });
  expect(validateEditorText({ title: '   ', body: '' }).title).toBeTruthy();
});
