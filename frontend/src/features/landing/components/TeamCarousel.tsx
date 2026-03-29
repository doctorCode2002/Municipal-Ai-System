import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { motion } from "motion/react";
import type { TeamMember } from "../data";

type TeamCarouselProps = {
  members: TeamMember[];
};

export default function TeamCarousel({ members }: TeamCarouselProps) {
  if (members.length === 0) return null;

  const extendedMembers = [
    members[members.length - 1],
    ...members,
    members[0],
  ];

  const [activeIndex, setActiveIndex] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const autoplayRef = useRef<NodeJS.Timeout | null>(null);

  const nextSlide = () => {
    setIsTransitioning(true);
    setActiveIndex((prev) => prev + 1);
  };

  const prevSlide = () => {
    setIsTransitioning(true);
    setActiveIndex((prev) => prev - 1);
  };

  const handleDotClick = (index: number) => {
    setIsTransitioning(true);
    setActiveIndex(index + 1);
  };

  useEffect(() => {
    if (!isPaused) {
      autoplayRef.current = setInterval(nextSlide, 3000);
    }
    return () => {
      if (autoplayRef.current) clearInterval(autoplayRef.current);
    };
  }, [isPaused, activeIndex]); // Restart on index change to prevent rapid double-skips

  const logicalIndex = ((activeIndex - 1 + members.length) % members.length);

  return (
    <div 
      className="md:hidden relative w-full overflow-hidden py-10"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <motion.div
        className="flex"
        animate={{ x: `-${activeIndex * 100}%` }}
        transition={isTransitioning ? { duration: 0.5, ease: "easeInOut" } : { duration: 0 }}
        onAnimationComplete={() => {
          if (activeIndex === members.length + 1) {
            setIsTransitioning(false);
            setActiveIndex(1);
          } else if (activeIndex === 0) {
            setIsTransitioning(false);
            setActiveIndex(members.length);
          }
        }}
      >
        {extendedMembers.map((member, i) => (
          <div key={i} className="w-full shrink-0 px-4">
            <div className="group flex flex-col bg-white/3 border border-white/10 rounded-2xl p-5">
              <div className="w-full aspect-square rounded-xl overflow-hidden mb-5 border border-white/10 bg-white/5 relative">
                <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-500 z-10" />
                <img
                  src={member.image}
                  alt={member.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700"
                />
              </div>
              <h3 className="text-sm font-medium mb-1">{member.name}</h3>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-3 font-medium">
                {member.role}
              </p>
              <p className="text-xs text-gray-400 font-light leading-relaxed line-clamp-3">
                {member.bio}
              </p>
            </div>
          </div>
        ))}
      </motion.div>

      <div className="flex items-center justify-center gap-6 mt-8">
        <button 
          onClick={prevSlide} 
          className="p-2 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="flex gap-2">
          {members.map((_, i) => (
            <button
              key={i}
              onClick={() => handleDotClick(i)}
              className={`h-1.5 rounded-full transition-all ${i === logicalIndex ? "bg-white w-4" : "bg-white/20 w-1.5"}`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
        <button 
          onClick={nextSlide} 
          className="p-2 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
