import ScrubReveal from "./ScrubReveal";
import TeamCarousel from "./TeamCarousel";
import type { TeamMember } from "../data";

type TeamSectionProps = {
  members: TeamMember[];
};

export default function TeamSection({ members }: TeamSectionProps) {
  return (
    <section id="team" className="py-24 px-8 md:px-12 border-t border-white/10 relative">
      <div className="max-w-6xl mx-auto">
        <ScrubReveal y={20} className="text-center mb-16">
          <h2 className="text-2xl md:text-3xl font-serif mb-4 tracking-tight bg-linear-to-r from-white to-gray-400 bg-clip-text text-transparent">
            The Minds Behind CivicMind
          </h2>
          <p className="text-gray-400 text-xs md:text-sm font-light leading-relaxed max-w-2xl mx-auto">
            Our team combines decades of experience in municipal government, artificial intelligence,
            and enterprise software engineering.
          </p>
        </ScrubReveal>

        <div className="hidden md:grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          {members.map((member, i) => (
            <ScrubReveal y={20} delay={i * 0.1} key={i} className="group flex flex-col">
              <div className="w-full aspect-square rounded-2xl overflow-hidden mb-5 border border-white/10 bg-white/5 relative">
                <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-500 z-10" />
                <img
                  src={member.image}
                  alt={member.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700"
                />
              </div>
              <h3 className="text-sm font-medium mb-1">{member.name}</h3>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-3 font-medium">{member.role}</p>
              <p className="text-xs text-gray-400 font-light leading-relaxed">{member.bio}</p>
            </ScrubReveal>
          ))}
        </div>

        <TeamCarousel members={members} />
      </div>
    </section>
  );
}
