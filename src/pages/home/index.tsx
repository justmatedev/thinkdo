import { Text, View, Keyboard, StatusBar } from "react-native"
import React, { useEffect, useState } from "react"
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
import Input from "../../components/input"
import ListTags from "../../components/listTags"
import IconButton from "../../components/iconButton"
import { useFontSize, useIconSize } from "../../theme/size"
import { fontFamily } from "../../theme/fontFamily"
import { useModalStore } from "../../store/modalStore"
import Loading from "../../components/loading"
import NoNotes from "./noNotes"
import { useTagsStore } from "../../store/tagsStore"
import { useAppearenceStore } from "../../store/appearanceStore"

const Home = () => {
  const { theme } = useAppearenceStore()
  const colors = useColors()
  const iconSize = useIconSize()
  const fontSize = useFontSize()
  const navigation = useNavigation<NativeStackNavigationProp<StackParamList>>()
  const { notes, setNotes, removeNote } = useNoteStore()
  const { user } = useUserInfoStore()
  const { showModal, setModalAction, modalStyle, hideModal } = useModalStore()
  const { tags } = useTagsStore()
  const isFocused = useIsFocused()

  const [searchText, setSearchText] = useState("")
  const [noteList, setNoteList] = useState<NoteProps[]>([])
  const [filterOn, setFilterOn] = useState(false)
  const [activeTags, setActiveTags] = useState<string[]>([])
  const [showOptions, setShowOptions] = useState(false)
  const [selectedNotes, setSelectedNotes] = useState<NoteProps[]>([])
  const [loadingData, setLoadingData] = useState(true)

  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false)

  useEffect(() => {
    if (isFocused) {
      navigationBarColor(colors.background)

      if (filterOn) {
        if (searchText) {
          filterNotesByText(searchText)
        } else {
          filterNotesByTags()
        }
      }
    }

    if (loadingData) {
      if (user.uid) {
        setLoadingData(false)
      }
    }
  }, [isFocused, user])

  useEffect(() => {
    filterNotesByTags()
  }, [activeTags])

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

  const filterNotesByText = (search: string) => {
    setSearchText(search)

    if (search) {
      setFilterOn(true)
      setActiveTags([])

      const list: NoteProps[] = []
      notes.forEach((item) => {
        if (
          item.title.toLowerCase().includes(search.toLowerCase()) ||
          item.contentText.toLowerCase().includes(search.toLowerCase())
        ) {
          list.push(item)
        }
      })

      setNoteList(list)
    } else {
      setFilterOn(false)
    }
  }

  const filterNotesByTags = () => {
    if (activeTags.length > 0) {
      setFilterOn(true)
      setSearchText("")

      const list: NoteProps[] = []
      notes.forEach((item) => {
        if (activeTags.every((note) => item.tags.includes(note))) {
          list.push(item)
        }
      })
      setNoteList(list)
    } else {
      if (!searchText) {
        setFilterOn(false)
      }
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
                onChangeText={(text) => filterNotesByText(text)}
                icon={searchText !== "" ? true : false}
                iconName="close-outline"
                action={() => {
                  filterNotesByText("")
                }}
              />
              {tags.length > 0 && (
                <ListTags
                  activeTags={activeTags}
                  setActiveTags={setActiveTags}
                />
              )}
            </>
          )}
        </View>

        {notes.length === 0 ? (
          <NoNotes />
        ) : (
          <View className="flex-1">
            <DraggableFlatList
              data={filterOn ? noteList : notes}
              renderItem={({ item, drag }) => (
                <Note
                  data={item}
                  drag={filterOn ? () => null : drag}
                  selectedNotes={selectedNotes}
                  setSelectedNotes={setSelectedNotes}
                />
              )}
              keyExtractor={(item) => item.id}
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
