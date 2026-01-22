import os
import google.generativeai as genai
from google.generativeai.types import FunctionDeclaration, Tool
from .tools import GEMINI_TOOLS, AVAILABLE_TOOLS

# Configure Gemini
api_key = os.getenv("GEMINI_API_KEY")
if api_key:
    genai.configure(api_key=api_key)

model = None

def get_model():
    global model
    if not api_key:
        return None
    
    if not model:
        # Create the model with tools
        tools = genai.protos.Tool(function_declarations=[
             # We rely on the SDK's auto-conversion or define manual if SDK fails auto-inspect
             # For simplicity in this environment, let's trust the auto-tool detection if using genai.GenerativeModel(tools=...)
             # But the safest way for "google-generativeai" is just passing the function list.
             # SDK automatically inspects docstrings.
        ])
        
        # Initialize Gemini Pro
        model = genai.GenerativeModel(
            model_name='gemini-2.0-flash', # Fast and smart
            tools=GEMINI_TOOLS
        )
    return model

async def process_chat(user_message: str):
    try:
        chat_model = get_model()
        if not chat_model:
             return {
                "reply": "I cannot answer because the GEMINI_API_KEY is missing.",
                "data": None
            }

        # Start a chat session (stateless for this API, but we simulate one-turn)
        chat = chat_model.start_chat(enable_automatic_function_calling=True)
        
        # System instruction is implicit in the prompt or added as context
        system_prompt = "You are a helpful IoT Assistant. Use the available tools to fetch real-time weather and IoT data. Always cite sources. If asked for weather in a city, geocode it first."
        
        response = chat.send_message(f"{system_prompt}\n\nUser: {user_message}")
        
        return {"reply": response.text, "data": None}

    except Exception as e:
        print(f"Gemini AI Error: {e}")
        return {"reply": "Sorry, I encountered an error connecting to the Gemini AI service.", "data": None}
