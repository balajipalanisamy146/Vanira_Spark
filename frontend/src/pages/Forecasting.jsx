import { useEffect, useState } from "react";
import {
    Brain,
    Coins,
    TrendingUp,
} from "lucide-react";

import api from "../services/api";

import ForecastChart from "../components/ForecastChart";
import CategoryForecast from "../components/CategoryForecast";
import FestivalImpact from "../components/FestivalImpact";
import AIForecastInsights from "../components/AIForecastInsights";
import PageHero from "../components/PageHero";
import KpiCard from "../components/KpiCard";
import useLocalDayRollover from "../hooks/useLocalDayRollover";


export default function Forecasting() {

    const currentDay = useLocalDayRollover();
    const [forecast7, setForecast7] = useState([]);

    const [forecast30, setForecast30] = useState(null);

    const [growth, setGrowth] = useState(null);

    const [confidence, setConfidence] = useState(null);

    const [festival, setFestival] = useState(null);

    const [insights, setInsights] = useState(null);

    const [loading, setLoading] = useState(true);


    // ==============================
    // GET 7 DAY FORECAST
    // ==============================

    useEffect(() => {

        Promise.all([

            api.get("/forecast/7-days"),

            api.get("/forecast/30-days"),

            api.get("/forecast/growth"),

            api.get("/forecast/confidence"),

            api.get("/forecast/festival"),

            api.get("/forecast/insights"),

        ])

            .then(([

                forecast7Res,

                forecast30Res,

                growthRes,

                confidenceRes,

                festivalRes,

                insightsRes,

            ]) => {

                setForecast7(
                    forecast7Res.data
                );

                setForecast30(
                    forecast30Res.data
                );

                setGrowth(
                    growthRes.data
                );

                setConfidence(
                    confidenceRes.data
                );

                setFestival(
                    festivalRes.data
                );

                setInsights(
                    insightsRes.data
                );

            })

            .catch((err) => {

                console.error(
                    "Forecast API Error:",
                    err
                );

            })

            .finally(() => {

                setLoading(false);

            });

    }, [currentDay]);


    // ==============================
    // CALCULATE 7 DAY TOTAL
    // ==============================

    const total7Days = forecast7.reduce(

        (total, item) => {

            return (
                total +
                Number(
                    item.forecast_sales || 0
                )
            );

        },

        0

    );

    const growthPct = Number(growth?.growth_percentage || 0);
    const confidencePct = Number(confidence?.confidence_percentage || 0);
    const total30Days = Number(forecast30?.forecast_sales || 0);

    return (

        <main className="flex-1 min-h-screen bg-[#020617] text-white p-6 md:p-8 space-y-5">
            <PageHero
                title="Sales Forecasting"
                subtitle="Predict future sales and demand using AI-powered forecasting."
                icon={TrendingUp}
            />


            {/* ========================================= */}
            {/* KPI CARDS */}
            {/* ========================================= */}

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
                <KpiCard
                    title="7 Day Forecast"
                    value={loading ? "₹0" : `₹${total7Days.toLocaleString("en-IN")}`}
                    icon={TrendingUp}
                    iconBg="bg-cyan-500"
                    change={loading || !growth ? "0%" : `${Math.abs(growthPct).toFixed(1)}%`}
                    isPositive={growthPct >= 0}
                    period="vs previous period"
                />

                <KpiCard
                    title="30 Day Forecast"
                    value={loading ? "₹0" : `₹${total30Days.toLocaleString("en-IN")}`}
                    icon={Coins}
                    iconBg="bg-violet-500"
                    change={loading || !growth ? "0%" : `${Math.abs(growthPct).toFixed(1)}%`}
                    isPositive={growthPct >= 0}
                    period="vs previous month"
                />

                <KpiCard
                    title="Expected Growth"
                    value={loading || !growth ? "0%" : `${Math.abs(growthPct).toFixed(1)}%`}
                    icon={TrendingUp}
                    iconBg="bg-emerald-500"
                    change={loading || !growth ? "0%" : `${Math.abs(growthPct).toFixed(1)}%`}
                    isPositive={growthPct >= 0}
                    period="vs previous period"
                />

                <KpiCard
                    title="Forecast Confidence"
                    value={loading || !confidence ? "0%" : `${confidencePct.toFixed(1)}%`}
                    icon={Brain}
                    iconBg="bg-blue-500"
                    change={loading || !confidence ? "0%" : `${confidencePct.toFixed(1)}%`}
                    isPositive={confidencePct >= 60}
                    period="model confidence"
                />
            </div>


            {/* ========================================= */}
            {/* 7 DAY FORECAST CHART */}
            {/* ========================================= */}

            <div className="mb-8">

                <ForecastChart
                    data={forecast7}
                />

            </div>


            {/* ========================================= */}
            {/* CATEGORY FORECAST */}
            {/* ========================================= */}

            <div className="mb-8">

                <CategoryForecast />

                <FestivalImpact />

                <AIForecastInsights />



            </div>

        </main>

    );
}