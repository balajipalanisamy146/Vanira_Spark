import { ArrowRight, Package2 } from "lucide-react";
import { formatCompactValue } from "./formatCompactValue";

export default function TopProductsTable({ products = [], onNavigate }) {
 const topProducts = [...products]
  .sort((a, b) => Number(b.quantity_sold || 0) - Number(a.quantity_sold || 0))
  .slice(0, 5);

 return(

  <section className="glass-card flex h-full flex-col overflow-hidden rounded-2xl border border-blue-900 bg-[#07162d] p-3">

   <header className="mb-2 flex items-center justify-between border-b border-blue-900/70 pb-2">
    <div className="flex min-w-0 items-center gap-2">
     <Package2 size={16} className="shrink-0 text-slate-300" />
     <h2 className="truncate text-xs font-bold text-white">Top Selling Products</h2>
    </div>
    <button type="button" onClick={() => onNavigate?.("Product Analytics")} className="ml-2 inline-flex shrink-0 items-center gap-1 text-[10px] font-semibold text-purple-400 transition-colors hover:text-purple-300">
     View All <ArrowRight size={12} />
    </button>
   </header>

  <table className="w-full flex-1 table-fixed text-[10px]">

   <colgroup>
    <col className="w-[8%]" />
    <col className="w-[40%]" />
    <col className="w-[32%]" />
    <col className="w-[20%]" />
   </colgroup>

    <thead>

      <tr className="h-6 text-slate-300">
        <th className="text-left font-medium">#</th>
        <th className="text-left font-medium">Product</th>
        <th className="text-right font-medium">Sales</th>
        <th className="text-right font-medium">Quantity</th>

      </tr>

    </thead>

    <tbody>

    {topProducts.map((product, index) => {
     const revenue = Number(product.revenue ?? product.sales ?? 0);
     const fullRevenue = `₹${revenue.toLocaleString("en-IN", {
      maximumFractionDigits: 2,
     })}`;

     return (
      <tr
       key={`${product.product_name}-${product.brand || ""}`}
       className="h-8 border-t border-blue-900/70 text-slate-100"
      >
       <td className="text-slate-400">{index + 1}</td>
       <td className="truncate pr-1 font-medium" title={product.product_name}>
        {product.product_name}
       </td>
       <td className="whitespace-nowrap text-right" title={fullRevenue}>
        {formatCompactValue(fullRevenue)}
       </td>
       <td className="whitespace-nowrap text-right text-slate-300">
        {Number(product.quantity_sold || 0).toLocaleString("en-IN")}
       </td>
      </tr>
     );
    })}
    {topProducts.length === 0 && (
     <tr>
      <td colSpan={4} className="py-6 text-center text-slate-400">
       No product sales available.
      </td>
     </tr>
    )}

    </tbody>

   </table>

  </section>

 )
}