import { View, Text, ScrollView, Pressable } from "react-native"
import React, { Dispatch, SetStateAction } from "react"
import { useColors } from "../../../theme/colors"
import ListTags from "../../../components/listTags"
import ColorCircle from "../colorCircle"
import IconButton from "../../../components/iconButton"
import { useFontSize, useIconSize } from "../../../theme/size"
import { useModalStore } from "../../../store/modalStore"
import { fontFamily } from "../../../theme/fontFamily"
import { formatDateToShow } from "../../../scripts/formatDate"

interface OptionsProps {
  showOptions: boolean
  setShowOptions: Dispatch<SetStateAction<boolean>>
  activeTags: string[]
  setActiveTags: Dispatch<SetStateAction<string[]>>
  changeColor: (color: string) => void
  backgroundColor: string
  delNote: () => void
  lastTimeEdit: string
  undoStack: string[]
  undoFunc: () => void
  redoStack: string[]
  redoFunc: () => void
}

const Options = ({
  showOptions,
  setShowOptions,
  activeTags,
  setActiveTags,
  changeColor,
  backgroundColor,
  delNote,
  lastTimeEdit,
  undoStack,
  undoFunc,
  redoStack,
  redoFunc,
}: OptionsProps) => {
  const colors = useColors()
  const iconSize = useIconSize()
  const { showModal, setModalAction, modalStyle, hideModal } = useModalStore()
  const fontSize = useFontSize()

  return (
    <>
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
              <View>
                <IconButton
                  iconColor={colors.black}
                  iconName="time-outline"
                  iconSize={iconSize.small}
                />
              </View>
              <View className="pt-1">
                <Text
                  style={{
                    fontFamily: fontFamily.regular,
                    fontSize: fontSize.regular,
                    color: colors.black,
                  }}
                >
                  {lastTimeEdit && formatDateToShow(lastTimeEdit)}
                </Text>
              </View>
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
    </>
  )
}

export default Options
