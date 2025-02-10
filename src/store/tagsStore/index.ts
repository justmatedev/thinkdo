import { create } from "zustand"
import { storeDataTags } from "../../storage/tags"

interface TagsStoreProps {
  tags: string[]
  setTags: (uid: string, tags: string[]) => void
  addTag: (uid: string, tag: string) => void
  updateTag: (uid: string, oldTag: string, newTag: string) => void
  removeTag: (uid: string, tag: string) => void
  clearTags: () => void
}

export const useTagsStore = create<TagsStoreProps>((set) => ({
  tags: [],

  setTags: (uid, tags) => {
    set(() => ({ tags }))
    storeDataTags(uid, tags)
  },

  addTag: (uid, tag) =>
    set((state) => {
      const updatedTags = [...state.tags, tag]
      updatedTags.sort((a, b) => a.localeCompare(b))
      storeDataTags(uid, updatedTags)
      return { tags: updatedTags }
    }),

  updateTag: (uid, oldTag, newTag) =>
    set((state) => {
      const updatedTags = state.tags.map((item) =>
        item === oldTag ? newTag : item
      )
      updatedTags.sort((a, b) => a.localeCompare(b))
      storeDataTags(uid, updatedTags)
      return { tags: updatedTags }
    }),

  removeTag: (uid, tag) =>
    set((state) => {
      const updatedTags = state.tags.filter((item) => item !== tag)
      updatedTags.sort((a, b) => a.localeCompare(b))
      storeDataTags(uid, updatedTags)
      return { tags: updatedTags }
    }),

  clearTags: () =>
    set(() => {
      const clearedTags: [] = []
      return { tags: clearedTags }
    }),
}))
