const formatDateToSave = (date: Date) => {
  function twoDigits(num: number) {
    return num.toString().padStart(2, "0")
  }

  return (
    date.getFullYear() +
    "-" +
    twoDigits(date.getMonth() + 1) +
    "-" +
    twoDigits(date.getDate()) +
    " " +
    twoDigits(date.getHours()) +
    ":" +
    twoDigits(date.getMinutes()) +
    ":" +
    twoDigits(date.getSeconds())
  )
}

const formatDateToShow = (time: string) => {
  const receivedTime = new Date(time)
  const now = new Date()

  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ]
  const monthName = monthNames[receivedTime.getMonth()]

  if (receivedTime.getFullYear() === now.getFullYear()) {
    if (receivedTime.getDate() === now.getDate()) {
      return receivedTime.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    } else {
      return `${receivedTime.getDate()} ${monthName}`
    }
  } else {
    return `${monthName}, ${receivedTime.getFullYear()}`
  }
}

export { formatDateToSave, formatDateToShow }
