import { ChevronDown } from "lucide-react";
import { useState } from "react";

type FAQItemProps = {
  question: string;
  answer: string;
};

export default function FAQItem({ question, answer }: FAQItemProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-white/10">
      <button
        className="w-full py-6 flex justify-between items-center text-left focus:outline-none group"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <span className="text-sm md:text-base font-medium group-hover:text-gray-300 transition-colors">
          {question}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-gray-500 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ${isOpen ? "max-h-96 pb-6 opacity-100" : "max-h-0 opacity-0"}`}
      >
        <p className="text-xs md:text-sm text-gray-400 font-light leading-relaxed pr-8">
          {answer}
        </p>
      </div>
    </div>
  );
}
