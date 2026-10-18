import { useEffect, useState } from "react";
import {
    PackageCheck,
    AlertTriangle,
    PackageX,
    RefreshCw,
} from "lucide-react";

import api from "../services/api";

export default function InventoryWidget() {

    const [summary, setSummary] = useState([]);
    const [reorder, setReorder] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const loadInventory = async () => {

        try {

            setLoading(true);
            setError("");

            const [summaryResponse, reorderResponse] = await Promise.all([
                api.get("/inventory/summary"),
                api.get("/inventory/reorder"),
            ]);

            setSummary(
                Array.isArray(summaryResponse.data)
                    ? summaryResponse.data
                    : []
            );

            setReorder(
                Array.isArray(reorderResponse.data)
                    ? reorderResponse.data
                    : []
            );

        } catch (err) {

            console.error(
                "Inventory error:",
                err
            );

            setError(
                "Unable to load inventory data."
            );

        } finally {

            setLoading(false);

        }
    };


    useEffect(() => {
        loadInventory();
    }, []);


    const productStock = new Map();
    summary.forEach((item) => {
        const productName = item.product_name;
        const current = productStock.get(productName) || {
            stock: 0,
            reorderLevel: 0,
        };
        current.stock += Number(item.stock_remaining || 0);
        current.reorderLevel += Number(item.reorder_level ?? 20);
        productStock.set(productName, current);
    });

    const productStatusCounts = [...productStock.values()].reduce(
        (counts, product) => {
            if (product.stock <= 0) {
                counts.outOfStock += 1;
            } else if (product.stock <= product.reorderLevel) {
                counts.lowStock += 1;
            } else {
                counts.inStock += 1;
            }
            return counts;
        },
        { inStock: 0, lowStock: 0, outOfStock: 0 },
    );


    return (

        <div className="
            glass-card
            rounded-2xl
            p-4
            border
            border-blue-900
        ">

            {/* HEADER */}

            <div className="
                flex
                items-center
                justify-between
                mb-3
            ">

                <div>

                    <h2 className="text-sm font-bold">
                        Inventory Status
                    </h2>

                    <p className="
                        text-[10px]
                        text-slate-400
                        mt-1
                    ">
                        Current stock overview
                    </p>

                </div>


                <button
                    onClick={loadInventory}
                    disabled={loading}
                    className="
                        p-2
                        rounded-lg
                        bg-slate-800
                        hover:bg-slate-700
                        transition
                    "
                    title="Refresh inventory"
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

                <div className="space-y-4">

                    {[1, 2, 3].map(item => (

                        <div
                            key={item}
                            className="
                                h-16
                                rounded-xl
                                bg-slate-800
                                animate-pulse
                            "
                        />

                    ))}

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


            {/* DATA */}

            {!loading && !error && (

                <>

                    {/* STOCK SUMMARY */}

                    <div className="space-y-2">

                        {/* IN STOCK */}

                        <div className="
                            flex
                            items-center
                            gap-3
                            p-3
                            rounded-xl
                            bg-green-500/10
                            border
                            border-green-500/20
                        ">

                            <div className="
                                w-9
                                h-9
                                rounded-xl
                                bg-green-500/20
                                flex
                                items-center
                                justify-center
                            ">

                                <PackageCheck
                                    size={20}
                                    className="text-green-400"
                                />

                            </div>


                            <div>

                                <div className="
                                    text-sm
                                    text-slate-400
                                ">
                                    In Stock
                                </div>

                                <div className="
                                    text-lg
                                    font-bold
                                ">
                                    {productStatusCounts.inStock.toLocaleString(
                                        "en-IN"
                                    )}
                                </div>

                            </div>

                        </div>


                        {/* LOW STOCK */}

                        <div className="
                            flex
                            items-center
                            gap-3
                            p-3
                            rounded-xl
                            bg-yellow-500/10
                            border
                            border-yellow-500/20
                        ">

                            <div className="
                                w-9
                                h-9
                                rounded-xl
                                bg-yellow-500/20
                                flex
                                items-center
                                justify-center
                            ">

                                <AlertTriangle
                                    size={20}
                                    className="
                                        text-yellow-400
                                    "
                                />

                            </div>


                            <div>

                                <div className="
                                    text-sm
                                    text-slate-400
                                ">
                                    Low Stock
                                </div>

                                <div className="
                                    text-lg
                                    font-bold
                                    text-yellow-400
                                ">
                                    {productStatusCounts.lowStock}
                                </div>

                            </div>

                        </div>


                        {/* OUT OF STOCK */}

                        <div className="
                            flex
                            items-center
                            gap-3
                            p-3
                            rounded-xl
                            bg-red-500/10
                            border
                            border-red-500/20
                        ">

                            <div className="
                                w-9
                                h-9
                                rounded-xl
                                bg-red-500/20
                                flex
                                items-center
                                justify-center
                            ">

                                <PackageX
                                    size={20}
                                    className="text-red-400"
                                />

                            </div>


                            <div>

                                <div className="
                                    text-sm
                                    text-slate-400
                                ">
                                    Out of Stock
                                </div>

                                <div className="
                                    text-lg
                                    font-bold
                                    text-red-400
                                ">
                                    {productStatusCounts.outOfStock}
                                </div>

                            </div>

                        </div>

                    </div>


                </>

            )}

        </div>

    );
}