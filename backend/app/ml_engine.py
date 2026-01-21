import numpy as np
from filterpy.kalman import KalmanFilter
from sklearn.ensemble import IsolationForest
import pickle
import os

class AdaptiveKalmanFilter:
    """
    Improved Kalman Filter that adapts Q (Process Noise) based on 
    signal stability to track trends better while smoothing noise.
    """
    def __init__(self, initial_value=0.0):
        self.kf = KalmanFilter(dim_x=2, dim_z=1) # State: [value, velocity]
        self.kf.x = np.array([[initial_value], [0.]])
        self.kf.F = np.array([[1., 1.], [0., 1.]]) # State transition (Constant Velocity model)
        self.kf.H = np.array([[1., 0.]]) # Measurement function
        self.kf.P *= 10. 
        self.kf.R = 5.0 # High measurement noise (smoothing)
        self.kf.Q = np.array([[0.01, 0.01], [0.01, 0.01]]) # Low process noise initially

    def update(self, measurement):
        self.kf.predict()
        
        # Adaptive Logic: If residual is high, increase Process Noise (Q) to track faster
        residual = abs(measurement - self.kf.x[0, 0])
        if residual > 2.0:
            self.kf.Q[0, 0] = 1.0 # Trust measurement more (fast dynamic)
        else:
            self.kf.Q[0, 0] = 0.01 # Trust model more (smooth steady state)

        self.kf.update(measurement)
        return float(self.kf.x[0, 0])

    def predict_future(self, steps=10):
        """
        Predict future values without updating the state.
        Returns a list of predicted float values.
        """
        predictions = []
        # Save current state
        current_x = self.kf.x.copy()
        current_P = self.kf.P.copy()
        
        for _ in range(steps):
            self.kf.predict()
            predictions.append(float(self.kf.x[0, 0]))
            
        # Restore state
        self.kf.x = current_x
        self.kf.P = current_P
        return predictions

class Preprocessor:
    def __init__(self):
        # [temp, pressure, vibration, wind, uv, soil_temp, soil_moist, pm25, pm10, no2, solar]
        self.min_vals = np.array([-10.0, 900.0, 0.0, 0.0, 0.0, -10.0, 0.0, 0.0, 0.0, 0.0, 0.0])
        self.max_vals = np.array([100.0, 1100.0, 20.0, 150.0, 15.0, 60.0, 1.0, 500.0, 500.0, 200.0, 1500.0])

    def scale(self, features):
        features = np.array(features)
        scaled = (features - self.min_vals) / (self.max_vals - self.min_vals)
        return scaled

class IoTAnomalyDetector:
    def __init__(self):
        self.buffer = []
        self.model = IsolationForest(n_estimators=100, contamination=0.1)
        self.is_fitted = False
        self.preprocessor = Preprocessor()
        
        self.config = {
            "TEMP_MAX": 80.0,
            "TEMP_MIN": -10.0,
            "VIBRATION_MAX": 5.0,
            "PRESSURE_MIN": 900.0,
            "WIND_MAX": 50.0,
            "UV_MAX": 10.0,
            "PM25_MAX": 150.0,
            "NO2_MAX": 100.0
        }

    def update_config(self, new_config: dict):
        self.config.update(new_config)

    def check_thresholds(self, data: dict):
        alerts = []
        precautions = []
        
        # Temperature
        if data['temperature'] > self.config['TEMP_MAX']:
            alerts.append(f"Temperature High (> {self.config['TEMP_MAX']}°C)")
            precautions.append("Hydrate immediately and avoid direct sunlight.")
            precautions.append("Check device cooling systems.")
        elif data['temperature'] < self.config['TEMP_MIN']:
            alerts.append(f"Temperature Low (< {self.config['TEMP_MIN']}°C)")
            precautions.append("Ensure thermal insulation is active.")

        # Vibration
        if data['vibration'] > self.config['VIBRATION_MAX']:
            alerts.append(f"Vibration Critical (> {self.config['VIBRATION_MAX']})")
            precautions.append("Inspect mounting integrity immediately.")
            precautions.append("Possible bearing failure - schedule maintenance.")

        # Pressure
        if data['pressure'] < self.config['PRESSURE_MIN']:
             alerts.append(f"Pressure Drop (< {self.config['PRESSURE_MIN']}hPa)")
             precautions.append("Check for vacuum leaks or seal breaches.")

        # Wind
        if data.get('wind_speed', 0) > self.config['WIND_MAX']:
            alerts.append(f"High Wind (> {self.config['WIND_MAX']}km/h)")
            precautions.append("Secure loose outdoor equipment.")
            precautions.append("Halt crane/aerial operations.")

        # UV
        if data.get('uv_index', 0) > self.config['UV_MAX']:
            alerts.append(f"Extreme UV (> {self.config['UV_MAX']})")
            precautions.append("Wear UV-protective gear and eye protection.")
            precautions.append("Limit exposure to < 10 minutes.")

        # Air Quality
        if data.get('pm2_5', 0) > self.config['PM25_MAX']:
            alerts.append(f"Hazardous Air Quality (PM2.5 > {self.config['PM25_MAX']})")
            precautions.append("Wear N95/N99 respirator masks.")
            precautions.append("Activate air filtration systems immediately.")

        return alerts, precautions

    def update_and_predict(self, feature_vector):
        scaled_features = self.preprocessor.scale(feature_vector)
        self.buffer.append(scaled_features)
        
        if len(self.buffer) > 1000:
            self.buffer.pop(0)
        
        if len(self.buffer) >= 50 and not self.is_fitted:
            self.model.fit(self.buffer)
            self.is_fitted = True
            
        if self.is_fitted:
            prediction = self.model.predict([scaled_features])[0]
            score = self.model.decision_function([scaled_features])[0]
            return prediction == -1, score
        
        return False, 0.0
