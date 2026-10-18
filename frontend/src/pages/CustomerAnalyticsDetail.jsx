import { useEffect, useState } from "react";
import { ArrowLeft, Loader2, RefreshCw, Users } from "lucide-react";

import api from "../services/api";
import PageHero from "../components/PageHero";
import CustomerProfile from "../components/customer/CustomerProfile";
import CustomerTrend from "../components/customer/CustomerTrend";
import CustomerHistory from "../components/customer/CustomerHistory";

export default function CustomerAnalyticsDetail({ customerId, onBack }) {
    const [profile, setProfile] = useState(null);
    const [trend, setTrend] = useState([]);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const loadCustomerAnalytics = async () => {
        const encodedId = encodeURIComponent(customerId);

        try {
            setLoading(true);
            setError("");

            const [profileResponse, trendResponse, historyResponse] =
                await Promise.all([
                    api.get(`/customer/profile/${encodedId}`),
                    api.get(`/customer/trend/${encodedId}`),
                    api.get(`/customer/history/${encodedId}`),
                ]);

            setProfile(profileResponse.data || null);
            setTrend(trendResponse.data || []);
            setHistory(historyResponse.data || []);
        } catch (requestError) {
            console.error("Customer analytics error:", requestError);
            setError("Unable to load customer analytics.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCustomerAnalytics();
    }, [customerId]);

    return (
        <main className="flex-1 min-w-0 space-y-5 p-6">
            <PageHero
                title="Customer Analytics"
                subtitle={`Detailed purchase profile and activity for customer ${customerId}.`}
                icon={Users}
                action={(
                    <button
                        type="button"
                        onClick={onBack}
                        className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm text-white transition hover:bg-white/20"
                    >
                        <ArrowLeft size={16} />
                        Back to Customers
                    </button>
                )}
            />

            {loading && (
                <div className="flex min-h-48 items-center justify-center gap-3 text-slate-400">
                    <Loader2 size={20} className="animate-spin" />
                    Loading customer analytics...
                </div>
            )}

            {error && (
                <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-center">
                    <p className="mb-4 text-sm text-red-300">{error}</p>
                    <button
                        type="button"
                        onClick={loadCustomerAnalytics}
                        className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm text-white transition hover:bg-white/20"
                    >
                        <RefreshCw size={16} />
                        Retry
                    </button>
                </div>
            )}

            {!loading && profile && (
                <>
                    <CustomerProfile data={profile} />
                    <CustomerTrend data={trend} />
                    <CustomerHistory data={history} />
                </>
            )}

            {!loading && !error && !profile && (
                <div className="rounded-2xl border border-blue-900/60 bg-[#0B1730] p-6 text-center text-slate-400">
                    Customer analytics were not found.
                </div>
            )}
        </main>
    );
}