import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Star, ArrowLeft, CheckCircle, Loader2 } from "lucide-react";
import { useLanguage } from "@/components/LanguageSelector";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

const Feedback = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) return;

    const rideId = localStorage.getItem("ridego-ride-id");
    setSubmitting(true);

    try {
      if (rideId) {
        await fetch(`${API_BASE}/api/ride/${rideId}/feedback/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            rating,
            comment,
          }),
        });
      }
    } catch (err) {
      console.error("Feedback error:", err);
    }

    setSubmitting(false);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="ride-card-elevated w-full max-w-md text-center space-y-6">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto" style={{ backgroundColor: "hsl(var(--success) / 0.1)" }}>
            <CheckCircle className="w-8 h-8" style={{ color: "hsl(var(--success))" }} />
          </div>
          <h1 className="text-xl font-bold text-foreground">{t.thanksFeedback}</h1>
          <p className="text-sm text-muted-foreground">{t.feedbackMsg}</p>
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
          <h1 className="text-xl font-bold text-foreground">{t.rateFeedback}</h1>
          <p className="text-sm text-muted-foreground">{t.howWasRide}</p>
        </div>
        <div className="flex justify-center gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              className="p-1 transition-transform hover:scale-110"
            >
              <Star
                className={`w-10 h-10 transition-colors ${
                  star <= (hoveredRating || rating)
                    ? "fill-amber-400 text-amber-400"
                    : "text-border"
                }`}
              />
            </button>
          ))}
        </div>
        {rating > 0 && (
          <p className="text-center text-sm font-medium text-foreground">
            {rating === 1 ? "😞" : rating === 2 ? "😐" : rating === 3 ? "🙂" : rating === 4 ? "😊" : "🤩"}{" "}
            {rating}/5
          </p>
        )}
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={t.leaveComment}
          rows={3}
          className="ride-input resize-none"
        />
        <button
          onClick={handleSubmit}
          disabled={rating === 0 || submitting}
          className="ride-btn-primary w-full py-4 text-base disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {submitting ? "Submitting..." : t.submitFeedback}
        </button>
      </div>
    </div>
  );
};

export default Feedback;
