import {
    Users,
    Crown,
    Repeat2,
    ShoppingCart,
} from "lucide-react";
import { formatCompactValue } from "../formatCompactValue";

export default function CustomerKpis({ data = {} }) {
    const formatCurrency = (value) =>
        new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0,
        }).format(value || 0);

    const cards = [
        {
            title: "Total Customers",
            value: data.total_customers || 0,
            description: "Identified customers",
            icon: Users,
            color: "text-indigo-300",
            iconBg: "bg-indigo-500/15 border border-indigo-500/20",
        },
        {
            title: "VIP Customers",
            value: data.vip_customers || 0,
            description: "Top revenue customers",
            icon: Crown,
            color: "text-amber-300",
            iconBg: "bg-amber-500/15 border border-amber-500/20",
        },
        {
            title: "Repeat Customers",
            value: data.repeat_customers || 0,
            description: "Customers with 2+ orders",
            icon: Repeat2,
            color: "text-cyan-300",
            iconBg: "bg-cyan-500/15 border border-cyan-500/20",
        },
        {
            title: "Avg Order Value",
            value: formatCurrency(data.avg_order_value),
            description: "Average value per order",
            icon: ShoppingCart,
            color: "text-emerald-300",
            iconBg: "bg-emerald-500/15 border border-emerald-500/20",
        },
    ];

    return (
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            {cards.map((card) => {
                const Icon = card.icon;

                return (
                    <div
                        key={card.title}
                        className="customer-card rounded-2xl border p-4 transition-colors"
                    >
                        <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                                <p className="text-xs font-semibold text-slate-400">
                                    {card.title}
                                </p>
                                <h3
                                    className="text-2xl font-bold text-white mt-2 truncate"
                                    title={String(card.value)}
                                >
                                    {formatCompactValue(card.value)}
                                </h3>
                                <p className="text-[11px] text-slate-500 mt-1">
                                    {card.description}
                                </p>
                            </div>
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${card.iconBg}`}>
                                <Icon size={19} className={card.color} />
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}