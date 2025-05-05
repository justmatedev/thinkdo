import "dotenv/config"

export default {
  expo: {
    name: "Thinkdo",
    slug: "Thinkdo",
    version: "1.1.2",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#f6fce3",
    },
    ios: {
      supportsTablet: true,
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#f6fce3",
      },
      package: "com.justmate.thinkdo",
    },
    web: {
      favicon: "./assets/favicon.png",
    },
    plugins: ["expo-font"],
    extra: {
      firebaseApiKey: process.env.FIREBASE_API_KEY,
      firebaseAuthDomain: process.env.FIREBASE_AUTH_DOMAIN,
      firebaseProjectId: process.env.FIREBASE_PROJECT_ID,
      firebaseStorageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      firebaseMessagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
      firebaseAppId: process.env.FIREBASE_APP_ID,
      firebaseMeasurementId: process.env.FIREBASE_MEASUREMENT_ID,
      eas: {
        projectId: process.env.EAS_PROJECTID,
      },
    },
    newArchEnabled: true,
  },
}
