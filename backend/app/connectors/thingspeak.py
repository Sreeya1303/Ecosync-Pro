import requests
import time
from datetime import datetime
from .base import BaseConnector

class ThingSpeakConnector(BaseConnector):
    def fetch_data(self):
        channel_id = self.config.get("channel_id")
        # Optional field mapping: default field1=Temp, field2=Hum, etc.
        
        try:
            url = f"https://api.thingspeak.com/channels/{channel_id}/feeds/last.json"
            response = requests.get(url, timeout=10)
            data = response.json()
            
            # ThingSpeak returns timestamp in ISO 8601
            created_at = data.get("created_at")
            source_ts = int(datetime.fromisoformat(created_at.replace("Z", "+00:00")).timestamp()) if created_at else int(time.time())
            
            # Map Fields (Assumed standard mapping for demo, extendable via config)
            metrics = {
                "temperatureC": float(data.get("field1", 0) or 0),
                "humidityPct": float(data.get("field2", 0) or 0),
                "pressureHPa": float(data.get("field3", 0) or 0),
                "windMS": float(data.get("field4", 0) or 0),
                "pm25": float(data.get("field5", 0) or 0)
            }
            
            return {
                "ts": int(time.time()),
                "source_ts": source_ts,
                "metrics": metrics,
                "status": "online"
            }
        except Exception as e:
            print(f"ThingSpeak Fetch Error: {e}")
            return {"status": "offline", "ts": int(time.time()), "metrics": {}}

    def get_history(self, range_str: str):
        channel_id = self.config.get("channel_id")
        # Results count approx: 24h * 60m / 15m interval? 100 points is decent
        results = 100
        
        try:
            url = f"https://api.thingspeak.com/channels/{channel_id}/feeds.json?results={results}"
            response = requests.get(url)
            data = response.json()
            feeds = data.get("feeds", [])
            
            points = []
            for f in feeds:
                dt = datetime.fromisoformat(f["created_at"].replace("Z", "+00:00"))
                points.append({
                    "ts": int(dt.timestamp()),
                    "temperatureC": float(f.get("field1") or 0),
                    "humidityPct": float(f.get("field2") or 0),
                    "pressureHPa": float(f.get("field3") or 0)
                })
            return points
        except Exception as e:
             return []
