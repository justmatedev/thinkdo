import { Pressable, Text } from "react-native"
import React, { useState } from "react"
import { useColors } from "../../theme/colors"
import { Ionicons } from "@expo/vector-icons"
import { useFontSize, useIconSize } from "../../theme/size"
import { fontFamily } from "../../theme/fontFamily"
import { useNavigation } from "@react-navigation/native"
import { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { StackParamList } from "../../routes/app.routes"

interface ItemProps {
  data?: string
  action?: (tag: string) => void
  activeTags?: string[]
}
const Item = ({ data, action, activeTags }: ItemProps) => {
  const colors = useColors()
  const iconSize = useIconSize()
  const fontSize = useFontSize()
  const navigation = useNavigation<NativeStackNavigationProp<StackParamList>>()
  const [isPressed, setIsPressed] = useState(false)

  return (
    <Pressable
      className={`rounded-lg h-9 justify-center transition-opacity duration-100 pt-0.5
        ${isPressed && action ? "opacity-50" : "opacity-100"}
        ${!action && !data ? "mr-0" : "mr-2"}
        `}
      style={{
        backgroundColor: colors.secondary,
        borderWidth: 1,
        borderColor:
          data && activeTags?.includes(data)
            ? colors.primary
            : colors.borderColorLight,
      }}
      onPress={() => {
        if (action && data) {
          action(data)
        } else {
          navigation.navigate("tags")
        }
      }}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
    >
      {data ? (
        <Text
          style={{
            fontFamily: fontFamily.regular,
            fontSize: fontSize.small,
            color: colors.black,
          }}
          className="px-3 py-1"
        >
          #{data}
        </Text>
      ) : (
        <Ionicons
          color={colors.primary}
          name="add-outline"
          size={iconSize.small}
          className="px-3"
        />
      )}
    </Pressable>
  )
}

export default Item
