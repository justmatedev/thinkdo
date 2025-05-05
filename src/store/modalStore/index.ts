import { create } from "zustand"

interface ModalState {
  isVisible: boolean
  message: string
  backgroundColor: string
  modalType: "yes/no" | "ok" | "password" | "input" | "alert"

  modalAction: (inputValue: string) => void | Promise<void>
  setModalAction: (action: (inputValue: string) => void | Promise<void>) => void
  executeModalAction: () => Promise<void>

  showModal: (backgroundColor: string) => void
  hideModal: () => void
  modalStyle: (
    message: string,
    modalType: "yes/no" | "ok" | "password" | "input" | "alert"
  ) => void
  isLoading: boolean

  inputValue: string
  setInputValue: (value: string) => void
}

export const useModalStore = create<ModalState>((set, get) => ({
  isVisible: false,
  message: "",
  backgroundColor: "",
  modalType: "ok",
  isLoading: false,
  inputValue: "",

  modalAction: () => {},

  setModalAction: (action: (inputValue: string) => void | Promise<void>) =>
    set({
      modalAction: action,
    }),

  executeModalAction: async () => {
    set({ isLoading: true })
    try {
      const currentInputValue = get().inputValue
      const action = get().modalAction
      if (action) {
        await action(currentInputValue)
      }
    } catch (error) {
      console.error("Error executing modal action: ", error)
    } finally {
      set({ isLoading: false })
    }
  },

  showModal: (backgroundColor) => {
    set({
      isVisible: true,
      backgroundColor,
    })
  },

  hideModal: () =>
    set({
      isVisible: false,
      inputValue: "",
    }),

  modalStyle: (
    message: string,
    modalType: "yes/no" | "ok" | "password" | "input" | "alert"
  ) =>
    set({
      message,
      modalType,
    }),

  setInputValue: (value: string) => set({ inputValue: value }),
}))
