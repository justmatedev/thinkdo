import { Pressable } from "react-native"
import SvgButton from "./svgButton"
import { useState } from "react"

interface FabButtonProps {
  aspecRatio: number
  action: () => void
}
function FabButton({ aspecRatio, action }: FabButtonProps) {
  const [isPressed, setIsPressed] = useState(false)

  const width = 178.4 * aspecRatio
  const height = 148.2 * aspecRatio

  return (
    <Pressable
      onPress={action}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      className={`transition-opacity duration-100 items-center justify-center p-2
        ${isPressed ? "opacity-50" : "opacity-100"}`}
    >
      <SvgButton height={height} width={width} />
    </Pressable>
  )
}

export default FabButton
