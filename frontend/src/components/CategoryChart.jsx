import { PieChart as PieChartIcon } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer
} from "recharts";

const DEFAULT_CATEGORIES = [];

const COLOR_PALETTE = ["#3B82F6", "#06B6D4", "#10B981", "#EC4899", "#F43F5E", "#94A3B8"];
const TOP_N = 5;

export default function CategoryChart({ data, totalSales }) {

  // Process raw data
  const rawData = (data && data.length > 0)
    ? data.map((item, idx) => ({
      name: item.category || item.name || `Category ${idx + 1}`,
      sales: item.sales || item.value || 0,
      color: item.color || COLOR_PALETTE[idx % (COLOR_PALETTE.length - 1)],
    }))
    : DEFAULT_CATEGORIES;

  // Sort by sales descending, take top 5 only
  const sorted = [...rawData].sort((a, b) => b.sales - a.sales);
  const top5 = sorted.slice(0, TOP_N);

  const chartData = top5.map((item, idx) => {
    const total = rawData.reduce((acc, c) => acc + c.sales, 0);
    const pct = total > 0 ? Math.round((item.sales / total) * 100) : 0;
    return { ...item, color: COLOR_PALETTE[idx], value: item.sales, percentage: `${pct}%` };
  });

  const grandTotal = totalSales !== undefined && totalSales !== null && totalSales !== 0
    ? (typeof totalSales === 'number' ? `₹${totalSales.toLocaleString('en-IN')}` : totalSales)
    : "";

  return (
    <div className="bg-[#0B1730] rounded-2xl p-4 border border-blue-900/60 shadow-xl flex flex-col justify-between h-full min-h-[260px]">
      {/* Card Header */}
      <div className="flex items-center gap-2 mb-2">
        <div className="p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <PieChartIcon className="w-4 h-4 text-blue-400" />
        </div>
        <h2 className="text-base font-bold text-white tracking-wide">
          Sales by Category
          <span className="ml-2 text-xs font-semibold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full">Top 5</span>
        </h2>
      </div>

      {/* Main Grid Layout: Left Donut Chart with Overlay, Right Legend */}
      <div className="grid grid-cols-12 items-center gap-2 flex-1 my-auto">

        {/* DONUT CHART CONTAINER */}
        <div className="col-span-6 relative w-full h-[160px] flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={44}
                outerRadius={65}
                paddingAngle={0}
                stroke="none"
                strokeWidth={0}
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color}
                    className="transition-all duration-300 hover:opacity-80"
                  />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const item = payload[0].payload;
                    return (
                      <div className="bg-[#122042] border border-blue-800/80 px-3 py-2 rounded-lg shadow-lg text-xs">
                        <div className="font-semibold text-white flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                          {item.name}
                        </div>
                        <div className="text-slate-300 mt-0.5">
                          Sales: <span className="text-white font-bold">₹{Number(item.sales).toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </PieChart>
          </ResponsiveContainer>

          {/* Donut Center Overlay Text */}
          {grandTotal && (
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Total Sales
              </span>
              <span className="text-sm font-extrabold text-white mt-0.5 tracking-tight">
                {grandTotal}
              </span>
            </div>
          )}
        </div>

        {/* CATEGORY LEGEND LIST */}
        <div className="col-span-6 flex flex-col gap-2.5 pl-1 justify-center">
          {chartData.map((cat, index) => {
            const displayPercentage = cat.percentage || `${cat.value}%`;
            return (
              <div
                key={index}
                className="flex items-center justify-between text-xs group hover:bg-slate-800/30 p-1 rounded-md transition"
              >
                <div className="flex items-center gap-2 min-w-0 pr-1">
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0 shadow-sm"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="text-slate-300 font-medium truncate text-[11.5px]" title={cat.name}>
                    {cat.name}
                  </span>
                </div>
                <span className="text-white font-bold text-[11.5px] flex-shrink-0">
                  {displayPercentage}
                </span>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}