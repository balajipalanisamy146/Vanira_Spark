import { useEffect, useState } from "react";
import { ArrowRight, Loader2, Package, Search, X } from "lucide-react";

import api from "../../services/api";

export default function ProductSearch({ onSelectProduct }) {
    const [search, setSearch] = useState("");
    const [results, setResults] = useState([]);
    const [searching, setSearching] = useState(false);
    const [searchError, setSearchError] = useState("");
    const [selectedProduct, setSelectedProduct] = useState(null);

    useEffect(() => {
        const value = search.trim();

        if (!value || selectedProduct?.product_name === value) {
            setResults([]);
            if (!value) {
                setSearchError("");
            }
            return undefined;
        }

        let active = true;
        const timer = setTimeout(async () => {
            try {
                setSearching(true);
                setSearchError("");
                const response = await api.get("/product/search", {
                    params: { search: value },
                });

                if (active) {
                    setResults(response.data || []);
                }
            } catch (error) {
                console.error("Product search error:", error);
                if (active) {
                    setResults([]);
                    setSearchError("Unable to search products.");
                }
            } finally {
                if (active) {
                    setSearching(false);
                }
            }
        }, 300);

        return () => {
            active = false;
            clearTimeout(timer);
        };
    }, [search, selectedProduct]);

    const clearSearch = () => {
        setSearch("");
        setResults([]);
        setSearchError("");
        setSelectedProduct(null);
    };

    return (
        <>
            <section className="bg-[#0B1730] border border-blue-900/60 rounded-2xl shadow-xl overflow-hidden">
                <div className="p-4 border-b border-blue-900/60">
                    <h2 className="text-base font-bold text-white tracking-wide">
                        Product Search
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                        Search by product name, brand, or category.
                    </p>
                </div>

                <div className="p-4">
                    <div className="relative">
                        <Search
                            size={18}
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
                        />
                        <input
                            type="text"
                            value={search}
                            onChange={(event) => {
                                setSearch(event.target.value);
                                setSelectedProduct(null);
                            }}
                            placeholder="Search products..."
                            className="w-full pl-11 pr-11 py-3 rounded-xl bg-[#081124] border border-blue-900/60 text-white placeholder:text-slate-500 outline-none focus:border-blue-500"
                        />
                        {search && (
                            <button
                                type="button"
                                onClick={clearSearch}
                                aria-label="Clear product search"
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                            >
                                <X size={17} />
                            </button>
                        )}
                    </div>

                    {searching && (
                        <div className="flex items-center gap-2 mt-4 text-sm text-gray-500">
                            <Loader2 size={16} className="animate-spin" />
                            Searching products...
                        </div>
                    )}

                    {searchError && (
                        <p className="mt-4 text-sm text-red-400">{searchError}</p>
                    )}

                    {!searching && !searchError && search.trim() && results.length === 0 && (
                        <div className="mt-4 p-4 rounded-xl border border-blue-900/40 text-sm text-slate-500">
                            No products found.
                        </div>
                    )}

                    {results.length > 0 && (
                        <div className="mt-4 space-y-2">
                            {results.map((product) => (
                                <button
                                    key={product.product_name}
                                    type="button"
                                    onClick={() => {
                                        setSelectedProduct(product);
                                        setSearch(product.product_name);
                                        setResults([]);
                                        setSearchError("");
                                    }}
                                    className={`w-full text-left p-3 rounded-xl border transition ${
                                        selectedProduct?.product_name === product.product_name
                                            ? "border-cyan-500/70 bg-cyan-500/5"
                                            : "border-blue-900/40 bg-[#081124] hover:border-blue-500/60"
                                    }`}
                                >
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-10 h-10 rounded-xl bg-[#122042] flex items-center justify-center shrink-0">
                                                <Package size={18} className="text-cyan-300" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium text-white truncate">
                                                    {product.product_name}
                                                </p>
                                                <p className="text-xs text-gray-500 mt-1 truncate">
                                                    {product.brand} · {product.category}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="text-sm font-semibold text-white">
                                                ₹{Number(product.revenue || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {Number(product.orders || 0).toLocaleString("en-IN")} orders
                                            </p>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}

                    <div className="mt-4 flex items-center justify-between gap-4">
                        <p className="min-w-0 truncate text-sm text-slate-400">
                            {selectedProduct
                                ? "Product selected. Continue to view its analytics."
                                : "Select a product from the results."}
                        </p>
                        <button
                            type="button"
                            disabled={!selectedProduct}
                            onClick={() => onSelectProduct?.(selectedProduct.product_name)}
                            className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            View Analytics
                            <ArrowRight size={16} />
                        </button>
                    </div>
                </div>
            </section>
        </>
    );
}