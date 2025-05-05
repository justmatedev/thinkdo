import React from "react"
import { View, Text, ScrollView, Pressable } from "react-native"
import {
  useRoute,
  RouteProp,
  useNavigation,
  useIsFocused,
} from "@react-navigation/native"
import { StackParamList } from "../../routes/app.routes"
import Input from "./input"
import { useEffect, useState } from "react"
import { NoteProps } from "../../types/note.type"
import { useNoteStore } from "../../store/noteStore"
import { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { useUserInfoStore } from "../../store/userStore"
import { useUniqueId } from "../../scripts/useUniqueId"
import Header from "../../components/header"
import { returnHexColor, returnNameColor } from "../../scripts/colorConverter"
import { fontFamily } from "../../theme/fontFamily"
import { useFontSize, useIconSize } from "../../theme/size"
import navigationBarColor from "../../scripts/navigationBarColor"
import IconButton from "../../components/iconButton"
import ColorCircle from "./colorCircle"
import { useModalStore } from "../../store/modalStore"
import ListTags from "../../components/listTags"
import { formatDateToSave, formatDateToShow } from "../../scripts/formatDate"
import { useSyncStore } from "../../store/syncStore"
import { useColors } from "../../theme/colors"

type NoteRouteProp = RouteProp<StackParamList, "note">

interface NoteConstValuesProps {
  createdAt: string
  id: string
  uid: string
}

const Note = () => {
  const colors = useColors()
  const iconSize = useIconSize()
  const fontSize = useFontSize()
  const route = useRoute<NoteRouteProp>()
  const navigation = useNavigation<NativeStackNavigationProp<StackParamList>>()
  const data = route.params?.data
  const isFocused = useIsFocused()

  const { addNote, updateNote, removeNote, notes, setNotes } = useNoteStore()
  const { user } = useUserInfoStore()
  const { showModal, setModalAction, modalStyle, hideModal } = useModalStore()
  const { generateId } = useUniqueId()
  const { setSyncTimeLocal } = useSyncStore()

  const [title, setTitle] = useState(data ? data.title : "")
  const [contentText, setContentText] = useState(data ? data.contentText : "")
  const [backgroundColor, setBackgroundColor] = useState<string>(
    returnHexColor(colors, data ? data.backgroundColor : colors.background)
  )

  const [activeTags, setActiveTags] = useState<string[]>(data ? data.tags : [])
  const [lastTimeEdit, setLastTimeEdit] = useState(
    data ? data.lastEditTime : ""
  )

  const [noteConstValues, setNoteConstValues] = useState<NoteConstValuesProps>({
    createdAt: data ? `${data.createdAt}` : "",
    id: data ? data.id : "",
    uid: data ? data.uid : "",
  })
  const [hasLoaded, setHasLoaded] = useState(false)
  const [showOptions, setShowOptions] = useState(false)

  const [undoStack, setUndoStack] = useState<string[]>(
    data ? [data.contentText] : []
  )

  const [redoStack, setRedoStack] = useState<string[]>([])

  useEffect(() => {
    if (hasLoaded) {
      if (noteConstValues.id) {
        updateNoteFunc()
      } else {
        addNoteFunc()
      }
    } else {
      setHasLoaded(true)
    }
  }, [contentText, title, backgroundColor, activeTags])

  useEffect(() => {
    if (isFocused) {
      navigationBarColor(backgroundColor)
    }
  }, [isFocused])

  const addNoteFunc = () => {
    const dateNow = formatDateToSave(new Date())
    const newId = generateId()
    const uid = user.uid
    const background = returnNameColor(colors, backgroundColor)

    const note: NoteProps = {
      backgroundColor: background,
      contentText: contentText,
      createdAt: dateNow,
      id: newId,
      lastEditTime: dateNow,
      order: 0,
      tags: activeTags,
      title: title,
      uid: uid,
    }

    let list = [...notes]
    let newOrder = 0
    list = list.map((item) => {
      newOrder += 1
      return {
        ...item,
        order: newOrder,
      }
    })
    list.sort((a, b) => a.order - b.order)

    setNotes(user.uid, list)
    addNote(user.uid, note)
    setNoteConstValues({ createdAt: dateNow, id: newId, uid: uid })
    setLastTimeEdit(dateNow)
    setSyncTimeLocal(user.uid, dateNow)
  }

  const updateNoteFunc = () => {
    const dateNow = formatDateToSave(new Date())
    const background = returnNameColor(colors, backgroundColor)

    const note: NoteProps = {
      backgroundColor: background,
      contentText: contentText,
      createdAt: noteConstValues.createdAt,
      id: noteConstValues.id,
      lastEditTime: dateNow,
      order: 0,
      tags: activeTags,
      title: title,
      uid: user.uid,
    }

    let list = [...notes]
    let newOrder = 0
    list = list.map((item) => {
      newOrder += 1
      return {
        ...item,
        order: newOrder,
      }
    })
    list.sort((a, b) => a.order - b.order)

    setNotes(user.uid, list)
    updateNote(user.uid, note)
    setLastTimeEdit(dateNow)
    setSyncTimeLocal(user.uid, dateNow)
  }

  const changeColor = (color: string) => {
    setBackgroundColor(color)
    navigationBarColor(color)
  }

  const delNote = () => {
    removeNote(user.uid, noteConstValues.id)
    hideModal()
    navigation.goBack()
  }

  const undoFunc = () => {
    const beforeText = undoStack[undoStack.length - 2]
    setContentText(beforeText)
    setRedoStack((prevState) => [...prevState, undoStack[undoStack.length - 1]])
    setUndoStack((prevState) => prevState.slice(0, -1))
  }

  const redoFunc = () => {
    const lastRedo = redoStack[redoStack.length - 1]
    setContentText(lastRedo)
    setUndoStack((prevState) => [...prevState, lastRedo])
    setRedoStack((prevState) => prevState.slice(0, -1))
  }

  return (
    <>
      <Header backgroundColor={backgroundColor} />

      <View
        className="flex-1 px-2 relative"
        style={{ backgroundColor: backgroundColor }}
      >
        <Input
          placeholder="Title..."
          value={title}
          onChangeText={(text) => setTitle(text)}
          fontFamily={fontFamily.semiBold}
          fontSize={fontSize.large}
          className="px-4 mt-4 h-16"
        />

        <Input
          placeholder="Content..."
          value={contentText}
          onChangeText={(text) => {
            setContentText(text)
            setUndoStack((prevState) => [...prevState, text])
            setRedoStack([])
          }}
          fontFamily={fontFamily.regular}
          fontSize={fontSize.regular}
          textAlignVertical="top"
          className="p-4 pb-2 flex-1"
          multiline
        />

        {showOptions && (
          <View
            className="m-2 p-2 rounded-lg items-end"
            style={{
              backgroundColor: colors.noteOptionsBackground,
              borderColor: colors.borderColorLight,
              borderWidth: 1,
            }}
          >
            <View className="pb-2">
              <ListTags activeTags={activeTags} setActiveTags={setActiveTags} />
            </View>
            <ScrollView
              className="pb-2"
              contentContainerStyle={{ gap: 8 }}
              horizontal
              showsHorizontalScrollIndicator={false}
            >
              <ColorCircle
                color={colors.background}
                onPress={() => changeColor(colors.background)}
              />
              <ColorCircle
                color={colors.noteColorRed}
                onPress={() => changeColor(colors.noteColorRed)}
              />
              <ColorCircle
                color={colors.noteColorOrange}
                onPress={() => changeColor(colors.noteColorOrange)}
              />
              <ColorCircle
                color={colors.noteColorYellow}
                onPress={() => changeColor(colors.noteColorYellow)}
              />
              <ColorCircle
                color={colors.noteColorGreen}
                onPress={() => changeColor(colors.noteColorGreen)}
              />
              <ColorCircle
                color={colors.noteColorBlue}
                onPress={() => changeColor(colors.noteColorBlue)}
              />
              <ColorCircle
                color={colors.noteColorIndigo}
                onPress={() => changeColor(colors.noteColorIndigo)}
              />
              <ColorCircle
                color={colors.noteColorViolet}
                onPress={() => changeColor(colors.noteColorViolet)}
              />
            </ScrollView>

            <IconButton
              iconName="trash"
              iconColor={colors.white}
              iconSize={iconSize.regular}
              background={colors.alert}
              full
              onPress={() => {
                showModal(backgroundColor)
                modalStyle("Do you want to delete the note selected?", "alert")
                setModalAction(delNote)
              }}
            />
          </View>
        )}
        <Pressable
          className="flex-row justify-between items-center"
          onPress={() => setShowOptions(!showOptions)}
        >
          <View className="flex-row items-center">
            {lastTimeEdit && (
              <>
                <IconButton
                  iconColor={colors.black}
                  iconName="time-outline"
                  iconSize={iconSize.regular}
                />
                <Text
                  style={{
                    fontFamily: fontFamily.regular,
                    fontSize: fontSize.regular,
                    color: colors.black,
                  }}
                >
                  {lastTimeEdit && formatDateToShow(lastTimeEdit)}
                </Text>
              </>
            )}
          </View>

          <View className="flex-row items-center">
            <IconButton
              iconName="arrow-undo-outline"
              iconColor={
                undoStack.length <= 1 ? colors.primaryAlfa : colors.primary
              }
              iconSize={iconSize.regular}
              onPress={undoStack.length <= 1 ? () => {} : undoFunc}
              notTransparency={undoStack.length <= 1}
            />

            <IconButton
              iconName="arrow-redo-outline"
              iconColor={
                redoStack.length == 0 ? colors.primaryAlfa : colors.primary
              }
              iconSize={iconSize.regular}
              onPress={redoStack.length == 0 ? () => {} : redoFunc}
              notTransparency={redoStack.length == 0}
              className="mr-2"
            />

            <IconButton
              iconName={
                showOptions ? "chevron-down-outline" : "chevron-up-outline"
              }
              iconColor={colors.primary}
              iconSize={iconSize.regular}
              onPress={() => setShowOptions(!showOptions)}
            />
          </View>
        </Pressable>
      </View>
    </>
  )
}

export default Note
