import { Children, type ReactElement } from "react";
import { ImageWidget } from "react-native-android-widget";
jest.mock("expo-constants", () => {
  const constants = jest.requireActual("expo-constants");
  return {
    ...constants,
    __esModule: true,
    default: {
      ...constants.default,
      executionEnvironment: constants.ExecutionEnvironment.Standalone,
      expoConfig: { scheme: "thinkdo" },
    },
  };
});
import { CaptureWidget } from "@/widgets/capture/CaptureWidget";

test.each(["light", "dark"] as const)(
  "keeps the existing 1×1 artwork and capture action in the %s theme",
  (themeName) => {
    const widget = CaptureWidget({ width: 70, height: 70, themeName });
    expect(widget.type).toBe(ImageWidget);
    expect(widget.props.clickAction).toBe("OPEN_URI");
    expect(widget.props.clickActionData.uri).toContain("focus=capture");
    expect(widget.props.imageWidth).toBe(70);
    expect(widget.props.imageHeight).toBe(70);
  },
);

test.each([[70, 150], [100, 210], [150, 140], [250, 40]])(
  "uses a single proportional mark inside a %i×%i widget",
  (width, height) => {
    const widget = CaptureWidget({ width, height });
    const children = Children.toArray(widget.props.children);
    expect(children).toHaveLength(1);
    const mark = children[0] as ReactElement<{ size: number }>;
    expect(mark.props.size).toBeGreaterThan(0);
    expect(mark.props.size).toBeLessThanOrEqual(Math.min(width, height));
    expect(mark.props.size + widget.props.style.paddingHorizontal * 2 + widget.props.style.borderWidth * 2).toBeLessThanOrEqual(width);
    expect(mark.props.size + widget.props.style.paddingVertical * 2 + widget.props.style.borderWidth * 2).toBeLessThanOrEqual(height);
    expect(widget.props.clickActionData.uri).toContain("source=widget");
  },
);


test("fits the mark inside a short horizontal widget including its border", () => {
  const widget = CaptureWidget({ width: 250, height: 70 });
  const mark = Children.toArray(widget.props.children)[0] as ReactElement<{ size: number }>;
  expect(mark.props.size + widget.props.style.paddingVertical * 2 + widget.props.style.borderWidth * 2).toBeLessThanOrEqual(70);
});
