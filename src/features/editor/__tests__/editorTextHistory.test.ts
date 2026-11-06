import {
  closeTextGroup, createTextHistory, invalidateTextField, recordTextEdit,
  redoTextEdit, textHistoryAvailability, undoTextEdit, type TextHistory,
} from '../editorTextHistory';

function body(history: TextHistory, before: string, after: string, at = 0) {
  return recordTextEdit(history, { field: 'body', before, after, at });
}

test('restores title and body in editing order, then redoes without adding entries', () => {
  let h = recordTextEdit(createTextHistory(), { field: 'title', before: 'Title', after: 'New', at: 0 });
  h = body(h, 'Old', 'New body', 10);
  let result = undoTextEdit(h);
  expect(result.patch).toEqual({ body: 'Old' });
  result = undoTextEdit(result.history);
  expect(result.patch).toEqual({ title: 'Title' });
  expect(undoTextEdit(result.history).patch).toBeNull();
  result = redoTextEdit(result.history);
  expect(result.patch).toEqual({ title: 'New' });
  result = redoTextEdit(result.history);
  expect(result.patch).toEqual({ body: 'New body' });
  expect(redoTextEdit(result.history).patch).toBeNull();
  expect(undoTextEdit(result.history).patch).toEqual({ body: 'Old' });
});

test('no-op and explicit group boundaries preserve redo, a new edit discards it', () => {
  const undone = undoTextEdit(body(createTextHistory(), '', 'a')).history;
  const unchanged = closeTextGroup(body(undone, '', ''));
  expect(textHistoryAvailability(unchanged)).toEqual({ canUndo: false, canRedo: true });
  expect(textHistoryAvailability(body(unchanged, '', 'b'))).toEqual({ canUndo: true, canRedo: false });
});

test.each([
  [699, ''], [700, 'a'],
])('groups single character insertion only before the gap boundary (%i ms)', (at, restored) => {
  const h = body(body(createTextHistory(), '', 'a'), 'a', 'ab', at);
  expect(undoTextEdit(h).patch).toEqual({ body: restored });
});

test('limits continuous typing groups to less than three seconds', () => {
  let h = createTextHistory();
  let text = '';
  for (let i = 0; i <= 6; i++) {
    h = body(h, text, text + 'a', i * 500);
    text += 'a';
  }
  const result = undoTextEdit(h);
  expect(result.patch).toEqual({ body: 'aaaaaa' });
  expect(undoTextEdit(result.history).patch).toEqual({ body: '' });
});

test('separates field changes, insertion/deletion and explicit boundaries', () => {
  let h = body(createTextHistory(), '', 'a');
  h = recordTextEdit(h, { field: 'title', before: '', after: 'T', at: 1 });
  h = body(h, 'a', 'ab', 2);
  h = body(h, 'ab', 'a', 3);
  let result = undoTextEdit(h);
  expect(result.patch).toEqual({ body: 'ab' });
  result = undoTextEdit(result.history);
  expect(result.patch).toEqual({ body: 'a' });
  expect(undoTextEdit(result.history).patch).toEqual({ title: '' });
  h = body(closeTextGroup(body(createTextHistory(), '', 'a')), 'a', 'ab', 1);
  expect(undoTextEdit(h).patch).toEqual({ body: 'a' });
});

test.each([
  ['', 'paste', 'paste!'], ['abc', 'axc', 'axcd'], ['abcdef', 'a', 'ab'],
])('isolates pasted, replaced or multi-character deleted text (%s → %s)', (before, after, next) => {
  const h = body(body(createTextHistory(), before, after), after, next, 1);
  const result = undoTextEdit(h);
  expect(result.patch).toEqual({ body: after });
  expect(undoTextEdit(result.history).patch).toEqual({ body: before });
});

test('groups whole emoji code points without restoring broken surrogates', () => {
  const h = body(body(createTextHistory(), '', '😀'), '😀', '😀a', 1);
  expect(undoTextEdit(h).patch).toEqual({ body: '' });
  const removed = body(body(createTextHistory(), '😀a', '😀'), '😀', '', 1);
  expect(undoTextEdit(removed).patch).toEqual({ body: '😀a' });
});

test('round trips combining accents and joined emoji exactly', () => {
  const h = body(createTextHistory(), 'cafe\u0301', '👨‍👩‍👧‍👦 cafe\u0301');
  const undone = undoTextEdit(h);
  expect(undone.patch).toEqual({ body: 'cafe\u0301' });
  expect(redoTextEdit(undone.history).patch).toEqual({ body: '👨‍👩‍👧‍👦 cafe\u0301' });
});

test('retains only the newest 100 steps across undo and redo', () => {
  let h = createTextHistory();
  for (let i = 0; i < 105; i++) h = body(h, String(i), String(i + 1), i * 1000);
  let result = undoTextEdit(h);
  expect(result.patch).toEqual({ body: '104' });
  for (let i = 0; i < 10; i++) result = redoTextEdit(undoTextEdit(redoTextEdit(result.history).history).history);
  for (let i = 0; i < 100; i++) result = undoTextEdit(result.history);
  expect(result.patch).toEqual({ body: '5' });
  expect(undoTextEdit(result.history).patch).toBeNull();
});

test('invalidating title preserves body entries in both past and future', () => {
  let h = body(createTextHistory(), 'old', 'new');
  h = recordTextEdit(h, { field: 'title', before: 'Title', after: '', at: 1 });
  h = body(h, 'new', 'latest', 2);
  h = undoTextEdit(h).history;
  h = invalidateTextField(h, 'title');
  expect(undoTextEdit(h).patch).toEqual({ body: 'old' });
  expect(redoTextEdit(h).patch).toEqual({ body: 'latest' });
});
