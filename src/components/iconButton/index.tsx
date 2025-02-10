import { Pressable, PressableProps } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useState } from "react"

interface IconButtonProps extends PressableProps {
  iconName: keyof typeof Ionicons.glyphMap
  iconColor: string
  iconSize: number
  full?: boolean
  background?: string
  className?: string
  notTransparency?: boolean
}

const IconButton = ({
  iconName,
  iconColor,
  iconSize,
  full,
  background,
  className,
  notTransparency = false,
  ...rest
}: IconButtonProps) => {
  const [isPressed, setIsPressed] = useState(false)

  return (
    <Pressable
      {...rest}
      className={`items-center justify-center h-12 rounded-lg 
        ${isPressed && !notTransparency ? "opacity-50" : "opacity-100"}
        ${full ? "w-full" : "w-12"}
        ${
          notTransparency
            ? "transition-none duration-0"
            : "transition-opacity duration-100"
        }
        ${className}`}
      style={{ backgroundColor: background }}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
    >
      <Ionicons name={iconName} color={iconColor} size={iconSize} />
    </Pressable>
  )
}

export default IconButton
