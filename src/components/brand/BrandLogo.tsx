import LogoSvg from "@/assets/brand/logo.svg";
import { useTheme } from "@/lib/themeContext";

const ASPECT = 2398 / 1277;

type Props = {
  height: number;
  color?: string;
};

export function BrandLogo({ height, color }: Props) {
  const { colors } = useTheme();
  const width = Math.round(height * ASPECT);

  return (
    <LogoSvg
      width={width}
      height={height}
      fill={color ?? colors.brand}
      accessibilityRole="image"
      accessibilityLabel="Thinkdo"
    />
  );
}
