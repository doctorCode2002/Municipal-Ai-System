import { AlertCircle, Clock, FileText, MapPin } from "lucide-react";
import StatusBadge from "../../../components/StatusBadge";
import type { Report } from "../types";

type ReportsListCardProps = {
  reports: Report[];
  onCreateFirstReport: () => void;
};

export default function ReportsListCard({ reports, onCreateFirstReport }: ReportsListCardProps) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/1 overflow-hidden flex flex-col">
      <div className="p-6 border-b border-white/10 flex justify-between items-center bg-linear-to-r from-white/3 to-transparent">
        <h3 className="font-medium">Recent Submissions</h3>
      </div>
      {reports.length === 0 ? (
        <div className="p-8 text-center flex flex-col items-center justify-center text-gray-400">
          <AlertCircle className="w-12 h-12 mb-4 opacity-20" />
          <p>You haven't submitted any reports yet.</p>
          <button
            onClick={onCreateFirstReport}
            className="mt-4 text-sm text-white border border-white/20 px-4 py-2 rounded-lg hover:bg-white/5 transition-colors"
          >
            Create your first report
          </button>
        </div>
      ) : (
        <div className="divide-y divide-white/10">
          {reports.map((report) => (
            <div key={report.id} className="p-6 hover:bg-white/2 transition-colors">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-medium text-white">{report.title}</h4>
                <StatusBadge value={report.status} className="uppercase tracking-wider" />
              </div>
              <p className="text-sm text-gray-400 mb-4">{report.description}</p>
              <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {report.location}</span>
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {report.date}</span>
                <span className="flex items-center gap-1 capitalize"><FileText className="w-3 h-3" /> {report.category}</span>
                <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> {report.agency}</span>
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {report.priority}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
