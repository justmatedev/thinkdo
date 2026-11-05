import {
  Bell,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleOff,
  Eye,
  EyeOff,
  ListTodo,
  LogOut,
  Moon,
  Plus,
  Search,
  Smartphone,
  StickyNote,
  Sun,
  Trash2,
  WifiOff,
  X,
  type LucideIcon,
} from "lucide-react-native";
import type { StyleProp, ViewStyle } from "react-native";
import { iconSize } from "@/lib/theme";

export const APP_ICONS = {
  bell: Bell,
  check: Check,
  chevronLeft: ChevronLeft,
  chevronRight: ChevronRight,
  circleOff: CircleOff,
  eye: Eye,
  eyeOff: EyeOff,
  logOut: LogOut,
  moon: Moon,
  note: StickyNote,
  plus: Plus,
  search: Search,
  smartphone: Smartphone,
  sun: Sun,
  task: ListTodo,
  trash: Trash2,
  wifiOff: WifiOff,
  x: X,
} as const satisfies Record<string, LucideIcon>;

export type AppIconName = keyof typeof APP_ICONS;

type Props = {
  name: AppIconName;
  color: string;
  size?: number;
  strokeWidth?: number;
  style?: StyleProp<ViewStyle>;
};

export function AppIcon({
  name,
  color,
  size = iconSize.md,
  strokeWidth = 2,
  style,
}: Props) {
  const Icon = APP_ICONS[name];
  return <Icon color={color} size={size} strokeWidth={strokeWidth} style={style} />;
}
