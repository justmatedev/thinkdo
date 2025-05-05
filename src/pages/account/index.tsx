import { View, Text, ScrollView } from "react-native"
import React, { useState } from "react"
import { Ionicons } from "@expo/vector-icons"
import { useColors } from "../../theme/colors"
import { useFontSize, useIconSize } from "../../theme/size"
import { fontFamily } from "../../theme/fontFamily"
import Header from "../../components/header"
import Input from "../../components/input"
import { useUserInfoStore } from "../../store/userStore"
import Button from "../../components/button"
import { useModalStore } from "../../store/modalStore"
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updateEmail,
  updatePassword,
  updateProfile,
} from "firebase/auth"
import { auth } from "../../services/firebase"
import { UserActiveProps } from "../../types/userActive.type"
import { useErrors } from "../../errors/firebase"
import { FirebaseError } from "firebase/app"

const Account = () => {
  const colors = useColors()
  const iconSize = useIconSize()
  const fontSize = useFontSize()
  const { user, setUser } = useUserInfoStore()
  const { showModal, modalStyle, setModalAction, hideModal } = useModalStore()
  const { errorsLogin, errorsEmail } = useErrors()

  const [name, setName] = useState(user.displayName ? user.displayName : "")
  const [email, setEmail] = useState(user.email ? user.email : "")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const mainFunc = () => {
    showModal(colors.background)

    if (name !== user.displayName || email !== user.email || password !== "") {
      let hasToChangeName = false
      if (name !== user.displayName) {
        hasToChangeName = true
      }

      let hasToChangeEmail = false
      if (email !== user.email) {
        hasToChangeEmail = true
        const reg = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        const trueEmail = reg.test(String(email).toLowerCase())
        if (!trueEmail) {
          modalStyle("Invalid email", "ok")
          setModalAction(hideModal)
          return
        }
      }

      let hasToChangePassword = false
      if (password !== "") {
        hasToChangePassword = true
        if (password.length <= 5) {
          modalStyle("Password shorter than 6 characters", "ok")
          setModalAction(hideModal)
          return
        } else if (password !== confirmPassword) {
          modalStyle("Password and Confirm password does not match", "ok")
          setModalAction(hideModal)
          return
        }
      }

      let whatChange = ""
      if (hasToChangeName && hasToChangeEmail && hasToChangePassword) {
        whatChange = "name, email and password"
        setModalAction(updateEmailPasswordAndName)
      } else if (hasToChangeName && hasToChangeEmail) {
        whatChange = "name and email"
        setModalAction(updateEmailAndName)
      } else if (hasToChangeName && hasToChangePassword) {
        whatChange = "name and password"
        setModalAction(updatePasswordAndName)
      } else if (hasToChangeEmail && hasToChangePassword) {
        whatChange = "email and password"
        setModalAction(updateEmailAndPassword)
      } else if (hasToChangeName) {
        whatChange = "name"
        setModalAction(updateNameOnly)
      } else if (hasToChangeEmail) {
        whatChange = "email"
        setModalAction(updateEmailOnly)
      } else if (hasToChangePassword) {
        whatChange = "password"
        setModalAction(updatePasswordOnly)
      }

      if (whatChange !== "name") {
        modalStyle(`Confirm your password to change: ${whatChange}`, "password")
      } else {
        modalStyle("Confirm to change: name", "yes/no")
      }
    } else {
      modalStyle("Nothing to change", "ok")
      setModalAction(hideModal)
    }
  }

  const updateEmailPasswordAndName = async (currentInputValue: string) => {
    const reauthenticated = await reauthenticateUser(currentInputValue)

    if (reauthenticated && auth.currentUser) {
      setModalAction(hideModal)
      const returnNameFunc = await updateNameFunc()
      if (returnNameFunc !== true) {
        modalStyle("Something wrong with the name", "ok")
        return
      }

      const returnEmailFunc = await updateEmailFunc()
      if (returnEmailFunc !== true) {
        modalStyle("Something wrong with the email", "ok")
        return
      }

      const returnPassFunc = await updatePasswordFunc()
      if (returnPassFunc !== true) {
        modalStyle("Something wrong with the password", "ok")
        return
      }

      const newUser: UserActiveProps = {
        displayName: name,
        email: email,
        emailVerified: user.emailVerified,
        uid: user.uid,
      }
      setUser(newUser)

      modalStyle("Name, email, and password have been changed!", "ok")
    }
  }

  const updatePasswordAndName = async (currentInputValue: string) => {
    const reauthenticated = await reauthenticateUser(currentInputValue)

    if (reauthenticated && auth.currentUser) {
      setModalAction(hideModal)
      const returnNameFunc = await updateNameFunc()
      if (returnNameFunc !== true) {
        modalStyle("Something wrong with the name", "ok")
        return
      }

      const returnPassFunc = await updatePasswordFunc()
      if (returnPassFunc !== true) {
        modalStyle("Something wrong with the pass", "ok")
        return
      }

      const newUser: UserActiveProps = {
        displayName: name,
        email: user.email,
        emailVerified: user.emailVerified,
        uid: user.uid,
      }
      setUser(newUser)
      modalStyle("Name and password have been changed!", "ok")
    }
  }

  const updateEmailAndName = async (currentInputValue: string) => {
    const reauthenticated = await reauthenticateUser(currentInputValue)

    if (reauthenticated && auth.currentUser) {
      setModalAction(hideModal)
      const returnNameFunc = await updateNameFunc()
      if (returnNameFunc !== true) {
        modalStyle("Something wrong with the name", "ok")
        return
      }

      const returnEmailFunc = await updateEmailFunc()
      if (returnEmailFunc !== true) {
        modalStyle("Something wrong with the email", "ok")
        return
      }

      const newUser: UserActiveProps = {
        displayName: name,
        email: email,
        emailVerified: user.emailVerified,
        uid: user.uid,
      }
      setUser(newUser)

      modalStyle("Name and email have been changed!", "ok")
    }
  }

  const updateEmailAndPassword = async (currentInputValue: string) => {
    const reauthenticated = await reauthenticateUser(currentInputValue)

    if (reauthenticated && auth.currentUser) {
      setModalAction(hideModal)
      const returnEmailFunc = await updateEmailFunc()
      if (returnEmailFunc !== true) {
        modalStyle("Something wrong with the email", "ok")
        return
      }

      const returnPassFunc = await updatePasswordFunc()
      if (returnPassFunc !== true) {
        modalStyle("Something wrong with the pass", "ok")
        return
      }

      const newUser: UserActiveProps = {
        displayName: user.displayName,
        email: email,
        emailVerified: user.emailVerified,
        uid: user.uid,
      }
      setUser(newUser)
      modalStyle("Email and password have been changed!", "ok")
    }
  }

  const updatePasswordOnly = async (currentInputValue: string) => {
    const reauthenticated = await reauthenticateUser(currentInputValue)

    if (reauthenticated && auth.currentUser) {
      const returnPassFunc = await updatePasswordFunc()
      if (returnPassFunc === true) {
        modalStyle("Password changed!", "ok")
        setModalAction(hideModal)
      }
    }
  }

  const updateEmailOnly = async (currentInputValue: string) => {
    const reauthenticated = await reauthenticateUser(currentInputValue)

    if (reauthenticated && auth.currentUser) {
      const returnEmailFunc = await updateEmailFunc()
      if (returnEmailFunc === true) {
        modalStyle("Email changed!", "ok")
        setModalAction(hideModal)
        const newUser: UserActiveProps = {
          displayName: user.displayName,
          email: email,
          emailVerified: user.emailVerified,
          uid: user.uid,
        }
        setUser(newUser)
      }
    }
  }

  const updateNameOnly = async () => {
    const returnNameFunc = await updateNameFunc()
    if (returnNameFunc === true) {
      modalStyle("Name changed!", "ok")
      setModalAction(hideModal)
      const newUser: UserActiveProps = {
        displayName: name,
        email: user.email,
        emailVerified: user.emailVerified,
        uid: user.uid,
      }
      setUser(newUser)
    }
  }

  const reauthenticateUser = async (currentInputValue: string) => {
    if (auth.currentUser?.email) {
      const credential = EmailAuthProvider.credential(
        auth.currentUser.email,
        currentInputValue
      )

      try {
        await reauthenticateWithCredential(auth.currentUser, credential)
        return true
      } catch (error) {
        if (error instanceof FirebaseError) {
          errorsLogin(error.code)
          return false
        }
      }
    }
  }

  const updatePasswordFunc = async () => {
    try {
      if (auth.currentUser) {
        await updatePassword(auth.currentUser, password)
        setPassword("")
        setConfirmPassword("")
        return true
      }
    } catch (error) {
      if (error instanceof FirebaseError) {
        return error.code
      }
    }
  }

  const updateEmailFunc = async () => {
    try {
      if (auth.currentUser) {
        await updateEmail(auth.currentUser, email)
        return true
      }
    } catch (error) {
      if (error instanceof FirebaseError) {
        errorsEmail(error.code)
        return false
      }
    }
  }

  const updateNameFunc = async () => {
    try {
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, {
          displayName: name,
        })
        return true
      }
    } catch (error) {
      if (error instanceof FirebaseError) {
        return error.code
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
          name="person-outline"
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
          Account
        </Text>

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
            icon
            iconName={showPassword ? "eye-outline" : "eye-off-outline"}
            action={() => setShowPassword(!showPassword)}
            secureTextEntry={!showPassword}
            label="Password"
            placeholder="Password..."
          />
        </View>

        <View className="my-4">
          <Input
            value={confirmPassword}
            onChangeText={(text) => setConfirmPassword(text)}
            icon
            iconName={showConfirmPassword ? "eye-outline" : "eye-off-outline"}
            action={() => setShowConfirmPassword(!showConfirmPassword)}
            secureTextEntry={!showConfirmPassword}
            label="Confirm password"
            placeholder="Confirm password..."
          />
        </View>

        <Button
          backgroundColor={colors.primary}
          textColor={colors.white}
          title="Confirm changes"
          onPress={mainFunc}
        />
      </ScrollView>
    </>
  )
}

export default Account
