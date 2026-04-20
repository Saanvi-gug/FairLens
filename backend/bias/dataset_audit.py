def analyze_dataset(df, sensitive_col, target_col):
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
    rates = [v["selection_rate"] for v in result.values()]
    disparity = max(rates) - min(rates)

    return {
        "group_analysis": result,
        "disparity": round(disparity, 3)
    }