import { useEffect, useState } from "react";
import { Coins, ShoppingCart, Percent, TrendingUp, CreditCard } from "lucide-react";
import api from "../services/api";

import KpiCard from "../components/KpiCard";
import TrendChart from "../components/TrendChart";
import RevenueBreakdown from "../components/RevenueBreakdown";
import ProfitAnalytics from "../components/ProfitAnalytics";
import CustomerPurchaseSignals from "../components/CustomerPurchaseSignals";
import PageHero from "../components/PageHero";

export default function SalesAnalytics() {

    const [kpis, setKpis] = useState({});

    const [dailyTrend, setDailyTrend] = useState([]);

    const [weeklyTrend, setWeeklyTrend] = useState([]);

    const [monthlyTrend, setMonthlyTrend] = useState([]);

    const [yearlyTrend, setYearlyTrend] = useState([]);

    useEffect(() => {

        api
            .get("/analytics/kpis")
            .then((res) => {

                setKpis(res.data);

            });

        api
            .get("/analytics/sales-trend")
            .then(res => setDailyTrend(res.data));

        api
            .get("/analytics/weekly-trend")
            .then(res => setWeeklyTrend(res.data));

        api
            .get("/analytics/monthly-trend")
            .then(res => setMonthlyTrend(res.data));

        api
            .get("/analytics/yearly-trend")
            .then(res => setYearlyTrend(res.data));

    }, []);

    return (

        <div className="sales-analytics-page p-6 flex-1 space-y-5 min-w-0">

            <PageHero
                title="Sales Analytics"
                subtitle="Track revenue trends and performance across daily, weekly, monthly, and yearly views."
                icon={TrendingUp}
            />

            <div className="grid grid-cols-5 gap-5">

                <KpiCard
                    title="Revenue"
                    value={`₹${kpis.total_revenue ? Number(kpis.total_revenue).toLocaleString('en-IN') : 0}`}
                    icon={Coins}
                    iconBg="bg-indigo-600"
                    change={kpis.revenue_change ?? "0.00%"}
                    isPositive={kpis.revenue_change_positive ?? true}
                    period="vs last month"
                />

                <KpiCard
                    title="Orders"
                    value={kpis.total_orders ? Number(kpis.total_orders).toLocaleString('en-IN') : 0}
                    icon={ShoppingCart}
                    iconBg="bg-cyan-500"
                    change={kpis.orders_change ?? "0.00%"}
                    isPositive={kpis.orders_change_positive ?? true}
                    period="vs last month"
                />

                <KpiCard
                    title="Avg Order Value"
                    value={`₹${kpis.avg_order_value ? Number(kpis.avg_order_value).toLocaleString('en-IN') : 0}`}
                    icon={CreditCard}
                    iconBg="bg-purple-500"
                    change={kpis.aov_change ?? "0.00%"}
                    isPositive={kpis.aov_change_positive ?? true}
                    period="vs last month"
                />

                <KpiCard
                    title="Profit"
                    value={`₹${kpis.total_profit ? Number(kpis.total_profit).toLocaleString('en-IN') : 0}`}
                    icon={TrendingUp}
                    iconBg="bg-emerald-500"
                    change={kpis.profit_change ?? "0.00%"}
                    isPositive={kpis.profit_change_positive ?? true}
                    period="vs last month"
                />

                <KpiCard
                    title="Profit Margin"
                    value={`${kpis.profit_margin || 0}%`}
                    icon={Percent}
                    iconBg="bg-rose-500"
                    change={kpis.margin_change ?? "0.00 pp"}
                    isPositive={kpis.margin_change_positive ?? true}
                    period="vs last month"
                />

            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                <TrendChart
                    title="Daily Sales Trend"
                    data={dailyTrend}
                />

                <TrendChart
                    title="Weekly Sales Trend"
                    data={weeklyTrend}
                />

                <TrendChart
                    title="Monthly Sales Trend"
                    data={monthlyTrend}
                />

                <TrendChart
                    title="Yearly Sales Trend"
                    data={yearlyTrend}
                />

            </div>

            <RevenueBreakdown />

            <ProfitAnalytics />

            <CustomerPurchaseSignals />

        </div>
    );
}