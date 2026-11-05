import { createElement } from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";

let mockParams: Record<string, string | string[]> = {};
let mockAuth: { user: { uid: string } | null; loading: boolean };
jest.mock("expo-router", () => ({
  Redirect: () => null,
  Stack: () => null,
  useGlobalSearchParams: () => mockParams,
}));
jest.mock("@/features/auth/AuthProvider", () => ({ useAuth: () => mockAuth }));
jest.mock("@/features/reminders/openReminderNavigation", () => ({
  flushPendingReminderNavigation: async () => {},
}));
jest.mock("@/lib/themeContext", () => ({
  useTheme: () => ({ colors: {}, themeName: "light" }),
}));
import { Redirect } from "expo-router";
import AppLayout from "../../../app/(app)/_layout";
import AuthLayout from "../../../app/(auth)/_layout";

let tree: ReactTestRenderer;
function mount(Layout: typeof AppLayout | typeof AuthLayout) {
  act(() => { tree = create(createElement(Layout)); });
}
beforeEach(() => {
  mockParams = {};
  mockAuth = { user: null, loading: false };
});
afterEach(() => act(() => tree?.unmount()));

test("a signed-out widget open preserves capture flags on the login redirect", () => {
  mockParams = { focus: "capture", source: "widget" };
  mount(AppLayout);
  expect(tree.root.findByType(Redirect).props.href).toBe("/login?focus=capture&source=widget");
});

test("login returns to capture even after visiting signup without query parameters", () => {
  mockParams = { focus: "capture", source: "widget" };
  mount(AuthLayout);
  mockParams = {};
  act(() => tree.update(createElement(AuthLayout)));
  mockAuth = { user: { uid: "a" }, loading: false };
  act(() => tree.update(createElement(AuthLayout)));
  expect(tree.root.findByType(Redirect).props.href).toBe("/?focus=capture&source=widget");
});

test("an ordinary login returns to the inbox without widget mode", () => {
  mount(AppLayout);
  expect(tree.root.findByType(Redirect).props.href).toBe("/login");
  act(() => tree.unmount());
  mockAuth = { user: { uid: "a" }, loading: false };
  mount(AuthLayout);
  expect(tree.root.findByType(Redirect).props.href).toBe("/");
});

test("focus from another source does not activate widget capture after login", () => {
  mockParams = { focus: "capture", source: "app" };
  mockAuth = { user: { uid: "a" }, loading: false };
  mount(AuthLayout);
  expect(tree.root.findByType(Redirect).props.href).toBe("/");
});

test("authentication loading does not discard an incoming capture request", () => {
  mockParams = { focus: ["capture"], source: ["widget"] };
  mockAuth.loading = true;
  mount(AuthLayout);
  expect(tree.root.findAllByType(Redirect)).toHaveLength(0);
  mockAuth = { user: { uid: "a" }, loading: false };
  act(() => tree.update(createElement(AuthLayout)));
  expect(tree.root.findByType(Redirect).props.href).toBe("/?focus=capture&source=widget");
});
