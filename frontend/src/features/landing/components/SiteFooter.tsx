export default function SiteFooter() {
  return (
    <footer className="border-t border-white/10 py-12 px-8 md:px-12 text-center md:text-left">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-2">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-50">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M2 17L12 22L22 17" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M2 12L12 17L22 12" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="font-serif font-medium text-xs text-gray-400">CivicMind AI</span>
        </div>

        <div className="flex gap-6 text-[10px] text-gray-500 uppercase tracking-wider">
          <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
          <a href="#" className="hover:text-white transition-colors">Contact</a>
        </div>

        <p className="text-[10px] text-gray-600">
          (c) {new Date().getFullYear()} Municipal AI System. Built for civic service teams.
        </p>
      </div>
    </footer>
  );
}
