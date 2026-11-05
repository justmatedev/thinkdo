import { createElement } from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { Text } from "react-native";
import { InboxSelectionBar } from "@/components/inbox/InboxSelectionBar";

jest.mock("@/lib/themeContext", () => ({
  useTheme: () => ({ colors: require("@/lib/theme").themes.light }),
}));

test("announces selected count and provides cancel and delete actions", () => {
  const onCancel = jest.fn();
  const onDelete = jest.fn();
  let tree!: ReactTestRenderer;
  act(() => {
    tree = create(
      createElement(InboxSelectionBar, {
        count: 2,
        online: true,
        deleting: false,
        onCancel,
        onDelete,
      }),
    );
  });
  expect(
    tree.root.findAllByType(Text).map((node) => node.props.children),
  ).toContain("2 selecionados");
  act(() =>
    tree.root.findByProps({ accessibilityLabel: "Excluir" }).props.onPress(),
  );
  expect(onDelete).toHaveBeenCalledTimes(1);
  act(() =>
    tree.root.findByProps({ accessibilityLabel: "Cancelar" }).props.onPress(),
  );
  expect(onCancel).toHaveBeenCalledTimes(1);
  act(() => tree.unmount());
});

test.each([
  { count: 0, online: true, deleting: false },
  { count: 2, online: false, deleting: false },
  { count: 2, online: true, deleting: true },
])("disables deletion for %o", (props) => {
  let tree!: ReactTestRenderer;
  act(() => {
    tree = create(
      createElement(InboxSelectionBar, {
        ...props,
        onCancel: jest.fn(),
        onDelete: jest.fn(),
      }),
    );
  });
  const button = tree.root.findByProps({ accessibilityLabel: "Excluir" });
  expect(button.props.disabled).toBe(true);
  act(() => tree.unmount());
});
