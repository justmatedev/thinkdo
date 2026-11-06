type Selection = { start: number; end: number };

// Native keyboards may emit selection before or after the corresponding text.
// Resolve cursor-only boundaries at the next edit, before it enters history.
export function createEditorTextSelection() {
  let text = '';
  let caret: number | null = null;
  let positions: number[] = [];
  let selectedRange = false;
  const reset = (value: string) => {
    text = value; caret = null; positions = []; selectedRange = false;
  };
  return {
    reset,
    select({ start, end }: Selection) {
      if (start !== end) selectedRange = true;
      else if (caret === null) caret = start;
      else if (!positions.includes(start) && positions.length < 3) positions.push(start);
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
      // Selection offsets from TextInput use UTF-16, rather than code points.
      const moved = selectedRange || positions.some(position => position !== caret && position !== newEnd);
      text = after; caret = newEnd; positions = []; selectedRange = false;
      return moved;
    },
  };
}
