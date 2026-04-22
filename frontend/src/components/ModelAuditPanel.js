import React, { useState } from "react";
import axios from "axios";
import UploadBox from "./UploadBox";

function ModelAuditPanel({ setResult }) {
  const [file, setFile] = useState(null);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    try {
      setError("");
      const formData = new FormData();
      formData.append("file", file);
      formData.append("sensitive_col", "gender");
      formData.append("target_col", "selected");
      formData.append("prediction_col", "predicted");

      const res = await axios.post("/audit/model", formData);
      setData(res.data);
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || "Request failed");
    }
  };

  return (
    <div style={{ border: "1px solid gray", padding: "10px", width: "50%" }}>
      <h2>Model Fairness Audit</h2>

      <UploadBox onFileChange={setFile} onSubmit={handleSubmit} />

      {error && <p style={{ color: "crimson" }}>{error}</p>}

      {data && (
        <>
          <pre>{JSON.stringify(data, null, 2)}</pre>
          <h4>Selection Rate Disparity: {data.selection_rate_disparity}</h4>
          <h4>TPR Disparity: {data.tpr_disparity}</h4>
        </>
      )}
    </div>
  );
}

export default ModelAuditPanel;