import { AlertCircle, Building, Clock } from "lucide-react";
import PlatformCarousel from "./PlatformCarousel";
import ScrubReveal from "./ScrubReveal";

export default function PlatformSection() {
  return (
    <section id="platform" className="py-24 px-8 md:px-12 relative">
      <div className="max-w-6xl mx-auto">
        <ScrubReveal y={20} className="text-center mb-16">
          <h2 className="text-2xl md:text-3xl font-serif mb-4 tracking-tight bg-linear-to-r from-white to-gray-400 bg-clip-text text-transparent">
            AI-Assisted Triage, End to End
          </h2>
          <p className="text-gray-400 text-xs md:text-sm max-w-2xl mx-auto font-light leading-relaxed">
            Citizen reports are converted into actionable tickets with predicted priority, mapped department,
            and clear workflow handoff to managers and admins.
          </p>
        </ScrubReveal>

        <div className="hidden md:grid grid-cols-1 md:grid-cols-3 gap-6">
          <ScrubReveal y={20} delay={0.1} className="p-6 rounded-2xl border border-white/10 bg-linear-to-br from-white/3 to-white/1 hover:from-white/5 hover:to-white/2 transition-all duration-300 hover:border-white/20">
            <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center mb-6 border border-red-500/20">
              <AlertCircle className="w-4 h-4 text-red-400" />
            </div>
            <h3 className="text-sm font-medium mb-2">Priority Prediction</h3>
            <p className="text-xs text-gray-400 font-light leading-relaxed">
              On submission, each report receives an AI-predicted priority so urgent cases are surfaced faster
              and teams can process queues with clearer risk signals.
            </p>
          </ScrubReveal>

          <ScrubReveal y={20} delay={0.2} className="p-6 rounded-2xl border border-white/10 bg-linear-to-br from-white/3 to-white/1 hover:from-white/5 hover:to-white/2 transition-all duration-300 hover:border-white/20">
            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center mb-6 border border-blue-500/20">
              <Building className="w-4 h-4 text-blue-400" />
            </div>
            <h3 className="text-sm font-medium mb-2">Department Routing</h3>
            <p className="text-xs text-gray-400 font-light leading-relaxed">
              Reports are routed to departments automatically based on model output, reducing manual triage and
              helping each manager focus on the requests relevant to their team.
            </p>
          </ScrubReveal>

          <ScrubReveal y={20} delay={0.3} className="p-6 rounded-2xl border border-white/10 bg-linear-to-br from-white/3 to-white/1 hover:from-white/5 hover:to-white/2 transition-all duration-300 hover:border-white/20">
            <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center mb-6 border border-amber-500/20">
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <h3 className="text-sm font-medium mb-2">Workflow Tracking</h3>
            <p className="text-xs text-gray-400 font-light leading-relaxed">
              Managers update report status from Pending to In Progress and Resolved, while admins oversee
              cross-department reassignment and complete system-wide visibility.
            </p>
          </ScrubReveal>
        </div>

        <PlatformCarousel />
      </div>
    </section>
  );
}
