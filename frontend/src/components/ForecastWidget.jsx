import { useEffect, useState } from "react";
import { CalendarDays, TrendingUp, RefreshCw, BarChart3 } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from "recharts";

import api from "../services/api";
import useLocalDayRollover from "../hooks/useLocalDayRollover";

export default function ForecastWidget() {

    const currentDay = useLocalDayRollover();
    const [forecast, setForecast] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const loadForecast = async () => {

        try {

            setLoading(true);
            setError("");

            const response = await api.get("/forecast/7-days");

            const data = Array.isArray(response.data)
                ? response.data
                : [];

            setForecast(data);

        } catch (err) {

            console.error("Forecast error:", err);

            setError(
                "Unable to load sales forecast."
            );

            setForecast([]);

        } finally {

            setLoading(false);

        }
    };

    useEffect(() => {
        loadForecast();
    }, [currentDay]);

    const totalRevenue = forecast.reduce(
        (sum, item) =>
            sum + Number(item.forecast_sales || 0),
        0
    );

    return (

        <div className="glass-card p-5 h-full">

            {/* HEADER */}

            <div className="flex items-center justify-between mb-5">

                <div className="flex items-center gap-2">

                    <div className="
                        p-1.5
                        rounded-lg
                        bg-purple-500/10
                        border border-purple-500/20
                        flex
                        items-center
                        justify-center
                    ">
                        <BarChart3
                            size={16}
                            className="text-purple-400"
                        />
                    </div>

                    <div className="flex items-baseline gap-2">
                        <h2 className="text-sm font-bold text-white tracking-wide">
                            Sales Forecast
                        </h2>
                        <p className="text-[10px] text-blue-300 font-medium">
                            (Next 7 Days)
                        </p>
                    </div>

                </div>

                <button
                    onClick={loadForecast}
                    disabled={loading}
                    className="
                        p-2
                        rounded-lg
                        bg-slate-800
                        hover:bg-slate-700
                        transition
                    "
                    title="Refresh forecast"
                >

                    <RefreshCw
                        size={17}
                        className={
                            loading
                                ? "animate-spin"
                                : ""
                        }
                    />

                </button>

            </div>


            {/* LOADING */}

            {loading && (

                <div className="space-y-3">

                    {[1, 2, 3, 4, 5, 6, 7].map(
                        (item) => (

                            <div
                                key={item}
                                className="
                                    h-8
                                    rounded-lg
                                    bg-slate-800
                                    animate-pulse
                                "
                            />

                        )
                    )}

                </div>

            )}


            {/* ERROR */}

            {!loading && error && (

                <div className="
                    p-4
                    rounded-xl
                    bg-red-500/10
                    border
                    border-red-500/20
                    text-red-400
                    text-sm
                ">

                    {error}

                </div>

            )}


            {/* EMPTY */}

            {!loading &&
                !error &&
                forecast.length === 0 && (

                    <div className="
                        flex
                        flex-col
                        items-center
                        justify-center
                        py-10
                        text-center
                    ">

                        <CalendarDays
                            size={35}
                            className="text-slate-500 mb-3"
                        />

                        <p className="text-slate-400">
                            No forecast data available.
                        </p>

                    </div>

                )}


            {/* FORECAST CHART */}

            {!loading &&
                !error &&
                forecast.length > 0 && (

                    <div className="w-full h-[220px] mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart 
                                data={forecast.slice(0, 7).map(item => {
                                    const date = new Date(item.date);
                                    return {
                                        ...item,
                                        displayDate: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                                    };
                                })} 
                                margin={{ top: 5, right: 10, left: 0, bottom: 0 }}
                            >
                                <defs>
                                    <linearGradient id="forecastGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#d900ffff" stopOpacity={1} />
                                        <stop offset="100%" stopColor="#4a08f2ff" stopOpacity={1} />
                                    </linearGradient>
                                </defs>

                                <CartesianGrid stroke="#1e3a8a" opacity={0.5} />

                                <XAxis
                                    dataKey="displayDate"
                                    tick={{ fill: "#94a3b8", fontSize: 10 }}
                                    axisLine={false}
                                    tickLine={false}
                                    tickMargin={10}
                                />

                                <YAxis
                                    tick={{ fill: "#94a3b8", fontSize: 10 }}
                                    axisLine={false}
                                    tickLine={false}
                                    tickFormatter={(v) => v === 0 ? "0" : `${(v / 1000).toFixed(0)}K`}
                                    width={46}
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
                                    formatter={(value) => [`₹${Number(value).toLocaleString("en-IN")}`, "Forecast"]}
                                />

                                <Bar 
                                    dataKey="forecast_sales" 
                                    fill="url(#forecastGradient)" 
                                    radius={[4, 4, 0, 0]} 
                                    barSize={24}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                )}

        </div>

    );
}