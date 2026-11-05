jest.mock("react-native/Libraries/Utilities/Platform", () => {
  const platform = {
    OS: "android",
    select: (options: Record<string, unknown>) => options.android,
  };
  return { __esModule: true, default: platform, ...platform };
});

const mockRequestWidgetUpdate = jest.fn();
jest.mock("react-native-android-widget", () => ({
  getWidgetInfo: async () => [{ widgetId: 42, width: 320, height: 180 }],
  requestWidgetUpdateById: (...args: unknown[]) =>
    mockRequestWidgetUpdate(...args),
}));

const mockResolveInboxWidgetRepresentation = jest.fn();
jest.mock("@/widgets/inbox/inboxWidgetRender", () => ({
  resolveInboxWidgetRepresentation: (...args: unknown[]) =>
    mockResolveInboxWidgetRepresentation(...args),
}));

jest.mock("@/widgets/capture/captureWidgetRender", () => ({
  resolveCaptureWidgetRepresentation: jest.fn(),
}));

import { refreshInboxWidgets } from "@/widgets/refreshWidgets";

describe("refreshInboxWidgets", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("requests an Inbox update using the inbox resolver", async () => {
    const representation = { kind: "inbox" };
    mockResolveInboxWidgetRepresentation.mockResolvedValue(representation);

    await refreshInboxWidgets();

    expect(mockRequestWidgetUpdate).toHaveBeenCalledWith({
      widgetName: "Inbox",
      widgetId: 42,
      renderWidget: expect.any(Function),
    });
    const renderWidget = mockRequestWidgetUpdate.mock.calls[0][0].renderWidget;
    await expect(
      renderWidget({ widgetId: 42, width: 320, height: 180 }),
    ).resolves.toBe(representation);
    expect(mockResolveInboxWidgetRepresentation).toHaveBeenCalledWith(
      42,
      320,
      180,
    );
  });
});

test("serializes widget publications so logout refresh cannot be overwritten by an older update", async () => {
  jest.clearAllMocks();
  let finish!: () => void;
  mockRequestWidgetUpdate.mockImplementationOnce(
    () =>
      new Promise<void>((resolve) => {
        finish = resolve;
      }),
  );
  mockRequestWidgetUpdate.mockResolvedValueOnce(undefined);
  const old = refreshInboxWidgets();
  const clear = refreshInboxWidgets();
  await Promise.resolve();
  expect(mockRequestWidgetUpdate).toHaveBeenCalledTimes(1);
  finish();
  await Promise.all([old, clear]);
  expect(mockRequestWidgetUpdate).toHaveBeenCalledTimes(2);
});
