from fastapi import FastAPI, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
from bias.dataset_audit import analyze_dataset

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
    file: UploadFile,
    sensitive_col: str = Form(...),
    target_col: str = Form(...)
):
    df = pd.read_csv(file.file)
    result = analyze_dataset(df, sensitive_col, target_col)
    return result