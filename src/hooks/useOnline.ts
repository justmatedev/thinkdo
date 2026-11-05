import NetInfo from "@react-native-community/netinfo";
import { useEffect, useState } from "react";

export function useOnline(): boolean {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    return NetInfo.addEventListener((state) => {
      setOnline(state.isConnected === true);
    });
  }, []);
  return online;
}
