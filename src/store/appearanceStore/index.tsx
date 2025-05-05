import { create } from "zustand"
import { AppearenceProps } from "../../types/appearence.type"

interface AppearenceStoreProps extends AppearenceProps {
  setTheme: (theme: "Light" | "Dark") => void
  setFontSizeOption: (fontSizeOption: "Small" | "Medium" | "Large") => void
  setShowDateHome: (showDateHome: "Yes" | "No") => void
}

export const useAppearenceStore = create<AppearenceStoreProps>((set) => ({
  theme: "Light",
  setTheme: (theme) => {
    set(() => ({ theme }))
  },
  fontSizeOption: "Medium",
  setFontSizeOption: (fontSizeOption) => {
    set(() => ({ fontSizeOption }))
  },
  showDateHome: "Yes",
  setShowDateHome: (showDateHome) => {
    set(() => ({ showDateHome }))
  },
}))
