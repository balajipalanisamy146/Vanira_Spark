import { Crown } from "lucide-react";

export default function TopCustomers({
    data = [],
}) {

    const currency = (value) =>
        new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0,
        }).format(value || 0);


    return (
        <div
            className="customer-card rounded-2xl border p-4"
        >

            <div className="mb-4 flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <Crown size={16} className="text-amber-300" />
                </div>
                <div>

                <h2 className="text-base font-bold text-white tracking-wide">
                    Top Customers
                </h2>

                <p className="text-xs text-slate-400 mt-0.5">
                    Customers ranked by revenue
                </p>
                </div>

            </div>


            <div className="overflow-x-auto">

                <table className="w-full">

                    <thead>

                        <tr className="border-b border-blue-900/60">

                            <th className="text-left py-3 text-xs text-slate-500 font-medium">
                                Customer
                            </th>

                            <th className="text-left py-3 text-xs text-slate-500 font-medium">
                                City
                            </th>

                            <th className="text-right py-3 text-xs text-slate-500 font-medium">
                                Revenue
                            </th>

                            <th className="text-right py-3 text-xs text-slate-500 font-medium">
                                Orders
                            </th>

                            <th className="text-right py-3 text-xs text-slate-500 font-medium">
                                Profit
                            </th>

                            <th className="text-right py-3 text-xs text-slate-500 font-medium">
                                Last Purchase
                            </th>

                        </tr>

                    </thead>


                    <tbody>

                        {data.map((customer) => (

                            <tr
                                key={customer.customer_id}
                                className="border-b border-blue-900/30"
                            >

                                <td className="py-4">

                                    <div className="font-medium text-white">
                                        {customer.customer_name}
                                    </div>

                                    <div className="text-xs text-slate-500">
                                        {customer.customer_id}
                                    </div>

                                </td>


                                <td className="py-4 text-sm text-slate-400">
                                    {customer.city}
                                </td>


                                <td className="py-4 text-right text-sm text-white font-medium">
                                    {currency(customer.revenue)}
                                </td>


                                <td className="py-4 text-right text-sm text-slate-300">
                                    {customer.orders}
                                </td>


                                <td className="py-4 text-right text-sm text-emerald-400">
                                    {currency(customer.profit)}
                                </td>


                                <td className="py-4 text-right text-sm text-slate-400">
                                    {customer.last_purchase || "-"}
                                </td>

                            </tr>

                        ))}

                    </tbody>

                </table>

            </div>

        </div>
    );
}