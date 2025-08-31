import { StyleSheet, Text, View } from "react-native"
import React, { Dispatch, SetStateAction } from "react"
import { useColors } from "../../../theme/colors"
import { fontFamily } from "../../../theme/fontFamily"
import IconButton from "../../../components/iconButton"
import { useFontSize, useIconSize } from "../../../theme/size"
import Input from "../../../components/input"
import ListTags from "../../../components/listTags"
import { useModalStore } from "../../../store/modalStore"
import { NoteProps } from "../../../types/note.type"
import { useTagsStore } from "../../../store/tagsStore"

interface MenuProps {
  showOptions: boolean
  setShowOptions: Dispatch<SetStateAction<boolean>>
  selectedNotes: NoteProps[]
  setSelectedNotes: Dispatch<SetStateAction<NoteProps[]>>
  delNotes: () => void
  searchText: string
  setSearchText: Dispatch<SetStateAction<string>>
  activeTags: string[]
  setActiveTags: Dispatch<SetStateAction<string[]>>
}

const Menu = ({
  showOptions,
  selectedNotes,
  setSelectedNotes,
  setShowOptions,
  delNotes,
  searchText,
  setSearchText,
  activeTags,
  setActiveTags,
}: MenuProps) => {
  const colors = useColors()
  const iconSize = useIconSize()
  const fontSize = useFontSize()
  const { showModal, setModalAction, modalStyle, hideModal } = useModalStore()
  const { tags } = useTagsStore()

  return (
    <View className="mx-2 my-4 gap-2 ">
      {showOptions ? (
        <>
          <View
            className="rounded-lg"
            style={{ borderWidth: 1, borderColor: colors.borderColorLight }}
          >
            <Text
              className="px-2 pt-2 text-center"
              style={{
                fontFamily: fontFamily.semiBold,
                fontSize: fontSize.regular,
                color: colors.black,
              }}
            >
              {selectedNotes.length === 1
                ? "1 note selected"
                : `${selectedNotes.length} selecteds notes`}
            </Text>
            <View className="flex-row justify-between">
              <IconButton
                iconName="close-outline"
                iconColor="red"
                iconSize={iconSize.regular}
                onPress={() => {
                  setSelectedNotes([])
                  setShowOptions(false)
                }}
              />
              <IconButton
                iconName="trash-outline"
                iconColor="red"
                iconSize={iconSize.regular}
                onPress={() => {
                  showModal(colors.background)
                  if (selectedNotes.length == 1) {
                    modalStyle(
                      "Do you want to delete the note selected?",
                      "alert"
                    )
                  } else {
                    modalStyle(
                      "Do you want to delete the selected notes?",
                      "alert"
                    )
                  }

                  setModalAction(delNotes)
                }}
              />
            </View>
          </View>
        </>
      ) : (
        <>
          <Input
            placeholder="Search..."
            value={searchText}
            onChangeText={(text) => setSearchText(text)}
            icon={searchText !== "" ? true : false}
            iconName="close-outline"
            action={() => {
              setSearchText("")
            }}
          />
          {tags.length > 0 && (
            <ListTags activeTags={activeTags} setActiveTags={setActiveTags} />
          )}
        </>
      )}
    </View>
  )
}

export default Menu

const styles = StyleSheet.create({})
