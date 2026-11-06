import { type ThemePreference } from "@/lib/theme";
import { SegmentedControl } from "@/components/ui/SegmentedControl";

const OPTIONS = [
  { value: "light" as const, label: "Claro", icon: "sun" as const },
  { value: "system" as const, label: "Automático", icon: "smartphone" as const },
  { value: "dark" as const, label: "Escuro", icon: "moon" as const },
];

type Props = {
  value: ThemePreference;
  onChange: (value: ThemePreference) => void;
};

export function ThemeSegment({ value, onChange }: Props) {
  return (
    <SegmentedControl
      value={value}
      onChange={onChange}
      options={OPTIONS}
      accessibilityLabelPrefix="Tema"
    />
  );
}
