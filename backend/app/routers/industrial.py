from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, case
from datetime import datetime, timedelta
from typing import List, Dict, Any
import numpy as np

from .. import models, schemas, database
from ..services import kalman_filter

router = APIRouter(prefix="/api/industrial", tags=["Industrial Safety"])

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/safety-index")
async def get_safety_index(db: Session = Depends(get_db)):
    """Calculates the overall safety risk level for the firecracker industry."""
    latest = db.query(models.SensorData).order_by(models.SensorData.timestamp.desc()).first()
    if not latest:
        return {"status": "no_data", "risk_level": "UNKNOWN", "score": 0}

    # Industry-specific logic refined:
    # High Risk: Temp > 30°C AND Gas > 120 ppm
    # Medium Risk: Temp > 28°C OR Gas > 90 ppm
    
    risk_level = "SAFE"
    color = "emerald"
    reason = "All systems reporting normal operating parameters."
    
    if latest.temperature > 30 and latest.pm2_5 > 120:
        risk_level = "HIGH RISK"
        color = "red"
        reason = "Critical: High temperature (>30°C) and gas levels (>120ppm) detected simultaneously."
    elif latest.temperature > 28 or latest.pm2_5 > 90:
        risk_level = "MEDIUM RISK"
        color = "orange"
        if latest.temperature > 28 and latest.pm2_5 > 90:
             reason = "Warning: Both temperature and gas levels are elevated."
        elif latest.temperature > 28:
             reason = f"Elevated Temperature ({latest.temperature}°C) detected above safety baseline."
        else:
             reason = f"Elevated Gas Concentration ({latest.pm2_5} ppm) detected."
        
    return {
        "risk_level": risk_level,
        "color": color,
        "reason": reason,
        "timestamp": latest.timestamp,
        "details": {
            "temp": round(latest.temperature, 2),
            "gas": round(latest.pm2_5, 2)
        }
    }

@router.get("/historical-comparison")
async def get_historical_comparison(db: Session = Depends(get_db)):
    """Compares current values with historical averages (last 7 days)."""
    latest = db.query(models.SensorData).order_by(models.SensorData.timestamp.desc()).first()
    if not latest:
        return {"status": "no_data"}

    week_ago = datetime.utcnow() - timedelta(days=7)
    avg_data = db.query(
        func.avg(models.SensorData.temperature).label("avg_temp"),
        func.avg(models.SensorData.humidity).label("avg_hum"),
        func.avg(models.SensorData.pm2_5).label("avg_gas")
    ).filter(models.SensorData.timestamp >= week_ago).first()

    return {
        "current": {
            "temp": round(latest.temperature, 2),
            "humidity": round(latest.humidity, 2),
            "gas": round(latest.pm2_5, 2)
        },
        "normal": {
            "temp": round(avg_data.avg_temp or 25.0, 2),
            "humidity": round(avg_data.avg_hum or 45.0, 2),
            "gas": round(avg_data.avg_gas or 50.0, 2)
        }
    }

@router.get("/motion-stats")
async def get_motion_stats(db: Session = Depends(get_db)):
    """Returns activity statistics for restricted areas."""
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    
    motion_events = db.query(models.SensorData).filter(
        models.SensorData.motion == True,
        models.SensorData.timestamp >= today_start
    ).all()
    
    last_motion = db.query(models.SensorData).filter(
        models.SensorData.motion == True
    ).order_by(models.SensorData.timestamp.desc()).first()
    
    unusual_activity = False
    if last_motion:
        # Working hours: 9 AM - 6 PM
        hour = last_motion.timestamp.hour
        if hour < 9 or hour >= 18:
            unusual_activity = True

    return {
        "daily_count": len(motion_events),
        "last_motion_time": last_motion.timestamp if last_motion else None,
        "unusual_activity": unusual_activity,
        "working_hours": "09:00 - 18:00"
    }

@router.get("/sensor-health")
async def get_sensor_health(db: Session = Depends(get_db)):
    """Checks for sensor faults or instabilities based on data patterns."""
    readings = db.query(models.SensorData).order_by(models.SensorData.timestamp.desc()).limit(30).all()
    if len(readings) < 10:
        return {"temperature": "INITIALIZING", "humidity": "INITIALIZING", "gas": "INITIALIZING"}

    def analyze_health(values):
        if not values or len(values) < 5: return "FAULT"
        
        # 1. Flatline check
        if np.var(values[:10]) < 0.0001: 
            return "FAULT (FLATLINE)"
            
        # 2. Spike/Noise check
        std = np.std(values)
        if std > 0:
            diffs = np.abs(np.diff(values))
            if np.any(diffs > std * 5) and std > 1:
                return "WARNING (EXCESSIVE NOISE)"
            
        return "OK"

    temp_vals = [r.temperature for r in readings if r.temperature is not None]
    hum_vals = [r.humidity for r in readings if r.humidity is not None]
    gas_vals = [r.pm2_5 for r in readings if r.pm2_5 is not None]

    return {
        "temperature": analyze_health(temp_vals),
        "humidity": analyze_health(hum_vals),
        "gas": analyze_health(gas_vals),
        "last_scan": datetime.utcnow()
    }

@router.get("/predictions")
async def get_safety_predictions(db: Session = Depends(get_db)):
    """Calculates short-term safety predictions (next 10 mins)."""
    readings = db.query(models.SensorData).order_by(models.SensorData.timestamp.desc()).limit(10).all()
    if len(readings) < 5:
        return {"status": "insufficient_data"}

    def predict_next(values):
        if not values: return 0, "unknown"
        y = np.array(values[::-1])
        x = np.arange(len(y))
        z = np.polyfit(x, y, 1)
        next_val = z[0] * (len(y) + 2) + z[1]
        trend = "rising" if z[0] > 0.05 else "falling" if z[0] < -0.05 else "stable"
        return round(next_val, 2), trend

    temp_pred, temp_trend = predict_next([r.temperature for r in readings if r.temperature is not None])
    gas_pred, gas_trend = predict_next([r.pm2_5 for r in readings if r.pm2_5 is not None])

    return {
        "predicted_temp_10m": temp_pred,
        "predicted_gas_10m": gas_pred,
        "temperature_trend": temp_trend,
        "gas_trend": gas_trend
    }

@router.get("/alerts/explainable")
async def get_explainable_alerts(db: Session = Depends(get_db), limit: int = 20):
    """Returns alerts with historical context/reasoning."""
    alerts = db.query(models.Alert).order_by(models.Alert.timestamp.desc()).limit(limit).all()
    
    week_ago = datetime.utcnow() - timedelta(days=7)
    avg_data = db.query(
        func.avg(models.SensorData.temperature).label("avg_temp"),
        func.avg(models.SensorData.pm2_5).label("avg_gas")
    ).first()
    
    avg_temp = avg_data.avg_temp or 25.0
    avg_gas = avg_data.avg_gas or 50.0

    explainable_alerts = []
    for a in alerts:
        reason = "Multiple threshold violations detected."
        if "PM2.5" in a.message:
             reason = f"Gas concentration ({a.message.split(':')[-1].strip()}) significantly above safety baseline."
        elif "TEMP" in a.message:
             reason = f"Temperature spike detected relative to historical average ({round(avg_temp, 1)}°C)."
        
        explainable_alerts.append({
            "id": a.id,
            "timestamp": a.timestamp,
            "message": a.message,
            "reason": reason,
            "current_context": {
                "normal_temp": round(avg_temp, 1),
                "normal_gas": round(avg_gas, 1)
            }
        })

    return explainable_alerts
