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
  distance?: number;
}

interface MapContainerProps {
  pickup?: { lat: number; lng: number } | null;
  drop?: { lat: number; lng: number } | null;
  userLocation?: { lat: number; lng: number } | null;
  showDrivers?: boolean;
  pickupName?: string;
  dropName?: string;
  onUserLocationChange?: (location: { lat: number; lng: number }) => void;
  nearestDriver?: Driver | null;
}

const API_BASE = import.meta.env.VITE_API_URL || "";

const MapContainer: React.FC<MapContainerProps> = ({
  pickup,
  drop,
  userLocation,
  showDrivers = false,
  pickupName,
  dropName,
  onUserLocationChange,
  nearestDriver,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<Map<string, any>>(new Map());
  const driversRef = useRef<Map<number, any>>(new Map());
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

  // Pickup marker — RED (left side of map)
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
        .addMarker({ color: "#ef4444", draggable: false })
        .setLngLat([pickup.lng, pickup.lat])
        .addTo(mapRef.current);
      markersRef.current.set("pickup", marker);
    }
  }, [pickup, olaMapsInstance, mapReady]);

  // Drop marker — BLUE (right side of map)
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
        .addMarker({ color: "#3b82f6", draggable: false })
        .setLngLat([drop.lng, drop.lat])
        .addTo(mapRef.current);
      markersRef.current.set("drop", marker);
    }
  }, [drop, olaMapsInstance, mapReady]);

  // Nearest driver marker — AMBER
  useEffect(() => {
    if (!olaMapsInstance || !mapReady || !mapRef.current) return;

    const existing = markersRef.current.get("nearest-driver");
    if (!nearestDriver) {
      if (existing) { existing.remove(); markersRef.current.delete("nearest-driver"); }
      return;
    }
    if (existing) {
      existing.setLngLat([nearestDriver.lng, nearestDriver.lat]);
    } else {
      const marker = olaMapsInstance
        .addMarker({ color: "#f59e0b", draggable: false })
        .setLngLat([nearestDriver.lng, nearestDriver.lat])
        .addTo(mapRef.current);
      markersRef.current.set("nearest-driver", marker);
    }
  }, [nearestDriver, olaMapsInstance, mapReady]);

  // Pickup → Drop route (blue)
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;

    if (pickup && drop) {
      fetchAndDrawRoute(pickup, drop, "route", "#2563eb", "#1e40af");
      fitBoundsToPoints(pickup, drop);
    } else {
      clearRouteLayer("route");
    }
  }, [pickup, drop, mapReady]);

  // Nearest driver → Pickup route (amber, dashed feel via opacity)
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;

    if (nearestDriver && pickup) {
      fetchAndDrawRoute(
        { lat: nearestDriver.lat, lng: nearestDriver.lng },
        pickup,
        "driver-route",
        "#f59e0b",
        "#d97706"
      );
    } else {
      clearRouteLayer("driver-route");
    }
  }, [nearestDriver, pickup, mapReady]);

  const fetchAndDrawRoute = async (
    from: { lat: number; lng: number },
    to: { lat: number; lng: number },
    layerId: string,
    lineColor: string,
    outlineColor: string
  ) => {
    try {
      const url = `https://api.olamaps.io/routing/v1/directions?origin=${from.lat},${from.lng}&destination=${to.lat},${to.lng}&api_key=${OLA_API_KEY}`;

      const response = await fetch(url, {
        method: "POST",
        headers: { "X-Request-Id": crypto.randomUUID() },
      });

      if (!response.ok) return;

      const data = await response.json();

      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const geometry = route.overview_polyline || route.legs?.[0]?.polyline;

        if (geometry) {
          const coords = decodePolyline(geometry);
          drawRouteLayer(coords, layerId, lineColor, outlineColor);
        }
      }
    } catch (error) {
      console.error(`Failed to fetch route (${layerId}):`, error);
    }
  };

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

      points.push([lng / 1e5, lat / 1e5]);
    }

    return points;
  };

  const drawRouteLayer = (
    coordinates: [number, number][],
    layerId: string,
    lineColor: string,
    outlineColor: string
  ) => {
    if (!mapRef.current || coordinates.length === 0) return;

    clearRouteLayer(layerId);

    try {
      mapRef.current.addSource(layerId, {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: { type: "LineString", coordinates },
        },
      });

      mapRef.current.addLayer({
        id: `${layerId}-outline`,
        type: "line",
        source: layerId,
        layout: { "line-join": "round", "line-cap": "round" },
        paint: { "line-color": outlineColor, "line-width": 7, "line-opacity": 0.4 },
      });

      mapRef.current.addLayer({
        id: layerId,
        type: "line",
        source: layerId,
        layout: { "line-join": "round", "line-cap": "round" },
        paint: { "line-color": lineColor, "line-width": 4, "line-opacity": 0.9 },
      });
    } catch (e) {
      console.error(`Failed to draw route layer (${layerId}):`, e);
    }
  };

  // Fit map so pickup (west/left) and drop (east/right) are both visible
  const fitBoundsToPoints = (
    pickupCoord: { lat: number; lng: number },
    dropCoord: { lat: number; lng: number }
  ) => {
    if (!mapRef.current) return;

    const minLng = Math.min(pickupCoord.lng, dropCoord.lng);
    const maxLng = Math.max(pickupCoord.lng, dropCoord.lng);
    const minLat = Math.min(pickupCoord.lat, dropCoord.lat);
    const maxLat = Math.max(pickupCoord.lat, dropCoord.lat);

    mapRef.current.fitBounds(
      [[minLng, minLat], [maxLng, maxLat]],
      { padding: 60, duration: 800 }
    );
  };

  const clearRouteLayer = (layerId: string) => {
    if (!mapRef.current) return;
    try {
      if (mapRef.current.getLayer(layerId)) mapRef.current.removeLayer(layerId);
      if (mapRef.current.getLayer(`${layerId}-outline`)) mapRef.current.removeLayer(`${layerId}-outline`);
      if (mapRef.current.getSource(layerId)) mapRef.current.removeSource(layerId);
    } catch (e) {
      // ignore
    }
  };

  // Driver markers (when showDrivers=true, poll API)
  useEffect(() => {
    if (!showDrivers || !mapReady || !mapRef.current) return;

    const fetchDrivers = async () => {
      const center = userLocation || pickup || { lat: 27.5692, lng: 77.6843 };
      try {
        const response = await fetch(
          `${API_BASE}/api/drivers/nearby/?lat=${center.lat}&lng=${center.lng}&radius=5`
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
