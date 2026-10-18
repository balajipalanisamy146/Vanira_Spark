import {
    Users,
    UserCheck,
    UserMinus,
    RefreshCcw,
    AlertTriangle,
} from "lucide-react";

export default function CustomerRetention({
    data = {},
    atRiskCustomers = 0,
}) {

    const cards = [

        {
            title: "Retention Rate",
            value: `${data.retention_rate || 0}%`,
            icon: RefreshCcw,
        },

        {
            title: "Active Customers",
            value: data.active_customers || 0,
            icon: UserCheck,
        },

        {
            title: "Returning Customers",
            value: data.returning_customers || 0,
            icon: Users,
        },

        {
            title: "Lost Customers",
            value: data.lost_customers || 0,
            icon: UserMinus,
        },
        {
            title: "At Risk Customers",
            value: atRiskCustomers,
            icon: AlertTriangle,
            color: "text-amber-300",
        },
    ];

    return (

        <div>

            <div className="mb-5">

                <h2 className="text-base font-bold text-white tracking-wide">
                    Customer Retention
                </h2>

                <p className="text-slate-400 text-xs mt-0.5">
                    Customer loyalty and retention insights
                </p>

            </div>

            <div className="grid grid-cols-2 xl:grid-cols-5 gap-3">

                {cards.map((card) => {

                    const Icon = card.icon;

                    return (

                        <div
                            key={card.title}
                            className="
                                customer-card
                                bg-slate-900
                                border
                                rounded-2xl
                                p-4
                            "
                        >

                            <div className="flex justify-between">

                                <span className="text-slate-400 text-xs">
                                    {card.title}
                                </span>

                                <Icon
                                    size={18}
                                    className={card.color || "text-emerald-300"}
                                />

                            </div>

                            <div className="mt-3 text-2xl font-bold text-white">
                                {card.value}
                            </div>

                        </div>

                    );
                })}

            </div>

        </div>

    );
}