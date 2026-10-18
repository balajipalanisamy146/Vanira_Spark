import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Area,
  AreaChart
} from "recharts";
import { TrendingUp } from "lucide-react";
import useLocalDayRollover from "../hooks/useLocalDayRollover";

export default function SalesTrendChart({ data }) {

  const currentDay = useLocalDayRollover();
  const today = new Date(currentDay);
  today.setHours(0, 0, 0, 0);

  const chartData = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - 6 + index);

    const dateKey = [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0"),
    ].join("-");

    const sales = Array.isArray(data)
      ? data.reduce((total, item) => (
          String(item.date).slice(0, 10) === dateKey
            ? total + Number(item.sales || 0)
            : total
        ), 0)
      : 0;

    return {
      date: dateKey,
      sales,
      displayDate: date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
    };
  });
  const hasSales = chartData.some((item) => item.sales > 0);

  return (
    <div className="bg-[#0B1730] p-5 rounded-2xl border border-blue-900/60 shadow-xl">

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20">
            <TrendingUp className="w-4 h-4 text-purple-400" />
          </div>
          <h2 className="text-base font-bold text-white tracking-wide">
            Sales Overview
          </h2>
        </div>
        <span className="text-xs px-2.5 py-1 rounded-full bg-purple-900/30 border border-purple-800/50 text-purple-300 font-semibold">
          Last 7 Days
        </span>
      </div>

      {hasSales ? <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>

          <defs>
            <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#c227daff" stopOpacity={0.6} />
              <stop offset="95%" stopColor="#6a00f4ff" stopOpacity={0.05} />
            </linearGradient>
          </defs>

          <CartesianGrid stroke="#1e3a8a" opacity={0.5} />

          <XAxis
            dataKey="displayDate"
            tick={{ fill: "#94a3b8", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickMargin={10}
          />

          <YAxis
            tick={{ fill: "#94a3b8", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => v === 0 ? "0" : `${(v / 1000).toFixed(0)}K`}
            width={48}
            tickMargin={6}
          />

          <Tooltip
            contentStyle={{
              backgroundColor: "#122042",
              border: "1px solid #1e3a8a",
              borderRadius: "10px",
              fontSize: "12px",
              color: "#fff",
            }}
            formatter={(value) => [`₹${Number(value).toLocaleString("en-IN")}`, "Sales"]}
          />

          <Area
            type="monotone"
            dataKey="sales"
            stroke="#bb10d5ff"
            strokeWidth={3}
            fill="url(#salesGradient)"
            dot={{ fill: "#d946ef", r: 4.5, strokeWidth: 0 }}
            activeDot={{ r: 6, fill: "#fff", stroke: "#d946ef", strokeWidth: 3 }}
          />

        </AreaChart>
      </ResponsiveContainer> : (
        <div className="h-[200px] flex flex-col items-center justify-center gap-1 text-center">
          <p className="text-sm font-medium text-slate-300">
            No sales recorded
          </p>
          <p className="text-xs text-slate-500">
            {chartData[0].displayDate} – {chartData[6].displayDate}
          </p>
        </div>
      )}

    </div>
  );
}