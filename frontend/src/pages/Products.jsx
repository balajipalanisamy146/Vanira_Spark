import { useEffect, useState } from "react";
import { Package, RefreshCw } from "lucide-react";

import api from "../services/api";

import ProductKpis from "../components/product/ProductKpis";
import TopProducts from "../components/product/TopProducts";
import ProductProfit from "../components/product/ProductProfit";
import CategoryPerformance from "../components/product/CategoryPerformance";
import BrandPerformance from "../components/product/BrandPerformance";
import ProductTrend from "../components/product/ProductTrend";
import ProductSearch from "../components/product/ProductSearch";
import PageHero from "../components/PageHero";

export default function Products({ onSelectProduct }) {
    const [kpis, setKpis] = useState({});
    const [topProducts, setTopProducts] = useState([]);
    const [profitableProducts, setProfitableProducts] = useState([]);
    const [leastProfitableProducts, setLeastProfitableProducts] =
        useState([]);
    const [categories, setCategories] = useState([]);
    const [brands, setBrands] = useState([]);
    const [trend, setTrend] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const loadProductAnalytics = async () => {
        try {
            setLoading(true);
            setError("");

            const [
                kpiResponse,
                topResponse,
                profitResponse,
                leastProfitResponse,
                categoryResponse,
                brandResponse,
                trendResponse,
            ] = await Promise.all([
                api.get("/product/kpis"),
                api.get("/product/top"),
                api.get("/product/profit"),
                api.get("/product/least-profit"),
                api.get("/product/categories"),
                api.get("/product/brands"),
                api.get("/product/trend"),
            ]);

            setKpis(kpiResponse.data);
            setTopProducts(topResponse.data);
            setProfitableProducts(profitResponse.data);
            setLeastProfitableProducts(
                leastProfitResponse.data
            );
            setCategories(categoryResponse.data);
            setBrands(brandResponse.data);
            setTrend(trendResponse.data);

        } catch (err) {
            console.error(
                "Product analytics error:",
                err
            );

            setError(
                "Unable to load product analytics."
            );

        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadProductAnalytics();
    }, []);

    if (loading) {
        return (
            <div className="flex-1 p-6 space-y-5 min-w-0">

                <PageHero
                    title="Product Analytics"
                    subtitle="Understand product performance, profitability and sales trends."
                    icon={Package}
                />

                <ProductSearch onSelectProduct={onSelectProduct} />

                <div className="
                    grid
                    grid-cols-2
                    xl:grid-cols-4
                    gap-4
                ">
                    {[1, 2, 3, 4].map((item) => (
                        <div
                            key={item}
                            className="
                                h-28
                                rounded-2xl
                                bg-[#0B1730]
                                border
                                border-blue-900/60
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
                    title="Product Analytics"
                    subtitle="Understand product performance, profitability and sales trends."
                    icon={Package}
                    action={(
                        <button
                            onClick={loadProductAnalytics}
                            className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm text-white transition hover:bg-white/20"
                        >
                            <RefreshCw size={16} />
                            Retry
                        </button>
                    )}
                />

                <ProductSearch onSelectProduct={onSelectProduct} />

                <div className="
                    bg-[#0B1730]
                    border
                    border-red-900/50
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
        <div className="
            flex-1
            p-6
            space-y-5
            min-w-0
        ">

            <PageHero
                title="Product Analytics"
                subtitle="Understand product performance, profitability and sales trends."
                icon={Package}
                action={(
                    <button
                        onClick={loadProductAnalytics}
                        className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm text-white transition hover:bg-white/20"
                    >
                        <RefreshCw size={16} />
                        Refresh
                    </button>
                )}
            />

            <ProductSearch onSelectProduct={onSelectProduct} />

            {/* KPI */}

            <ProductKpis data={kpis} />


            {/* TOP PRODUCTS */}

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
                <div className="xl:col-span-7 min-w-0">
                    <TopProducts data={topProducts} />
                </div>
                <div className="xl:col-span-5 min-w-0">
                    <ProductTrend data={trend} />
                </div>
            </div>

            <ProductProfit
                profitable={profitableProducts}
                leastProfitable={leastProfitableProducts}
            />

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                <CategoryPerformance data={categories} />
                <BrandPerformance data={brands} />
            </div>

        </div>
    );
}
