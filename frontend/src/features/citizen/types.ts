export type CitizenTab = "new" | "my-reports";

export interface Report {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  status: string;
  date: string;
  agency: string;
  priority: string;
  resolution_speed?: string;
  repeat_pattern?: string;
}

export interface ReportResponse {
  report_id: string;
  agency: string;
  priority: string;
  status: string;
  department?: string;
  resolution_speed?: string;
  repeat_pattern?: string;
}

export interface ValidationErrors {
  title?: string;
  description?: string;
  category?: string;
  location?: string;
  serviceSubtype?: string;
  neighborhood?: string;
  policeDistrict?: string;
}
