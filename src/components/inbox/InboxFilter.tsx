import { SegmentedControl } from "@/components/ui/SegmentedControl";
import type { InboxFilter as Filter } from "@/types/item";

const OPTIONS = [
  { value: "all" as const, label: "Tudo" },
  { value: "notes" as const, label: "Notas", icon: "note" as const },
  { value: "tasks" as const, label: "Tarefas", icon: "task" as const },
];

type Props = { value: Filter; onChange: (v: Filter) => void };

export function InboxFilter({ value, onChange }: Props) {
  return (
    <SegmentedControl
      value={value}
      onChange={onChange}
      options={OPTIONS}
      activeLabelColor="action"
    />
  );
}
