import { useModalStore } from "../../store/modalStore"

export const useErrors = () => {
  const { modalStyle, setModalAction, hideModal } = useModalStore()

  const errorsLogin = (errorCode: string) => {
    setModalAction(hideModal)
    if (errorCode === "auth/wrong-password") {
      modalStyle("Wrong password", "ok")
    } else if (errorCode === "auth/too-many-requests") {
      modalStyle("Too many requests, wait to try again", "ok")
    } else if (errorCode === "auth/missing-password") {
      modalStyle("Password field empty", "ok")
    }
  }

  const errorsEmail = (errorCode: string) => {
    setModalAction(hideModal)
    if (errorCode === "auth/email-already-in-use") {
      modalStyle("Email already in use", "ok")
    }
  }

  return { errorsLogin, errorsEmail }
}
