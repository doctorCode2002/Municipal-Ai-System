import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { LogOut, FileText, PlusCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { apiFetch, getAuthToken } from "../../services/api";
import type { Report, ValidationErrors } from "./types";
import ReportFormCard from "./components/ReportFormCard";
import ReportsListCard from "./components/ReportsListCard";

export default function CitizenDashboardView() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"new" | "my-reports">("new");
  const [reports, setReports] = useState<Report[]>([]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [serviceSubtype, setServiceSubtype] = useState("");
  const [analysisNeighborhood, setAnalysisNeighborhood] = useState("");
  const [policeDistrict, setPoliceDistrict] = useState("");
  const [isLocating, setIsLocating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [lastRouting, setLastRouting] = useState<{ agency: string; priority: string } | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [isPredictingCategory, setIsPredictingCategory] = useState(false);
  const [predictMessage, setPredictMessage] = useState<string | null>(null);

  const STORAGE_REPORTS_KEY = "municipal.reports";
  const STORAGE_DRAFT_KEY = "municipal.reportDraft";
  const authToken = getAuthToken();

  useEffect(() => {
    const storedReports = localStorage.getItem(STORAGE_REPORTS_KEY);
    if (storedReports) {
      try {
        setReports(JSON.parse(storedReports) as Report[]);
      } catch {
        // ignore parse errors
      }
    }

    const storedDraft = localStorage.getItem(STORAGE_DRAFT_KEY);
    if (storedDraft) {
      try {
        const parsed = JSON.parse(storedDraft) as {
          title?: string;
          description?: string;
          category?: string;
          location?: string;
          serviceSubtype?: string;
          analysisNeighborhood?: string;
          policeDistrict?: string;
        };
        setTitle(parsed.title || "");
        setDescription(parsed.description || "");
        setCategory(parsed.category || "");
        setLocation(parsed.location || "");
        setServiceSubtype(parsed.serviceSubtype || "");
        setAnalysisNeighborhood(parsed.analysisNeighborhood || "");
        setPoliceDistrict(parsed.policeDistrict || "");
      } catch {
        // ignore parse errors
      }
    }
  }, []);

  useEffect(() => {
    const loadReports = async () => {
      if (!authToken) return;
      try {
        const response = await apiFetch("/api/reports");
        if (!response.ok) return;
        const data = await response.json();
        const mapped: Report[] = data.map((item: any) => ({
          id: item.report_id,
          title: item.title,
          description: item.description,
          category: item.category,
          location: item.location,
          status: item.status,
          date: item.created_at ? new Date(item.created_at).toLocaleDateString() : "",
          agency: item.agency,
          priority: item.priority,
        }));
        setReports(mapped);
      } catch {
        // ignore fetch errors
      }
    };
    loadReports();
  }, [authToken]);

  useEffect(() => {
    localStorage.setItem(STORAGE_REPORTS_KEY, JSON.stringify(reports));
  }, [reports]);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_DRAFT_KEY,
      JSON.stringify({
        title,
        description,
        category,
        location,
        serviceSubtype,
        analysisNeighborhood,
        policeDistrict,
      })
    );
  }, [title, description, category, location, serviceSubtype, analysisNeighborhood, policeDistrict]);

  const canPredictCategory = useMemo(() => {
    return title.trim().length >= 3 && description.trim().length >= 10;
  }, [title, description]);

  const handleLogout = () => {
    if (authToken) {
      apiFetch("/api/auth/logout", { method: "POST" }).catch(() => undefined);
    }
    localStorage.removeItem("auth.token");
    localStorage.removeItem("auth.user");
    navigate("/");
  };

  const handleGetLocation = () => {
    setIsLocating(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setTimeout(() => {
            setLocation(`${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`);
            setIsLocating(false);
          }, 600);
        },
        () => {
          setIsLocating(false);
          setLocation("Location access denied.");
        }
      );
    } else {
      setIsLocating(false);
      setLocation("Geolocation not supported.");
    }
  };

  const validateForm = (): ValidationErrors => {
    const errors: ValidationErrors = {};
    if (title.trim().length < 3) errors.title = "Title must be at least 3 characters.";
    if (description.trim().length < 10) errors.description = "Description must be at least 10 characters.";
    if (!category.trim()) errors.category = "Please choose a category.";
    if (location.trim().length < 3) errors.location = "Location must be at least 3 characters.";
    if (analysisNeighborhood.trim().length < 2) errors.neighborhood = "Neighborhood is required.";
    if (policeDistrict.trim().length < 2) errors.policeDistrict = "Police district is required.";
    return errors;
  };

  const handlePredictCategory = async () => {
    if (!canPredictCategory) return;
    setIsPredictingCategory(true);
    setPredictMessage(null);
    try {
      const response = await apiFetch(
        "/api/predict-category",
        {
          method: "POST",
          body: JSON.stringify({ title, description }),
        },
        false
      );

      if (!response.ok) {
        throw new Error("Category prediction failed");
      }

      const data = await response.json();
      setCategory(data.category || "");
      setPredictMessage(`Suggested: ${data.category} (${Math.round((data.confidence || 0) * 100)}%)`);
    } catch (err) {
      setPredictMessage(err instanceof Error ? err.message : "Category prediction failed");
    } finally {
      setIsPredictingCategory(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateForm();
    setValidationErrors(errors);
    if (Object.keys(errors).length > 0) return;
    if (!authToken) {
      setSubmitError("Please sign in to submit a report.");
      return;
    }
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await apiFetch(
        "/api/report",
        {
          method: "POST",
          body: JSON.stringify({
            title,
            description,
            category,
            location,
            service_subtype: serviceSubtype,
            analysis_neighborhood: analysisNeighborhood,
            police_district: policeDistrict,
          }),
        },
        true
      );

      if (!response.ok) {
        let message = `Request failed (${response.status})`;
        try {
          const data = await response.json();
          if (data?.detail) message = data.detail;
        } catch {
          // ignore JSON parse errors
        }
        throw new Error(message);
      }

      const data = await response.json();
      setIsSubmitting(false);
      setIsSuccess(true);
      setLastRouting({ agency: data.agency, priority: data.priority });

      const newReport: Report = {
        id: data.report_id || Math.random().toString(36).substring(2, 9),
        title,
        description,
        category,
        location,
        status: data.status || "Routed",
        date: new Date().toLocaleDateString(),
        agency: data.agency || "Unknown",
        priority: data.priority || "Unknown",
      };
      setReports((prev) => [newReport, ...prev]);

      setTimeout(() => {
        setIsSuccess(false);
        setTitle("");
        setDescription("");
        setCategory("");
        setLocation("");
        setServiceSubtype("");
        setAnalysisNeighborhood("");
        setPoliceDistrict("");
        setValidationErrors({});
        setPredictMessage(null);
        setActiveTab("my-reports");
      }, 2500);
    } catch (err) {
      setIsSubmitting(false);
      setSubmitError(err instanceof Error ? err.message : "Submission failed");
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#030303] text-white font-sans flex selection:bg-white/20">
      <aside className="w-64 border-r border-white/10 bg-[#0a0a0a] hidden md:flex flex-col shrink-0">
        <div className="p-6 flex items-center gap-3 border-b border-white/10">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 17L12 22L22 17" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 12L12 17L22 12" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="font-serif font-semibold tracking-wide text-lg bg-linear-to-r from-white to-gray-400 bg-clip-text text-transparent">
            CivicMind
          </span>
        </div>

        <div className="p-4 flex-1 flex flex-col gap-2">
          <button
            onClick={() => setActiveTab("new")}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 border ${activeTab === "new" ? "bg-linear-to-r from-white/10 to-white/5 border-white/20 text-white shadow-[0_0_15px_rgba(255,255,255,0.05)]" : "border-transparent text-gray-400 hover:text-white hover:bg-white/5"}`}
          >
            <PlusCircle className="w-4 h-4" /> Report Issue
          </button>
          <button
            onClick={() => setActiveTab("my-reports")}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 border ${activeTab === "my-reports" ? "bg-linear-to-r from-white/10 to-white/5 border-white/20 text-white shadow-[0_0_15px_rgba(255,255,255,0.05)]" : "border-transparent text-gray-400 hover:text-white hover:bg-white/5"}`}
          >
            <FileText className="w-4 h-4" /> My Reports
          </button>
        </div>

        <div className="p-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:text-red-300 hover:border-red-500/30 transition-all duration-300 bg-linear-to-r from-transparent to-transparent hover:from-red-500/10 hover:to-red-500/5 border border-transparent"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-dvh overflow-hidden relative pb-16 md:pb-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />

        <header className="h-20 border-b border-white/10 px-8 flex items-center justify-between shrink-0 bg-[#030303]/80 backdrop-blur-md z-10">
          <div className="flex flex-col">
            <h1 className="text-xl font-serif capitalize bg-linear-to-r from-white to-gray-400 bg-clip-text text-transparent">
              {activeTab === "new" ? "Report an Issue" : "My Reports"}
            </h1>
            <span className="text-xs text-gray-400">Citizen Portal</span>
          </div>

          <div className="md:hidden flex items-center">
            <button onClick={handleLogout} className="text-gray-400 hover:text-white">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 z-10 flex justify-center">
          <AnimatePresence mode="wait">
            {activeTab === "new" && (
              <motion.div
                key="new"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="w-full max-w-2xl"
              >
                <ReportFormCard
                  isSuccess={isSuccess}
                  isSubmitting={isSubmitting}
                  submitError={submitError}
                  lastRouting={lastRouting}
                  validationErrors={validationErrors}
                  title={title}
                  description={description}
                  category={category}
                  location={location}
                  serviceSubtype={serviceSubtype}
                  analysisNeighborhood={analysisNeighborhood}
                  policeDistrict={policeDistrict}
                  isLocating={isLocating}
                  isPredictingCategory={isPredictingCategory}
                  canPredictCategory={canPredictCategory}
                  predictMessage={predictMessage}
                  onSubmit={handleSubmit}
                  onTitleChange={setTitle}
                  onDescriptionChange={setDescription}
                  onCategoryChange={setCategory}
                  onLocationChange={setLocation}
                  onServiceSubtypeChange={setServiceSubtype}
                  onNeighborhoodChange={setAnalysisNeighborhood}
                  onPoliceDistrictChange={setPoliceDistrict}
                  onPredictCategory={handlePredictCategory}
                  onGetLocation={handleGetLocation}
                />
              </motion.div>
            )}

            {activeTab === "my-reports" && (
              <motion.div
                key="my-reports"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="w-full max-w-4xl"
              >
                <ReportsListCard reports={reports} onCreateFirstReport={() => setActiveTab("new")} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#0a0a0a] border-t border-white/10 flex items-center justify-around px-4 z-50 pb-safe">
          <button
            onClick={() => setActiveTab("new")}
            className={`flex flex-col items-center justify-center gap-1 w-full h-full transition-colors ${
              activeTab === "new" ? "text-white" : "text-gray-500 hover:text-gray-300"
            }`}
          >
            <PlusCircle className="w-5 h-5" />
            <span className="text-[10px] font-medium">Report</span>
          </button>
          <button
            onClick={() => setActiveTab("my-reports")}
            className={`flex flex-col items-center justify-center gap-1 w-full h-full transition-colors ${
              activeTab === "my-reports" ? "text-white" : "text-gray-500 hover:text-gray-300"
            }`}
          >
            <FileText className="w-5 h-5" />
            <span className="text-[10px] font-medium">My Reports</span>
          </button>
        </div>
      </main>
    </div>
  );
}
