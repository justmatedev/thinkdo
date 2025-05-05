import { TextInput, TextInputProps } from "react-native"
import React from "react"
import { useColors } from "../../../theme/colors"

interface InputProps extends TextInputProps {
  fontFamily: string
  fontSize: number
  expand?: boolean
}

const Input = ({ fontFamily, fontSize, expand, ...rest }: InputProps) => {
  const colors = useColors()
  return (
    <TextInput
      {...rest}
      style={{
        fontFamily: fontFamily,
        fontSize: fontSize,
        color: colors.black,
      }}
      cursorColor={colors.primaryAlfa}
      selectionColor={colors.primaryAlfa}
      placeholderTextColor={colors.placeHolder}
    />
  )
}

export default Input
