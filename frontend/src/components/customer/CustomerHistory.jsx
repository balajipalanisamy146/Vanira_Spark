export default function CustomerHistory({
    data = [],
}) {
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

            <div className="p-4 border-b border-blue-900/60">

                <h2 className="text-base font-bold text-white tracking-wide">
                    Purchase History
                </h2>

                <p className="text-xs text-slate-400 mt-0.5">
                    Recent customer transactions.
                </p>

            </div>

            {data.length === 0 ? (
                <div className="p-6 text-center text-sm text-slate-500">
                    No purchase history available.
                </div>
            ) : (
                <div className="overflow-x-auto">

                    <table className="w-full text-sm">

                        <thead className="bg-[#081124]">

                            <tr className="text-left text-gray-400">

                                <th className="px-6 py-4 font-medium">
                                    Invoice
                                </th>

                                <th className="px-6 py-4 font-medium">
                                    Date
                                </th>

                                <th className="px-6 py-4 font-medium">
                                    Product
                                </th>

                                <th className="px-6 py-4 font-medium text-right">
                                    Qty
                                </th>

                                <th className="px-6 py-4 font-medium text-right">
                                    Revenue
                                </th>

                                <th className="px-6 py-4 font-medium text-right">
                                    Profit
                                </th>

                            </tr>

                        </thead>

                        <tbody className="divide-y divide-blue-900/30">

                            {data.map(
                                (
                                    item,
                                    index
                                ) => (

                                    <tr
                                        key={`${item.invoice_id}-${index}`}
                                        className="hover:bg-blue-950/30"
                                    >

                                        <td className="px-6 py-4 text-white">
                                            {item.invoice_id}
                                        </td>

                                        <td className="px-6 py-4 text-gray-400">
                                            {formatDate(
                                                item.sale_date
                                            )}
                                        </td>

                                        <td className="px-6 py-4 text-gray-300">
                                            {item.product_name ||
                                                "—"}
                                        </td>

                                        <td className="px-6 py-4 text-right text-gray-300">
                                            {Number(
                                                item.quantity ||
                                                    0
                                            ).toLocaleString(
                                                "en-IN"
                                            )}
                                        </td>

                                        <td className="px-6 py-4 text-right text-white">
                                            {formatCurrency(
                                                item.total_amount
                                            )}
                                        </td>

                                        <td className="px-6 py-4 text-right text-gray-300">
                                            {formatCurrency(
                                                item.profit
                                            )}
                                        </td>

                                    </tr>

                                )
                            )}

                        </tbody>

                    </table>

                </div>
            )}

        </section>
    );
}