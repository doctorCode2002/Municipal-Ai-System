import { AlertCircle, Building, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { motion } from "motion/react";

const features = [
  {
    icon: <AlertCircle className="w-4 h-4 text-red-400" />,
    bg: "bg-red-500/10",
    border: "border-red-500/20",
    title: "Priority Prediction",
    desc: "Each submitted report gets a predicted priority so critical items can be identified quickly and handled first.",
  },
  {
    icon: <Building className="w-4 h-4 text-blue-400" />,
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    title: "Department Routing",
    desc: "The routing model maps reports to departments automatically to reduce manual sorting and assignment delays.",
  },
  {
    icon: <Clock className="w-4 h-4 text-amber-400" />,
    bg: "bg-amber-500/10",
    border: "border-blue-500/20", 
    title: "Workflow Tracking",
    desc: "Managers move tickets across status stages, and admins can review and resolve cross-department reassignment requests.",
  },
];

export default function PlatformCarousel() {
  const extendedFeatures = [
    features[features.length - 1],
    ...features,
    features[0],
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
  }, [isPaused, activeIndex]);

  const logicalIndex = ((activeIndex - 1 + features.length) % features.length);

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
          if (activeIndex === features.length + 1) {
            setIsTransitioning(false);
            setActiveIndex(1);
          } else if (activeIndex === 0) {
            setIsTransitioning(false);
            setActiveIndex(features.length);
          }
        }}
      >
        {extendedFeatures.map((feature, i) => (
          <div key={i} className="w-full shrink-0 px-4">
            <div className="p-6 rounded-2xl border border-white/10 bg-linear-to-br from-white/3 to-white/1 h-full flex flex-col">
              <div className={`w-10 h-10 rounded-full ${feature.bg} flex items-center justify-center mb-6 border ${feature.border} shrink-0`}>
                {feature.icon}
              </div>
              <h3 className="text-sm font-medium mb-2">{feature.title}</h3>
              <p className="text-xs text-gray-400 font-light leading-relaxed flex-1">
                {feature.desc}
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
          {features.map((_, i) => (
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
