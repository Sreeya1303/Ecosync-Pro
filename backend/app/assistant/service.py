import os
import json
from openai import OpenAI
from .tools import TOOLS_SCHEMA, AVAILABLE_TOOLS

client = None

def get_client():
    global client
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return None
    if not client:
        client = OpenAI(api_key=api_key)
    return client

async def process_chat(user_message: str):
    client = get_client()
    if not client:
        return {
            "reply": "I cannot answer right now because the OPENAI_API_KEY is missing from the server environment.",
            "data": None
        }

    messages = [
        {"role": "system", "content": "You are a helpful IoT Assistant. You have access to real-time weather and IoT data tools. Use them to answer user questions. Always mention the source of your data (e.g. Open-Meteo, ThingSpeak). If a user asks for weather in a city, first geocode it, then get weather. Be concise."}
    ]
    messages.append({"role": "user", "content": user_message})

    try:
        # 1. First Call: Let model decide if it needs tools
        response = client.chat.completions.create(
            model="gpt-3.5-turbo", # Or gpt-4o
            messages=messages,
            tools=TOOLS_SCHEMA,
            tool_choice="auto"
        )
        
        response_message = response.choices[0].message
        tool_calls = response_message.tool_calls

        # 2. If tools are called, execute them
        if tool_calls:
            # Append the assistant's "thought process" (tool call request) to history
            messages.append(response_message)
            
            for tool_call in tool_calls:
                function_name = tool_call.function.name
                function_args = json.loads(tool_call.function.arguments)
                
                function_to_call = AVAILABLE_TOOLS.get(function_name)
                if function_to_call:
                    print(f"Executing Tool: {function_name} with {function_args}")
                    tool_output = function_to_call(**function_args)
                    
                    # Append result to history
                    messages.append({
                        "tool_call_id": tool_call.id,
                        "role": "tool",
                        "name": function_name,
                        "content": json.dumps(tool_output)
                    })
            
            # 3. Second Call: Get final natural language response
            final_response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=messages
            )
            return {"reply": final_response.choices[0].message.content, "data": None}
        
        else:
            # No tools needed, just return reply
            return {"reply": response_message.content, "data": None}

    except Exception as e:
        print(f"AI Error: {e}")
        return {"reply": "Sorry, I encountered an error connecting to the AI service.", "data": None}
