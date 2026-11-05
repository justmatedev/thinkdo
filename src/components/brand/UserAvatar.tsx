import { useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { font, fontSize } from "@/lib/theme";
import { useTheme } from "@/lib/themeContext";

type Props = {
  uri: string | null;
  initial: string;
  size: number;
  accessibilityLabel?: string;
  /** Set false when a parent Pressable owns the accessibility label. */
  accessible?: boolean;
};

export function UserAvatar({
  uri,
  initial,
  size,
  accessibilityLabel = "Avatar",
  accessible = true,
}: Props) {
  const { colors } = useTheme();
  const [failedUri, setFailedUri] = useState<string | null>(null);
  const showImage = Boolean(uri) && failedUri !== uri;
  const fontScale = size >= 48 ? fontSize.title : fontSize.meta;

  return (
    <View
      accessible={accessible}
      accessibilityRole={accessible ? "image" : undefined}
      accessibilityLabel={accessible ? accessibilityLabel : undefined}
      style={[
        styles.circle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colors.surfaceMuted,
        },
      ]}
    >
      {showImage ? (
        <Image
          source={{ uri: uri! }}
          onError={() => {
            if (uri) setFailedUri(uri);
          }}
          style={{ width: size, height: size, borderRadius: size / 2 }}
        />
      ) : (
        <Text
          style={{
            fontFamily: font.medium,
            fontSize: fontScale,
            color: colors.brand,
          }}
        >
          {initial}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
});
