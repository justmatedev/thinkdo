const {
  withDangerousMod,
  createRunOncePlugin,
} = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

/** Same filenames as react-native-android-widget uses for previewImage. */
const DARK_PREVIEWS = [
  {
    from: "assets/images/widget-capture-preview-dark.png",
    name: "capture_preview.png",
  },
  {
    from: "assets/images/widget-inbox-preview-dark.png",
    name: "inbox_preview.png",
  },
];

/**
 * Copies dark widget picker previews into res/drawable-night/.
 * The widget plugin only copies light previewImage on prebuild; Android picks
 * the night variant automatically when the launcher is in dark mode.
 */
function withWidgetDarkPreviews(config) {
  return withDangerousMod(config, [
    "android",
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const drawableNight = path.join(
        projectRoot,
        "android/app/src/main/res/drawable-night"
      );

      fs.mkdirSync(drawableNight, { recursive: true });

      for (const { from, name } of DARK_PREVIEWS) {
        const src = path.join(projectRoot, from);
        const dest = path.join(drawableNight, name);
        if (!fs.existsSync(src)) {
          throw new Error(`Missing dark widget preview: ${from}`);
        }
        fs.copyFileSync(src, dest);
      }

      return config;
    },
  ]);
}

module.exports = createRunOncePlugin(
  withWidgetDarkPreviews,
  "with-widget-dark-previews",
  "1.0.0"
);
