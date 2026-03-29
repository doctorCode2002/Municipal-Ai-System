import { useCallback, useEffect, useState } from "react";
import { apiJson } from "../services/api";

export type MetricItem = {
  title: string;
  value: string;
  change: string;
  icon: "FileText" | "CheckCircle2" | "Clock" | "Activity";
  color: string;
  bg: string;
  border: string;
};

export type ReportItem = {
  id: string;
  title: string;
  dept: string;
  urgency: string;
  status: string;
  date: string;
};

export type ManagerItem = {
  id: number;
  name: string;
  dept: string;
  email: string;
  status: string;
};

export type DepartmentItem = {
  id: number;
  name: string;
};

export type ReassignRequest = {
  id: number;
  reportId: string;
  fromDepartment: string;
  requestedDepartment?: string;
  reason: string;
  status: string;
  createdAt: string;
};

export function useAdminData(enabled: boolean) {
  const [metrics, setMetrics] = useState<MetricItem[]>([]);
  const [recentReports, setRecentReports] = useState<ReportItem[]>([]);
  const [managers, setManagers] = useState<ManagerItem[]>([]);
  const [departments, setDepartments] = useState<DepartmentItem[]>([]);
  const [reassignRequests, setReassignRequests] = useState<ReassignRequest[]>([]);

  const loadMetrics = useCallback(async () => {
    if (!enabled) return;
    try {
      const { response, data } = await apiJson<any[]>("/api/admin/metrics");
      if (!response.ok || !data) return;
      const mapped = data.map((item: any) => ({
        title: item.title,
        value: item.value,
        change: item.change || "",
        icon: item.icon,
        color: item.color,
        bg: item.bg,
        border: item.border,
      }));
      setMetrics(mapped);
    } catch {
      // ignore fetch errors
    }
  }, [enabled]);

  const loadReports = useCallback(async () => {
    if (!enabled) return;
    try {
      const { response, data } = await apiJson<any[]>("/api/admin/reports");
      if (!response.ok || !data) return;
      const mapped = data.map((item: any) => ({
        id: item.report_id,
        title: item.title,
        dept: item.department || item.agency,
        urgency: item.priority,
        status: item.status,
        date: item.created_at ? new Date(item.created_at).toLocaleDateString() : "",
      }));
      setRecentReports(mapped);
    } catch {
      // ignore fetch errors
    }
  }, [enabled]);

  const loadManagers = useCallback(async () => {
    if (!enabled) return;
    try {
      const { response, data } = await apiJson<any[]>("/api/admin/managers");
      if (!response.ok || !data) return;
      const mapped = data.map((item: any) => ({
        id: item.id,
        name: item.name,
        dept: item.dept,
        email: item.email,
        status: item.status,
      }));
      setManagers(mapped);
    } catch {
      // ignore fetch errors
    }
  }, [enabled]);

  const loadDepartments = useCallback(async () => {
    if (!enabled) return;
    try {
      const { response, data } = await apiJson<any[]>("/api/departments");
      if (!response.ok || !data) return;
      setDepartments(data);
    } catch {
      // ignore fetch errors
    }
  }, [enabled]);

  const loadRequests = useCallback(async () => {
    if (!enabled) return;
    try {
      const { response, data } = await apiJson<any[]>("/api/admin/reassign-requests");
      if (!response.ok || !data) return;
      const mapped = data.map((item: any) => ({
        id: item.id,
        reportId: item.report_id,
        fromDepartment: item.from_department,
        requestedDepartment: item.requested_department,
        reason: item.reason,
        status: item.status,
        createdAt: item.created_at,
      }));
      setReassignRequests(mapped);
    } catch {
      // ignore fetch errors
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    loadMetrics();
    loadReports();
    loadManagers();
    loadDepartments();
    loadRequests();
  }, [enabled, loadMetrics, loadReports, loadManagers, loadDepartments, loadRequests]);

  return {
    metrics,
    recentReports,
    managers,
    departments,
    reassignRequests,
    setMetrics,
    setRecentReports,
    setManagers,
    setDepartments,
    setReassignRequests,
    reloadMetrics: loadMetrics,
    reloadReports: loadReports,
    reloadManagers: loadManagers,
    reloadDepartments: loadDepartments,
    reloadRequests: loadRequests,
  };
}
