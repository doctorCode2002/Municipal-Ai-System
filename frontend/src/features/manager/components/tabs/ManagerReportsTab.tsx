import SearchInput from "../../../../components/SearchInput";
import ManagerReportsTable from "../ManagerReportsTable";
import type { ManagerReportItem } from "../../../../hooks/useManagerData";

type ManagerReportsTabProps = {
  updateError: string | null;
  reassignReportId: string | null;
  reassignReason: string;
  reassignDepartment: string;
  reassignMessage: string | null;
  departments: string[];
  filteredReports: ManagerReportItem[];
  statusFilter: string;
  urgencyFilter: string;
  statusOptions: string[];
  urgencyOptions: string[];
  searchQuery: string;
  statusDrafts: Record<string, string>;
  updatingId: string | null;
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
  onUrgencyFilterChange: (value: string) => void;
  onReassignDepartmentChange: (value: string) => void;
  onReassignReasonChange: (value: string) => void;
  onSubmitReassign: () => void;
  onCancelReassign: () => void;
  onStatusChange: (reportId: string, value: string) => void;
  onSaveStatus: (reportId: string) => void;
  onRequestReassign: (reportId: string) => void;
};

export default function ManagerReportsTab({
  updateError,
  reassignReportId,
  reassignReason,
  reassignDepartment,
  reassignMessage,
  departments,
  filteredReports,
  statusFilter,
  urgencyFilter,
  statusOptions,
  urgencyOptions,
  searchQuery,
  statusDrafts,
  updatingId,
  onSearchChange,
  onStatusFilterChange,
  onUrgencyFilterChange,
  onReassignDepartmentChange,
  onReassignReasonChange,
  onSubmitReassign,
  onCancelReassign,
  onStatusChange,
  onSaveStatus,
  onRequestReassign,
}: ManagerReportsTabProps) {
  return (
    <div className="h-full flex flex-col max-w-6xl">
      {updateError && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {updateError}
        </div>
      )}
      {reassignReportId && (
        <div className="mb-4 rounded-xl border border-white/10 bg-white/2 p-4">
          <div className="text-sm font-medium mb-3">Reassign Request</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Requested Department (optional)</label>
              <select
                value={reassignDepartment}
                onChange={(e) => onReassignDepartmentChange(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-white/30 transition-colors"
              >
                <option value="" className="bg-[#111]">No preference</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept} className="bg-[#111]">
                    {dept}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Reason</label>
              <input
                value={reassignReason}
                onChange={(e) => onReassignReasonChange(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-white/30 transition-colors"
                placeholder="Short reason for reassignment"
              />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-3">
            <button
              onClick={onSubmitReassign}
              className="px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300 hover:text-blue-200"
            >
              Send Request
            </button>
            <button onClick={onCancelReassign} className="text-xs text-gray-400 hover:text-white">
              Cancel
            </button>
            {reassignMessage && <span className="text-xs text-emerald-300">{reassignMessage}</span>}
          </div>
        </div>
      )}

      <div className="flex gap-4 mb-6">
        <SearchInput
          value={searchQuery}
          onChange={onSearchChange}
          placeholder="Search department reports..."
          className="flex-1"
          inputClassName="w-full rounded-lg"
        />
        <select
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value)}
          className="px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-sm text-white focus:outline-none focus:border-white/30"
        >
          <option value="all" className="bg-[#111]">All Statuses</option>
          {statusOptions.map((status) => (
            <option key={status} value={status} className="bg-[#111]">
              {status}
            </option>
          ))}
        </select>
        <select
          value={urgencyFilter}
          onChange={(e) => onUrgencyFilterChange(e.target.value)}
          className="px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-sm text-white focus:outline-none focus:border-white/30"
        >
          <option value="all" className="bg-[#111]">All Urgency</option>
          {urgencyOptions.map((urgency) => (
            <option key={urgency} value={urgency} className="bg-[#111]">
              {urgency}
            </option>
          ))}
        </select>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/1 overflow-hidden flex flex-col flex-1">
        <div className="overflow-x-auto flex-1">
          <ManagerReportsTable
            reports={filteredReports}
            emptyText="No department reports available."
            statusOptions={statusOptions}
            statusDrafts={statusDrafts}
            updatingId={updatingId}
            onStatusChange={onStatusChange}
            onSave={onSaveStatus}
            onRequestReassign={onRequestReassign}
          />
        </div>
      </div>
    </div>
  );
}

