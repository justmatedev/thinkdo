import React, { useState } from "react"
import { View, Text, Dimensions, Pressable } from "react-native"
import { useModalStore } from "../../store/modalStore"
import { fontFamily } from "../../theme/fontFamily"
import { fontSize } from "../../theme/size"
import Button from "../button"
import { colors } from "../../theme/colors"
import Input from "../input"

const overlayColor = "rgba(0, 0, 0, 0.5)"

export const ModalComponent = () => {
  const {
    isVisible,
    message,
    hideModal,
    backgroundColor,
    modalType,
    isLoading,
    executeModalAction,
    inputValue,
    setInputValue,
  } = useModalStore()

  const { width, height } = Dimensions.get("screen")
  const [showPassword, setShowPassword] = useState(false)

  return (
    <View
      className={`absolute z-10 transition-all delay-100 ${
        isVisible ? "flex" : "hidden"
      }`}
      style={{
        height: height,
        width: width,
        backgroundColor: overlayColor,
      }}
    >
      <Pressable
        onPress={hideModal}
        className="items-center justify-center"
        style={{
          height: height,
          width: width,
          backgroundColor: overlayColor,
        }}
      >
        <View
          style={{ backgroundColor: backgroundColor }}
          className="w-3/4 p-6 rounded-lg"
        >
          <Text
            style={{
              fontFamily: fontFamily.medium,
              fontSize: fontSize.regular,
            }}
          >
            {message}
          </Text>
          {modalType === "yes/no" && (
            <View className="flex-row justify-end gap-2 mt-4">
              <Button
                title="No"
                backgroundColor="transparent"
                textColor={colors.black}
                border
                onPress={hideModal}
              />
              <Button
                title="Yes"
                backgroundColor={colors.primary}
                textColor={colors.white}
                onPress={isLoading ? null : executeModalAction}
                loading={isLoading}
              />
            </View>
          )}
          {modalType === "alert" && (
            <View className="flex-row justify-end gap-2 mt-4">
              <Button
                title="No"
                backgroundColor="transparent"
                textColor={colors.black}
                border
                onPress={hideModal}
              />
              <Button
                title="Yes"
                backgroundColor={colors.alert}
                textColor={colors.white}
                onPress={isLoading ? null : executeModalAction}
                loading={isLoading}
              />
            </View>
          )}
          {modalType === "ok" && (
            <View className="flex-row mt-4">
              <Button
                title="Ok"
                backgroundColor={colors.primary}
                textColor={colors.white}
                onPress={isLoading ? null : executeModalAction}
                loading={isLoading}
              />
            </View>
          )}
          {modalType === "password" && (
            <View className="gap-2 mt-4">
              <Text>Confirm password: </Text>
              <Input
                value={inputValue}
                onChangeText={(text) => setInputValue(text)}
                icon
                iconName={showPassword ? "eye-outline" : "eye-off-outline"}
                action={() => setShowPassword(!showPassword)}
                secureTextEntry={!showPassword}
              />
              <View className="h-12">
                <Button
                  title="Ok"
                  backgroundColor={colors.primary}
                  textColor={colors.white}
                  onPress={isLoading ? null : executeModalAction}
                  loading={isLoading}
                />
              </View>
            </View>
          )}
          {modalType === "input" && (
            <View className="gap-2 mt-4">
              <Input
                value={inputValue}
                onChangeText={(text) => setInputValue(text)}
              />
              <View className="h-12">
                <Button
                  title="Ok"
                  backgroundColor={colors.primary}
                  textColor={colors.white}
                  onPress={isLoading ? null : executeModalAction}
                  loading={isLoading}
                />
              </View>
            </View>
          )}
        </View>
      </Pressable>
    </View>
  )
}
