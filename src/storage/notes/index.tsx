import AsyncStorage from "@react-native-async-storage/async-storage"
import { NoteProps } from "../../types/note.type"

const getDataNotes = async (uid: string) => {
  const key = `@${uid}notes`
  try {
    const jsonValue = await AsyncStorage.getItem(key)
    return jsonValue != null ? JSON.parse(jsonValue) : null
  } catch (e) {
    // error reading value
  }
}

const storeDataNotes = async (uid: string, notes: NoteProps[]) => {
  const key = `@${uid}notes`
  try {
    const jsonValue = JSON.stringify(notes)
    await AsyncStorage.setItem(key, jsonValue)
  } catch (e) {
    // saving error
  }
}

export { getDataNotes, storeDataNotes }
