import { create } from "zustand"
import { UserActiveProps } from "../../types/userActive.type"

interface UserInfoProps {
  user: UserActiveProps
  setUser: (user: UserActiveProps) => void
}

export const useUserInfoStore = create<UserInfoProps>((set) => ({
  user: { displayName: "", email: "", emailVerified: false, uid: "" },
  setUser: (newUser) =>
    set({
      user: newUser,
    }),
}))
