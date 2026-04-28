import React, { useState } from "react";
import axios from "axios";
import { Database, Upload, Play, AlertCircle } from "lucide-react";

function DatasetAuditPanel({ setResult }) {
  const [file, setFile] = useState(null);
  const [sensitiveCol, setSensitiveCol] = useState("gender");
  const [targetCol, setTargetCol] = useState("hired");
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

      const res = await axios.post("/audit/dataset", formData);
      setResult(res.data, {
        file,
        sensitive: sensitiveCol,
        target: targetCol,
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
        <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
          <Database className="w-5 h-5" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">Dataset Bias Audit</h2>
      </div>

      <div className="space-y-6">
        {/* File Upload */}
        <div className="relative border-2 border-dashed border-slate-200 rounded-xl p-8 text-center hover:border-indigo-400 transition-all group">
          <input 
            type="file" 
            onChange={(e) => setFile(e.target.files[0])}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <Upload className="w-8 h-8 text-slate-300 mx-auto mb-2 group-hover:text-indigo-400 group-hover:scale-110 transition-all" />
          <p className="text-sm font-medium text-slate-600">
            {file ? file.name : "Drop CSV dataset here"}
          </p>
          <p className="text-xs text-slate-400 mt-1">Maximum file size: 10MB</p>
        </div>

        {/* Form Fields */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sensitive Attribute</label>
            <input 
              value={sensitiveCol}
              onChange={(e) => setSensitiveCol(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              placeholder="e.g. race, gender"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Target Variable</label>
            <input 
              value={targetCol}
              onChange={(e) => setTargetCol(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              placeholder="e.g. hired, approved"
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
          className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:grayscale transform active:scale-95 shadow-lg shadow-indigo-200"
        >
          {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Play className="w-5 h-5 fill-current" />}
          Run Fairness Audit
        </button>
      </div>
    </div>
  );
}

export default DatasetAuditPanel;