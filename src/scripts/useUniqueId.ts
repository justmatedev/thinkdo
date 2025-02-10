import { useUserInfoStore } from "../store/userStore"

const useUniqueId = () => {
  const { user } = useUserInfoStore()
  const generateId = () => {
    const uniqueID = `${user.uid}${Date.now()}${Math.floor(
      Math.random() * 9999
    )}`
    return uniqueID
  }

  return { generateId }
}

export { useUniqueId }
