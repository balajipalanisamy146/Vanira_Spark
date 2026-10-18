import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
} from "recharts";
import { WalletCards } from "lucide-react";

const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(value || 0);
};

export default function CustomerRevenue({ data = [] }) {
    const chartData = data.map((item) => ({
        ...item,
        customer:
            item.customer_name ||
            item.customer_id ||
            "Unknown Customer",
    }));

    return (
        <section
            className="customer-card rounded-2xl border p-4 h-full"
        >
            <div className="mb-4 flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <WalletCards size={16} className="text-emerald-300" />
                </div>
                <div>
                    <h2 className="text-base font-bold text-white tracking-wide">
                        Customer Revenue
                    </h2>

                <p className="text-xs text-slate-400 mt-0.5">
                    Revenue contribution from your highest-value customers.
                </p>
                </div>
            </div>

            {chartData.length === 0 ? (
                <div className="h-[280px] flex items-center justify-center text-slate-500">
                    No customer revenue data available.
                </div>
            ) : (
                <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={chartData}
                            layout="vertical"
                            margin={{
                                top: 10,
                                right: 30,
                                left: 30,
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
                                dataKey="customer"
                                width={140}
                                tick={{ fill: "#cbd5e1", fontSize: 10 }}
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
                                fill="#34d399"
                                radius={[0, 6, 6, 0]}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}
        </section>
    );
}
