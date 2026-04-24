import pandas as pd


def analyze_model(df, sensitive_col, target_col, prediction_col):
	missing_columns = [
		column
		for column in (sensitive_col, target_col, prediction_col)
		if column not in df.columns
	]
	if missing_columns:
		raise ValueError(f"Columns not found: {', '.join(missing_columns)}")

	working_df = df.copy()
	for column in (target_col, prediction_col):
		if not working_df[column].dtype.kind in "iufb":
			working_df[column] = pd.to_numeric(working_df[column], errors="coerce")
			if working_df[column].isnull().all():
				raise ValueError(f"Column '{column}' must be numeric.")

	groups = working_df[sensitive_col].dropna().unique()
	result = {}

	for group in groups:
		subset = working_df[working_df[sensitive_col] == group]
		positives = subset[subset[target_col] == 1]
		predicted_positives = subset[subset[prediction_col] == 1]
		
		selection_rate = subset[prediction_col].mean()
		tpr = positives[prediction_col].mean() if len(positives) > 0 else 0
		precision = predicted_positives[target_col].mean() if len(predicted_positives) > 0 else 0

		result[group] = {
			"count": len(subset),
			"selection_rate": round(float(selection_rate), 3),
			"tpr": round(float(tpr), 3),
			"precision": round(float(precision), 3),
		}

	selection_rates = [v["selection_rate"] for v in result.values()]
	tprs = [v["tpr"] for v in result.values()]
	precisions = [v["precision"] for v in result.values()]

	statistical_parity_diff = max(selection_rates) - min(selection_rates)
	equal_opportunity_diff = max(tprs) - min(tprs)
	predictive_parity_diff = max(precisions) - min(precisions)

	disparity = max(statistical_parity_diff, equal_opportunity_diff)
	risk_level = "Low"
	if disparity > 0.15: risk_level = "High"
	elif disparity > 0.05: risk_level = "Medium"

	return {
		"group_analysis": result,
		"metrics": {
			"statistical_parity_diff": round(statistical_parity_diff, 3),
			"equal_opportunity_diff": round(equal_opportunity_diff, 3),
			"predictive_parity_diff": round(predictive_parity_diff, 3),
		},
		"risk_level": risk_level,
		"recommendations": [
			"Use reweighting to improve fairness with minimal accuracy loss",
			"Check if certain features are acting as proxies for the sensitive attribute",
			"Consider post-processing to equalize odds if parity is required"
		] if risk_level != "Low" else ["Model fairness is within acceptable bounds."]
	}
