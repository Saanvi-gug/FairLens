import vertexai
from vertexai.generative_models import GenerativeModel as VertexGenerativeModel
from google import genai
import os
import logging
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

logger = logging.getLogger(__name__)

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
GCP_PROJECT_ID = os.environ.get("GCP_PROJECT_ID", "")
GCP_LOCATION = os.environ.get("GCP_LOCATION", "us-central1")
GOOGLE_APPLICATION_CREDENTIALS = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS", "")

vertex_configured = False
if GCP_PROJECT_ID and GOOGLE_APPLICATION_CREDENTIALS:
    try:
        vertexai.init(project=GCP_PROJECT_ID, location=GCP_LOCATION)
        vertex_configured = True
        logger.info("Vertex AI initialized successfully.")
    except Exception as e:
        logger.error(f"Failed to initialize Vertex AI: {e}")
else:
    logger.warning("GCP_PROJECT_ID or GOOGLE_APPLICATION_CREDENTIALS missing. Vertex AI not configured.")

gemini_configured = False
gemini_client = None
if GEMINI_API_KEY:
    try:
        gemini_client = genai.Client(api_key=GEMINI_API_KEY)
        gemini_configured = True
        logger.info("Gemini API (consumer) initialized successfully.")
    except Exception as e:
        logger.error(f"Failed to initialize Gemini API: {e}")
else:
    logger.warning("GEMINI_API_KEY missing. Consumer Gemini not configured.")

GEMINI_FALLBACK_MODELS = [
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-flash-latest',
]

def _generate_content_with_fallback(prompt: str) -> str:
    """Try Vertex AI first, then walk through the Gemini fallback model list."""
    import time

    if vertex_configured:
        try:
            model = VertexGenerativeModel('gemini-2.0-flash-001')
            response = model.generate_content(prompt)
            logger.info("Successfully generated insights using Vertex AI.")
            return response.text
        except Exception as e:
            logger.warning(f"Vertex AI failed: {str(e)}. Falling back to Gemini API.")

    if gemini_configured and gemini_client:
        for model_name in GEMINI_FALLBACK_MODELS:
            for attempt in range(3):  # up to 3 retries per model
                try:
                    response = gemini_client.models.generate_content(
                        model=model_name,
                        contents=prompt
                    )
                    logger.info(f"Successfully generated insights using {model_name}.")
                    return response.text
                except Exception as e:
                    err = str(e)
                    if '503' in err or 'UNAVAILABLE' in err:
                        wait = 2 ** attempt  # 1s, 2s, 4s
                        logger.warning(f"{model_name} attempt {attempt+1} got 503, retrying in {wait}s...")
                        time.sleep(wait)
                    else:
                        logger.warning(f"{model_name} failed ({err}), trying next model.")
                        break  # non-transient error, skip to next model
            else:
                logger.warning(f"{model_name} exhausted retries, trying next model.")

        return "AI insights temporarily unavailable due to high demand. Please retry in a moment."

    return "Error: Neither Vertex AI nor Gemini API is configured properly."


def get_fairness_narrative(metrics_data, audit_type="Model"):
    """
    Uses Vertex AI Gemini (with fallback to consumer API) to narrate the fairness findings.
    """
    prompt = f"""
    You are an AI Fairness Expert. Analyze the following {audit_type} audit results and provide:
    1. A human-centric explanation of what the bias metrics mean.
    2. A clear "Fix" recommendation (e.g. reweighting, adversarial debiasing).
    3. A risk assessment summary.

    Metrics Data:
    {metrics_data}

    Format the response in Markdown. Keep it professional, concise, and helpful for a compliance report.
    """
    return _generate_content_with_fallback(prompt)

def get_explanation_narrative(shap_data, prediction):
    """
    Uses Vertex AI Gemini (with fallback to consumer API) to explain an individual decision.
    """
    prompt = f"""
    Explain this specific AI decision in plain, empathetic English.
    The model predicted: {"Approved/Positive" if prediction == 1 else "Rejected/Negative"}.
    
    SHAP Feature Impacts (Top factors):
    {shap_data}

    Narrate why this decision was made and if any bias factors (like race or gender) played a significant role.
    Aim for a "Human-centric" explanation.
    """
    return _generate_content_with_fallback(prompt)

