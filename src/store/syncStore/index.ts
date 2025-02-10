import { create } from "zustand"
import { storeDataSyncTime } from "../../storage/syncTime"

interface SyncStoreProps {
  syncTimeLocal: string
  setSyncTimeLocal: (uid: string, syncTimeLocal: string) => void
  syncTimeFirebase: string
  setSyncTimeFirebase: (syncTimeFirebase: string) => void
}

export const useSyncStore = create<SyncStoreProps>((set) => ({
  syncTimeLocal: "",
  setSyncTimeLocal: (uid, syncTimeLocal) => {
    set(() => ({ syncTimeLocal }))
    storeDataSyncTime(uid, syncTimeLocal)
  },
  syncTimeFirebase: "",
  setSyncTimeFirebase: (syncTimeFirebase) => {
    set(() => ({ syncTimeFirebase }))
  },
}))
