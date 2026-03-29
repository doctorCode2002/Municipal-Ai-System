import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  LayoutDashboard,
  FileText,
  Settings,
  LogOut,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { apiFetch, getAuthToken } from "../../services/api";
import SearchInput from "../../components/SearchInput";
import { useManagerData } from "../../hooks/useManagerData";
import ManagerOverviewTab from "./components/tabs/ManagerOverviewTab";
import ManagerReportsTab from "./components/tabs/ManagerReportsTab";
import ManagerSettingsTab from "./components/tabs/ManagerSettingsTab";

export default function ManagerDashboardView() {
  const [activeTab, setActiveTab] = useState<"overview" | "reports" | "settings">("overview");
  const [statusDrafts, setStatusDrafts] = useState<Record<string, string>>({});
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [urgencyFilter, setUrgencyFilter] = useState("all");
  const [reassignReportId, setReassignReportId] = useState<string | null>(null);
  const [reassignReason, setReassignReason] = useState("");
  const [reassignDepartment, setReassignDepartment] = useState("");
  const [reassignMessage, setReassignMessage] = useState<string | null>(null);
  const authToken = getAuthToken();
  const departmentName = useMemo(() => {
    try {
      const user = JSON.parse(localStorage.getItem("auth.user") || "{}");
      return user.department || "Department";
    } catch {
      return "Department";
    }
  }, []);
  const navigate = useNavigate();
  const { metrics, reports, departments, setReports, reloadMetrics } = useManagerData(
    Boolean(authToken)
  );

  const handleLogout = () => {
    if (authToken) {
      apiFetch("/api/auth/logout", { method: "POST" }).catch(() => undefined);
    }
    localStorage.removeItem("auth.token");
    localStorage.removeItem("auth.user");
    navigate("/");
  };

  const filteredReports = useMemo(() => {
    const term = searchQuery.trim().toLowerCase();
    return reports.filter((report) => {
      const matchesSearch =
        term.length === 0 ||
        report.id.toLowerCase().includes(term) ||
        report.title.toLowerCase().includes(term) ||
        report.location.toLowerCase().includes(term) ||
        report.status.toLowerCase().includes(term) ||
        report.urgency.toLowerCase().includes(term);
      const matchesStatus = statusFilter === "all" || report.status === statusFilter;
      const matchesUrgency = urgencyFilter === "all" || report.urgency === urgencyFilter;
      return (
        matchesSearch &&
        matchesStatus &&
        matchesUrgency
      );
    });
  }, [reports, searchQuery, statusFilter, urgencyFilter]);

  const statusOptions = ["Pending", "In Progress", "Resolved"];
  const urgencyOptions = ["Critical", "High", "Medium", "Low"];

  const handleStatusChange = (reportId: string, value: string) => {
    setStatusDrafts((prev) => ({ ...prev, [reportId]: value }));
  };

  const handleUpdateStatus = async (reportId: string) => {
    if (!authToken) return;
    const newStatus = statusDrafts[reportId];
    if (!newStatus) return;
    setUpdatingId(reportId);
    setUpdateError(null);
    try {
      const response = await apiFetch(`/api/manager/reports/${reportId}/status`, {
        method: "POST",
        body: JSON.stringify({ status: newStatus }),
      });
      if (!response.ok) {
        let message = `Update failed (${response.status})`;
        try {
          const data = await response.json();
          if (data?.detail) message = data.detail;
        } catch {
          // ignore json errors
        }
        throw new Error(message);
      }
      const updated = await response.json();
      setReports((prev) =>
        prev.map((report) =>
          report.id === reportId ? { ...report, status: updated.status } : report
        )
      );
      setStatusDrafts((prev) => {
        const next = { ...prev };
        delete next[reportId];
        return next;
      });
      // refresh metrics after update
      await reloadMetrics();
    } catch (err) {
      setUpdateError(err instanceof Error ? err.message : "Status update failed");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleSubmitReassign = async () => {
    if (!authToken || !reassignReportId) return;
    if (reassignReason.trim().length < 5) {
      setReassignMessage("Please provide a short reason (min 5 characters).");
      return;
    }
    setReassignMessage(null);
    try {
      const response = await apiFetch(
        `/api/manager/reports/${reassignReportId}/reassign-request`,
        {
          method: "POST",
          body: JSON.stringify({
            reason: reassignReason.trim(),
            requested_department: reassignDepartment || undefined,
          }),
        }
      );
      if (!response.ok) {
        let message = `Request failed (${response.status})`;
        try {
          const data = await response.json();
          if (data?.detail) message = data.detail;
        } catch {
          // ignore json errors
        }
        throw new Error(message);
      }
      setReassignMessage("Request sent to admin.");
      setReassignReason("");
      setReassignDepartment("");
      setReassignReportId(null);
    } catch (err) {
      setReassignMessage(err instanceof Error ? err.message : "Request failed");
    }
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
            <FileText className="w-4 h-4" /> My Department
          </button>
        </div>

        <div className="p-4 border-t border-white/10 flex flex-col gap-2">
          <button
            onClick={() => setActiveTab("settings")}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 border ${activeTab === "settings" ? "bg-linear-to-r from-white/10 to-white/5 border-white/20 text-white shadow-[0_0_15px_rgba(255,255,255,0.05)]" : "border-transparent text-gray-400 hover:text-white hover:bg-white/5"}`}
          >
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
        {/* Background Glow */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />

        {/* Header */}
        <header className="h-20 border-b border-white/10 px-8 flex items-center justify-between shrink-0 bg-[#030303]/80 backdrop-blur-md z-10">
          <div className="flex flex-col">
            <h1 className="text-xl font-serif capitalize bg-linear-to-r from-white to-gray-400 bg-clip-text text-transparent">
              {activeTab.replace("-", " ")}
            </h1>
            <span className="text-xs text-gray-400">{departmentName} Department</span>
          </div>

          <div className="flex items-center gap-4">
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search reports..."
              inputClassName="w-64"
            />
            <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center font-medium">
              M
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-8 z-10">
          <AnimatePresence mode="wait">
            {activeTab === "overview" && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="max-w-6xl"
              >
                <ManagerOverviewTab
                  metrics={metrics}
                  reports={reports}
                  onViewAll={() => setActiveTab("reports")}
                  onOpenActions={(reportId) => {
                    setActiveTab("reports");
                    setReassignReportId(reportId);
                    setReassignMessage(null);
                  }}
                />
              </motion.div>
            )}

            {activeTab === "reports" && (
              <motion.div
                key="reports"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="max-w-6xl"
              >
                <ManagerReportsTab
                  updateError={updateError}
                  reassignReportId={reassignReportId}
                  reassignReason={reassignReason}
                  reassignDepartment={reassignDepartment}
                  reassignMessage={reassignMessage}
                  departments={departments}
                  filteredReports={filteredReports}
                  statusFilter={statusFilter}
                  urgencyFilter={urgencyFilter}
                  statusOptions={statusOptions}
                  urgencyOptions={urgencyOptions}
                  searchQuery={searchQuery}
                  statusDrafts={statusDrafts}
                  updatingId={updatingId}
                  onSearchChange={setSearchQuery}
                  onStatusFilterChange={setStatusFilter}
                  onUrgencyFilterChange={setUrgencyFilter}
                  onReassignDepartmentChange={setReassignDepartment}
                  onReassignReasonChange={setReassignReason}
                  onSubmitReassign={handleSubmitReassign}
                  onCancelReassign={() => setReassignReportId(null)}
                  onStatusChange={handleStatusChange}
                  onSaveStatus={handleUpdateStatus}
                  onRequestReassign={(reportId) => {
                    setReassignReportId(reportId);
                    setReassignMessage(null);
                  }}
                />
              </motion.div>
            )}

            {activeTab === "settings" && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="max-w-2xl"
              >
                <ManagerSettingsTab />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
