import React, { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Construction, Trash2, ShieldAlert, Droplets, ArrowUpRight } from "lucide-react";
import AnimatedCounter from "./AnimatedCounter";

gsap.registerPlugin(ScrollTrigger);

export default function MetricsBento() {
  const containerRef = useRef<HTMLElement>(null);

  useGSAP(() => {
    // Initial States
    gsap.set(".metrics-card", { opacity: 0, y: 30, scale: 0.95 });
    gsap.set(".accuracy-bar", { height: 0 });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top 85%", // Starts a bit earlier for smoother flow
        end: "bottom 70%",
        scrub: 1,
      }
    });

    // Reveal Cards
    tl.to(".metrics-card", {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: 1,
      stagger: 0.2,
      ease: "power2.out"
    });

    // Animate Bar Chart (specifically for the Accuracy card)
    tl.to(".accuracy-bar", {
      height: (i, target) => target.dataset.height + "%",
      duration: 1,
      stagger: 0.05,
      ease: "power2.out"
    }, "-=0.5"); // Overlap with cards reveal

  }, { scope: containerRef });

  const cards = [
    {
      title: "Public Infrastructure",
      value: "Roads & Transit",
      description: "Automated pothole detection and priority routing for city public works departments.",
      icon: <Construction className="w-5 h-5 text-blue-400" />,
      className: "md:col-span-2 md:row-span-2 bg-linear-to-br from-blue-500/10 to-transparent",
    },
    {
      title: "Environmental Health",
      value: "Waste & Hygiene",
      description: "Intelligent scheduling for illegal dumping reports and sanitation overflow alerts.",
      icon: <Trash2 className="w-5 h-5 text-emerald-400" />,
      className: "md:col-span-2 bg-linear-to-r from-emerald-500/10 to-transparent",
      extra: (
        <div className="mt-4 h-12 w-full flex items-end gap-1 overflow-hidden">
          {[40, 70, 45, 90, 65, 80, 50, 95, 85].map((h, i) => (
            <div
              key={i}
              data-height={h}
              className="accuracy-bar flex-1 bg-emerald-500/30 rounded-t-sm"
            />
          ))}
        </div>
      ),
    },
    {
      title: "Rapid Response",
      value: "Safety & Hazards",
      description: "Instant classification of structural hazards and immediate safety team routing.",
      icon: <ShieldAlert className="w-5 h-5 text-purple-400" />,
      className: "bg-linear-to-br from-purple-500/10 to-transparent",
    },
    {
      title: "City Utilities",
      value: "Grid Repairs",
      description: "Managing streetlight outages and water leakage reports with predictive urgency.",
      icon: <Droplets className="w-5 h-5 text-amber-400" />,
      className: "bg-linear-to-br from-amber-500/10 to-transparent",
    },
  ];

  return (
    <section ref={containerRef} id="metrics" className="py-24 px-8 md:px-12 border-t border-white/10 relative">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div className="max-w-xl">
            <h2 className="text-2xl md:text-3xl font-serif mb-4 tracking-tight text-white">
              Real-World Use Cases
            </h2>
            <p className="text-gray-400 text-xs md:text-sm font-light leading-relaxed">
              CivicMind is designed to handle the diverse spectrum of municipal challenges, 
              from infrastructure triage to environmental sanitation.
            </p>
          </div>
          <div className="md:pb-1">
            <div className="flex items-center gap-2 text-[10px] uppercase font-medium tracking-widest text-emerald-400 bg-emerald-500/5 px-4 py-2 rounded-full border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Operational Use Cases
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6">
          {cards.map((card, i) => (
            <div
              key={i}
              className={`metrics-card p-8 rounded-3xl border border-white/10 relative group overflow-hidden ${card.className} hover:border-white/20 transition-all duration-500`}
            >
              {/* Subtle Glow */}
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-white/5 blur-[80px] rounded-full group-hover:bg-white/10 transition-colors duration-500" />
              
              <div className="flex justify-between items-start mb-6">
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                  {card.icon}
                </div>
                <ArrowUpRight className="w-5 h-5 text-gray-600 group-hover:text-white transition-colors duration-300" />
              </div>

              <div>
                <div className="text-3xl md:text-4xl font-serif mb-2 text-white">
                  {card.value}
                </div>
                <h3 className="text-sm font-medium mb-3 text-gray-300 tracking-wide uppercase text-[10px]">
                  {card.title}
                </h3>
                <p className="text-xs text-gray-500 font-light leading-relaxed max-w-[240px]">
                  {card.description}
                </p>
                {card.extra}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
