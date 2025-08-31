import { useAppearenceStore } from "../store/appearanceStore"

interface ColorProps {
  primary: string
  primaryAlfa: string
  secondaryAlfa: string

  white: string
  black: string
  placeHolder: string

  background: string

  borderColorLight: string
  alert: string

  noteOptionsBackground: string

  noteColorRed: string
  noteColorOrange: string
  noteColorYellow: string
  noteColorGreen: string
  noteColorBlue: string
  noteColorIndigo: string
  noteColorViolet: string
}

export const useColors = () => {
  const { theme } = useAppearenceStore()

  const colors: ColorProps = {
    primary: theme === "Light" ? "#674CE8" : "#9277ff",
    primaryAlfa: theme === "Light" ? "#674CE899" : "#B7ABF499",
    secondaryAlfa: theme === "Light" ? "#f0facc99" : "#1E1E1E99",

    white: theme === "Light" ? "#EDEDED" : "#121212",
    black: theme === "Light" ? "#19191A" : "#E5E5E6",
    placeHolder: theme === "Light" ? "#6D706F" : "#A7A7AD",

    background: theme === "Light" ? "#f6fce3" : "#141414",

    borderColorLight:
      theme === "Light" ? "rgba(0,0,0,.1)" : "rgba(255,255,255,.1)",
    alert: theme === "Light" ? "#FF313B" : "#FA4646",

    noteOptionsBackground:
      theme === "Light" ? "rgba(255,255,255,.3)" : "rgba(0,0,0,.2)",

    noteColorRed: theme === "Light" ? "#EEBCBD" : "#731D1F",
    noteColorOrange: theme === "Light" ? "#EFDDBE" : "#B35D20",
    noteColorYellow: theme === "Light" ? "#EFEBBE" : "#b48a22",
    noteColorGreen: theme === "Light" ? "#DAEFBE" : "#436318",
    noteColorBlue: theme === "Light" ? "#BECEEF" : "#2952A6",
    noteColorIndigo: theme === "Light" ? "#C8BEEF" : "#362186",
    noteColorViolet: theme === "Light" ? "#D9BEEF" : "#481B6D",
  }

  return colors
}
