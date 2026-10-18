import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
} from "recharts";
import { TrendingDown, TrendingUp } from "lucide-react";

const formatCurrency = (value) =>
    new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(value || 0);

function ProductTable({ title, data, positive }) {
    return (
        <div className="
            bg-[#0B1730]
            border border-blue-900/60
            rounded-2xl
            p-4
            shadow-xl
        ">
            <div className="mb-4 flex items-center gap-2">
                <div className={`p-1.5 rounded-lg border ${positive ? "bg-emerald-500/10 border-emerald-500/20" : "bg-rose-500/10 border-rose-500/20"}`}>
                    {positive
                        ? <TrendingUp size={16} className="text-emerald-300" />
                        : <TrendingDown size={16} className="text-rose-300" />}
                </div>
                <div>
                    <h3 className="text-base font-bold text-white tracking-wide">
                        {title}
                    </h3>

                    <p className="text-xs text-slate-400 mt-0.5">
                        {positive
                            ? "Products generating the highest profit."
                            : "Products with the lowest profit contribution."}
                    </p>
                </div>
            </div>

            {data.length === 0 ? (
                <div className="h-[240px] flex items-center justify-center text-slate-500">
                    No data available.
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-blue-900/60">
                                <th className="text-left py-3 text-xs text-slate-400 font-medium">
                                    Product
                                </th>

                                <th className="text-right py-3 text-xs text-slate-400 font-medium">
                                    Revenue
                                </th>

                                <th className="text-right py-3 text-xs text-slate-400 font-medium">
                                    Profit
                                </th>
                            </tr>
                        </thead>

                        <tbody>
                            {data.slice(0, 10).map((item, index) => (
                                <tr
                                    key={`${item.product_name}-${index}`}
                                    className="border-b border-blue-900/30"
                                >
                                    <td className="py-3">
                                        <div className="text-sm text-white">
                                            {item.product_name}
                                        </div>

                                        <div className="text-xs text-slate-500 mt-1">
                                            {item.brand}
                                        </div>
                                    </td>

                                    <td className="text-right text-sm text-slate-300">
                                        {formatCurrency(item.revenue)}
                                    </td>

                                    <td
                                        className={`text-right text-sm font-medium ${
                                            item.profit >= 0
                                                ? "text-emerald-400"
                                                : "text-red-400"
                                        }`}
                                    >
                                        {formatCurrency(item.profit)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export default function ProductProfit({
    profitable = [],
    leastProfitable = [],
}) {
    return (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <ProductTable
                title="Most Profitable Products"
                data={profitable}
                positive={true}
            />

            <ProductTable
                title="Least Profitable Products"
                data={leastProfitable}
                positive={false}
            />
        </div>
    );
}
