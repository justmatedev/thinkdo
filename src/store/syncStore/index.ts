import { create } from "zustand"
import { storeDataSyncTime } from "../../storage/syncTime"

interface SyncStoreProps {
  syncTimeLocal: string
  setSyncTimeLocal: (uid: string, syncTimeLocal: string) => void
  syncTimeFirebase: string | null
  setSyncTimeFirebase: (syncTimeFirebase: string | null) => void
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
