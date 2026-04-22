import React, { useState } from "react";
import axios from "axios";
import UploadBox from "./UploadBox";
import ChartView from "./ChartView";

function DatasetAuditPanel({ setResult }) {
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

      const res = await axios.post("/audit/dataset", formData);
      setData(res.data);
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || "Request failed");
    }
  };

  return (
    <div style={{ border: "1px solid gray", padding: "10px", width: "50%" }}>
      <h2>Data Fairness Audit</h2>

      <UploadBox onFileChange={setFile} onSubmit={handleSubmit} />

      {error && <p style={{ color: "crimson" }}>{error}</p>}

      {data && (
        <>
          <pre>{JSON.stringify(data, null, 2)}</pre>
          <ChartView data={data.group_analysis} />
          <h4>Disparity: {data.disparity}</h4>
        </>
      )}
    </div>
  );
}

export default DatasetAuditPanel;