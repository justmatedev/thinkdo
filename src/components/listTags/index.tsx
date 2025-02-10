import { FlatList } from "react-native"
import React, { Dispatch, SetStateAction } from "react"
import Item from "../tag"
import { useTagsStore } from "../../store/tagsStore"

interface ListTagsProps {
  activeTags: string[]
  setActiveTags: Dispatch<SetStateAction<string[]>>
}
export const ListTags = ({ activeTags, setActiveTags }: ListTagsProps) => {
  const { tags } = useTagsStore()

  const filterActiveTags = (tag: string) => {
    if (activeTags.includes(tag)) {
      const newActiveTags = activeTags.filter((item) => item !== tag)
      setActiveTags(newActiveTags)
    } else {
      setActiveTags((prevState) => [...prevState, tag])
    }
  }

  return (
    <FlatList
      data={tags}
      renderItem={({ item }) => (
        <Item
          data={item}
          action={() => filterActiveTags(item)}
          activeTags={activeTags}
        />
      )}
      keyExtractor={(item) => item}
      horizontal
      showsHorizontalScrollIndicator={false}
      ListFooterComponent={() => <Item />}
      style={{ flexGrow: 0 }}
    />
  )
}

export default ListTags
