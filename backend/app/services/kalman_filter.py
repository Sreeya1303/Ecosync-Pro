"""
Kalman Filter implementation for IoT sensor data fusion and noise reduction.
Supports 1D filtering for individual sensors and multi-sensor fusion.
"""

import numpy as np
from typing import Optional, Tuple, Dict
from collections import deque


class KalmanFilter1D:
    """
    1D Kalman filter for single sensor smoothing.
    Reduces noise and provides confidence estimates.
    """
    
    def __init__(self, process_variance: float = 0.01, measurement_variance: float = 0.1):
        """
        Initialize Kalman filter.
        
        Args:
            process_variance: Expected variance in the process (system dynamics)
            measurement_variance: Expected variance in measurements (sensor noise)
        """
        self.q = process_variance  # Process noise covariance
        self.r = measurement_variance  # Measurement noise covariance
        
        self.x = 0.0  # State estimate
        self.p = 1.0  # Estimate error covariance
        self.k = 0.0  # Kalman gain
        
        self.initialized = False
        
    def update(self, measurement: float) -> Tuple[float, float]:
        """
        Update filter with new measurement.
        
        Args:
            measurement: New sensor reading
            
        Returns:
            Tuple of (filtered_value, confidence_score)
        """
        if not self.initialized:
            # Initialize with first measurement
            self.x = measurement
            self.initialized = True
            return measurement, 0.5  # Low confidence on first reading
        
        # Prediction step
        # x_pred = x (assuming constant model)
        p_pred = self.p + self.q
        
        # Update step
        self.k = p_pred / (p_pred + self.r)  # Kalman gain
        self.x = self.x + self.k * (measurement - self.x)  # State update
        self.p = (1 - self.k) * p_pred  # Covariance update
        
        # Confidence score: inverse of uncertainty (normalized to 0-1)
        confidence = 1.0 / (1.0 + self.p)
        confidence = min(max(confidence, 0.0), 1.0)  # Clamp to [0, 1]
        
        return self.x, confidence
    
    def get_variance(self) -> float:
        """Get current estimate variance."""
        return self.p
    
    def reset(self):
        """Reset filter to initial state."""
        self.x = 0.0
        self.p = 1.0
        self.initialized = False


class MultiSensorFusion:
    """
    Fuses data from multiple sensors using Kalman filtering.
    Weights sources based on their measurement variance.
    """
    
    def __init__(self):
        self.filters: Dict[str, KalmanFilter1D] = {}
        
    def add_source(self, source_name: str, measurement_variance: float = 0.1):
        """Add a new data source with its expected variance."""
        self.filters[source_name] = KalmanFilter1D(
            process_variance=0.01,
            measurement_variance=measurement_variance
        )
    
    def fuse(self, measurements: Dict[str, Optional[float]]) -> Dict[str, any]:
        """
        Fuse measurements from multiple sources.
        
        Args:
            measurements: Dict mapping source names to values (None for missing)
            
        Returns:
            Dict with 'value', 'confidence', 'variance', 'weights'
        """
        if not measurements:
            return {
                "value": None,
                "confidence": 0.0,
                "variance": float('inf'),
                "weights": {},
                "quality": "UNAVAILABLE"
            }
        
        # Filter out None values
        valid_measurements = {k: v for k, v in measurements.items() if v is not None}
        
        if not valid_measurements:
            return {
                "value": None,
                "confidence": 0.0,
                "variance": float('inf'),
                "weights": {},
                "quality": "UNAVAILABLE"
            }
        
        # Ensure filters exist for all sources
        for source in valid_measurements.keys():
            if source not in self.filters:
                self.add_source(source)
        
        # Update each filter and collect estimates
        estimates = []
        variances = []
        
        for source, measurement in valid_measurements.items():
            filtered_value, confidence = self.filters[source].update(measurement)
            variance = self.filters[source].get_variance()
            estimates.append(filtered_value)
            variances.append(variance)
        
        # Fuse using inverse variance weighting (optimal for Gaussian noise)
        inv_variances = [1.0 / v if v > 0 else 1e6 for v in variances]
        total_inv_var = sum(inv_variances)
        weights = [iv / total_inv_var for iv in inv_variances]
        
        # Weighted average
        fused_value = sum(e * w for e, w in zip(estimates, weights))
        fused_variance = 1.0 / total_inv_var if total_inv_var > 0 else float('inf')
        
        # Overall confidence
        confidence = 1.0 / (1.0 + fused_variance)
        confidence = min(max(confidence, 0.0), 1.0)
        
        # Quality rating
        if confidence > 0.8:
            quality = "HIGH"
        elif confidence > 0.5:
            quality = "MEDIUM"
        else:
            quality = "LOW"
        
        # Create weights dict mapping source -> percentage
        weights_dict = {
            source: round(w * 100, 1) 
            for source, w in zip(valid_measurements.keys(), weights)
        }
        
        return {
            "value": round(fused_value, 2),
            "confidence": round(confidence, 3),
            "variance": round(fused_variance, 4),
            "weights": weights_dict,
            "quality": quality
        }


class OutlierDetector:
    """
    Detects and flags outliers in sensor data using statistical methods.
    """
    
    def __init__(self, window_size: int = 30, z_threshold: float = 3.0):
        """
        Args:
            window_size: Number of recent readings to consider
            z_threshold: Z-score threshold for outlier detection
        """
        self.window_size = window_size
        self.z_threshold = z_threshold
        self.history = deque(maxlen=window_size)
        
    def is_outlier(self, value: float) -> Tuple[bool, float]:
        """
        Check if value is an outlier.
        
        Returns:
            Tuple of (is_outlier, z_score)
        """
        if len(self.history) < 5:  # Need minimum samples
            self.history.append(value)
            return False, 0.0
        
        # Calculate mean and std from history
        mean = np.mean(self.history)
        std = np.std(self.history)
        
        if std < 1e-6:  # Avoid division by zero
            self.history.append(value)
            return False, 0.0
        
        # Calculate z-score
        z_score = abs((value - mean) / std)
        
        is_outlier = z_score > self.z_threshold
        
        # Add to history only if not an outlier
        if not is_outlier:
            self.history.append(value)
        
        return is_outlier, z_score
    
    def clean(self, value: float) -> Optional[float]:
        """
        Return value if valid, None if outlier.
        """
        is_outlier, _ = self.is_outlier(value)
        return None if is_outlier else value


class DataCleaner:
    """
    Comprehensive data cleaning: outlier removal, smoothing, interpolation.
    """
    
    def __init__(self, alpha: float = 0.3):
        """
        Args:
            alpha: Exponential moving average smoothing factor (0-1)
        """
        self.alpha = alpha
        self.ema_value = None
        self.outlier_detector = OutlierDetector()
        
    def clean_and_smooth(self, value: float) -> Dict[str, any]:
        """
        Clean and smooth sensor reading.
        
        Returns:
            Dict with 'raw', 'cleaned', 'smoothed', 'is_outlier', 'z_score'
        """
        # Check for outlier
        is_outlier, z_score = self.outlier_detector.is_outlier(value)
        
        # Use value if valid, otherwise use last EMA
        if is_outlier:
            cleaned_value = self.ema_value if self.ema_value is not None else value
        else:
            cleaned_value = value
        
        # Apply exponential moving average
        if self.ema_value is None:
            self.ema_value = cleaned_value
        else:
            self.ema_value = self.alpha * cleaned_value + (1 - self.alpha) * self.ema_value
        
        return {
            "raw": round(value, 2),
            "cleaned": round(cleaned_value, 2),
            "smoothed": round(self.ema_value, 2),
            "is_outlier": is_outlier,
            "z_score": round(z_score, 2)
        }


# Global instances for persistence across requests
_temp_filter = KalmanFilter1D(process_variance=0.01, measurement_variance=0.5)
_humidity_filter = KalmanFilter1D(process_variance=0.01, measurement_variance=1.0)
_pm25_filter = KalmanFilter1D(process_variance=0.05, measurement_variance=2.0)
_mq_cleaner = DataCleaner(alpha=0.4)  # More smoothing for noisy MQ sensor

_fusion_engine = MultiSensorFusion()
_fusion_engine.add_source("esp32", measurement_variance=0.8)
_fusion_engine.add_source("openweather", measurement_variance=0.3)
_fusion_engine.add_source("openaq", measurement_variance=0.5)


def filter_temperature(temp: float) -> Tuple[float, float]:
    """Apply Kalman filter to temperature reading."""
    return _temp_filter.update(temp)


def filter_humidity(humidity: float) -> Tuple[float, float]:
    """Apply Kalman filter to humidity reading."""
    return _humidity_filter.update(humidity)


def filter_pm25(pm25: float) -> Tuple[float, float]:
    """Apply Kalman filter to PM2.5 reading."""
    return _pm25_filter.update(pm25)


def clean_mq_data(mq_raw: float) -> Dict[str, any]:
    """Clean and smooth MQ-135 sensor data."""
    return _mq_cleaner.clean_and_smooth(mq_raw)


def fuse_environmental_data(measurements: Dict[str, Dict[str, Optional[float]]]) -> Dict[str, any]:
    """
    Fuse environmental data from multiple sources.
    
    Args:
        measurements: Dict with keys 'temp', 'humidity', 'pm25',
                     each containing dict mapping source -> value
                     
    Example:
        {
            "temp": {"esp32": 28.5, "openweather": 29.0},
            "humidity": {"esp32": 65.0, "openweather": 62.0},
            "pm25": {"openaq": 35.0}
        }
    
    Returns:
        Dict with fused values and metadata for each metric
    """
    result = {}
    
    for metric, sources in measurements.items():
        fused = _fusion_engine.fuse(sources)
        result[metric] = fused
    
    return result
