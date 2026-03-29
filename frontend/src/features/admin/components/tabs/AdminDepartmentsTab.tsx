import type { DepartmentItem } from "../../../../hooks/useAdminData";

type AdminDepartmentsTabProps = {
  deptError: string | null;
  departmentName: string;
  filteredDepartments: DepartmentItem[];
  deptNameDrafts: Record<number, string>;
  onDepartmentNameChange: (value: string) => void;
  onDeptNameDraftChange: (deptId: number, value: string) => void;
  onCreateDepartment: () => void;
  onRenameDepartment: (deptId: number, name: string) => void;
  onDeleteDepartment: (deptId: number) => void;
};

export default function AdminDepartmentsTab({
  deptError,
  departmentName,
  filteredDepartments,
  deptNameDrafts,
  onDepartmentNameChange,
  onDeptNameDraftChange,
  onCreateDepartment,
  onRenameDepartment,
  onDeleteDepartment,
}: AdminDepartmentsTabProps) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#0a0a0a] overflow-hidden">
      {deptError && (
        <div className="m-5 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {deptError}
        </div>
      )}
      <div className="p-5 border-b border-white/10 flex flex-col gap-3 bg-white/1">
        <h3 className="font-medium text-sm">Departments</h3>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            value={departmentName}
            onChange={(e) => onDepartmentNameChange(e.target.value)}
            placeholder="New department name"
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-white/30"
          />
          <button
            onClick={onCreateDepartment}
            className="px-4 py-2 rounded-lg bg-linear-to-r from-white to-gray-300 text-black text-sm font-medium"
          >
            Add Department
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-xs text-gray-500 bg-linear-to-r from-white/3 to-white/1 border-b border-white/10">
            <tr>
              <th className="px-5 py-3 font-medium">Name</th>
              <th className="px-5 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filteredDepartments.map((dept) => (
              <tr key={dept.id} className="hover:bg-white/2">
                <td className="px-5 py-4">
                  <input
                    value={deptNameDrafts[dept.id] ?? dept.name}
                    onChange={(e) => onDeptNameDraftChange(dept.id, e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                  />
                </td>
                <td className="px-5 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => onRenameDepartment(dept.id, deptNameDrafts[dept.id] ?? dept.name)}
                      className="text-xs px-3 py-1.5 rounded border border-blue-500/30 text-blue-300"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => onDeleteDepartment(dept.id)}
                      className="text-xs px-3 py-1.5 rounded border border-red-500/30 text-red-300"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
