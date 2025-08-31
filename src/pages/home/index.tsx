import { View, Keyboard, StatusBar } from "react-native"
import React, { useEffect, useMemo, useState } from "react"
import Note from "./note"
import { useIsFocused, useNavigation } from "@react-navigation/native"
import { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { StackParamList } from "../../routes/app.routes"
import { useNoteStore } from "../../store/noteStore"
import { useUserInfoStore } from "../../store/userStore"
import Header from "../../components/header"
import { useColors } from "../../theme/colors"
import navigationBarColor from "../../scripts/navigationBarColor"
import FabButton from "./fabButton"
import DraggableFlatList from "react-native-draggable-flatlist"
import { NoteProps } from "../../types/note.type"
import { useModalStore } from "../../store/modalStore"
import Loading from "../../components/loading"
import NoNotes from "./noNotes"
import { useAppearenceStore } from "../../store/appearanceStore"
import Menu from "./menu"

const Home = () => {
  const { theme } = useAppearenceStore()
  const colors = useColors()
  const navigation = useNavigation<NativeStackNavigationProp<StackParamList>>()
  const { notes, setNotes, removeNote } = useNoteStore()
  const { user } = useUserInfoStore()
  const { hideModal } = useModalStore()
  const isFocused = useIsFocused()

  const [searchText, setSearchText] = useState("")
  const [activeTags, setActiveTags] = useState<string[]>([])
  const [showOptions, setShowOptions] = useState(false)
  const [selectedNotes, setSelectedNotes] = useState<NoteProps[]>([])
  const [loadingData, setLoadingData] = useState(true)

  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false)

  useEffect(() => {
    if (isFocused) {
      navigationBarColor(colors.background)
    }

    if (loadingData) {
      if (user.uid) {
        setLoadingData(false)
      }
    }
  }, [isFocused, user])

  const filteredNotes = useMemo(() => {
    const lowercasedSearch = searchText.toLowerCase()
    const hasSearch = lowercasedSearch.length > 0
    const hasTags = activeTags.length > 0

    if (!hasSearch && !hasTags) {
      return notes
    }

    return notes.filter((note) => {
      if (hasSearch) {
        const inTitle = note.title.toLowerCase().includes(lowercasedSearch)
        const inContent = note.contentText
          .toLowerCase()
          .includes(lowercasedSearch)
        return inTitle || inContent
      }

      if (hasTags) {
        return activeTags.every((tag) => note.tags.includes(tag))
      }

      return false
    })
  }, [notes, searchText, activeTags])

  useEffect(() => {
    if (selectedNotes.length === 0) {
      setShowOptions(false)
    }
  }, [selectedNotes])

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

  const longPressAction = ({ data }: { data: NoteProps[] }) => {
    const needUpdate = notes.some((item, index) => item.id !== data[index].id)

    if (needUpdate) {
      setSelectedNotes([])
      const updatedNotes = data.map((item, index) => ({
        ...item,
        order: index,
      }))
      setNotes(user.uid, updatedNotes)
    } else {
      setShowOptions(true)
    }
  }

  const delNotes = () => {
    if (selectedNotes.length > 0) {
      selectedNotes.forEach((note) => {
        removeNote(user.uid, note.id)
      })
      setSelectedNotes([])
      setShowOptions(false)
      hideModal()
    }
  }

  if (loadingData) {
    return (
      <View
        style={{ backgroundColor: colors.background }}
        className="flex-1 justify-center items-center"
      >
        <Loading color={colors.primary} />
      </View>
    )
  }
  return (
    <>
      <StatusBar
        translucent={true}
        barStyle={theme === "Dark" ? "light-content" : "dark-content"}
        backgroundColor="transparent"
      />
      <Header forHome backgroundColor={colors.background} />
      <View style={{ backgroundColor: colors.background, flex: 1 }}>
        <Menu
          activeTags={activeTags}
          delNotes={delNotes}
          setSearchText={setSearchText}
          searchText={searchText}
          selectedNotes={selectedNotes}
          setActiveTags={setActiveTags}
          setSelectedNotes={setSelectedNotes}
          setShowOptions={setShowOptions}
          showOptions={showOptions}
        />

        {notes.length === 0 ? (
          <NoNotes />
        ) : (
          <View className="flex-1">
            <DraggableFlatList
              data={filteredNotes}
              renderItem={({ item, drag }) => (
                <Note
                  data={item}
                  drag={
                    searchText.length > 0 || activeTags.length > 0
                      ? () => null
                      : drag
                  }
                  selectedNotes={selectedNotes}
                  setSelectedNotes={setSelectedNotes}
                />
              )}
              keyExtractor={(item, index) => item.id + "-" + index}
              onDragEnd={longPressAction}
              onDragBegin={(index) => setSelectedNotes([notes[index]])}
              contentContainerStyle={{ paddingBottom: 10 }}
              showsVerticalScrollIndicator={false}
            />
          </View>
        )}

        {!isKeyboardVisible && (
          <View className="absolute bottom-5 self-center">
            <FabButton
              aspecRatio={0.45}
              action={() => navigation.navigate("note")}
            />
          </View>
        )}
      </View>
    </>
  )
}

export default Home
