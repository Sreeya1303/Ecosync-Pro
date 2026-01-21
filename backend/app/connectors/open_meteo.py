import requests
import time
from .base import BaseConnector
from datetime import datetime, timedelta

class OpenMeteoConnector(BaseConnector):
    def fetch_data(self):
        lat = self.config.get("lat")
        lon = self.config.get("lon")
        
        try:
            url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=temperature_2m,relative_humidity_2m,surface_pressure,wind_speed_10m&timezone=auto"
            response = requests.get(url)
            data = response.json()
            
            current = data.get("current", {})
            
            return {
                "ts": int(time.time()),
                "metrics": {
                    "temperatureC": current.get("temperature_2m"),
                    "humidityPct": current.get("relative_humidity_2m"),
                    "pressureHPa": current.get("surface_pressure"),
                    "windMS": current.get("wind_speed_10m")
                },
                "status": "online"
            }
        except Exception as e:
            print(f"Open-Meteo Fetch Error: {e}")
            return {"status": "offline", "ts": int(time.time()), "metrics": {}}

    def get_history(self, range_str: str):
        # Determine days based on range (Open-Meteo limits free history, using forecast/recent history)
        days = 1
        if range_str == "24h": days = 1
        elif range_str == "7d": days = 7
        
        lat = self.config.get("lat")
        lon = self.config.get("lon")
        
        try:
            url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&hourly=temperature_2m,relative_humidity_2m,surface_pressure&past_days={days}&forecast_days=1"
            response = requests.get(url)
            data = response.json()
            
            hourly = data.get("hourly", {})
            times = hourly.get("time", [])
            temps = hourly.get("temperature_2m", [])
            hums = hourly.get("relative_humidity_2m", [])
            press = hourly.get("surface_pressure", [])
            
            points = []
            now = datetime.utcnow()
            
            # Filter based on range
            time_threshold = now - timedelta(hours=24)
            if range_str == "1h": time_threshold = now - timedelta(hours=1)
            elif range_str == "6h": time_threshold = now - timedelta(hours=6)
            
            for i in range(len(times)):
                # Open-Meteo returns ISO strings
                ts_str = times[i]
                dt = datetime.fromisoformat(ts_str)
                
                if dt > time_threshold:
                    points.append({
                        "ts": int(dt.timestamp()),
                        "temperatureC": temps[i],
                        "humidityPct": hums[i],
                        "pressureHPa": press[i]
                    })
            
            return points
        except Exception as e:
             print(f"Open-Meteo History Error: {e}")
             return []
