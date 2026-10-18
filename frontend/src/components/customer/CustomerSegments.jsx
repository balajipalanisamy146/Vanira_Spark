import {
    UserPlus,
    Repeat2,
    Crown,
    AlertTriangle,
    UserX,
} from "lucide-react";


export default function CustomerSegments({
    data = {},
}) {

    const segments = [
        {
            title: "New",
            value: data.new_customers || 0,
            icon: UserPlus,
            description: "First purchase within 30 days",
            color: "text-cyan-300",
            iconBg: "bg-cyan-500/10 border-cyan-500/20",
        },

        {
            title: "Returning",
            value: data.returning_customers || 0,
            icon: Repeat2,
            description: "Customers with 2+ orders",
            color: "text-blue-300",
            iconBg: "bg-blue-500/10 border-blue-500/20",
        },

        {
            title: "High Value",
            value: data.high_value_customers || 0,
            icon: Crown,
            description: "Top 25% by revenue",
            color: "text-amber-300",
            iconBg: "bg-amber-500/10 border-amber-500/20",
        },

        {
            title: "At Risk",
            value: data.at_risk_customers || 0,
            icon: AlertTriangle,
            description: "No purchase for 30–90 days",
            color: "text-orange-300",
            iconBg: "bg-orange-500/10 border-orange-500/20",
        },

        {
            title: "Inactive",
            value: data.inactive_customers || 0,
            icon: UserX,
            description: "No purchase for 90+ days",
            color: "text-rose-300",
            iconBg: "bg-rose-500/10 border-rose-500/20",
        },
    ];


    return (
        <div>

            <div className="mb-5">

                <h2 className="text-base font-bold text-white tracking-wide">
                    Customer Segmentation
                </h2>

                <p className="text-xs text-slate-400 mt-0.5">
                    Understand customer groups and engagement
                </p>

            </div>


            <div className="grid grid-cols-2 xl:grid-cols-5 gap-3">

                {segments.map((segment) => {

                    const Icon = segment.icon;

                    return (
                        <div
                            key={segment.title}
                            className="
                                customer-card
                                bg-slate-900
                                border
                                rounded-2xl
                                p-4
                            "
                        >

                            <div className="flex items-center justify-between">

                                <span className="text-sm text-slate-400">
                                    {segment.title}
                                </span>

                                <div className={`p-1.5 rounded-lg border ${segment.iconBg}`}>
                                    <Icon size={16} className={segment.color} />
                                </div>

                            </div>


                            <div className="text-xl font-bold text-white mt-3">
                                {segment.value}
                            </div>


                            <p className="text-[11px] text-slate-500 mt-1">
                                {segment.description}
                            </p>

                        </div>
                    );
                })}

            </div>

        </div>
    );
}