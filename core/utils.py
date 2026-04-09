from math import radians, cos, sin, sqrt, atan2
import random
import requests
import sys

OLA_CLIENT_ID = "f3064a22-eecf-41d0-a684-1705b6b58825"
OLA_CLIENT_SECRET = "bb824330038e435ea780c2bf208685b5"
OLA_API_KEY = "BROFZ4A8bKg1j9Y3RBSuoMH66AK9OhBkJlRZFrKb"

VRINDABAN_LAT = 27.5756
VRINDABAN_LNG = 77.7006
MATHURA_LAT = 27.4950
MATHURA_LNG = 77.6820
SEARCH_RADIUS_KM = 50
ROUTING_ENDPOINT_CANDIDATES = [
    "https://api.olamaps.io/routing/v1/directions",
    "https://api.olamaps.io/routing/v1/directions/basic",
]
ROUTING_API_REACHABLE = None
ROUTING_LAST_CHECK = 0
ROUTING_RETRY_INTERVAL = 300  # retry OLA routing every 5 minutes after failure

import time


def get_ola_access_token():
    token_url = "https://api.olamaps.io/auth/v1/token"
    payload = {
        "grant_type": "client_credentials",
        "scope": "openid",
        "client_id": OLA_CLIENT_ID,
        "client_secret": OLA_CLIENT_SECRET
    }
    try:
        resp = requests.post(token_url, data=payload, timeout=10)
        resp.raise_for_status()
        return resp.json().get("access_token")
    except Exception as e:
        print(f"[OLA ERROR] Token fetch failed: {e}")
        return None


def distance(lat1, lon1, lat2, lon2):
    R = 6371
    dlat = radians(lat2 - lat1)
    dlon = radians(lon2 - lon1)
    a = sin(dlat/2)**2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon/2)**2
    c = 2 * atan2(sqrt(a), sqrt(1 - a))
    return R * c


def generate_otp():
    return str(random.randint(100000, 999999))


def geocode_address(address):
    access_token = get_ola_access_token()
    if not access_token:
        lat, lng = geocode_with_api_key(address)
        return lat, lng

    url = "https://api.olamaps.io/places/v1/geocode"
    headers = {"Authorization": f"Bearer {access_token}"}
    params = {"address": address}

    try:
        resp = requests.get(url, headers=headers, params=params, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        
        if "geocoding" in data and data["geocoding"]:
            geom = data["geocoding"][0].get("geometry", {})
            location = geom.get("location", {})
            lat = location.get("lat")
            lng = location.get("lng")
            if lat and lng:
                return lat, lng
        return None, None
    except Exception as e:
        print(f"[OLA ERROR] Geocoding failed: {e}")
        lat, lng = geocode_with_api_key(address)
        return lat, lng


def geocode_with_api_key(address):
    url = "https://api.olamaps.io/places/v1/geocode"
    params = {"address": address, "api_key": OLA_API_KEY}

    try:
        resp = requests.get(url, params=params, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        
        if "geocoding" in data and data["geocoding"]:
            geom = data["geocoding"][0].get("geometry", {})
            location = geom.get("location", {})
            lat = location.get("lat")
            lng = location.get("lng")
            if lat and lng:
                return lat, lng
        return None, None
    except Exception as e:
        print(f"[OLA ERROR] Geocode API Key failed: {e}")
        return None, None


def reverse_geocode(lat, lng):
    access_token = get_ola_access_token()
    if not access_token:
        return reverse_geocode_with_api_key(lat, lng)

    url = "https://api.olamaps.io/places/v1/reverse-geocode"
    headers = {"Authorization": f"Bearer {access_token}"}
    params = {"latlng": f"{lat},{lng}"}

    try:
        resp = requests.get(url, headers=headers, params=params, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        
        if "results" in data and data["results"]:
            return data["results"][0].get("formatted_address")
        return None
    except Exception as e:
        print(f"[OLA ERROR] Reverse geocode failed: {e}")
        return reverse_geocode_with_api_key(lat, lng)


def reverse_geocode_with_api_key(lat, lng):
    url = "https://api.olamaps.io/places/v1/reverse-geocode"
    params = {"latlng": f"{lat},{lng}", "api_key": OLA_API_KEY}

    try:
        resp = requests.get(url, params=params, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        
        if "results" in data and data["results"]:
            return data["results"][0].get("formatted_address")
        return None
    except Exception as e:
        print(f"[OLA ERROR] Reverse geocode API Key failed: {e}")
        return None


def autocomplete_address(search_text):
    # Ola Places API only
    try:
        access_token = get_ola_access_token()
        if access_token:
            predictions = autocomplete_with_token(search_text, access_token)
            if predictions:
                return predictions
        return autocomplete_with_api_key(search_text)
    except:
        return []


def autocomplete_with_token(search_text, token):
    url = "https://api.olamaps.io/places/v1/autocomplete"
    headers = {"Authorization": f"Bearer {token}"}
    params = {
        "input": search_text,
        "location": f"{MATHURA_LAT},{MATHURA_LNG}",
        "radius": SEARCH_RADIUS_KM * 1000,
    }

    try:
        resp = requests.get(url, headers=headers, params=params, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        return parse_predictions(data)
    except Exception as e:
        print(f"[OLA ERROR] Autocomplete token failed: {e}")
        return []


def autocomplete_with_api_key(search_text):
    url = "https://api.olamaps.io/places/v1/autocomplete"
    params = {
        "input": search_text,
        "api_key": OLA_API_KEY,
        "location": f"{MATHURA_LAT},{MATHURA_LNG}",
        "radius": SEARCH_RADIUS_KM * 1000,
    }

    try:
        resp = requests.get(url, params=params, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        return parse_predictions(data)
    except Exception as e:
        print(f"[OLA ERROR] Autocomplete API key failed: {e}")
        return []


def get_local_fallback_results(search_text):
    common_places = [
        {"description": "Balaji Puram, Mathura", "lat": 27.4568, "lng": 77.6844},
        {"description": "Balaji Puram Colony, Mathura", "lat": 27.4568, "lng": 77.6844},
        {"description": "Balaji Puram Main Road, Mathura", "lat": 27.4557, "lng": 77.6861},
        {"description": "Vrindavan, Uttar Pradesh", "lat": 27.5780, "lng": 77.7000},
        {"description": "Mathura, Uttar Pradesh", "lat": 27.4950, "lng": 77.6820},
        {"description": "Banke Bihari Temple, Vrindavan", "lat": 27.5797, "lng": 77.6905},
        {"description": "Prem Mandir, Vrindavan", "lat": 27.5858, "lng": 77.6983},
        {"description": "ISKCON Vrindavan", "lat": 27.5847, "lng": 77.7097},
        {"description": "Radha Kund, Vrindavan", "lat": 27.5872, "lng": 77.7083},
        {"description": "Barsana, Uttar Pradesh", "lat": 27.6519, "lng": 77.7219},
        {"description": "Gokul, Uttar Pradesh", "lat": 27.5431, "lng": 77.7011},
        {"description": "Nandgaon, Uttar Pradesh", "lat": 27.4872, "lng": 77.6956},
        {"description": "Mathura Junction Railway Station", "lat": 27.5568, "lng": 77.6352},
        {"description": "Vrindavan Railway Station", "lat": 27.5917, "lng": 77.6944},
        {"description": "Krishna Janmabhoomi, Mathura", "lat": 27.4933, "lng": 77.6733},
        {"description": "Vishram Ghat, Mathura", "lat": 27.5058, "lng": 77.6819},
        {"description": "Dwarkadhish Temple, Mathura", "lat": 27.4744, "lng": 77.7011},
        {"description": "Govind Dev Ji Temple, Vrindavan", "lat": 27.5708, "lng": 77.6972},
        {"description": "Radha Raman Temple, Vrindavan", "lat": 27.5686, "lng": 77.6994},
        {"description": "Nidhivan, Vrindavan", "lat": 27.5711, "lng": 77.6967},
        {"description": "Kesi Ghat, Vrindavan", "lat": 27.5633, "lng": 77.6928},
        {"description": "Brahmagiri, Mathura", "lat": 27.5844, "lng": 77.6756},
        {"description": "Lotus Temple, Vrindavan", "lat": 27.5792, "lng": 77.7033},
        {"description": "Jai Singh Puram, Mathura", "lat": 27.5544, "lng": 77.6644},
        {"description": "Raman Reti, Vrindavan", "lat": 27.5828, "lng": 77.7058},
        {"description": "Laxmi Nagar, Mathura", "lat": 27.4980, "lng": 77.6750},
        {"description": "Sri Krishna Avenue, Mathura", "lat": 27.5589, "lng": 77.6789},
        {"description": "Civil Lines, Mathura", "lat": 27.5050, "lng": 77.6850},
        {"description": "Krishna Nagar, Mathura", "lat": 27.4900, "lng": 77.6800},
        {"description": "Refugee Colony, Mathura", "lat": 27.5511, "lng": 77.6789},
        {"description": "Sikandra, Mathura", "lat": 27.5489, "lng": 77.6556},
        {"description": "Maholi, Mathura", "lat": 27.5889, "lng": 77.6622},
        {"description": "Chhatikara, Mathura", "lat": 27.5611, "lng": 77.7156},
        {"description": "Mathura Refinery", "lat": 27.4264, "lng": 77.7122},
        {"description": "Chaubia Khera, Mathura", "lat": 27.4892, "lng": 77.6783},
        {"description": "Bad, Mathura", "lat": 27.5183, "lng": 77.6756},
        {"description": "Mant, Mathura", "lat": 27.6067, "lng": 77.6933},
        {"description": "Goverdhan, Mathura", "lat": 27.5044, "lng": 77.7633},
        {"description": "Radha Govind Nagar, Mathura", "lat": 27.5656, "lng": 77.6856},
        {"description": "Terasana, Mathura", "lat": 27.6156, "lng": 77.7056},
        {"description": "Raya, Mathura", "lat": 27.6333, "lng": 77.6856},
        {"description": "Ajijpur, Mathura", "lat": 27.5456, "lng": 77.7256},
        {"description": "Kund, Vrindavan", "lat": 27.5917, "lng": 77.7117},
        {"description": "Barodia, Mathura", "lat": 27.6256, "lng": 77.6556},
    ]
    
    search_lower = search_text.lower().strip()
    search_words = search_lower.split()
    results = []
    
    for place in common_places:
        desc_lower = place["description"].lower()
        
        match = False
        if search_lower in desc_lower:
            match = True
        elif all(word in desc_lower for word in search_words):
            match = True
        else:
            for word in search_words:
                if word in desc_lower:
                    match = True
                    break
        
        if match:
            dist = distance(MATHURA_LAT, MATHURA_LNG, place["lat"], place["lng"])
            if dist <= SEARCH_RADIUS_KM:
                starts_match = desc_lower.startswith(search_lower) or desc_lower.startswith(search_words[0] if search_words else "")
                results.append({
                    "description": place["description"],
                    "lat": place["lat"],
                    "lng": place["lng"],
                    "dist": round(dist, 1),
                    "match_score": 100 if starts_match else (60 if search_lower in desc_lower else 30)
                })
    
    results.sort(key=lambda x: (-x["match_score"], x["dist"]))
    return [{"description": p["description"], "lat": p["lat"], "lng": p["lng"]} for p in results[:5]]


def parse_predictions(data):
    predictions = []
    seen_coords = set()
    
    for p in data.get("predictions", []):
        description = p.get("description", "")
        place_id = p.get("place_id")
        
        if "geometry" in p and "location" in p["geometry"]:
            loc = p["geometry"]["location"]
            lat = loc.get("lat")
            lng = loc.get("lng")
            
            if lat and lng:
                dist = distance(MATHURA_LAT, MATHURA_LNG, lat, lng)
                
                if dist <= SEARCH_RADIUS_KM:
                    coord_key = (round(lat, 6), round(lng, 6))
                    if coord_key not in seen_coords:
                        seen_coords.add(coord_key)
                        desc = clean_address(description)
                        parts = [part.strip() for part in desc.split(",") if part.strip()]
                        predictions.append({
                            "description": desc,
                            "place_name": parts[0] if parts else desc,
                            "secondary_text": ", ".join(parts[1:]) if len(parts) > 1 else "",
                            "lat": lat,
                            "lng": lng,
                            "place_id": place_id,
                            "dist": round(dist, 1)
                        })
        
        if len(predictions) >= 5:
            break
    
    predictions.sort(key=lambda x: x.get("dist", 999))
    return [{
        "description": p["description"],
        "place_name": p.get("place_name", p["description"]),
        "secondary_text": p.get("secondary_text", ""),
        "lat": p["lat"],
        "lng": p["lng"],
        "place_id": p.get("place_id"),
    } for p in predictions]


def clean_address(address):
    """Remove redundant suffixes from address"""
    suffixes_to_remove = [
        ", India",
        ", Uttar Pradesh, India",
        ", India, India",
        ", 281001, India",
        ", 281121, India",
    ]
    result = address
    for suffix in suffixes_to_remove:
        result = result.replace(suffix, "")
    
    # Remove trailing comma and spaces
    result = result.rstrip(", ").rstrip(",").rstrip(" ")
    
    # If description is too long, truncate it nicely
    if len(result) > 60:
        parts = result.split(", ")
        if len(parts) > 2:
            result = ", ".join(parts[:2])
        elif len(parts) > 1:
            result = parts[0] + ", " + parts[-1]
    
    return result


def get_route(origin_lat, origin_lng, dest_lat, dest_lng):
    global ROUTING_API_REACHABLE, ROUTING_LAST_CHECK
    now = time.time()

    # If it previously failed, only retry after ROUTING_RETRY_INTERVAL seconds
    if ROUTING_API_REACHABLE is False and (now - ROUTING_LAST_CHECK) < ROUTING_RETRY_INTERVAL:
        return None

    access_token = get_ola_access_token()
    if access_token:
        route = get_route_with_token(origin_lat, origin_lng, dest_lat, dest_lng, access_token)
        if route:
            ROUTING_API_REACHABLE = True
            return route

    route = get_route_with_api_key_fallback(origin_lat, origin_lng, dest_lat, dest_lng)
    if route:
        ROUTING_API_REACHABLE = True
        return route

    ROUTING_API_REACHABLE = False
    ROUTING_LAST_CHECK = now
    print("[OLA WARN] Routing API unavailable; using haversine fallback with road factor.")
    return None


def get_route_with_token(origin_lat, origin_lng, dest_lat, dest_lng, token):
    headers = {"Authorization": f"Bearer {token}"}
    params = {
        "origin": f"{origin_lat},{origin_lng}",
        "destination": f"{dest_lat},{dest_lng}",
    }

    for url in ROUTING_ENDPOINT_CANDIDATES:
        try:
            resp = requests.get(url, headers=headers, params=params, timeout=10)
            resp.raise_for_status()
            data = resp.json()
            if "routes" in data and data["routes"]:
                route = data["routes"][0]
                distance_field = route.get("distance", 0)
                duration_field = route.get("duration", 0)
                dist_m = distance_field.get("value", 0) if isinstance(distance_field, dict) else distance_field
                duration_s = duration_field.get("value", 0) if isinstance(duration_field, dict) else duration_field
                return {
                    "distance_km": round((dist_m or 0) / 1000, 2),
                    "duration_minutes": round((duration_s or 0) / 60, 0),
                    "geometry": route.get("geometry"),
                }
        except Exception as e:
            if "404" in str(e):
                continue
            print(f"[OLA ERROR] Route token failed ({url}): {e}")

    return None


def get_route_with_api_key_fallback(origin_lat, origin_lng, dest_lat, dest_lng):
    params = {
        "origin": f"{origin_lat},{origin_lng}",
        "destination": f"{dest_lat},{dest_lng}",
        "api_key": OLA_API_KEY,
    }

    for url in ROUTING_ENDPOINT_CANDIDATES:
        try:
            resp = requests.get(url, params=params, timeout=10)
            resp.raise_for_status()
            data = resp.json()
            if "routes" in data and data["routes"]:
                route = data["routes"][0]
                distance_field = route.get("distance", 0)
                duration_field = route.get("duration", 0)
                dist_m = distance_field.get("value", 0) if isinstance(distance_field, dict) else distance_field
                duration_s = duration_field.get("value", 0) if isinstance(duration_field, dict) else duration_field
                return {
                    "distance_km": round((dist_m or 0) / 1000, 2),
                    "duration_minutes": round((duration_s or 0) / 60, 0),
                    "geometry": route.get("geometry"),
                }
        except Exception as e:
            if "404" in str(e):
                continue
            print(f"[OLA ERROR] Route API key failed ({url}): {e}")

    return None


def get_distance_matrix(origins, destinations):
    access_token = get_ola_access_token()
    if not access_token:
        return None

    url = "https://api.olamaps.io/routing/v1/directions"
    headers = {"Authorization": f"Bearer {access_token}"}
    
    if isinstance(origins, list):
        origins = ";".join([f"{lat},{lng}" for lat, lng in origins])
    if isinstance(destinations, list):
        destinations = ";".join([f"{lat},{lng}" for lat, lng in destinations])
    
    params = {
        "origin": origins,
        "destination": destinations
    }

    try:
        resp = requests.get(url, headers=headers, params=params, timeout=10)
        resp.raise_for_status()
        return resp.json()
    except Exception as e:
        print(f"[OLA ERROR] Distance matrix failed: {e}")
        return None


def calculate_fare(distance_km, vehicle_type="bike"):
    base_fare = {
        "bike": 15,
        "porter": 25,
        # legacy support
        "mini": 20,
        "sedan": 30,
        "suv": 40,
        "auto": 15,
    }
    per_km_rate = {
        "bike": 8,
        "porter": 14,
        # legacy support
        "mini": 10,
        "sedan": 14,
        "suv": 18,
        "auto": 8,
    }

    vtype = vehicle_type.lower() if vehicle_type else "bike"
    base = base_fare.get(vtype, 15)
    rate = per_km_rate.get(vtype, 8)

    return round(base + (distance_km * rate), 2)


SMS_PROVIDER = "terminal"  # Options: "terminal", "msg91", "twilio", "fast2sms"

def send_sms_otp(mobile, otp):
    print(f"\n{'='*50}")
    print(f"OTP FOR MOBILE: +91 {mobile}")
    print(f"OTP: {otp}")
    print(f"{'='*50}\n")
    sys.stdout.flush()
    
    if SMS_PROVIDER != "terminal":
        _send_real_sms(mobile, otp)


def _send_real_sms(mobile, otp):
    """
    REAL SMS INTEGRATION PLACEHOLDER
    Uncomment and configure one of the providers below when ready for production
    """
    pass
    # === MSG91 Configuration ===
    # if SMS_PROVIDER == "msg91":
    #     url = "https://api.msg91.com/api/v5/otp"
    #     payload = {
    #         "template_id": "YOUR_TEMPLATE_ID",
    #         "mobile": f"91{mobile}",
    #         "otp": otp
    #     }
    #     headers = {
    #         "authkey": "YOUR_MSG91_AUTH_KEY",
    #         "Content-Type": "application/json"
    #     }
    
    # === Twilio Configuration ===
    # if SMS_PROVIDER == "twilio":
    #     from twilio.rest import Client
    #     client = Client("YOUR_ACCOUNT_SID", "YOUR_AUTH_TOKEN")
    #     client.messages.create(
    #         body=f"Your RideGo OTP is: {otp}",
    #         from_="+1XXXXXXXXXX",
    #         to=f"+91{mobile}"
    #     )
    
    # === Fast2SMS Configuration ===
    # if SMS_PROVIDER == "fast2sms":
    #     url = "https://www.fast2sms.com/dev/bulkV2"
    #     payload = {
    #         "route": "otp",
    #         "variables": f"{otp}",
    #         "numbers": mobile,
    #         "flash": 0
    #     }
    #     headers = {
    #         "authorization": "YOUR_FAST2SMS_API_KEY",
    #         "Content-Type": "application/json"
    #     }


def notify_driver_docs(driver):
    pass
