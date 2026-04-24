import React from 'react';
import { AlertCircle, CheckCircle, Info, ArrowRight } from 'lucide-react';

const RecommendationCard = ({ risk, recommendations, ai_narrative }) => {
  const isHighRisk = risk === 'High';
  const isMediumRisk = risk === 'Medium';
  const isLowRisk = risk === 'Low';

  const getIcon = () => {
    if (isHighRisk) return <AlertCircle className="w-6 h-6 text-red-500" />;
    if (isMediumRisk) return <AlertCircle className="w-6 h-6 text-amber-500" />;
    return <CheckCircle className="w-6 h-6 text-emerald-500" />;
  };

  const getBgColor = () => {
    if (isHighRisk) return 'bg-red-50 border-red-200';
    if (isMediumRisk) return 'bg-amber-50 border-amber-200';
    return 'bg-emerald-50 border-emerald-200';
  };

  const getTextColor = () => {
    if (isHighRisk) return 'text-red-800';
    if (isMediumRisk) return 'text-amber-800';
    return 'text-emerald-800';
  };

  return (
    <div className={`p-6 rounded-2xl border-2 ${getBgColor()} transition-all duration-300 shadow-sm`}>
      <div className="flex items-center gap-3 mb-4">
        {getIcon()}
        <h3 className={`text-xl font-bold ${getTextColor()}`}>
          {risk} Risk Detected
        </h3>
      </div>
      
      <div className="space-y-4">
        <p className={`font-medium ${getTextColor()} opacity-90`}>
          Smart Recommendations:
        </p>
        <ul className="space-y-3">
          {recommendations.map((rec, index) => (
            <li key={index} className="flex items-start gap-2 group">
              <ArrowRight className={`w-4 h-4 mt-1 flex-shrink-0 ${getTextColor()}`} />
              <span className={`${getTextColor()} text-sm font-medium`}>{rec}</span>
            </li>
          ))}
        </ul>
      </div>
      
      {ai_narrative && (
        <div className="mt-8 border-t border-slate-200/50 pt-6">
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-5 relative overflow-hidden">
             {/* sparkles bg element */}
             <div className="absolute -top-6 -right-6 w-24 h-24 bg-indigo-200 rounded-full blur-2xl opacity-50 pointer-events-none"></div>
             
             <h4 className="flex items-center gap-2 text-indigo-800 font-bold mb-3 text-sm tracking-wide uppercase">
               <span className="bg-white p-1 rounded-md text-indigo-600 shadow-sm border border-indigo-50">✨</span> 
               Gemini Humanized Report
             </h4>
             <div className="text-indigo-900/80 text-sm leading-relaxed whitespace-pre-wrap font-medium">
               {ai_narrative.replace(/\*\*/g, '')}
             </div>
          </div>
        </div>
      )}

      {isHighRisk && (
        <div className="mt-6 p-4 bg-white/50 rounded-xl border border-red-100 flex items-center gap-3">
          <Info className="w-5 h-5 text-red-400" />
          <p className="text-xs text-red-600 font-semibold uppercase tracking-wider">
            Critical Action Recommended
          </p>
        </div>
      )}
    </div>
  );
};

export default RecommendationCard;
