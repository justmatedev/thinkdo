import "./reanimated-config.js"
import "./global.css"
import { NavigationContainer } from "@react-navigation/native"
import Routes from "./src/routes/app.routes"
import { useFonts } from "expo-font"
import { ModalComponent } from "./src/components/modal"
import { GestureHandlerRootView } from "react-native-gesture-handler"
import { SafeAreaProvider } from "react-native-safe-area-context"

export default function App() {
  const [fontsLoaded] = useFonts({
    PoppinsRegular: require("./src/fonts/Poppins-Regular.ttf"),
    PoppinsRegularItalic: require("./src/fonts/Poppins-Italic.ttf"),
    PoppinsMedium: require("./src/fonts/Poppins-Medium.ttf"),
    PoppinsSemiBold: require("./src/fonts/Poppins-SemiBold.ttf"),
  })

  if (!fontsLoaded) return null

  return (
    <SafeAreaProvider>
      <AppContent />
    </SafeAreaProvider>
  )
}

function AppContent() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <ModalComponent />
        <Routes />
      </NavigationContainer>
    </GestureHandlerRootView>
  )
}
