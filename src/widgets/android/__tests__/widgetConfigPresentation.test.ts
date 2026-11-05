import {
  resolveWidgetConfigKind,
  widgetConfigSummary,
} from "@/widgets/android/widgetConfigPresentation";

describe("resolveWidgetConfigKind", () => {
  it("selects the Inbox form for the Inbox native widget", () => {
    expect(resolveWidgetConfigKind("Inbox")).toBe("inbox");
  });

  it("keeps the Capture form for the Capture native widget", () => {
    expect(resolveWidgetConfigKind("Capture")).toBe("capture");
  });

  it("matches Inbox regardless of casing", () => {
    expect(resolveWidgetConfigKind("inbox")).toBe("inbox");
    expect(resolveWidgetConfigKind("INBOX")).toBe("inbox");
  });
});

describe("widgetConfigSummary", () => {
  it("describes the selected Inbox filter and theme", () => {
    expect(widgetConfigSummary("tasks", "dark")).toBe(
      "Tarefas · Tema escuro"
    );
  });

  it("describes system theme and the all-items default", () => {
    expect(widgetConfigSummary("all", "system")).toBe(
      "Tudo · Tema do sistema"
    );
  });
});
