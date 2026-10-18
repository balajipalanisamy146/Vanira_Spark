import { CalendarDays, Package, X } from "lucide-react";

import ProductTrend from "./ProductTrend";

const formatCurrency = (value) =>
    `₹${Number(value || 0).toLocaleString("en-IN", {
        maximumFractionDigits: 0,
    })}`;

export default function ProductDetails({ data, trend, history, onClose }) {
    const metrics = [
        { title: "Revenue", value: formatCurrency(data.revenue) },
        { title: "Profit", value: formatCurrency(data.profit) },
        {
            title: "Units Sold",
            value: Number(data.quantity_sold || 0).toLocaleString("en-IN"),
        },
        { title: "Orders", value: Number(data.orders || 0).toLocaleString("en-IN") },
        {
            title: "Revenue Per Order",
            value: formatCurrency(data.average_order_revenue),
        },
        { title: "Profit Margin", value: `${Number(data.profit_margin || 0).toFixed(2)}%` },
    ];

    return (
        <section className="space-y-4">
            <div className="bg-[#0B1730] border border-blue-900/60 rounded-2xl p-5 shadow-xl">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
                            <Package size={22} className="text-cyan-300" />
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-lg font-bold text-white truncate">
                                {data.product_name}
                            </h2>
                            <p className="text-sm text-slate-400 mt-1">
                                {data.brand} · {data.category}
                            </p>
                        </div>
                    </div>
                    {onClose && (
                        <button
                            type="button"
                            onClick={onClose}
                            aria-label="Close product analytics"
                            className="p-2 rounded-lg border border-blue-900/60 bg-[#081124] text-slate-400 hover:text-white transition"
                        >
                            <X size={18} />
                        </button>
                    )}
                </div>

                <div className="mt-5 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
                    {metrics.map((metric) => (
                        <div
                            key={metric.title}
                            className="rounded-xl border border-blue-900/40 bg-[#081124] p-3 min-w-0"
                        >
                            <p className="text-xs text-slate-400 truncate">
                                {metric.title}
                            </p>
                            <p className="text-lg font-bold text-white mt-2 truncate" title={metric.value}>
                                {metric.value}
                            </p>
                        </div>
                    ))}
                </div>

                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <DateItem label="First Sale" value={data.first_sale} />
                    <DateItem label="Last Sale" value={data.last_sale} />
                </div>
            </div>

            <ProductTrend
                data={trend}
                title="Selected Product Sales Trend"
                description="Monthly revenue, profit, and quantity for this product."
            />

            <section className="bg-[#0B1730] border border-blue-900/60 rounded-2xl shadow-xl overflow-hidden">
                <div className="p-4 border-b border-blue-900/60">
                    <h2 className="text-base font-bold text-white tracking-wide">
                        Product Sales History
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                        Recent transactions for {data.product_name}.
                    </p>
                </div>

                {history.length === 0 ? (
                    <div className="p-6 text-center text-sm text-slate-500">
                        No product sales history available.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-[#081124]">
                                <tr className="text-left text-gray-400">
                                    <th className="px-5 py-3 font-medium">Invoice</th>
                                    <th className="px-5 py-3 font-medium">Date</th>
                                    <th className="px-5 py-3 font-medium">Customer</th>
                                    <th className="px-5 py-3 font-medium text-right">Qty</th>
                                    <th className="px-5 py-3 font-medium text-right">Revenue</th>
                                    <th className="px-5 py-3 font-medium text-right">Profit</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-blue-900/30">
                                {history.map((item, index) => (
                                    <tr
                                        key={`${item.invoice_id}-${index}`}
                                        className="hover:bg-blue-950/30"
                                    >
                                        <td className="px-5 py-3 text-white">{item.invoice_id}</td>
                                        <td className="px-5 py-3 text-gray-400">{formatDate(item.sale_date)}</td>
                                        <td className="px-5 py-3 text-gray-300">{item.customer_name || "Unknown"}</td>
                                        <td className="px-5 py-3 text-right text-gray-300">
                                            {Number(item.quantity || 0).toLocaleString("en-IN")}
                                        </td>
                                        <td className="px-5 py-3 text-right text-white">{formatCurrency(item.revenue)}</td>
                                        <td className="px-5 py-3 text-right text-gray-300">{formatCurrency(item.profit)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </section>
    );
}

function DateItem({ label, value }) {
    return (
        <div className="flex items-center gap-2 rounded-xl border border-blue-900/40 bg-[#081124] p-3">
            <CalendarDays size={16} className="text-slate-500" />
            <span className="text-xs text-slate-400">{label}</span>
            <span className="ml-auto text-sm text-white">{formatDate(value)}</span>
        </div>
    );
}

function formatDate(value) {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}