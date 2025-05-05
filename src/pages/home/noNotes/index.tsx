import { View, Text } from "react-native"
import React from "react"
import { useColors } from "../../../theme/colors"
import { fontFamily } from "../../../theme/fontFamily"
import { useFontSize } from "../../../theme/size"

const NoNotes = () => {
  const colors = useColors()
  const fontSize = useFontSize()
  return (
    <View className=" flex-1 items-center">
      <Text
        style={{
          fontFamily: fontFamily.regular,
          fontSize: fontSize.large,
          color: colors.black,
        }}
        className="my-10"
      >
        Create your first note...
      </Text>
      <View
        style={{ backgroundColor: colors.primary }}
        className="w-20 h-20 rounded-full opacity-50 mb-10"
      />

      <View
        style={{ backgroundColor: colors.primary }}
        className="w-14 h-14 rounded-full opacity-45 mb-9"
      />

      <View
        style={{ backgroundColor: colors.primary }}
        className="w-10 h-10 rounded-full opacity-40 mb-8"
      />

      <View
        style={{ backgroundColor: colors.primary }}
        className="w-6 h-6 rounded-full opacity-35 mb-7"
      />

      <View
        style={{ backgroundColor: colors.primary }}
        className="w-2 h-2 rounded-full opacity-30"
      />
    </View>
  )
}

export default NoNotes
