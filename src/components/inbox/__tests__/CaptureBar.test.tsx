import { createElement } from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { TextInput } from "react-native";
import { deferred } from "@/test/renderHook";
jest.mock("@/components/ui/AppIcon", () => ({ AppIcon: () => null }));
jest.mock("@/lib/themeContext", () => ({
  useTheme: () => ({ colors: {} }),
}));
import { CaptureBar } from "@/components/inbox/CaptureBar";
test("keeps text while pending, blocks duplicates, preserves failure and clears only on success", async () => {
  const pending = deferred<boolean>();
  const submit = jest
    .fn()
    .mockReturnValueOnce(pending.promise)
    .mockResolvedValue(true);
  let tree!: ReactTestRenderer;
  act(() => {
    tree = create(
      createElement(CaptureBar, { onSubmit: submit, disabled: false }),
    );
  });
  const input = () => tree.root.findByType(TextInput);
  act(() => input().props.onChangeText("Keep this"));
  act(() => {
    void input().props.onSubmitEditing();
  });
  expect(input().props.value).toBe("Keep this");
  expect(input().props.editable).toBe(false);
  act(() => {
    void input().props.onSubmitEditing();
  });
  expect(submit).toHaveBeenCalledTimes(1);
  await act(async () => pending.resolve(false));
  expect(input().props.value).toBe("Keep this");
  expect(input().props.editable).toBe(true);
  await act(async () =>
    tree.root.findByProps({ accessibilityLabel: "Adicionar" }).props.onPress(),
  );
  expect(input().props.value).toBe("");
  act(() => tree.unmount());
});
test("keeps text and unlocks on an unexpected rejection", async () => {
  const submit = jest.fn().mockRejectedValue(new Error("offline"));
  let tree!: ReactTestRenderer;
  act(() => {
    tree = create(
      createElement(CaptureBar, { onSubmit: submit, disabled: false }),
    );
  });
  act(() => tree.root.findByType(TextInput).props.onChangeText("Draft"));
  await act(async () =>
    tree.root.findByType(TextInput).props.onSubmitEditing(),
  );
  expect(tree.root.findByType(TextInput).props.value).toBe("Draft");
  expect(tree.root.findByType(TextInput).props.editable).toBe(true);
  act(() => tree.unmount());
});
