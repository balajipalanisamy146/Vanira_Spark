export default function TopCustomersTable({ customers = [] }) {
  return (
    <div className="glass-card p-5 mt-6">

      <h2 className="text-xl font-bold mb-4">
        Top Customers
      </h2>

      <table className="w-full">

        <thead>
          <tr className="border-b border-slate-700">
            <th className="text-left p-2">Customer</th>
            <th className="text-left p-2">Spending</th>
          </tr>
        </thead>

        <tbody>

          {customers.map((customer, index) => (

            <tr
              key={index}
              className="border-b border-slate-800"
            >
              <td className="p-2">
                {customer.customer_name}
              </td>

              <td className="p-2">
                ₹{Math.round(customer.spending)}
              </td>
            </tr>

          ))}

        </tbody>

      </table>

    </div>
  );
}