import { Search } from "lucide-react";

type SearchInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
};

export default function SearchInput({
  value,
  onChange,
  placeholder = "Search...",
  className = "",
  inputClassName = "",
}: SearchInputProps) {
  return (
    <div className={`relative ${className}`.trim()}>
      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={`bg-white/5 border border-white/10 rounded-full pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-white/30 transition-colors w-64 ${inputClassName}`.trim()}
      />
    </div>
  );
}
