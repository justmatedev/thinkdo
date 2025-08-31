import "dotenv/config"

export default {
  expo: {
    name: "Thinkdo",
    slug: "Thinkdo",
    version: "1.1.2",
    orientation: "portrait",
    icon: "./assets/adaptive-icon.png",
    userInterfaceStyle: "automatic",
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
    plugins: [
      "expo-font",
      [
        "expo-splash-screen",
        {
          image: "./assets/splash-icon-light.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#f6fce3",
          dark: {
            image: "./assets/splash-icon-light.png",
            backgroundColor: "#141414",
          },
        },
      ],
    ],
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
