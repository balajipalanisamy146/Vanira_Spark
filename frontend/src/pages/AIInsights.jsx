import { useEffect, useMemo, useState } from "react";
import {
    AlertTriangle,
    ArrowDownRight,
    ArrowUpRight,
    Brain,
    BriefcaseBusiness,
    ChartNoAxesCombined,
    CircleDollarSign,
    RefreshCw,
    ShieldAlert,
    Sparkles,
    TrendingUp,
    Users,
    Warehouse,
} from "lucide-react";

import api from "../services/api";
import ErrorState from "../components/ErrorState";
import LoadingSkeleton from "../components/LoadingSkeleton";
import PageHero from "../components/PageHero";
import { formatCompactCurrency, formatCompactValue } from "../components/formatCompactValue";

const safeArray = (value) => (Array.isArray(value) ? value : []);
const toNumber = (value) => Number(value ?? 0) || 0;
const percentText = (value) => `${value >= 0 ? "+" : ""}${Number(value || 0).toFixed(2)}%`;

const formatMoney = (value) => formatCompactCurrency(toNumber(value));
const formatPercent = (value) => `${Number(value || 0).toFixed(2)}%`;

const categoryOptions = [
    "All",
    "Sales Insights",
    "Profitability Insights",
    "Product Performance",
    "Customer Insights",
    "Inventory Intelligence",
    "Business Risks",
    "Growth Opportunities",
];

export default function AIInsights() {
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [lastUpdated, setLastUpdated] = useState(null);
    const [snapshot, setSnapshot] = useState({
        summary: {},
        categorySales: [],
        topProfit: [],
        leastProfit: [],
        lowStock: [],
        alerts: [],
        customerKpis: {},
        inventoryKpis: {},
    });

    const loadInsights = async () => {
        setLoading(true);
        setError("");

        const results = await Promise.allSettled([
            api.get("/analytics/summary"),
            api.get("/analytics/category-sales"),
            api.get("/analytics/top-profitable-products"),
            api.get("/analytics/least-profitable-products"),
            api.get("/inventory/low-stock"),
            api.get("/inventory/alerts"),
            api.get("/customer/kpis"),
            api.get("/inventory/kpis"),
        ]);

        const [summaryRes, categorySalesRes, topProfitRes, leastProfitRes, lowStockRes, alertsRes, customerRes, inventoryRes] = results;

        const next = {
            summary: summaryRes.status === "fulfilled" ? summaryRes.value.data || {} : {},
            categorySales: categorySalesRes.status === "fulfilled" ? safeArray(categorySalesRes.value.data) : [],
            topProfit: topProfitRes.status === "fulfilled" ? safeArray(topProfitRes.value.data) : [],
            leastProfit: leastProfitRes.status === "fulfilled" ? safeArray(leastProfitRes.value.data) : [],
            lowStock: lowStockRes.status === "fulfilled" ? safeArray(lowStockRes.value.data) : [],
            alerts: alertsRes.status === "fulfilled" ? safeArray(alertsRes.value.data) : [],
            customerKpis: customerRes.status === "fulfilled" ? customerRes.value.data || {} : {},
            inventoryKpis: inventoryRes.status === "fulfilled" ? inventoryRes.value.data || {} : {},
        };

        setSnapshot(next);

        if (results.some((result) => result.status === "rejected")) {
            setError("Some insight sources are temporarily unavailable. Showing the data we could load.");
        }

        setLastUpdated(new Date());
        setLoading(false);
    };

    useEffect(() => {
        loadInsights();
    }, []);

    const insightCards = useMemo(() => {
        const summary = snapshot.summary || {};
        const categorySales = safeArray(snapshot.categorySales);
        const topProfit = safeArray(snapshot.topProfit);
        const leastProfit = safeArray(snapshot.leastProfit);
        const lowStock = safeArray(snapshot.lowStock);
        const alerts = safeArray(snapshot.alerts);
        const customerKpis = snapshot.customerKpis || {};
        const inventoryKpis = snapshot.inventoryKpis || {};

        const cards = [];

        const salesChange = toNumber(summary.sales_change?.replace("%", ""));
        if (summary.total_sales || summary.total_profit) {
            const salesStatus = salesChange >= 0 ? "up" : "down";
            cards.push({
                category: "Sales Insights",
                priority: salesChange >= 0 ? "Medium" : "High",
                title: salesChange >= 0 ? "Sales momentum is improving" : "Sales are behind the previous period",
                summary: `Revenue is ${salesStatus} by ${percentText(salesChange)} compared with the prior period, while total sales reached ${formatMoney(summary.total_sales)}.`,
                metric: formatMoney(summary.total_sales),
                comparison: summary.sales_change ? `Vs previous period: ${summary.sales_change}` : "Previous period comparison not available",
                impact: "This directly affects cash flow and demand planning.",
                action: "Review promotion and channel performance to sustain the current trajectory.",
                confidence: "Strong",
            });
        }

        if (summary.total_profit || summary.profit_margin) {
            const margin = toNumber(summary.profit_margin);
            cards.push({
                category: "Profitability Insights",
                priority: margin >= 0 ? "Medium" : "High",
                title: margin > 0 ? "Profitability remains positive" : "Margin is under pressure",
                summary: `Profit generated is ${formatMoney(summary.total_profit)} with a margin of ${formatPercent(summary.profit_margin)}.`,
                metric: `${formatPercent(summary.profit_margin)} margin`,
                comparison: summary.margin_change ? `Margin change: ${summary.margin_change}` : "Margin trend unavailable",
                impact: "Margin performance determines how efficiently growth converts into net value.",
                action: "Monitor discounting and operating cost pressure to protect profitability.",
                confidence: "Strong",
            });
        }

        if (topProfit.length > 0) {
            const leader = topProfit[0];
            cards.push({
                category: "Product Performance",
                priority: "High",
                title: `${leader.product_name || "Top product"} is the strongest profit driver`,
                summary: `${leader.product_name || "The leading product"} contributed ${formatMoney(leader.profit)} in profit and ${formatMoney(leader.revenue)} in revenue.`,
                metric: formatMoney(leader.profit),
                comparison: "Top revenue driver in the current business dataset",
                impact: "This product is a key source of margin and operating leverage.",
                action: "Protect stock availability and prioritize marketing for this high-performing product.",
                confidence: "High",
            });
        }

        if (leastProfit.length > 0) {
            const laggard = leastProfit[0];
            cards.push({
                category: "Growth Opportunities",
                priority: "Medium",
                title: `${laggard.product_name || "A product"} needs attention`,
                summary: `${laggard.product_name || "One product"} is among the least profitable items at ${formatMoney(laggard.profit)} in profit.`,
                metric: formatMoney(laggard.profit),
                comparison: "Lowest profit among current product results",
                impact: "A weak margin product may reduce overall business efficiency.",
                action: "Review pricing, sourcing, or assortment strategy for this SKU.",
                confidence: "Moderate",
            });
        }

        if (customerKpis.total_customers || customerKpis.repeat_customers) {
            const totalCustomers = toNumber(customerKpis.total_customers);
            const repeatCustomers = toNumber(customerKpis.repeat_customers);
            const repeatRate = totalCustomers > 0 ? (repeatCustomers / totalCustomers) * 100 : 0;
            const vipCustomers = toNumber(customerKpis.vip_customers);

            if (totalCustomers > 0) {
                cards.push({
                    category: "Customer Insights",
                    priority: repeatRate >= 40 ? "Medium" : "Low",
                    title: `${repeatRate.toFixed(1)}% of customers are repeat buyers`,
                    summary: `${repeatCustomers} of ${totalCustomers} customers purchased more than once, with ${vipCustomers} customers qualifying as high-value buyers.`,
                    metric: `${repeatRate.toFixed(1)}% repeat rate`,
                    comparison: customerKpis.avg_order_value ? `Average order value: ${formatMoney(customerKpis.avg_order_value)}` : "Customer order value data not available",
                    impact: "Repeat purchase behavior indicates retention quality and future revenue stability.",
                    action: "Increase retention campaigns for first-time buyers and protect top customer segments.",
                    confidence: "Moderate",
                });
            }
        }

        if (lowStock.length > 0 || alerts.length > 0 || (inventoryKpis.low_stock_products ?? 0) > 0) {
            const topRisk = lowStock[0] || alerts[0] || {};
            const riskTitle = topRisk.product_name ? `${topRisk.product_name} is at risk` : "Inventory risk detected";
            cards.push({
                category: "Inventory Intelligence",
                priority: "High",
                title: riskTitle,
                summary: `${lowStock.length || inventoryKpis.low_stock_products || 0} products are low in stock, and ${alerts.length} active inventory alerts currently require attention.`,
                metric: `${lowStock.length || inventoryKpis.low_stock_products || 0} low-stock items`,
                comparison: topRisk.stock_coverage_days ? `Coverage: ${topRisk.stock_coverage_days} days` : "Stock coverage data available for review",
                impact: "Stockout risk can reduce sales conversion and buyer trust.",
                action: "Replenish priority items and validate reorder thresholds before peak demand days.",
                confidence: "High",
            });
        }

        if (categorySales.length > 0) {
            const leader = categorySales[0];
            const category = leader.category || "Current category";
            cards.push({
                category: "Business Risks",
                priority: "Medium",
                title: `${category} leads the revenue base`,
                summary: `${category} is currently contributing ${formatMoney(leader.revenue)} in sales, which creates both opportunity and concentration risk.`,
                metric: formatMoney(leader.revenue),
                comparison: `Category revenue leader`,
                impact: "Heavy concentration can make revenue more vulnerable to changes in a single category.",
                action: "Balance assortment investment and risk mitigation around this category.",
                confidence: "Moderate",
            });
        }

        return cards;
    }, [snapshot]);

    const filteredInsights =
        selectedCategory === "All"
            ? insightCards
            : insightCards.filter((item) => item.category === selectedCategory);

    const overview = useMemo(() => {
        const highPriorityRisks = filteredInsights.filter((item) => ["Critical", "High"].includes(item.priority)).length;
        const growthOpportunities = filteredInsights.filter((item) => item.category === "Growth Opportunities").length;
        const actionableRecommendations = filteredInsights.filter((item) => item.action).length;

        return {
            totalGeneratedInsights: filteredInsights.length,
            highPriorityRisks,
            growthOpportunities,
            actionableRecommendations,
        };
    }, [filteredInsights]);

    const executiveSummary = useMemo(() => {
        const summary = snapshot.summary || {};
        const topProduct = safeArray(snapshot.topProfit)[0];
        const categoryLeader = safeArray(snapshot.categorySales)[0];
        const lowStockCount = safeArray(snapshot.lowStock).length || toNumber(snapshot.inventoryKpis?.low_stock_products);
        const salesChange = toNumber(summary.sales_change?.replace("%", ""));

        const parts = [];

        if (summary.total_sales || summary.total_profit) {
            parts.push(`Sales are ${formatMoney(summary.total_sales)} with profit of ${formatMoney(summary.total_profit)}.`);
        }

        if (summary.sales_change) {
            parts.push(`Compared with the previous period, the business is ${salesChange >= 0 ? "up" : "down"} ${percentText(salesChange)} in sales.`);
        } else {
            parts.push("A previous-period comparison is not available for this business window.");
        }

        if (topProduct?.product_name) {
            parts.push(`${topProduct.product_name} is the strongest profit contributor at ${formatMoney(topProduct.profit)}.`);
        }

        if (categoryLeader?.category) {
            parts.push(`${categoryLeader.category} is the largest category by revenue at ${formatMoney(categoryLeader.revenue)}.`);
        }

        if (lowStockCount > 0) {
            parts.push(`${lowStockCount} low-stock products need reorder attention.`);
        }

        const action = summary.sales_change && salesChange < 0
            ? "Prioritize promotional actions for the weakest performing products while protecting margin on the strongest sellers."
            : "Protect the current top sellers and continue monitoring stock levels to support sustained momentum.";

        parts.push(action);

        return parts.join(" ");
    }, [snapshot]);

    const summaryCards = [
        { label: "Total generated insights", value: overview.totalGeneratedInsights, tone: "bg-indigo-500/20 text-indigo-200" },
        { label: "High-priority risks", value: overview.highPriorityRisks, tone: "bg-rose-500/20 text-rose-200" },
        { label: "Growth opportunities", value: overview.growthOpportunities, tone: "bg-emerald-500/20 text-emerald-200" },
        { label: "Actionable recommendations", value: overview.actionableRecommendations, tone: "bg-cyan-500/20 text-cyan-200" },
    ];

    if (loading) {
        return (
            <div className="p-6 flex-1 space-y-5">
                <PageHero title="AI Insights" subtitle="Intelligent business analysis and actionable recommendations based on your business data." icon={Brain} />
                <div className="grid grid-cols-4 gap-4">
                    <LoadingSkeleton className="h-28" />
                    <LoadingSkeleton className="h-28" />
                    <LoadingSkeleton className="h-28" />
                    <LoadingSkeleton className="h-28" />
                </div>
                <div className="grid grid-cols-12 gap-4">
                    <div className="col-span-8">
                        <LoadingSkeleton className="h-[220px]" />
                    </div>
                    <div className="col-span-4">
                        <LoadingSkeleton className="h-[220px]" />
                    </div>
                </div>
            </div>
        );
    }

    if (error && !filteredInsights.length) {
        return (
            <div className="p-6 flex-1 space-y-5">
                <PageHero title="AI Insights" subtitle="Intelligent business analysis and actionable recommendations based on your business data." icon={Brain} />
                <ErrorState message={error} onRetry={loadInsights} />
            </div>
        );
    }

    return (
        <div className="p-6 flex-1 space-y-5">
            <PageHero
                title="AI Insights"
                subtitle="Intelligent business analysis and actionable recommendations based on your business data."
                icon={Brain}
                action={
                    <div className="flex items-center gap-2">
                        <div className="rounded-lg border border-blue-900/70 bg-slate-950/40 px-2 py-1 text-[10px] uppercase tracking-[0.24em] text-blue-200">
                            30D window
                        </div>
                        <button
                            onClick={loadInsights}
                            className="inline-flex items-center gap-2 rounded-xl border border-purple-500/40 bg-purple-600/15 px-3 py-2 text-xs font-semibold text-purple-100 transition hover:bg-purple-600/25"
                        >
                            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                            Refresh insights
                        </button>
                    </div>
                }
            />

            <div className="flex flex-col gap-3 rounded-2xl border border-blue-900/70 bg-[#0B1730] p-4 shadow-xl lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-wrap items-center gap-2">
                    <div className="inline-flex items-center gap-2 rounded-xl border border-blue-900 bg-[#081124] px-2.5 py-2 text-xs text-slate-300">
                        <ChartNoAxesCombined size={14} className="text-cyan-300" />
                        Date range
                    </div>
                    <div className="rounded-xl border border-blue-900 bg-[#081124] px-2.5 py-2 text-xs text-slate-400">
                        Last 30 days
                    </div>
                    <div className="rounded-xl border border-blue-900 bg-[#081124] px-2.5 py-2 text-xs text-slate-400">
                        Compare with prior period
                    </div>
                </div>

                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-green-500/30 bg-green-500/10 px-2 py-1.5 text-green-300">
                        <Sparkles size={12} />
                        Last updated: {lastUpdated ? lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Now"}
                    </span>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {summaryCards.map((card) => (
                    <div key={card.label} className="rounded-2xl border border-blue-900/70 bg-[#0B1730] p-4 shadow-xl">
                        <div className={`inline-flex rounded-xl px-2.5 py-1.5 text-xs font-semibold ${card.tone}`}>
                            {card.label}
                        </div>
                        <div className="mt-4 text-3xl font-extrabold text-white">{card.value}</div>
                    </div>
                ))}
            </div>

            <div className="grid gap-5 xl:grid-cols-[1.4fr_0.9fr]">
                <div className="rounded-2xl border border-blue-900/70 bg-[#0B1730] p-5 shadow-xl">
                    <div className="mb-4 flex items-center gap-3">
                        <div className="rounded-xl bg-purple-500/15 p-2 text-purple-300">
                            <BriefcaseBusiness size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">AI executive summary</h2>
                            <p className="text-xs text-slate-400">Current period vs previous comparable period</p>
                        </div>
                    </div>
                    <p className="text-sm leading-7 text-slate-200">{executiveSummary}</p>
                </div>

                <div className="rounded-2xl border border-blue-900/70 bg-[#0B1730] p-5 shadow-xl">
                    <div className="mb-4 flex items-center gap-3">
                        <div className="rounded-xl bg-cyan-500/15 p-2 text-cyan-300">
                            <TrendingUp size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Insight filters</h2>
                            <p className="text-xs text-slate-400">Focus the analysis</p>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {categoryOptions.map((option) => (
                            <button
                                key={option}
                                onClick={() => setSelectedCategory(option)}
                                className={`rounded-xl border px-2.5 py-2 text-[11px] font-semibold transition ${
                                    selectedCategory === option
                                        ? "border-purple-500 bg-purple-600/20 text-purple-100"
                                        : "border-blue-900 bg-[#081124] text-slate-300 hover:border-blue-700"
                                }`}
                            >
                                {option}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {filteredInsights.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-blue-900 bg-[#0B1730] p-8 text-center text-slate-300">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-800">
                        <Brain size={22} className="text-purple-300" />
                    </div>
                    <h3 className="text-lg font-semibold text-white">No insight matches the current filter</h3>
                    <p className="mt-2 text-sm text-slate-400">Try a different category or refresh the dataset to regenerate the analysis.</p>
                </div>
            ) : (
                <div className="grid gap-4 lg:grid-cols-2">
                    {filteredInsights.map((insight, index) => {
                        const isPositive = insight.priority !== "High" && insight.priority !== "Critical";

                        return (
                            <div key={`${insight.category}-${index}`} className="rounded-2xl border border-blue-900/70 bg-[#0B1730] p-5 shadow-xl">
                                <div className="mb-4 flex items-start justify-between gap-3">
                                    <div>
                                        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-cyan-200">{insight.category}</p>
                                        <h3 className="mt-2 text-xl font-bold text-white">{insight.title}</h3>
                                    </div>
                                    <span
                                        className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-bold ${
                                            insight.priority === "Critical"
                                                ? "border-rose-500/40 bg-rose-500/10 text-rose-200"
                                                : insight.priority === "High"
                                                    ? "border-orange-500/40 bg-orange-500/10 text-orange-200"
                                                    : insight.priority === "Medium"
                                                        ? "border-amber-500/40 bg-amber-500/10 text-amber-200"
                                                        : "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
                                        }`}
                                    >
                                        {isPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                                        {insight.priority}
                                    </span>
                                </div>

                                <p className="text-sm leading-6 text-slate-200">{insight.summary}</p>

                                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                    <div className="rounded-xl border border-blue-900 bg-[#081124] p-3">
                                        <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Main metric</p>
                                        <div className="mt-2 text-xl font-extrabold text-white">{insight.metric}</div>
                                    </div>
                                    <div className="rounded-xl border border-blue-900 bg-[#081124] p-3">
                                        <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Comparison</p>
                                        <div className="mt-2 text-sm font-medium text-slate-200">{insight.comparison}</div>
                                    </div>
                                </div>

                                <div className="mt-4 space-y-3 text-sm text-slate-300">
                                    <div className="flex items-start gap-2">
                                        <ShieldAlert size={16} className="mt-0.5 text-purple-300" />
                                        <span><strong className="text-white">Impact:</strong> {insight.impact}</span>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <Sparkles size={16} className="mt-0.5 text-cyan-300" />
                                        <span><strong className="text-white">Action:</strong> {insight.action}</span>
                                    </div>
                                </div>

                                <div className="mt-4 flex items-center justify-between border-t border-blue-900 pt-3 text-[11px] text-slate-400">
                                    <span className="inline-flex items-center gap-1.5">
                                        <CircleDollarSign size={12} className="text-emerald-300" />
                                        Confidence: {insight.confidence}
                                    </span>
                                    <span className="inline-flex items-center gap-1.5">
                                        <AlertTriangle size={12} className="text-yellow-300" />
                                        Evidence-based signal
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <div className="grid gap-4 lg:grid-cols-3">
                <div className="rounded-2xl border border-blue-900/70 bg-[#0B1730] p-5 shadow-xl">
                    <div className="mb-3 flex items-center gap-2 text-purple-300">
                        <TrendingUp size={18} />
                        <h3 className="text-base font-bold text-white">Sales & profit</h3>
                    </div>
                    <p className="text-sm text-slate-300">
                        {summaryCards[0]?.label ? `Current sales total: ${formatMoney(snapshot.summary?.total_sales)}` : "Sales data unavailable"}
                    </p>
                    <p className="mt-2 text-sm text-slate-300">
                        Profit: {formatMoney(snapshot.summary?.total_profit)}
                    </p>
                </div>

                <div className="rounded-2xl border border-blue-900/70 bg-[#0B1730] p-5 shadow-xl">
                    <div className="mb-3 flex items-center gap-2 text-cyan-300">
                        <Users size={18} />
                        <h3 className="text-base font-bold text-white">Customer health</h3>
                    </div>
                    <p className="text-sm text-slate-300">
                        Total customers: {formatCompactValue(snapshot.customerKpis?.total_customers ?? 0)}
                    </p>
                    <p className="mt-2 text-sm text-slate-300">
                        Repeat customers: {formatCompactValue(snapshot.customerKpis?.repeat_customers ?? 0)}
                    </p>
                </div>

                <div className="rounded-2xl border border-blue-900/70 bg-[#0B1730] p-5 shadow-xl">
                    <div className="mb-3 flex items-center gap-2 text-emerald-300">
                        <Warehouse size={18} />
                        <h3 className="text-base font-bold text-white">Inventory watchlist</h3>
                    </div>
                    <p className="text-sm text-slate-300">
                        Low-stock items: {formatCompactValue(snapshot.inventoryKpis?.low_stock_products ?? safeArray(snapshot.lowStock).length)}
                    </p>
                    <p className="mt-2 text-sm text-slate-300">
                        Active alerts: {safeArray(snapshot.alerts).length}
                    </p>
                </div>
            </div>
        </div>
    );
}
