import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
} from "recharts";
import { TrendingUp } from "lucide-react";

export default function CustomerGrowth({ data = [] }) {
    return (
        <div className="customer-card rounded-2xl border p-4 h-full">
            <div className="mb-4 flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                    <TrendingUp size={16} className="text-cyan-300" />
                </div>
                <div>
                    <h2 className="text-base font-bold text-white tracking-wide">
                        Customer Growth
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                        New customers acquired over time
                    </p>
                </div>
            </div>

            <div className="h-[280px]">
                {data.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-slate-500">
                        No customer growth data available
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                            <CartesianGrid stroke="#1e3a8a" opacity={0.5} />
                            <XAxis
                                dataKey="month"
                                tick={{ fill: "#94a3b8", fontSize: 10 }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <YAxis
                                tick={{ fill: "#94a3b8", fontSize: 10 }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: "#122042",
                                    border: "1px solid #1e3a8a",
                                    borderRadius: "10px",
                                    color: "#fff",
                                }}
                            />
                            <Line
                                type="monotone"
                                dataKey="new_customers"
                                stroke="#22d3ee"
                                strokeWidth={2.5}
                                dot={false}
                                name="New Customers"
                            />
                        </LineChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    );
}