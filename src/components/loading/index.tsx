import { ActivityIndicator } from "react-native"
import React from "react"

const Loading = ({ color }: { color: string }) => {
  return <ActivityIndicator size="small" color={color} />
}

export default Loading
