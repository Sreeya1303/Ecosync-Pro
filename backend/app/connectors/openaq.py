import requests
import time
from datetime import datetime
from .base import BaseConnector

class OpenAQConnector(BaseConnector):
    def fetch_data(self):
        # We need a location_id or logic to search by city.
        # For simplicity, config should provide 'location_id' (e.g., from OpenAQ browser)
        # OR lat/lon to Find Nearest
        
        lat = self.config.get("lat")
        lon = self.config.get("lon")
        
        try:
            # v2 API: Get latest measurement for nearest location
            url = f"https://api.openaq.org/v2/latest?coordinates={lat},{lon}&radius=10000&limit=1"
            response = requests.get(url, timeout=10)
            data = response.json()
            
            results = data.get("results", [])
            if not results:
                return {"status": "offline", "ts": int(time.time()), "metrics": {}}
                
            reading = results[0]
            measurements = reading.get("measurements", [])
            
            metrics = {
                "pm25": 0.0,
                "pm10": 0.0,
                "no2": 0.0
            }
            
            # Extract fields
            last_updated = None
            for m in measurements:
                val = m.get("value")
                param = m.get("parameter")
                if param == "pm25": metrics["pm25"] = val
                elif param == "pm10": metrics["pm10"] = val
                elif param == "no2": metrics["no2"] = val
                
                # Capture latest timestamp
                m_date = m.get("lastUpdated")
                if m_date:
                    last_updated = m_date

            source_ts = int(time.time())
            if last_updated:
                # OpenAQ Format: 2023-11-10T02:00:00+00:00
                source_ts = int(datetime.fromisoformat(last_updated.replace("Z", "+00:00")).timestamp())

            return {
                "ts": int(time.time()),
                "source_ts": source_ts,
                "metrics": metrics,
                "status": "online"
            }
        except Exception as e:
            print(f"OpenAQ Fetch Error: {e}")
            return {"status": "offline", "ts": int(time.time()), "metrics": {}}

    def get_history(self, range_str: str):
         # History is harder with OpenAQ v2 free/no-key without extensive queries.
         # For demo, we might return just connection check or stub.
         # Implementing a minimal valid stub to prevent crash
         return []
