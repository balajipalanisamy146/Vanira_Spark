import { useEffect, useState } from "react";
import {
    Package,
    AlertTriangle,
    XCircle,
    TrendingUp,
    TrendingDown,
    RefreshCw,
    RotateCcw,
    Clock3,
} from "lucide-react";
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
} from "recharts";

import api from "../services/api";
import PageHero from "../components/PageHero";
import { formatCompactValue } from "../components/formatCompactValue";

export default function Inventory() {
    const [kpis, setKpis] = useState({});
    const [summary, setSummary] = useState([]);
    const [lowStock, setLowStock] = useState([]);
    const [outOfStock, setOutOfStock] = useState([]);
    const [fastMoving, setFastMoving] = useState([]);
    const [slowMoving, setSlowMoving] = useState([]);
    const [reorder, setReorder] = useState([]);
    const [movement, setMovement] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const loadInventory = async () => {
        try {
            setLoading(true);
            setError("");

            const [
                kpiResponse,
                summaryResponse,
                lowStockResponse,
                outOfStockResponse,
                fastMovingResponse,
                slowMovingResponse,
                reorderResponse,
                movementResponse,
            ] = await Promise.all([
                api.get("/inventory/kpis"),
                api.get("/inventory/summary"),
                api.get("/inventory/low-stock"),
                api.get("/inventory/out-of-stock"),
                api.get("/inventory/fast-moving"),
                api.get("/inventory/slow-moving"),
                api.get("/inventory/reorder"),
                api.get("/inventory/movement"),
            ]);

            setKpis(kpiResponse.data || {});
            setSummary(summaryResponse.data || []);
            setLowStock(lowStockResponse.data || []);
            setOutOfStock(outOfStockResponse.data || []);
            setFastMoving(fastMovingResponse.data || []);
            setSlowMoving(slowMovingResponse.data || []);
            setReorder(reorderResponse.data || []);
            setMovement(movementResponse.data || []);
        } catch (err) {
            console.error("Inventory analytics error:", err);
            setError("Unable to load inventory analytics.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadInventory();
    }, []);

    const formatNumber = (value) =>
        Number(value || 0).toLocaleString("en-IN");

    const formatCurrency = (value) =>
        `₹${Number(value || 0).toLocaleString("en-IN", {
            maximumFractionDigits: 0,
        })}`;

    const getStockStatus = (stock) => {
        if (stock <= 0) return "Out of Stock";
        if (stock <= 20) return "Low Stock";
        return "Healthy";
    };

    const getStatusClass = (status) => {
        if (status === "Out of Stock") {
            return "bg-red-500/10 text-red-400";
        }

        if (status === "Low Stock") {
            return "bg-yellow-500/10 text-yellow-400";
        }

        return "bg-green-500/10 text-green-400";
    };

    const getPriorityClass = (priority) => {
        if (priority === "Critical") {
            return "bg-red-500/10 text-red-400";
        }

        if (priority === "High") {
            return "bg-orange-500/10 text-orange-400";
        }

        if (priority === "Medium") {
            return "bg-yellow-500/10 text-yellow-400";
        }

        return "bg-blue-500/10 text-blue-400";
    };

    if (loading) {
        return (
            <main className="flex-1 min-w-0 p-6 space-y-5">
                <PageHero
                    title="Inventory Analytics"
                    subtitle="Monitor stock levels, inventory health, product movement and reorder requirements."
                    icon={Package}
                />
                <div className="min-h-[45vh] flex items-center justify-center">
                    <div className="flex items-center gap-3 text-gray-400">
                        <RefreshCw
                            size={20}
                            className="animate-spin"
                        />
                        Loading inventory analytics...
                    </div>
                </div>
            </main>
        );
    }

    if (error) {
        return (
            <main className="flex-1 min-w-0 p-6 space-y-5">
                <PageHero
                    title="Inventory Analytics"
                    subtitle="Monitor stock levels, inventory health, product movement and reorder requirements."
                    icon={Package}
                    action={(
                        <button
                            onClick={loadInventory}
                            className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm text-white transition hover:bg-white/20"
                        >
                            <RotateCcw size={16} />
                            Retry
                        </button>
                    )}
                />
                <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6">
                    <div className="flex items-start gap-3">
                        <AlertTriangle
                            size={22}
                            className="text-red-400 mt-0.5"
                        />

                        <div>
                            <h2 className="font-semibold text-red-300">
                                Inventory Analytics Error
                            </h2>

                            <p className="text-sm text-red-300/70 mt-1">
                                {error}
                            </p>
                        </div>
                    </div>

                </div>
            </main>
        );
    }

    return (
        <main className="flex min-w-0 flex-1 flex-col gap-5 p-6">
            <PageHero
                title="Inventory Analytics"
                subtitle="Monitor stock levels, inventory health, product movement and reorder requirements."
                icon={Package}
                action={(
                    <button
                        onClick={loadInventory}
                        className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm text-white transition hover:bg-white/20"
                    >
                        <RefreshCw size={16} />
                        Refresh
                    </button>
                )}
            />

            {/* KPI CARDS */}
            <div className="order-1 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

                <KpiCard
                    title="Total Stock"
                    value={formatNumber(kpis.total_stock)}
                    description="Current units in stock"
                    icon={Package}
                    iconBg="bg-blue-600"
                />

                <KpiCard
                    title="Stocked Products"
                    value={formatNumber(kpis.stocked_products)}
                    description="Products currently available"
                    icon={Package}
                    iconBg="bg-emerald-500"
                />

                <KpiCard
                    title="Low Stock"
                    value={formatNumber(kpis.low_stock_products)}
                    description="Products below threshold"
                    icon={AlertTriangle}
                    iconBg="bg-amber-500"
                />

                <KpiCard
                    title="Out of Stock"
                    value={formatNumber(kpis.out_of_stock_products)}
                    description="Products with no stock"
                    icon={XCircle}
                    iconBg="bg-rose-500"
                />

            </div>

            {/* STOCK OVERVIEW */}
            <section className="order-4 rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">

                <div className="p-6 border-b border-white/10">
                    <div>
                        <h2 className="text-lg font-semibold text-white">
                            Stock Overview
                        </h2>

                        <p className="text-sm text-gray-400 mt-1">
                            Latest recorded stock position by product.
                        </p>
                    </div>
                </div>

                {summary.length === 0 ? (
                    <EmptyState text="No inventory data available." />
                ) : (
                    <div className="overflow-x-auto">

                        <table className="w-full text-sm">

                            <thead className="bg-white/[0.02]">
                                <tr className="text-left text-gray-400">

                                    <th className="px-6 py-4 font-medium">
                                        Product
                                    </th>

                                    <th className="px-6 py-4 font-medium">
                                        Category
                                    </th>

                                    <th className="px-6 py-4 font-medium">
                                        Brand
                                    </th>

                                    <th className="px-6 py-4 font-medium text-right">
                                        Stock
                                    </th>

                                    <th className="px-6 py-4 font-medium text-right">
                                        Unit Price
                                    </th>

                                    <th className="px-6 py-4 font-medium text-right">
                                        Stock Value
                                    </th>

                                    <th className="px-6 py-4 font-medium">
                                        Status
                                    </th>

                                </tr>
                            </thead>

                            <tbody className="divide-y divide-white/5">

                                {summary.map((item, index) => {

                                    const stock = Number(
                                        item.stock_remaining || 0
                                    );

                                    const status =
                                        getStockStatus(stock);

                                    return (
                                        <tr
                                            key={`${item.product_name}-${index}`}
                                            className="hover:bg-white/[0.02]"
                                        >

                                            <td className="px-6 py-4 text-white font-medium">
                                                {item.product_name}
                                            </td>

                                            <td className="px-6 py-4 text-gray-400">
                                                {item.product_category}
                                            </td>

                                            <td className="px-6 py-4 text-gray-400">
                                                {item.brand}
                                            </td>

                                            <td className="px-6 py-4 text-right text-white">
                                                {formatNumber(stock)}
                                            </td>

                                            <td className="px-6 py-4 text-right text-gray-300">
                                                {formatCurrency(
                                                    item.unit_price
                                                )}
                                            </td>

                                            <td className="px-6 py-4 text-right text-gray-300">
                                                {formatCurrency(
                                                    item.stock_value
                                                )}
                                            </td>

                                            <td className="px-6 py-4">

                                                <span
                                                    className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${getStatusClass(
                                                        status
                                                    )}`}
                                                >
                                                    {status}
                                                </span>

                                            </td>

                                        </tr>
                                    );
                                })}

                            </tbody>

                        </table>

                    </div>
                )}

            </section>

            {/* INVENTORY HEALTH */}
            <div className="order-5 grid grid-cols-1 gap-6 xl:grid-cols-2">

                {/* LOW STOCK */}
                <InventoryList
                    title="Low Stock Products"
                    description="Products that need inventory attention."
                    icon={AlertTriangle}
                    iconClass="text-yellow-400"
                    data={lowStock}
                    emptyText="No low stock products."
                    renderItem={(item) => (
                        <>
                            <div className="min-w-0">
                                <p className="text-sm font-medium text-white truncate">
                                    {item.product_name}
                                </p>

                                <p className="text-xs text-gray-500 mt-1">
                                    {item.product_category}
                                </p>
                            </div>

                            <span className="text-sm font-semibold text-yellow-400">
                                {formatNumber(item.stock_remaining)}
                            </span>
                        </>
                    )}
                />

                {/* OUT OF STOCK */}
                <InventoryList
                    title="Out of Stock Products"
                    description="Products currently unavailable."
                    icon={XCircle}
                    iconClass="text-red-400"
                    data={outOfStock}
                    emptyText="No out-of-stock products."
                    renderItem={(item) => (
                        <>
                            <div className="min-w-0">
                                <p className="text-sm font-medium text-white truncate">
                                    {item.product_name}
                                </p>

                                <p className="text-xs text-gray-500 mt-1">
                                    {item.product_category}
                                </p>
                            </div>

                            <span className="text-sm font-semibold text-red-400">
                                0
                            </span>
                        </>
                    )}
                />

            </div>

            {/* PRODUCT MOVEMENT */}
            <div className="order-3 grid grid-cols-1 gap-6 xl:grid-cols-2">

                {/* FAST MOVING */}
                <InventoryList
                    title="Fast Moving Products"
                    description="Products with the highest units sold."
                    icon={TrendingUp}
                    iconClass="text-green-400"
                    data={fastMoving}
                    emptyText="No movement data available."
                    renderItem={(item) => (
                        <>
                            <div className="min-w-0">
                                <p className="text-sm font-medium text-white truncate">
                                    {item.product_name}
                                </p>

                                <p className="text-xs text-gray-500 mt-1">
                                    {item.product_category}
                                </p>
                            </div>

                            <div className="text-right">
                                <p className="text-sm font-semibold text-green-400">
                                    {formatNumber(item.units_sold)}
                                </p>

                                <p className="text-xs text-gray-500 mt-1">
                                    {formatCurrency(item.revenue)}
                                </p>
                            </div>
                        </>
                    )}
                />

                {/* SLOW MOVING */}
                <InventoryList
                    title="Slow Moving Products"
                    description="Products with the lowest units sold."
                    icon={TrendingDown}
                    iconClass="text-orange-400"
                    data={slowMoving}
                    emptyText="No movement data available."
                    renderItem={(item) => (
                        <>
                            <div className="min-w-0">
                                <p className="text-sm font-medium text-white truncate">
                                    {item.product_name}
                                </p>

                                <p className="text-xs text-gray-500 mt-1">
                                    {item.product_category}
                                </p>
                            </div>

                            <div className="text-right">
                                <p className="text-sm font-semibold text-orange-400">
                                    {formatNumber(item.units_sold)}
                                </p>

                                <p className="text-xs text-gray-500 mt-1">
                                    {formatCurrency(item.revenue)}
                                </p>
                            </div>
                        </>
                    )}
                />

            </div>

            {/* REORDER INTELLIGENCE */}
            <section className="order-6 rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">

                <div className="p-6 border-b border-white/10">

                    <div className="flex items-center gap-3">

                        <div className="p-2 rounded-lg bg-purple-500/10">
                            <RotateCcw
                                size={20}
                                className="text-purple-400"
                            />
                        </div>

                        <div>
                            <h2 className="text-lg font-semibold text-white">
                                Reorder Intelligence
                            </h2>

                            <p className="text-sm text-gray-400 mt-1">
                                Inventory replenishment recommendations based on sales velocity.
                            </p>
                        </div>

                    </div>

                </div>

                {reorder.length === 0 ? (
                    <EmptyState text="No reorder recommendations available." />
                ) : (
                    <div className="overflow-x-auto">

                        <table className="w-full text-sm">

                            <thead className="bg-white/[0.02]">

                                <tr className="text-left text-gray-400">

                                    <th className="px-6 py-4 font-medium">
                                        Product
                                    </th>

                                    <th className="px-6 py-4 font-medium text-right">
                                        Current Stock
                                    </th>

                                    <th className="px-6 py-4 font-medium text-right">
                                        Daily Velocity
                                    </th>

                                    <th className="px-6 py-4 font-medium text-right">
                                        Days Remaining
                                    </th>

                                    <th className="px-6 py-4 font-medium text-right">
                                        Suggested Qty
                                    </th>

                                    <th className="px-6 py-4 font-medium">
                                        Priority
                                    </th>

                                </tr>

                            </thead>

                            <tbody className="divide-y divide-white/5">

                                {reorder.map((item, index) => (

                                    <tr
                                        key={`${item.product_name}-${index}`}
                                        className="hover:bg-white/[0.02]"
                                    >

                                        <td className="px-6 py-4">

                                            <p className="text-white font-medium">
                                                {item.product_name}
                                            </p>

                                            <p className="text-xs text-gray-500 mt-1">
                                                {item.product_category}
                                            </p>

                                        </td>

                                        <td className="px-6 py-4 text-right text-gray-300">
                                            {formatNumber(
                                                item.current_stock
                                            )}
                                        </td>

                                        <td className="px-6 py-4 text-right text-gray-300">
                                            {Number(
                                                item.daily_sales_velocity || 0
                                            ).toFixed(2)}
                                        </td>

                                        <td className="px-6 py-4 text-right">

                                            <div className="inline-flex items-center gap-1.5 text-gray-300">

                                                <Clock3 size={14} />

                                                {item.days_remaining !== null
                                                    ? `${item.days_remaining} days`
                                                    : "N/A"}

                                            </div>

                                        </td>

                                        <td className="px-6 py-4 text-right text-white font-medium">
                                            {formatNumber(
                                                item.recommended_quantity
                                            )}
                                        </td>

                                        <td className="px-6 py-4">

                                            <span
                                                className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${getPriorityClass(
                                                    item.priority
                                                )}`}
                                            >
                                                {item.priority}
                                            </span>

                                        </td>

                                    </tr>

                                ))}

                            </tbody>

                        </table>

                    </div>
                )}

            </section>

            {/* MOVEMENT TREND */}
            <section className="order-2 rounded-2xl border border-blue-900/60 bg-[#0B1730] p-5 shadow-xl">

                <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="rounded-lg border border-purple-500/20 bg-purple-500/10 p-1.5">
                            <TrendingUp className="h-4 w-4 text-purple-400" />
                        </div>
                        <h2 className="text-base font-bold tracking-wide text-white">
                            Inventory Movement Trend
                        </h2>
                    </div>
                    <span className="rounded-full border border-purple-800/50 bg-purple-900/30 px-2.5 py-1 text-xs font-semibold text-purple-300">
                        Monthly Trend
                    </span>
                </div>

                <p className="mb-4 text-sm text-slate-400">
                    Monthly units sold and revenue movement.
                </p>

                {movement.length === 0 ? (
                    <EmptyState text="No movement trend data available." />
                ) : (
                    <div className="h-[260px]">

                        <ResponsiveContainer width="100%" height="100%">

                            <AreaChart data={movement} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="inventoryTrendGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#c227daff" stopOpacity={0.6} />
                                        <stop offset="95%" stopColor="#6a00f4ff" stopOpacity={0.05} />
                                    </linearGradient>
                                </defs>

                                <CartesianGrid
                                    stroke="#1e3a8a"
                                    strokeDasharray="3 3"
                                    opacity={0.5}
                                />

                                <XAxis
                                    dataKey="month"
                                    stroke="#94a3b8"
                                    tick={{ fontSize: 11 }}
                                    axisLine={false}
                                    tickLine={false}
                                    tickMargin={10}
                                />

                                <YAxis
                                    stroke="#94a3b8"
                                    tick={{ fontSize: 11 }}
                                    axisLine={false}
                                    tickLine={false}
                                    tickFormatter={(v) => (v === 0 ? "0" : `${(v / 1000).toFixed(0)}K`)}
                                    width={48}
                                    tickMargin={6}
                                />

                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: "#122042",
                                        border: "1px solid #1e3a8a",
                                        borderRadius: "10px",
                                        fontSize: "12px",
                                        color: "#fff",
                                    }}
                                    formatter={(value, name) => [
                                        Number(value).toLocaleString("en-IN"),
                                        name === "units_sold" ? "Units Sold" : "Revenue",
                                    ]}
                                />

                                <Area
                                    type="monotone"
                                    dataKey="units_sold"
                                    stroke="#bb10d5ff"
                                    strokeWidth={3}
                                    fill="url(#inventoryTrendGradient)"
                                    dot={{ fill: "#d946ef", r: 4.5, strokeWidth: 0 }}
                                    activeDot={{ r: 6, fill: "#fff", stroke: "#d946ef", strokeWidth: 3 }}
                                />

                                <Line
                                    type="monotone"
                                    dataKey="revenue"
                                    stroke="#7c3aed"
                                    strokeWidth={2}
                                    dot={false}
                                />

                            </AreaChart>

                        </ResponsiveContainer>

                    </div>
                )}

            </section>

        </main>
    );
}


/* ============================================================
   KPI CARD
============================================================ */

function KpiCard({
    title,
    value,
    description,
    icon: Icon,
    iconBg,
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
                <h2
                    className="mt-1 truncate text-2xl font-extrabold tracking-tight text-white"
                    title={String(value ?? "")}
                >
                    {formatCompactValue(value)}
                </h2>
                <p className="mt-1 truncate text-[11px] font-medium text-slate-400">
                    {description}
                </p>
            </div>
        </div>
    );
}


/* ============================================================
   INVENTORY LIST
============================================================ */

function InventoryList({
    title,
    description,
    icon: Icon,
    iconClass,
    data,
    emptyText,
    renderItem,
}) {
    return (
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">

            <div className="p-6 border-b border-white/10">

                <div className="flex items-center gap-3">

                    <div className="p-2 rounded-lg bg-white/5">

                        <Icon
                            size={20}
                            className={iconClass}
                        />

                    </div>

                    <div>

                        <h2 className="text-lg font-semibold text-white">
                            {title}
                        </h2>

                        <p className="text-sm text-gray-400 mt-1">
                            {description}
                        </p>

                    </div>

                </div>

            </div>

            <div className="p-6 space-y-3">

                {data.length === 0 ? (
                    <p className="text-sm text-gray-500">
                        {emptyText}
                    </p>
                ) : (
                    data.map((item, index) => (

                        <div
                            key={`${item.product_name}-${index}`}
                            className="flex items-center justify-between gap-4 p-3 rounded-xl bg-white/[0.02]"
                        >
                            {renderItem(item)}
                        </div>

                    ))
                )}

            </div>

        </section>
    );
}


/* ============================================================
   EMPTY STATE
============================================================ */

function EmptyState({ text }) {
    return (
        <div className="p-8 text-center text-gray-500 text-sm">
            {text}
        </div>
    );
}