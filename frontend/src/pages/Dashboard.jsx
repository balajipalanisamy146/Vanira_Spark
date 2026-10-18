// src/pages/Dashboard.jsx

import { useEffect, useState } from "react";

import api from "../services/api";

import { Coins, ShoppingCart, Percent } from "lucide-react";
import HeroBanner from "../components/HeroBanner";
import KpiCard from "../components/KpiCard";

import SalesTrendChart from "../components/SalesTrendChart";
import CategoryChart from "../components/CategoryChart";

import TopProductsTable from "../components/TopProductsTable";
import InventoryWidget from "../components/InventoryWidget";
import AiAdvisor from "../components/AiAdvisor";
import ForecastWidget from "../components/ForecastWidget";
import NotificationPanel from "../components/NotificationPanel";
import LoadingSkeleton from "../components/LoadingSkeleton";
import ErrorState from "../components/ErrorState";
import QuickActions from "../components/QuickActions";
import AIAgentsPanel from "../components/AIAgentsPanel";
import OwnerCopilot from "../components/OwnerCopilot";
import ForecastChart from "../components/ForecastChart";
import useLocalDayRollover from "../hooks/useLocalDayRollover";

export default function Dashboard({ onNavigate }) {

    const currentDay = useLocalDayRollover();
    const [summary, setSummary] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [trend, setTrend] = useState([]);
    const [category, setCategory] = useState([]);
    const [products, setProducts] = useState([]);
    const [forecast, setForecast] = useState([]);


    const loadDashboard = async () => {
        setLoading(true);

        const results = await Promise.allSettled([
            api.get("/analytics/summary"),
            api.get("/analytics/sales-trend"),
            api.get("/analytics/category-sales"),
            api.get("/analytics/top-products"),
        ]);

        const [summaryRes, trendRes, categoryRes, productsRes] = results;

        // Summary
        if (summaryRes.status === "fulfilled") {
            setSummary(summaryRes.value.data);
        }

        // Sales Trend
        if (trendRes.status === "fulfilled") {
            setTrend(trendRes.value.data);
        }

        // Category
        if (categoryRes.status === "fulfilled") {
            setCategory(categoryRes.value.data);
        }

        // Products
        if (productsRes.status === "fulfilled") {
            setProducts(productsRes.value.data);
        }

        setLoading(false);
    };
    useEffect(() => {

        loadDashboard();

        api
            .get("/forecast/7-days")
            .then((res) => {

                setForecast(res.data);

            })
            .catch((err) => {

                console.log(err);

            });

    }, [currentDay]);


    return (

        <div className="p-6 flex-1 space-y-5">

            {/* HERO BANNER */}
            <HeroBanner />

            {/* KPI CARDS — 4 equal columns */}
            {loading ? (
                <div className="grid grid-cols-4 gap-4">
                    <LoadingSkeleton className="h-28" />
                    <LoadingSkeleton className="h-28" />
                    <LoadingSkeleton className="h-28" />
                    <LoadingSkeleton className="h-28" />
                </div>
            ) : (
                <div className="grid grid-cols-4 gap-4">
                    <KpiCard
                        title="Total Sales"
                        value={summary.total_sales ? `₹${Number(summary.total_sales).toLocaleString('en-IN')}` : "₹0"}
                        icon={Coins}
                        iconBg="bg-indigo-600"
                        change={summary.sales_change || "0%"}
                        isPositive={summary.sales_change_positive ?? true}
                        period="vs same days last week"
                    />
                    <KpiCard
                        title="Total Orders"
                        value={summary.total_orders ? summary.total_orders.toLocaleString('en-IN') : "0"}
                        icon={ShoppingCart}
                        iconBg="bg-cyan-500"
                        change={summary.orders_change || "0%"}
                        isPositive={summary.orders_change_positive ?? true}
                        period="vs same days last week"
                    />
                    <KpiCard
                        title="Total Profit"
                        value={summary.total_profit ? `₹${Number(summary.total_profit).toLocaleString('en-IN')}` : "₹0"}
                        icon={Coins}
                        iconBg="bg-emerald-500"
                        change={summary.profit_change || "0%"}
                        isPositive={summary.profit_change_positive ?? true}
                        period="vs same days last week"
                    />
                    <KpiCard
                        title="Profit Margin"
                        value={summary.profit_margin ? `${summary.profit_margin}%` : "0%"}
                        icon={Percent}
                        iconBg="bg-rose-500"
                        change={summary.margin_change || "0%"}
                        isPositive={summary.margin_change_positive ?? true}
                        period="vs last week"
                    />
                </div>
            )}

            {/* MAIN CONTENT AREA */}
            {loading ? (
                <div className="grid grid-cols-12 gap-4">
                    <LoadingSkeleton className="h-[340px] col-span-9" />
                    <LoadingSkeleton className="h-[340px] col-span-3" />
                </div>
            ) : (
                <div className="grid grid-cols-12 gap-4 items-start">

                    {/* LEFT COLUMN — 9 cols */}
                    <div className="col-span-9 flex flex-col gap-4">
                        
                        {/* TOP ROW */}
                        <div className="grid grid-cols-9 gap-4">
                            <div className="col-span-5">
                                <SalesTrendChart data={trend} />
                            </div>
                            <div className="col-span-4">
                                <CategoryChart data={category} totalSales={summary.total_sales || summary.totalSales} />
                            </div>
                        </div>

                        {/* BOTTOM ROW */}
                        <div className="grid grid-cols-9 gap-4 h-full">
                            <div className="col-span-3">
                                <TopProductsTable products={products} onNavigate={onNavigate} />
                            </div>
                            <div className="col-span-4">
                                <ForecastWidget forecast={forecast} />
                            </div>
                            <div className="col-span-2">
                                <InventoryWidget />
                            </div>
                        </div>

                    </div>

                    {/* RIGHT COLUMN — 3 cols */}
                    <div className="col-span-3 self-stretch flex flex-col justify-between">
                        <div id="dashboard-ai-advisor">
                            <AiAdvisor />
                        </div>
                        <QuickActions onNavigate={onNavigate} />
                        <div id="dashboard-ai-agents">
                            <AIAgentsPanel />
                        </div>
                    </div>

                </div>
            )}

        </div>
    );
}
