import { View, Text, StatusBar } from "react-native"
import { useFontSize, useIconSize } from "../../theme/size"
import { useColors } from "../../theme/colors"
import { useNavigation } from "@react-navigation/native"
import { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { StackParamList } from "../../routes/app.routes"
import IconButton from "../iconButton"
import { fontFamily } from "../../theme/fontFamily"
import { useUserInfoStore } from "../../store/userStore"
import SvgLogo from "../svgLogo"

interface HeaderProps {
  backgroundColor: string
  forHome?: boolean
}
const Header = ({ backgroundColor, forHome }: HeaderProps) => {
  const colors = useColors()
  const iconSize = useIconSize()
  const fontSize = useFontSize()

  const height = StatusBar.currentHeight
  const navigation = useNavigation<NativeStackNavigationProp<StackParamList>>()
  const { user } = useUserInfoStore()

  return (
    <View
      style={{
        paddingTop: height && height * 1.5,
        backgroundColor: backgroundColor,
      }}
      className="px-2"
    >
      {forHome ? (
        <View className="flex-row items-center justify-between pl-2">
          <View className="flex-row items-center">
            <SvgLogo aspectRatio={0.027} />
            <Text
              style={{
                fontFamily: fontFamily.regular,
                fontSize: fontSize.regular,
                color: colors.black,
              }}
              className="ml-4"
            >
              Hi, {user.displayName}
            </Text>
          </View>

          <IconButton
            iconColor={colors.primary}
            iconName="menu-outline"
            iconSize={iconSize.regular}
            onPress={() => navigation.navigate("menu")}
          />
        </View>
      ) : (
        <IconButton
          iconName="chevron-back-outline"
          iconColor={colors.primary}
          iconSize={iconSize.regular}
          onPress={() => navigation.goBack()}
        />
      )}
    </View>
  )
}

export default Header
