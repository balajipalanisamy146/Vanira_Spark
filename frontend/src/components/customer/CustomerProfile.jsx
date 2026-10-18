import {
    User,
    Phone,
    MapPin,
    Calendar,
    ShoppingBag,
    IndianRupee,
    TrendingUp,
    Clock,
} from "lucide-react";

export default function CustomerProfile({
    data,
    onClose,
}) {
    if (!data) {
        return null;
    }

    const formatCurrency = (value) =>
        `₹${Number(value || 0).toLocaleString(
            "en-IN",
            {
                maximumFractionDigits: 0,
            }
        )}`;

    const formatDate = (value) => {
        if (!value) return "—";

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return value;
        }

        return date.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    return (
        <section className="bg-[#0B1730] border border-blue-900/60 rounded-2xl shadow-xl overflow-hidden">

            <div className="p-4 border-b border-blue-900/60 flex items-center justify-between gap-4">

                <div>
                    <h2 className="text-base font-bold text-white tracking-wide">
                        Customer Profile
                    </h2>

                    <p className="text-xs text-slate-400 mt-0.5">
                        Complete customer information and purchase performance.
                    </p>
                </div>

                {onClose && (
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-3 py-2 rounded-lg bg-[#081124] border border-blue-900/60 hover:bg-[#122042] text-slate-300 hover:text-white text-sm transition"
                    >
                        Close
                    </button>
                )}

            </div>

            <div className="p-4 space-y-4">

                {/* CUSTOMER INFO */}

                <div className="flex flex-col lg:flex-row gap-6">

                    <div className="flex items-center gap-4">

                        <div className="w-14 h-14 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                            <User
                                size={28}
                                className="text-cyan-300"
                            />
                        </div>

                        <div>

                            <h3 className="text-xl font-semibold text-white">
                                {data.customer_name ||
                                    "Unknown Customer"}
                            </h3>

                            <p className="text-sm text-gray-500 mt-1">
                                {data.customer_id}
                            </p>

                        </div>

                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1">

                        <InfoItem
                            icon={Phone}
                            label="Mobile"
                            value={
                                data.mobile_number ||
                                "—"
                            }
                        />

                        <InfoItem
                            icon={MapPin}
                            label="City"
                            value={
                                data.city ||
                                "—"
                            }
                        />

                        <InfoItem
                            icon={User}
                            label="Gender"
                            value={
                                data.gender ||
                                "—"
                            }
                        />

                        <InfoItem
                            icon={Calendar}
                            label="Age"
                            value={
                                data.age ||
                                "—"
                            }
                        />

                    </div>

                </div>

                {/* KPI */}

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">

                    <MetricCard
                        title="Revenue"
                        value={formatCurrency(data.revenue)}
                        icon={IndianRupee}
                    />

                    <MetricCard
                        title="Profit"
                        value={formatCurrency(data.profit)}
                        icon={TrendingUp}
                    />

                    <MetricCard
                        title="Orders"
                        value={Number(
                            data.orders || 0
                        ).toLocaleString("en-IN")}
                        icon={ShoppingBag}
                    />

                    <MetricCard
                        title="Average Order Value"
                        value={formatCurrency(
                            data.avg_order_value
                        )}
                        icon={IndianRupee}
                    />

                </div>

                {/* PURCHASE DATES */}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                    <div className="border border-blue-900/40 bg-[#081124] p-4 rounded-xl">

                        <div className="flex items-center gap-2 text-gray-400">

                            <Calendar size={16} />

                            <span className="text-sm">
                                First Purchase
                            </span>

                        </div>

                        <p className="text-white font-medium mt-2">
                            {formatDate(
                                data.first_purchase
                            )}
                        </p>

                    </div>

                    <div className="border border-blue-900/40 bg-[#081124] p-4 rounded-xl">

                        <div className="flex items-center gap-2 text-gray-400">

                            <Clock size={16} />

                            <span className="text-sm">
                                Last Purchase
                            </span>

                        </div>

                        <p className="text-white font-medium mt-2">
                            {formatDate(
                                data.last_purchase
                            )}
                        </p>

                    </div>

                </div>

            </div>

        </section>
    );
}


function InfoItem({
    icon: Icon,
    label,
    value,
}) {
    return (
        <div className="border border-blue-900/40 bg-[#081124] p-3 rounded-xl">

            <div className="flex items-center gap-2 text-gray-500">

                <Icon size={14} />

                <span className="text-xs">
                    {label}
                </span>

            </div>

            <p className="text-sm text-white mt-2 truncate">
                {value}
            </p>

        </div>
    );
}


function MetricCard({
    title,
    value,
    icon: Icon,
}) {
    return (
        <div className="border border-blue-900/40 bg-[#081124] p-3 rounded-xl">

            <div className="flex items-center justify-between">

                <p className="text-sm text-gray-400">
                    {title}
                </p>

                <Icon
                    size={18}
                    className="text-gray-500"
                />

            </div>

            <p className="text-xl font-semibold text-white mt-3">
                {value}
            </p>

        </div>
    );
}