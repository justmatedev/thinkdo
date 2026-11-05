const fs = require("fs");
const {
  withGradleProperties,
  createRunOncePlugin,
} = require("@expo/config-plugins");

// Forward slashes work for Gradle on Windows and for fs.existsSync.
const JAVA_HOME_WIN =
  "C:/Program Files/Eclipse Adoptium/jdk-17.0.20.8-hotspot";

/**
 * Pins Gradle to JDK 17 on local Windows so CMake/worklets don't fail on
 * Android Studio's JDK 25. Skipped on EAS/CI (Linux) — a Windows path there
 * breaks the cloud build.
 */
function withGradleJavaHome(config) {
  return withGradleProperties(config, (config) => {
    const onEasOrCi = Boolean(process.env.EAS_BUILD || process.env.CI);
    const useLocalJdk =
      !onEasOrCi && process.platform === "win32" && fs.existsSync(JAVA_HOME_WIN);

    const props = config.modResults;
    const key = "org.gradle.java.home";
    const existingIndex = props.findIndex(
      (p) => p.type === "property" && p.key === key
    );

    if (!useLocalJdk) {
      if (existingIndex >= 0) {
        props.splice(existingIndex, 1);
      }
      return config;
    }

    if (existingIndex >= 0) {
      props[existingIndex].value = JAVA_HOME_WIN;
    } else {
      props.push({ type: "property", key, value: JAVA_HOME_WIN });
    }
    return config;
  });
}

module.exports = createRunOncePlugin(
  withGradleJavaHome,
  "with-gradle-java-home",
  "1.0.0"
);
