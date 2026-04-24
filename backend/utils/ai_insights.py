import google.generativeai as genai
import os
import logging
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

logger = logging.getLogger(__name__)

# You can set this via environment variable GEMINI_API_KEY
API_KEY = os.environ.get("GEMINI_API_KEY", "")

if API_KEY:
    genai.configure(api_key=API_KEY)
else:
    logger.warning("GEMINI_API_KEY not found in environment variables.")

def get_fairness_narrative(metrics_data, audit_type="Model"):
    """
    Uses Gemini to narrate the fairness findings and recommend fixes.
    """
    if not API_KEY:
        return "Gemini API Key not configured. Please set GEMINI_API_KEY."

    try:
        model = genai.GenerativeModel('gemini-flash-latest')
        
        prompt = f"""
        You are an AI Fairness Expert. Analyze the following {audit_type} audit results and provide:
        1. A human-centric explanation of what the bias metrics mean.
        2. A clear "Fix" recommendation (e.g. reweighting, adversarial debiasing).
        3. A risk assessment summary.

        Metrics Data:
        {metrics_data}

        Format the response in Markdown. Keep it professional, concise, and helpful for a compliance report.
        """
        
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        logger.error(f"Gemini API error: {str(e)}")
        return f"Failed to generate AI insights: {str(e)}"

def get_explanation_narrative(shap_data, prediction):
    """
    Uses Gemini to explain an individual decision based on SHAP values.
    """
    if not API_KEY:
        return "Gemini API Key not configured."

    try:
        model = genai.GenerativeModel('gemini-flash-latest')
        
        prompt = f"""
        Explain this specific AI decision in plain, empathetic English.
        The model predicted: {"Approved/Positive" if prediction == 1 else "Rejected/Negative"}.
        
        SHAP Feature Impacts (Top factors):
        {shap_data}

        Narrate why this decision was made and if any bias factors (like race or gender) played a significant role.
        Aim for a "Human-centric" explanation.
        """
        
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        return f"Could not narrate explanation: {str(e)}"
