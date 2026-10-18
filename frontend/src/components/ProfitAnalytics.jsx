import { useEffect, useState } from "react";
import {
    BarChart,
    Bar,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import {
    TrendingUp,
    TrendingDown,
    Layers3,
    RefreshCw,
    CircleDollarSign,
} from "lucide-react";

import api from "../services/api";
import { formatCompactCurrency } from "./formatCompactValue";

const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(value || 0);
};

const formatNumber = (value) => {
    return new Intl.NumberFormat("en-IN").format(value || 0);
};

const formatDate = (date) => {
    if (!date) return "";

    const parsedDate = new Date(date);

    return parsedDate.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
};

const getLast30DaysProfit = (data) => {
    const profitByDate = new Map(
        data.map((item) => [String(item.date).slice(0, 10), Number(item.profit || 0)])
    );
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return Array.from({ length: 30 }, (_, index) => {
        const date = new Date(today);
        date.setDate(today.getDate() - 29 + index);
        const dateKey = [
            date.getFullYear(),
            String(date.getMonth() + 1).padStart(2, "0"),
            String(date.getDate()).padStart(2, "0"),
        ].join("-");

        return {
            date: dateKey,
            profit: profitByDate.get(dateKey) || 0,
        };
    });
};

const ProfitTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) {
        return null;
    }

    return (
        <div className="rounded-xl border border-blue-900 bg-[#122042] px-4 py-3 shadow-xl">
            {label && (
                <p className="mb-1 text-xs text-slate-400">
                    {label}
                </p>
            )}

            <p className="text-sm font-semibold text-white">
                Profit: {formatCurrency(payload[0]?.value)}
            </p>
        </div>
    );
};

const ProductProfitChart = ({
    title,
    description,
    data,
    positive = true,
}) => {
    const gradientId = `profit-products-${positive ? "positive" : "negative"}`;

    return (
        <div className="sales-analytics-card flex h-full flex-col rounded-2xl border border-blue-900/60 bg-[#0B1730] p-5 shadow-xl transition-all duration-300 hover:border-blue-700/80">
            <div className="mb-5 flex items-center gap-4">
                <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl shadow-lg ${
                        positive
                            ? "bg-emerald-500/10"
                            : "bg-red-500/10"
                    }`}
                >
                    {positive ? (
                        <TrendingUp
                            size={22}
                            className="text-emerald-400"
                        />
                    ) : (
                        <TrendingDown
                            size={22}
                            className="text-red-400"
                        />
                    )}
                </div>

                <div>
                    <h3 className="text-base font-semibold text-white">
                        {title}
                    </h3>

                    <p className="mt-1 text-xs text-slate-400">
                        {description}
                    </p>
                </div>
            </div>

            {data.length === 0 ? (
                <div className="flex h-[300px] items-center justify-center text-sm text-slate-500">
                    No data available
                </div>
            ) : (
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                        data={data}
                        layout="vertical"
                        margin={{
                            top: 5,
                            right: 25,
                            left: 20,
                            bottom: 5,
                        }}
                    >
                        <CartesianGrid
                            strokeDasharray="3 3"
                            horizontal={false}
                            stroke="#1e3a8a"
                        />

                        <XAxis
                            type="number"
                            tick={{
                                fill: "#94a3b8",
                                fontSize: 11,
                            }}
                            tickFormatter={formatCompactCurrency}
                        />

                        <YAxis
                            type="category"
                            dataKey="product_name"
                            width={120}
                            tick={{
                                fill: "#cbd5e1",
                                fontSize: 11,
                            }}
                        />

                        <Tooltip
                            content={<ProfitTooltip />}
                        />

                        <defs>
                            <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
                                {positive ? (
                                    <>
                                        <stop offset="0%" stopColor="#115a08" />
                                        <stop offset="100%" stopColor="#0cd20c" />
                                    </>
                                ) : (
                                    <>
                                        <stop offset="0%" stopColor="#640614" />
                                        <stop offset="100%" stopColor="#e80505" />
                                    </>
                                )}
                            </linearGradient>
                        </defs>

                        <Bar
                            dataKey="profit"
                            fill={`url(#${gradientId})`}
                            radius={[
                                0,
                                6,
                                6,
                                0,
                            ]}
                            barSize={22}
                        />
                    </BarChart>
                </ResponsiveContainer>
            )}
        </div>
    );
};

const CategoryProfitChart = ({ data }) => {
    return (
        <div className="sales-analytics-card flex h-full flex-col rounded-2xl border border-blue-900/60 bg-[#0B1730] p-5 shadow-xl transition-all duration-300 hover:border-blue-700/80">
            <div className="mb-5 flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg">
                    <Layers3
                        size={22}
                    />
                </div>

                <div>
                    <h3 className="text-base font-semibold text-white">
                        Category Profit
                    </h3>

                    <p className="mt-1 text-xs text-slate-400">
                        Profit generated across product categories
                    </p>
                </div>
            </div>

            {data.length === 0 ? (
                <div className="flex h-[300px] items-center justify-center text-sm text-slate-500">
                    No data available
                </div>
            ) : (
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                        data={data}
                        margin={{
                            top: 5,
                            right: 20,
                            left: 10,
                            bottom: 5,
                        }}
                    >
                        <defs>
                            <linearGradient id="category-profit-gradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#8409db" />
                                <stop offset="100%" stopColor="#360daf" />
                            </linearGradient>
                        </defs>
                        <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#1e3a8a"
                        />

                        <XAxis
                            dataKey="category"
                            tick={{
                                fill: "#94a3b8",
                                fontSize: 9,
                            }}
                            interval={0}
                            angle={-35}
                            textAnchor="end"
                            height={52}
                        />

                        <YAxis
                            tick={{
                                fill: "#94a3b8",
                                fontSize: 11,
                            }}
                            tickFormatter={formatCompactCurrency}
                        />

                        <Tooltip
                            content={<ProfitTooltip />}
                        />

                        <Bar
                            dataKey="profit"
                            fill="url(#category-profit-gradient)"
                            radius={[6, 6, 0, 0]}
                            barSize={35}
                        />
                    </BarChart>
                </ResponsiveContainer>
            )}
        </div>
    );
};

const ProfitTrendChart = ({ data }) => {
    return (
        <div className="sales-analytics-card rounded-2xl border bg-[#0B1730] p-4 shadow-xl xl:col-span-3">
            <div className="mb-5 flex items-start gap-3">
                <div className="rounded-xl bg-emerald-500/10 p-2.5">
                    <TrendingUp
                        size={18}
                        className="text-emerald-400"
                    />
                </div>

                <div>
                    <h3 className="text-base font-semibold text-white">
                        Profit Trend
                    </h3>

                    <p className="mt-1 text-xs text-slate-400">
                        Daily profit performance over the last 30 days
                    </p>
                </div>
            </div>

            {data.length === 0 ? (
                <div className="flex h-[300px] items-center justify-center text-sm text-slate-500">
                    No data available
                </div>
            ) : (
                <ResponsiveContainer width="100%" height={300}>
                    <AreaChart
                        data={data}
                        margin={{
                            top: 10,
                            right: 20,
                            left: 10,
                            bottom: 10,
                        }}
                    >
                        <defs>
                            <linearGradient id="profit-trend-gradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#7027cf" stopOpacity={0.55} />
                                <stop offset="100%" stopColor="#d10de2" stopOpacity={0.06} />
                            </linearGradient>
                        </defs>

                        <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#1e3a8a"
                        />

                        <XAxis
                            dataKey="date"
                            tick={{
                                fill: "#94a3b8",
                                fontSize: 10,
                            }}
                            tickFormatter={formatDate}
                        />

                        <YAxis
                            tick={{
                                fill: "#94a3b8",
                                fontSize: 11,
                            }}
                            tickFormatter={formatCompactCurrency}
                        />

                        <Tooltip
                            content={<ProfitTooltip />}
                        />

                        <Area
                            type="monotone"
                            dataKey="profit"
                            stroke="#7027cf"
                            strokeWidth={3}
                            fill="url(#profit-trend-gradient)"
                            dot={{ fill: "#7027cf", r: 4, strokeWidth: 0 }}
                            activeDot={{
                                r: 6,
                                fill: "#fff",
                                stroke: "#7027cf",
                                strokeWidth: 2,
                            }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            )}
        </div>
    );
};

function ProfitAnalytics() {
    const [topProducts, setTopProducts] = useState([]);
    const [leastProducts, setLeastProducts] = useState([]);
    const [categoryProfit, setCategoryProfit] = useState([]);
    const [profitTrend, setProfitTrend] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchProfitAnalytics = async () => {
        try {
            setLoading(true);
            setError("");

            const [
                topResponse,
                leastResponse,
                categoryResponse,
                trendResponse,
            ] = await Promise.all([
                api.get(
                    "/analytics/top-profitable-products"
                ),
                api.get(
                    "/analytics/least-profitable-products"
                ),
                api.get(
                    "/analytics/category-profit"
                ),
                api.get(
                    "/analytics/profit-trend"
                ),
            ]);

            setTopProducts(topResponse.data || []);
            setLeastProducts(leastResponse.data || []);
            setCategoryProfit(
                categoryResponse.data || []
            );
            setProfitTrend(
                getLast30DaysProfit(trendResponse.data || [])
            );
        } catch (err) {
            console.error(
                "Profit analytics error:",
                err
            );

            setError(
                "Unable to load profit analytics data."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfitAnalytics();
    }, []);

    if (loading) {
        return (
            <section className="mt-5">
                <div className="mb-4">
                    <div className="h-6 w-48 animate-pulse rounded bg-slate-800" />

                    <div className="mt-2 h-4 w-72 animate-pulse rounded bg-slate-800" />
                </div>

                <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
                    {[1, 2, 3, 4].map((item) => (
                        <div
                            key={item}
                                className={`animate-pulse rounded-2xl border border-blue-900/60 bg-[#0B1730] ${
                                item === 4
                                    ? "xl:col-span-3"
                                    : ""
                            }`}
                            style={{
                                    height: "340px",
                            }}
                        />
                    ))}
                </div>
            </section>
        );
    }

    if (error) {
        return (
            <section className="mt-5 rounded-2xl border border-red-500/20 bg-red-500/5 p-5">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <h3 className="font-semibold text-red-400">
                            Profit Analytics
                        </h3>

                        <p className="mt-1 text-sm text-slate-400">
                            {error}
                        </p>
                    </div>

                    <button
                        onClick={fetchProfitAnalytics}
                        className="flex items-center gap-2 rounded-lg border border-blue-900/60 bg-[#0B1730] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#122042]"
                    >
                        <RefreshCw size={16} />
                        Retry
                    </button>
                </div>
            </section>
        );
    }

    return (
        <section className="mt-5">
            {/* Header */}
            <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                <div>
                    <div className="flex items-center gap-2">
                        <CircleDollarSign
                            size={18}
                            className="text-emerald-400"
                        />

                        <h2 className="text-base font-bold text-white tracking-wide">
                            Profit Analytics
                        </h2>
                    </div>

                    <p className="mt-0.5 text-xs text-slate-400">
                        Understand product, category and overall profit performance.
                    </p>
                </div>

                <button
                    onClick={fetchProfitAnalytics}
                    className="flex w-fit items-center gap-2 rounded-lg border border-blue-900/60 bg-[#0B1730] px-3 py-2 text-xs font-medium text-slate-300 transition hover:bg-[#122042] hover:text-white"
                >
                    <RefreshCw size={14} />
                    Refresh
                </button>
            </div>

            {/* Analytics Grid */}
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                <ProductProfitChart
                    title="Top Profitable Products"
                    description="Products generating the highest total profit"
                    data={topProducts}
                    positive={true}
                />

                <ProductProfitChart
                    title="Least Profitable Products"
                    description="Products generating the lowest total profit"
                    data={leastProducts}
                    positive={false}
                />

                <CategoryProfitChart
                    data={categoryProfit}
                />

                <ProfitTrendChart
                    data={profitTrend}
                />
            </div>
        </section>
    );
}

export default ProfitAnalytics;