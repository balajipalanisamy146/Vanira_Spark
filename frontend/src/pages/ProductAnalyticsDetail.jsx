import { useEffect, useState } from "react";
import { ArrowLeft, Loader2, Package, RefreshCw } from "lucide-react";

import api from "../services/api";
import PageHero from "../components/PageHero";
import ProductDetails from "../components/product/ProductDetails";

export default function ProductAnalyticsDetail({ productName, onBack }) {
    const [profile, setProfile] = useState(null);
    const [trend, setTrend] = useState([]);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const loadProductAnalytics = async () => {
        const encodedName = encodeURIComponent(productName);

        try {
            setLoading(true);
            setError("");

            const [profileResponse, trendResponse, historyResponse] =
                await Promise.all([
                    api.get(`/product/profile/${encodedName}`),
                    api.get(`/product/detail-trend/${encodedName}`),
                    api.get(`/product/history/${encodedName}`),
                ]);

            setProfile(profileResponse.data || null);
            setTrend(trendResponse.data || []);
            setHistory(historyResponse.data || []);
        } catch (requestError) {
            console.error("Product analytics error:", requestError);
            setError("Unable to load product analytics.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadProductAnalytics();
    }, [productName]);

    return (
        <main className="flex-1 min-w-0 space-y-5 p-6">
            <PageHero
                title="Product Analytics"
                subtitle={`Detailed performance and sales history for ${productName}.`}
                icon={Package}
                action={(
                    <button
                        type="button"
                        onClick={onBack}
                        className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm text-white transition hover:bg-white/20"
                    >
                        <ArrowLeft size={16} />
                        Back to Products
                    </button>
                )}
            />

            {loading && (
                <div className="flex min-h-48 items-center justify-center gap-3 text-slate-400">
                    <Loader2 size={20} className="animate-spin" />
                    Loading product analytics...
                </div>
            )}

            {error && (
                <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-center">
                    <p className="mb-4 text-sm text-red-300">{error}</p>
                    <button
                        type="button"
                        onClick={loadProductAnalytics}
                        className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm text-white transition hover:bg-white/20"
                    >
                        <RefreshCw size={16} />
                        Retry
                    </button>
                </div>
            )}

            {!loading && profile && (
                <ProductDetails
                    data={profile}
                    trend={trend}
                    history={history}
                />
            )}

            {!loading && !error && !profile && (
                <div className="rounded-2xl border border-blue-900/60 bg-[#0B1730] p-6 text-center text-slate-400">
                    Product analytics were not found.
                </div>
            )}
        </main>
    );
}