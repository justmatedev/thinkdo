import { View, TextInput, TextInputProps, Text } from "react-native"
import React, { useState } from "react"
import { fontFamily } from "../../theme/fontFamily"
import { useFontSize, useIconSize } from "../../theme/size"
import { useColors } from "../../theme/colors"
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
  const colors = useColors()
  const iconSize = useIconSize()
  const fontSize = useFontSize()
  const [isFocused, setIsFocused] = useState(false)

  return (
    <>
      {label && (
        <Text
          style={{
            fontFamily: fontFamily.regular,
            fontSize: fontSize.regular,
            color: colors.black,
          }}
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
        className="w-full rounded-lg flex-row items-center"
      >
        <TextInput
          {...rest}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={{
            fontFamily: fontFamily.regular,
            fontSize: fontSize.regular,
            color: colors.black,
          }}
          className="flex-1 pl-3 top-0.5 min-h-12"
          cursorColor={colors.primary}
          selectionColor={colors.primaryAlfa}
          placeholderTextColor={colors.placeHolder}
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
