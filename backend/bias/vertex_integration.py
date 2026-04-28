import os
import pandas as pd
from google.cloud import aiplatform

def fetch_vertex_predictions(project_id: str, location: str, endpoint_id: str, instances: list):
    """
    Sends data to a deployed Vertex AI Endpoint to get predictions.
    This simulates pulling data from model monitoring or hitting an endpoint directly.
    """
    try:
        # Initialize vertex ai using credentials from environment
        aiplatform.init(project=project_id, location=location)
        
        # Build the endpoint path
        endpoint = aiplatform.Endpoint(
            endpoint_name=f"projects/{project_id}/locations/{location}/endpoints/{endpoint_id}"
        )
        
        # Call the endpoint
        response = endpoint.predict(instances=instances)
        return response.predictions
    except Exception as e:
        print(f"Failed to fetch predictions from Vertex AI Endpoint: {e}")
        return None

def audit_vertex_endpoint(df: pd.DataFrame, project_id: str, location: str, endpoint_id: str, 
                          sensitive_col: str, target_col: str):
    """
    Given a sample dataset (df), drops the target column, queries the Vertex AI Endpoint 
    for predictions, appends them, and returns a dataframe ready for model auditing.
    """
    # Assuming instances are the dataframe converted to dicts without the target
    if target_col in df.columns:
        features_df = df.drop(columns=[target_col])
    else:
        features_df = df
        
    instances = features_df.to_dict(orient="records")
    
    # Get predictions
    predictions = fetch_vertex_predictions(project_id, location, endpoint_id, instances)
    
    if predictions is None:
        raise ValueError("Could not get predictions from Vertex AI.")
        
    # Append predictions back to the original dataframe
    # Assuming the prediction returns a single float/int or dict with a 'prediction' key
    # If the model returns probability arrays, you would need parsing logic here.
    
    parsed_preds = []
    for p in predictions:
        if isinstance(p, dict) and "predicted_label" in p:
            parsed_preds.append(p["predicted_label"])
        elif isinstance(p, dict) and "prediction" in p:
            parsed_preds.append(p["prediction"])
        else:
            parsed_preds.append(p)
            
    df["vertex_prediction"] = parsed_preds
    return df
