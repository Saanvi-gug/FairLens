import React, { useState, useEffect } from "react";
import axios from "axios";
import { 
  ShieldCheck, LayoutDashboard, FileText, Database, Settings, 
  Download, PlayCircle, Loader2, Menu, X, Rocket, ChevronRight,
  UserCheck, AlertTriangle
} from "lucide-react";
import DatasetAuditPanel from "./components/DatasetAuditPanel";
import ModelAuditPanel from "./components/ModelAuditPanel";
import RecommendationCard from "./components/RecommendationCard";
import FairnessMetrics from "./components/FairnessMetrics";
import ExplanationView from "./components/ExplanationView";

function App() {
  const [activeView, setActiveView] = useState('dashboard');
  const [datasetResult, setDatasetResult] = useState(null);
  const [modelResult, setModelResult] = useState(null);
  const [mitigationResult, setMitigationResult] = useState(null);
  const [mitigationError, setMitigationError] = useState("");
  const [explanation, setExplanation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // For Demo: we use these to send to export or explainer
  const [currentFile, setCurrentFile] = useState(null);
  const [params, setParams] = useState({ sensitive: '', target: '', prediction: '' });

  const handleExportPDF = async () => {
    if (!currentFile) return;
    setLoading(true);
    const formData = new FormData();
    formData.append('file', currentFile);
    formData.append('sensitive_col', params.sensitive);
    formData.append('target_col', params.target);
    if (params.prediction) formData.append('prediction_col', params.prediction);
    formData.append('audit_type', modelResult ? 'Model' : 'Dataset');

    try {
      const response = await axios.post('/export/pdf', formData, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'FairLens_Report.pdf');
      document.body.appendChild(link);
      link.click();
    } catch (error) {
      console.error("Export failed", error);
    } finally {
      setLoading(false);
    }
  };

  const handleExplain = async (index) => {
    if (!currentFile) return;
    setLoading(true);
    const formData = new FormData();
    formData.append('file', currentFile);
    formData.append('row_index', index);
    formData.append('target_col', params.target);

    try {
      const response = await axios.post('/audit/explain', formData);
      setExplanation(response.data);
    } catch (error) {
      console.error("Explanation failed", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMitigate = async () => {
    if (!currentFile || !params.prediction || !params.sensitive || !params.target) {
      setMitigationError("Upload and run a model audit first, then try auto-mitigation.");
      return;
    }

    setMitigationError("");
    setLoading(true);
    const formData = new FormData();
    formData.append('file', currentFile);
    formData.append('sensitive_col', params.sensitive);
    formData.append('target_col', params.target);
    formData.append('prediction_col', params.prediction);

    try {
      const response = await axios.post('/mitigate', formData);
      setMitigationResult(response.data);
    } catch (error) {
      setMitigationError(error.response?.data?.detail || "Mitigation failed. Check selected columns and file format.");
      console.error("Mitigation failed", error);
    } finally {
      setLoading(false);
    }
  };

  const loadDemo = async (scenario) => {
    setLoading(true);
    try {
      const response = await axios.get(`/demo/${scenario}_bias`, { responseType: 'blob' });
      const file = new File([response.data], `${scenario}_bias.csv`, { type: 'text/csv' });
      setCurrentFile(file);
      
      if (scenario === 'hiring') {
        setParams({ sensitive: 'gender', target: 'hired' });
        setMitigationError('');
        // Auto-run audit
        const formData = new FormData();
        formData.append('file', file);
        formData.append('sensitive_col', 'gender');
        formData.append('target_col', 'hired');
        const res = await axios.post('/audit/dataset', formData);
        setDatasetResult(res.data);
        setModelResult(null);
      } else {
        setParams({ sensitive: 'race', target: 'loan_status', prediction: 'predicted_loan' });
        setMitigationError('');
        const formData = new FormData();
        formData.append('file', file);
        formData.append('sensitive_col', 'race');
        formData.append('target_col', 'loan_status');
        formData.append('prediction_col', 'predicted_loan');
        const res = await axios.post('/audit/model', formData);
        setModelResult(res.data);
        setDatasetResult(null);
        setMitigationResult(null);
      }
    } catch (error) {
      console.error("Demo load failed", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      {/* Sidebar */}
      <aside className={`bg-slate-900 text-white transition-all duration-300 ${isSidebarOpen ? 'w-64' : 'w-20'} flex flex-col`}>
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          {isSidebarOpen && <span className="font-bold text-xl tracking-tight">FairLens AI</span>}
        </div>

        <nav className="flex-1 px-4 py-8 space-y-2">
          <button onClick={() => setActiveView('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeView === 'dashboard' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
            <LayoutDashboard className="w-5 h-5" />
            {isSidebarOpen && <span className="font-medium">Dashboard</span>}
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-slate-800 transition-all opacity-50 cursor-not-allowed">
            <Database className="w-5 h-5" />
            {isSidebarOpen && <span className="font-medium">ML Pipelines</span>}
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-slate-800 transition-all opacity-50 cursor-not-allowed">
            <Settings className="w-5 h-5" />
            {isSidebarOpen && <span className="font-medium">Settings</span>}
          </button>
        </nav>

        <div className="p-6">
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 w-full flex justify-center">
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center sticky top-0 z-10">
          <h2 className="text-xl font-bold text-slate-800 capitalize">
            {activeView}
          </h2>
          <div className="flex items-center gap-4">
            {(datasetResult || modelResult) && (
              <button 
                onClick={handleExportPDF}
                disabled={loading}
                className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-slate-800 transition-all disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                Export PDF Report
              </button>
            )}
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold border-2 border-white shadow-sm">
              SG
            </div>
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto space-y-8">
          {/* Hero Section */}
          <section className="premium-gradient p-8 rounded-3xl text-white relative overflow-hidden shadow-2xl">
            <div className="relative z-10 max-w-2xl">
              <span className="bg-indigo-500/30 text-indigo-300 text-[10px] font-bold uppercase tracking-[0.2em] px-3 py-1 rounded-full border border-indigo-500/20">
                Compliance Engine 2.0
              </span>
              <h1 className="text-4xl font-black mt-4 mb-4 leading-tight">
                Audit Your AI for <span className="text-indigo-400">Equity & Fairness</span>
              </h1>
              <p className="text-slate-400 text-lg leading-relaxed">
                Plug into your ML pipelines, detect bias across demographics, and generate 
                shareable compliance reports in a single click.
              </p>
              
              <div className="flex flex-wrap gap-4 mt-8">
                <button 
                  onClick={() => loadDemo('hiring')}
                  disabled={loading}
                  className="bg-white text-slate-900 px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:-translate-y-1 transition-all shadow-lg active:scale-95 disabled:opacity-75 disabled:cursor-wait"
                >
                  {loading ? <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" /> : <PlayCircle className="w-5 h-5 text-indigo-600" />}
                  {loading ? 'Analyzing...' : 'Try Hiring Demo'}
                </button>
                <button 
                  onClick={() => loadDemo('loan')}
                  disabled={loading}
                  className="bg-slate-800 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-slate-700 transition-all border border-slate-700 disabled:opacity-75 disabled:cursor-wait"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Rocket className="w-5 h-5" />}
                  {loading ? 'Analyzing...' : 'Try Loan Approval Demo'}
                </button>
              </div>
            </div>
            
            {/* Visual Decoration */}
            <div className="absolute top-0 right-0 w-1/2 h-full opacity-10 flex flex-col justify-center select-none pointer-events-none">
              <Database className="w-96 h-96 absolute -right-20 -top-20" />
              <ShieldCheck className="w-64 h-64 absolute right-1/4 -bottom-10" />
            </div>
          </section>

          {/* Integration Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { label: 'Pipeline Health', val: '98%', icon: ShieldCheck, color: 'text-emerald-500' },
              { label: 'Total Audits', val: '12', icon: FileText, color: 'text-indigo-500' },
              { label: 'Bias Risk', val: (modelResult || datasetResult)?.risk_level || 'Safe', icon: AlertTriangle, color: (modelResult || datasetResult)?.risk_level === 'High' ? 'text-rose-500' : 'text-emerald-500' },
              { label: 'Real-time Checks', val: 'Active', icon: UserCheck, color: 'text-sky-500' },
            ].map((stat, i) => (
              <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 flex items-center gap-4 hover:shadow-md transition-shadow">
                <div className={`p-3 rounded-xl bg-slate-50 ${stat.color}`}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">{stat.label}</p>
                  <p className="text-2xl font-black text-slate-800">{stat.val}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Audit Configuration */}
          <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="flex border-b border-slate-100 bg-slate-50/50 px-6 pt-6">
              <button 
                onClick={() => setActiveView('dataset')} 
                className={`pb-4 px-6 font-bold text-sm transition-all flex items-center gap-2 ${activeView === 'dataset' || activeView === 'dashboard' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <Database className="w-4 h-4" />
                Dataset Audit
              </button>
              <button 
                onClick={() => setActiveView('model')} 
                className={`pb-4 px-6 font-bold text-sm transition-all flex items-center gap-2 ${activeView === 'model' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <Rocket className="w-4 h-4" />
                Model Audit
              </button>
            </div>
            
            <div className="p-8 bg-white max-w-3xl">
              {(activeView === 'dataset' || activeView === 'dashboard') ? (
                <DatasetAuditPanel 
                  setResult={(res, context) => {
                    setDatasetResult(res);
                    setModelResult(null);
                    setMitigationResult(null);
                    setMitigationError('');
                    if (context?.file) {
                      setCurrentFile(context.file);
                      setParams({ sensitive: context.sensitive, target: context.target, prediction: '' });
                    }
                  }} 
                />
              ) : (
                <ModelAuditPanel 
                  setResult={(res, context) => {
                    setModelResult(res);
                    setDatasetResult(null);
                    setMitigationResult(null);
                    setMitigationError('');
                    if (context?.file) {
                      setCurrentFile(context.file);
                      setParams({
                        sensitive: context.sensitive,
                        target: context.target,
                        prediction: context.prediction,
                      });
                    }
                  }} 
                />
              )}
            </div>
          </div>

          {/* Results Section */}
          {(datasetResult || modelResult) && (
            <div className="mt-12 space-y-8 animate-fade-in border-t-2 border-slate-100 pt-12">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-indigo-500 rounded-xl text-white shadow-lg shadow-indigo-200">
                     <ShieldCheck className="w-8 h-8" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-black text-slate-800 tracking-tight">Audit Findings</h2>
                    <p className="text-slate-500 font-medium mt-1">Comprehensive fairness analysis and mitigation options.</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column: Recommendations & Mitigation */}
                <div className="lg:col-span-4 space-y-8">
                  <RecommendationCard 
                    risk={(modelResult || datasetResult).risk_level}
                    recommendations={(modelResult || datasetResult).recommendations}
                    ai_narrative={(modelResult || datasetResult).ai_narrative}
                    fairness_score={(modelResult || datasetResult).fairness_score}
                  />

                  {!mitigationResult && modelResult && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-8 text-center shadow-lg hover:shadow-xl transition-all">
                      <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-emerald-600">
                        <Settings className="w-8 h-8" />
                      </div>
                      <h4 className="text-xl text-emerald-900 font-black mb-2">Automated Mitigation</h4>
                      <p className="text-emerald-700 text-sm font-medium mb-6">Apply algorithmic mitigation to balance predictions and improve your fairness score.</p>
                      
                      <button 
                        onClick={handleMitigate}
                        disabled={loading}
                        className="w-full bg-emerald-600 text-white px-6 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200"
                      >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Run Auto-Mitigate'}
                      </button>
                      {mitigationError && (
                        <p className="mt-4 text-sm text-rose-600 font-medium bg-rose-50 p-3 rounded-lg">{mitigationError}</p>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Right Column: Metrics, Mitigation Results, Explainers */}
                <div className="lg:col-span-8 space-y-8">
                  {modelResult && !mitigationResult && (
                    <FairnessMetrics metrics={modelResult.metrics} groupAnalysis={modelResult.group_analysis} />
                  )}

                  {mitigationResult && (
                    <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-200 space-y-8 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-full blur-3xl opacity-50 -z-10 translate-x-1/2 -translate-y-1/2" />
                      
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600">
                          <Settings className="w-6 h-6" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-800">Mitigation Analysis</h3>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="p-6 bg-slate-50 border border-slate-100 rounded-2xl text-center">
                          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Before</p>
                          <p className="text-5xl font-black text-slate-800 mb-2">{mitigationResult.before_metrics.fairness_score}<span className="text-2xl text-slate-400">/100</span></p>
                          <p className="text-sm font-medium text-slate-500">Initial Fairness Score</p>
                        </div>
                        <div className="p-6 bg-emerald-600 rounded-2xl text-center text-white shadow-lg shadow-emerald-200">
                          <p className="text-sm font-bold text-emerald-200 uppercase tracking-widest mb-4">After</p>
                          <p className="text-5xl font-black mb-2">{mitigationResult.after_metrics.fairness_score}<span className="text-2xl text-emerald-300">/100</span></p>
                          <p className="text-sm font-medium text-emerald-100">Post-Mitigation Score</p>
                        </div>
                      </div>
                      
                      <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                        <p className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-6">Key Metric Improvements</p>
                        <div className="grid grid-cols-3 gap-6 text-center">
                          <div>
                            <p className="text-[10px] text-slate-500 uppercase font-bold mb-2">Statistical Parity</p>
                            <div className="flex items-center justify-center gap-2">
                              <span className="text-slate-400 line-through">{mitigationResult.before_metrics.metrics.statistical_parity_diff.toFixed(2)}</span>
                              <ChevronRight className="w-4 h-4 text-emerald-500" />
                              <span className="text-emerald-600 font-black text-lg">{mitigationResult.after_metrics.metrics.statistical_parity_diff.toFixed(2)}</span>
                            </div>
                          </div>
                          <div>
                            <p className="text-[10px] text-slate-500 uppercase font-bold mb-2">Equal Opportunity</p>
                            <div className="flex items-center justify-center gap-2">
                              <span className="text-slate-400 line-through">{mitigationResult.before_metrics.metrics.equal_opportunity_diff.toFixed(2)}</span>
                              <ChevronRight className="w-4 h-4 text-emerald-500" />
                              <span className="text-emerald-600 font-black text-lg">{mitigationResult.after_metrics.metrics.equal_opportunity_diff.toFixed(2)}</span>
                            </div>
                          </div>
                          <div>
                            <p className="text-[10px] text-slate-500 uppercase font-bold mb-2">Predictive Parity</p>
                            <div className="flex items-center justify-center gap-2">
                              <span className="text-slate-400 line-through">{mitigationResult.before_metrics.metrics.predictive_parity_diff.toFixed(2)}</span>
                              <ChevronRight className="w-4 h-4 text-emerald-500" />
                              <span className="text-emerald-600 font-black text-lg">{mitigationResult.after_metrics.metrics.predictive_parity_diff.toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {explanation && <ExplanationView explanation={explanation} />}
                  
                  {/* Preview Table for Explanations */}
                  <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-200">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        Decision Audit Trail
                      </h3>
                      <span className="text-xs bg-slate-100 px-3 py-1.5 rounded-lg text-slate-500 font-bold uppercase tracking-wider">Sample Records</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm border-separate border-spacing-y-3">
                        <thead>
                          <tr className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                            <th className="pb-2 pl-4">Record ID</th>
                            <th className="pb-2">Protected Class Status</th>
                            <th className="pb-2 text-right pr-4">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[0, 1, 2].map(idx => (
                            <tr key={idx} className="bg-slate-50 hover:bg-indigo-50/50 transition-colors rounded-xl group">
                              <td className="py-4 px-4 font-bold text-slate-700 rounded-l-xl">#Case_10{idx}</td>
                              <td className="py-4 text-slate-600 font-medium">Demographic Group A</td>
                              <td className="py-4 pr-4 text-right rounded-r-xl">
                                <button 
                                  onClick={() => handleExplain(idx)}
                                  className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-indigo-600 font-bold group-hover:border-indigo-200 group-hover:bg-indigo-50 transition-all flex items-center gap-2 ml-auto shadow-sm active:scale-95"
                                >
                                  Explain Case <ChevronRight className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
