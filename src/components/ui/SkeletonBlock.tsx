import { useEffect, useMemo } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { Animated } from "react-native";
import { radius } from "@/lib/theme";
import { useTheme } from "@/lib/themeContext";

type Props = {
  width: number | `${number}%`;
  height: number;
  /** Override pulse fill (default: theme accentSubtle) */
  color?: string;
  style?: StyleProp<ViewStyle>;
};

const PULSE_MIN = 0.45;
const PULSE_MAX = 1;
const PULSE_MS = 900;

export function SkeletonBlock({ width, height, color, style }: Props) {
  const { colors } = useTheme();
  const opacity = useMemo(() => new Animated.Value(PULSE_MAX), []);

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: PULSE_MIN,
          duration: PULSE_MS,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: PULSE_MAX,
          duration: PULSE_MS,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      accessible={false}
      importantForAccessibility="no"
      style={[
        {
          width,
          height,
          backgroundColor: color ?? colors.accentSubtle,
          borderRadius: radius.sm,
          opacity,
        },
        style,
      ]}
    />
  );
}
