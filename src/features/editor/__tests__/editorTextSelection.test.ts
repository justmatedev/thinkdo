import { createEditorTextSelection } from '../editorTextSelection';
import { createTextHistory, recordTextEdit, undoTextEdit } from '../editorTextHistory';

// Catch treating an equivalent repeated-character diff as a cursor movement.
test.each(['before', 'after'])('groups typing within repeated letters/spaces with selection %s text', order => {
  for (const [base, inserted, start] of [['    text', ' ', 0], ['aaa', 'a', 1]] as const) {
    const tracker = createEditorTextSelection();
    tracker.reset(base);
    tracker.select({ start, end: start });
    let h = createTextHistory();
    let before: string = base;
    let caret: number = start;
    for (let i = 0; i < 3; i++) {
      const after = before.slice(0, caret) + inserted + before.slice(caret);
      caret++;
      if (order === 'before') tracker.select({ start: caret, end: caret });
      expect(tracker.change(before, after)).toBe(false);
      h = recordTextEdit(h, { field: 'body', before, after, at: i * 100 });
      if (order === 'after') tracker.select({ start: caret, end: caret });
      before = after;
    }
    // A different next letter must also stay in the same typing group.
    const after = before.slice(0, caret) + 'b' + before.slice(caret);
    if (order === 'before') tracker.select({ start: caret + 1, end: caret + 1 });
    expect(tracker.change(before, after)).toBe(false);
    h = recordTextEdit(h, { field: 'body', before, after, at: 300 });
    const undone = undoTextEdit(h);
    expect(undone.patch).toEqual({ body: base });
    expect(undoTextEdit(undone.history).patch).toBeNull();
  }
});

test.each(['before', 'after'])('groups deletion inside repeated text with selection %s text', order => {
  for (const forward of [false, true]) {
    const tracker = createEditorTextSelection();
    const base = 'x      text';
    tracker.reset(base);
    let caret = 4;
    tracker.select({ start: caret, end: caret });
    let before = base;
    let h = createTextHistory();
    for (let i = 0; i < 3; i++) {
      const removedAt = forward ? caret : caret - 1;
      const after = before.slice(0, removedAt) + before.slice(removedAt + 1);
      if (!forward) caret--;
      if (order === 'before') tracker.select({ start: caret, end: caret });
      expect(tracker.change(before, after)).toBe(false);
      h = recordTextEdit(h, { field: 'body', before, after, at: i * 100 });
      if (order === 'after') tracker.select({ start: caret, end: caret });
      before = after;
    }
    expect(undoTextEdit(h).patch).toEqual({ body: base });
  }
});

test('resolves a manual move into repeated text before typing without splitting the following typing', () => {
  const tracker = createEditorTextSelection();
  tracker.reset('aaa');
  tracker.select({ start: 3, end: 3 });
  tracker.select({ start: 0, end: 0 });
  expect(tracker.change('aaa', 'aaaa')).toBe(true);
  tracker.select({ start: 1, end: 1 });
  expect(tracker.change('aaaa', 'aaaaa')).toBe(false);
});

test.each(['before', 'after'])('does not break typing groups for selection events %s text changes', order => {
  const tracker = createEditorTextSelection();
  tracker.reset('a');
  tracker.select({ start: 1, end: 1 });
  if (order === 'before') tracker.select({ start: 2, end: 2 });
  expect(tracker.change('a', 'ab')).toBe(false);
  if (order === 'after') tracker.select({ start: 2, end: 2 });
  if (order === 'before') tracker.select({ start: 3, end: 3 });
  expect(tracker.change('ab', 'abc')).toBe(false);
});

test('closes the next typing group after a manual cursor move, including away and back', () => {
  const tracker = createEditorTextSelection();
  tracker.reset('abc');
  tracker.select({ start: 3, end: 3 });
  tracker.change('abc', 'abcd');
  tracker.select({ start: 4, end: 4 });
  tracker.select({ start: 1, end: 1 });
  tracker.select({ start: 4, end: 4 });
  expect(tracker.change('abcd', 'abcde')).toBe(true);
  tracker.select({ start: 5, end: 5 });
  expect(tracker.change('abcde', 'abcdef')).toBe(false);
});

test('nonempty selections close the group even when replacement leaves the same caret', () => {
  const tracker = createEditorTextSelection();
  tracker.reset('aaa');
  tracker.select({ start: 1, end: 2 });
  expect(tracker.change('aaa', 'aba')).toBe(true);
});

test('understands UTF-16 native cursor positions after emoji and resets after external restores', () => {
  const tracker = createEditorTextSelection();
  tracker.reset('a');
  tracker.select({ start: 1, end: 1 });
  expect(tracker.change('a', 'a😀')).toBe(false);
  tracker.select({ start: 3, end: 3 });
  expect(tracker.change('a😀', 'a😀b')).toBe(false);
  tracker.select({ start: 0, end: 0 });
  // Undo or normalization changed the value outside onChangeText.
  expect(tracker.change('a', 'ab')).toBe(false);
});
