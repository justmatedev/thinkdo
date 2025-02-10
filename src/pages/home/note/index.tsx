import { View, Text, Pressable, FlatList } from "react-native"
import React, { Dispatch, SetStateAction, useEffect, useState } from "react"
import { NoteProps } from "../../../types/note.type"
import { useNavigation } from "@react-navigation/native"
import { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { StackParamList } from "../../../routes/app.routes"
import { returnHexColor } from "../../../scripts/colorConverter"
import { colors } from "../../../theme/colors"
import { fontFamily } from "../../../theme/fontFamily"
import { fontSize } from "../../../theme/size"
import Item from "../../../components/tag"
import { formatDateToShow } from "../../../scripts/formatDate"
import {
  OpacityDecorator,
  ScaleDecorator,
} from "react-native-draggable-flatlist"

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
            backgroundColor: returnHexColor(data.backgroundColor),
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
              }}
              numberOfLines={5}
            >
              {data.contentText}
            </Text>
          )}

          <View className="flex-row items-center justify-between mt-3">
            <FlatList
              data={data.tags}
              renderItem={({ item }) => <Item data={item} action={openNote} />}
              horizontal
              style={{ flexGrow: 0 }}
              showsHorizontalScrollIndicator={false}
            />

            <Text
              style={{
                fontFamily: fontFamily.regular,
                fontSize: fontSize.small,
              }}
              className="ml-3"
            >
              {formatDateToShow(data.lastEditTime)}
            </Text>
          </View>
        </Pressable>
      </OpacityDecorator>
    </ScaleDecorator>
  )
}

export default Note
