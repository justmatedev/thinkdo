import AsyncStorage from "@react-native-async-storage/async-storage"

const getDataTags = async (uid: string) => {
  const key = `@${uid}tags`
  try {
    const jsonValue = await AsyncStorage.getItem(key)
    return jsonValue != null ? JSON.parse(jsonValue) : null
  } catch (e) {
    // error reading value
  }
}

const storeDataTags = async (uid: string, tags: string[]) => {
  const key = `@${uid}tags`
  try {
    const jsonValue = JSON.stringify(tags)
    await AsyncStorage.setItem(key, jsonValue)
  } catch (e) {
    // saving error
  }
}

export { getDataTags, storeDataTags }
