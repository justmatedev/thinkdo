import {
  inboxHomeDeepLink,
  inboxItemDeepLink,
} from "@/widgets/inbox/inboxWidgetActions";

jest.mock("expo-linking", () => ({
  createURL: (path: string) => `thinkdo:///${path.replace(/^\/+/, "")}`,
}));

describe("inbox widget deep links", () => {
  it("opens the inbox home route", () => {
    expect(inboxHomeDeepLink()).toBe("thinkdo:///");
  });

  it("opens the requested inbox item route", () => {
    expect(inboxItemDeepLink("abc")).toBe("thinkdo:///item/abc");
  });
});
