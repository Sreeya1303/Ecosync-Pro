from fastapi import APIRouter, HTTPException
from ..services import weather_service

router = APIRouter(
    prefix="/external",
    tags=["external"]
)

@router.get("/weather")
async def get_weather(lat: float = 17.3850, lon: float = 78.4867): # Default to Hyderabad
    try:
        weather_data = await weather_service.get_current_weather(lat, lon)
        return weather_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
