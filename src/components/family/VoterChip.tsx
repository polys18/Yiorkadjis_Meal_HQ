type Props = {
  name: string;
  color: string;
  size?: "sm" | "md";
};

export function VoterChip({ name, color, size = "sm" }: Props) {
  const initial = name[0]?.toUpperCase() ?? "?";
  const dim = size === "sm" ? "h-6 w-6 text-[11px]" : "h-8 w-8 text-sm";
  return (
    <span
      title={name}
      className={`inline-flex items-center justify-center rounded-full text-white font-medium ${dim}`}
      style={{ backgroundColor: color }}
      aria-label={`Voter: ${name}`}
    >
      {initial}
    </span>
  );
}
