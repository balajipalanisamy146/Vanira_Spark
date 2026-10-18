import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
} from "recharts";
import { Package } from "lucide-react";

const formatCurrency = (value) =>
    new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(value || 0);

export default function TopProducts({ data = [] }) {
    const chartData = data
        .slice(0, 10)
        .map((item) => ({
            ...item,
            short_name:
                item.product_name?.length > 22
                    ? `${item.product_name.slice(0, 22)}...`
                    : item.product_name,
        }));

    return (
        <section className="bg-[#0B1730] border border-blue-900/60 rounded-2xl p-4 shadow-xl h-full">
            <div className="mb-4 flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                    <Package size={16} className="text-cyan-300" />
                </div>
                <div>
                    <h2 className="text-base font-bold text-white tracking-wide">
                        Top Products
                    </h2>

                    <p className="text-xs text-slate-400 mt-0.5">
                        Products generating the highest revenue.
                    </p>
                </div>
            </div>

            {chartData.length === 0 ? (
                <div className="h-[300px] flex items-center justify-center text-slate-500">
                    No product data available.
                </div>
            ) : (
                <div className="h-[320px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={chartData}
                            layout="vertical"
                            margin={{
                                top: 10,
                                right: 30,
                                left: 20,
                                bottom: 10,
                            }}
                        >
                            <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="#1e3a8a"
                            />

                            <XAxis
                                type="number"
                                tick={{ fill: "#94a3b8", fontSize: 10 }}
                                tickFormatter={(value) =>
                                    `₹${Number(value).toLocaleString("en-IN")}`
                                }
                            />

                            <YAxis
                                type="category"
                                dataKey="short_name"
                                width={150}
                                tick={{
                                    fill: "#cbd5e1",
                                    fontSize: 10,
                                }}
                            />

                            <Tooltip
                                formatter={(value) => [
                                    formatCurrency(value),
                                    "Revenue",
                                ]}
                                contentStyle={{
                                    backgroundColor: "#0f172a",
                                    border: "1px solid #1e3a8a",
                                    borderRadius: "10px",
                                    color: "#fff",
                                }}
                            />

                            <Bar
                                dataKey="revenue"
                                fill="#22d3ee"
                                radius={[0, 6, 6, 0]}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}
        </section>
    );
}