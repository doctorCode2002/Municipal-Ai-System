import React, { useRef } from "react";
import { FileText, Zap, CheckCircle } from "lucide-react";
import { motion } from "motion/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import ScrubReveal from "./ScrubReveal";

gsap.registerPlugin(ScrollTrigger);

const steps = [
  {
    icon: <FileText className="w-6 h-6 text-blue-400" />,
    title: "1. Submission",
    description: "Citizen describes the municipal issue, with the platform suggesting the best category in real-time.",
    detail: "Location metadata and timestamps are automatically attached.",
    color: "from-blue-500/20 to-transparent",
    border: "border-blue-500/30",
  },
  {
    icon: <Zap className="w-6 h-6 text-amber-400" />,
    title: "2. AI Analysis",
    description: "CivicMind instantly predicts the category (e.g. Roads, Waste) and assigns a priority score (High/Medium/Low).",
    detail: "Models trained on 10,000+ historical records for high accuracy.",
    color: "from-amber-500/20 to-transparent",
    border: "border-amber-500/30",
  },
  {
    icon: <CheckCircle className="w-6 h-6 text-emerald-400" />,
    title: "3. Resolution",
    description: "The targeted department receives a pre-routed ticket. Managers dispatch crews and update the citizen in real-time.",
    detail: "Complete audit log from report to resolution.",
    color: "from-emerald-500/20 to-transparent",
    border: "border-emerald-500/30",
  },
];

export default function LifecycleSection() {
  const containerRef = useRef<HTMLElement>(null);

  useGSAP(() => {
    let mm = gsap.matchMedia();

    mm.add("(min-width: 768px)", () => {
      // Desktop Setup: Pinning and Scrubbing
      gsap.set(".timeline-line", { scaleX: 0, transformOrigin: "left center" });
      steps.forEach((_, i) => {
        gsap.set(`.step-card-${i}`, { opacity: 0, y: 50, scale: 0.95 });
        gsap.set(`.step-glow-${i}`, { opacity: 0 });
      });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top top",
          end: "+=200%",
          pin: true,
          scrub: 1,
        }
      });

      tl.to(".timeline-line", { scaleX: 1, duration: 1, ease: "none" }, 0);

      steps.forEach((_, i) => {
        const startTime = 0.1 + (i * 0.3);
        tl.to(`.step-card-${i}`, {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.2,
          ease: "back.out(1.5)"
        }, startTime);
        tl.to(`.step-glow-${i}`, { opacity: 1, duration: 0.2 }, startTime + 0.1);
      });

      tl.to({}, { duration: 0.1 });
    });

    mm.add("(max-width: 767px)", () => {
      // Mobile Setup: Simple staggered reveal on scroll (no pinning)
      steps.forEach((_, i) => {
        gsap.set(`.step-card-${i}`, { opacity: 0, y: 30 });
        
        gsap.to(`.step-card-${i}`, {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "power2.out",
          scrollTrigger: {
            trigger: `.step-card-${i}`,
            start: "top 85%",
            toggleActions: "play none none reverse"
          }
        });
      });
    });

    return () => mm.revert();
  }, { scope: containerRef });

  return (
    <section 
      ref={containerRef} 
      id="lifecycle" 
      className="min-h-screen md:h-screen w-full bg-black relative overflow-visible md:overflow-hidden flex flex-col justify-center border-t border-white/10 py-20 md:py-0"
    >
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-blue-500/5 blur-[120px] pointer-events-none" />

      <div className="w-full px-8 md:px-12 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 md:mb-24">
            <h2 className="text-2xl md:text-4xl font-serif mb-4 tracking-tight bg-linear-to-r from-white to-gray-500 bg-clip-text text-transparent">
              The Lifecycle of a Report
            </h2>
            <p className="text-gray-400 text-xs md:text-sm font-light max-w-2xl mx-auto leading-relaxed">
              From the moment an issue is spotted to its final resolution, CivicMind 
              automates the heavy lifting with precision AI and seamless routing.
            </p>
          </div>

          <div className="relative">
            {/* Connecting Line Track (Desktop) */}
            <div className="hidden md:block absolute top-[48px] left-[16.66%] right-[16.66%] h-0.5 bg-white/5 rounded-full overflow-hidden">
               <div className="timeline-line h-full w-full bg-linear-to-r from-blue-500 via-amber-500 to-emerald-500 rounded-full" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8 relative">
              {steps.map((step, i) => (
                <div
                  key={i}
                  className={`step-card-${i} relative group flex flex-col items-center text-center`}
                >
                  {/* Vertical Line for Mobile */}
                  {i < steps.length - 1 && (
                    <div className="md:hidden absolute top-[120px] left-1/2 w-px h-12 -translate-x-1/2 bg-linear-to-b from-white/10 to-transparent z-0" />
                  )}

                  {/* Icon Circle */}
                  <div className={`w-20 md:w-24 h-20 md:h-24 rounded-2xl mb-6 md:mb-8 flex items-center justify-center border ${step.border} bg-black/50 backdrop-blur-xl relative z-10 shadow-2xl overflow-hidden`}>
                    <div className={`step-glow-${i} absolute inset-0 bg-linear-to-b ${step.color} opacity-20 md:opacity-0`} />
                    <div className="relative z-10 transition-transform duration-500 group-hover:scale-110">
                      {step.icon}
                    </div>
                    <div className="absolute -top-2 -right-2 text-[8px] md:text-[10px] font-mono text-white/40 bg-[#0a0a0a] border border-white/10 w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center backdrop-blur-md z-20">
                      0{i + 1}
                    </div>
                  </div>

                  <h3 className="text-base md:text-lg font-serif mb-3 md:mb-4 text-white tracking-wide">{step.title}</h3>
                  <p className="text-gray-400 text-[11px] md:text-sm font-light mb-4 leading-relaxed px-4 md:px-6">
                    {step.description}
                  </p>
                  <div className="mt-auto pt-4 border-t border-white/5 w-3/4">
                    <p className="text-[9px] md:text-[10px] text-gray-500 uppercase tracking-widest font-medium">
                      {step.detail}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
