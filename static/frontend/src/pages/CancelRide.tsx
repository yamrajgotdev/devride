import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, XCircle, CheckCircle, Loader2 } from "lucide-react";
import { useLanguage } from "@/components/LanguageSelector";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

const CancelRide = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [reason, setReason] = useState("");
  const [cancelled, setCancelled] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const handleCancel = async () => {
    const rideId = localStorage.getItem("ridego-ride-id");
    if (!rideId) {
      setCancelled(true);
      return;
    }

    setCancelling(true);
    try {
      await fetch(`${API_BASE}/api/ride/${rideId}/cancel/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
    } catch (err) {
      console.error("Cancel error:", err);
    }
    setCancelling(false);
    setCancelled(true);
  };

  const reasons = [
    t.reasonChanged,
    t.reasonWaiting,
    t.reasonWrongPickup,
    t.reasonOther,
  ];

  if (cancelled) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="ride-card-elevated w-full max-w-md text-center space-y-6">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto" style={{ backgroundColor: "hsl(var(--destructive) / 0.1)" }}>
            <XCircle className="w-8 h-8" style={{ color: "hsl(var(--destructive))" }} />
          </div>
          <h1 className="text-xl font-bold text-foreground">{t.rideCancelled}</h1>
          <p className="text-sm text-muted-foreground">{t.rideCancelledMsg}</p>
          <button onClick={() => navigate("/customer")} className="ride-btn-primary w-full py-4 text-base">
            {t.backToHome}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="ride-card-elevated w-full max-w-md space-y-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" /> {t.goBack}
        </button>
        <div className="text-center space-y-2">
          <h1 className="text-xl font-bold text-foreground">{t.cancelRideTitle}</h1>
          <p className="text-sm text-muted-foreground">{t.cancelReason}</p>
        </div>
        <div className="space-y-2">
          {reasons.map((r) => (
            <button
              key={r}
              onClick={() => setReason(r)}
              className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all ${
                reason === r
                  ? "border-foreground bg-foreground/5 font-medium"
                  : "border-border hover:border-foreground/30"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
        <div className="flex gap-3">
          <button onClick={() => navigate(-1)} className="ride-btn-outline flex-1 py-3">
            {t.goBack}
          </button>
          <button
            onClick={handleCancel}
            disabled={!reason || cancelling}
            className="ride-btn-danger flex-1 py-3 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {cancelling ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {cancelling ? "Cancelling..." : t.confirmCancel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CancelRide;
