import { Activity, CheckCircle2, Clock, FileText } from "lucide-react";
import StatusBadge from "../../../../components/StatusBadge";
import UrgencyBadge from "../../../../components/UrgencyBadge";
import type { MetricItem, ReportItem } from "../../../../hooks/useAdminData";

type AdminOverviewTabProps = {
  metrics: MetricItem[];
  recentReports: ReportItem[];
  filteredReports: ReportItem[];
  onViewAllReports: () => void;
};

export default function AdminOverviewTab({
  metrics,
  recentReports,
  filteredReports,
  onViewAllReports,
}: AdminOverviewTabProps) {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.length === 0 ? (
          <div className="p-5 rounded-xl border border-white/10 bg-linear-to-br from-white/3 to-white/1 text-sm text-gray-400">
            No analytics available yet.
          </div>
        ) : (
          metrics.map((metric, i) => (
            <div
              key={i}
              className="p-5 rounded-xl border border-white/10 bg-linear-to-br from-white/3 to-white/1 flex flex-col hover:border-white/20 transition-all duration-300"
            >
              <div className="flex justify-between items-start mb-4">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${metric.bg} ${metric.border}`}>
                  {metric.icon === "FileText" && <FileText className={`w-4 h-4 ${metric.color}`} />}
                  {metric.icon === "CheckCircle2" && <CheckCircle2 className={`w-4 h-4 ${metric.color}`} />}
                  {metric.icon === "Clock" && <Clock className={`w-4 h-4 ${metric.color}`} />}
                  {metric.icon === "Activity" && <Activity className={`w-4 h-4 ${metric.color}`} />}
                </div>
                {metric.change ? (
                  <span className={`text-xs font-medium ${metric.change.startsWith("+") ? "text-emerald-400" : "text-red-400"}`}>
                    {metric.change}
                  </span>
                ) : null}
              </div>
              <span className="text-gray-400 text-xs mb-1">{metric.title}</span>
              <span className="text-2xl font-serif tracking-tight">{metric.value}</span>
            </div>
          ))
        )}
      </div>

      <div className="rounded-xl border border-white/10 bg-[#0a0a0a] overflow-hidden">
        <div className="p-5 border-b border-white/10 flex justify-between items-center">
          <h3 className="font-medium text-sm">Recent Reports</h3>
          <button onClick={onViewAllReports} className="text-xs text-gray-400 hover:text-white transition-colors">
            View All
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs text-gray-500 bg-linear-to-r from-white/3 to-white/1 border-b border-white/10">
              <tr>
                <th className="px-5 py-3 font-medium">ID</th>
                <th className="px-5 py-3 font-medium">Title</th>
                <th className="px-5 py-3 font-medium">Department</th>
                <th className="px-5 py-3 font-medium">Urgency</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {recentReports.length === 0 ? (
                <tr>
                  <td className="px-5 py-8 text-center text-sm text-gray-400" colSpan={5}>
                    No reports yet.
                  </td>
                </tr>
              ) : (
                filteredReports.slice(0, 4).map((report, i) => (
                  <tr key={i} className="hover:bg-white/2 transition-colors">
                    <td className="px-5 py-3 text-gray-400 text-xs">{report.id}</td>
                    <td className="px-5 py-3 font-medium">{report.title}</td>
                    <td className="px-5 py-3 text-gray-400 text-xs">{report.dept}</td>
                    <td className="px-5 py-3">
                      <UrgencyBadge value={report.urgency} />
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge value={report.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

