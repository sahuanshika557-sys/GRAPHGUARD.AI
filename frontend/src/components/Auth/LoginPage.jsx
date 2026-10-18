import React, { useState } from "react";
import {
  ShieldAlert,
  Lock,
  Mail,
  Eye,
  EyeOff,
  Sparkles,
  Loader2,
  AlertCircle,
  Database,
  CheckCircle2,
  ArrowRight
} from "lucide-react";
import { loginUser } from "../../services/api";

const DEMO_PRESETS = [
  {
    role: "ADMIN",
    label: "Admin Lead",
    email: "admin@graphguard.ai",
    badge: "Full Access & User Mgmt"
  },
  {
    role: "ANALYST",
    label: "AML Analyst",
    email: "analyst@graphguard.ai",
    badge: "Investigate & Request"
  },
  {
    role: "REVIEWER",
    label: "Executive Reviewer",
    email: "reviewer@graphguard.ai",
    badge: "Approve & Hold"
  },
  {
    role: "VIEWER",
    label: "Audit Observer",
    email: "viewer@graphguard.ai",
    badge: "Read-Only Compliance"
  }
];

export default function LoginPage({ onLoginSuccess }) {
  const [email, setEmail] = useState("admin@graphguard.ai");
  const [password, setPassword] = useState("Admin@GraphGuard2026!");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handlePresetSelect = (preset) => {
    setEmail(preset.email);
    if (preset.role === "ADMIN") setPassword("Admin@GraphGuard2026!");
    else if (preset.role === "ANALYST") setPassword("Analyst@GraphGuard2026!");
    else if (preset.role === "REVIEWER") setPassword("Reviewer@GraphGuard2026!");
    else if (preset.role === "VIEWER") setPassword("Viewer@GraphGuard2026!");
    setErrorMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage("Please enter both email and password.");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    try {
      const data = await loginUser(email, password);
      if (onLoginSuccess) {
        onLoginSuccess(data.user);
      }
    } catch (err) {
      setErrorMessage(err.message || "Invalid email or password.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#070a10] flex items-center justify-center p-4 relative overflow-hidden select-none">
      {/* Subtle Background Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-900/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-900/15 rounded-full blur-3xl pointer-events-none" />

      {/* Main Authentication Card */}
      <div className="w-full max-w-md glass-panel-elevated rounded-2xl border border-slate-700/80 p-6 sm:p-8 space-y-6 shadow-2xl relative z-10 backdrop-blur-2xl">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 p-0.5 shadow-[0_0_20px_rgba(6,182,212,0.35)] mx-auto">
            <div className="w-full h-full bg-[#080d18] rounded-[10px] flex items-center justify-center">
              <ShieldAlert className="w-6 h-6 text-cyan-400" />
            </div>
          </div>
          <h1 className="text-xl font-black font-mono tracking-wider text-slate-100">
            GRAPHGUARD<span className="text-cyan-400">.AI</span>
          </h1>
          <p className="text-xs text-slate-400">
            Fraud Investigation Intelligence & Access Control
          </p>
        </div>

        {/* Error Notification Banner */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-red-950/80 border border-red-800/80 text-red-200 text-xs flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1 font-semibold">
              Investigator Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="analyst@graphguard.ai"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1 font-semibold">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-200 cursor-pointer"
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-semibold text-xs tracking-wider transition shadow-lg hover:shadow-cyan-900/40 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 mt-2"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ArrowRight className="w-4 h-4" />
            )}
            <span>{isLoading ? "Authenticating with Argon2id..." : "Secure Sign In"}</span>
          </button>
        </form>

        {/* Demo Roles Quick-Select Box */}
        <div className="pt-4 border-t border-slate-800 space-y-2">
          <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold flex items-center justify-between">
            <span>Evaluation Roles:</span>
            <span className="text-cyan-400">1-Click Auto-Fill</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {DEMO_PRESETS.map((p) => {
              const isSelected = email === p.email;
              return (
                <button
                  key={p.role}
                  type="button"
                  onClick={() => handlePresetSelect(p)}
                  className={`p-2 rounded-lg text-left border transition cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? "bg-slate-800/90 border-cyan-500 shadow-sm"
                      : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-slate-200">
                      {p.role}
                    </span>
                    {isSelected && (
                      <CheckCircle2 className="w-3 h-3 text-cyan-400" />
                    )}
                  </div>
                  <div className="text-[9px] text-slate-400 font-sans mt-0.5 truncate">
                    {p.badge}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Security Assurance Notice */}
        <div className="text-[10px] font-mono text-slate-500 text-center flex items-center justify-center gap-1.5 pt-1">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>Argon2id Hash • Role-Based Access Control • FalkorDB Cloud</span>
        </div>
      </div>
    </div>
  );
}
