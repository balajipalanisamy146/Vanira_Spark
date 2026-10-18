import { useEffect, useState } from "react";
import { RefreshCw, Users } from "lucide-react";

import api from "../services/api";

import CustomerKpis from "../components/customer/CustomerKpis";
import CustomerGrowth from "../components/customer/CustomerGrowth";
import CustomerSegments from "../components/customer/CustomerSegments";
import TopCustomers from "../components/customer/TopCustomers";
import CustomerRevenue from "../components/customer/CustomerRevenue";
import PurchaseBehaviour from "../components/customer/PurchaseBehaviour";
import CustomerRetention from "../components/customer/CustomerRetention";
import CustomerSearch from "../components/customer/CustomerSearch";
import PageHero from "../components/PageHero";

export default function Customers({ onSelectCustomer }) {

    const [kpis, setKpis] = useState({});
    const [growth, setGrowth] = useState([]);
    const [segments, setSegments] = useState({});
    const [topCustomers, setTopCustomers] = useState([]);
    const [customerRevenue, setCustomerRevenue] = useState([]);
    const [purchaseBehaviour, setPurchaseBehaviour] = useState({});
    const [retention, setRetention] = useState({});

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");


    const loadCustomerAnalytics = async () => {

        try {

            setLoading(true);
            setError("");

            const [
                kpiResponse,
                growthResponse,
                segmentResponse,
                topResponse,
                revenueResponse,
                behaviourResponse,
                retentionResponse,
            ] = await Promise.all([

                api.get("/customer/kpis"),

                api.get("/customer/growth"),

                api.get("/customer/segments"),

                api.get("/customer/top"),

                api.get("/customer/revenue"),

                api.get("/customer/purchase-behaviour"),

                api.get("/customer/retention")
            ]);


            setKpis(
                kpiResponse.data
            );

            setGrowth(
                growthResponse.data
            );

            setSegments(
                segmentResponse.data
            );

            setTopCustomers(
                topResponse.data
            );

            setCustomerRevenue(
                revenueResponse.data
            );

            setPurchaseBehaviour(
                behaviourResponse.data
            );

            setRetention(
                retentionResponse.data
            );

        } catch (err) {

            console.error(
                "Customer analytics error:",
                err
            );

            setError(
                "Unable to load customer analytics."
            );

        } finally {

            setLoading(false);

        }
    };

    useEffect(() => {

        loadCustomerAnalytics();

    }, []);


    if (loading) {

        return (
            <div className="flex-1 p-6">

                <PageHero
                    title="Customer Analytics"
                    subtitle="Understand customer behaviour, value, buying patterns, and retention."
                    icon={Users}
                />

                <CustomerSearch onSelectCustomer={onSelectCustomer} />

                <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">

                    {[1, 2, 3, 4].map((item) => (

                        <div
                            key={item}
                            className="
                                h-28
                                rounded-2xl
                                bg-[#0B1730]
                                border border-blue-900/60
                                animate-pulse
                            "
                        />

                    ))}

                </div>

            </div>
        );
    }


    if (error) {

        return (
            <div className="flex-1 p-6">

                <PageHero
                    title="Customer Analytics"
                    subtitle="Understand customer behaviour, value, buying patterns, and retention."
                    icon={Users}
                    action={(
                        <button
                            onClick={loadCustomerAnalytics}
                            className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm text-white transition hover:bg-white/20"
                        >
                            <RefreshCw size={16} />
                            Retry
                        </button>
                    )}
                />

                <CustomerSearch onSelectCustomer={onSelectCustomer} />

                <div className="
                    bg-[#0B1730]
                    border border-red-900/50
                    rounded-2xl
                    p-8
                    text-center
                ">

                    <p className="text-red-400 mb-4">
                        {error}
                    </p>

                </div>

            </div>
        );
    }


    return (

        <div className="customer-page flex-1 p-6 space-y-5 min-w-0">

            <PageHero
                title="Customer Analytics"
                subtitle="Understand customer behaviour, value, buying patterns, and retention."
                icon={Users}
                action={(
                    <button
                        onClick={loadCustomerAnalytics}
                        className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm text-white transition hover:bg-white/20"
                    >
                        <RefreshCw size={16} />
                        Refresh
                    </button>
                )}
            />

            <CustomerSearch onSelectCustomer={onSelectCustomer} />

            {/* KPI */}

            <CustomerKpis
                data={kpis}
            />


            {/* CUSTOMER GROWTH */}

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                <CustomerGrowth data={growth} />
                <CustomerRevenue data={customerRevenue} />
            </div>


            {/* SEGMENTS */}

            <CustomerSegments
                data={segments}
            />


            {/* TOP CUSTOMERS */}

            <TopCustomers data={topCustomers} />

            <PurchaseBehaviour data={purchaseBehaviour} />
            <CustomerRetention
                data={retention}
                atRiskCustomers={segments.at_risk_customers}
            />

        </div>
    );
}