from fastapi import APIRouter
from pydantic import BaseModel
from app.assistant.service import process_chat

router = APIRouter(prefix="/api/assistant", tags=["assistant"])

class ChatRequest(BaseModel):
    message: str

@router.post("/chat")
async def chat_endpoint(request: ChatRequest):
    result = await process_chat(request.message)
    return result
