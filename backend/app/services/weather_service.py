import httpx

async def get_current_weather(lat: float, lon: float):
    url = "https://api.open-meteo.com/v1/forecast"
    params = {
        "latitude": lat,
        "longitude": lon,
        "current_weather": "true"
    }
    async with httpx.AsyncClient() as client:
        response = await client.get(url, params=params)
        response.raise_for_status()
        data = response.json()
        return data.get("current_weather", {})

def calculate_rainfall_prediction(humidity: float, wind_speed: float, pressure: float = 1013.0) -> dict:
    """
    Heuristic rule-based rainfall prediction.
    Logic:
    - High Humidity (> 85%) + Low Pressure (< 1010 hPa) -> High Probability
    - High Humidity (> 80%) + Significant Wind (> 5 m/s) -> Moderate Probability
    - Low Humidity (< 60%) -> Low Probability
    """
    score = 0
    if humidity > 85: score += 5
    elif humidity > 75: score += 3
    
    if pressure < 1005: score += 5
    elif pressure < 1010: score += 3
    
    if wind_speed > 10: score += 3
    elif wind_speed > 5: score += 2
    
    if score >= 10:
        prediction = "High Probability of Rain"
        severity = "high"
    elif score >= 6:
        prediction = "Moderate Rain Likely"
        severity = "medium"
    elif score >= 3:
        prediction = "Scattered Showers Possible"
        severity = "low"
    else:
        prediction = "No Rain Predicted"
        severity = "none"
        
    return {
        "prediction": prediction,
        "probability_score": score,
        "severity": severity
    }

