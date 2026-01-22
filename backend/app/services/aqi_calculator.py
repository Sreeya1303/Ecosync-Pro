"""
US EPA AQI (Air Quality Index) Calculator.
Implements the official EPA sub-index method for calculating AQI from pollutant concentrations.
"""

from typing import Dict, Optional, Tuple
import math


# EPA AQI Breakpoints for each pollutant
# Format: [(C_low, C_high, I_low, I_high), ...]

AQI_BREAKPOINTS = {
    # PM2.5 (µg/m³, 24-hour average)
    "pm25": [
        (0.0, 12.0, 0, 50),
        (12.1, 35.4, 51, 100),
        (35.5, 55.4, 101, 150),
        (55.5, 150.4, 151, 200),
        (150.5, 250.4, 201, 300),
        (250.5, 350.4, 301, 400),
        (350.5, 500.4, 401, 500),
    ],
    # PM10 (µg/m³, 24-hour average)
    "pm10": [
        (0, 54, 0, 50),
        (55, 154, 51, 100),
        (155, 254, 101, 150),
        (255, 354, 151, 200),
        (355, 424, 201, 300),
        (425, 504, 301, 400),
        (505, 604, 401, 500),
    ],
    # O3 (ppb, 8-hour average)
    "o3": [
        (0, 54, 0, 50),
        (55, 70, 51, 100),
        (71, 85, 101, 150),
        (86, 105, 151, 200),
        (106, 200, 201, 300),
    ],
    # NO2 (ppb, 1-hour average)
    "no2": [
        (0, 53, 0, 50),
        (54, 100, 51, 100),
        (101, 360, 101, 150),
        (361, 649, 151, 200),
        (650, 1249, 201, 300),
        (1250, 1649, 301, 400),
        (1650, 2049, 401, 500),
    ],
    # SO2 (ppb, 1-hour average)
    "so2": [
        (0, 35, 0, 50),
        (36, 75, 51, 100),
        (76, 185, 101, 150),
        (186, 304, 151, 200),
        (305, 604, 201, 300),
        (605, 804, 301, 400),
        (805, 1004, 401, 500),
    ],
    # CO (ppm, 8-hour average)
    "co": [
        (0.0, 4.4, 0, 50),
        (4.5, 9.4, 51, 100),
        (9.5, 12.4, 101, 150),
        (12.5, 15.4, 151, 200),
        (15.5, 30.4, 201, 300),
        (30.5, 40.4, 301, 400),
        (40.5, 50.4, 401, 500),
    ],
}


# AQI Categories
AQI_CATEGORIES = [
    (0, 50, "Good", "#00E400", "Air quality is satisfactory"),
    (51, 100, "Moderate", "#FFFF00", "Acceptable for most people"),
    (101, 150, "Unhealthy for Sensitive Groups", "#FF7E00", "Sensitive groups may experience health effects"),
    (151, 200, "Unhealthy", "#FF0000", "Everyone may experience health effects"),
    (201, 300, "Very Unhealthy", "#8F3F97", "Health alert: everyone may experience serious effects"),
    (301, 500, "Hazardous", "#7E0023", "Health warnings of emergency conditions"),
]


def calculate_aqi_for_pollutant(pollutant: str, concentration: float) -> Optional[int]:
    """
    Calculate AQI sub-index for a specific pollutant.
    
    Args:
        pollutant: Pollutant name (pm25, pm10, o3, no2, so2, co)
        concentration: Pollutant concentration in appropriate units
        
    Returns:
        AQI value (0-500) or None if out of range
    """
    if pollutant not in AQI_BREAKPOINTS:
        return None
    
    breakpoints = AQI_BREAKPOINTS[pollutant]
    
    # Find the appropriate breakpoint range
    for c_low, c_high, i_low, i_high in breakpoints:
        if c_low <= concentration <= c_high:
            # Linear interpolation formula
            aqi = ((i_high - i_low) / (c_high - c_low)) * (concentration - c_low) + i_low
            return int(round(aqi))
    
    # Concentration out of range
    if concentration > breakpoints[-1][1]:
        return 500  # Cap at maximum
    
    return None


def get_aqi_category(aqi: int) -> Dict[str, str]:
    """
    Get AQI category info for a given AQI value.
    
    Returns:
        Dict with 'level', 'color', 'description'
    """
    for i_low, i_high, level, color, description in AQI_CATEGORIES:
        if i_low <= aqi <= i_high:
            return {
                "level": level,
                "color": color,
                "description": description,
                "aqi": aqi
            }
    
    # Fallback for out-of-range
    return {
        "level": "Hazardous",
        "color": "#7E0023",
        "description": "Health warnings of emergency conditions",
        "aqi": aqi
    }


def calculate_overall_aqi(pollutants: Dict[str, Optional[float]]) -> Dict[str, any]:
    """
    Calculate overall AQI from multiple pollutants.
    EPA method: Take the maximum sub-index.
    
    Args:
        pollutants: Dict mapping pollutant name -> concentration
                   e.g., {"pm25": 35.0, "pm10": 50.0, "o3": 60.0}
    
    Returns:
        Dict with overall AQI, dominant pollutant, category info, and sub-indices
    """
    sub_indices = {}
    
    # Calculate sub-index for each available pollutant
    for pollutant, concentration in pollutants.items():
        if concentration is not None and pollutant in AQI_BREAKPOINTS:
            aqi = calculate_aqi_for_pollutant(pollutant, concentration)
            if aqi is not None:
                sub_indices[pollutant] = aqi
    
    if not sub_indices:
        return {
            "aqi": None,
            "category": "Unavailable",
            "color": "#999999",
            "description": "No data available",
            "dominant_pollutant": None,
            "sub_indices": {}
        }
    
    # Overall AQI = maximum sub-index (EPA standard)
    overall_aqi = max(sub_indices.values())
    dominant_pollutant = max(sub_indices, key=sub_indices.get)
    
    # Get category info
    category_info = get_aqi_category(overall_aqi)
    
    # Pollutant display names
    pollutant_names = {
        "pm25": "PM2.5",
        "pm10": "PM10",
        "o3": "Ozone",
        "no2": "NO₂",
        "so2": "SO₂",
        "co": "CO"
    }
    
    return {
        "aqi": overall_aqi,
        "category": category_info["level"],
        "color": category_info["color"],
        "description": category_info["description"],
        "dominant_pollutant": pollutant_names.get(dominant_pollutant, dominant_pollutant),
        "dominant_pollutant_key": dominant_pollutant,
        "sub_indices": {
            pollutant_names.get(p, p): aqi 
            for p, aqi in sub_indices.items()
        }
    }


def get_health_recommendations(aqi: int, dominant_pollutant: str = None) -> Dict[str, any]:
    """
    Get health recommendations based on AQI and dominant pollutant.
    Based on WHO 2021 Air Quality Guidelines and EPA recommendations.
    
    Returns:
        Dict with 'general', 'sensitive_groups', 'activities', 'mask_recommendation'
    """
    if aqi is None or aqi < 0:
        return {
            "general": "No data available",
            "sensitive_groups": "",
            "activities": "",
            "mask_recommendation": "Not applicable"
        }
    
    if aqi <= 50:  # Good
        return {
            "general": "Air quality is excellent. Ideal for outdoor activities.",
            "sensitive_groups": "No restrictions for any group.",
            "activities": "All outdoor activities recommended.",
            "mask_recommendation": "Not required",
            "color": "green"
        }
    
    elif aqi <= 100:  # Moderate
        return {
            "general": "Air quality is acceptable. Unusually sensitive people should consider limiting prolonged outdoor exertion.",
            "sensitive_groups": "Children with asthma should limit prolonged outdoor exertion.",
            "activities": "Normal outdoor activities are acceptable.",
            "mask_recommendation": "Optional for sensitive individuals",
            "color": "yellow"
        }
    
    elif aqi <= 150:  # Unhealthy for Sensitive Groups
        return {
            "general": "Sensitive groups should reduce prolonged or heavy outdoor exertion.",
            "sensitive_groups": "Children, elderly, and people with respiratory conditions should limit outdoor activities.",
            "activities": "Reduce prolonged or heavy exercise outdoors. General public can continue normal activities.",
            "mask_recommendation": "Recommended: Surgical mask or N95 for sensitive groups",
            "color": "orange"
        }
    
    elif aqi <= 200:  # Unhealthy
        return {
            "general": "Everyone should reduce prolonged or heavy outdoor exertion.",
            "sensitive_groups": "Children, elderly, and people with heart/lung disease should avoid outdoor activities.",
            "activities": "Avoid prolonged outdoor exertion. Shorten outdoor activities.",
            "mask_recommendation": "Recommended: N95/KN95 mask for everyone outdoors",
            "color": "red"
        }
    
    elif aqi <= 300:  # Very Unhealthy
        return {
            "general": "Health alert! Everyone should avoid outdoor physical exertion.",
            "sensitive_groups": "Remain indoors. Use air purifiers if available.",
            "activities": "Avoid all outdoor activities. Move activities indoors or reschedule.",
            "mask_recommendation": "Required: N95/KN95 mask if going outdoors. Consider staying indoors.",
            "color": "purple"
        }
    
    else:  # Hazardous (> 300)
        return {
            "general": "⚠️ EMERGENCY: Remain indoors with windows/doors closed. Use air purifiers.",
            "sensitive_groups": "⚠️ CRITICAL: Seek immediate medical attention if experiencing symptoms.",
            "activities": "⚠️ Do NOT go outdoors unless absolutely necessary.",
            "mask_recommendation": "REQUIRED: N95/FFP2 mask minimum. Consider respirator with filters.",
            "color": "maroon"
        }


def get_pollutant_breakdown_chart(sub_indices: Dict[str, int]) -> Dict[str, any]:
    """
    Generate data for pollutant contribution pie/bar chart.
    
    Returns:
        Chart data with labels, values, and colors
    """
    if not sub_indices:
        return {
            "labels": [],
            "values": [],
            "colors": []
        }
    
    # Color palette for pollutants
    pollutant_colors = {
        "PM2.5": "#e74c3c",
        "PM10": "#e67e22",
        "Ozone": "#3498db",
        "NO₂": "#9b59b6",
        "SO₂": "#1abc9c",
        "CO": "#34495e"
    }
    
    labels = list(sub_indices.keys())
    values = list(sub_indices.values())
    colors = [pollutant_colors.get(label, "#95a5a6") for label in labels]
    
    return {
        "labels": labels,
        "values": values,
        "colors": colors,
        "total_pollutants": len(labels)
    }
