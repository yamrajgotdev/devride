import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Phone, Mail, ArrowLeft, Shield, Loader2 } from "lucide-react";
import { useLanguage } from "@/components/LanguageSelector";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

// ── Configurable constants ──────────────────
const OTP_LENGTH = 6;
const RESEND_TIMER_SECONDS = 30;
const MOBILE_REGEX = /^[6-9]\d{9}$/; // Indian mobile format
// ─────────────────────────────────────────────

const PassengerLogin = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [step, setStep] = useState<"form" | "otp" | "success">("form");
  const [mobile, setMobile] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [resendTimer, setResendTimer] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isValidMobile = MOBILE_REGEX.test(mobile);

  const handleGetOtp = async () => {
    if (!isValidMobile || !username.trim()) return;
    setLoading(true);
    setError("");
    
    try {
      const response = await fetch(`${API_BASE}/api/auth/send-otp/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile: `+91${mobile}` }),
      });
      
      if (response.ok) {
        setStep("otp");
        startResendTimer();
      } else {
        const data = await response.json();
        setError(data.message || data.error || "Failed to send OTP");
      }
    } catch (err) {
      setError("Network error. Please try again.");
      console.error("OTP send error:", err);
    }
    
    setLoading(false);
  };

  const startResendTimer = () => {
    setResendTimer(RESEND_TIMER_SECONDS);
    const interval = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) { clearInterval(interval); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== OTP_LENGTH) return;
    setLoading(true);
    setError("");
    
    try {
      const response = await fetch(`${API_BASE}/api/auth/verify-otp/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile: `+91${mobile}`, otp }),
      });
      
      const data = await response.json();
      
      if (response.ok && (data.success || data.status === "success")) {
        if (data.token) {
          localStorage.setItem("auth_token", data.token);
        }
        localStorage.setItem("ridego-passenger-auth", "true");
        localStorage.setItem("ridego-passenger-name", username);
        localStorage.setItem("ridego-passenger-mobile", `+91${mobile}`);
        navigate("/customer");
      } else {
        setError(data.message || data.error || "Invalid OTP");
      }
    } catch (err) {
      setError("Network error. Please try again.");
      console.error("OTP verify error:", err);
    }
    
    setLoading(false);
  };

  if (step === "otp") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="ride-card-elevated w-full max-w-md space-y-6">
          <button onClick={() => setStep("form")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" /> {t.goBack}
          </button>
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto">
              <Shield className="w-8 h-8 text-muted-foreground" />
            </div>
            <h1 className="text-xl font-bold text-foreground">{t.otpVerification}</h1>
            <p className="text-sm text-muted-foreground">{t.enterOtp} +91 {mobile}</p>
            {error && <p className="text-sm" style={{ color: "hsl(var(--destructive))" }}>{error}</p>}
            <p className="text-xs text-muted-foreground">OTP will be printed in terminal</p>
          </div>
          <div className="flex justify-center gap-2">
            {Array.from({ length: OTP_LENGTH }).map((_, i) => (
              <input
                key={i}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={otp[i] || ""}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/, "");
                  const newOtp = otp.split("");
                  newOtp[i] = val;
                  setOtp(newOtp.join(""));
                  if (val && e.target.nextElementSibling) {
                    (e.target.nextElementSibling as HTMLInputElement).focus();
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Backspace" && !otp[i] && e.target instanceof HTMLInputElement && e.target.previousElementSibling) {
                    (e.target.previousElementSibling as HTMLInputElement).focus();
                  }
                }}
                className="w-12 h-14 text-center text-xl font-bold rounded-xl border border-border bg-secondary focus:border-foreground focus:ring-1 focus:ring-foreground outline-none transition-all"
              />
            ))}
          </div>
          <button
            onClick={handleVerifyOtp}
            disabled={otp.length !== OTP_LENGTH || loading}
            className="ride-btn-primary w-full py-4 text-base disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? "Verifying..." : t.verifyOtp}
          </button>
          <div className="text-center">
            {resendTimer > 0 ? (
              <p className="text-sm text-muted-foreground">{t.resendIn} {resendTimer}s</p>
            ) : (
              <button onClick={handleGetOtp} className="text-sm font-medium text-foreground underline">
                {t.resendOtp}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="ride-card-elevated w-full max-w-md space-y-6">
        <button onClick={() => navigate("/")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" /> {t.backToHome}
        </button>
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto">
            <User className="w-8 h-8 text-muted-foreground" />
          </div>
          <h1 className="text-xl font-bold text-foreground">{t.passengerLogin}</h1>
        </div>

        {error && (
          <p className="text-sm text-center" style={{ color: "hsl(var(--destructive))" }}>{error}</p>
        )}

        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t.mobileNumber} *</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <span className="absolute left-10 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">+91</span>
              <input
                type="tel"
                inputMode="numeric"
                maxLength={10}
                value={mobile}
                onChange={(e) => setMobile(e.target.value.replace(/\D/g, ""))}
                placeholder={t.enterMobile}
                className="ride-input pl-20"
              />
            </div>
            {mobile.length > 0 && !isValidMobile && (
              <p className="text-xs mt-1" style={{ color: "hsl(var(--destructive))" }}>Enter a valid 10-digit Indian mobile number</p>
            )}
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t.username} *</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={t.enterUsername}
                className="ride-input pl-10"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
              {t.emailOptional}
              <span className="ml-2 text-xs font-normal text-muted-foreground italic">(optional)</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t.enterEmail}
                className="ride-input pl-10"
              />
            </div>
          </div>
        </div>

        <button
          onClick={handleGetOtp}
          disabled={!isValidMobile || !username.trim() || loading}
          className="ride-btn-primary w-full py-4 text-base disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {loading ? "Sending OTP..." : t.getOtp}
        </button>
      </div>
    </div>
  );
};

export default PassengerLogin;
