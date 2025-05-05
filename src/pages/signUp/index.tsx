import {
  View,
  Text,
  ScrollView,
  Pressable,
  Keyboard,
  StatusBar,
} from "react-native"
import React, { useEffect, useState } from "react"
import { useModalStore } from "../../store/modalStore"
import { useColors } from "../../theme/colors"
import SvgLogo from "../../components/svgLogo"
import Input from "../../components/input"
import { useNavigation } from "@react-navigation/native"
import { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { StackParamList } from "../../routes/app.routes"
import Button from "../../components/button"
import { fontFamily } from "../../theme/fontFamily"
import { useFontSize } from "../../theme/size"
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth"
import { auth, db } from "../../services/firebase"
import { doc, setDoc } from "firebase/firestore"
import { UserActiveProps } from "../../types/userActive.type"
import { useEnterUser } from "../../scripts/enterUser"
import HalfClouds from "../../components/halfClouds"

const SignUp = () => {
  const colors = useColors()
  const fontSize = useFontSize()
  const navigation = useNavigation<NativeStackNavigationProp<StackParamList>>()
  const { showModal, modalStyle, setModalAction, hideModal } = useModalStore()
  const { enterUser } = useEnterUser()

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [btnLoading, setBtnLoading] = useState(false)

  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false)

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

  const createUser = () => {
    if (name && email && password && confirmPassword) {
      const reg = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      const trueEmail = reg.test(String(email).toLowerCase())

      if (!trueEmail) {
        showModal(colors.background)
        modalStyle("Invalid email", "ok")
        setModalAction(hideModal)
        return
      }

      if (password.length <= 5) {
        showModal(colors.background)
        modalStyle("Password shorter than 6 characters", "ok")
        setModalAction(hideModal)
        return
      }
      if (password !== confirmPassword) {
        showModal(colors.background)
        modalStyle("Password and Confirm password does not match", "ok")
        setModalAction(hideModal)
        return
      }

      setBtnLoading(true)
      createUserWithEmailAndPassword(auth, email, password).then(
        async (userCredential) => {
          if (auth.currentUser) {
            updateProfile(auth.currentUser, {
              displayName: name,
            })
          }

          await setDoc(doc(db, "userData", userCredential.user.uid), {
            tags: [],
            LastTimeSendVerifiedEmail: null,
            syncTime: null,
            theme: "Light",
            fontSizeOption: "Large",
            showDateHome: "Yes",
          })

          signInWithEmailAndPassword(auth, email, password).then(
            async (userCredential) => {
              const userLogged: UserActiveProps = {
                displayName: userCredential.user.displayName,
                email: userCredential.user.email,
                emailVerified: userCredential.user.emailVerified,
                uid: userCredential.user.uid,
              }
              await enterUser(userLogged)
              navigation.navigate("home")
              setBtnLoading(false)
            }
          )
        }
      )
    } else {
      showModal(colors.background)
      modalStyle("Fill in all fields to register", "ok")
      setModalAction(hideModal)
    }
  }

  return (
    <>
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

          <Input
            value={name}
            onChangeText={(text) => setName(text)}
            label="Name"
            placeholder="Name..."
          />

          <View className="mt-4">
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

          <View className="mt-4 mb-8">
            <Input
              value={confirmPassword}
              onChangeText={(text) => setConfirmPassword(text)}
              label="Confirm password"
              icon
              iconName={showConfirmPassword ? "eye-outline" : "eye-off-outline"}
              action={() => setShowConfirmPassword(!showConfirmPassword)}
              secureTextEntry={!showConfirmPassword}
              placeholder="Confirm password..."
            />
          </View>

          <Button
            title="Register"
            onPress={btnLoading ? null : createUser}
            backgroundColor={colors.primary}
            textColor={colors.white}
            loading={btnLoading}
          />

          <Pressable
            onPress={() => navigation.navigate("signin")}
            className="mb-10"
          >
            <View className="flex-row gap-2 mt-2 justify-center">
              <Text
                style={{
                  fontFamily: fontFamily.regular,
                  fontSize: fontSize.regular,
                  color: colors.black,
                }}
              >
                Already have a account?
              </Text>
              <Text
                style={{
                  fontFamily: fontFamily.regular,
                  fontSize: fontSize.regular,
                  color: colors.primary,
                }}
                className="underline"
              >
                Sign in
              </Text>
            </View>
          </Pressable>
        </ScrollView>
        {!isKeyboardVisible && <HalfClouds bottom />}
      </View>
    </>
  )
}

export default SignUp
