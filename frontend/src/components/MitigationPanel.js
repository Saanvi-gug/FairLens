import React, { useState } from "react";
import axios from "axios";

function MitigationPanel({ datasetResult, modelResult, setMitigationResult }) {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const handleMitigate = async () => {
    try {
      setError("");
      const formData = new FormData();
      formData.append("file", file);
      formData.append("sensitive_col", "gender");
      formData.append("target_col", "selected");
      formData.append("prediction_col", "predicted");

      const res = await axios.post("/mitigate", formData);
      setResult(res.data);
      setMitigationResult(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || "Request failed");
    }
  };

  return (
    <div style={{ marginTop: "30px", border: "2px solid black", padding: "15px" }}>
      <h2>Bias Mitigation</h2>

      <input type="file" onChange={(e) => setFile(e.target.files[0])} />
      <button onClick={handleMitigate}>Fix Bias</button>

      {error && <p style={{ color: "crimson" }}>{error}</p>}

      {result && (
        <>
          <h3>{result.message}</h3>
          <pre>{JSON.stringify(result.preview, null, 2)}</pre>
        </>
      )}
    </div>
  );
}

export default MitigationPanel;