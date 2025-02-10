import { View, TextInput, TextInputProps, Text } from "react-native"
import React, { useState } from "react"
import { fontFamily } from "../../theme/fontFamily"
import { fontSize, iconSize } from "../../theme/size"
import { colors } from "../../theme/colors"
import IconButton from "../iconButton"
import { Ionicons } from "@expo/vector-icons"

interface InputProps extends TextInputProps {
  icon?: boolean
  action?: () => void
  iconName?: keyof typeof Ionicons.glyphMap
  noBorder?: boolean
  label?: string
}

const Input = ({
  icon,
  action,
  iconName,
  noBorder,
  label,
  ...rest
}: InputProps) => {
  const [isFocused, setIsFocused] = useState(false)

  return (
    <>
      {label && (
        <Text
          style={{ fontFamily: fontFamily.regular, fontSize: fontSize.regular }}
          className="left-1 mb-0"
        >
          {label}:
        </Text>
      )}
      <View
        style={{
          borderColor: isFocused ? colors.primary : colors.borderColorLight,
          borderWidth: noBorder ? 0 : 1,
        }}
        className="w-full rounded-lg flex-row items-center h-12"
      >
        <TextInput
          {...rest}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={{
            fontFamily: fontFamily.regular,
            fontSize: fontSize.regular,
          }}
          className="flex-1 pl-3 top-1"
          cursorColor={colors.primary}
          selectionColor={colors.primaryAlfa}
        />
        {icon && iconName && action && (
          <IconButton
            iconName={iconName}
            iconColor={colors.primary}
            iconSize={iconSize.regular}
            onPress={action}
          />
        )}
      </View>
    </>
  )
}

export default Input
