import sys
import os
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))
API_KEY = os.environ.get("GEMINI_API_KEY", "")

if not API_KEY:
    print("NO API KEY")
    sys.exit(1)

genai.configure(api_key=API_KEY)
print("Testing gemini-flash-latest...")
try:
    model = genai.GenerativeModel('gemini-flash-latest')
    response = model.generate_content("Hello! Say Hi!")
    print(response.text)
except Exception as e:
    print(f"Exception: {e}")
