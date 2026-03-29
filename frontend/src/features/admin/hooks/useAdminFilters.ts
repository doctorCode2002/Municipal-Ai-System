import { useMemo, useState } from "react";
import type { DepartmentItem, ManagerItem, ReportItem } from "../../../hooks/useAdminData";

type UseAdminFiltersArgs = {
  reports: ReportItem[];
  managers: ManagerItem[];
  departments: DepartmentItem[];
};

export function useAdminFilters({ reports, managers, departments }: UseAdminFiltersArgs) {
  const [searchQuery, setSearchQuery] = useState("");
  const [reportDeptFilter, setReportDeptFilter] = useState("all");
  const [reportStatusFilter, setReportStatusFilter] = useState("all");

  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      const matchesDept = reportDeptFilter === "all" || report.dept === reportDeptFilter;
      const matchesStatus = reportStatusFilter === "all" || report.status === reportStatusFilter;
      const term = searchQuery.trim().toLowerCase();
      const matchesSearch =
        term.length === 0 ||
        report.id.toLowerCase().includes(term) ||
        report.title.toLowerCase().includes(term) ||
        report.dept.toLowerCase().includes(term) ||
        report.status.toLowerCase().includes(term);
      return matchesDept && matchesStatus && matchesSearch;
    });
  }, [reports, searchQuery, reportDeptFilter, reportStatusFilter]);

  const filteredManagers = useMemo(() => {
    return managers.filter((mgr) => {
      const term = searchQuery.trim().toLowerCase();
      if (!term) return true;
      return (
        mgr.name.toLowerCase().includes(term) ||
        (mgr.email || "").toLowerCase().includes(term) ||
        (mgr.dept || "").toLowerCase().includes(term)
      );
    });
  }, [managers, searchQuery]);

  const filteredDepartments = useMemo(() => {
    return departments.filter((dept) => {
      const term = searchQuery.trim().toLowerCase();
      if (!term) return true;
      return dept.name.toLowerCase().includes(term);
    });
  }, [departments, searchQuery]);

  return {
    searchQuery,
    reportDeptFilter,
    reportStatusFilter,
    filteredReports,
    filteredManagers,
    filteredDepartments,
    setSearchQuery,
    setReportDeptFilter,
    setReportStatusFilter,
  };
}
