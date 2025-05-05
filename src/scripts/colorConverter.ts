const returnHexColor = (colors: any, color: string): string => {
  switch (color) {
    case "red":
      return colors.noteColorRed
    case "orange":
      return colors.noteColorOrange
    case "yellow":
      return colors.noteColorYellow
    case "green":
      return colors.noteColorGreen
    case "blue":
      return colors.noteColorBlue
    case "indigo":
      return colors.noteColorIndigo
    case "violet":
      return colors.noteColorViolet
    default:
      return colors.background
  }
}

const returnNameColor = (colors: any, color: string): string => {
  switch (color) {
    case colors.noteColorRed:
      return "red"
    case colors.noteColorOrange:
      return "orange"
    case colors.noteColorYellow:
      return "yellow"
    case colors.noteColorGreen:
      return "green"
    case colors.noteColorBlue:
      return "blue"
    case colors.noteColorIndigo:
      return "indigo"
    case colors.noteColorViolet:
      return "violet"
    default:
      return "default"
  }
}

export { returnHexColor, returnNameColor }
