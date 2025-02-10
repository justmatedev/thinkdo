import { useNavigation } from "@react-navigation/native"
import { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { StackParamList } from "../routes/app.routes"
import { UserActiveProps } from "../types/userActive.type"
import { useUserInfoStore } from "../store/userStore"
import { getDataNotes } from "../storage/notes"
import { useNoteStore } from "../store/noteStore"
import { NoteProps } from "../types/note.type"
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore"
import { db } from "../services/firebase"
import { useTagsStore } from "../store/tagsStore"
import { getDataTags } from "../storage/tags"
import { getDataSyncTime } from "../storage/syncTime"
import { useSyncStore } from "../store/syncStore"

export const useEnterUser = () => {
  const { setUser } = useUserInfoStore()
  const navigation = useNavigation<NativeStackNavigationProp<StackParamList>>()
  const { setNotes } = useNoteStore()
  const { setTags } = useTagsStore()
  const { setSyncTimeLocal, setSyncTimeFirebase } = useSyncStore()

  let notesFirebase: NoteProps[] = []
  const getNotesFirebase = async (uid: string) => {
    if (notesFirebase.length === 0) {
      const q = query(collection(db, "notes"), where("uid", "==", uid))
      const querySnapshot = await getDocs(q)
      querySnapshot.forEach((doc) => {
        notesFirebase.push({
          backgroundColor: doc.data().backgroundColor,
          contentText: doc.data().contentText,
          createdAt: doc.data().createdAt,
          id: doc.id,
          lastEditTime: doc.data().lastEditTime,
          order: doc.data().order,
          tags: doc.data().tags,
          title: doc.data().title,
          uid: doc.data().uid,
        })
      })
    }
  }

  let notesLocal: NoteProps[] = []
  const getNotesLocal = async (uid: string) => {
    const notes = await getDataNotes(uid)
    if (notes) {
      if (notes.length > 0) {
        notesLocal = notes
      }
    }
  }

  let tagsFirebase: string[] = []
  let syncTimeFirebase: string
  const getUserData = async (uid: string) => {
    const docRef = doc(db, "userData", uid)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      tagsFirebase = docSnap.data().tags
      syncTimeFirebase = docSnap.data().syncTime
    }
  }

  let tagsLocal: string[] = []
  const getTagsLocal = async (uid: string) => {
    const tags = await getDataTags(uid)
    if (tags) {
      if (tags.length !== 0) {
        tagsLocal = tags
      }
    }
  }

  let syncTimeLocal: string
  const getSyncTimeLocal = async (uid: string) => {
    const sync = await getDataSyncTime(uid)
    if (sync) {
      syncTimeLocal = sync
    }
  }

  const enterUser = async (user: UserActiveProps) => {
    if (
      user.displayName !== null &&
      notesLocal.length === 0 &&
      notesFirebase.length === 0
    ) {
      await getSyncTimeLocal(user.uid)
      await getUserData(user.uid)

      const dateLocal = new Date(syncTimeLocal)
      const dateFirebase = new Date(syncTimeFirebase)

      if (syncTimeLocal && syncTimeFirebase) {
        setSyncTimeLocal(user.uid, syncTimeLocal)
        setSyncTimeFirebase(syncTimeFirebase)
        if (dateLocal >= dateFirebase) {
          // both local and firebase data exist, but local data is more recent
          await getNotesLocal(user.uid)
          await getTagsLocal(user.uid)

          setNotes(user.uid, notesLocal)
          setTags(user.uid, tagsLocal)
        } else {
          // both local and firebase data exist, but firebase data is more recent
          await getNotesFirebase(user.uid)
          await getNotesLocal(user.uid)

          setNotes(user.uid, [...notesFirebase])
          setTags(user.uid, tagsFirebase)
        }
      } else if (syncTimeLocal) {
        // only local data exists
        setSyncTimeLocal(user.uid, syncTimeLocal)
        await getNotesLocal(user.uid)
        await getTagsLocal(user.uid)

        setNotes(user.uid, notesLocal)
        setTags(user.uid, tagsLocal)
      } else if (syncTimeFirebase) {
        // only firebase data exists
        setSyncTimeFirebase(syncTimeFirebase)
        await getNotesFirebase(user.uid)
        await getNotesLocal(user.uid)

        setNotes(user.uid, notesFirebase)
        setTags(user.uid, tagsFirebase)
      } else {
        // no backup data exists

        setSyncTimeFirebase(syncTimeFirebase)
        setNotes(user.uid, [])
        setTags(user.uid, [])
      }

      setUser(user)
      navigation.navigate("home")

      notesFirebase = []
      notesLocal = []
      tagsFirebase = []
      tagsLocal = []
    }
  }

  return { enterUser }
}
