import { createElement } from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
jest.mock("@/lib/themeContext", () => ({
  useTheme: () => ({ colors: {} }),
}));
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ bottom: 0 }),
}));
jest.mock("react-native-reanimated", () => ({
  __esModule: true,
  default: { View: require("react-native").View },
  useSharedValue: (initial: number) => {
    const ref = require("react").useRef(null);
    if (!ref.current) {
      let value = initial;
      ref.current = {
        get value() {
          return value;
        },
        set value(next: number) {
          value = next;
        },
        get: () => value,
        set: (next: number) => {
          value = next;
        },
      };
    }
    return ref.current;
  },
  useAnimatedStyle: (fn: () => unknown) => fn(),
  withTiming: (value: number) => value,
  runOnJS: (fn: unknown) => fn,
}));
jest.mock("react-native-gesture-handler", () => {
  const View = require("react-native").View;
  const pan = {
    activeOffsetY: () => pan,
    onUpdate: () => pan,
    onEnd: () => pan,
    onFinalize: () => pan,
  };
  return {
    Gesture: { Pan: () => pan },
    GestureDetector: View,
    GestureHandlerRootView: View,
  };
});
jest.mock("@/features/reminders/components/ReminderDateTimePicker", () => ({
  ReminderDateTimePicker: () => null,
}));
import { ReminderEditorSheet } from "@/features/reminders/components/ReminderEditorSheet";
import { ReminderFieldRow } from "@/features/reminders/components/ReminderFieldRow";
import type { ItemReminder } from "@/features/reminders/types";
test("keeps the open draft across parent renders and resets it on reopen", () => {
  const first: ItemReminder = { kind: "daily", hour: 9, minute: 0 };
  const next: ItemReminder = { kind: "daily", hour: 11, minute: 0 };
  const props = {
    visible: true,
    initialReminder: first,
    canRemove: true,
    onConfirm: jest.fn(),
    onRemove: jest.fn(),
    onClose: jest.fn(),
  };
  let tree!: ReactTestRenderer;
  act(() => {
    tree = create(createElement(ReminderEditorSheet, props));
  });
  act(() =>
    tree.update(
      createElement(ReminderEditorSheet, { ...props, initialReminder: next }),
    ),
  );
  expect(
    tree.root
      .findAllByType(ReminderFieldRow)
      .some((row) => row.props.value === "09:00"),
  ).toBe(true);
  act(() =>
    tree.update(
      createElement(ReminderEditorSheet, { ...props, visible: false }),
    ),
  );
  act(() =>
    tree.update(
      createElement(ReminderEditorSheet, { ...props, initialReminder: next }),
    ),
  );
  expect(
    tree.root
      .findAllByType(ReminderFieldRow)
      .some((row) => row.props.value === "11:00"),
  ).toBe(true);
  act(() =>
    tree.root
      .findByProps({ accessibilityLabel: "Fechar lembrete" })
      .props.onPress(),
  );
  expect(props.onClose).toHaveBeenCalledTimes(1);
  expect(props.onConfirm).not.toHaveBeenCalled();
  act(() => tree.unmount());
});
