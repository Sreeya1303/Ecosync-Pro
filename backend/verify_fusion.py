import asyncio
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.services import external_apis, fusion_engine
from app import models, database

# Setup DB for verification (mock or real)
# For this script we rely on app modules

async def test():
    print("Testing Pro Mode Data Fusion...")
    
    # Simulate Local Data
    local = {"temp": 28.5, "humidity": 65, "pm25": 110}
    
    # Fetch External (Mocked if no keys, Real if keys present)
    external = await external_apis.get_pro_dashboard_data(17.385, 78.486)
    
    print("\n--- External Data ---")
    print(f"OWM Temp: {external['weather']['temp']}")
    print(f"NASA Data: {external.get('nasa_data')}")
    
    # Fuse
    ext_simple = {
        "temp": external["weather"]["temp"],
        "humidity": external["weather"]["humidity"],
        "pm25": external["air_quality"]["pm25"]
    }
    
    fused = fusion_engine.fuse_environmental_data(local, ext_simple)
    
    print("\n--- FUSION RESULT ---")
    print(f"Local Temp: {local['temp']} | External Temp: {ext_simple['temp']}")
    print(f"FUSED TEMP: {fused['temperature']['fused']} (Source: {fused['temperature']['source']})")
    
    print(f"Local PM2.5: {local['pm25']} | External PM2.5: {ext_simple['pm25']}")
    print(f"FUSED PM2.5: {fused['air_quality']['fused']}")

if __name__ == "__main__":
    asyncio.run(test())
