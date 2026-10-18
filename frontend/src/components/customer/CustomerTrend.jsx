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

export default function CustomerTrend({
    data = [],
}) {
    return (
        <section className="bg-[#0B1730] border border-blue-900/60 rounded-2xl p-4 shadow-xl">

            <div className="mb-4 flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20">
                    <Activity size={16} className="text-purple-300" />
                </div>
                <div>

                <h2 className="text-base font-bold text-white tracking-wide">
                    Monthly Spending Trend
                </h2>

                <p className="text-xs text-slate-400 mt-0.5">
                    Customer revenue by month.
                </p>
                </div>

            </div>

            {data.length === 0 ? (
                <div className="h-[320px] flex items-center justify-center text-sm text-slate-500">
                    No spending history available.
                </div>
            ) : (
                <div className="h-[320px]">

                    <ResponsiveContainer
                        width="100%"
                        height="100%"
                    >
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
                                stroke="#94a3b8"
                                tick={{
                                    fontSize: 10,
                                }}
                            />

                            <YAxis
                                stroke="#94a3b8"
                                tick={{
                                    fontSize: 10,
                                }}
                                tickFormatter={(value) =>
                                    `₹${Number(value).toLocaleString("en-IN")}`
                                }
                            />

                            <Tooltip
                                contentStyle={{
                                    backgroundColor: "#0f172a",
                                    border: "1px solid #1e3a8a",
                                    borderRadius: "10px",
                                    color: "#fff",
                                }}
                                formatter={(
                                    value
                                ) => [
                                    `₹${Number(
                                        value
                                    ).toLocaleString(
                                        "en-IN"
                                    )}`,
                                    "Revenue",
                                ]}
                            />

                            <Line
                                type="monotone"
                                dataKey="revenue"
                                stroke="#22d3ee"
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