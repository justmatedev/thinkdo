import { View, Text, Pressable, FlatList } from "react-native"
import React, { Dispatch, SetStateAction, useEffect, useState } from "react"
import { NoteProps } from "../../../types/note.type"
import { useNavigation } from "@react-navigation/native"
import { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { StackParamList } from "../../../routes/app.routes"
import { returnHexColor } from "../../../scripts/colorConverter"
import { useColors } from "../../../theme/colors"
import { fontFamily } from "../../../theme/fontFamily"
import { useFontSize } from "../../../theme/size"
import Item from "../../../components/tag"
import { formatDateToShow } from "../../../scripts/formatDate"
import {
  OpacityDecorator,
  ScaleDecorator,
} from "react-native-draggable-flatlist"
import { useAppearenceStore } from "../../../store/appearanceStore"

interface NoteComponentProps {
  data: NoteProps
  drag: () => void
  selectedNotes: NoteProps[]
  setSelectedNotes: Dispatch<SetStateAction<NoteProps[]>>
}
const Note = ({
  data,
  drag,
  selectedNotes,
  setSelectedNotes,
}: NoteComponentProps) => {
  const colors = useColors()
  const fontSize = useFontSize()
  const { showDateHome } = useAppearenceStore()

  const navigation = useNavigation<NativeStackNavigationProp<StackParamList>>()

  const [currentNoteSelected, setCurrentNoteSelected] = useState(false)

  useEffect(() => {
    const isNoteSelected = selectedNotes.some((note) => note.id === data.id)
    setCurrentNoteSelected(isNoteSelected)
  }, [selectedNotes])

  const openNote = () => {
    navigation.navigate("note", { data: data })
  }

  const controleSelectedNotes = () => {
    const hasItem = selectedNotes.some((note) => note.id === data.id)

    setSelectedNotes(
      hasItem
        ? selectedNotes.filter((note) => note.id !== data.id)
        : [...selectedNotes, data]
    )
  }

  return (
    <ScaleDecorator activeScale={0.97}>
      <OpacityDecorator activeOpacity={0.95}>
        <Pressable
          className="mx-2 my-1 py-2 px-3 rounded-lg"
          onPress={selectedNotes.length > 0 ? controleSelectedNotes : openNote}
          style={{
            backgroundColor: returnHexColor(colors, data.backgroundColor),
            borderWidth: 1,
            borderColor: currentNoteSelected
              ? colors.primary
              : colors.borderColorLight,
          }}
          onLongPress={drag}
        >
          {data.title && (
            <Text
              style={{
                fontFamily: fontFamily.semiBold,
                fontSize: fontSize.regular,
                color: colors.black,
              }}
            >
              {data.title}
            </Text>
          )}

          {data.contentText && (
            <Text
              style={{
                fontFamily: fontFamily.regular,
                fontSize: fontSize.regular,
                color: colors.black,
              }}
              numberOfLines={5}
            >
              {data.contentText}
            </Text>
          )}

          {(data.tags.length !== 0 || showDateHome === "Yes") && (
            <View className="flex-row items-center justify-between mt-3">
              <FlatList
                data={data.tags}
                renderItem={({ item }) => (
                  <Item data={item} action={openNote} />
                )}
                horizontal
                style={{ flexGrow: 0 }}
                showsHorizontalScrollIndicator={false}
              />

              {showDateHome === "Yes" && (
                <Text
                  style={{
                    fontFamily: fontFamily.regular,
                    fontSize: fontSize.small,
                    color: colors.black,
                  }}
                  className="ml-3"
                >
                  {formatDateToShow(data.lastEditTime)}
                </Text>
              )}
            </View>
          )}
        </Pressable>
      </OpacityDecorator>
    </ScaleDecorator>
  )
}

export default Note
