import AsyncStorage from "@react-native-async-storage/async-storage"
import { AppearenceProps } from "../../types/appearence.type"

const getDataAppearence = async (uid: string) => {
  const key = `@${uid}appearence`
  try {
    const jsonValue = await AsyncStorage.getItem(key)
    return jsonValue != null ? JSON.parse(jsonValue) : null
  } catch (e) {
    // error reading value
  }
}

const storeDataAppearence = async (
  uid: string,
  appearence: AppearenceProps
) => {
  const key = `@${uid}appearence`
  try {
    const jsonValue = JSON.stringify(appearence)
    await AsyncStorage.setItem(key, jsonValue)
  } catch (e) {
    // saving error
  }
}

export { getDataAppearence, storeDataAppearence }
