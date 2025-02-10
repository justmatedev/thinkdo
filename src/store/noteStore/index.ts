import { create } from "zustand"
import { NoteProps } from "../../types/note.type"
import { storeDataNotes } from "../../storage/notes"

interface NoteStoreProps {
  notes: NoteProps[]
  setNotes: (uid: string, notes: NoteProps[]) => void
  addNote: (uid: string, note: NoteProps) => void
  removeNote: (uid: string, id: string) => void
  updateNote: (uid: string, updatedNote: NoteProps) => void
  clearNotes: () => void
}

export const useNoteStore = create<NoteStoreProps>((set) => ({
  notes: [],

  setNotes: (uid, notes) => {
    set(() => ({ notes: [...notes].sort((a, b) => a.order - b.order) }))
    storeDataNotes(
      uid,
      [...notes].sort((a, b) => a.order - b.order)
    )
  },

  addNote: (uid, note) =>
    set((state) => {
      const updatedNotes = [...state.notes, note]
      updatedNotes.sort((a, b) => a.order - b.order)
      storeDataNotes(uid, updatedNotes)
      return { notes: updatedNotes }
    }),

  removeNote: (uid, id) =>
    set((state) => {
      const updatedNotes = state.notes.filter((note) => note.id !== id)
      updatedNotes.sort((a, b) => a.order - b.order)
      storeDataNotes(uid, updatedNotes)
      return { notes: updatedNotes }
    }),

  updateNote: (uid, updatedNote) =>
    set((state) => {
      const updatedNotes = state.notes.map((note) =>
        note.id === updatedNote.id ? updatedNote : note
      )
      updatedNotes.sort((a, b) => a.order - b.order)
      storeDataNotes(uid, updatedNotes)
      return { notes: updatedNotes }
    }),

  clearNotes: () =>
    set(() => {
      const clearedNotes: NoteProps[] = []
      return { notes: clearedNotes }
    }),
}))
