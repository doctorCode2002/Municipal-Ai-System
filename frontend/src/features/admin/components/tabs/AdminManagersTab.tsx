import { Plus } from "lucide-react";
import type { ManagerItem } from "../../../../hooks/useAdminData";

type AdminManagersTabProps = {
  deptError: string | null;
  newManagerUsername: string;
  newManagerEmail: string;
  newManagerPassword: string;
  newManagerDepartment: string;
  departmentOptions: string[];
  filteredManagers: ManagerItem[];
  managerEmailDrafts: Record<number, string>;
  deptDrafts: Record<number, string>;
  onNewManagerUsernameChange: (value: string) => void;
  onNewManagerEmailChange: (value: string) => void;
  onNewManagerPasswordChange: (value: string) => void;
  onNewManagerDepartmentChange: (value: string) => void;
  onManagerEmailDraftChange: (managerId: number, value: string) => void;
  onDeptChange: (managerId: number, value: string) => void;
  onCreateManager: () => void;
  onUpdateManager: (managerId: number) => void;
  onDeleteManager: (managerId: number) => void;
};

export default function AdminManagersTab({
  deptError,
  newManagerUsername,
  newManagerEmail,
  newManagerPassword,
  newManagerDepartment,
  departmentOptions,
  filteredManagers,
  managerEmailDrafts,
  deptDrafts,
  onNewManagerUsernameChange,
  onNewManagerEmailChange,
  onNewManagerPasswordChange,
  onNewManagerDepartmentChange,
  onManagerEmailDraftChange,
  onDeptChange,
  onCreateManager,
  onUpdateManager,
  onDeleteManager,
}: AdminManagersTabProps) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#0a0a0a] overflow-hidden">
      {deptError && (
        <div className="m-5 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {deptError}
        </div>
      )}
      <div className="p-5 border-b border-white/10 flex flex-col gap-3 bg-white/1">
        <h3 className="font-medium text-sm">Add Manager</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input
            value={newManagerUsername}
            onChange={(e) => onNewManagerUsernameChange(e.target.value)}
            placeholder="Username"
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
          />
          <input
            value={newManagerEmail}
            onChange={(e) => onNewManagerEmailChange(e.target.value)}
            placeholder="Email (optional)"
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
          />
          <input
            type="password"
            value={newManagerPassword}
            onChange={(e) => onNewManagerPasswordChange(e.target.value)}
            placeholder="Password"
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
          />
          <select
            value={newManagerDepartment}
            onChange={(e) => onNewManagerDepartmentChange(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
          >
            <option value="" className="bg-[#111]">Select department</option>
            {departmentOptions.map((dept) => (
              <option key={dept} value={dept} className="bg-[#111]">{dept}</option>
            ))}
          </select>
        </div>
        <div>
          <button onClick={onCreateManager} className="px-4 py-2 rounded-lg bg-linear-to-r from-white to-gray-300 text-black text-sm font-medium">
            Create Manager
          </button>
        </div>
      </div>

      <div className="p-5 border-b border-white/10 flex justify-between items-center bg-white/1">
        <h3 className="font-medium text-sm">Department Managers</h3>
        <button className="px-4 py-2 rounded-lg bg-linear-to-r from-white to-gray-300 text-black hover:from-gray-200 hover:to-gray-400 transition-all duration-300 text-xs font-medium flex items-center gap-2 shadow-[0_0_15px_rgba(255,255,255,0.1)]">
          <Plus className="w-3.5 h-3.5" /> Add Manager
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-xs text-gray-500 bg-linear-to-r from-white/3 to-white/1 border-b border-white/10">
            <tr>
              <th className="px-5 py-3 font-medium">Name</th>
              <th className="px-5 py-3 font-medium">Email</th>
              <th className="px-5 py-3 font-medium">Department</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filteredManagers.length === 0 ? (
              <tr>
                <td className="px-5 py-10 text-center text-sm text-gray-400" colSpan={5}>
                  No managers assigned yet.
                </td>
              </tr>
            ) : (
              filteredManagers.map((manager, i) => (
                <tr key={i} className="hover:bg-white/2 transition-colors">
                  <td className="px-5 py-4 font-medium flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center border border-white/20 text-xs">
                      {manager.name.split(" ").map((n) => n[0]).join("")}
                    </div>
                    {manager.name}
                  </td>
                  <td className="px-5 py-4 text-gray-400 text-xs">
                    <input
                      value={managerEmailDrafts[manager.id] ?? manager.email ?? ""}
                      onChange={(e) => onManagerEmailDraftChange(manager.id, e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white"
                    />
                  </td>
                  <td className="px-5 py-4 text-gray-300 text-xs">
                    <div className="flex items-center gap-2">
                      <select
                        value={deptDrafts[manager.id] ?? manager.dept ?? ""}
                        onChange={(e) => onDeptChange(manager.id, e.target.value)}
                        className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-white/30 transition-colors"
                      >
                        <option value="" disabled className="bg-[#111]">Select department</option>
                        {departmentOptions.map((dept) => (
                          <option key={dept} value={dept} className="bg-[#111]">{dept}</option>
                        ))}
                      </select>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`text-[10px] px-2 py-1 rounded font-medium border ${manager.status === "Active" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-gray-500/10 text-gray-400 border-gray-500/20"}`}>
                      {manager.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onUpdateManager(manager.id)}
                        className="text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors px-3 py-1.5 rounded bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => onDeleteManager(manager.id)}
                        className="text-xs font-medium text-red-300 hover:text-red-200 transition-colors px-3 py-1.5 rounded border border-red-500/30"
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
