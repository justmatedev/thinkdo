import { Text, Pressable, PressableProps } from "react-native"
import React, { useState } from "react"
import { useColors } from "../../theme/colors"
import Loading from "../loading"
import { fontFamily } from "../../theme/fontFamily"
import { useFontSize } from "../../theme/size"

interface PresseProps extends PressableProps {
  title: string
  backgroundColor: string
  textColor: string
  border?: boolean
  loading?: boolean
}

const Button = ({
  title,
  backgroundColor,
  textColor,
  border,
  loading,
  ...rest
}: PresseProps) => {
  const colors = useColors()
  const fontSize = useFontSize()
  const [isPressed, setIsPressed] = useState(false)

  return (
    <Pressable
      className={`transition-opacity duration-100 items-center justify-center px-4 py-2 flex-1 rounded-lg
            ${isPressed ? "opacity-50" : "opacity-100"}`}
      onPressIn={() => {
        if (!loading) {
          setIsPressed(true)
        }
      }}
      onPressOut={() => setIsPressed(false)}
      style={{
        backgroundColor: backgroundColor,
        borderColor: border ? colors.borderColorLight : "transparent",
        borderWidth: border ? 1 : 0,
      }}
      {...rest}
    >
      {loading ? (
        <Loading color={textColor} />
      ) : (
        <Text
          style={{
            color: textColor,
            fontFamily: fontFamily.regular,
            fontSize: fontSize.regular,
          }}
        >
          {title}
        </Text>
      )}
    </Pressable>
  )
}

export default Button
