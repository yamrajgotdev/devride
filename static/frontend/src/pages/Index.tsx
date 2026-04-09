import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Car, User, Shield, Star, Zap } from "lucide-react";
import { useLanguage, LanguageModal } from "@/components/LanguageSelector";

const Index = () => {
  const navigate = useNavigate();
  const { t, showSelector, selectLanguage } = useLanguage();

  useEffect(() => {
    const authToken = localStorage.getItem("auth_token");
    if (authToken) {
      navigate("/customer");
    }
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {showSelector && <LanguageModal onSelect={selectLanguage} />}

      <div className="absolute inset-0 opacity-[0.02]" style={{
        backgroundImage: 'radial-gradient(circle at 1px 1px, hsl(var(--foreground)) 1px, transparent 0)',
        backgroundSize: '32px 32px'
      }} />

      <div className="mb-10 text-center relative z-10">
        <div className="w-16 h-16 rounded-2xl bg-foreground text-background flex items-center justify-center mx-auto mb-4 shadow-lg">
          <Zap className="w-8 h-8" />
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-foreground">
          Ride<span className="font-light">Go</span>
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{t.appTagline}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 w-full max-w-lg relative z-10">
        <button
          onClick={() => navigate("/passenger-login")}
          className="ride-card flex-1 flex flex-col items-center gap-3 py-8 cursor-pointer group border border-transparent hover:border-foreground/10"
        >
          <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center transition-all duration-300 group-hover:bg-foreground group-hover:text-background group-hover:scale-110 group-hover:shadow-lg">
            <User className="w-6 h-6" />
          </div>
          <div className="text-center">
            <h2 className="text-base font-semibold text-foreground">{t.passenger}</h2>
            <p className="text-xs text-muted-foreground mt-1">{t.passengerSub}</p>
          </div>
        </button>

        <button
          onClick={() => navigate("/driver-login")}
          className="ride-card flex-1 flex flex-col items-center gap-3 py-8 cursor-pointer group border border-transparent hover:border-foreground/10"
        >
          <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center transition-all duration-300 group-hover:bg-foreground group-hover:text-background group-hover:scale-110 group-hover:shadow-lg">
            <Car className="w-6 h-6" />
          </div>
          <div className="text-center">
            <h2 className="text-base font-semibold text-foreground">{t.driver}</h2>
            <p className="text-xs text-muted-foreground mt-1">{t.driverSub}</p>
          </div>
        </button>
      </div>

      <div className="flex items-center gap-6 mt-10 text-muted-foreground relative z-10">
        <div className="flex items-center gap-1.5 text-xs">
          <Shield className="w-3.5 h-3.5" />
          <span>{t.safeRides}</span>
        </div>
        <div className="w-1 h-1 rounded-full bg-border" />
        <div className="flex items-center gap-1.5 text-xs">
          <Star className="w-3.5 h-3.5" />
          <span>{t.topRated}</span>
        </div>
        <div className="w-1 h-1 rounded-full bg-border" />
        <div className="flex items-center gap-1.5 text-xs">
          <Zap className="w-3.5 h-3.5" />
          <span>{t.fastBooking}</span>
        </div>
      </div>
    </div>
  );
};

export default Index;
