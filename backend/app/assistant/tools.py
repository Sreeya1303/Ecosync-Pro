import requests
import json
from datetime import datetime

# --- Tool Implementations ---

def geocode_city(city_name: str):
    """
    Finds the latitude and longitude for a given city name.
    """
    try:
        url = f"https://geocoding-api.open-meteo.com/v1/search?name={city_name}&count=1&language=en&format=json"
        res = requests.get(url).json()
        if "results" in res and res["results"]:
            data = res["results"][0]
            return {
                "name": data["name"],
                "lat": data["latitude"],
                "lon": data["longitude"],
                "country": data.get("country")
            }
        return {"error": "City not found"}
    except Exception as e:
        return {"error": str(e)}

def get_weather(lat: float, lon: float):
    """
    Fetches official current weather and hourly forecast summary.
    """
    try:
        url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&hourly=temperature_2m&timezone=auto&forecast_days=1"
        res = requests.get(url).json()
        
        current = res.get("current", {})
        hourly_temps = res.get("hourly", {}).get("temperature_2m", [])
        avg_temp = sum(hourly_temps) / len(hourly_temps) if hourly_temps else 0
        
        return {
            "current": {
                "temperature": current.get("temperature_2m"),
                "humidity": current.get("relative_humidity_2m"),
                "wind_speed": current.get("wind_speed_10m"),
                "desc": "Sunny" if current.get("weather_code", 0) < 3 else "Cloudy/Rainy" # Simplified
            },
            "day_summary": {
                "avg_temp_24h": round(avg_temp, 1)
            },
            "source": "Open-Meteo"
        }
    except Exception as e:
        return {"error": str(e)}

def get_thingspeak_latest(channel_id: str):
    """
    Fetches the latest feed from a public ThingSpeak channel.
    """
    try:
        url = f"https://api.thingspeak.com/channels/{channel_id}/feeds/last.json"
        res = requests.get(url).json()
        return {
            "channel_id": channel_id,
            "data": res,
            "source": "ThingSpeak"
        }
    except Exception as e:
        return {"error": str(e)}

# --- Tool Definitions (Gemini Native) ---

# Gemini SDK takes the functions directly
GEMINI_TOOLS = [geocode_city, get_weather, get_thingspeak_latest]

# Map names to functions for execution (still needed for local lookup if manual, 
# but Gemini SDK handles execution automatically in many cases, though we might interpret the response manually)
AVAILABLE_TOOLS = {
    "geocode_city": geocode_city,
    "get_weather": get_weather,
    "get_thingspeak_latest": get_thingspeak_latest
}
