import { CheckCircle2, Loader2, MapPin, Send } from "lucide-react";
import { motion } from "motion/react";
import type { FormEvent } from "react";
import type { ValidationErrors } from "../types";

type ReportFormCardProps = {
  isSuccess: boolean;
  isSubmitting: boolean;
  submitError: string | null;
  lastRouting: { agency: string; priority: string } | null;
  validationErrors: ValidationErrors;
  title: string;
  description: string;
  category: string;
  location: string;
  serviceSubtype: string;
  analysisNeighborhood: string;
  policeDistrict: string;
  isLocating: boolean;
  isPredictingCategory: boolean;
  canPredictCategory: boolean;
  predictMessage: string | null;
  onSubmit: (event: FormEvent) => void;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onLocationChange: (value: string) => void;
  onServiceSubtypeChange: (value: string) => void;
  onNeighborhoodChange: (value: string) => void;
  onPoliceDistrictChange: (value: string) => void;
  onPredictCategory: () => void;
  onGetLocation: () => void;
};

export default function ReportFormCard({
  isSuccess,
  isSubmitting,
  submitError,
  lastRouting,
  validationErrors,
  title,
  description,
  category,
  location,
  serviceSubtype,
  analysisNeighborhood,
  policeDistrict,
  isLocating,
  isPredictingCategory,
  canPredictCategory,
  predictMessage,
  onSubmit,
  onTitleChange,
  onDescriptionChange,
  onCategoryChange,
  onLocationChange,
  onServiceSubtypeChange,
  onNeighborhoodChange,
  onPoliceDistrictChange,
  onPredictCategory,
  onGetLocation,
}: ReportFormCardProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-linear-to-br from-white/3 to-white/1 p-6 md:p-8 shadow-2xl">
      {isSuccess ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center py-12 text-center"
        >
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mb-6 border border-emerald-500/30">
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
          </div>
          <h2 className="text-2xl font-serif mb-2">Report Submitted</h2>
          <p className="text-gray-400 text-sm max-w-md">
            Thank you for helping improve our city. Your report has been routed to the appropriate department.
          </p>
          {lastRouting && (
            <div className="mt-4 text-xs text-emerald-200/80">
              Routed to {lastRouting.agency} - Priority {lastRouting.priority}
            </div>
          )}
        </motion.div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-6">
          {submitError && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {submitError}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder="e.g., Large pothole on Main St"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all"
            />
            {validationErrors.title && <p className="text-xs text-red-300">{validationErrors.title}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Description</label>
            <textarea
              required
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              placeholder="Provide details about the issue..."
              rows={4}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all resize-none"
            />
            {validationErrors.description && (
              <p className="text-xs text-red-300">{validationErrors.description}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Category</label>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <select
                  required
                  value={category}
                  onChange={(e) => onCategoryChange(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all appearance-none text-white"
                >
                  <option value="" disabled className="bg-[#111]">Select a category</option>
                  <option value="infrastructure" className="bg-[#111]">Roads & Infrastructure</option>
                  <option value="sanitation" className="bg-[#111]">Sanitation & Waste</option>
                  <option value="parks" className="bg-[#111]">Parks & Recreation</option>
                  <option value="safety" className="bg-[#111]">Public Safety</option>
                  <option value="utilities" className="bg-[#111]">Water & Utilities</option>
                  <option value="other" className="bg-[#111]">Other</option>
                </select>
                <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><path d="m6 9 6 6 6-6"/></svg>
                </div>
              </div>
              <button
                type="button"
                onClick={onPredictCategory}
                disabled={!canPredictCategory || isPredictingCategory}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 transition-all text-sm font-medium whitespace-nowrap disabled:opacity-50"
              >
                {isPredictingCategory ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Predict Category
              </button>
            </div>
            {predictMessage && <p className="text-xs text-emerald-200/80">{predictMessage}</p>}
            {validationErrors.category && <p className="text-xs text-red-300">{validationErrors.category}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Location</label>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => onLocationChange(e.target.value)}
                  placeholder="Address or cross streets"
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all"
                />
              </div>
              <button
                type="button"
                onClick={onGetLocation}
                disabled={isLocating}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 transition-all text-sm font-medium whitespace-nowrap disabled:opacity-50"
              >
                {isLocating ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
                Use Current Location
              </button>
            </div>
            {validationErrors.location && <p className="text-xs text-red-300">{validationErrors.location}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Service Subtype</label>
            <input
              type="text"
              value={serviceSubtype}
              onChange={(e) => onServiceSubtypeChange(e.target.value)}
              placeholder="e.g., Streetlight, Pothole, Graffiti"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Neighborhood</label>
            <input
              type="text"
              required
              value={analysisNeighborhood}
              onChange={(e) => onNeighborhoodChange(e.target.value)}
              placeholder="e.g., Downtown"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all"
            />
            {validationErrors.neighborhood && (
              <p className="text-xs text-red-300">{validationErrors.neighborhood}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Police District</label>
            <input
              type="text"
              required
              value={policeDistrict}
              onChange={(e) => onPoliceDistrictChange(e.target.value)}
              placeholder="e.g., Central"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all"
            />
            {validationErrors.policeDistrict && (
              <p className="text-xs text-red-300">{validationErrors.policeDistrict}</p>
            )}
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-linear-to-r from-white to-gray-300 text-black hover:from-gray-200 hover:to-gray-400 transition-all duration-300 text-sm font-medium shadow-[0_0_20px_rgba(255,255,255,0.15)] disabled:opacity-70"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-black" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Submit Report
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
