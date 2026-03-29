import type { FaqItem } from "../data";
import FAQItem from "./FAQItem";
import ScrubReveal from "./ScrubReveal";

type FAQSectionProps = {
  items: FaqItem[];
};

export default function FAQSection({ items }: FAQSectionProps) {
  return (
    <section id="faq" className="py-24 px-8 md:px-12 border-t border-white/10 relative bg-white/1">
      <div className="max-w-3xl mx-auto">
        <ScrubReveal y={20} className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-serif mb-4 tracking-tight bg-linear-to-r from-white to-gray-400 bg-clip-text text-transparent">
            Frequently Asked Questions
          </h2>
          <p className="text-gray-400 text-xs md:text-sm font-light leading-relaxed">
            Key details about how this Municipal AI System works across citizen, manager, and admin portals.
          </p>
        </ScrubReveal>
        <ScrubReveal y={20} delay={0.2} className="border-t border-white/10">
          {items.map((faq, index) => (
            <FAQItem key={index} question={faq.question} answer={faq.answer} />
          ))}
        </ScrubReveal>
      </div>
    </section>
  );
}
