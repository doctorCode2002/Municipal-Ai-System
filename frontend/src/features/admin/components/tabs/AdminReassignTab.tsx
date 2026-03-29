import type { ReassignRequest } from "../../../../hooks/useAdminData";

type AdminReassignTabProps = {
  requests: ReassignRequest[];
  departmentOptions: string[];
  requestDeptDrafts: Record<number, string>;
  onRequestDeptDraftChange: (requestId: number, value: string) => void;
  onApprove: (requestId: number) => void;
  onReject: (requestId: number) => void;
};

export default function AdminReassignTab({
  requests,
  departmentOptions,
  requestDeptDrafts,
  onRequestDeptDraftChange,
  onApprove,
  onReject,
}: AdminReassignTabProps) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#0a0a0a] overflow-hidden">
      <div className="p-5 border-b border-white/10 bg-white/1">
        <h3 className="font-medium text-sm mb-3">Reassign Requests</h3>
        {requests.length === 0 ? (
          <div className="text-xs text-gray-400">No pending requests.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs text-gray-500">
                <tr>
                  <th className="px-3 py-2">Report</th>
                  <th className="px-3 py-2">From</th>
                  <th className="px-3 py-2">Requested</th>
                  <th className="px-3 py-2">Reason</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {requests.map((req) => (
                  <tr key={req.id}>
                    <td className="px-3 py-2 text-xs text-gray-400">{req.reportId}</td>
                    <td className="px-3 py-2 text-xs text-gray-400">{req.fromDepartment}</td>
                    <td className="px-3 py-2 text-xs text-gray-400">{req.requestedDepartment || "-"}</td>
                    <td className="px-3 py-2 text-xs text-gray-400">{req.reason}</td>
                    <td className="px-3 py-2 text-xs text-gray-400">{req.status}</td>
                    <td className="px-3 py-2 text-right">
                      {req.status === "Pending" ? (
                        <div className="flex items-center justify-end gap-2">
                          <select
                            value={requestDeptDrafts[req.id] || req.requestedDepartment || ""}
                            onChange={(e) => onRequestDeptDraftChange(req.id, e.target.value)}
                            className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white"
                          >
                            <option value="" className="bg-[#111]">Select dept</option>
                            {departmentOptions.map((dept) => (
                              <option key={dept} value={dept} className="bg-[#111]">{dept}</option>
                            ))}
                          </select>
                          <button
                            onClick={() => onApprove(req.id)}
                            className="text-xs px-2 py-1 rounded border border-emerald-500/30 text-emerald-300"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => onReject(req.id)}
                            className="text-xs px-2 py-1 rounded border border-red-500/30 text-red-300"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-500">--</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
