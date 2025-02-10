interface ColorProps {
  secondary: string
  secondaryAlfa: string
  primary: string
  primaryAlfa: string

  white: string
  black: string

  borderColorLight: string
  alert: string

  backgroundLight: string

  noteColorRed: string
  noteColorOrange: string
  noteColorYellow: string
  noteColorGreen: string
  noteColorBlue: string
  noteColorIndigo: string
  noteColorViolet: string
}

const colors: ColorProps = {
  secondary: "#EAF9B2",
  secondaryAlfa: "#f0facc99",
  primary: "#674CE8",
  primaryAlfa: "#674CE899",

  white: "#EDEDED",
  black: "#19191A",

  borderColorLight: "rgba(0,0,0,.1)",
  alert: "#ff313b",

  backgroundLight: "#f6fce3",

  noteColorRed: "#EEBCBD",
  noteColorOrange: "#EFDDBE",
  noteColorYellow: "#EFEBBE",
  noteColorGreen: "#DAEFBE",
  noteColorBlue: "#BECEEF",
  noteColorIndigo: "#C8BEEF",
  noteColorViolet: "#D9BEEF",
}

export { colors }
