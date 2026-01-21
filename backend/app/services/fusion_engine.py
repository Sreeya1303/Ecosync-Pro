
import numpy as np

class KalmanFilter:
    def __init__(self, process_variance, measurement_variance, estimation_error, initial_value):
        self.process_variance = process_variance # Q
        self.measurement_variance = measurement_variance # R
        self.estimation_error = estimation_error # P
        self.current_estimate = initial_value # X
        self.kalman_gain = 0 # K

    def update(self, measurement):
        # Prediction Update
        # X_p = X_k-1 (Simplest model: constant value)
        # P_p = P_k-1 + Q
        self.estimation_error += self.process_variance

        # Measurement Update
        # K = P_p / (P_p + R)
        self.kalman_gain = self.estimation_error / (self.estimation_error + self.measurement_variance)
        
        # X_k = X_p + K * (Z_k - X_p)
        self.current_estimate = self.current_estimate + self.kalman_gain * (measurement - self.current_estimate)
        
        # P_k = (1 - K) * P_p
        self.estimation_error = (1 - self.kalman_gain) * self.estimation_error
        
        return self.current_estimate

def fuse_environmental_data(local_data: dict, external_data: dict):
    """
    Fuses local sensor data with external API data using Kalman Filter.
    
    Args:
        local_data: { 'temp': float, 'humidity': float, 'pm25': float }
        external_data: { 'temp': float, 'humidity': float, 'pm25': float }
        
    Returns:
        {
            'temp': { 'local': ..., 'external': ..., 'fused': ..., 'confidence': ... },
            ...
        }
    """
    fused_result = {}
    
    # --- Temperature Fusion ---
    # Setup KF: Higher measurement variance for External (it's regional, not local)
    # Lower process variance (temp doesn't jump instantly)
    local_temp = local_data.get('temp')
    ext_temp = external_data.get('temp')
    
    if local_temp is not None and ext_temp is not None:
        kf_temp = KalmanFilter(process_variance=0.1, measurement_variance=2.0, estimation_error=1.0, initial_value=local_temp)
        # Update with external as "measurement" to correct the "local state"
        # Or treat Local as Measurement and External as initial prediction?
        # Strategy: Use External as "Prediction" (System Model) and Local as "Measurement".
        
        # 1. Initialize with External (Macro Trend)
        kf_temp.current_estimate = ext_temp 
        # 2. Update with Local (Micro Reality)
        fused_val = kf_temp.update(local_temp)
        
        fused_result['temperature'] = {
            'local': local_temp,
            'external': ext_temp,
            'fused': round(fused_val, 2),
            'source': "AI Fused (Kalman)"
        }
    else:
        # Fallback
        val = local_temp if local_temp is not None else ext_temp
        fused_result['temperature'] = {'fused': val, 'source': 'Single Source'}

    # --- Humidity Fusion ---
    local_hum = local_data.get('humidity')
    ext_hum = external_data.get('humidity')
    
    if local_hum is not None and ext_hum is not None:
        kf_hum = KalmanFilter(process_variance=0.5, measurement_variance=5.0, estimation_error=2.0, initial_value=ext_hum)
        fused_val = kf_hum.update(local_hum)
        fused_result['humidity'] = {
            'local': local_hum,
            'external': ext_hum,
            'fused': round(fused_val, 1),
            'source': "AI Fused (Kalman)"
        }
    else:
        val = local_hum if local_hum is not None else ext_hum
        fused_result['humidity'] = {'fused': val, 'source': 'Single Source'}

    # --- Air Quality (PM2.5) ---
    local_pm = local_data.get('pm25')
    ext_pm = external_data.get('pm25')
    
    if local_pm is not None and ext_pm is not None:
        # PM2.5 varies hugely locally. Trust local more (lower variance R vs external).
        kf_pm = KalmanFilter(process_variance=2.0, measurement_variance=10.0, estimation_error=5.0, initial_value=ext_pm)
        fused_val = kf_pm.update(local_pm)
        fused_result['air_quality'] = {
            'local': local_pm,
            'external': ext_pm,
            'fused': round(fused_val, 1),
            'source': "AI Fused (Kalman)"
        }
    else:
        val = local_pm if local_pm is not None else ext_pm
        fused_result['air_quality'] = {'fused': val, 'source': 'Single Source'}
        
    return fused_result
