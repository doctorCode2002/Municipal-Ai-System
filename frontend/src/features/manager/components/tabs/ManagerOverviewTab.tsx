import { MoreVertical, MapPin } from "lucide-react";
import UrgencyBadge from "../../../../components/UrgencyBadge";
import StatusBadge from "../../../../components/StatusBadge";
import type { ManagerMetricItem, ManagerReportItem } from "../../../../hooks/useManagerData";

type ManagerOverviewTabProps = {
  metrics: ManagerMetricItem[];
  reports: ManagerReportItem[];
  onViewAll: () => void;
  onOpenActions: (reportId: string) => void;
};

export default function ManagerOverviewTab({ metrics, reports, onViewAll, onOpenActions }: ManagerOverviewTabProps) {
  return (
    <div className="space-y-8 max-w-6xl">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.length === 0 ? (
          <div className="p-5 rounded-xl border border-white/10 bg-linear-to-br from-white/3 to-white/1 text-sm text-gray-400">
            No analytics available yet.
          </div>
        ) : (
          metrics.map((metric, i) => (
            <div
              key={metric.key || i}
              className="p-5 rounded-xl border border-white/10 bg-linear-to-br from-white/3 to-white/1 flex flex-col hover:border-white/20 transition-all duration-300"
            >
              <div className="flex justify-between items-start mb-4">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${metric.bg} ${metric.border}`}>
                  <metric.icon className={`w-4 h-4 ${metric.color}`} />
                </div>
                {metric.change ? (
                  <span className="text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">
                    {metric.change}
                  </span>
                ) : null}
              </div>
              <h3 className="text-gray-400 text-sm mb-1">{metric.title}</h3>
              <p className="text-2xl font-semibold">{metric.value}</p>
            </div>
          ))
        )}
      </div>

      <div className="rounded-xl border border-white/10 bg-white/1 overflow-hidden flex flex-col">
        <div className="p-5 border-b border-white/10 flex justify-between items-center">
          <h3 className="font-medium text-sm">Recent Department Reports</h3>
          <button onClick={onViewAll} className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
            View All
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs text-gray-500 bg-linear-to-r from-white/3 to-white/1 border-b border-white/10">
              <tr>
                <th className="px-5 py-3 font-medium">ID</th>
                <th className="px-5 py-3 font-medium">Title</th>
                <th className="px-5 py-3 font-medium">Location</th>
                <th className="px-5 py-3 font-medium">Urgency</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {reports.length === 0 ? (
                <tr>
                  <td className="px-5 py-8 text-center text-sm text-gray-400" colSpan={6}>
                    No department reports yet.
                  </td>
                </tr>
              ) : (
                reports.slice(0, 4).map((report, i) => (
                  <tr key={i} className="hover:bg-white/2 transition-colors">
                    <td className="px-5 py-4 font-mono text-xs text-gray-400">{report.id}</td>
                    <td className="px-5 py-4 font-medium">{report.title}</td>
                    <td className="px-5 py-4 text-gray-400 text-xs flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {report.location}
                    </td>
                    <td className="px-5 py-4">
                      <UrgencyBadge value={report.urgency} />
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge value={report.status} />
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => onOpenActions(report.id)}
                        className="p-1.5 hover:bg-white/10 rounded transition-colors text-gray-400 hover:text-white"
                        aria-label="Open report actions"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
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

