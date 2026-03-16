import os
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI

load_dotenv()

key = os.getenv("GOOGLE_API_KEY")
print(f"Key loaded: {'HIDDEN' if key and key != 'your_gemini_api_key_here' else 'NOT_SET_OR_PLACEHOLDER'}")

if key and key != "your_gemini_api_key_here":
    try:
        llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash", google_api_key=key)
        response = llm.invoke("Hi")
        print("Success: API Key is valid!")
    except Exception as e:
        print(f"Error: {e}")
else:
    print("Error: GOOGLE_API_KEY is missing or still a placeholder.")
