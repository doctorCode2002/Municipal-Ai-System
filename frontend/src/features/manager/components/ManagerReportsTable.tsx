import { MapPin } from "lucide-react";
import StatusBadge from "../../../components/StatusBadge";
import UrgencyBadge from "../../../components/UrgencyBadge";

export type ManagerReportRow = {
  id: string;
  title: string;
  location: string;
  urgency: string;
  status: string;
  date: string;
};

type ManagerReportsTableProps = {
  reports: ManagerReportRow[];
  emptyText: string;
  statusOptions: string[];
  statusDrafts: Record<string, string>;
  updatingId: string | null;
  onStatusChange: (reportId: string, value: string) => void;
  onSave: (reportId: string) => void;
  onRequestReassign: (reportId: string) => void;
  compact?: boolean;
};

export default function ManagerReportsTable({
  reports,
  emptyText,
  statusOptions,
  statusDrafts,
  updatingId,
  onStatusChange,
  onSave,
  onRequestReassign,
  compact = false,
}: ManagerReportsTableProps) {
  const columns = compact ? 6 : 7;

  return (
    <table className="w-full text-left text-sm">
      <thead className="text-xs text-gray-500 bg-linear-to-r from-white/3 to-white/1 border-b border-white/10">
        <tr>
          <th className="px-5 py-3 font-medium">ID</th>
          <th className="px-5 py-3 font-medium">Title</th>
          <th className="px-5 py-3 font-medium">Location</th>
          <th className="px-5 py-3 font-medium">Urgency</th>
          <th className="px-5 py-3 font-medium">Status</th>
          {!compact && <th className="px-5 py-3 font-medium">Date</th>}
          <th className="px-5 py-3 font-medium text-right">Actions</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-white/5">
        {reports.length === 0 ? (
          <tr>
            <td className="px-5 py-10 text-center text-sm text-gray-400" colSpan={columns}>
              {emptyText}
            </td>
          </tr>
        ) : (
          reports.map((report) => (
            <tr key={report.id} className="hover:bg-white/2 transition-colors">
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
              {!compact && <td className="px-5 py-4 text-gray-400 text-xs">{report.date}</td>}
              <td className="px-5 py-4 text-right">
                <div className="flex items-center justify-end gap-2">
                  <select
                    value={statusDrafts[report.id] ?? report.status}
                    onChange={(e) => onStatusChange(report.id, e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-white/30 transition-colors"
                  >
                    {statusOptions.map((status) => (
                      <option key={status} value={status} className="bg-[#111]">
                        {status}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => onSave(report.id)}
                    disabled={updatingId === report.id}
                    className="text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors px-3 py-1.5 rounded bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 disabled:opacity-60"
                  >
                    {updatingId === report.id ? "Saving..." : "Save"}
                  </button>
                  <button
                    onClick={() => onRequestReassign(report.id)}
                    className="text-xs font-medium text-gray-300 hover:text-white transition-colors px-3 py-1.5 rounded border border-white/10 hover:border-white/30"
                  >
                    Request Reassign
                  </button>
                </div>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}

