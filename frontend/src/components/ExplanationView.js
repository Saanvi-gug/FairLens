import React from 'react';
import { motion } from 'framer-motion';

const ExplanationView = ({ explanation }) => {
  if (!explanation) return null;

  if (explanation.error) {
    return (
      <div className="p-6 bg-red-50 rounded-2xl border border-red-200 text-red-700">
        <h3 className="font-bold mb-2">Explanation Error</h3>
        <p className="text-sm">{explanation.error}</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-2xl shadow-lg border border-slate-200">
      <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
        Individual Decision Logic
        <span className="text-xs font-normal bg-blue-100 text-blue-700 px-2 weight-bold py-1 rounded-full">
          SHAP Analysis
        </span>
      </h3>
      
      <div className="space-y-4">
        {explanation.explanations.map((item, index) => {
          const isPositive = item.impact > 0;
          const percentage = Math.min(Math.abs(item.impact) * 800, 100); // Scaled for demo
          
          return (
            <motion.div 
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="space-y-1"
            >
              <div className="flex justify-between items-center text-sm">
                <span className="font-semibold text-slate-700">
                  {item.feature} <span className="font-normal text-slate-400">({item.value})</span>
                </span>
                <span className={`font-mono font-bold ${isPositive ? 'text-rose-500' : 'text-emerald-500'}`}>
                  {isPositive ? '+' : ''}{item.impact.toFixed(3)}
                </span>
              </div>
              
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex">
                {isPositive ? (
                  <>
                    <div className="w-1/2" />
                    <div 
                      className="bg-rose-400 h-full rounded-r-full" 
                      style={{ width: `${percentage/2}%` }}
                    />
                  </>
                ) : (
                  <>
                    <div className="w-1/2 flex justify-end">
                      <div 
                        className="bg-emerald-400 h-full rounded-l-full" 
                        style={{ width: `${percentage/2}%` }}
                      />
                    </div>
                    <div className="w-1/2" />
                  </>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
      
      <div className="mt-8 p-4 bg-slate-50 rounded-xl text-center mb-6">
        <p className="text-sm text-slate-500">
          Result: <span className="font-bold text-slate-900">{explanation.prediction === 1 ? 'Approved' : 'Rejected'}</span>
        </p>
        <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-tighter">
          Surrogate Model confidence: High
        </p>
      </div>

      {explanation.ai_narrative && (
        <div className="mt-6 border-t border-slate-100 pt-6">
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-5 relative overflow-hidden">
             {/* sparkles bg element */}
             <div className="absolute -top-6 -right-6 w-24 h-24 bg-indigo-200 rounded-full blur-2xl opacity-50 pointer-events-none"></div>
             
             <h4 className="flex items-center gap-2 text-indigo-800 font-bold mb-3 text-sm tracking-wide uppercase">
               <span className="bg-white p-1 rounded-md text-indigo-600 shadow-sm border border-indigo-50">✨</span> 
               Gemini Humanized Explanation
             </h4>
             <div className="text-indigo-900/80 text-sm leading-relaxed whitespace-pre-wrap font-medium">
               {explanation.ai_narrative.replace(/\*\*/g, '')}
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExplanationView;
