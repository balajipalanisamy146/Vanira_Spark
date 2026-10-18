import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
} from "recharts";
import { Layers3 } from "lucide-react";

const formatCurrency = (value) =>
    new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(value || 0);

export default function CategoryPerformance({ data = [] }) {
    const chartData = data.slice(0, 10);

    return (
        <section className="bg-[#0B1730] border border-blue-900/60 rounded-2xl p-4 shadow-xl h-full">
            <div className="mb-4 flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <Layers3 size={16} className="text-blue-300" />
                </div>
                <div>
                    <h2 className="text-base font-bold text-white tracking-wide">
                        Category Performance
                    </h2>

                    <p className="text-xs text-slate-400 mt-0.5">
                        Revenue and profit across categories.
                    </p>
                </div>
            </div>

            {chartData.length === 0 ? (
                <div className="h-[300px] flex items-center justify-center text-slate-500">
                    No category data available.
                </div>
            ) : (
                <div className="h-[320px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                            <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="#1e3a8a"
                            />

                            <XAxis
                                dataKey="category"
                                tick={{
                                    fill: "#94a3b8",
                                    fontSize: 10,
                                }}
                            />

                            <YAxis
                                tick={{
                                    fill: "#94a3b8",
                                    fontSize: 10,
                                }}
                                tickFormatter={(value) =>
                                    `₹${Number(value).toLocaleString("en-IN")}`
                                }
                            />

                            <Tooltip
                                formatter={(value, name) => [
                                    formatCurrency(value),
                                    name === "revenue"
                                        ? "Revenue"
                                        : "Profit",
                                ]}
                                contentStyle={{
                                    backgroundColor: "#0f172a",
                                    border: "1px solid #1e3a8a",
                                    borderRadius: "10px",
                                    color: "#fff",
                                }}
                            />

                            <Legend
                                wrapperStyle={{ color: "#cbd5e1", fontSize: "11px" }}
                            />

                            <Bar
                                dataKey="revenue"
                                name="Revenue"
                                fill="#22d3ee"
                                radius={[6, 6, 0, 0]}
                            />

                            <Bar
                                dataKey="profit"
                                name="Profit"
                                fill="#d946ef"
                                radius={[6, 6, 0, 0]}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}
        </section>
    );
}