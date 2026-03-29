export default function ManagerSettingsTab() {
  return (
    <div className="max-w-2xl">
      <div className="rounded-xl border border-white/10 bg-white/1 p-6">
        <h2 className="text-lg font-medium mb-4">Department Settings</h2>
        <p className="text-sm text-gray-400 mb-6">
          Manage your department's notification preferences and routing rules.
        </p>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Notification Email</label>
            <input
              type="email"
              placeholder="manager@department.gov"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-white/30 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Auto-Assign Critical Reports</label>
            <div className="flex items-center gap-3">
              <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-white/20 bg-white/5 accent-blue-500" />
              <span className="text-sm text-gray-400">Automatically assign critical urgency reports to on-call staff</span>
            </div>
          </div>

          <button className="px-5 py-2.5 rounded-lg bg-linear-to-r from-white to-gray-300 text-black hover:from-gray-200 hover:to-gray-400 transition-all duration-300 text-sm font-medium shadow-[0_0_15px_rgba(255,255,255,0.1)]">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

