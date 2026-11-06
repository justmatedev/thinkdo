import { createEditorTextSelection } from '../editorTextSelection';

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
