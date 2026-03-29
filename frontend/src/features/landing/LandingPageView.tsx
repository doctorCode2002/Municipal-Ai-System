import { ArrowRight, Menu, X, LogIn } from "lucide-react";
import React, { useEffect, useState } from "react";
import { AnimatePresence, motion, Variants } from "motion/react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../../services/api";
import { faqs, team } from "./data";
import AnimatedCounter from "./components/AnimatedCounter";
import LoaderOverlay from "./components/LoaderOverlay";
import PlatformSection from "./components/PlatformSection";
import SolutionsSection from "./components/SolutionsSection";
import TeamSection from "./components/TeamSection";
import FAQSection from "./components/FAQSection";
import SiteFooter from "./components/SiteFooter";
import LifecycleSection from "./components/LifecycleSection";
import MetricsBento from "./components/MetricsBento";
import DashboardPreview from "./components/DashboardPreview";

export default function LandingPageView() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginRole, setLoginRole] = useState<"admin" | "manager" | "citizen">(
    "citizen",
  );
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [authEmail, setAuthEmail] = useState("");
  const [authUsername, setAuthUsername] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authErrors, setAuthErrors] = useState<{
    email?: string;
    username?: string;
    password?: string;
  }>({});
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const [isAuthSubmitting, setIsAuthSubmitting] = useState(false);

  const navigate = useNavigate();

  const staggerContainer: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.4, // More pronounced timeline feel
        delayChildren: 0.8, // Match loader fade duration
      },
    },
  };

  const fadeUp: Variants = {
    hidden: { opacity: 0, y: 30, scale: 0.95, filter: "blur(10px)" },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      filter: "blur(0px)",
      transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as any },
    },
  };

  const fadeIn: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 1.2, ease: "easeOut" } },
  };

  const fadeScale: Variants = {
    hidden: { opacity: 0, scale: 0.95, filter: "blur(10px)" },
    visible: {
      opacity: 1,
      scale: 1,
      filter: "blur(0px)",
      transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as any },
    },
  };

  useEffect(() => {
    // Simulate loading time
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  const validateAuthForm = () => {
    const errors: { email?: string; username?: string; password?: string } = {};
    if (authMode === "signup") {
      if (!authEmail.trim()) {
        errors.email = "Email is required.";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(authEmail.trim())) {
        errors.email = "Enter a valid email address.";
      }
    }

    if (authUsername.trim().length < 3) {
      errors.username = "Username must be at least 3 characters.";
    }

    const minPassword = authMode === "signup" ? 8 : 6;
    if (authPassword.trim().length < minPassword) {
      errors.password = `Password must be at least ${minPassword} characters.`;
    }

    return errors;
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateAuthForm();
    setAuthErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setIsAuthSubmitting(true);
    setAuthMessage(null);
    try {
      const endpoint =
        authMode === "signup" ? "/api/auth/signup" : "/api/auth/signin";
      const payload =
        authMode === "signup"
          ? {
              email: authEmail.trim(),
              username: authUsername.trim(),
              password: authPassword,
            }
          : { username: authUsername.trim(), password: authPassword };

      const response = await apiFetch(
        endpoint,
        {
          method: "POST",
          body: JSON.stringify(payload),
        },
        false,
      );

      if (!response.ok) {
        let message = `Request failed (${response.status})`;
        try {
          const data = await response.json();
          if (data?.detail) message = data.detail;
        } catch {
          // ignore json errors
        }
        throw new Error(message);
      }

      const data = await response.json();
      const userRole = data?.user?.role;
      if (authMode === "signin" && userRole && userRole !== loginRole) {
        throw new Error(`This account is not a ${loginRole} account.`);
      }

      localStorage.setItem("auth.token", data.token);
      localStorage.setItem("auth.user", JSON.stringify(data.user));

      if (userRole === "admin") {
        navigate("/admin");
      } else if (userRole === "manager") {
        navigate("/manager");
      } else {
        navigate("/citizen");
      }
      setIsLoginModalOpen(false);
    } catch (err) {
      setAuthMessage(
        err instanceof Error ? err.message : "Authentication failed",
      );
    } finally {
      setIsAuthSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#030303] text-white font-sans overflow-x-hidden selection:bg-white/20">
      <LoaderOverlay isLoading={isLoading} />

      {/* --- HERO SECTION (100vh) --- */}
      <motion.div
        initial="hidden"
        animate={!isLoading ? "visible" : "hidden"}
        variants={staggerContainer}
        className="h-screen flex flex-col relative overflow-hidden"
      >
        <motion.div variants={fadeIn} className="absolute inset-0 z-0">
          <video
            className="h-full w-full object-cover"
            src="/bgvideo.mp4"
            autoPlay
            loop
            muted
            playsInline
          />
          <div className="absolute inset-0 bg-black/65" />
          <div className="absolute inset-0 bg-linear-to-b from-transparent via-transparent to-[#030303]" />
        </motion.div>
        {/* Background Gradients */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.03)_0%,transparent_100%)] pointer-events-none z-10"></div>
        <div className="absolute top-[20%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[800px] bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.04)_0%,transparent_60%)] pointer-events-none z-10"></div>

        {/* Navbar */}
        <motion.nav
          variants={fadeUp}
          className="flex justify-between items-center px-8 py-4 md:py-6 shrink-0 relative z-50"
        >
          {/* Left */}
          <div className="hidden xl:flex gap-4 text-[9px] text-gray-400 font-medium uppercase tracking-widest">
            <a href="#platform" className="hover:text-white transition-colors">
              Platform
            </a>
            <a href="#lifecycle" className="hover:text-white transition-colors">
              Lifecycle
            </a>
            <a href="#metrics" className="hover:text-white transition-colors">
              Metrics
            </a>
            <a href="#solutions" className="hover:text-white transition-colors">
              Solutions
            </a>
            <a href="#preview" className="hover:text-white transition-colors">
              Preview
            </a>
            <a href="#team" className="hover:text-white transition-colors">
              Team
            </a>
            <a href="#faq" className="hover:text-white transition-colors">
              FAQ
            </a>
          </div>

          {/* Center Logo */}
          <div className="flex items-center justify-center md:absolute md:left-1/2 md:-translate-x-1/2 gap-2">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 2L2 7L12 12L22 7L12 2Z"
                stroke="white"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M2 17L12 22L22 17"
                stroke="white"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M2 12L12 17L22 12"
                stroke="white"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="font-serif font-semibold tracking-wide text-sm bg-linear-to-r from-white to-gray-400 bg-clip-text text-transparent">
              CivicMind
            </span>
          </div>

          {/* Right */}
          <div className="flex gap-4 text-xs font-medium items-center">
            <button className="hidden md:block px-4 py-1.5 rounded-full border border-white/15 hover:border-white/30 transition-all duration-300 text-gray-300 hover:text-white bg-linear-to-r from-white/5 to-transparent hover:from-white/10">
              Watch Demo
            </button>
            <button
              onClick={() => setIsLoginModalOpen(true)}
              className="hidden md:flex px-4 py-1.5 rounded-full border border-white/15 hover:border-white/30 transition-all duration-300 items-center gap-2 text-gray-300 hover:text-white bg-linear-to-r from-white/10 to-white/5 hover:from-white/20 hover:to-white/10"
            >
              Login <LogIn className="w-3.5 h-3.5" />
            </button>
            <button
              className="xl:hidden p-1 text-gray-300 hover:text-white"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </motion.nav>

        {/* Mobile Menu Overlay */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="fixed inset-0 z-40 bg-[#030303] flex flex-col items-center justify-center gap-8 text-lg font-medium xl:hidden"
            >
              <a
                href="#platform"
                onClick={() => setIsMobileMenuOpen(false)}
                className="hover:text-white text-gray-400 transition-colors"
              >
                Platform
              </a>
              <a
                href="#lifecycle"
                onClick={() => setIsMobileMenuOpen(false)}
                className="hover:text-white text-gray-400 transition-colors"
              >
                Lifecycle
              </a>
              <a
                href="#metrics"
                onClick={() => setIsMobileMenuOpen(false)}
                className="hover:text-white text-gray-400 transition-colors"
              >
                Metrics
              </a>
              <a
                href="#solutions"
                onClick={() => setIsMobileMenuOpen(false)}
                className="hover:text-white text-gray-400 transition-colors"
              >
                Solutions
              </a>
              <a
                href="#preview"
                onClick={() => setIsMobileMenuOpen(false)}
                className="hover:text-white text-gray-400 transition-colors"
              >
                Preview
              </a>
              <a
                href="#team"
                onClick={() => setIsMobileMenuOpen(false)}
                className="hover:text-white text-gray-400 transition-colors"
              >
                Team
              </a>
              <a
                href="#faq"
                onClick={() => setIsMobileMenuOpen(false)}
                className="hover:text-white text-gray-400 transition-colors"
              >
                FAQ
              </a>

              <div className="flex flex-col gap-4 mt-8 items-center md:hidden">
                <button className="px-6 py-2.5 rounded-full border border-white/15 hover:border-white/30 transition-all duration-300 text-gray-300 hover:text-white text-sm bg-linear-to-r from-white/5 to-transparent hover:from-white/10">
                  Watch Demo
                </button>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setIsLoginModalOpen(true);
                  }}
                  className="px-6 py-2.5 rounded-full border border-white/15 hover:border-white/30 transition-all duration-300 flex items-center gap-2 text-gray-300 hover:text-white bg-linear-to-r from-white/10 to-white/5 hover:from-white/20 hover:to-white/10 text-sm"
                >
                  Login <LogIn className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Login Modal Overlay */}
        <AnimatePresence>
          {isLoginModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-60 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 w-full max-w-md relative shadow-2xl"
              >
                <button
                  onClick={() => setIsLoginModalOpen(false)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>

                <h3 className="text-xl font-serif mb-6 text-center">
                  {authMode === "signin" ? "Welcome Back" : "Create Account"}
                </h3>

                {/* Role Toggles */}
                <div className="flex p-1 bg-white/5 rounded-lg mb-6">
                  {(["admin", "manager", "citizen"] as const).map((role) => (
                    <button
                      key={role}
                      onClick={() => {
                        setLoginRole(role);
                        if (role !== "citizen") {
                          setAuthMode("signin");
                        }
                        setAuthErrors({});
                        setAuthMessage(null);
                      }}
                      className={`flex-1 py-1.5 text-xs font-medium rounded-md capitalize transition-colors ${
                        loginRole === role
                          ? "bg-white/10 text-white shadow-sm"
                          : "text-gray-400 hover:text-gray-200"
                      }`}
                    >
                      {role === "manager" ? "Dept. Manager" : role}
                    </button>
                  ))}
                </div>

                {/* Form */}
                <form className="space-y-4" onSubmit={handleLoginSubmit}>
                  {authMessage && (
                    <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
                      {authMessage}
                    </div>
                  )}
                  {authMode === "signup" && (
                    <div>
                      <label className="block text-xs text-gray-400 mb-1.5">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={authEmail}
                        onChange={(e) => {
                          setAuthEmail(e.target.value);
                          if (authErrors.email) {
                            setAuthErrors((prev) => ({
                              ...prev,
                              email: undefined,
                            }));
                          }
                        }}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-white/20 transition-colors"
                        placeholder="name@example.com"
                      />
                      {authErrors.email && (
                        <p className="text-xs text-red-300 mt-1">
                          {authErrors.email}
                        </p>
                      )}
                    </div>
                  )}
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5">
                      Username
                    </label>
                    <input
                      type="text"
                      value={authUsername}
                      onChange={(e) => {
                        setAuthUsername(e.target.value);
                        if (authErrors.username) {
                          setAuthErrors((prev) => ({
                            ...prev,
                            username: undefined,
                          }));
                        }
                      }}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-white/20 transition-colors"
                      placeholder="Enter your username"
                    />
                    {authErrors.username && (
                      <p className="text-xs text-red-300 mt-1">
                        {authErrors.username}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5">
                      Password
                    </label>
                    <input
                      type="password"
                      value={authPassword}
                      onChange={(e) => {
                        setAuthPassword(e.target.value);
                        if (authErrors.password) {
                          setAuthErrors((prev) => ({
                            ...prev,
                            password: undefined,
                          }));
                        }
                      }}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-white/20 transition-colors"
                      placeholder="????"
                    />
                    {authErrors.password && (
                      <p className="text-xs text-red-300 mt-1">
                        {authErrors.password}
                      </p>
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={isAuthSubmitting}
                    className="w-full py-2.5 rounded-lg bg-linear-to-r from-white to-gray-300 text-black hover:from-gray-200 hover:to-gray-400 transition-all duration-300 text-sm font-medium mt-2 shadow-[0_0_15px_rgba(255,255,255,0.1)] disabled:opacity-70"
                  >
                    {isAuthSubmitting
                      ? "Submitting..."
                      : `${authMode === "signin" ? "Sign In" : "Sign Up"} as `}
                    {loginRole === "manager"
                      ? "Manager"
                      : loginRole.charAt(0).toUpperCase() + loginRole.slice(1)}
                  </button>

                  {loginRole === "citizen" && (
                    <div className="text-center mt-4">
                      <button
                        type="button"
                        onClick={() => {
                          setAuthMode(
                            authMode === "signin" ? "signup" : "signin",
                          );
                          setAuthErrors({});
                          setAuthMessage(null);
                        }}
                        className="text-xs text-gray-400 hover:text-white transition-colors"
                      >
                        {authMode === "signin"
                          ? "Don't have an account? Sign Up"
                          : "Already have an account? Sign In"}
                      </button>
                    </div>
                  )}
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Hero */}
        <main className="flex-1 flex flex-col items-center justify-center text-center px-4 relative z-10 -mt-4 md:-mt-8">
          <div className="flex flex-col items-center relative z-10">
            <motion.h1
              variants={fadeUp}
              animate={
                isLoading ? { opacity: 1 } : { opacity: [0.72, 1, 0.72] }
              }
              transition={
                isLoading
                  ? { duration: 0 }
                  : {
                      duration: 3.2,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: 2.4, // Wait for entrance to finish (Timeline T=1.2 + offset)
                    } // Wait for entrance
              }
              className="text-3xl md:text-4xl lg:text-[3.5rem] font-serif max-w-[800px] leading-[1.05] mb-4 md:mb-6 tracking-tight bg-linear-to-br from-white via-gray-200 to-gray-500 bg-clip-text text-transparent"
            >
              From citizen report
              <br />
              to resolved municipal action
            </motion.h1>
            <motion.p
              variants={fadeUp}
              className="text-gray-400 text-sm md:text-base max-w-xl mb-6 md:mb-8 font-light tracking-wide"
            >
              A single platform for citizens, department managers, and admins.
              Submit issues, predict category and priority, and route each case
              to the right team.
            </motion.p>
            <motion.button
              onClick={() => setIsLoginModalOpen(true)}
              variants={fadeScale}
              animate={isLoading ? { opacity: 1 } : { opacity: [0.8, 1, 0.8] }}
              transition={
                isLoading
                  ? { duration: 0 }
                  : {
                      duration: 2.0,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: 3.2, // Wait for entrance to finish (Timeline T=2.0 + offset)
                    } // Wait for entrance
              }
              className="px-5 py-2.5 rounded-full border border-white/20 hover:border-white/40 transition-all duration-300 flex items-center gap-2 text-xs font-medium bg-linear-to-r from-white to-gray-200 text-black hover:shadow-[0_0_20px_rgba(255,255,255,0.2)]"
            >
              Enter the platform <ArrowRight className="w-3.5 h-3.5" />
            </motion.button>
          </div>
        </main>

        {/* Logo Cloud */}
        <motion.div
          variants={fadeIn}
          className="shrink-0 flex flex-col items-center justify-center py-6 md:py-8 relative z-10 w-full overflow-hidden hidden md:flex"
        >
          <p className="text-gray-500 text-[10px] md:text-xs mb-4 md:mb-6 font-medium tracking-wide uppercase">
            Built for municipal service operations
          </p>

          <div className="relative w-full max-w-3xl mx-auto flex overflow-hidden">
            {/* Left Gradient */}
            {/* <div className="absolute left-0 top-0 bottom-0 w-24 md:w-40 bg-linear-to-r from-[#030303] to-transparent z-10 pointer-events-none"></div> */}

            {/* Right Gradient */}
            {/* <div className="absolute right-0 top-0 bottom-0 w-24 md:w-40 bg-linear-to-l from-[#030303] to-transparent z-10 pointer-events-none"></div> */}

            <motion.div
              animate={{ x: ["0%", "-50%"] }}
              transition={{ repeat: Infinity, ease: "linear", duration: 30 }}
              className="flex gap-12 md:gap-24 items-center opacity-60 grayscale scale-75 md:scale-90 w-max pr-12 md:pr-24"
            >
              {[...Array(2)].map((_, i) => (
                <React.Fragment key={i}>
                  <div className="flex items-center gap-2 font-serif italic text-xl tracking-tight">
                    Metropolis
                  </div>
                  <div className="flex items-center gap-2 font-serif italic text-xl tracking-tight">
                    Oakhaven
                  </div>
                  <div className="flex items-center gap-2 font-serif italic text-xl tracking-tight">
                    Riverdale
                  </div>
                  <div className="flex items-center gap-2 font-serif italic text-xl tracking-tight">
                    Silverwood
                  </div>
                  <div className="flex items-center gap-2 font-serif italic text-xl tracking-tight">
                    Springfield
                  </div>
                  <div className="flex items-center gap-2 font-serif italic text-xl tracking-tight">
                    Centerville
                  </div>
                  <div className="flex items-center gap-2 font-serif italic text-xl tracking-tight">
                    Fairview
                  </div>
                </React.Fragment>
              ))}
            </motion.div>
          </div>
        </motion.div>

        {/* Bottom Section */}
        <motion.div
          variants={fadeIn}
          className="shrink-0 border-t border-white/20 px-8 md:px-12 py-6 md:py-8 flex flex-col md:flex-row gap-6 md:gap-0 justify-between items-center relative z-10 bg-linear-to-b from-transparent to-black"
        >
          <div className="max-w-xl text-center md:text-left">
            <h3 className="text-lg md:text-xl font-serif mb-2 tracking-wide">
              Built around real report lifecycles
            </h3>
            <p className="text-gray-400 text-[10px] md:text-xs leading-relaxed font-light">
              Citizens submit issues, managers process department queues, and
              admins govern cross-team routing
              <br className="hidden md:block" />
              with transparent status tracking from start to resolution.
            </p>
          </div>
          <div className="flex gap-8 md:gap-16 items-center">
            <div className="flex flex-col text-center md:text-left">
              <span className="text-gray-500 text-[9px] md:text-[10px] mb-1 md:mb-2 tracking-wider uppercase">
                Training
                <br />
                records
              </span>
              <span className="text-3xl md:text-4xl font-serif tracking-tight">
                <AnimatedCounter end={1000} step={50} suffix="+" />
              </span>
            </div>
            <div className="w-px h-10 md:h-12 bg-white/10"></div>
            <div className="flex flex-col text-center md:text-left">
              <span className="text-gray-500 text-[9px] md:text-[10px] mb-1 md:mb-2 tracking-wider uppercase">
                Model
                <br />
                features
              </span>
              <span className="text-3xl md:text-4xl font-serif tracking-tight">
                <AnimatedCounter end={38} step={2} />
              </span>
            </div>
          </div>
        </motion.div>
      </motion.div>

      <PlatformSection />
      <LifecycleSection />
      <MetricsBento />
      <SolutionsSection />
      <DashboardPreview />
      <TeamSection members={team} />
      <FAQSection items={faqs} />
      <SiteFooter />
    </div>
  );
}
