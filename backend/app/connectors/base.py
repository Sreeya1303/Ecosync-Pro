from abc import ABC, abstractmethod

class BaseConnector(ABC):
    def __init__(self, device_id: str, config: dict):
        self.device_id = device_id
        self.config = config

    @abstractmethod
    def fetch_data(self):
        """
        Fetches the latest sensor data from the device or source.
        Returns a dictionary matching the Unified Sensor Data structure:
        {
            "ts": 170000000,
            "metrics": { ... },
            "status": "online",
            "source_ts": 170000000 (Optional: Actual time from source)
        }
        """
        pass
    
    @abstractmethod
    def get_history(self, range_str: str):
        """
        Returns historical data points.
        range_str: "1h", "6h", "24h"
        """
        pass
