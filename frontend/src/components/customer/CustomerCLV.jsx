import { Gem } from "lucide-react";

export default function CustomerCLV({
    customers = [],
}) {

    return (

        <div
            className="customer-card rounded-2xl border p-4 h-full"
        >

            <div className="mb-4 flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20">
                    <Gem size={16} className="text-purple-300" />
                </div>
                <div>

                <h2 className="text-base font-bold text-white tracking-wide">
                    Customer Lifetime Value
                </h2>

                <p className="text-slate-400 text-xs mt-0.5">
                    Top customers ranked by lifetime value
                </p>
                </div>

            </div>

                <div className="overflow-x-auto">

                <table className="w-full">

                    <thead>

                        <tr className="border-b border-blue-900/60">

                            <th className="text-left py-3 text-slate-400">
                                Customer
                            </th>

                            <th className="text-left py-3 text-slate-400">
                                Orders
                            </th>

                            <th className="text-left py-3 text-slate-400">
                                Revenue
                            </th>

                            <th className="text-left py-3 text-slate-400">
                                Profit
                            </th>

                            <th className="text-left py-3 text-slate-400">
                                CLV
                            </th>

                        </tr>

                    </thead>

                    <tbody>

                        {customers.map((customer) => (

                            <tr
                                key={customer.customer_id}
                                className="border-b border-blue-900/30"
                            >

                                <td className="py-3 text-white">
                                    {customer.customer_name}
                                </td>

                                <td className="py-3 text-slate-300">
                                    {customer.orders}
                                </td>

                                <td className="py-3 text-slate-300">
                                    ₹{customer.revenue.toLocaleString()}
                                </td>

                                <td className="py-3 text-green-400">
                                    ₹{customer.profit.toLocaleString()}
                                </td>

                                <td className="py-3 font-semibold text-purple-400">
                                    ₹{customer.clv.toLocaleString()}
                                </td>

                            </tr>

                        ))}

                    </tbody>

                </table>

            </div>

        </div>

    );
}