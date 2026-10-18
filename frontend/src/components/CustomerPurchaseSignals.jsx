import { useEffect, useState } from "react";
import {
    RefreshCw,
    Users,
    Repeat2,
    ShoppingBasket,
    IndianRupee,
    AlertTriangle,
} from "lucide-react";
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Cell,
} from "recharts";

import api from "../services/api";
import { formatCompactCurrency, formatCompactValue } from "./formatCompactValue";

const formatINR = (value) =>
    new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(value || 0);

const formatNumber = (value) =>
    new Intl.NumberFormat("en-IN").format(value || 0);

function LoadingCard() {
    return (
        <div className="flex animate-pulse items-center gap-4 rounded-2xl border border-blue-900/60 bg-[#0B1730] p-5 shadow-xl">
            <div className="h-12 w-12 shrink-0 rounded-xl bg-white/10" />
            <div className="flex-1">
                <div className="h-3 w-32 rounded bg-white/10" />
                <div className="mt-3 h-7 w-24 rounded bg-white/10" />
                <div className="mt-2 h-3 w-40 rounded bg-white/10" />
            </div>
        </div>
    );
}

function MetricCard({
    title,
    value,
    subtitle,
    icon: Icon,
    iconBg = "bg-indigo-600",
}) {
    return (
        <div className="flex items-center gap-4 rounded-2xl border border-blue-900/60 bg-[#0B1730] p-5 shadow-xl transition-all duration-300 hover:border-blue-700/80">
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white shadow-lg ${iconBg}`}>
                <Icon className="h-6 w-6" />
            </div>

            <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold tracking-wide text-slate-400">
                    {title}
                </p>
                <h3
                    className="mt-1 truncate text-2xl font-extrabold tracking-tight text-white"
                    title={String(value ?? "")}
                >
                    {formatCompactValue(value)}
                </h3>
                <p className="mt-1 truncate text-[11px] font-medium text-slate-400">
                    {subtitle}
                </p>
            </div>
        </div>
    );
}

function CustomTooltip({ active, payload }) {
    if (!active || !payload || !payload.length) {
        return null;
    }

    const item = payload[0];

    return (
        <div className="rounded-xl border border-blue-900 bg-[#122042] px-4 py-3 shadow-xl">
            <p className="text-sm text-gray-300">
                {item.payload.customer_type}
            </p>

            <p className="mt-1 text-sm font-semibold text-white">
                {formatINR(item.value)}
            </p>
        </div>
    );
}

export default function CustomerPurchaseSignals() {
    const [repeatData, setRepeatData] = useState(null);
    const [basketData, setBasketData] = useState(null);
    const [revenueData, setRevenueData] = useState([]);
    const [contributionData, setContributionData] = useState(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchData = async () => {
        try {
            setLoading(true);
            setError("");

            const [
                repeatResponse,
                basketResponse,
                revenueResponse,
                contributionResponse,
            ] = await Promise.all([
                api.get("/analytics/repeat-purchase-rate"),
                api.get("/analytics/average-basket-size"),
                api.get("/analytics/new-vs-returning-revenue"),
                api.get("/analytics/customer-revenue-contribution"),
            ]);

            setRepeatData(repeatResponse.data);
            setBasketData(basketResponse.data);
            setRevenueData(revenueResponse.data || []);
            setContributionData(contributionResponse.data);
        } catch (err) {
            console.error(
                "Customer purchase signals error:",
                err
            );

            setError(
                "Unable to load customer purchase analytics."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    if (loading) {
        return (
            <section className="mt-5">
                <div className="mb-5 flex items-center justify-between">
                    <div>
                        <div className="h-6 w-56 animate-pulse rounded bg-white/10" />
                        <div className="mt-2 h-4 w-80 animate-pulse rounded bg-white/10" />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
                    <LoadingCard />
                    <LoadingCard />
                    <LoadingCard />
                    <LoadingCard />
                </div>

                <div className="sales-analytics-card mt-4 h-[320px] animate-pulse rounded-2xl border bg-[#0B1730]" />
            </section>
        );
    }

    if (error) {
        return (
            <section className="mt-5 rounded-2xl border border-red-500/20 bg-red-500/5 p-5">
                <div className="flex items-center gap-3">
                    <AlertTriangle
                        size={22}
                        className="text-red-400"
                    />

                    <div>
                        <h3 className="font-semibold text-white">
                            Customer Analytics Error
                        </h3>

                        <p className="mt-1 text-sm text-gray-400">
                            {error}
                        </p>
                    </div>
                </div>

                <button
                    onClick={fetchData}
                    className="mt-4 inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-gray-200"
                >
                    <RefreshCw size={16} />
                    Retry
                </button>
            </section>
        );
    }

    return (
        <section className="mt-5">
            {/* Header */}
            <div className="mb-5 flex items-center justify-between">
                <div>
                    <h2 className="text-base font-bold tracking-wide text-white">
                        Customer Purchase Signals
                    </h2>

                    <p className="mt-0.5 text-xs text-slate-400">
                        Business-level customer purchasing behaviour
                    </p>
                </div>

                <button
                    onClick={fetchData}
                    className="inline-flex items-center gap-2 rounded-lg border border-blue-900/60 bg-[#0B1730] px-3 py-2 text-xs text-slate-300 transition hover:bg-[#122042]"
                >
                    <RefreshCw size={15} />
                    Refresh
                </button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
                <MetricCard
                    title="Repeat Purchase Rate"
                    value={`${repeatData?.repeat_purchase_rate || 0}%`}
                    subtitle={`${formatNumber(
                        repeatData?.repeat_customers
                    )} repeat customers`}
                    icon={Repeat2}
                    iconBg="bg-cyan-500"
                />

                <MetricCard
                    title="Average Basket Value"
                    value={formatINR(
                        basketData?.average_order_value
                    )}
                    subtitle={`${basketData?.average_items_per_order || 0} items / order`}
                    icon={ShoppingBasket}
                    iconBg="bg-purple-500"
                />

                <MetricCard
                    title="Customer-attributed Revenue"
                    value={formatINR(
                        contributionData?.customer_revenue
                    )}
                    subtitle="Revenue linked to identified customers"
                    icon={IndianRupee}
                    iconBg="bg-emerald-500"
                />

                <MetricCard
                    title="Identified Customers"
                    value={formatNumber(
                        repeatData?.total_customers
                    )}
                    subtitle={`${formatNumber(
                        repeatData?.repeat_customers
                    )} repeat customers`}
                    icon={Users}
                    iconBg="bg-indigo-600"
                />
            </div>

            {/* Revenue Chart */}
            <div className="sales-analytics-card mt-4 rounded-2xl border p-4">
                <div className="mb-4">
                    <h3 className="text-sm font-bold text-white">
                        New vs Returning Customer Revenue
                    </h3>

                    <p className="mt-0.5 text-xs text-slate-400">
                        Revenue contribution from new and returning customers
                    </p>
                </div>

                <div className="h-[300px] w-full">
                    {revenueData.length === 0 ? (
                        <div className="flex h-full items-center justify-center text-sm text-gray-500">
                            No customer revenue data available
                        </div>
                    ) : (
                        <ResponsiveContainer
                            width="100%"
                            height="100%"
                        >
                            <BarChart
                                data={revenueData}
                                margin={{
                                    top: 10,
                                    right: 20,
                                    left: 10,
                                    bottom: 10,
                                }}
                            >
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke="#1e3a8a"
                                />

                                <XAxis
                                    dataKey="customer_type"
                                    tick={{
                                        fill: "#94a3b8",
                                        fontSize: 10,
                                    }}
                                    axisLine={false}
                                    tickLine={false}
                                />

                                <YAxis
                                    tick={{
                                        fill: "#94a3b8",
                                        fontSize: 10,
                                    }}
                                    axisLine={false}
                                    tickLine={false}
                                    tickFormatter={formatCompactCurrency}
                                />

                                <Tooltip
                                    content={<CustomTooltip />}
                                    cursor={{
                                        fill: "rgba(30,58,138,0.18)",
                                    }}
                                />

                                <Bar
                                    dataKey="revenue"
                                    radius={[8, 8, 0, 0]}
                                >
                                    {revenueData.map(
                                        (entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={
                                                    entry.customer_type ===
                                                    "New Customers"
                                                        ? "#2b08b7"
                                                        : "#ab06c5"
                                                }
                                            />
                                        )
                                    )}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>

            {/* Supporting Metrics */}
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                <MetricCard
                    title="Total Orders"
                    value={formatNumber(basketData?.total_orders)}
                    subtitle="Orders across sales data"
                    icon={Repeat2}
                    iconBg="bg-cyan-500"
                />

                <MetricCard
                    title="Total Items Sold"
                    value={formatNumber(basketData?.total_items)}
                    subtitle="Units across sales data"
                    icon={ShoppingBasket}
                    iconBg="bg-purple-500"
                />

                <MetricCard
                    title="Total Revenue"
                    value={formatINR(basketData?.total_revenue)}
                    subtitle="Revenue across sales data"
                    icon={IndianRupee}
                    iconBg="bg-emerald-500"
                />
            </div>
        </section>
    );
}