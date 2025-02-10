import AsyncStorage from "@react-native-async-storage/async-storage"

const getDataSyncTime = async (uid: string) => {
  const key = `@${uid}syncTime`
  try {
    const value = await AsyncStorage.getItem(key)
    if (value !== null) {
      return value
    }
  } catch (e) {
    // error reading value
  }
}

const storeDataSyncTime = async (uid: string, value: string) => {
  const key = `@${uid}syncTime`
  try {
    await AsyncStorage.setItem(key, value)
  } catch (e) {
    // saving error
  }
}

export { getDataSyncTime, storeDataSyncTime }
