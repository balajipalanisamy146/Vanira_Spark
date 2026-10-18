import {
    ShoppingCart,
    Package,
    Repeat2,
    Users,
    IndianRupee,
} from "lucide-react";

export default function PurchaseBehaviour({
    data = {},
}) {

    const cards = [

        {
            title: "Order Frequency",
            value: data.order_frequency,
            suffix: " Orders",
            icon: ShoppingCart,
        },

        {
            title: "Average Basket Value",
            value: `₹${Number(
                data.avg_basket_value || 0
            ).toLocaleString()}`,
            icon: IndianRupee,
        },

        {
            title: "Items Per Order",
            value: data.avg_items_per_order,
            icon: Package,
        },

        {
            title: "Repeat Purchase Rate",
            value: `${data.repeat_purchase_rate || 0}%`,
            icon: Repeat2,
        },

        {
            title: "Revenue Per Customer",
            value: `₹${Number(
                data.revenue_per_customer || 0
            ).toLocaleString()}`,
            icon: Users,
        },
    ];

    return (

        <div>

            <div className="mb-5">

                <h2 className="text-base font-bold text-white tracking-wide">
                    Purchase Behaviour
                </h2>

                <p className="text-slate-400 text-xs mt-0.5">
                    Customer buying behaviour insights
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
                                    className="text-cyan-300"
                                />

                            </div>

                            <div className="mt-3 text-xl font-bold text-white">
                                {card.value}
                            </div>

                        </div>

                    );
                })}

            </div>

        </div>
    );
}