import { View, Dimensions } from "react-native"
import React from "react"
import OneCloud from "./oneCloud"

const HalfClouds = ({ bottom }: { bottom?: boolean }) => {
  const screenWidth = Dimensions.get("screen").width
  const cloudWidth = screenWidth * 0.1
  const numberOfClouds = Math.ceil(screenWidth / cloudWidth)

  let accumulatedLeftRandom = 0

  return (
    <View style={{ flexDirection: "row" }}>
      {Array.from({ length: numberOfClouds * 2 }).map((_, index) => {
        let yRandom: number
        if (bottom) {
          yRandom = Math.random() * (0.7 - 0.6) + 0.6
        } else {
          yRandom = Math.random() * (0.5 - 0.4) + 0.4
        }
        const leftRandom = Math.random() * (0.4 - 0.05) + 0.01
        accumulatedLeftRandom += leftRandom

        return (
          <OneCloud
            key={index}
            width={cloudWidth}
            yRandom={yRandom}
            leftRandom={accumulatedLeftRandom}
            bottom={bottom}
          />
        )
      })}
    </View>
  )
}

export default HalfClouds
