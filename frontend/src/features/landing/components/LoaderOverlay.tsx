import { AnimatePresence, motion } from "motion/react";

type LoaderOverlayProps = {
  isLoading: boolean;
};

export default function LoaderOverlay({ isLoading }: LoaderOverlayProps) {
  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          key="loader"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="fixed inset-0 z-[100] bg-[#030303] flex flex-col items-center justify-center"
        >
          <div className="flex flex-col items-center gap-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="flex items-center gap-3"
            >
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M2 17L12 22L22 17" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M2 12L12 17L22 12" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="font-serif font-semibold tracking-wide text-3xl bg-linear-to-r from-white to-gray-400 bg-clip-text text-transparent">
                CivicMind
              </span>
            </motion.div>
            <div className="w-48 h-[2px] bg-white/10 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 1.5, ease: "easeInOut", delay: 0.2 }}
                className="h-full bg-linear-to-r from-red-500 via-amber-500 to-blue-500"
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
