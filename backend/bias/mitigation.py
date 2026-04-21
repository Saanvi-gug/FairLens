import pandas as pd

def mitigate_bias(df, sensitive_col, target_col, prediction_col):
    df = df.copy()

    missing_columns = [
        column
        for column in (sensitive_col, target_col, prediction_col)
        if column not in df.columns
    ]
    if missing_columns:
        raise ValueError(f"Columns not found: {', '.join(missing_columns)}")

    # Ensure prediction column is numeric so mean/threshold logic is valid.
    if not df[prediction_col].dtype.kind in "iufb":
        df[prediction_col] = pd.to_numeric(df[prediction_col], errors="coerce")
        if df[prediction_col].isnull().all():
            raise ValueError(f"Column '{prediction_col}' must be numeric.")

    groups = df[sensitive_col].unique()

    # Calculate selection rates
    rates = {}
    for g in groups:
        rates[g] = df[df[sensitive_col] == g][prediction_col].mean()

    max_rate = max(rates.values())

    # Adjust predictions (simple threshold balancing)
    new_predictions = []

    for _, row in df.iterrows():
        group = row[sensitive_col]
        pred = row[prediction_col]

        # If group is disadvantaged, boost chances
        if rates[group] < max_rate:
            if pred == 0:
                # flip some negatives probabilistically
                new_pred = 1 if rates[group] + 0.2 <= max_rate else pred
            else:
                new_pred = pred
        else:
            new_pred = pred

        new_predictions.append(new_pred)

    df["mitigated_prediction"] = new_predictions

    return {
        "message": "Bias mitigation applied",
        "preview": df.head().to_dict()
    }