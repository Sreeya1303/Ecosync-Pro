from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from datetime import datetime, timedelta
import json
import asyncio
from typing import List
from .. import models, database
from ..services import external_apis

router = APIRouter(
    prefix="/api/pro",
    tags=["Pro Mode API"],
    responses={404: {"description": "Not found"}},
)

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- HELPER: Normalized Response Builder ---
def build_normalized_response(lat, lon, city, weather_data, aq_data, sources):
    """
    Constructs the normalized JSON shape required by the frontend.
    """
    # Safe extraction with defaults
    w = weather_data if weather_data else {}
    aq = aq_data if aq_data else {}
    
    # Calculate AQI Estimate if missing (Simple max of PM2.5/PM10 usually determines AQI)
    # This is a rough estimation for the "aqi_estimate" field
    aqi_est = aq.get("aqi", 0)
    if not aqi_est and "pm25" in aq:
        aqi_est = aq["pm25"] * 2 # Crude approx
        
    return {
        "ts": int(datetime.utcnow().timestamp()),
        "location": {
            "lat": lat,
            "lon": lon,
            "city": city or "Unknown Location"
        },
        "weather": {
            "temp": w.get("temp", 0),
            "humidity": w.get("humidity", 0),
            "pressure": w.get("pressure", 1013),
            "wind": w.get("wind_speed", 0)
        },
        "pollutants": {
            "pm25": aq.get("pm25"),
            "pm10": aq.get("pm10"),
            "no2": aq.get("no2"),
            "o3": aq.get("o3"),
            "so2": aq.get("so2"),
            "co": aq.get("co")
        },
        "aqi_estimate": int(aqi_est),
        "sources": sources
    }

# --- DEPENDENCIES ---
from .auth import get_current_user

# --- ENDPOINTS ---

@router.get("/current")
async def get_pro_current(
    lat: float = None, 
    lon: float = None, 
    city: str = None, 
    db: Session = Depends(get_db)
):
    """
    Aggregates current weather and air quality data.
    - Caches results in DB (APISnapshot) for 5 minutes.
    - Merges OpenWeather + OpenAQ.
    - Performs Kalman Fusion with local data.
    """
    # 0. Resolve Location If Needed
    if city and (lat is None or lon is None):
        coords = await external_apis.get_location_coordinates(city)
        if coords:
            lat = coords["lat"]
            lon = coords["lon"]
            # Update city name from resolution if we want formatted name
            if not city: city = coords["name"] 
        else:
             # Fallback
             lat = 17.3850
             lon = 78.4867
             
    if lat is None: lat = 17.3850
    if lon is None: lon = 78.4867

    # 1. Check Cache (DB)
    loc_key = f"{lat:.4f},{lon:.4f}"
    cutoff = datetime.utcnow() - timedelta(minutes=5)
    cached = db.query(models.APISnapshot).filter(
        models.APISnapshot.location == loc_key,
        models.APISnapshot.created_at > cutoff
    ).order_by(models.APISnapshot.created_at.desc()).first()

    # Prepare base data
    weather_data = {}
    aq_data = {}
    sources = {"details": "Live"}

    if cached:
        weather_data = {
            "temp": cached.temp,
            "humidity": cached.humidity,
            "pressure": 1013,
            "wind": 0
        }
        aq_data = {
            "pm25": cached.pm2_5,
            "pm10": cached.pm10,
            "no2": cached.no2,
            "o3": cached.o3,
            "so2": cached.so2,
            "co": cached.co,
            "aqi": cached.aqi
        }
        sources = {"cache": True, "details": cached.source}
    else:
        # Fetch Fresh Data
        try:
            weather_task = external_apis.fetch_open_weather(lat, lon)
            aq_task = external_apis.fetch_air_quality(lat, lon)
            
            weather_data = await weather_task
            aq_data = await aq_task
            
            # Save to Cache
            snapshot = models.APISnapshot(
                location=loc_key,
                temp=weather_data.get("temp"),
                humidity=weather_data.get("humidity"),
                aqi=aq_data.get("aqi"),
                pm2_5=aq_data.get("pm25"),
                pm10=aq_data.get("pm10"),
                no2=aq_data.get("no2"),
                so2=aq_data.get("so2"),
                co=aq_data.get("co"),
                o3=aq_data.get("o3"),
                source="Live API"
            )
            db.add(snapshot)
            db.commit()
            sources = {"openweather": True, "openaq": True}

        except Exception as e:
            print(f"Pro API Cache Miss Error: {e}")
            # If fetch fails and no cache, we might return empty or error?
            # For now proceeding with empty dicts will let Fusion handle "Single Source" (Local only)
            pass

    # --- FUSION LOGIC ---
    # Get latest local reading (Simulated from "ESP32_MAIN" or any device)
    latest_reading = db.query(models.SensorData).order_by(models.SensorData.timestamp.desc()).first()
    local_data = {}
    if latest_reading:
        local_data = {
            "temp": latest_reading.temperature,
            "humidity": latest_reading.humidity,
            "pm25": latest_reading.pm2_5
        }
    
    # Simple Ext Formatting for Fusion
    ext_simple = {
        "temp": weather_data.get("temp"),
        "humidity": weather_data.get("humidity"),
        "pm25": aq_data.get("pm25")
    }
    
    fused_state = fusion_engine.fuse_environmental_data(local_data, ext_simple)

    # Return Normalized Shape with Fusion
    response = build_normalized_response(lat, lon, city, weather_data, aq_data, sources)
    response["fusion"] = fused_state
    return response


@router.get("/forecast")
async def get_pro_forecast(lat: float, lon: float):
    """
    Returns hourly forecast data for both Weather and AQI.
    Uses Open-Meteo (Weather) and Open-Meteo Air Quality (Free).
    """
    import httpx
    
    weather_url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&hourly=temperature_2m,relativehumidity_2m,precipitation_probability&timezone=auto"
    aqi_url = f"https://air-quality-api.open-meteo.com/v1/air-quality?latitude={lat}&longitude={lon}&hourly=pm10,pm2_5,us_aqi&timezone=auto"
    
    async with httpx.AsyncClient() as client:
        try:
            # Parallel fetch
            weather_resp, aqi_resp = await asyncio.gather(
                client.get(weather_url),
                client.get(aqi_url),
                return_exceptions=True
            )
            
            weather_data = weather_resp.json() if not isinstance(weather_resp, Exception) and weather_resp.status_code == 200 else {}
            aqi_data = aqi_resp.json() if not isinstance(aqi_resp, Exception) and aqi_resp.status_code == 200 else {}
            
            return {
                "weather": weather_data.get("hourly", {}),
                "aqi": aqi_data.get("hourly", {}),
                "source": "Open-Meteo + Open-Meteo AQ"
            }
        except Exception as e:
            # Return partial or empty instead of crashing
            print(f"Forecast Error: {e}")
            return {"weather": {}, "aqi": {}, "error": str(e)}

@router.get("/history")
async def get_pro_history(lat: float, lon: float, hours: int = 24, db: Session = Depends(get_db)):
    """
    Returns historical snapshots from local DB.
    """
    loc_key_start = f"{int(lat)}.{int(lon * 100) // 100}" # Rough matching or exact?
    # Let's try exact string match on first 4 decimals as used in cache
    loc_key = f"{lat:.4f},{lon:.4f}"
    
    cutoff = datetime.utcnow() - timedelta(hours=hours)
    
    history = db.query(models.APISnapshot).filter(
        models.APISnapshot.location == loc_key,
        models.APISnapshot.created_at >= cutoff
    ).order_by(models.APISnapshot.created_at.asc()).all()
    
    return {
        "count": len(history),
        "range_hours": hours,
        "data": [
            {
                "ts": int(h.created_at.timestamp()),
                "temp": h.temp,
                "humidity": h.humidity,
                "aqi": h.aqi
            }
            for h in history
        ]
    }

# --- DIARY ENDPOINTS ---
from .. import schemas

@router.post("/diary", response_model=schemas.DiaryEntryResponse)
def create_diary_entry(entry: schemas.DiaryEntryCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    """
    Adds a note to the Air Quality Diary.
    """
    new_entry = models.DiaryEntry(
        user_id=current_user.id,
        note=entry.note,
        location=entry.location
    )
    db.add(new_entry)
    db.commit()
    db.refresh(new_entry)
    return new_entry

@router.get("/diary", response_model=List[schemas.DiaryEntryResponse])
def get_diary_entries(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    """
    Retrieves user's diary entries.
    """
    return db.query(models.DiaryEntry).filter(
        models.DiaryEntry.user_id == current_user.id
    ).order_by(models.DiaryEntry.timestamp.desc()).all()

# --- WIDGET LAYOUT ENDPOINTS ---

@router.post("/layout", response_model=schemas.UserLayoutResponse)
def save_user_layout(layout: schemas.UserLayoutUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    """
    Saves the user's Pro Dashboard layout preference.
    """
    # Check if exists
    db_layout = db.query(models.UserLayout).filter(models.UserLayout.user_id == current_user.id).first()
    if db_layout:
        db_layout.layout_json = layout.layout_json
        db_layout.updated_at = datetime.utcnow()
    else:
        db_layout = models.UserLayout(
            user_id=current_user.id,
            layout_json=layout.layout_json
        )
        db.add(db_layout)
    
    db.commit()
    db.refresh(db_layout)
    return db_layout

@router.get("/layout", response_model=schemas.UserLayoutResponse)
def get_user_layout(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    """
    Gets the user's saved layout.
    """
    db_layout = db.query(models.UserLayout).filter(models.UserLayout.user_id == current_user.id).first()
    if not db_layout:
        return {"layout_json": ""} # Return empty to indicate default
    return db_layout
