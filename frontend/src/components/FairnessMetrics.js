import React, { useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';

const FairnessMetrics = ({ metrics, groupAnalysis }) => {
  const [activeTab, setActiveTab] = useState('statistical_parity');

  if (!metrics || !groupAnalysis) return null;

  const tabs = [
    { id: 'statistical_parity', label: 'Statistical Parity', metric: 'statistical_parity_diff' },
    { id: 'equal_opportunity', label: 'Equal Opportunity', metric: 'equal_opportunity_diff' },
    { id: 'predictive_parity', label: 'Predictive Parity', metric: 'predictive_parity_diff' },
  ];

  const chartData = Object.entries(groupAnalysis).map(([name, data]) => ({
    name,
    rate: data.selection_rate,
    tpr: data.tpr,
    precision: data.precision
  }));

  const activeMetricKey = tabs.find(t => t.id === activeTab).metric;
  const metricVal = metrics[activeMetricKey];

  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <h3 className="text-xl font-bold text-slate-800">Fairness Definitions</h3>
        <div className="flex bg-slate-100 p-1 rounded-xl">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id 
                ? 'bg-white text-slate-900 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                cursor={{ fill: '#f8fafc' }}
              />
              <Bar 
                dataKey={activeTab === 'statistical_parity' ? 'rate' : (activeTab === 'equal_opportunity' ? 'tpr' : 'precision')} 
                radius={[4, 4, 0, 0]} 
                barSize={40}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#6366f1' : '#f43f5e'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="flex flex-col justify-center items-center p-8 bg-slate-50 rounded-2xl border border-slate-100">
          <p className="text-slate-500 text-sm font-medium uppercase tracking-widest mb-2">Difference</p>
          <h4 className={`text-5xl font-black ${metricVal > 0.1 ? 'text-rose-500' : 'text-emerald-500'}`}>
            {metricVal.toFixed(3)}
          </h4>
          <div className="mt-6 text-center">
            <p className="text-xs text-slate-400 leading-relaxed font-semibold">
              {activeTab === 'statistical_parity' 
                ? 'Shows the difference in positive outcome rates between groups.' 
                : (activeTab === 'equal_opportunity' 
                    ? 'Shows the difference in True Positive Rates (Recall) across groups.'
                    : 'Shows the difference in Precision (Positive Predictive Value) across groups.')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FairnessMetrics;
