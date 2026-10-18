import { Brain, Lightbulb, ArrowRight } from "lucide-react";

export default function AiAdvisor({ className = "" }) {
  return (
    <div
      className={`glass-card rounded-2xl p-3 border border-[#1e3a8a] bg-[#020617] flex flex-col ${className}`}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <div className="text-purple-400">
          <Brain size={22} />
        </div>
        <div>
          <h2 className="text-sm font-bold text-white">AI Business Advisor</h2>
          <p className="text-[10px] text-blue-200">
            Get intelligent insights for better decisions
          </p>
        </div>
      </div>

      {/* Recommendation Box */}
      <div className="border border-indigo-500/30 bg-gradient-to-br from-[#1e1b4b] to-[#311060] p-3 rounded-xl flex flex-col relative overflow-hidden">
        <div className="flex gap-2 items-start z-10">
          <Lightbulb size={18} className="text-yellow-400 mt-0.5 flex-shrink-0 fill-yellow-400" />
          <div className="flex-1">
            <h3 className="font-bold text-xs text-yellow-400">
              Recommendation
            </h3>
            <p className="mt-1 text-[11px] text-blue-100 leading-snug">
              Sales are expected to increase by 18% next week based on current trends. Consider stocking more of the top-selling products.
            </p>
          </div>
        </div>

        <div className="mt-2 flex justify-end z-10">
          <button className="flex items-center gap-1.5 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 text-white text-[10px] font-medium px-3 py-1 rounded-lg transition-all shadow-lg">
            View Full Analysis <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}