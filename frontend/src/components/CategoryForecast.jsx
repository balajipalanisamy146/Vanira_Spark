import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

import api from "../services/api";


export default function CategoryForecast() {

    const [categories, setCategories] = useState([]);

    const [loading, setLoading] = useState(true);


    // ========================================================
    // GET CATEGORY FORECAST
    // ========================================================

    useEffect(() => {

        api.get("/forecast/categories")

            .then((res) => {

                console.log(
                    "Category Forecast:",
                    res.data
                );

                setCategories(
                    Array.isArray(res.data)
                        ? res.data
                        : []
                );

            })

            .catch((err) => {

                console.error(
                    "Category Forecast API Error:",
                    err
                );

            })

            .finally(() => {

                setLoading(false);

            });

    }, []);


    // ========================================================
    // LOADING STATE
    // ========================================================

    if (loading) {

        return (

            <div className="glass-card p-6">

                <div className="mb-6">

                    <h2 className="text-xl font-bold">
                        Category Forecast
                    </h2>

                    <p className="text-sm text-slate-400 mt-1">
                        Loading category forecast...
                    </p>

                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">

                    {[1, 2, 3, 4].map((item) => (

                        <div
                            key={item}
                            className="bg-[#081124] border border-blue-900 rounded-xl p-5 animate-pulse"
                        >

                            <div className="h-4 w-24 bg-slate-800 rounded" />

                            <div className="h-8 w-20 bg-slate-800 rounded mt-4" />

                            <div className="h-2 w-full bg-slate-800 rounded mt-5" />

                        </div>

                    ))}

                </div>

            </div>

        );

    }


    // ========================================================
    // EMPTY STATE
    // ========================================================

    if (categories.length === 0) {

        return (

            <div className="glass-card p-6">

                <div className="mb-4">

                    <h2 className="text-xl font-bold">
                        Category Forecast
                    </h2>

                    <p className="text-sm text-slate-400 mt-1">
                        No category forecast data available.
                    </p>

                </div>

                <div className="border border-dashed border-slate-700 rounded-xl p-8 text-center">

                    <p className="text-slate-400">
                        Upload more sales data to generate category forecasts.
                    </p>

                </div>

            </div>

        );

    }


    // ========================================================
    // RENDER
    // ========================================================

    return (

        <div className="glass-card p-6">

            {/* HEADER */}

            <div className="mb-6">

                <h2 className="text-xl font-bold">
                    Category Forecast
                </h2>

                <p className="text-sm text-slate-400 mt-1">
                    Expected category performance based on recent sales trends
                </p>

            </div>


            {/* CATEGORY CARDS */}

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">

                {categories.map((category) => {

                    const growth = Number(
                        category.growth_percentage || 0
                    );

                    const isPositive = growth >= 0;

                    const progressWidth = Math.min(
                        Math.abs(growth) * 3,
                        100
                    );


                    return (

                        <div
                            key={category.category}
                            className="
                                bg-[#081124]
                                border
                                border-blue-900
                                rounded-xl
                                p-5
                            "
                        >

                            {/* CATEGORY NAME */}

                            <p className="text-slate-400 text-sm">

                                {category.category}

                            </p>


                            {/* GROWTH */}

                            <div className="flex items-center justify-between mt-3">

                                <span
                                    className={`text-2xl font-bold ${
                                        isPositive
                                            ? "text-green-400"
                                            : "text-red-400"
                                    }`}
                                >

                                    {isPositive ? "+" : ""}
                                    {growth.toFixed(2)}%

                                </span>


                                <span
                                    className={`flex items-center gap-1 text-sm font-medium ${
                                        isPositive
                                            ? "text-green-400"
                                            : "text-red-400"
                                    }`}
                                >

                                    {isPositive ? (
                                        <TrendingUp size={16} />
                                    ) : (
                                        <TrendingDown size={16} />
                                    )}

                                    {isPositive
                                        ? "Growth"
                                        : "Decline"
                                    }

                                </span>

                            </div>


                            {/* PROGRESS */}

                            <div className="mt-4 h-2 bg-slate-800 rounded-full overflow-hidden">

                                <div
                                    className={`h-full rounded-full ${
                                        isPositive
                                            ? "bg-purple-500"
                                            : "bg-red-500"
                                    }`}
                                    style={{
                                        width: `${progressWidth}%`,
                                    }}
                                />

                            </div>


                            {/* SALES DETAILS */}

                            <div className="mt-4 space-y-2">

                                <div className="flex items-center justify-between text-xs">

                                    <span className="text-slate-500">
                                        Previous 7 Days
                                    </span>

                                    <span className="text-slate-300">

                                        ₹
                                        {Number(
                                            category.previous_7_day_sales || 0
                                        ).toLocaleString("en-IN")}

                                    </span>

                                </div>


                                <div className="flex items-center justify-between text-xs">

                                    <span className="text-slate-500">
                                        Latest 7 Days
                                    </span>

                                    <span className="text-slate-300">

                                        ₹
                                        {Number(
                                            category.latest_7_day_sales || 0
                                        ).toLocaleString("en-IN")}

                                    </span>

                                </div>


                                <div className="flex items-center justify-between text-xs">

                                    <span className="text-slate-500">
                                        Next 7 Days
                                    </span>

                                    <span className="text-cyan-400 font-medium">

                                        ₹
                                        {Number(
                                            category.forecast_7_day_sales || 0
                                        ).toLocaleString("en-IN")}

                                    </span>

                                </div>

                            </div>

                        </div>

                    );

                })}

            </div>

        </div>

    );

}