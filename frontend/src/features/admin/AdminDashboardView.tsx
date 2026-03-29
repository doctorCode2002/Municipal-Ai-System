import { useState } from "react";
import { motion } from "motion/react";
import {
  LayoutDashboard,
  Users,
  FileText,
  Settings,
  LogOut,
  AlertTriangle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { apiFetch, getAuthToken } from "../../services/api";
import SearchInput from "../../components/SearchInput";
import { useAdminData } from "../../hooks/useAdminData";
import { useAdminFilters } from "./hooks/useAdminFilters";
import AdminOverviewTab from "./components/tabs/AdminOverviewTab";
import AdminReportsTab from "./components/tabs/AdminReportsTab";
import AdminReassignTab from "./components/tabs/AdminReassignTab";
import AdminManagersTab from "./components/tabs/AdminManagersTab";
import AdminDepartmentsTab from "./components/tabs/AdminDepartmentsTab";

export default function AdminDashboardView() {
  const [activeTab, setActiveTab] = useState<
    "overview" | "reports" | "reassign" | "managers" | "departments"
  >("overview");
  const [deptDrafts, setDeptDrafts] = useState<Record<number, string>>({});
  const [deptError, setDeptError] = useState<string | null>(null);
  const [departmentName, setDepartmentName] = useState("");
  const [deptNameDrafts, setDeptNameDrafts] = useState<Record<number, string>>({});
  const [newManagerUsername, setNewManagerUsername] = useState("");
  const [newManagerEmail, setNewManagerEmail] = useState("");
  const [newManagerPassword, setNewManagerPassword] = useState("");
  const [newManagerDepartment, setNewManagerDepartment] = useState("");
  const [managerEmailDrafts, setManagerEmailDrafts] = useState<Record<number, string>>({});
  const [reportDeptDrafts, setReportDeptDrafts] = useState<Record<string, string>>({});
  const [reportUpdatingId, setReportUpdatingId] = useState<string | null>(null);
  const [reportError, setReportError] = useState<string | null>(null);
  const [requestDeptDrafts, setRequestDeptDrafts] = useState<Record<number, string>>({});
  const authToken = getAuthToken();
  const navigate = useNavigate();
  const {
    metrics,
    recentReports,
    managers,
    departments,
    reassignRequests,
    setManagers,
    setRecentReports,
    setDepartments,
    setReassignRequests,
  } = useAdminData(Boolean(authToken));
  const {
    searchQuery,
    reportDeptFilter,
    reportStatusFilter,
    filteredReports,
    filteredManagers,
    filteredDepartments,
    setSearchQuery,
    setReportDeptFilter,
    setReportStatusFilter,
  } = useAdminFilters({
    reports: recentReports,
    managers,
    departments,
  });

  const handleLogout = () => {
    if (authToken) {
      apiFetch("/api/auth/logout", { method: "POST" }).catch(() => undefined);
    }
    localStorage.removeItem("auth.token");
    localStorage.removeItem("auth.user");
    navigate("/");
  };

  const departmentOptions = departments.map((dept) => dept.name);
  const statusOptions = ["Pending", "In Progress", "Resolved", "Routed"];

  const handleDeptChange = (managerId: number, value: string) => {
    setDeptDrafts((prev) => ({ ...prev, [managerId]: value }));
  };

  const handleCreateManager = async () => {
    if (!authToken) return;
    if (!newManagerUsername.trim() || !newManagerPassword.trim() || !newManagerDepartment) return;
    try {
      const response = await apiFetch("/api/admin/managers", {
        method: "POST",
        body: JSON.stringify({
          username: newManagerUsername.trim(),
          email: newManagerEmail.trim() || undefined,
          password: newManagerPassword,
          department: newManagerDepartment,
        }),
      });
      if (!response.ok) throw new Error("Create manager failed");
      const data = await response.json();
      setManagers((prev) => [...prev, data]);
      setNewManagerUsername("");
      setNewManagerEmail("");
      setNewManagerPassword("");
      setNewManagerDepartment("");
    } catch (err) {
      setDeptError(err instanceof Error ? err.message : "Create manager failed");
    }
  };

  const handleUpdateManager = async (managerId: number) => {
    if (!authToken) return;
    const email = managerEmailDrafts[managerId];
    const department = deptDrafts[managerId];
    try {
      const response = await apiFetch(`/api/admin/managers/${managerId}`, {
        method: "PUT",
        body: JSON.stringify({
          email,
          department,
        }),
      });
      if (!response.ok) throw new Error("Update manager failed");
      const data = await response.json();
      setManagers((prev) => prev.map((m) => (m.id === managerId ? data : m)));
    } catch (err) {
      setDeptError(err instanceof Error ? err.message : "Update manager failed");
    }
  };

  const handleDeleteManager = async (managerId: number) => {
    if (!authToken) return;
    try {
      const response = await apiFetch(`/api/admin/managers/${managerId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Delete manager failed");
      setManagers((prev) => prev.filter((m) => m.id !== managerId));
    } catch (err) {
      setDeptError(err instanceof Error ? err.message : "Delete manager failed");
    }
  };

  const handleCreateDepartment = async () => {
    if (!authToken || !departmentName.trim()) return;
    try {
      const response = await apiFetch("/api/admin/departments", {
        method: "POST",
        body: JSON.stringify({ name: departmentName.trim() }),
      });
      if (!response.ok) {
        let message = `Create failed (${response.status})`;
        try {
          const data = await response.json();
          if (data?.detail) message = data.detail;
        } catch {
          // ignore
        }
        throw new Error(message);
      }
      const data = await response.json();
      setDepartments((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      setDepartmentName("");
    } catch (err) {
      setDeptError(err instanceof Error ? err.message : "Create failed");
    }
  };

  const handleRenameDepartment = async (deptId: number, newName: string) => {
    if (!authToken || !newName.trim()) return;
    try {
      const response = await apiFetch(`/api/admin/departments/${deptId}`, {
        method: "PUT",
        body: JSON.stringify({ name: newName.trim() }),
      });
      if (!response.ok) throw new Error("Rename failed");
      const data = await response.json();
      setDepartments((prev) =>
        prev.map((dept) => (dept.id === deptId ? data : dept))
      );
    } catch (err) {
      setDeptError(err instanceof Error ? err.message : "Rename failed");
    }
  };

  const handleDeleteDepartment = async (deptId: number) => {
    if (!authToken) return;
    try {
      const response = await apiFetch(`/api/admin/departments/${deptId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Delete failed");
      setDepartments((prev) => prev.filter((dept) => dept.id !== deptId));
    } catch (err) {
      setDeptError(err instanceof Error ? err.message : "Delete failed");
    }
  };

  const handleReportDeptChange = (reportId: string, value: string) => {
    setReportDeptDrafts((prev) => ({ ...prev, [reportId]: value }));
  };

  const handleReportDeptSave = async (reportId: string) => {
    if (!authToken) return;
    const department = reportDeptDrafts[reportId];
    if (!department) return;
    setReportUpdatingId(reportId);
    setReportError(null);
    try {
      const response = await apiFetch(`/api/admin/reports/${reportId}/department`, {
        method: "POST",
        body: JSON.stringify({ department }),
      });
      if (!response.ok) throw new Error("Update failed");
      const updated = await response.json();
      setRecentReports((prev) =>
        prev.map((report) =>
          report.id === reportId ? { ...report, dept: updated.department || updated.agency } : report
        )
      );
    } catch (err) {
      setReportError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setReportUpdatingId(null);
    }
  };

  const handleReportDelete = async (reportId: string) => {
    if (!authToken) return;
    setReportError(null);
    try {
      const response = await apiFetch(`/api/admin/reports/${reportId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Delete failed");
      setRecentReports((prev) => prev.filter((report) => report.id !== reportId));
    } catch (err) {
      setReportError(err instanceof Error ? err.message : "Delete failed");
    }
  };

  const handleApproveRequest = async (requestId: number) => {
    if (!authToken) return;
    const fallback = reassignRequests.find((req) => req.id === requestId)?.requestedDepartment;
    const department = requestDeptDrafts[requestId] || fallback;
    if (!department) return;
    await apiFetch(`/api/admin/reassign-requests/${requestId}/approve`, {
      method: "POST",
      body: JSON.stringify({ department }),
    });
    setReassignRequests((prev) =>
      prev.map((req) => (req.id === requestId ? { ...req, status: "Approved" } : req))
    );
  };

  const handleRejectRequest = async (requestId: number) => {
    if (!authToken) return;
    await apiFetch(`/api/admin/reassign-requests/${requestId}/reject`, {
      method: "POST",
    });
    setReassignRequests((prev) =>
      prev.map((req) => (req.id === requestId ? { ...req, status: "Rejected" } : req))
    );
  };

  return (
    <div className="min-h-screen w-full bg-[#030303] text-white font-sans flex selection:bg-white/20">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/10 bg-[#0a0a0a] flex flex-col shrink-0">
        <div className="p-6 flex items-center gap-3 border-b border-white/10">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 2L2 7L12 12L22 7L12 2Z"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M2 17L12 22L22 17"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M2 12L12 17L22 12"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="font-serif font-semibold tracking-wide text-lg bg-linear-to-r from-white to-gray-400 bg-clip-text text-transparent">
            CivicMind
          </span>
        </div>

        <div className="p-4 flex-1 flex flex-col gap-2">
          <button
            onClick={() => setActiveTab("overview")}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 border ${activeTab === "overview" ? "bg-linear-to-r from-white/10 to-white/5 border-white/20 text-white shadow-[0_0_15px_rgba(255,255,255,0.05)]" : "border-transparent text-gray-400 hover:text-white hover:bg-white/5"}`}
          >
            <LayoutDashboard className="w-4 h-4" /> Overview
          </button>
          <button
            onClick={() => setActiveTab("reports")}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 border ${activeTab === "reports" ? "bg-linear-to-r from-white/10 to-white/5 border-white/20 text-white shadow-[0_0_15px_rgba(255,255,255,0.05)]" : "border-transparent text-gray-400 hover:text-white hover:bg-white/5"}`}
          >
            <FileText className="w-4 h-4" /> All Reports
          </button>
          <button
            onClick={() => setActiveTab("reassign")}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 border ${activeTab === "reassign" ? "bg-linear-to-r from-white/10 to-white/5 border-white/20 text-white shadow-[0_0_15px_rgba(255,255,255,0.05)]" : "border-transparent text-gray-400 hover:text-white hover:bg-white/5"}`}
          >
            <AlertTriangle className="w-4 h-4" /> Reassign Requests
          </button>
          <button
            onClick={() => setActiveTab("managers")}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 border ${activeTab === "managers" ? "bg-linear-to-r from-white/10 to-white/5 border-white/20 text-white shadow-[0_0_15px_rgba(255,255,255,0.05)]" : "border-transparent text-gray-400 hover:text-white hover:bg-white/5"}`}
          >
            <Users className="w-4 h-4" /> Dept. Managers
          </button>
          <button
            onClick={() => setActiveTab("departments")}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 border ${activeTab === "departments" ? "bg-linear-to-r from-white/10 to-white/5 border-white/20 text-white shadow-[0_0_15px_rgba(255,255,255,0.05)]" : "border-transparent text-gray-400 hover:text-white hover:bg-white/5"}`}
          >
            <Settings className="w-4 h-4" /> Departments
          </button>
          <button className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-colors mt-auto">
            <Settings className="w-4 h-4" /> Settings
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:text-red-300 hover:border-red-500/30 transition-all duration-300 bg-linear-to-r from-transparent to-transparent hover:from-red-500/10 hover:to-red-500/5 border border-transparent"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Background Gradients */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.02)_0%,transparent_50%)] pointer-events-none"></div>

        {/* Header */}
        <header className="h-20 border-b border-white/10 px-8 flex items-center justify-between shrink-0 bg-[#030303]/80 backdrop-blur-md z-10">
          <h1 className="text-xl font-serif capitalize bg-linear-to-r from-white to-gray-400 bg-clip-text text-transparent">
            {activeTab.replace("-", " ")}
          </h1>

          <div className="flex items-center gap-4">
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search..."
              inputClassName="text-white placeholder:text-gray-500 py-1.5 w-64"
            />
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
              <span className="text-xs font-medium">AD</span>
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-8 z-10">
          {/* OVERVIEW TAB */}
          {activeTab === "overview" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <AdminOverviewTab
                metrics={metrics}
                recentReports={recentReports}
                filteredReports={filteredReports}
                onViewAllReports={() => setActiveTab("reports")}
              />
            </motion.div>
          )}
          {/* REPORTS TAB */}
          {activeTab === "reports" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="h-full"
            >
              <AdminReportsTab
                reportError={reportError}
                reportDeptFilter={reportDeptFilter}
                reportStatusFilter={reportStatusFilter}
                departmentOptions={departmentOptions}
                statusOptions={statusOptions}
                filteredReports={filteredReports}
                reportDeptDrafts={reportDeptDrafts}
                reportUpdatingId={reportUpdatingId}
                onDeptFilterChange={setReportDeptFilter}
                onStatusFilterChange={setReportStatusFilter}
                onReportDeptChange={handleReportDeptChange}
                onReportDeptSave={handleReportDeptSave}
                onReportDelete={handleReportDelete}
              />
            </motion.div>
          )}
          {/* REASSIGN TAB */}
          {activeTab === "reassign" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <AdminReassignTab
                requests={reassignRequests}
                departmentOptions={departmentOptions}
                requestDeptDrafts={requestDeptDrafts}
                onRequestDeptDraftChange={(requestId, value) =>
                  setRequestDeptDrafts((prev) => ({ ...prev, [requestId]: value }))
                }
                onApprove={handleApproveRequest}
                onReject={handleRejectRequest}
              />
            </motion.div>
          )}
          {/* MANAGERS TAB */}
          {activeTab === "managers" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <AdminManagersTab
                deptError={deptError}
                newManagerUsername={newManagerUsername}
                newManagerEmail={newManagerEmail}
                newManagerPassword={newManagerPassword}
                newManagerDepartment={newManagerDepartment}
                departmentOptions={departmentOptions}
                filteredManagers={filteredManagers}
                managerEmailDrafts={managerEmailDrafts}
                deptDrafts={deptDrafts}
                onNewManagerUsernameChange={setNewManagerUsername}
                onNewManagerEmailChange={setNewManagerEmail}
                onNewManagerPasswordChange={setNewManagerPassword}
                onNewManagerDepartmentChange={setNewManagerDepartment}
                onManagerEmailDraftChange={(managerId, value) =>
                  setManagerEmailDrafts((prev) => ({ ...prev, [managerId]: value }))
                }
                onDeptChange={handleDeptChange}
                onCreateManager={handleCreateManager}
                onUpdateManager={handleUpdateManager}
                onDeleteManager={handleDeleteManager}
              />
            </motion.div>
          )}
          {/* DEPARTMENTS TAB */}
          {activeTab === "departments" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <AdminDepartmentsTab
                deptError={deptError}
                departmentName={departmentName}
                filteredDepartments={filteredDepartments}
                deptNameDrafts={deptNameDrafts}
                onDepartmentNameChange={setDepartmentName}
                onDeptNameDraftChange={(deptId, value) =>
                  setDeptNameDrafts((prev) => ({ ...prev, [deptId]: value }))
                }
                onCreateDepartment={handleCreateDepartment}
                onRenameDepartment={handleRenameDepartment}
                onDeleteDepartment={handleDeleteDepartment}
              />
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}


