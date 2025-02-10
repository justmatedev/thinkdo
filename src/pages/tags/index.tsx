import { View, Text, FlatList, ScrollView } from "react-native"
import React, { useEffect, useState } from "react"
import { useTagsStore } from "../../store/tagsStore"
import Item from "./item"
import { useUserInfoStore } from "../../store/userStore"
import { useSyncStore } from "../../store/syncStore"
import { formatDateToSave } from "../../scripts/formatDate"
import Header from "../../components/header"
import { colors } from "../../theme/colors"
import { Ionicons } from "@expo/vector-icons"
import { fontSize, iconSize } from "../../theme/size"
import Input from "../../components/input"
import { useModalStore } from "../../store/modalStore"
import { fontFamily } from "../../theme/fontFamily"
import { useIsFocused } from "@react-navigation/native"
import navigationBarColor from "../../scripts/navigationBarColor"

const Tags = () => {
  const { tags, addTag } = useTagsStore()
  const { user } = useUserInfoStore()
  const { setSyncTimeLocal } = useSyncStore()
  const { showModal, setModalAction, modalStyle, hideModal } = useModalStore()

  const isFocused = useIsFocused()

  const [newTag, setNewTag] = useState("")
  const [tagIsEditing, setTagIsEditing] = useState<string | null>("")

  useEffect(() => {
    if (isFocused) {
      navigationBarColor(colors.backgroundLight)
    }
  }, [isFocused])

  const addTagFunc = () => {
    setTagIsEditing("")
    const tagAlreadyExist = tags.some((tag) => tag === newTag)
    if (tagAlreadyExist) {
      showModal()
      modalStyle("Tag already exists", "ok")
      setModalAction(hideModal)
    } else {
      addTag(user.uid, newTag)
      setNewTag("")

      const dateNow = formatDateToSave(new Date())
      setSyncTimeLocal(user.uid, dateNow)
    }
  }

  return (
    <>
      <Header />
      <ScrollView
        style={{ backgroundColor: colors.backgroundLight }}
        className="flex-1 px-4"
      >
        <Ionicons
          name="pricetags-outline"
          color={colors.primary}
          size={iconSize.large}
          className="self-center mt-10"
        />
        <Text
          className="self-center mb-10 mt-4"
          style={{ fontFamily: fontFamily.semiBold, fontSize: fontSize.large }}
        >
          Tags
        </Text>
        <Input
          placeholder="Crate a new tag..."
          icon={newTag ? true : false}
          iconName="add-outline"
          action={addTagFunc}
          value={newTag}
          onChangeText={(text) => {
            setNewTag(text)
            setTagIsEditing(null)
          }}
        />

        <View className="pt-10" />
        <FlatList
          data={tags}
          renderItem={({ item }) => (
            <Item
              data={item}
              tagIsEditing={tagIsEditing}
              setTagIsEditing={setTagIsEditing}
            />
          )}
          keyExtractor={(item) => item}
          scrollEnabled={false}
        />
      </ScrollView>
    </>
  )
}

export default Tags
