from fastapi import FastAPI, UploadFile, Form, File
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import io
from fastapi import HTTPException
from bias.dataset_audit import analyze_dataset
from bias.model_audit import analyze_model

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
        return result
    except Exception as e:
        print(f"Error in audit_model: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

from bias.mitigation import mitigate_bias

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