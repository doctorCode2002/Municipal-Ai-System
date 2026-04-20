import React, { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Search, Bell, User, Clock, ShieldAlert, CheckCircle2 } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

export default function DashboardPreview() {
  const containerRef = useRef<HTMLElement>(null);

  useGSAP(() => {
    let mm = gsap.matchMedia();

    mm.add("(min-width: 768px)", () => {
      // Desktop Setup
      gsap.set(".dashboard-frame", { rotateX: 40, rotateY: -20, y: 150, opacity: 0 });
      gsap.set(".dashboard-row", { opacity: 0, x: -40 });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top end",
          end: "bottom 70%",
          scrub: 1.5,
        }
      });

      tl.to(".dashboard-frame", {
        rotateX: 5,
        rotateY: 0,
        y: 0,
        opacity: 1,
        duration: 1.5,
        ease: "power2.out"
      });

      tl.to(".dashboard-row", {
        opacity: 1,
        x: 0,
        duration: 1,
        stagger: 0.2,
        ease: "power2.out"
      }, "-=1.0");
    });

    mm.add("(max-width: 767px)", () => {
      // Mobile Setup: Less tilt, less offset
      gsap.set(".dashboard-frame", { rotateX: 20, rotateY: -10, y: 80, opacity: 0 });
      gsap.set(".dashboard-row", { opacity: 0, x: -20 });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top bottom",
          end: "bottom 90%",
          scrub: 1,
        }
      });

      tl.to(".dashboard-frame", {
        rotateX: 0,
        rotateY: 0,
        y: 0,
        opacity: 1,
        duration: 1,
      });

      tl.to(".dashboard-row", {
        opacity: 1,
        x: 0,
        duration: 0.5,
        stagger: 0.1,
      }, "-=0.5");
    });

    return () => mm.revert();
  }, { scope: containerRef });

  const reports = [
    {
      issue: "Main St. Pothole",
      category: "Roads",
      priority: "High",
      status: "In Progress",
      prediction: 94,
    },
    {
      issue: "Broken Streetlight",
      category: "Public Safety",
      priority: "Medium",
      status: "Reported",
      prediction: 88,
    },
    {
      issue: "Illegal Dumping",
      category: "Waste Management",
      priority: "High",
      status: "Dispatched",
      prediction: 91,
    },
  ];

  return (
    <section ref={containerRef} id="preview" className="py-24 px-8 md:px-12 border-t border-white/10 relative overflow-hidden bg-linear-to-b from-black to-[#050505]">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/5 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/5 blur-[100px] pointer-events-none" />

      <div className="max-w-6xl mx-auto flex flex-col items-center">
        <div className="text-center mb-16 max-w-2xl">
          <h2 className="text-2xl md:text-3xl font-serif mb-4 tracking-tight text-white">
            Operational Intelligence
          </h2>
          <p className="text-gray-400 text-xs md:text-sm font-light leading-relaxed">
            A unified dashboard for department managers to oversee automated routing, 
            verify AI predictions, and manage municipal resources with precision.
          </p>
        </div>

        {/* 3D Dashboard Container */}
        <div className="relative w-full perspective-2000">
          <div className="dashboard-frame w-full max-w-5xl mx-auto rounded-3xl border border-white/15 bg-black/40 backdrop-blur-xl shadow-[0_50px_100px_rgba(0,0,0,0.5)] overflow-hidden">
            {/* Header Mockup */}
            <div className="border-b border-white/10 px-4 md:px-8 py-3 md:py-4 flex items-center justify-between bg-white/3">
              <div className="flex items-center gap-3 md:gap-4 font-mono">
                <div className="w-6 h-6 md:w-8 md:h-8 rounded-lg bg-linear-to-br from-white/20 to-transparent border border-white/10" />
                <div className="h-3 md:h-4 w-24 md:w-32 rounded-full bg-white/10" />
              </div>
              <div className="flex items-center gap-3 md:gap-4">
                <Search className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-500" />
                <Bell className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-500" />
                <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                  <User className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-400" />
                </div>
              </div>
            </div>

            {/* Sidebar + Table Mockup */}
            <div className="flex">
              <div className="flex-1 p-4 md:p-8">
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center mb-6 md:mb-8">
                  <div className="space-y-2">
                    <div className="h-5 md:h-6 w-32 md:w-40 rounded-lg bg-white/10" />
                    <div className="h-1.5 md:h-2 w-20 md:w-24 rounded-full bg-white/5" />
                  </div>
                  <div className="flex gap-2">
                    <div className="h-7 md:h-8 w-20 md:w-24 rounded-lg bg-white/10 border border-white/5" />
                    <div className="h-7 md:h-8 w-20 md:w-24 rounded-lg bg-white/20" />
                  </div>
                </div>

                <div className="space-y-3 md:space-y-4">
                  {reports.map((report, i) => (
                    <div
                      key={i}
                      className="dashboard-row grid grid-cols-2 lg:grid-cols-4 items-center gap-y-3 md:gap-y-0 p-3 md:p-4 rounded-xl bg-white/3 border border-white/5 hover:bg-white/5 transition-colors duration-300"
                    >
                      <div className="text-[11px] md:text-xs text-white font-medium truncate pr-2">{report.issue}</div>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] md:text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          {report.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {report.priority === "High" ? (
                          <ShieldAlert className="w-3 md:w-3.5 h-3 md:h-3.5 text-red-500" />
                        ) : (
                          <Clock className="w-3 md:w-3.5 h-3 md:h-3.5 text-amber-500" />
                        )}
                        <span className={`text-[9px] md:text-[10px] font-medium ${report.priority === "High" ? "text-red-400" : "text-amber-400"}`}>
                          {report.priority}
                        </span>
                      </div>
                      <div className="flex lg:justify-end sm:pr-2 col-span-2 lg:col-span-1 border-t lg:border-none border-white/5 pt-2 lg:pt-0">
                        <div className="flex items-center gap-2 group/tag">
                          <CheckCircle2 className="w-3 md:w-3.5 h-3 md:h-3.5 text-emerald-500 opacity-50" />
                          <span className="text-[9px] md:text-[10px] text-emerald-400/80 font-mono tracking-tighter">AI Confidence: {report.prediction}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
