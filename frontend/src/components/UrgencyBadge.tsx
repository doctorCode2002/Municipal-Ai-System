const URGENCY_STYLES: Record<string, string> = {
  Critical: "bg-red-500/10 text-red-400 border-red-500/20",
  High: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  Medium: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  Low: "bg-blue-500/10 text-blue-400 border-blue-500/20",
};

type UrgencyBadgeProps = {
  value: string;
  className?: string;
};

export default function UrgencyBadge({ value, className = "" }: UrgencyBadgeProps) {
  const style = URGENCY_STYLES[value] || "bg-gray-500/10 text-gray-300 border-white/10";
  return (
    <span
      className={`text-[10px] px-2 py-1 rounded font-medium border ${style} ${className}`.trim()}
    >
      {value}
    </span>
  );
}
