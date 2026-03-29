const STATUS_STYLES: Record<string, string> = {
  Resolved: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  "In Progress": "bg-blue-500/10 text-blue-400 border-blue-500/20",
  Pending: "bg-gray-500/10 text-gray-400 border-gray-500/20",
  Routed: "bg-white/5 text-gray-300 border-white/10",
};

type StatusBadgeProps = {
  value: string;
  className?: string;
};

export default function StatusBadge({
  value,
  className = "",
}: StatusBadgeProps) {
  const style =
    STATUS_STYLES[value] || "bg-white/5 text-gray-300 border-white/10";
  return (
    <span
      className={`text-[10px] px-2 py-1 rounded font-medium border ${style} ${className}`.trim()}
    >
      {value}
    </span>
  );
}
