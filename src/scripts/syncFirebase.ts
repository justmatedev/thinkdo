import { db } from "../services/firebase"
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore"
import { NoteProps } from "../types/note.type"
import { getDataNotes } from "../storage/notes"
import { getDataTags } from "../storage/tags"
import { formatDateToSave } from "./formatDate"
import { useSyncStore } from "../store/syncStore"
import { useAppearenceStore } from "../store/appearanceStore"

export const useSyncFirebase = () => {
  const { setSyncTimeFirebase } = useSyncStore()
  const { theme, fontSizeOption, showDateHome } = useAppearenceStore()

  let notesFirebase: NoteProps[] = []
  const getDocumentsFirebase = async (uid: string) => {
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

  let notesLocal: NoteProps[] = []
  const getDocumentsLocal = async (uid: string) => {
    const notes = await getDataNotes(uid)
    if (notes) {
      if (notes.length !== 0) {
        notesLocal = notes
      }
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

  const sync = async (uid: string) => {
    await getDocumentsLocal(uid)
    await getDocumentsFirebase(uid)

    if (notesLocal.length > 0) {
      if (notesFirebase.length > 0) {
        for (const itemLocal of notesLocal) {
          const itemFirebase = notesFirebase.find(
            (note) => note.id === itemLocal.id
          )

          if (itemFirebase) {
            // same items exist in local and firebase, so update the items already in firebase
            const docRef = doc(db, "notes", itemFirebase.id)
            await updateDoc(docRef, {
              backgroundColor: itemLocal.backgroundColor,
              contentText: itemLocal.contentText,
              lastEditTime: itemLocal.lastEditTime,
              order: itemLocal.order,
              tags: itemLocal.tags,
              title: itemLocal.title,
            })
          } else {
            // items exist in local but not in firebase, so add these items to firebase
            const newDocRef = doc(db, "notes", itemLocal.id)
            await setDoc(newDocRef, {
              backgroundColor: itemLocal.backgroundColor,
              contentText: itemLocal.contentText,
              createdAt: itemLocal.createdAt,
              id: itemLocal.id,
              lastEditTime: itemLocal.lastEditTime,
              order: itemLocal.order,
              tags: itemLocal.tags,
              title: itemLocal.title,
              uid: itemLocal.uid,
            })
          }
        }

        for (const itemFirebase of notesFirebase) {
          const existsInLocal = notesLocal.some(
            (itemLocal) => itemLocal.id === itemFirebase.id
          )
          if (!existsInLocal) {
            // items exist in Firebase but not in local, so delete these items from firebase
            const docRef = doc(db, "notes", itemFirebase.id)
            await deleteDoc(docRef)
          }
        }
      } else {
        // items exist in local but not in firebase, so add these items to firebase
        for (const item of notesLocal) {
          await setDoc(doc(db, "notes", item.id), item)
        }
      }
    } else if (notesFirebase.length > 0) {
      // no items exist in local, so delete all items from firebase
      for (const itemFirebase of notesFirebase) {
        const docRef = doc(db, "notes", itemFirebase.id)
        await deleteDoc(docRef)
      }
    }

    const dateNow = formatDateToSave(new Date())
    await getTagsLocal(uid)
    const docRef = doc(db, "userData", uid)
    await updateDoc(docRef, {
      tags: tagsLocal,
      syncTime: dateNow,
      theme: theme,
      fontSizeOption: fontSizeOption,
      showDateHome: showDateHome,
    }).then(() => {})

    setSyncTimeFirebase(dateNow)
  }

  return { sync }
}
