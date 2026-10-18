import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
} from "recharts";
import { TrendingUp } from "lucide-react";

export default function ForecastChart({ data = [] }) {

    return (

        <div className="bg-[#0B1730] p-5 rounded-2xl border border-blue-900/60 shadow-xl">

            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                        <TrendingUp className="w-4 h-4 text-cyan-400" />
                    </div>
                    <h2 className="text-base font-bold text-white tracking-wide">
                        7 Day Forecast
                    </h2>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-cyan-900/30 border border-cyan-800/50 text-cyan-300 font-semibold">
                    Next 7 Days
                </span>
            </div>

            <p className="text-sm text-slate-400 mt-1 mb-4">
                Expected sales for the upcoming 7 days
            </p>

            <ResponsiveContainer
                width="100%"
                height={260}
            >

                <LineChart
                    data={data}
                    margin={{
                        top: 10,
                        right: 20,
                        left: 0,
                        bottom: 10,
                    }}
                >

                    <CartesianGrid
                        stroke="#1e3a8a"
                        strokeDasharray="3 3"
                        opacity={0.5}
                    />

                    <XAxis
                        dataKey="date"
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
                        formatter={(value) => [
                            `₹${Number(value).toLocaleString("en-IN")}`,
                            "Forecast Sales",
                        ]}
                    />

                    <Line
                        type="monotone"
                        dataKey="forecast_sales"
                        stroke="#22D3EE"
                        strokeWidth={3}
                        dot={{
                            r: 4,
                            fill: "#67e8f9",
                            strokeWidth: 0,
                        }}
                        activeDot={{
                            r: 6,
                            fill: "#fff",
                            stroke: "#22D3EE",
                            strokeWidth: 3,
                        }}
                    />

                </LineChart>

            </ResponsiveContainer>

        </div>

    );
}