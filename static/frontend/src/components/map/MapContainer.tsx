import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    OlaMaps: any;
  }
}

const OLA_API_KEY = import.meta.env.VITE_OLA_MAPS_API_KEY || "BROFZ4A8bKg1j9Y3RBSuoMH66AK9OhBkJlRZFrKb";

interface Driver {
  id: number;
  lat: number;
  lng: number;
  name?: string;
}

interface MapContainerProps {
  pickup?: { lat: number; lng: number } | null;
  drop?: { lat: number; lng: number } | null;
  userLocation?: { lat: number; lng: number } | null;
  showDrivers?: boolean;
  pickupName?: string;
  dropName?: string;
  onUserLocationChange?: (location: { lat: number; lng: number }) => void;
}

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

const MapContainer: React.FC<MapContainerProps> = ({
  pickup,
  drop,
  userLocation,
  showDrivers = false,
  pickupName,
  dropName,
  onUserLocationChange,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<Map<string, any>>(new Map());
  const driversRef = useRef<Map<number, any>>(new Map());
  const routeLayerRef = useRef<boolean>(false);
  const [olaMapsInstance, setOlaMapsInstance] = useState<any>(null);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);

  // Initialize map
  useEffect(() => {
    let cancelled = false;

    const initMap = async () => {
      if (!mapContainerRef.current) return;

      try {
        const OlaMapsClass = (window as any).OlaMaps;
        if (!OlaMapsClass) {
          console.error("OlaMaps SDK not loaded from CDN");
          setLocationError("Map SDK not loaded. Please refresh.");
          return;
        }

        const olaMaps = new OlaMapsClass({
          apiKey: OLA_API_KEY,
        });

        const defaultCenter = userLocation || { lat: 27.5692, lng: 77.6843 };

        const map = await olaMaps.init({
          style: "https://api.olamaps.io/tiles/vector/v1/styles/default-light-standard/style.json",
          container: mapContainerRef.current,
          center: [defaultCenter.lng, defaultCenter.lat],
          zoom: 14,
        });

        if (cancelled) return;

        // Wait for the map style to fully load before doing anything
        map.on("load", () => {
          if (cancelled) return;
          console.log("Ola Map loaded successfully");
          setMapReady(true);
        });

        mapRef.current = map;
        setOlaMapsInstance(olaMaps);
      } catch (error) {
        console.error("Failed to initialize Ola Maps:", error);
        setLocationError("Failed to load map. Please refresh.");
      }
    };

    initMap();

    return () => {
      cancelled = true;
    };
  }, []);

  // Fly to user location
  useEffect(() => {
    if (!mapReady || !mapRef.current || !userLocation) return;
    mapRef.current.flyTo({
      center: [userLocation.lng, userLocation.lat],
      zoom: 14,
    });
  }, [userLocation, mapReady]);

  // User marker
  useEffect(() => {
    if (!olaMapsInstance || !mapReady || !mapRef.current || !userLocation) return;

    const existing = markersRef.current.get("user");
    if (existing) {
      existing.setLngLat([userLocation.lng, userLocation.lat]);
    } else {
      const marker = olaMapsInstance
        .addMarker({ color: "#3b82f6", draggable: false })
        .setLngLat([userLocation.lng, userLocation.lat])
        .addTo(mapRef.current);
      markersRef.current.set("user", marker);
    }
  }, [userLocation, olaMapsInstance, mapReady]);

  // Pickup marker
  useEffect(() => {
    if (!olaMapsInstance || !mapReady || !mapRef.current) return;

    const existing = markersRef.current.get("pickup");
    if (!pickup) {
      if (existing) { existing.remove(); markersRef.current.delete("pickup"); }
      return;
    }
    if (existing) {
      existing.setLngLat([pickup.lng, pickup.lat]);
    } else {
      const marker = olaMapsInstance
        .addMarker({ color: "#22c55e", draggable: false })
        .setLngLat([pickup.lng, pickup.lat])
        .addTo(mapRef.current);
      markersRef.current.set("pickup", marker);
    }

    mapRef.current.flyTo({ center: [pickup.lng, pickup.lat], zoom: 15 });
  }, [pickup, olaMapsInstance, mapReady]);

  // Drop marker
  useEffect(() => {
    if (!olaMapsInstance || !mapReady || !mapRef.current) return;

    const existing = markersRef.current.get("drop");
    if (!drop) {
      if (existing) { existing.remove(); markersRef.current.delete("drop"); }
      return;
    }
    if (existing) {
      existing.setLngLat([drop.lng, drop.lat]);
    } else {
      const marker = olaMapsInstance
        .addMarker({ color: "#ef4444", draggable: false })
        .setLngLat([drop.lng, drop.lat])
        .addTo(mapRef.current);
      markersRef.current.set("drop", marker);
    }
  }, [drop, olaMapsInstance, mapReady]);

  // Route drawing
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;

    if (pickup && drop) {
      fetchAndDrawRoute(pickup, drop);
    } else {
      clearRoute();
    }
  }, [pickup, drop, mapReady]);

  const fetchAndDrawRoute = async (
    pickupCoord: { lat: number; lng: number },
    dropCoord: { lat: number; lng: number }
  ) => {
    try {
      const url = `https://api.olamaps.io/routing/v1/directions?origin=${pickupCoord.lat},${pickupCoord.lng}&destination=${dropCoord.lat},${dropCoord.lng}&api_key=${OLA_API_KEY}`;
      
      const response = await fetch(url, {
        method: "POST",
        headers: { "X-Request-Id": crypto.randomUUID() },
      });

      if (!response.ok) {
        console.error("Directions API error:", response.status);
        return;
      }

      const data = await response.json();

      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const geometry = route.overview_polyline || route.legs?.[0]?.polyline;
        
        if (geometry) {
          const coords = decodePolyline(geometry);
          drawRoute(coords);
          fitBoundsToRoute(coords);
        }
      }
    } catch (error) {
      console.error("Failed to fetch route:", error);
    }
  };

  // Google-style polyline decoder
  const decodePolyline = (encoded: string): [number, number][] => {
    const points: [number, number][] = [];
    let index = 0;
    let lat = 0;
    let lng = 0;

    while (index < encoded.length) {
      let b: number;
      let shift = 0;
      let result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlat = (result & 1) ? ~(result >> 1) : (result >> 1);
      lat += dlat;

      shift = 0;
      result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlng = (result & 1) ? ~(result >> 1) : (result >> 1);
      lng += dlng;

      points.push([lng / 1e5, lat / 1e5]); // [lng, lat] for maplibre/mapbox
    }

    return points;
  };

  const drawRoute = (coordinates: [number, number][]) => {
    if (!mapRef.current || coordinates.length === 0) return;

    clearRoute();

    try {
      mapRef.current.addSource("route", {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates,
          },
        },
      });

      mapRef.current.addLayer({
        id: "route-outline",
        type: "line",
        source: "route",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: { "line-color": "#1e40af", "line-width": 7, "line-opacity": 0.4 },
      });

      mapRef.current.addLayer({
        id: "route",
        type: "line",
        source: "route",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: { "line-color": "#2563eb", "line-width": 4, "line-opacity": 0.9 },
      });

      routeLayerRef.current = true;
    } catch (e) {
      console.error("Failed to draw route:", e);
    }
  };

  const fitBoundsToRoute = (coordinates: [number, number][]) => {
    if (!mapRef.current || coordinates.length === 0) return;

    let minLng = Infinity, maxLng = -Infinity, minLat = Infinity, maxLat = -Infinity;
    for (const [lng, lat] of coordinates) {
      if (lng < minLng) minLng = lng;
      if (lng > maxLng) maxLng = lng;
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
    }

    mapRef.current.fitBounds(
      [[minLng, minLat], [maxLng, maxLat]],
      { padding: 60, duration: 800 }
    );
  };

  const clearRoute = () => {
    if (!mapRef.current) return;
    try {
      if (mapRef.current.getLayer("route")) mapRef.current.removeLayer("route");
      if (mapRef.current.getLayer("route-outline")) mapRef.current.removeLayer("route-outline");
      if (mapRef.current.getSource("route")) mapRef.current.removeSource("route");
    } catch (e) {
      // ignore
    }
    routeLayerRef.current = false;
  };

  // Driver markers
  useEffect(() => {
    if (!showDrivers || !mapReady || !mapRef.current) return;

    const fetchDrivers = async () => {
      const center = userLocation || pickup || { lat: 27.5692, lng: 77.6843 };
      try {
        const response = await fetch(
          `${API_BASE}/api/drivers/nearby?lat=${center.lat}&lng=${center.lng}&radius=5`
        );
        if (response.ok) {
          const data = await response.json();
          setDrivers(data.drivers || []);
        }
      } catch (error) {
        console.error("Failed to fetch drivers:", error);
      }
    };

    fetchDrivers();
    const interval = setInterval(fetchDrivers, 5000);
    return () => clearInterval(interval);
  }, [showDrivers, userLocation, pickup, mapReady]);

  useEffect(() => {
    if (!olaMapsInstance || !mapReady || !mapRef.current) return;

    drivers.forEach((driver) => {
      const existing = driversRef.current.get(driver.id);
      if (existing) {
        existing.setLngLat([driver.lng, driver.lat]);
      } else {
        const marker = olaMapsInstance
          .addMarker({ color: "#f59e0b", draggable: false })
          .setLngLat([driver.lng, driver.lat])
          .addTo(mapRef.current);
        driversRef.current.set(driver.id, marker);
      }
    });

    const driverIds = new Set(drivers.map((d) => d.id));
    driversRef.current.forEach((marker, id) => {
      if (!driverIds.has(id)) {
        marker.remove();
        driversRef.current.delete(id);
      }
    });
  }, [drivers, olaMapsInstance, mapReady]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainerRef} style={{ width: "100%", height: "500px" }} />

      {locationError && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-background/95 backdrop-blur-sm rounded-lg px-4 py-2 shadow-lg z-10">
          <p className="text-sm text-destructive">{locationError}</p>
        </div>
      )}
    </div>
  );
};

export default MapContainer;
