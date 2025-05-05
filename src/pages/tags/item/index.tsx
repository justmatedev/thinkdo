import { View, Text, Pressable } from "react-native"
import Input from "../../../components/input"
import { Dispatch, SetStateAction, useEffect, useState } from "react"
import IconButton from "../../../components/iconButton"
import { useColors } from "../../../theme/colors"
import { useFontSize, useIconSize } from "../../../theme/size"
import { fontFamily } from "../../../theme/fontFamily"
import { useTagsStore } from "../../../store/tagsStore"
import { useUserInfoStore } from "../../../store/userStore"
import { formatDateToSave } from "../../../scripts/formatDate"
import { useSyncStore } from "../../../store/syncStore"
import { useModalStore } from "../../../store/modalStore"
import { useNoteStore } from "../../../store/noteStore"

interface ItemProps {
  data: string
  tagIsEditing: string | null
  setTagIsEditing: Dispatch<SetStateAction<string | null>>
}
const Item = ({ data, tagIsEditing, setTagIsEditing }: ItemProps) => {
  const colors = useColors()
  const iconSize = useIconSize()
  const fontSize = useFontSize()
  const { tags, removeTag, updateTag } = useTagsStore()
  const { user } = useUserInfoStore()
  const { setSyncTimeLocal } = useSyncStore()
  const { showModal, setModalAction, modalStyle, hideModal } = useModalStore()
  const { notes, updateNote } = useNoteStore()

  const [newTagName, setNewTagName] = useState(data)
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    if (tagIsEditing === data) {
      setIsEditing(true)
    } else {
      setIsEditing(false)
      setNewTagName(data)
    }
  }, [tagIsEditing])

  const editTagFunc = () => {
    if (data !== newTagName) {
      const tagAlreadyExist = tags.some((tag) => tag === newTagName)
      if (tagAlreadyExist) {
        showModal(colors.background)
        modalStyle("Tag already exists", "ok")
        setModalAction(hideModal)
      } else {
        const updatedNotes = notes.map((note) => {
          if (note.tags.includes(data)) {
            return {
              ...note,
              tags: note.tags.map((tag) => (tag === data ? newTagName : tag)),
            }
          }
          return note
        })

        if (updatedNotes.length > 0) {
          updatedNotes.forEach((note) => {
            updateNote(user.uid, note)
          })
        }

        updateTag(user.uid, data, newTagName)

        const dateNow = formatDateToSave(new Date())
        setSyncTimeLocal(user.uid, dateNow)
      }
    } else {
      setTagIsEditing(null)
    }
  }

  const deleteTagFunc = () => {
    const updatedNotes = notes.map((note) => {
      if (note.tags.includes(data)) {
        return {
          ...note,
          tags: note.tags.filter((tag) => tag !== data),
        }
      }
      return note
    })

    if (updatedNotes.length > 0) {
      updatedNotes.forEach((note) => {
        updateNote(user.uid, note)
      })
    }

    removeTag(user.uid, data)
    setTagIsEditing(null)

    const dateNow = formatDateToSave(new Date())
    setSyncTimeLocal(user.uid, dateNow)

    hideModal()
  }

  return (
    <Pressable
      onPress={() => setTagIsEditing(newTagName)}
      style={{
        borderColor: isEditing ? colors.primary : colors.borderColorLight,
        borderWidth: 1,
      }}
      className="mb-2 rounded-lg flex-row items-center h-12"
    >
      {isEditing ? (
        <>
          <View className="flex-1">
            <Input
              value={newTagName}
              onChangeText={(text) => setNewTagName(text)}
              noBorder
            />
          </View>
          <IconButton
            iconName="trash-outline"
            iconColor={colors.alert}
            iconSize={iconSize.regular}
            onPress={() => {
              showModal(colors.background)
              modalStyle("Do you want to delete the selected tag?", "alert")
              setModalAction(deleteTagFunc)
            }}
          />
          <IconButton
            iconName="checkmark-outline"
            iconColor={colors.primary}
            iconSize={iconSize.regular}
            onPress={editTagFunc}
          />
        </>
      ) : (
        <>
          <Text
            className="flex-1 pl-3"
            style={{
              fontFamily: fontFamily.regular,
              fontSize: fontSize.regular,
              color: colors.black,
            }}
          >
            {newTagName}
          </Text>
          <IconButton
            iconName="create-outline"
            iconColor={colors.primary}
            iconSize={iconSize.regular}
            onPress={() => setTagIsEditing(data)}
          />
        </>
      )}
    </Pressable>
  )
}

export default Item
