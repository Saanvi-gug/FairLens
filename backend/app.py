from fastapi import FastAPI, UploadFile, Form, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import pandas as pd
import io
from bias.dataset_audit import analyze_dataset
from bias.model_audit import analyze_model
from bias.mitigation import mitigate_bias
from bias.explainer import explain_decision
from utils.report_generator import generate_fairness_report
from utils.ai_insights import get_fairness_narrative, get_explanation_narrative

app = FastAPI()

# Allow the React dev server to call this API from the browser.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/audit/dataset")
async def audit_dataset(
    file: UploadFile = File(...),
    sensitive_col: str = Form(...),
    target_col: str = Form(...)
):
    try:
        print(f"Received audit request for file: {file.filename}")
        contents = await file.read()
        df = pd.read_csv(io.BytesIO(contents))
        print(f"File parsed successfully. Rows: {len(df)}")
        
        result = analyze_dataset(df, sensitive_col, target_col)
        
        # Add Gemini Narrative
        result["ai_narrative"] = get_fairness_narrative(result, "Dataset")
        return result
    except Exception as e:
        print(f"Error in audit_dataset: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/audit/model")
async def audit_model(
    file: UploadFile = File(...),
    sensitive_col: str = Form(...),
    target_col: str = Form(...),
    prediction_col: str = Form(...)
):
    try:
        print(f"Received model audit request for file: {file.filename}")
        contents = await file.read()
        df = pd.read_csv(io.BytesIO(contents))
        print(f"File parsed successfully. Rows: {len(df)}")

        result = analyze_model(df, sensitive_col, target_col, prediction_col)
        
        # Add Gemini Narrative
        result["ai_narrative"] = get_fairness_narrative(result, "Model")
        return result
    except Exception as e:
        print(f"Error in audit_model: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/mitigate")
async def mitigate(
    file: UploadFile = File(...),
    sensitive_col: str = Form(...),
    target_col: str = Form(...),
    prediction_col: str = Form(...)
):
    try:
        contents = await file.read()
        df = pd.read_csv(io.BytesIO(contents))
        result = mitigate_bias(df, sensitive_col, target_col, prediction_col)
        return result
    except Exception as e:
        print(f"Error in mitigate: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/audit/explain")
async def audit_explain(
    file: UploadFile = File(...),
    row_index: int = Form(...),
    target_col: str = Form(...)
):
    try:
        contents = await file.read()
        df = pd.read_csv(io.BytesIO(contents))
        result = explain_decision(df, row_index, target_col)
        
        # Add Gemini Narrative for the decision
        if "error" not in result:
            result["ai_narrative"] = get_explanation_narrative(result["explanations"], result["prediction"])
            
        return result
    except Exception as e:
        print(f"Error in audit_explain: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/export/pdf")
async def export_pdf(
    file: UploadFile = File(...),
    sensitive_col: str = Form(...),
    target_col: str = Form(...),
    prediction_col: str = Form(None),
    audit_type: str = Form("Dataset")
):
    try:
        contents = await file.read()
        df = pd.read_csv(io.BytesIO(contents))
        
        if audit_type == "Dataset":
            result = analyze_dataset(df, sensitive_col, target_col)
            result["ai_narrative"] = get_fairness_narrative(result, "Dataset")
        else:
            result = analyze_model(df, sensitive_col, target_col, prediction_col)
            result["ai_narrative"] = get_fairness_narrative(result, "Model")
            
        pdf_buffer = generate_fairness_report(result, audit_type)
        return StreamingResponse(
            pdf_buffer,
            media_type="application/pdf",
            headers={"Content-Disposition": "attachment; filename=FairLens_Audit_Report.pdf"}
        )
    except Exception as e:
        print(f"Error in export_pdf: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

# Concept endpoint for "API Integration"
@app.post("/api/check")
async def api_check(data: dict):
    # This would normally take a single prediction request and return fairness context
    return {
        "status": "success",
        "fairness_context": "Real-time check active",
        "disparity_warning": False,
        "recommendation": "Maintain current model parameters"
    }

@app.post("/audit/vertex_endpoint")
async def audit_vertex(
    file: UploadFile = File(...),
    project_id: str = Form(...),
    location: str = Form(...),
    endpoint_id: str = Form(...),
    sensitive_col: str = Form(...),
    target_col: str = Form(...)
):
    try:
        print(f"Received Vertex audit request for endpoint: {endpoint_id}")
        contents = await file.read()
        df = pd.read_csv(io.BytesIO(contents))
        
        # Import here to avoid circular dependencies if any
        from bias.vertex_integration import audit_vertex_endpoint
        
        # This will append a 'vertex_prediction' column to df
        df_with_preds = audit_vertex_endpoint(
            df, project_id, location, endpoint_id, sensitive_col, target_col
        )
        
        # Now run the standard model audit
        result = analyze_model(df_with_preds, sensitive_col, target_col, "vertex_prediction")
        
        # Add Vertex AI Gemini Narrative
        result["ai_narrative"] = get_fairness_narrative(result, "Vertex AI Model Endpoint")
        return result
    except Exception as e:
        print(f"Error in audit_vertex_endpoint: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/demo/{scenario}")
async def get_demo(scenario: str):
    path = f"../sample_data/{scenario}.csv"
    try:
        with open(path, "rb") as f:
            content = f.read()
        return StreamingResponse(
            io.BytesIO(content),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={scenario}.csv"}
        )
    except Exception as e:
        raise HTTPException(status_code=404, detail="Demo scenario not found")