import React, { useState } from "react";
import axios from "axios";
import { Shield, Upload, Play, AlertCircle } from "lucide-react";

function ModelAuditPanel({ setResult }) {
  const [file, setFile] = useState(null);
  const [sensitiveCol, setSensitiveCol] = useState("race");
  const [targetCol, setTargetCol] = useState("loan_status");
  const [predictionCol, setPredictionCol] = useState("predicted_loan");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!file) return;
    try {
      setLoading(true);
      setError("");
      const formData = new FormData();
      formData.append("file", file);
      formData.append("sensitive_col", sensitiveCol);
      formData.append("target_col", targetCol);
      formData.append("prediction_col", predictionCol);

      const res = await axios.post("/audit/model", formData);
      setResult(res.data, {
        file,
        sensitive: sensitiveCol,
        target: targetCol,
        prediction: predictionCol,
      });
    } catch (err) {
      setError(err.response?.data?.detail || err.message || "Audit failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
          <Shield className="w-5 h-5" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">Model Fairness Audit</h2>
      </div>

      <div className="space-y-6">
        {/* File Upload */}
        <div className="relative border-2 border-dashed border-slate-200 rounded-xl p-8 text-center hover:border-emerald-400 transition-all group">
          <input 
            type="file" 
            onChange={(e) => setFile(e.target.files[0])}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <Upload className="w-8 h-8 text-slate-300 mx-auto mb-2 group-hover:text-emerald-400 group-hover:scale-110 transition-all" />
          <p className="text-sm font-medium text-slate-600">
            {file ? file.name : "Drop production predictions CSV"}
          </p>
        </div>

        {/* Form Fields */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sensitive Col</label>
            <input 
              value={sensitiveCol}
              onChange={(e) => setSensitiveCol(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ground Truth</label>
            <input 
              value={targetCol}
              onChange={(e) => setTargetCol(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Prediction</label>
            <input 
              value={predictionCol}
              onChange={(e) => setPredictionCol(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 text-red-600 text-xs font-medium">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        <button 
          onClick={handleSubmit}
          disabled={!file || loading}
          className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all disabled:opacity-50 transform active:scale-95 shadow-lg shadow-emerald-200"
        >
          {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Play className="w-5 h-5" />}
          Execute Performance Audit
        </button>
      </div>
    </div>
  );
}

export default ModelAuditPanel;