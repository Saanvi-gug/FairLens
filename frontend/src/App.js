import React, { useState } from "react";
import axios from "axios";
import DatasetAuditPanel from "./components/DatasetAuditPanel";
import ModelAuditPanel from "./components/ModelAuditPanel";
import MitigationPanel from "./components/MitigationPanel";

function App() {
  const [datasetResult, setDatasetResult] = useState(null);
  const [modelResult, setModelResult] = useState(null);
  const [mitigationResult, setMitigationResult] = useState(null);

  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <h1>FairLens AI Dashboard</h1>

      <div style={{ display: "flex", gap: "20px" }}>
        <DatasetAuditPanel setResult={setDatasetResult} />
        <ModelAuditPanel setResult={setModelResult} />
      </div>

      <MitigationPanel
        datasetResult={datasetResult}
        modelResult={modelResult}
        setMitigationResult={setMitigationResult}
      />
    </div>
  );
}

export default App;
