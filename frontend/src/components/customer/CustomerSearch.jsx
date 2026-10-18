import { useEffect, useState } from "react";
import {
    ArrowRight,
    Search,
    User,
    Loader2,
    X,
} from "lucide-react";

import api from "../../services/api";

export default function CustomerSearch({ onSelectCustomer }) {
    const [search, setSearch] = useState("");
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);

    useEffect(() => {
        const value = search.trim();
        const selectedName = selectedCustomer?.customer_name || selectedCustomer?.customer_id;

        if (!value || value === selectedName) {
            setResults([]);
            return undefined;
        }

        let active = true;
        const timer = setTimeout(async () => {
            try {
                setLoading(true);

                const response = await api.get(
                    "/customer/search",
                    {
                        params: {
                            search: value,
                        },
                    }
                );

                if (active) {
                    setResults(response.data || []);
                }
            } catch (error) {
                console.error(
                    "Customer search error:",
                    error
                );
                if (active) {
                    setResults([]);
                }
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        }, 300);

        return () => {
            active = false;
            clearTimeout(timer);
        };
    }, [search, selectedCustomer]);

    const clearSearch = () => {
        setSearch("");
        setResults([]);
        setSelectedCustomer(null);
    };

    return (
        <section className="customer-card rounded-2xl border overflow-hidden">

            <div className="p-4 border-b border-blue-900/60">

                <h2 className="text-base font-bold text-white tracking-wide">
                    Customer Search
                </h2>

                <p className="text-xs text-slate-400 mt-0.5">
                    Search by customer name, ID or mobile number.
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
                            setSelectedCustomer(null);
                        }}
                        placeholder="Search customer..."
                        className="w-full pl-11 pr-11 py-3 rounded-xl bg-[#081124] border border-blue-900/60 text-white placeholder:text-slate-500 outline-none focus:border-blue-500"
                    />

                    {search && (
                        <button
                            type="button"
                            onClick={clearSearch}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                        >
                            <X size={17} />
                        </button>
                    )}

                </div>

                {loading && (
                    <div className="flex items-center gap-2 mt-4 text-sm text-gray-500">
                        <Loader2
                            size={16}
                            className="animate-spin"
                        />
                        Searching customers...
                    </div>
                )}

                {!loading &&
                    search.trim() &&
                    results.length === 0 && (
                        <div className="customer-subcard mt-4 p-4 rounded-xl border text-sm text-slate-500">
                            No customers found.
                        </div>
                    )}

                {results.length > 0 && (
                    <div className="mt-4 space-y-2">

                        {results.map((customer) => (
                            <button
                                key={customer.customer_id}
                                type="button"
                                onClick={() => {
                                    setSelectedCustomer(customer);
                                    setSearch(
                                        customer.customer_name || customer.customer_id
                                    );
                                    setResults([]);
                                }}
                                className={`customer-subcard w-full text-left p-3 rounded-xl border transition ${
                                    selectedCustomer?.customer_id === customer.customer_id
                                        ? "border-cyan-500/70 bg-cyan-500/5"
                                        : "hover:border-blue-500/60"
                                }`}
                            >

                                <div className="flex items-center justify-between gap-4">

                                    <div className="flex items-center gap-3 min-w-0">

                                        <div className="w-10 h-10 rounded-full bg-[#122042] flex items-center justify-center shrink-0">
                                            <User
                                                size={18}
                                                className="text-gray-400"
                                            />
                                        </div>

                                        <div className="min-w-0">

                                            <p className="text-sm font-medium text-white truncate">
                                                {customer.customer_name ||
                                                    "Unknown Customer"}
                                            </p>

                                            <p className="text-xs text-gray-500 mt-1">
                                                {customer.customer_id}
                                                {customer.mobile_number
                                                    ? ` • ${customer.mobile_number}`
                                                    : ""}
                                            </p>

                                        </div>

                                    </div>

                                    <div className="text-right shrink-0">

                                        <p className="text-sm font-semibold text-white">
                                            ₹
                                            {Number(
                                                customer.revenue || 0
                                            ).toLocaleString(
                                                "en-IN"
                                            )}
                                        </p>

                                        <p className="text-xs text-gray-500 mt-1">
                                            {customer.orders || 0} orders
                                        </p>

                                    </div>

                                </div>

                            </button>
                        ))}

                    </div>
                )}

                <div className="mt-4 flex items-center justify-between gap-4">
                    <p className="min-w-0 truncate text-sm text-slate-400">
                        {selectedCustomer
                            ? "Customer selected. Continue to view their analytics."
                            : "Select a customer from the results."}
                    </p>
                    <button
                        type="button"
                        disabled={!selectedCustomer}
                        onClick={() => onSelectCustomer?.(selectedCustomer.customer_id)}
                        className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        View Analytics
                        <ArrowRight size={16} />
                    </button>
                </div>

            </div>

        </section>
    );
}