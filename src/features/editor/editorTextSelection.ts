type Selection = { start: number; end: number };

// Native keyboards may emit selection before or after the corresponding text.
// Resolve cursor-only boundaries at the next edit, before it enters history.
export function createEditorTextSelection() {
  let text = '';
  let caret: number | null = null;
  let alternateCaret: number | null = null;
  let positions: number[] = [];
  let selectedRange = false;
  const reset = (value: string) => {
    text = value; caret = null; alternateCaret = null; positions = []; selectedRange = false;
  };
  return {
    reset,
    select({ start, end }: Selection) {
      if (start !== end) selectedRange = true;
      else if (start === alternateCaret) { caret = start; alternateCaret = null; }
      else if (caret === null) caret = start;
      else if (!positions.includes(start)) {
        if (positions.length === 3) { selectedRange = true; positions.shift(); }
        positions.push(start);
      }
    },
    change(before: string, after: string): boolean {
      if (text !== before) reset(before);
      if (before === after) return false;
      let start = 0;
      while (start < before.length && start < after.length && before[start] === after[start]) start++;
      let oldEnd = before.length;
      let newEnd = after.length;
      while (oldEnd > start && newEnd > start && before[oldEnd - 1] === after[newEnd - 1]) {
        oldEnd--; newEnd--;
      }
      // Repeated text admits several equivalent diffs. Anchor the edit at the
      // known caret instead of assuming the rightmost diff was the real edit.
      // Native selection offsets and the length delta are both UTF-16 units.
      const delta = after.length - before.length;
      const inferCaret = (anchor: number): number | null => {
        if (delta > 0 && before === after.slice(0, anchor) + after.slice(anchor + delta))
          return anchor + delta;
        if (delta < 0) {
          if (anchor + delta >= 0 && after === before.slice(0, anchor + delta) + before.slice(anchor))
            return anchor + delta; // Backspace.
          if (after === before.slice(0, anchor) + before.slice(anchor - delta))
            return anchor; // Forward delete.
        }
        return null;
      };
      const expected = caret === null ? newEnd : inferCaret(caret) ?? newEnd;
      const moved = selectedRange || positions.some(position => position !== caret && position !== expected);
      let nextCaret = expected;
      const last = positions[positions.length - 1];
      if (moved && last !== undefined && last !== caret && last !== expected) {
        const previous = positions[positions.length - 2];
        // A manual move and its subsequent typing selection may both precede
        // the text event. In that case the last position is already post-edit.
        nextCaret = previous !== undefined && inferCaret(previous) === last ? last : inferCaret(last) ?? expected;
      }
      // Backspace and forward delete can yield the exact same repeated text.
      // Keep the second valid caret until the native selection disambiguates it.
      alternateCaret = delta < 0 && caret !== null && nextCaret !== caret &&
        after === before.slice(0, caret) + before.slice(caret - delta) ? caret : null;
      text = after; caret = nextCaret; positions = []; selectedRange = false;
      return moved;
    },
  };
}
