import {
    Package,
    Activity,
    Layers3,
    Tags,
} from "lucide-react";
import KpiCard from "../KpiCard";

export default function ProductKpis({ data = {} }) {
    const cards = [
        {
            title: "Total Products",
            value: data.total_products || 0,
            icon: Package,
            iconBg: "bg-indigo-600",
            change: "0%",
            isPositive: true,
            period: "vs last month",
        },
        {
            title: "Active Products",
            value: data.active_products || 0,
            icon: Activity,
            iconBg: "bg-cyan-500",
            change: "0%",
            isPositive: true,
            period: "vs last month",
        },
        {
            title: "Categories",
            value: data.total_categories || 0,
            icon: Layers3,
            iconBg: "bg-emerald-500",
            change: "0%",
            isPositive: true,
            period: "vs last month",
        },
        {
            title: "Brands",
            value: data.total_brands || 0,
            icon: Tags,
            iconBg: "bg-rose-500",
            change: "0%",
            isPositive: true,
            period: "vs last month",
        },
    ];

    return (
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            {cards.map((card) => (
                <KpiCard
                    key={card.title}
                    title={card.title}
                    value={Number(card.value).toLocaleString("en-IN")}
                    icon={card.icon}
                    iconBg={card.iconBg}
                    change={card.change}
                    isPositive={card.isPositive}
                    period={card.period}
                />
            ))}
        </div>
    );
}
