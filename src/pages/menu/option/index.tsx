import { View, Text, Pressable } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { fontSize, iconSize } from "../../../theme/size"
import { colors } from "../../../theme/colors"
import { fontFamily } from "../../../theme/fontFamily"
import { useState } from "react"
import { formatDateToShow } from "../../../scripts/formatDate"
import { useSyncStore } from "../../../store/syncStore"

interface OptionProps {
  title: string
  action: () => void
  iconName: keyof typeof Ionicons.glyphMap
  showSyncTime?: boolean
}
const Option = ({ action, title, iconName, showSyncTime }: OptionProps) => {
  const { syncTimeFirebase } = useSyncStore()
  const [isPressed, setIsPressed] = useState(false)

  return (
    <Pressable
      onPress={action}
      className={`flex-row w-full items-center p-3 rounded-xl justify-between
      ${isPressed ? "opacity-50" : "opacity-100"}
      `}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      style={{
        borderColor: colors.borderColorLight,
        borderWidth: 1,
      }}
    >
      <View className="flex-row items-center">
        <Ionicons
          name={iconName}
          size={iconSize.regular}
          color={title === "Logout" ? colors.alert : colors.primary}
        />
        <Text
          className="ml-3"
          style={{
            fontFamily: fontFamily.regular,
            fontSize: fontSize.regular,
            color: title === "Logout" ? colors.alert : colors.primary,
          }}
        >
          {title}
        </Text>
      </View>
      {showSyncTime && syncTimeFirebase && (
        <Text
          style={{ fontFamily: fontFamily.regular, fontSize: fontSize.small }}
        >
          Last sync: {formatDateToShow(syncTimeFirebase)}
        </Text>
      )}
    </Pressable>
  )
}

export default Option
