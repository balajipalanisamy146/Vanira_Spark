import { Users, Star, RefreshCw, DollarSign } from "lucide-react";

export default function CustomerAnalytics({
  summary,
  segments,
  repeat,
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">

      <div className="glass-card p-5">
        <Users size={28} />
        <p className="text-slate-400 mt-2">Total Customers</p>
        <h2 className="text-3xl font-bold">
          {summary?.total_customers || 0}
        </h2>
      </div>

      <div className="glass-card p-5">
        <Star size={28} />
        <p className="text-slate-400 mt-2">VIP Customers</p>
        <h2 className="text-3xl font-bold">
          {segments?.vip || 0}
        </h2>
      </div>

      <div className="glass-card p-5">
        <RefreshCw size={28} />
        <p className="text-slate-400 mt-2">Repeat Customers</p>
        <h2 className="text-3xl font-bold">
          {repeat?.repeat_customers || 0}
        </h2>
      </div>

      <div className="glass-card p-5">
        <DollarSign size={28} />
        <p className="text-slate-400 mt-2">Avg Order Value</p>
        <h2 className="text-3xl font-bold">
          ₹{Math.round(summary?.avg_order_value || 0)}
        </h2>
      </div>

    </div>
  );
}