import { Pressable, PressableProps } from "react-native"
import React from "react"
import { useColors } from "../../../theme/colors"

interface ColorCircleProps extends PressableProps {
  color: string
}
const ColorCircle = ({ color, ...rest }: ColorCircleProps) => {
  const colors = useColors()
  return (
    <Pressable
      style={{
        backgroundColor: color,
        borderColor: colors.borderColorLight,
        borderWidth: 1,
      }}
      className="w-9 h-9 rounded-full"
      {...rest}
    ></Pressable>
  )
}

export default ColorCircle
