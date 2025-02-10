import { TextInput, TextInputProps } from "react-native"
import React from "react"
import { colors } from "../../../theme/colors"

interface InputProps extends TextInputProps {
  fontFamily: string
  fontSize: number
  expand?: boolean
}

const Input = ({ fontFamily, fontSize, expand, ...rest }: InputProps) => {
  return (
    <TextInput
      {...rest}
      style={{
        fontFamily: fontFamily,
        fontSize: fontSize,
      }}
      cursorColor={colors.primaryAlfa}
      selectionColor={colors.primaryAlfa}
    />
  )
}

export default Input
