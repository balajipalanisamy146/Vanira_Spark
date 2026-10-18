import { useEffect, useState } from "react";
import {
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";
import {
    BarChart3,
    CreditCard,
    MapPin,
    Package,
    Users,
    RefreshCw,
} from "lucide-react";

import api from "../services/api";
import { formatCompactCurrency } from "./formatCompactValue";

const CHART_COLORS = [
    "#6366f1",
    "#8b5cf6",
    "#06b6d4",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#ec4899",
    "#14b8a6",
];

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

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) {
        return null;
    }

    const value = payload[0]?.value || 0;

    return (
        <div className="rounded-xl border border-blue-900 bg-[#122042] px-4 py-3 shadow-xl">
            {label && (
                <p className="mb-1 text-sm font-medium text-slate-300">
                    {label}
                </p>
            )}

            <p className="text-sm font-semibold text-white">
                Sales: {formatCurrency(value)}
            </p>
        </div>
    );
};

const RevenueBarChart = ({
    title,
    description,
    icon,
    data,
    dataKey,
    nameKey,
}) => {
    return (
        <div className="sales-analytics-card rounded-2xl border bg-[#0B1730] p-4 shadow-xl">
            <div className="mb-5 flex items-start gap-3">
                <div className="rounded-xl bg-indigo-500/10 p-2.5">
                    {icon}
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
                <div className="flex h-[280px] items-center justify-center text-sm text-slate-500">
                    No data available
                </div>
            ) : (
                <ResponsiveContainer width="100%" height={280}>
                    <BarChart
                        data={data}
                        layout="vertical"
                        margin={{
                            top: 5,
                            right: 20,
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
                            tick={{ fill: "#94a3b8", fontSize: 10 }}
                            tickFormatter={formatCompactCurrency}
                        />

                        <YAxis
                            type="category"
                            dataKey={nameKey}
                            width={110}
                            tick={{
                                fill: "#cbd5e1",
                                fontSize: 10,
                            }}
                        />

                        <Tooltip content={<CustomTooltip />} />

                        <Bar
                            dataKey={dataKey}
                            fill="#6366f1"
                            radius={[0, 6, 6, 0]}
                            barSize={22}
                        />
                    </BarChart>
                </ResponsiveContainer>
            )}
        </div>
    );
};

const RevenueColumnChart = ({
    title,
    description,
    icon,
    data,
    nameKey,
    dataKey,
}) => {
    const gradientId = `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-gradient`;

    return (
        <div className="sales-analytics-card rounded-2xl border bg-[#0B1730] p-4 shadow-xl">
            <div className="mb-5 flex items-start gap-3">
                <div className="rounded-xl bg-indigo-500/10 p-2.5">{icon}</div>
                <div>
                    <h3 className="text-base font-semibold text-white">{title}</h3>
                    <p className="mt-1 text-xs text-slate-400">{description}</p>
                </div>
            </div>

            {data.length === 0 ? (
                <div className="flex h-[280px] items-center justify-center text-sm text-slate-500">
                    No data available
                </div>
            ) : (
                <ResponsiveContainer width="100%" height={280}>
                    <BarChart
                        data={data}
                        margin={{ top: 10, right: 8, left: 0, bottom: 24 }}
                    >
                        <defs>
                            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#ab06c5" />
                                <stop offset="100%" stopColor="#2b08b7" />
                            </linearGradient>
                        </defs>
                        <CartesianGrid
                            strokeDasharray="3 3"
                            vertical={false}
                            stroke="#1e3a8a"
                        />
                        <XAxis
                            dataKey={nameKey}
                            tick={{ fill: "#cbd5e1", fontSize: 9 }}
                            axisLine={false}
                            tickLine={false}
                            interval={0}
                            minTickGap={0}
                            angle={-35}
                            textAnchor="end"
                            height={48}
                            tickMargin={4}
                        />
                        <YAxis
                            tick={{ fill: "#94a3b8", fontSize: 10 }}
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={formatCompactCurrency}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: "#122042",
                                border: "1px solid #1e3a8a",
                                borderRadius: "10px",
                                fontSize: "12px",
                                color: "#fff",
                            }}
                            formatter={(value, name) => [formatCurrency(value), name]}
                        />
                        <Bar
                            dataKey={dataKey}
                            name="Sales"
                            fill={`url(#${gradientId})`}
                            radius={[5, 5, 0, 0]}
                            maxBarSize={30}
                        />
                    </BarChart>
                </ResponsiveContainer>
            )}
        </div>
    );
};

const RevenuePieChart = ({
    title,
    description,
    icon,
    data,
    nameKey,
    dataKey,
    donut = true,
    colors = CHART_COLORS,
    compact = false,
    legendColumns = 2,
}) => {
    const total = data.reduce(
        (sum, item) => sum + Number(item[dataKey] || 0),
        0
    );

    return (
        <div className="sales-analytics-card flex h-full flex-col rounded-2xl border bg-[#0B1730] p-4 shadow-xl">
            <div className="mb-5 flex items-start gap-3">
                <div className="rounded-xl bg-indigo-500/10 p-2.5">
                    {icon}
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
                <div className="flex h-[280px] items-center justify-center text-sm text-slate-500">
                    No data available
                </div>
            ) : (
                <div className={`grid flex-1 grid-cols-1 items-center ${compact ? "gap-3 sm:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]" : "gap-3 md:grid-cols-2"}`}>
                    <div className={compact ? "h-[190px]" : "h-[260px]"}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data}
                                    dataKey={dataKey}
                                    nameKey={nameKey}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={donut ? (compact ? 48 : 70) : 0}
                                    outerRadius={compact ? 78 : 105}
                                    paddingAngle={2}
                                    stroke="none"
                                >
                                    {data.map((_, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={colors[index % colors.length]}
                                        />
                                    ))}
                                </Pie>

                                <Tooltip
                                    formatter={(value) =>
                                        formatCurrency(value)
                                    }
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    <div className={compact ? "space-y-2" : "space-y-3"}>
                        {data.map((item, index) => {
                            const value = Number(item[dataKey] || 0);

                            const percentage =
                                total > 0
                                    ? ((value / total) * 100).toFixed(1)
                                    : "0.0";

                            return (
                                <div
                                    key={`${item[nameKey]}-${index}`}
                                    className={compact && legendColumns === 3
                                        ? "grid min-w-0 grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2"
                                        : "flex min-w-0 items-center justify-between gap-2"}
                                >
                                    <div className="flex min-w-0 items-center gap-2">
                                        <span
                                            className="h-2.5 w-2.5 shrink-0 rounded-full"
                                            style={{
                                                backgroundColor:
                                                    colors[index % colors.length],
                                            }}
                                        />

                                        <span className={`truncate text-slate-300 ${compact ? "text-[10px]" : "text-sm"}`}>
                                            {item[nameKey]}
                                        </span>
                                    </div>

                                    {compact && legendColumns === 3 ? (
                                        <>
                                            <p className="text-right text-[10px] font-medium text-white">
                                                {formatCompactCurrency(value)}
                                            </p>
                                            <p className="text-right text-[9px] text-slate-500">
                                                {percentage}%
                                            </p>
                                        </>
                                    ) : (
                                        <div className="shrink-0 text-right">
                                            <p className={`font-medium text-white ${compact ? "text-[10px]" : "text-sm"}`}>
                                                {compact ? formatCompactCurrency(value) : formatCurrency(value)}
                                            </p>
                                            <p className={`${compact ? "text-[9px]" : "text-[11px]"} text-slate-500`}>
                                                {percentage}%
                                            </p>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

function RevenueBreakdown() {
    const [categorySales, setCategorySales] = useState([]);
    const [brandSales, setBrandSales] = useState([]);
    const [citySales, setCitySales] = useState([]);
    const [genderSales, setGenderSales] = useState([]);
    const [paymentSales, setPaymentSales] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchRevenueBreakdown = async () => {
        try {
            setLoading(true);
            setError("");

            const [
                categoryResponse,
                brandResponse,
                cityResponse,
                genderResponse,
                paymentResponse,
            ] = await Promise.all([
                api.get("/analytics/category-sales"),
                api.get("/analytics/brand-sales"),
                api.get("/analytics/city-sales"),
                api.get("/analytics/gender-sales"),
                api.get("/analytics/payment-method-sales"),
            ]);

            setCategorySales(categoryResponse.data || []);
            setBrandSales(brandResponse.data || []);
            setCitySales(cityResponse.data || []);
            setGenderSales(genderResponse.data || []);
            setPaymentSales(paymentResponse.data || []);
        } catch (err) {
            console.error(
                "Revenue breakdown error:",
                err
            );

            setError(
                "Unable to load revenue breakdown data."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRevenueBreakdown();
    }, []);

    const cityTotals = new Map();
    citySales.forEach((item) => {
        const city = String(item.city || "Unknown").trim() || "Unknown";
        const key = city.toLowerCase();
        const current = cityTotals.get(key) || { city, sales: 0 };
        current.sales += Number(item.sales || 0);
        cityTotals.set(key, current);
    });

    const normalizedCitySales = [...cityTotals.values()];
    const totalCitySales = normalizedCitySales.reduce(
        (total, item) => total + item.sales,
        0,
    );
    const chennai = normalizedCitySales.filter(
        (item) => item.city.toLowerCase() === "chennai",
    );
    const otherCities = normalizedCitySales.filter(
        (item) => item.city.toLowerCase() !== "chennai",
    );
    const visibleCities = otherCities
        .filter((item) => totalCitySales > 0 && item.sales / totalCitySales >= 0.03)
        .sort((a, b) => b.sales - a.sales);
    const othersSales = otherCities
        .filter((item) => totalCitySales === 0 || item.sales / totalCitySales < 0.03)
        .reduce((total, item) => total + item.sales, 0);
    const cityChartSales = [
        ...chennai,
        ...visibleCities,
        ...(othersSales > 0 ? [{ city: "Others", sales: othersSales }] : []),
    ];

    if (loading) {
        return (
            <section className="mt-5">
                <div className="mb-4">
                    <div className="h-6 w-48 animate-pulse rounded bg-slate-800" />
                    <div className="mt-2 h-4 w-72 animate-pulse rounded bg-slate-800" />
                </div>

                <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                    {[1, 2, 3, 4, 5].map((item) => (
                        <div
                            key={item}
                            className="h-[320px] animate-pulse rounded-2xl border border-blue-900/60 bg-[#0B1730]"
                        />
                    ))}
                </div>
            </section>
        );
    }

    if (error) {
        return (
            <section className="mt-5 rounded-2xl border border-red-500/20 bg-red-500/5 p-5">
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <h3 className="font-semibold text-red-400">
                            Revenue Breakdown
                        </h3>

                        <p className="mt-1 text-sm text-slate-400">
                            {error}
                        </p>
                    </div>

                    <button
                        onClick={fetchRevenueBreakdown}
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
            {/* Section Header */}
            <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                <div>
                    <div className="flex items-center gap-2">
                        <BarChart3
                            size={18}
                            className="text-indigo-400"
                        />

                        <h2 className="text-base font-bold text-white tracking-wide">
                            Revenue Breakdown
                        </h2>
                    </div>

                    <p className="mt-0.5 text-xs text-slate-400">
                        Analyze revenue distribution across your business.
                    </p>
                </div>

                <button
                    onClick={fetchRevenueBreakdown}
                    className="flex w-fit items-center gap-2 rounded-lg border border-blue-900/60 bg-[#0B1730] px-3 py-2 text-xs font-medium text-slate-300 transition hover:bg-[#122042] hover:text-white"
                >
                    <RefreshCw size={14} />
                    Refresh
                </button>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-6">
                {/* Category */}
                <div className="xl:col-span-3">
                <RevenueColumnChart
                    title="Sales by Category"
                    description="Sales revenue for each product category"
                    icon={
                        <Package
                            size={18}
                            className="text-indigo-400"
                        />
                    }
                    data={categorySales}
                    nameKey="category"
                    dataKey="sales"
                />
                </div>

                {/* Brand */}
                <div className="xl:col-span-3">
                <RevenueColumnChart
                    title="Sales by Brand"
                    description="Top brands based on revenue generated"
                    icon={
                        <BarChart3
                            size={18}
                            className="text-indigo-400"
                        />
                    }
                    data={brandSales}
                    nameKey="brand"
                    dataKey="sales"
                />
                </div>

                {/* City */}
                <div className="h-full xl:col-span-2">
                <RevenuePieChart
                    title="Sales by City"
                    description="Revenue distribution across cities"
                    icon={
                        <MapPin
                            size={18}
                            className="text-indigo-400"
                        />
                    }
                    data={cityChartSales}
                    nameKey="city"
                    dataKey="sales"
                    donut
                    compact
                    legendColumns={3}
                />
                </div>

                {/* Gender */}
                <div className="h-full xl:col-span-2">
                <RevenuePieChart
                    title="Sales by Gender"
                    description="Revenue contribution by customer gender"
                    icon={
                        <Users
                            size={18}
                            className="text-indigo-400"
                        />
                    }
                    data={genderSales}
                    nameKey="gender"
                    dataKey="sales"
                    donut
                    colors={["#ab06c5", "#2b08b7"]}
                    compact
                />
                </div>

                {/* Payment */}
                <div className="h-full xl:col-span-2">
                <RevenuePieChart
                    title="Sales by Payment Method"
                    description="Revenue distribution by payment method"
                    icon={
                        <CreditCard
                            size={18}
                            className="text-indigo-400"
                        />
                    }
                    data={paymentSales}
                    nameKey="payment_method"
                    dataKey="sales"
                    donut={false}
                    compact
                />
                </div>
            </div>
        </section>
    );
}

export default RevenueBreakdown;