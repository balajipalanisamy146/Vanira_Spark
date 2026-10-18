import { ArrowUp, ArrowDown, Coins } from "lucide-react";
import { formatCompactValue } from "./formatCompactValue";

export default function KpiCard({
  title,
  value,
  icon: Icon = Coins,
  iconBg = "bg-indigo-600",
  change = "12.3%",
  isPositive = true,
  period = "vs last week"
}) {
  return (
    <div className="bg-[#0B1730] rounded-2xl p-5 border border-blue-900/60 shadow-xl flex items-center gap-4 transition-all duration-300 hover:border-blue-700/80">
      {/* Icon Container */}
      {Icon && (
        <div className={`w-12 h-12 rounded-xl ${iconBg} flex items-center justify-center text-white shadow-lg flex-shrink-0`}>
          <Icon className="w-6 h-6" />
        </div>
      )}

      {/* Card Details */}
      <div className="flex-1 min-w-0">
        <div className="text-xs font-semibold text-slate-400 tracking-wide">
          {title}
        </div>

        <div
          className="text-2xl font-extrabold text-white mt-1 tracking-tight truncate"
          title={String(value ?? "")}
        >
          {formatCompactValue(value)}
        </div>

        {/* Comparison subtext */}
        <div className="flex items-center gap-1 mt-1 text-xs">
          <span className={`flex items-center font-bold text-[11.5px] ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
            {isPositive ? (
              <ArrowUp className="w-3.5 h-3.5 stroke-[3] mr-0.5 inline" />
            ) : (
              <ArrowDown className="w-3.5 h-3.5 stroke-[3] mr-0.5 inline" />
            )}
            {change}
          </span>
          <span className="text-slate-400 font-medium text-[11px] ml-1">
            {period}
          </span>
        </div>
      </div>
    </div>
  );
}