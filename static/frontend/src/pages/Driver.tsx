import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Map, Power, DollarSign, MapPin, Phone, Navigation,
  History, Settings, HelpCircle, ChevronRight, TrendingUp, Car, Globe,
} from "lucide-react";
import { useLanguage } from "@/components/LanguageSelector";
import ContactButton from "@/components/ContactButton";

const Driver = () => {
  const navigate = useNavigate();
  const [isOnline, setIsOnline] = useState(false);
  const { t, lang, setLang } = useLanguage();

  return (
    <div className="min-h-screen bg-background">
      <nav className="ride-nav sticky top-0 z-10 backdrop-blur-sm bg-background/95">
        <button onClick={() => navigate("/")} className="text-xl font-extrabold tracking-tight text-foreground">
          Ride<span className="font-light">Go</span>
        </button>
        <div className="flex items-center gap-3">
          <span className={`ride-badge ${isOnline ? "ride-badge-success" : "ride-badge-muted"}`}>
            {isOnline ? t.online : t.offline}
          </span>
          <div className="w-8 h-8 rounded-full bg-foreground text-background flex items-center justify-center text-xs font-bold">
            D
          </div>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Driver Info + Toggle */}
        <div className="ride-card-elevated flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">{t.welcomeDriver}</h2>
            <p className="text-sm text-muted-foreground">{t.readyToDrive}</p>
          </div>
          <button
            onClick={() => setIsOnline(!isOnline)}
            className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 ${
              isOnline ? "bg-foreground text-background shadow-lg" : "bg-secondary text-muted-foreground"
            }`}
          >
            <Power className="w-8 h-8" />
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="ride-stat-card">
            <DollarSign className="w-5 h-5 text-muted-foreground mx-auto mb-2" />
            <p className="ride-stat-value">₹1,420</p>
            <p className="ride-stat-label">{t.todaysEarnings}</p>
          </div>
          <div className="ride-stat-card">
            <Car className="w-5 h-5 text-muted-foreground mx-auto mb-2" />
            <p className="ride-stat-value">8</p>
            <p className="ride-stat-label">{t.tripsToday}</p>
          </div>
          <div className="ride-stat-card">
            <TrendingUp className="w-5 h-5 text-muted-foreground mx-auto mb-2" />
            <p className="ride-stat-value">67 km</p>
            <p className="ride-stat-label">{t.totalDistance}</p>
          </div>
        </div>

        {/* New Ride Request */}
        {isOnline && (
          <div className="ride-card-elevated border-2 border-foreground/10 space-y-4 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold">{t.newRideRequest}</h3>
              <span className="ride-badge-success">New</span>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span>+91 98765-04560</span>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-success mt-0.5" />
                <span>123 Main Street, Downtown</span>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-destructive mt-0.5" />
                <span>456 Oak Avenue, Uptown</span>
              </div>
              <div className="flex gap-4 pt-1">
                <div>
                  <p className="text-xs text-muted-foreground">{t.distance}</p>
                  <p className="font-bold text-base">12.5 km</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t.fare}</p>
                  <p className="font-bold text-base">₹230</p>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button className="ride-btn-success flex-1">{t.acceptRide}</button>
              <button className="ride-btn-danger flex-1">{t.rejectRide}</button>
            </div>
          </div>
        )}

        {/* Map Section */}
        <div className="rounded-2xl bg-secondary h-48 flex items-center justify-center border border-border overflow-hidden relative">
          <div className="absolute inset-0 opacity-5" style={{
            backgroundImage: 'radial-gradient(circle, hsl(var(--foreground)) 1px, transparent 1px)',
            backgroundSize: '20px 20px'
          }} />
          <div className="text-center z-10">
            <Map className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm font-medium text-muted-foreground">{t.liveMap}</p>
            <p className="text-xs text-muted-foreground">{t.navReady}</p>
          </div>
        </div>

        {/* Driver Controls */}
        <div className="ride-section-title">{t.driverControls}</div>
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: History, label: t.rideHistory },
            { icon: DollarSign, label: t.earnings },
            { icon: Navigation, label: t.navigation },
            { icon: Settings, label: t.settings },
            { icon: HelpCircle, label: t.support },
            { icon: Globe, label: t.changeLanguage, action: () => setLang(lang === "en" ? "hi" : "en") },
          ].map((item) => (
            <button key={item.label} onClick={item.action} className="ride-card flex items-center gap-3 py-4 cursor-pointer">
              <item.icon className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm font-medium">{item.label}</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
            </button>
          ))}
        </div>
      </div>

      <ContactButton t={t} />
    </div>
  );
};

export default Driver;
