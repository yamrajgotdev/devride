import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  MapPin, Navigation, Clock, Bookmark, History, CreditCard,
  HelpCircle, Phone, Car, User, ChevronRight, Globe, Calendar,
  Zap, Shield, Star, ArrowRight, Loader2, Locate,
} from "lucide-react";
import { useLanguage } from "@/components/LanguageSelector";
import ContactButton from "@/components/ContactButton";
import MapContainer from "@/components/map/MapContainer";

const API_BASE = import.meta.env.VITE_API_URL || "";

interface Prediction {
  description: string;
  place_name?: string;
  secondary_text?: string;
  lat: number;
  lng: number;
}

const VEHICLE_TYPES = [
  { id: "bike", icon: "🏍️", name: "Bike", desc: "Quick & affordable", eta: "2 min", multiplier: 0.6 },
  { id: "auto", icon: "🛺", name: "Auto", desc: "Affordable rides", eta: "3 min", multiplier: 0.8 },
  { id: "mini", icon: "🚗", name: "Mini", desc: "Budget-friendly", eta: "4 min", multiplier: 1.0 },
  { id: "sedan", icon: "🚙", name: "Sedan", desc: "Comfortable rides", eta: "5 min", multiplier: 1.3 },
];

const Customer = () => {
  const navigate = useNavigate();
  const { t, lang, setLang } = useLanguage();
  
  const [pickup, setPickup] = useState("");
  const [drop, setDrop] = useState("");
  const [pickupCoords, setPickupCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [dropCoords, setDropCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState("bike");
  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);
  const [distance, setDistance] = useState<number | null>(null);
  const [estimatedFare, setEstimatedFare] = useState<number | null>(null);
  const [duration, setDuration] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState(false);
  const [locating, setLocating] = useState(false);

  const [pickupSuggestions, setPickupSuggestions] = useState<Prediction[]>([]);
  const [dropSuggestions, setDropSuggestions] = useState<Prediction[]>([]);
  const [showPickupSuggestions, setShowPickupSuggestions] = useState(false);
  const [showDropSuggestions, setShowDropSuggestions] = useState(false);
  const [nearestDriver, setNearestDriver] = useState<{ id: number; lat: number; lng: number; name?: string; distance?: number } | null>(null);

  const pickupRef = useRef<HTMLDivElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const pickupDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dropDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const canBook = pickup.trim() && drop.trim() && pickupCoords && dropCoords;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (pickupRef.current && !pickupRef.current.contains(e.target as Node)) {
        setShowPickupSuggestions(false);
      }
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setShowDropSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchSuggestions = async (query: string, type: "pickup" | "drop") => {
    try {
      const res = await fetch(`${API_BASE}/api/address/autocomplete/?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      const results: Prediction[] = (data.predictions || []).slice(0, 5);
      if (type === "pickup") {
        setPickupSuggestions(results);
        setShowPickupSuggestions(results.length > 0);
      } else {
        setDropSuggestions(results);
        setShowDropSuggestions(results.length > 0);
      }
    } catch {
      if (type === "pickup") {
        setPickupSuggestions([]);
        setShowPickupSuggestions(false);
      } else {
        setDropSuggestions([]);
        setShowDropSuggestions(false);
      }
    }
  };

  const handleInputChange = (value: string, type: "pickup" | "drop") => {
    if (type === "pickup") {
      setPickup(value);
      setPickupCoords(null);
      if (pickupDebounceRef.current) clearTimeout(pickupDebounceRef.current);
      if (value.length < 2) {
        setPickupSuggestions([]);
        setShowPickupSuggestions(false);
        return;
      }
      pickupDebounceRef.current = setTimeout(() => {
        fetchSuggestions(value, "pickup");
      }, 220);
    } else {
      setDrop(value);
      setDropCoords(null);
      if (dropDebounceRef.current) clearTimeout(dropDebounceRef.current);
      if (value.length < 2) {
        setDropSuggestions([]);
        setShowDropSuggestions(false);
        return;
      }
      dropDebounceRef.current = setTimeout(() => {
        fetchSuggestions(value, "drop");
      }, 220);
    }
  };

  const selectPrediction = (pred: Prediction, type: "pickup" | "drop") => {
    if (type === "pickup") {
      setPickup(pred.description);
      setPickupCoords({ lat: pred.lat, lng: pred.lng });
      setShowPickupSuggestions(false);
    } else {
      setDrop(pred.description);
      setDropCoords({ lat: pred.lat, lng: pred.lng });
      setShowDropSuggestions(false);
    }
  };

  const handleMyLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation not supported");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setPickupCoords({ lat: position.coords.latitude, lng: position.coords.longitude });
        setPickup("My Location");
        setLocating(false);
      },
      () => {
        alert("Unable to get location");
        setLocating(false);
      }
    );
  };

  const fetchNearestDriver = async (lat: number, lng: number) => {
    try {
      const res = await fetch(`${API_BASE}/api/drivers/nearby/?lat=${lat}&lng=${lng}&radius=10`);
      if (!res.ok) return;
      const data = await res.json();
      const driversList = data.drivers || [];
      if (driversList.length > 0) {
        setNearestDriver(driversList[0]);
      } else {
        setNearestDriver(null);
      }
    } catch {
      setNearestDriver(null);
    }
  };

  const calculateFare = async () => {
    if (!pickupCoords || !dropCoords) return;
    setLoading(true);
    try {
      const [fareRes] = await Promise.all([
        fetch(`${API_BASE}/api/distance/calculate/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pickup_lat: pickupCoords.lat,
            pickup_lng: pickupCoords.lng,
            drop_lat: dropCoords.lat,
            drop_lng: dropCoords.lng,
            vehicle_type: selectedVehicle,
          }),
        }),
        fetchNearestDriver(pickupCoords.lat, pickupCoords.lng),
      ]);
      const data = await fareRes.json();
      if (data.distance_km) {
        setDistance(data.distance_km);
        setEstimatedFare(data.estimated_fare);
        setDuration(data.duration_minutes || Math.round(data.distance_km * 3));
      }
    } catch (err) {
      console.error("Fare calculation error:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (pickupCoords && dropCoords) {
      calculateFare();
    } else {
      setDistance(null);
      setEstimatedFare(null);
    }
  }, [pickupCoords, dropCoords, selectedVehicle]);

  const handleBookRide = async () => {
    if (!canBook || !pickupCoords || !dropCoords) return;
    setBooking(true);
    try {
      const mobile = localStorage.getItem("ridego-passenger-mobile");
      const res = await fetch(`${API_BASE}/api/ride/request/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mobile,
          pickup,
          drop,
          vehicle_type: selectedVehicle,
          pickup_lat: pickupCoords.lat,
          pickup_lng: pickupCoords.lng,
          drop_lat: dropCoords.lat,
          drop_lng: dropCoords.lng,
          distance_km: distance || 0,
        }),
      });
      const data = await res.json();
      if (data.status === "success") {
        localStorage.setItem("ridego-ride-id", data.ride_id);
        localStorage.setItem("ridego-otp", data.otp);
        localStorage.setItem("ridego-fare", data.fare);
        localStorage.setItem("ridego-pickup", pickup);
        localStorage.setItem("ridego-drop", drop);
        localStorage.setItem("ridego-pickup-lat", String(pickupCoords.lat));
        localStorage.setItem("ridego-pickup-lng", String(pickupCoords.lng));
        localStorage.setItem("ridego-drop-lat", String(dropCoords.lat));
        localStorage.setItem("ridego-drop-lng", String(dropCoords.lng));
        navigate("/ride-success");
      }
    } catch (err) {
      console.error("Booking error:", err);
    }
    setBooking(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="ride-nav sticky top-0 z-10 backdrop-blur-sm bg-background/95">
        <button onClick={() => navigate("/")} className="text-xl font-extrabold tracking-tight text-foreground">
          Ride<span className="font-light">Go</span>
        </button>
        <div className="flex items-center gap-3">
          <button className="ride-btn-secondary text-xs py-2 px-3">
            <History className="w-3.5 h-3.5" />
            {t.history}
          </button>
          <div className="w-8 h-8 rounded-full bg-foreground text-background flex items-center justify-center text-xs font-bold">
            {(localStorage.getItem("ridego-passenger-name") || "P")[0].toUpperCase()}
          </div>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        <div className="rounded-2xl bg-secondary h-64 border border-border overflow-hidden relative">
          <MapContainer
            pickup={pickupCoords}
            drop={dropCoords}
            userLocation={pickupCoords}
            showDrivers={false}
            pickupName={pickup}
            dropName={drop}
            nearestDriver={nearestDriver}
          />
        </div>

        <div className="ride-card-elevated space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold">{t.bookRide}</h3>
            <button
              onClick={() => setShowSchedule(!showSchedule)}
              className={`text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all ${
                showSchedule ? "bg-foreground text-background" : "bg-secondary text-muted-foreground hover:bg-muted"
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              {t.scheduleRide}
            </button>
          </div>

          <div className="space-y-3">
            <div className="relative" ref={pickupRef}>
              <div className="absolute left-3 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-success" />
              <input
                type="text"
                value={pickup}
                onChange={(e) => handleInputChange(e.target.value, "pickup")}
                onFocus={() => pickupSuggestions.length > 0 && setShowPickupSuggestions(true)}
                placeholder={t.pickupLocation}
                className="ride-input pl-10 pr-20"
              />
              <button
                onClick={handleMyLocation}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 text-xs bg-secondary hover:bg-muted rounded flex items-center gap-1"
              >
                {locating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Locate className="w-3 h-3" />}
                <span>My Location</span>
              </button>
              {showPickupSuggestions && pickupSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-xl shadow-lg z-20 max-h-48 overflow-y-auto">
                  {pickupSuggestions.map((pred, i) => (
                    <div
                      key={i}
                      className="px-4 py-2.5 text-sm hover:bg-secondary cursor-pointer border-b border-border last:border-0 flex items-center gap-2"
                      onClick={() => selectPrediction(pred, "pickup")}
                    >
                      <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
                      <div className="min-w-0">
                        <p className="truncate font-medium">{pred.place_name || pred.description}</p>
                        <p className="truncate text-xs text-muted-foreground">{pred.secondary_text || pred.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="relative" ref={dropRef}>
              <div className="absolute left-3 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-destructive" />
              <input
                type="text"
                value={drop}
                onChange={(e) => handleInputChange(e.target.value, "drop")}
                onFocus={() => dropSuggestions.length > 0 && setShowDropSuggestions(true)}
                placeholder={t.dropLocation}
                className="ride-input pl-10"
              />
              {showDropSuggestions && dropSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-xl shadow-lg z-20 max-h-48 overflow-y-auto">
                  {dropSuggestions.map((pred, i) => (
                    <div
                      key={i}
                      className="px-4 py-2.5 text-sm hover:bg-secondary cursor-pointer border-b border-border last:border-0 flex items-center gap-2"
                      onClick={() => selectPrediction(pred, "drop")}
                    >
                      <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
                      <div className="min-w-0">
                        <p className="truncate font-medium">{pred.place_name || pred.description}</p>
                        <p className="truncate text-xs text-muted-foreground">{pred.secondary_text || pred.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {showSchedule && (
            <div className="grid grid-cols-2 gap-3 animate-in slide-in-from-top-2 duration-200">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">{t.date}</label>
                <input type="date" value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)} className="ride-input text-xs" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">{t.time}</label>
                <input type="time" value={scheduleTime} onChange={(e) => setScheduleTime(e.target.value)} className="ride-input text-xs" />
              </div>
            </div>
          )}

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">{t.chooseVehicle}</p>
            <div className="grid grid-cols-2 gap-2">
              {VEHICLE_TYPES.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setSelectedVehicle(v.id)}
                  className={`relative rounded-xl p-3 text-left transition-all duration-200 border ${
                    selectedVehicle === v.id
                      ? "border-foreground bg-foreground/[0.03] shadow-sm"
                      : "border-border hover:border-foreground/20"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl">{v.icon}</span>
                    <span className="text-sm font-semibold">{v.name}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">{v.desc}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm font-bold">
                      {estimatedFare ? `₹${Math.round(estimatedFare)}` : v.id === "bike" ? "₹70" : v.id === "auto" ? "₹90" : v.id === "mini" ? "₹100" : "₹150"}
                    </span>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                      <Clock className="w-3 h-3" /> {v.eta}
                    </span>
                  </div>
                  {selectedVehicle === v.id && (
                    <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-foreground" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Zap className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                type="text"
                value={promoCode}
                onChange={(e) => { setPromoCode(e.target.value); setPromoApplied(false); }}
                placeholder={t.enterPromo}
                className="ride-input pl-9 text-xs"
              />
            </div>
            <button
              onClick={() => promoCode.trim() && setPromoApplied(true)}
              className={`px-4 rounded-xl text-xs font-semibold transition-all ${
                promoApplied ? "bg-success/10 text-success" : "bg-secondary text-foreground hover:bg-muted"
              }`}
            >
              {promoApplied ? "✓" : t.applyPromo}
            </button>
          </div>

          <div className="flex gap-4 py-2 bg-secondary rounded-xl px-4">
            <div className="flex-1 text-center">
              <p className="text-[10px] text-muted-foreground">{t.distance}</p>
              <p className="text-lg font-bold flex items-center justify-center gap-1">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : distance ? `${distance.toFixed(1)} km` : "-- km"}
              </p>
            </div>
            <div className="w-px bg-border" />
            <div className="flex-1 text-center">
              <p className="text-[10px] text-muted-foreground">{t.estFare}</p>
              <p className="text-lg font-bold">
                {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : estimatedFare ? `₹${Math.round(estimatedFare)}` : "--"}
              </p>
            </div>
            <div className="w-px bg-border" />
            <div className="flex-1 text-center">
              <p className="text-[10px] text-muted-foreground">{t.eta}</p>
              <p className="text-lg font-bold">
                {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : duration ? `${duration} min` : "--"}
              </p>
            </div>
          </div>

          <button
            onClick={handleBookRide}
            disabled={!canBook || booking}
            className="ride-btn-primary w-full text-base py-4 disabled:opacity-50 disabled:cursor-not-allowed group flex items-center justify-center gap-2"
          >
            {booking ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Booking...
              </>
            ) : (
              <>
                {showSchedule ? t.scheduleRide : t.requestRide}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </div>

        <div className="flex items-center gap-3 bg-secondary rounded-2xl p-4">
          <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center shrink-0">
            <Shield className="w-5 h-5 text-success" />
          </div>
          <div>
            <p className="text-xs font-semibold">{t.safetyFirst}</p>
            <p className="text-[10px] text-muted-foreground">{t.safetyDesc}</p>
          </div>
        </div>

        <div className="ride-section-title">{t.quickActions}</div>
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: Clock, label: t.scheduleRide },
            { icon: Bookmark, label: t.savedPlaces },
            { icon: History, label: t.rideHistory },
            { icon: CreditCard, label: t.paymentMethods },
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

export default Customer;
