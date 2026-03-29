import { useCallback, useEffect, useState, type ComponentType } from "react";
import { AlertTriangle } from "lucide-react";
import { apiJson } from "../services/api";

export type ManagerMetricItem = {
  title: string;
  value: string;
  change: string;
  icon: ComponentType<{ className?: string }>;
  color: string;
  bg: string;
  border: string;
  key?: string;
};

export type ManagerReportItem = {
  id: string;
  title: string;
  location: string;
  urgency: string;
  status: string;
  date: string;
};

export function useManagerData(enabled: boolean) {
  const [metrics, setMetrics] = useState<ManagerMetricItem[]>([]);
  const [reports, setReports] = useState<ManagerReportItem[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);

  const loadMetrics = useCallback(async () => {
    if (!enabled) return;
    try {
      const { response, data } = await apiJson<any[]>("/api/manager/metrics");
      if (!response.ok || !data) return;
      const mapped = data.map((item: any) => ({
        title: item.title,
        value: item.value,
        change: item.change || "",
        icon: AlertTriangle,
        color: item.color,
        bg: item.bg,
        border: item.border,
        key: item.title,
      }));
      setMetrics(mapped);
    } catch {
      // ignore fetch errors
    }
  }, [enabled]);

  const loadReports = useCallback(async () => {
    if (!enabled) return;
    try {
      const { response, data } = await apiJson<any[]>("/api/manager/reports");
      if (!response.ok || !data) return;
      const mapped = data.map((item: any) => ({
        id: item.report_id,
        title: item.title,
        location: item.location,
        urgency: item.priority,
        status: item.status,
        date: item.created_at ? new Date(item.created_at).toLocaleDateString() : "",
      }));
      setReports(mapped);
    } catch {
      // ignore fetch errors
    }
  }, [enabled]);

  const loadDepartments = useCallback(async () => {
    if (!enabled) return;
    try {
      const { response, data } = await apiJson<any[]>("/api/departments");
      if (!response.ok || !data) return;
      setDepartments(data.map((dept: any) => dept.name));
    } catch {
      // ignore fetch errors
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    loadMetrics();
    loadReports();
    loadDepartments();
  }, [enabled, loadMetrics, loadReports, loadDepartments]);

  return {
    metrics,
    reports,
    departments,
    setMetrics,
    setReports,
    reloadMetrics: loadMetrics,
    reloadReports: loadReports,
    reloadDepartments: loadDepartments,
  };
}
