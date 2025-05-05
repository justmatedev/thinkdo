import {
  Keyboard,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  View,
} from "react-native"
import React, { useEffect, useState } from "react"
import { useIsFocused, useNavigation } from "@react-navigation/native"
import { StackParamList } from "../../routes/app.routes"
import { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { useModalStore } from "../../store/modalStore"
import {
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
} from "firebase/auth"
import { auth } from "../../services/firebase"
import Button from "../../components/button"
import { UserActiveProps } from "../../types/userActive.type"
import { useEnterUser } from "../../scripts/enterUser"
import SvgLogo from "../../components/svgLogo"
import navigationBarColor from "../../scripts/navigationBarColor"
import { useColors } from "../../theme/colors"
import Input from "../../components/input"
import { useErrors } from "../../errors/firebase"
import { fontFamily } from "../../theme/fontFamily"
import { useFontSize } from "../../theme/size"
import HalfClouds from "../../components/halfClouds"

const SignIn = () => {
  const colors = useColors()
  const fontSize = useFontSize()
  const navigation = useNavigation<NativeStackNavigationProp<StackParamList>>()
  const { showModal, modalStyle, setModalAction, hideModal } = useModalStore()
  const { enterUser } = useEnterUser()
  const { errorsLogin } = useErrors()
  const isFocused = useIsFocused()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [btnLoading, setBtnLoading] = useState(false)

  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false)

  useEffect(() => {
    if (isFocused) {
      navigationBarColor(colors.primary)
    }
  }, [isFocused])

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      () => setIsKeyboardVisible(true)
    )
    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      () => setIsKeyboardVisible(false)
    )

    return () => {
      keyboardDidShowListener.remove()
      keyboardDidHideListener.remove()
    }
  }, [])

  const login = async () => {
    if (email && password) {
      const reg = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      const trueEmail = reg.test(String(email).toLowerCase())

      if (!trueEmail) {
        showModal(colors.background)
        modalStyle("Invalid email", "ok")
        setModalAction(hideModal)
        return
      }

      setBtnLoading(true)
      await signInWithEmailAndPassword(auth, email, password)
        .then(async (user) => {
          const userLogged: UserActiveProps = {
            displayName: user.user.displayName,
            email: user.user.email,
            emailVerified: user.user.emailVerified,
            uid: user.user.uid,
          }
          await enterUser(userLogged)
        })
        .catch((error) => {
          showModal(colors.background)
          errorsLogin(error.code)
        })
      setBtnLoading(false)
    } else {
      showModal(colors.background)
      if (!email) {
        modalStyle("Email not filled", "ok")
      } else {
        modalStyle("Password not filled", "ok")
      }
      setModalAction(hideModal)
    }
  }

  const forgotPassword = async (currentInputValue: string) => {
    if (currentInputValue) {
      const reg = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      const trueEmail = reg.test(String(currentInputValue).toLowerCase())
      if (!trueEmail) {
        modalStyle("Invalid email", "ok")
        setModalAction(hideModal)
        return
      }

      await sendPasswordResetEmail(auth, currentInputValue)
        .then(() => {
          modalStyle("Email sent successfully!", "ok")
          setModalAction(hideModal)
        })
        .catch((error) => {
          if (error.code === "auth/user-not-found") {
            modalStyle("User email not found", "ok")
            setModalAction(hideModal)
          }
        })
    }
  }

  return (
    <>
      <StatusBar
        translucent={true}
        barStyle="light-content"
        backgroundColor="transparent"
      />
      <View className="flex-1" style={{ backgroundColor: colors.background }}>
        <View
          style={{
            backgroundColor: colors.primary,
            height: StatusBar.currentHeight,
          }}
        />
        {!isKeyboardVisible && <HalfClouds />}

        <ScrollView className="p-10">
          <View className="self-center mt-10">
            <SvgLogo aspectRatio={0.07} />
          </View>

          <View className="mt-20">
            <Input
              value={email}
              onChangeText={(text) => setEmail(text)}
              label="Email"
              placeholder="Email..."
            />
          </View>
          <View className="mt-4">
            <Input
              value={password}
              onChangeText={(text) => setPassword(text)}
              label="Password"
              icon
              iconName={showPassword ? "eye-outline" : "eye-off-outline"}
              action={() => setShowPassword(!showPassword)}
              secureTextEntry={!showPassword}
              placeholder="Password..."
            />
          </View>

          <Pressable
            onPress={() => {
              showModal(colors.background)
              modalStyle("Enter your email to send the password reset", "input")
              setModalAction(forgotPassword)
            }}
          >
            <Text
              style={{
                fontFamily: fontFamily.regular,
                fontSize: fontSize.regular,
                color: colors.primary,
              }}
              className="underline mt-2 mb-4"
            >
              Forgot password?
            </Text>
          </Pressable>

          <Button
            title="Login"
            onPress={btnLoading ? null : login}
            backgroundColor={colors.primary}
            textColor={colors.white}
            loading={btnLoading}
          />

          <Pressable onPress={() => navigation.navigate("signup")}>
            <View className="flex-row gap-2 mt-2 justify-center">
              <Text
                style={{
                  fontFamily: fontFamily.regular,
                  fontSize: fontSize.regular,
                  color: colors.black,
                }}
              >
                Don't have account?
              </Text>
              <Text
                style={{
                  fontFamily: fontFamily.regular,
                  fontSize: fontSize.regular,
                  color: colors.primary,
                }}
                className="underline"
              >
                Sign up
              </Text>
            </View>
          </Pressable>
        </ScrollView>

        {!isKeyboardVisible && <HalfClouds bottom />}
      </View>
    </>
  )
}

export default SignIn
