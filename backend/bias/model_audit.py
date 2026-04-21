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
		selection_rate = subset[prediction_col].mean()
		target_rate = subset[target_col].mean()

		result[group] = {
			"count": len(subset),
			"selection_rate": round(float(selection_rate), 3) if pd.notna(selection_rate) else None,
			"target_rate": round(float(target_rate), 3) if pd.notna(target_rate) else None,
		}

	selection_rates = [v["selection_rate"] for v in result.values() if v["selection_rate"] is not None]
	target_rates = [v["target_rate"] for v in result.values() if v["target_rate"] is not None]

	return {
		"group_analysis": result,
		"selection_rate_disparity": round(max(selection_rates) - min(selection_rates), 3) if selection_rates else 0,
		"tpr_disparity": round(max(target_rates) - min(target_rates), 3) if target_rates else 0,
	}
