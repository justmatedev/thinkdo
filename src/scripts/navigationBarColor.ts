import * as NavigationBar from "expo-navigation-bar"
import { colors } from "../theme/colors"

async function navigationBarColor(color: string) {
  try {
    if (color == colors.primary) {
      await NavigationBar.setButtonStyleAsync("light")
    } else {
      await NavigationBar.setButtonStyleAsync("dark")
    }
    await NavigationBar.setBackgroundColorAsync(color)
  } catch (error) {
    console.error("Failed to configure navigation bar:", error)
  }
}

export default navigationBarColor
