import { useAppearenceStore } from "../store/appearanceStore"

interface SizeProps {
  small: number
  regular: number
  large: number
  extraLarge: number
}

export const useIconSize = () => {
  const { fontSizeOption } = useAppearenceStore()

  const iconSize: SizeProps = {
    small:
      fontSizeOption === "Small" ? 20 : fontSizeOption === "Medium" ? 22 : 24,
    regular:
      fontSizeOption === "Small" ? 22 : fontSizeOption === "Medium" ? 24 : 26,
    large:
      fontSizeOption === "Small" ? 24 : fontSizeOption === "Medium" ? 26 : 28,
    extraLarge:
      fontSizeOption === "Small" ? 26 : fontSizeOption === "Medium" ? 28 : 30,
  }

  return iconSize
}

export const useFontSize = () => {
  const { fontSizeOption } = useAppearenceStore()

  const fontSize: SizeProps = {
    small:
      fontSizeOption === "Small" ? 10 : fontSizeOption === "Medium" ? 12 : 14,
    regular:
      fontSizeOption === "Small" ? 12 : fontSizeOption === "Medium" ? 14 : 16,
    large:
      fontSizeOption === "Small" ? 14 : fontSizeOption === "Medium" ? 16 : 18,
    extraLarge:
      fontSizeOption === "Small" ? 14 : fontSizeOption === "Medium" ? 18 : 20,
  }

  return fontSize
}
