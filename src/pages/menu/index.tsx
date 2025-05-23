import { Linking, Pressable, ScrollView, Text, View } from "react-native"
import React from "react"
import { useColors } from "../../theme/colors"
import { useNavigation } from "@react-navigation/native"
import { fontFamily } from "../../theme/fontFamily"
import { useFontSize, useIconSize } from "../../theme/size"
import { Ionicons } from "@expo/vector-icons"
import { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { StackParamList } from "../../routes/app.routes"
import Option from "./option"
import Header from "../../components/header"
import { useModalStore } from "../../store/modalStore"
import { useSyncFirebase } from "../../scripts/syncFirebase"
import { signOut } from "firebase/auth"
import { auth } from "../../services/firebase"
import { useUserInfoStore } from "../../store/userStore"
import SvgLogo from "../../components/svgLogo"
import { useNoteStore } from "../../store/noteStore"
import { UserActiveProps } from "../../types/userActive.type"
import { useTagsStore } from "../../store/tagsStore"
import { useAppearenceStore } from "../../store/appearanceStore"

const Menu = () => {
  const colors = useColors()
  const iconSize = useIconSize()
  const fontSize = useFontSize()
  const { setTheme, setFontSizeOption, setShowDateHome } = useAppearenceStore()

  const navigation = useNavigation<NativeStackNavigationProp<StackParamList>>()
  const { showModal, setModalAction, modalStyle, hideModal } = useModalStore()
  const { sync } = useSyncFirebase()
  const { user, setUser } = useUserInfoStore()
  const { clearNotes } = useNoteStore()
  const { clearTags } = useTagsStore()

  const syncFunc = async () => {
    await sync(user.uid)
    hideModal()
  }

  const logoutFunc = async () => {
    await logout()
    hideModal()
  }

  const logout = async () => {
    await signOut(auth).then(() => {
      const clearUser: UserActiveProps = {
        displayName: "",
        email: "",
        emailVerified: false,
        uid: "",
      }
      setUser(clearUser)
      setTheme("Light")
      setFontSizeOption("Medium")
      setShowDateHome("Yes")
      clearNotes()
      clearTags()
      navigation.navigate("signin")
    })
  }

  const openGithub = () => {
    const url = "https://github.com/justmatedev/thinkdo"
    Linking.openURL(url)
  }

  const openEmail = () => {
    const url = "mailto:justmatedev@gmail.com"
    Linking.openURL(url)
  }

  return (
    <>
      <Header backgroundColor={colors.background} />
      <ScrollView style={{ backgroundColor: colors.background }}>
        <View className="flex-1 items-center pt-10 px-4">
          <SvgLogo aspectRatio={0.07} />

          <View className="w-full mt-16 mb-10 gap-2">
            <Option
              title="Tags"
              action={() => navigation.navigate("tags")}
              iconName="pricetags-outline"
            />
            <Option
              title="Account"
              action={() => navigation.navigate("account")}
              iconName="person-outline"
            />
            <Option
              title="Appearance"
              action={() => navigation.navigate("appearance")}
              iconName="brush-outline"
            />
            <Option
              title="Sync"
              action={() => {
                showModal(colors.background)
                modalStyle(
                  "Do you want to sync your data to the cloud?",
                  "yes/no"
                )
                setModalAction(syncFunc)
              }}
              iconName="sync-outline"
              showSyncTime
            />
            <Option
              title="Logout"
              action={() => {
                showModal(colors.background)
                modalStyle("Do you really want to log out?", "alert")
                setModalAction(logoutFunc)
              }}
              iconName="log-out-outline"
            />
          </View>

          <Text
            style={{
              fontFamily: fontFamily.regular,
              fontSize: fontSize.regular,
              color: colors.black,
            }}
            className="mt-8 mb-1"
          >
            App Version: 1.1.2
          </Text>

          <Pressable
            className="flex-row items-center mb-2 h-10"
            onPress={openGithub}
          >
            <Text
              style={{
                fontFamily: fontFamily.regular,
                fontSize: fontSize.regular,
                color: colors.black,
              }}
              className="mr-2 pt-1"
            >
              Source Code:
            </Text>
            <Ionicons
              name="logo-github"
              color={colors.primary}
              size={iconSize.regular}
            />
          </Pressable>

          <Text
            style={{
              fontFamily: fontFamily.regular,
              fontSize: fontSize.small,
              color: colors.black,
            }}
            className="text-center my-2"
          >
            For any questions, errors, or suggestions, please email us at:
          </Text>

          <Pressable onPress={openEmail}>
            <Text
              style={{
                fontFamily: fontFamily.regular,
                fontSize: fontSize.regular,
                color: colors.primary,
              }}
              className="underline"
            >
              justmatedev@gmail.com
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </>
  )
}

export default Menu
