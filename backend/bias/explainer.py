import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
import shap
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def explain_decision(df, row_index, target_col):
    """
    Trains a surrogate model on the dataframe and explains the decision for a specific row using SHAP.
    """
    try:
        logger.info(f"Explaining decision for row {row_index}, target {target_col}")
        df_work = df.copy()
        
        # Identify features before dropping rows to keep index consistent if possible
        # or just work with the row as it is in the original df
        original_row_data = df.iloc[row_index].copy()
        
        # Drop rows with missing target for training
        df_work = df_work.dropna(subset=[target_col])
        if len(df_work) < 2:
            return {"error": "Not enough data to train a surrogate model."}

        X = df_work.drop(columns=[target_col])
        y = df_work[target_col]
        
        # Simple encoding for categorical columns
        le_dict = {}
        for col in X.select_dtypes(include=['object']).columns:
            le = LabelEncoder()
            X[col] = le.fit_transform(X[col].astype(str).fillna("missing"))
            le_dict[col] = le
            
        # Handle numeric encoding
        X = X.fillna(0)
        
        # Train surrogate model (very fast)
        model = RandomForestClassifier(n_estimators=30, random_state=42)
        model.fit(X, y)
        
        # Prepare the single instance for explanation
        # We must apply the same encoding
        instance_raw = original_row_data.drop(labels=[target_col])
        instance_encoded = []
        for col in X.columns:
            val = instance_raw[col]
            if col in le_dict:
                try:
                    # Handle unseen labels by fitting if necessary or using a default
                    le = le_dict[col]
                    if str(val) in le.classes_:
                        instance_encoded.append(le.transform([str(val)])[0])
                    else:
                        instance_encoded.append(-1) # Unknown
                except:
                    instance_encoded.append(-1)
            else:
                try:
                    instance_encoded.append(float(val) if pd.notna(val) else 0)
                except:
                    instance_encoded.append(0)
                    
        instance = np.array(instance_encoded).reshape(1, -1)
        
        # SHAP Explainer
        explainer = shap.TreeExplainer(model)
        shap_values = explainer.shap_values(instance)
        
        # logger.info(f"SHAP values type: {type(shap_values)}")
        
        # Handle SHAP output shapes
        # For binary classification: 
        # - shap < 0.45: list of 2 arrays (one for each class)
        # - shap >= 0.45: sometimes single array or different structure
        if isinstance(shap_values, list):
            # For list (class 0, class 1), take class 1
            sv = shap_values[1] if len(shap_values) > 1 else shap_values[0]
            if len(sv.shape) == 2: sv = sv[0]
        elif len(shap_values.shape) == 3:
            # (rows, features, classes)
            sv = shap_values[0, :, 1]
        elif len(shap_values.shape) == 2:
            # (rows, features)
            sv = shap_values[0]
        else:
            sv = shap_values
            
        # Feature importance for this specific row
        importance = []
        feature_names = X.columns.tolist()
        
        for i, val in enumerate(sv):
            f_name = feature_names[i]
            importance.append({
                "feature": f_name,
                "impact": round(float(val), 4),
                "value": str(original_row_data.get(f_name, "N/A"))
            })
            
        # Sort by absolute impact
        importance = sorted(importance, key=lambda x: abs(x["impact"]), reverse=True)
        
        return {
            "row_index": row_index,
            "prediction": int(model.predict(instance)[0]),
            "explanations": importance[:8] 
        }
    except Exception as e:
        logger.error(f"Error in explainer: {str(e)}")
        return {"error": str(e)}
