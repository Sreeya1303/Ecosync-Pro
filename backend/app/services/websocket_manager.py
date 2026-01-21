from typing import List, Dict
from fastapi import WebSocket

class ConnectionManager:
    def __init__(self):
        # active_connections: { "device_id": [WebSocket, WebSocket...] }
        # This allows multiple clients (dashboards) to watch the same device
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, device_id: str):
        await websocket.accept()
        if device_id not in self.active_connections:
            self.active_connections[device_id] = []
        self.active_connections[device_id].append(websocket)
        print(f"WS: Client connected to {device_id}")

    def disconnect(self, websocket: WebSocket, device_id: str):
        if device_id in self.active_connections:
            if websocket in self.active_connections[device_id]:
                self.active_connections[device_id].remove(websocket)
            if not self.active_connections[device_id]:
                del self.active_connections[device_id]
        print(f"WS: Client disconnected from {device_id}")

    async def broadcast(self, message: dict, device_id: str):
        if device_id in self.active_connections:
            for connection in self.active_connections[device_id]:
                try:
                    await connection.send_json(message)
                except Exception as e:
                    print(f"WS Error broadcasting to {device_id}: {e}")

manager = ConnectionManager()
