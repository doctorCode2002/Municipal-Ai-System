import { MapPin, ShieldCheck } from "lucide-react";
import ScrubReveal from "./ScrubReveal";

export default function SolutionsSection() {
  return (
    <section id="solutions" className="py-24 px-8 md:px-12 border-t border-white/10 bg-white/1">
      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-16">
        <ScrubReveal x={-20} className="flex-1">
          <h2 className="text-2xl md:text-3xl font-serif mb-4 tracking-tight bg-linear-to-r from-white to-gray-400 bg-clip-text text-transparent">
            One workflow, three roles.
          </h2>
          <p className="text-gray-400 text-xs md:text-sm font-light leading-relaxed mb-8">
            Citizens submit issues, managers process department queues, and admins keep the full municipal flow
            coordinated. AI supports routing and priority decisions where teams need speed most.
          </p>
          <ul className="space-y-4">
            {[
              "Guided citizen reporting with location and district fields",
              "Category suggestion with confidence while drafting reports",
              "Automatic department assignment and priority prediction on submit",
              "Manager status updates plus admin reassignment approval workflow",
            ].map((item, i) => (
              <li key={i} className="flex items-center gap-3 text-xs text-gray-300">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                {item}
              </li>
            ))}
          </ul>
        </ScrubReveal>

        <ScrubReveal x={20} delay={0.2} className="flex-1 w-full max-w-md">
          <div className="rounded-2xl border border-white/10 bg-[#0a0a0a] p-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-red-500 via-amber-500 to-blue-500" />

            <div className="flex justify-between items-start mb-6">
              <div>
                <span className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">
                  New Report RPT-004291
                </span>
                <h4 className="text-sm font-medium mt-1">"Streetlight outage near school entrance"</h4>
              </div>
              <span className="text-[10px] text-gray-400">Just now</span>
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-400 mb-6 bg-white/5 p-3 rounded-lg border border-white/5">
              <MapPin className="w-3.5 h-3.5" />
              Al-Nasr St. / School Gate 2
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-white/5">
                <span className="text-xs text-gray-500">Category Suggestion</span>
                <span className="text-[10px] px-2 py-1 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-medium">
                  Street Lights (94%)
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-white/5">
                <span className="text-xs text-gray-500">AI Predicted Priority</span>
                <span className="text-[10px] px-2 py-1 rounded bg-red-500/10 text-red-400 border border-red-500/20 font-medium">
                  High
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-white/5">
                <span className="text-xs text-gray-500">Assigned Department</span>
                <span className="text-[10px] px-2 py-1 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium">
                  Electrical Maintenance
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-xs text-gray-500">Current Status</span>
                <span className="text-[10px] px-2 py-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
                  Routed
                </span>
              </div>
            </div>

            <button className="w-full mt-6 py-2.5 rounded-lg bg-linear-to-r from-white/10 to-white/5 hover:from-white/20 hover:to-white/10 transition-all duration-300 text-xs font-medium border border-white/10 hover:border-white/20 hover:shadow-[0_0_15px_rgba(255,255,255,0.1)]">
              Open Manager Queue
            </button>
          </div>
        </ScrubReveal>
      </div>
    </section>
  );
}
