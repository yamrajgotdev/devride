import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { CheckCircle, Car, User, Phone, Clock, Navigation, X, Home, Star, AlertTriangle, Share2, Loader2 } from "lucide-react";
import { useLanguage } from "@/components/LanguageSelector";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

interface RideData {
  rideId: string;
  otp: string;
  fare: number;
  pickup: string;
  drop: string;
  pickupLat: number;
  pickupLng: number;
  dropLat: number;
  dropLng: number;
}

const RideSuccess = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [rideData, setRideData] = useState<RideData | null>(null);
  const [loading, setLoading] = useState(true);
  const [driverInfo, setDriverInfo] = useState<{ name: string; phone: string; vehicle: string } | null>(null);

  useEffect(() => {
    const savedData: RideData = {
      rideId: localStorage.getItem("ridego-ride-id") || "",
      otp: localStorage.getItem("ridego-otp") || "",
      fare: parseInt(localStorage.getItem("ridego-fare") || "0"),
      pickup: localStorage.getItem("ridego-pickup") || "",
      drop: localStorage.getItem("ridego-drop") || "",
      pickupLat: parseFloat(localStorage.getItem("ridego-pickup-lat") || "0"),
      pickupLng: parseFloat(localStorage.getItem("ridego-pickup-lng") || "0"),
      dropLat: parseFloat(localStorage.getItem("ridego-drop-lat") || "0"),
      dropLng: parseFloat(localStorage.getItem("ridego-drop-lng") || "0"),
    };

    if (savedData.rideId) {
      setRideData(savedData);
      fetchRideStatus(savedData.rideId);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchRideStatus = async (rideId: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/ride/${rideId}/status/`);
      const data = await res.json();
      if (data.driver) {
        setDriverInfo({
          name: data.driver.name || "Driver Assigned",
          phone: data.driver.mobile || "+91 98765-43210",
          vehicle: "Maruti Swift",
        });
      } else {
        setDriverInfo({
          name: "Finding nearby driver...",
          phone: "Will be assigned soon",
          vehicle: "Assigning...",
        });
      }
    } catch {
      setDriverInfo({
        name: "Driver will be assigned",
        phone: "Finding nearby drivers",
        vehicle: "Processing...",
      });
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-8">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-foreground" />
          <p className="text-muted-foreground">Loading ride details...</p>
        </div>
      </div>
    );
  }

  if (!rideData) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-8">
        <div className="ride-card-elevated w-full max-w-md text-center space-y-6">
          <p className="text-muted-foreground">No ride data found. Please book a ride first.</p>
          <button onClick={() => navigate("/customer")} className="ride-btn-primary w-full">
            Book a Ride
          </button>
        </div>
      </div>
    );
  }

  const baseFare = 50;
  const distanceCharge = Math.round(rideData.fare - baseFare - 30);
  const taxes = 30;
  const totalFare = rideData.fare;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="ride-card-elevated w-full max-w-md text-center space-y-6">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--success) / 0.1)' }}>
            <CheckCircle className="w-8 h-8" style={{ color: 'hsl(var(--success))' }} />
          </div>
        </div>

        <div>
          <h1 className="text-xl font-bold text-foreground">{t.rideBooked}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t.rideConfirmed}</p>
        </div>

        <div className="bg-secondary rounded-xl p-4 space-y-3 text-left">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">OTP for Verification</p>
            <span className="text-lg font-bold tracking-widest">{rideData.otp}</span>
          </div>
          <div className="border-t border-border pt-3">
            <p className="text-xs text-muted-foreground mb-1">Share this OTP with your driver</p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">{t.driverLabel}</p>
              <p className="font-medium flex items-center gap-1"><User className="w-3 h-3" /> {driverInfo?.name || "Assigning..."}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t.vehicle}</p>
              <p className="font-medium flex items-center gap-1"><Car className="w-3 h-3" /> {driverInfo?.vehicle || "Processing..."}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t.phone}</p>
              <p className="font-medium flex items-center gap-1"><Phone className="w-3 h-3" /> {driverInfo?.phone || "Soon..."}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t.estArrival}</p>
              <p className="font-medium flex items-center gap-1"><Clock className="w-3 h-3" /> Finding...</p>
            </div>
          </div>
        </div>

        <div className="bg-secondary rounded-xl p-4 text-left space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t.fareBreakdown}</p>
          <div className="flex justify-between text-sm"><span className="text-muted-foreground">{t.baseFare}</span><span>₹{baseFare}</span></div>
          <div className="flex justify-between text-sm"><span className="text-muted-foreground">{t.distanceCharge}</span><span>₹{Math.max(distanceCharge, 20)}</span></div>
          <div className="flex justify-between text-sm"><span className="text-muted-foreground">{t.taxes}</span><span>₹{taxes}</span></div>
          <div className="border-t border-border pt-2 flex justify-between text-sm font-bold"><span>{t.totalFare}</span><span>₹{totalFare}</span></div>
        </div>

        <div className="space-y-3">
          <button className="ride-btn-primary w-full">
            <Navigation className="w-4 h-4" />
            {t.trackRide}
          </button>
          <button onClick={() => navigate("/feedback")} className="ride-btn-outline w-full">
            <Star className="w-4 h-4" />
            {t.rateFeedback}
          </button>
          <div className="flex gap-3">
            <button onClick={() => navigate("/cancel-ride")} className="ride-btn-danger flex-1">
              <X className="w-4 h-4" />
              {t.cancelRide}
            </button>
            <button onClick={() => navigate("/")} className="ride-btn-secondary flex-1">
              <Home className="w-4 h-4" />
              {t.backToHome}
            </button>
          </div>
          <div className="flex gap-3">
            <button className="ride-btn-outline flex-1 text-xs">
              <Share2 className="w-4 h-4" />
              {t.shareRide}
            </button>
            <button className="ride-btn-danger flex-1 text-xs">
              <AlertTriangle className="w-4 h-4" />
              {t.sos}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RideSuccess;
