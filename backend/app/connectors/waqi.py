import requests
import time
from .base import BaseConnector

class WAQIConnector(BaseConnector):
    def fetch_data(self):
        # Requires Token, or can use "demo" token for specific stations like Shanghai
        token = self.config.get("token") or "demo" 
        lat = self.config.get("lat")
        lon = self.config.get("lon")
        
        try:
            # Geolocation Feed
            url = f"https://api.waqi.info/feed/geo:{lat};{lon}/?token={token}"
            response = requests.get(url, timeout=10)
            data = response.json()
            
            if data.get("status") != "ok":
                 return {"status": "offline", "ts": int(time.time()), "metrics": {}}
            
            iaqi = data.get("data", {}).get("iaqi", {})
            time_info = data.get("data", {}).get("time", {})
            
            metrics = {
                "pm25": float(iaqi.get("pm25", {}).get("v", 0)),
                "pm10": float(iaqi.get("pm10", {}).get("v", 0)),
                "humidityPct": float(iaqi.get("h", {}).get("v", 0)),
                "temperatureC": float(iaqi.get("t", {}).get("v", 0)),
                "pressureHPa": float(iaqi.get("p", {}).get("v", 0)),
            }
            
            source_ts = int(time.time())
            if "v" in time_info:
                source_ts = int(time_info["v"])

            return {
                "ts": int(time.time()),
                "source_ts": source_ts,
                "metrics": metrics,
                "status": "online"
            }
        except Exception as e:
            print(f"WAQI Fetch Error: {e}")
            return {"status": "offline", "ts": int(time.time()), "metrics": {}}

    def get_history(self, range_str: str):
        # WAQI free API doesn't provide granular history easily.
        return []
