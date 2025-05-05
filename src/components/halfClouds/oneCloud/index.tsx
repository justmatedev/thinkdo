import { View } from "react-native"
import React from "react"
import { useColors } from "../../../theme/colors"

interface OneCloudProps {
  width: number
  yRandom: number
  leftRandom: number
  bottom?: boolean
}
const OneCloud = ({ width, yRandom, leftRandom, bottom }: OneCloudProps) => {
  const colors = useColors()
  return (
    <>
      {bottom ? (
        <View
          style={{
            backgroundColor: colors.primary,
            height: width,
            width: width,
            bottom: -(width * yRandom),
            left: -(width * leftRandom),
          }}
          className="rounded-full "
        />
      ) : (
        <View
          style={{
            backgroundColor: colors.primary,
            height: width,
            width: width,
            top: -(width * yRandom),
            left: -(width * leftRandom),
          }}
          className="rounded-full "
        />
      )}
    </>
  )
}

export default OneCloud
