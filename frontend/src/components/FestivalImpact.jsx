import {
    CalendarDays,
    TrendingUp,
    IndianRupee,
    ShoppingBag,
} from "lucide-react";

export default function FestivalImpact({ festival = null }) {

    const festivalName =
        festival?.name ||
        festival?.festival_name ||
        "Festival Impact";

    const salesImpact = Number(
        festival?.sales_impact ??
        festival?.impact ??
        0
    );

    const revenue = Number(
        festival?.revenue ??
        festival?.festival_revenue ??
        0
    );

    const orders = Number(
        festival?.orders ??
        festival?.festival_orders ??
        0
    );

    const startDate =
        festival?.start_date ||
        festival?.date ||
        null;

    const endDate =
        festival?.end_date ||
        null;


    const formatCurrency = (value) => {

        if (!value) {
            return "₹0";
        }

        return `₹${value.toLocaleString("en-IN", {
            maximumFractionDigits: 0,
        })}`;
    };


    const formatDate = (value) => {

        if (!value) {
            return "Not available";
        }

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
        <div className="
            rounded-2xl
            border
            border-slate-800
            bg-slate-900/60
            p-5
            h-full
        ">

            {/* HEADER */}

            <div className="
                flex
                items-start
                justify-between
                gap-4
                mb-6
            ">

                <div className="
                    flex
                    items-center
                    gap-3
                ">

                    <div className="
                        w-11
                        h-11
                        rounded-xl
                        bg-purple-500/15
                        flex
                        items-center
                        justify-center
                    ">

                        <CalendarDays
                            size={21}
                            className="text-purple-400"
                        />

                    </div>

                    <div>

                        <h2 className="
                            text-lg
                            font-bold
                            text-white
                        ">
                            Festival Impact
                        </h2>

                        <p className="
                            text-sm
                            text-slate-400
                        ">
                            Festival sales performance
                        </p>

                    </div>

                </div>

            </div>


            {/* FESTIVAL NAME */}

            <div className="
                rounded-xl
                bg-slate-800/60
                border
                border-slate-700
                p-4
                mb-4
            ">

                <div className="
                    text-xs
                    text-slate-400
                    uppercase
                    tracking-wide
                ">
                    Festival
                </div>

                <div className="
                    text-xl
                    font-bold
                    text-white
                    mt-1
                ">
                    {festivalName}
                </div>

                {startDate && (

                    <div className="
                        text-sm
                        text-slate-400
                        mt-2
                    ">

                        {formatDate(startDate)}

                        {endDate && (
                            <>
                                {" "}—{" "}
                                {formatDate(endDate)}
                            </>
                        )}

                    </div>

                )}

            </div>


            {/* METRICS */}

            <div className="
                grid
                grid-cols-1
                sm:grid-cols-3
                gap-3
            ">

                {/* SALES IMPACT */}

                <div className="
                    rounded-xl
                    bg-green-500/10
                    border
                    border-green-500/20
                    p-4
                ">

                    <div className="
                        flex
                        items-center
                        gap-2
                        text-green-400
                        mb-2
                    ">

                        <TrendingUp size={17} />

                        <span className="text-xs">
                            Sales Impact
                        </span>

                    </div>

                    <div className="
                        text-xl
                        font-bold
                        text-white
                    ">

                        {salesImpact
                            ? `${salesImpact.toLocaleString("en-IN")}%`
                            : "—"}

                    </div>

                </div>


                {/* REVENUE */}

                <div className="
                    rounded-xl
                    bg-blue-500/10
                    border
                    border-blue-500/20
                    p-4
                ">

                    <div className="
                        flex
                        items-center
                        gap-2
                        text-blue-400
                        mb-2
                    ">

                        <IndianRupee size={17} />

                        <span className="text-xs">
                            Revenue
                        </span>

                    </div>

                    <div className="
                        text-xl
                        font-bold
                        text-white
                    ">

                        {formatCurrency(revenue)}

                    </div>

                </div>


                {/* ORDERS */}

                <div className="
                    rounded-xl
                    bg-orange-500/10
                    border
                    border-orange-500/20
                    p-4
                ">

                    <div className="
                        flex
                        items-center
                        gap-2
                        text-orange-400
                        mb-2
                    ">

                        <ShoppingBag size={17} />

                        <span className="text-xs">
                            Orders
                        </span>

                    </div>

                    <div className="
                        text-xl
                        font-bold
                        text-white
                    ">

                        {orders
                            ? orders.toLocaleString("en-IN")
                            : "—"}

                    </div>

                </div>

            </div>


            {/* EMPTY STATE */}

            {!festival && (

                <div className="
                    mt-4
                    p-3
                    rounded-xl
                    bg-slate-800/40
                    text-sm
                    text-slate-400
                ">

                    Festival data is not available yet.

                </div>

            )}

        </div>
    );
}