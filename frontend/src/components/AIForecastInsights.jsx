import { useEffect, useState } from "react";
import {
    Brain,
    Sparkles,
    RefreshCw,
    AlertTriangle,
} from "lucide-react";

import api from "../services/api";

export default function AIForecastInsights() {
    const [insights, setInsights] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const loadInsights = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await api.get(
                "/forecast/ai-insights"
            );

            setInsights(response.data);
        } catch (err) {
            console.error(
                "AI Forecast Insights error:",
                err
            );

            setInsights(null);
            setError(
                "AI forecast insights are not available yet."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadInsights();
    }, []);

    const insightList = Array.isArray(
        insights?.insights
    )
        ? insights.insights
        : [];

    return (
        <div className="bg-[#0b162d] border border-purple-900 rounded-2xl p-6 mt-6">

            <div className="flex items-center justify-between mb-5">

                <div className="flex items-center gap-3">

                    <div className="p-3 rounded-xl bg-purple-600/20">
                        <Brain
                            size={22}
                            className="text-purple-400"
                        />
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold text-white">
                            AI Forecast Insights
                        </h2>

                        <p className="text-sm text-slate-400">
                            AI-generated demand recommendations
                        </p>
                    </div>

                </div>

                <button
                    onClick={loadInsights}
                    disabled={loading}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition"
                    title="Refresh AI insights"
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

            <div className="bg-[#081124] border border-blue-900 rounded-xl p-5">

                {loading && (
                    <div className="space-y-3">

                        <div className="h-4 w-3/4 bg-slate-800 rounded animate-pulse"></div>

                        <div className="h-4 w-full bg-slate-800 rounded animate-pulse"></div>

                        <div className="h-4 w-2/3 bg-slate-800 rounded animate-pulse"></div>

                    </div>
                )}

                {!loading && error && (
                    <div className="flex gap-3 items-start">

                        <AlertTriangle
                            size={20}
                            className="text-yellow-400 mt-1 shrink-0"
                        />

                        <div>

                            <p className="text-slate-300 font-medium">
                                AI insights unavailable
                            </p>

                            <p className="text-slate-500 text-sm mt-1">
                                {error}
                            </p>

                        </div>

                    </div>
                )}

                {!loading &&
                    !error &&
                    insightList.length > 0 && (
                        <div className="flex gap-3 items-start">

                            <Sparkles
                                size={20}
                                className="text-purple-400 mt-1 shrink-0"
                            />

                            <div className="space-y-3">

                                {insightList.map(
                                    (item, index) => (
                                        <div
                                            key={index}
                                            className="text-slate-300 leading-relaxed"
                                        >
                                            • {item}
                                        </div>
                                    )
                                )}

                            </div>

                        </div>
                    )}

                {!loading &&
                    !error &&
                    insightList.length === 0 && (
                        <div className="flex gap-3 items-start">

                            <Sparkles
                                size={20}
                                className="text-purple-400 mt-1 shrink-0"
                            />

                            <div>

                                <p className="text-white font-medium">
                                    Forecast analysis is ready
                                </p>

                                <p className="text-slate-400 text-sm mt-2 leading-relaxed">
                                    Consider increasing stock levels
                                    before major festival seasons
                                    to prepare for higher expected
                                    demand.
                                </p>

                            </div>

                        </div>
                    )}

            </div>

        </div>
    );
}