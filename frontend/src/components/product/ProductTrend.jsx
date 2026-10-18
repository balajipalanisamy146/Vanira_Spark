import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
} from "recharts";
import { Activity } from "lucide-react";

const formatCurrency = (value) =>
    new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(value || 0);

export default function ProductTrend({
    data = [],
    title = "Product Sales Trend",
    description = "Monthly revenue, profit, and quantity.",
}) {
    return (
        <section className="bg-[#0B1730] border border-blue-900/60 rounded-2xl p-4 shadow-xl h-full">
            <div className="mb-4 flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20">
                    <Activity size={16} className="text-purple-300" />
                </div>
                <div>
                    <h2 className="text-base font-bold text-white tracking-wide">
                        {title}
                    </h2>

                    <p className="text-xs text-slate-400 mt-0.5">
                        {description}
                    </p>
                </div>
            </div>

            {data.length === 0 ? (
                <div className="h-[300px] flex items-center justify-center text-slate-500">
                    No trend data available.
                </div>
            ) : (
                <div className="h-[320px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                            data={data}
                            margin={{
                                top: 10,
                                right: 30,
                                left: 10,
                                bottom: 10,
                            }}
                        >
                            <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="#1e3a8a"
                            />

                            <XAxis
                                dataKey="month"
                                tick={{
                                    fill: "#94a3b8",
                                    fontSize: 10,
                                }}
                            />

                            <YAxis
                                yAxisId="revenue"
                                tick={{
                                    fill: "#94a3b8",
                                    fontSize: 10,
                                }}
                                tickFormatter={(value) =>
                                    `₹${Number(value).toLocaleString("en-IN")}`
                                }
                            />

                            <YAxis
                                yAxisId="quantity"
                                orientation="right"
                                tick={{
                                    fill: "#94a3b8",
                                    fontSize: 10,
                                }}
                            />

                            <Tooltip
                                formatter={(value, name) => {
                                    if (
                                        name === "Revenue" ||
                                        name === "Profit"
                                    ) {
                                        return [
                                            formatCurrency(value),
                                            name,
                                        ];
                                    }

                                    return [
                                        Number(value).toLocaleString(
                                            "en-IN"
                                        ),
                                        "Quantity",
                                    ];
                                }}
                                contentStyle={{
                                    backgroundColor: "#0f172a",
                                    border: "1px solid #1e3a8a",
                                    borderRadius: "10px",
                                    color: "#fff",
                                }}
                            />

                            <Line
                                yAxisId="revenue"
                                type="monotone"
                                dataKey="revenue"
                                name="Revenue"
                                stroke="#22d3ee"
                                strokeWidth={2.5}
                                dot={false}
                            />

                            <Line
                                yAxisId="revenue"
                                type="monotone"
                                dataKey="profit"
                                name="Profit"
                                stroke="#d946ef"
                                strokeWidth={2.5}
                                dot={false}
                            />

                            <Line
                                yAxisId="quantity"
                                type="monotone"
                                dataKey="quantity_sold"
                                name="Quantity"
                                stroke="#f59e0b"
                                strokeWidth={2.5}
                                dot={false}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            )}
        </section>
    );
}
