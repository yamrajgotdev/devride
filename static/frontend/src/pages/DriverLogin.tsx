import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Car, Phone, ArrowLeft, Shield, Upload, FileCheck, Clock, CheckCircle, User, CreditCard, Hash, FileText, X, IdCard, Loader2 } from "lucide-react";
import { useLanguage } from "@/components/LanguageSelector";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

const OTP_LENGTH = 6;
const RESEND_TIMER_SECONDS = 30;
const MOBILE_REGEX = /^[6-9]\d{9}$/;
const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
const AADHAAR_REGEX = /^[0-9]{12}$/;
const NUMBER_PLATE_REGEX = /^[A-Z]{2}[0-9]{1,2}[A-Z]{1,3}[0-9]{4}$/;
const DL_REGEX = /^[A-Z]{2}[0-9]{2}\s?[0-9]{11}$/;

const TERMS_AND_CONDITIONS = [
  "You must be at least 18 years of age and hold a valid Indian driving license to register as a driver on RideGo.",
  "All documents submitted (PAN Card, Aadhaar Card, Driving License, Registration Certificate) must be genuine and verifiable. Submission of forged or tampered documents will result in permanent account suspension and may attract legal action.",
  "RideGo reserves the right to conduct background verification checks before approving your driver account. This process may take 24-48 hours.",
  "As a registered driver, you agree to maintain your vehicle in roadworthy condition, comply with all traffic laws, and carry valid insurance at all times.",
  "RideGo charges a platform commission on each completed ride. The applicable commission rate will be communicated to you upon account approval.",
  "You are responsible for your own tax filings and compliance. RideGo will provide earnings statements but does not withhold taxes on your behalf.",
  "Drivers must maintain a minimum rating of 4.0 stars. Repeated low ratings or customer complaints may result in temporary or permanent deactivation.",
  "RideGo prohibits discrimination of any kind. You must provide equal service to all passengers regardless of gender, religion, caste, or destination.",
  "Cancellation of accepted rides without valid reason will attract penalties. Excessive cancellations may lead to account suspension.",
  "Your personal data will be handled in accordance with RideGo's Privacy Policy. We may share limited information with passengers for ride coordination purposes.",
  "RideGo reserves the right to modify these terms at any time. Continued use of the platform constitutes acceptance of updated terms.",
  "In case of disputes, the jurisdiction shall be the courts of India, and RideGo's decision on platform-related matters shall be final.",
];

// InputField defined OUTSIDE the component to prevent re-mount on every render
const InputField = ({ label, icon: Icon, value, onChange, placeholder, error, required = true, maxLength, inputMode, className: extraClass }: {
  label: string; icon: any; value: string; onChange: (v: string) => void; placeholder: string;
  error?: string; required?: boolean; maxLength?: number; inputMode?: "numeric" | "text"; className?: string;
}) => (
  <div>
    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
      {label} {required && <span className="text-destructive">*</span>}
    </label>
    <div className="relative">
      <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
      <input
        type="text"
        inputMode={inputMode}
        maxLength={maxLength}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`ride-input pl-10 ${extraClass || ""}`}
      />
    </div>
    {error && <p className="text-xs mt-1 text-destructive">{error}</p>}
  </div>
);

const DocUploadCard = ({ label, file, onFileChange }: { label: string; file: File | null; onFileChange: (f: File | null) => void }) => (
  <label className="ride-card flex items-center gap-4 py-4 cursor-pointer border border-dashed border-border hover:border-foreground/30 transition-colors">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${file ? "bg-success/10" : "bg-secondary"}`}>
      {file ? <FileCheck className="w-5 h-5 text-success" /> : <Upload className="w-5 h-5 text-muted-foreground" />}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium">{label}</p>
      <p className="text-xs text-muted-foreground truncate">{file ? file.name : "Tap to upload"}</p>
    </div>
    {file && <span className="text-xs font-medium flex-shrink-0 text-success">Done</span>}
    <input type="file" accept="image/*" className="hidden" onChange={(e) => onFileChange(e.target.files?.[0] || null)} />
  </label>
);

const DriverLogin = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [step, setStep] = useState<"form" | "otp" | "pending">("form");
  const [fullName, setFullName] = useState("");
  const [mobile, setMobile] = useState("");
  const [aadhaarNumber, setAadhaarNumber] = useState("");
  const [panNumber, setPanNumber] = useState("");
  const [rcNumber, setRcNumber] = useState("");
  const [numberPlate, setNumberPlate] = useState("");
  const [drivingLicense, setDrivingLicense] = useState("");
  const [otp, setOtp] = useState("");
  const [resendTimer, setResendTimer] = useState(0);
  const [showTerms, setShowTerms] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [docs, setDocs] = useState({
    panCard: null as File | null,
    aadhaar: null as File | null,
    rc: null as File | null,
    drivingLicenseDoc: null as File | null,
  });
  const [registering, setRegistering] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const isValidMobile = MOBILE_REGEX.test(mobile);
  const isValidPan = PAN_REGEX.test(panNumber.toUpperCase());
  const isValidAadhaar = AADHAAR_REGEX.test(aadhaarNumber);
  const isValidPlate = NUMBER_PLATE_REGEX.test(numberPlate.replace(/\s/g, "").toUpperCase());
  const isValidDL = DL_REGEX.test(drivingLicense.replace(/\s/g, "").toUpperCase());
  const allDocsUploaded = docs.panCard && docs.aadhaar && docs.rc && docs.drivingLicenseDoc;
  const formValid = fullName.trim() && isValidMobile && isValidPan && isValidAadhaar && rcNumber.trim() && isValidPlate && isValidDL && allDocsUploaded && termsAccepted;

  const handleFileChange = (key: keyof typeof docs, file: File | null) => {
    setDocs((prev) => ({ ...prev, [key]: file }));
  };

  const handleRegister = async () => {
    if (!formValid) return;
    setRegistering(true);
    try {
      await fetch(`${API_BASE}/api/driver/send-otp/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile }),
      });
      setStep("otp");
      startResendTimer();
    } catch (err) {
      console.error("Registration error:", err);
    }
    setRegistering(false);
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
    setVerifying(true);
    try {
      await fetch(`${API_BASE}/api/driver/register/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mobile,
          full_name: fullName,
          driving_license: drivingLicense,
          aadhaar_number: aadhaarNumber,
          pan_number: panNumber,
          rc_number: rcNumber,
          number_plate: numberPlate,
          otp,
        }),
      });
      setStep("pending");
    } catch (err) {
      console.error("Verification error:", err);
    }
    setVerifying(false);
  };

  const TermsModal = () => (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-foreground/40 backdrop-blur-sm animate-in fade-in" onClick={() => setShowTerms(false)}>
      <div className="bg-background w-full max-w-lg max-h-[80vh] rounded-t-3xl sm:rounded-3xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-background border-b border-border px-6 py-4 flex items-center justify-between">
          <h3 className="text-lg font-bold">{t.termsTitle}</h3>
          <button onClick={() => setShowTerms(false)} className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center hover:bg-muted transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-6 py-4 overflow-y-auto max-h-[60vh] space-y-4">
          {TERMS_AND_CONDITIONS.map((term, i) => (
            <div key={i} className="flex gap-3">
              <span className="text-xs font-bold text-muted-foreground mt-0.5 shrink-0">{i + 1}.</span>
              <p className="text-sm text-muted-foreground leading-relaxed">{term}</p>
            </div>
          ))}
        </div>
        <div className="sticky bottom-0 bg-background border-t border-border px-6 py-4">
          <button onClick={() => { setTermsAccepted(true); setShowTerms(false); }} className="ride-btn-primary w-full py-3.5">
            {t.acceptTerms}
          </button>
        </div>
      </div>
    </div>
  );

  if (step === "pending") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="ride-card-elevated w-full max-w-md text-center space-y-6">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto bg-success/10">
            <Clock className="w-10 h-10 text-success" />
          </div>
          <h1 className="text-xl font-bold text-foreground">{t.verificationPending}</h1>
          <p className="text-sm text-muted-foreground">{t.verificationMsg}</p>
          <div className="bg-secondary rounded-xl p-4">
            <p className="text-xs text-muted-foreground">{t.verificationNote}</p>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-left bg-secondary rounded-xl p-4">
              <CheckCircle className="w-5 h-5 flex-shrink-0 text-success" />
              <div>
                <p className="text-sm font-medium">{t.mobileVerified}</p>
                <p className="text-xs text-muted-foreground">+91 {mobile}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-left bg-secondary rounded-xl p-4">
              <FileCheck className="w-5 h-5 flex-shrink-0 text-success" />
              <div>
                <p className="text-sm font-medium">{t.docsSubmitted}</p>
                <p className="text-xs text-muted-foreground">{t.docsCount}</p>
              </div>
            </div>
          </div>
          <button onClick={() => navigate("/")} className="ride-btn-primary w-full py-4 text-base">
            {t.backToHome}
          </button>
        </div>
      </div>
    );
  }

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
          <button onClick={handleVerifyOtp} disabled={otp.length !== OTP_LENGTH || verifying} className="ride-btn-primary w-full py-4 text-base disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            {verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {verifying ? "Verifying..." : t.verifyOtp}
          </button>
          <div className="text-center">
            {resendTimer > 0 ? (
              <p className="text-sm text-muted-foreground">{t.resendIn} {resendTimer}s</p>
            ) : (
              <button onClick={startResendTimer} className="text-sm font-medium text-foreground underline">
                {t.resendOtp}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      {showTerms && <TermsModal />}
      <div className="ride-card-elevated w-full max-w-md space-y-6">
        <button onClick={() => navigate("/")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" /> {t.backToHome}
        </button>

        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-foreground to-foreground/80 flex items-center justify-center mx-auto text-background">
            <Car className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-bold text-foreground">{t.driverRegistration}</h1>
          <p className="text-xs text-muted-foreground">{t.driverRegSubtitle}</p>
        </div>

        <div className="flex gap-1">
          <div className="h-1 flex-1 rounded-full bg-foreground" />
          <div className="h-1 flex-1 rounded-full bg-border" />
          <div className="h-1 flex-1 rounded-full bg-border" />
        </div>

        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t.personalInfo}</p>
          <InputField label={t.fullName} icon={User} value={fullName} onChange={setFullName} placeholder={t.enterFullName} />
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
              {t.mobileNumber} <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <span className="absolute left-10 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">+91</span>
              <input type="tel" inputMode="numeric" maxLength={10} value={mobile} onChange={(e) => setMobile(e.target.value.replace(/\D/g, ""))} placeholder={t.enterMobile} className="ride-input pl-20" />
            </div>
            {mobile.length > 0 && !isValidMobile && <p className="text-xs mt-1 text-destructive">{t.invalidMobile}</p>}
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t.documentDetails}</p>
          <InputField label={t.drivingLicenseNumber} icon={IdCard} value={drivingLicense} onChange={(v) => setDrivingLicense(v.toUpperCase())} placeholder={t.enterDrivingLicense} maxLength={16} error={drivingLicense.length > 0 && !isValidDL ? t.invalidDrivingLicense : undefined} />
          <InputField label={t.aadhaarNumber} icon={CreditCard} value={aadhaarNumber} onChange={(v) => setAadhaarNumber(v.replace(/\D/g, ""))} placeholder="XXXX XXXX XXXX" maxLength={12} inputMode="numeric" error={aadhaarNumber.length > 0 && !isValidAadhaar ? t.invalidAadhaar : undefined} />
          <InputField label={t.panNumber} icon={FileText} value={panNumber} onChange={(v) => setPanNumber(v.toUpperCase())} placeholder="ABCDE1234F" maxLength={10} error={panNumber.length > 0 && !isValidPan ? t.invalidPan : undefined} />
          <InputField label={t.rcNumber} icon={FileText} value={rcNumber} onChange={setRcNumber} placeholder={t.enterRcNumber} />
          <InputField label={t.numberPlate} icon={Hash} value={numberPlate} onChange={(v) => setNumberPlate(v.toUpperCase())} placeholder="MH01AB1234" maxLength={13} error={numberPlate.length > 0 && !isValidPlate ? t.invalidPlate : undefined} />
        </div>

        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t.uploadDocuments}</p>
          <DocUploadCard label={t.uploadDrivingLicense} file={docs.drivingLicenseDoc} onFileChange={(f) => handleFileChange("drivingLicenseDoc", f)} />
          <DocUploadCard label={t.uploadPanCard} file={docs.panCard} onFileChange={(f) => handleFileChange("panCard", f)} />
          <DocUploadCard label={t.uploadAadhaar} file={docs.aadhaar} onFileChange={(f) => handleFileChange("aadhaar", f)} />
          <DocUploadCard label={t.uploadRc} file={docs.rc} onFileChange={(f) => handleFileChange("rc", f)} />
        </div>

        <div className="flex items-start gap-3 bg-secondary rounded-xl p-4">
          <input type="checkbox" checked={termsAccepted} onChange={(e) => { if (e.target.checked) { setShowTerms(true); } else { setTermsAccepted(false); } }} className="mt-0.5 w-4 h-4 rounded accent-foreground cursor-pointer" />
          <p className="text-xs text-muted-foreground">
            {t.agreeToTerms}{" "}
            <button onClick={() => setShowTerms(true)} className="underline font-medium text-foreground">
              {t.termsAndConditions}
            </button>
          </p>
        </div>

        <button onClick={handleRegister} disabled={!formValid || registering} className="ride-btn-primary w-full py-4 text-base disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
          {registering ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {registering ? "Registering..." : t.registerDriver}
        </button>
      </div>
    </div>
  );
};

export default DriverLogin;
