import { Pressable, ScrollView, Text, View } from "react-native"
import Header from "../../components/header"
import { useColors } from "../../theme/colors"
import { Ionicons } from "@expo/vector-icons"
import { useFontSize, useIconSize } from "../../theme/size"
import { fontFamily } from "../../theme/fontFamily"
import React from "react"
import { useAppearenceStore } from "../../store/appearanceStore"
import { storeDataAppearence } from "../../storage/appearence"
import { useUserInfoStore } from "../../store/userStore"

const Appearance = () => {
  const colors = useColors()
  const iconSize = useIconSize()
  const fontSize = useFontSize()
  const {
    theme,
    setTheme,
    fontSizeOption,
    setFontSizeOption,
    showDateHome,
    setShowDateHome,
  } = useAppearenceStore()
  const { user } = useUserInfoStore()

  interface ContainerCustomProps {
    children: React.ReactNode
    title: string
  }

  function ContainerCustom({ children, title }: ContainerCustomProps) {
    return (
      <View className="my-2">
        <Text
          style={{
            fontFamily: fontFamily.regular,
            fontSize: fontSize.regular,
            color: colors.black,
          }}
          className="ml-2"
        >
          {title}
        </Text>
        <View className="my-2 flex flex-row gap-4">{children}</View>
      </View>
    )
  }

  interface ButtonOptionProps {
    text: string
    onPress: () => void
    type: "theme" | "fontSizeOption" | "showDateHome"
  }
  const ButtonOption = ({ text, onPress, type }: ButtonOptionProps) => {
    return (
      <Pressable
        style={[
          type === "theme" && {
            borderColor:
              theme === text ? colors.primary : colors.borderColorLight,
          },
          type === "fontSizeOption" && {
            borderColor:
              fontSizeOption === text
                ? colors.primary
                : colors.borderColorLight,
          },
          type === "showDateHome" && {
            borderColor:
              showDateHome === text ? colors.primary : colors.borderColorLight,
          },
          { borderWidth: 1 },
        ]}
        className="flex items-center rounded-lg py-2 flex-1"
        onPress={onPress}
      >
        <Text
          style={{
            fontFamily: fontFamily.regular,
            fontSize: fontSize.regular,
            color: colors.black,
          }}
        >
          {text}
        </Text>
      </Pressable>
    )
  }

  const onPressButtonFunc = (
    type: "theme" | "fontSizeOption" | "showDateHome",
    value: string
  ) => {
    if (type === "theme") {
      if (value === "Light" || value === "Dark") {
        if (value === "Light" && theme !== "Light") {
          setTheme("Light")
        }
        if (value === "Dark" && theme !== "Dark") {
          setTheme("Dark")
        }

        storeDataAppearence(user.uid, {
          theme: value,
          fontSizeOption: fontSizeOption,
          showDateHome: showDateHome,
        })
      }
    }

    if (type === "fontSizeOption") {
      if (value === "Small" || value === "Medium" || value === "Large") {
        if (value === "Small" && fontSizeOption !== "Small") {
          setFontSizeOption("Small")
        }
        if (value === "Medium" && fontSizeOption !== "Medium") {
          setFontSizeOption("Medium")
        }
        if (value === "Large" && fontSizeOption !== "Large") {
          setFontSizeOption("Large")
        }

        storeDataAppearence(user.uid, {
          theme: theme,
          fontSizeOption: value,
          showDateHome: showDateHome,
        })
      }
    }

    if (type === "showDateHome") {
      if (value === "No" || value === "Yes") {
        if (value === "No" && showDateHome !== "No") {
          setShowDateHome("No")
        }
        if (value === "Yes" && showDateHome !== "Yes") {
          setShowDateHome("Yes")
        }

        storeDataAppearence(user.uid, {
          theme: theme,
          fontSizeOption: fontSizeOption,
          showDateHome: value,
        })
      }
    }
  }

  return (
    <>
      <Header backgroundColor={colors.background} />
      <ScrollView
        style={{ backgroundColor: colors.background }}
        className="flex-1 px-4"
      >
        <Ionicons
          name="brush-outline"
          color={colors.primary}
          size={iconSize.large}
          className="self-center mt-10"
        />
        <Text
          className="self-center mb-10 mt-4"
          style={{
            fontFamily: fontFamily.semiBold,
            fontSize: fontSize.large,
            color: colors.black,
          }}
        >
          Appearance
        </Text>

        <ContainerCustom title="App theme:">
          <ButtonOption
            text="Light"
            type="theme"
            onPress={() => onPressButtonFunc("theme", "Light")}
          />
          <ButtonOption
            text="Dark"
            type="theme"
            onPress={() => onPressButtonFunc("theme", "Dark")}
          />
        </ContainerCustom>

        <ContainerCustom title="Font size:">
          <ButtonOption
            text="Small"
            type="fontSizeOption"
            onPress={() => onPressButtonFunc("fontSizeOption", "Small")}
          />
          <ButtonOption
            text="Medium"
            type="fontSizeOption"
            onPress={() => onPressButtonFunc("fontSizeOption", "Medium")}
          />
          <ButtonOption
            text="Large"
            type="fontSizeOption"
            onPress={() => onPressButtonFunc("fontSizeOption", "Large")}
          />
        </ContainerCustom>

        <ContainerCustom title="Show date on home:">
          <ButtonOption
            text="No"
            type="showDateHome"
            onPress={() => onPressButtonFunc("showDateHome", "No")}
          />
          <ButtonOption
            text="Yes"
            type="showDateHome"
            onPress={() => onPressButtonFunc("showDateHome", "Yes")}
          />
        </ContainerCustom>
      </ScrollView>
    </>
  )
}

export default Appearance
