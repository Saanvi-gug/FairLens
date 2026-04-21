import pandas as pd

def analyze_dataset(df, sensitive_col, target_col):
    if sensitive_col not in df.columns or target_col not in df.columns:
        raise ValueError(f"Columns '{sensitive_col}' or '{target_col}' not found.")
    
    if not df[target_col].dtype.kind in 'iufb':
        df[target_col] = pd.to_numeric(df[target_col], errors='coerce')
        if df[target_col].isnull().all():
            raise ValueError(f"Target column '{target_col}' must be numeric.")

    groups = df[sensitive_col].unique()
    result = {}

    for group in groups:
        subset = df[df[sensitive_col] == group]
        selection_rate = subset[target_col].mean()
        result[group] = {
            "count": len(subset),
            "selection_rate": round(selection_rate, 3)
        }

    # Simple disparity
    rates = [v["selection_rate"] for v in result.values() if v["selection_rate"] is not None]
    disparity = max(rates) - min(rates) if rates else 0

    return {
        "group_analysis": result,
        "disparity": round(disparity, 3)
    }