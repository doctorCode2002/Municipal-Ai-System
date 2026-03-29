import StatusBadge from "../../../../components/StatusBadge";
import UrgencyBadge from "../../../../components/UrgencyBadge";
import type { ReportItem } from "../../../../hooks/useAdminData";

type AdminReportsTabProps = {
  reportError: string | null;
  reportDeptFilter: string;
  reportStatusFilter: string;
  departmentOptions: string[];
  statusOptions: string[];
  filteredReports: ReportItem[];
  reportDeptDrafts: Record<string, string>;
  reportUpdatingId: string | null;
  onDeptFilterChange: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
  onReportDeptChange: (reportId: string, value: string) => void;
  onReportDeptSave: (reportId: string) => void;
  onReportDelete: (reportId: string) => void;
};

export default function AdminReportsTab({
  reportError,
  reportDeptFilter,
  reportStatusFilter,
  departmentOptions,
  statusOptions,
  filteredReports,
  reportDeptDrafts,
  reportUpdatingId,
  onDeptFilterChange,
  onStatusFilterChange,
  onReportDeptChange,
  onReportDeptSave,
  onReportDelete,
}: AdminReportsTabProps) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#0a0a0a] overflow-hidden flex flex-col h-full">
      {reportError && (
        <div className="m-5 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {reportError}
        </div>
      )}
      <div className="p-5 border-b border-white/10 flex justify-between items-center bg-white/1">
        <h3 className="font-medium text-sm">All Submitted Reports</h3>
        <div className="flex gap-2">
          <select
            value={reportDeptFilter}
            onChange={(e) => onDeptFilterChange(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-white/20"
          >
            <option value="all" className="bg-[#111]">All Departments</option>
            {departmentOptions.map((dept) => (
              <option key={dept} value={dept} className="bg-[#111]">{dept}</option>
            ))}
          </select>
          <select
            value={reportStatusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-white/20"
          >
            <option value="all" className="bg-[#111]">All Statuses</option>
            {statusOptions.map((status) => (
              <option key={status} value={status} className="bg-[#111]">{status}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left text-sm">
          <thead className="text-xs text-gray-500 bg-linear-to-r from-white/3 to-white/1 border-b border-white/10 sticky top-0">
            <tr>
              <th className="px-5 py-3 font-medium">ID</th>
              <th className="px-5 py-3 font-medium">Title</th>
              <th className="px-5 py-3 font-medium">Department</th>
              <th className="px-5 py-3 font-medium">Urgency</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Time</th>
              <th className="px-5 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filteredReports.length === 0 ? (
              <tr>
                <td className="px-5 py-10 text-center text-sm text-gray-400" colSpan={7}>
                  No reports available.
                </td>
              </tr>
            ) : (
              filteredReports.map((report, i) => (
                <tr key={i} className="hover:bg-white/2 transition-colors">
                  <td className="px-5 py-4 text-gray-400 text-xs">{report.id}</td>
                  <td className="px-5 py-4 font-medium">{report.title}</td>
                  <td className="px-5 py-4 text-gray-400 text-xs">
                    <select
                      value={reportDeptDrafts[report.id] ?? report.dept}
                      onChange={(e) => onReportDeptChange(report.id, e.target.value)}
                      className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white"
                    >
                      {departmentOptions.map((dept) => (
                        <option key={dept} value={dept} className="bg-[#111]">{dept}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-5 py-4"><UrgencyBadge value={report.urgency} /></td>
                  <td className="px-5 py-4"><StatusBadge value={report.status} /></td>
                  <td className="px-5 py-4 text-xs text-gray-500">{report.date}</td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onReportDeptSave(report.id)}
                        disabled={reportUpdatingId === report.id}
                        className="text-xs px-3 py-1.5 rounded border border-blue-500/30 text-blue-300 disabled:opacity-60"
                      >
                        {reportUpdatingId === report.id ? "Saving..." : "Save"}
                      </button>
                      <button
                        onClick={() => onReportDelete(report.id)}
                        className="text-xs px-3 py-1.5 rounded border border-red-500/30 text-red-300"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
