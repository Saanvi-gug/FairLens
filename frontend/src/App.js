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

  const loadDemo = async (scenario) => {
    setLoading(true);
    try {
      const response = await axios.get(`/demo/${scenario}_bias`, { responseType: 'blob' });
      const file = new File([response.data], `${scenario}_bias.csv`, { type: 'text/csv' });
      setCurrentFile(file);
      
      if (scenario === 'hiring') {
        setParams({ sensitive: 'gender', target: 'hired' });
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
        const formData = new FormData();
        formData.append('file', file);
        formData.append('sensitive_col', 'race');
        formData.append('target_col', 'loan_status');
        formData.append('prediction_col', 'predicted_loan');
        const res = await axios.post('/audit/model', formData);
        setModelResult(res.data);
        setDatasetResult(null);
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

          {/* Audit Panels */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-8">
               <DatasetAuditPanel 
                setResult={(res) => {
                  setDatasetResult(res);
                  // Mock parameters for demo functionality after upload
                  setParams({ sensitive: 'gender', target: 'hired' });
                }} 
              />
               <ModelAuditPanel 
                setResult={(res) => {
                  setModelResult(res);
                  setParams({ sensitive: 'race', target: 'loan_status', prediction: 'predicted_loan' });
                }} 
              />
            </div>
            
            <div className="space-y-8">
               {(datasetResult || modelResult) && (
                 <>
                   <RecommendationCard 
                    risk={(modelResult || datasetResult).risk_level}
                    recommendations={(modelResult || datasetResult).recommendations}
                    ai_narrative={(modelResult || datasetResult).ai_narrative}
                   />
                   {modelResult && <FairnessMetrics metrics={modelResult.metrics} groupAnalysis={modelResult.group_analysis} />}
                   {explanation && <ExplanationView explanation={explanation} />}
                   
                   {/* Preview Table for Explanations */}
                   <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200">
                     <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                       Decision Audit Trail
                       <span className="text-[10px] bg-slate-100 px-2 py-1 rounded text-slate-500 font-bold uppercase">Audit any row</span>
                     </h3>
                     <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm border-separate border-spacing-y-2">
                          <thead>
                            <tr className="text-slate-400 font-bold">
                              <th className="pb-2 pl-2">ID</th>
                              <th className="pb-2">Attribute</th>
                              <th className="pb-2 text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {[0, 1, 2].map(idx => (
                              <tr key={idx} className="bg-slate-50 hover:bg-slate-100 rounded-xl">
                                <td className="py-3 px-4 font-bold text-slate-700">#Case {100 + idx}</td>
                                <td className="py-3">Demographic Group A</td>
                                <td className="py-3 pr-4 text-right">
                                  <button 
                                    onClick={() => handleExplain(idx)}
                                    className="p-1 px-3 bg-white border border-slate-200 rounded-lg text-indigo-600 font-bold hover:bg-indigo-50 transition-all flex items-center gap-1 ml-auto"
                                  >
                                    Explain <ChevronRight className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                     </div>
                   </div>
                 </>
               )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
