from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from datetime import datetime
from ..connectors.open_meteo import OpenMeteoConnector
from ..connectors.waqi import WAQIConnector
from ..connectors.openaq import OpenAQConnector

router = APIRouter(prefix="/api/map", tags=["map"])

@router.get("/point")
def get_map_point_data(lat: float, lon: float):
    """
    Aggregates live data from multiple public APIs for a specific Lat/Lon.
    """
    fetched_at = datetime.utcnow().isoformat()
    
    # 1. Weather (Open-Meteo)
    # Ad-hoc instantiation: Device ID is dummy, config has lat/lon
    weather_connector = OpenMeteoConnector(
        device_id="temp_map_point", 
        config={"lat": lat, "lon": lon}
    )
    weather_data = weather_connector.fetch_data()
    
    # 2. AQI (WAQI)
    waqi_connector = WAQIConnector(
        device_id="temp_map_point",
        config={"lat": lat, "lon": lon, "token": "demo"} # Using demo token as per strict rules, or env if avail
    )
    aqi_data = waqi_connector.fetch_data()

    # 3. Pollutants (OpenAQ)
    openaq_connector = OpenAQConnector(
        device_id="temp_map_point",
        config={"lat": lat, "lon": lon}
    )
    pollutant_data = openaq_connector.fetch_data()

    # Construct Unified Response
    return {
        "location": {"lat": lat, "lon": lon},
        "fetchedAt": fetched_at,
        "weather": {
            "status": weather_data.get("status", "error"),
            "source": "Open-Meteo",
            "sourceTimestamp": weather_data.get("source_ts"),
            "metrics": weather_data.get("metrics", {})
        },
        "aqi": {
            "status": aqi_data.get("status", "error"),
            "source": "WAQI (AQICN)",
            "sourceTimestamp": aqi_data.get("source_ts"),
            "metrics": aqi_data.get("metrics", {})
        },
        "pollutants": {
            "status": pollutant_data.get("status", "error"),
            "source": "OpenAQ",
            "sourceTimestamp": pollutant_data.get("source_ts"),
            "metrics": pollutant_data.get("metrics", {})
        }
    }
