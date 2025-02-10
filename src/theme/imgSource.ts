import { ImageSourcePropType } from "react-native"

interface SourceProps {
  logo: ImageSourcePropType
}

const iconSource: SourceProps = {
  logo: require("../images/logo.png"),
}

export { iconSource }
