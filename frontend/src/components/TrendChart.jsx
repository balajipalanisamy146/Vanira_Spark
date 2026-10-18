import {
    ResponsiveContainer,
    AreaChart,
    Area,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip
} from "recharts";
import { TrendingUp } from "lucide-react";

function formatPeriod(value, title) {
    if (typeof value !== "string") return value;
    if (/^\d{4}$/.test(value)) return value;

    const dateParts = value.match(/^(\d{4})-(\d{2})(?:-(\d{2}))?$/);
    if (!dateParts) return value;

    const [, year, month, day = "01"] = dateParts;
    const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
    const options = title.startsWith("Monthly")
        ? { month: "short", year: "2-digit", timeZone: "UTC" }
        : { month: "short", day: "numeric", timeZone: "UTC" };

    return date.toLocaleDateString("en-US", options);
}

export default function TrendChart({
    title,
    data
}) {
    const periodKey = data?.[0]?.date ? "date" : "period";
    const isDailyTrend = title === "Daily Sales Trend";
    const isMonthlyTrend = title === "Monthly Sales Trend";
    const gradientId = `trend-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

    return (

        <div className="bg-[#0B1730] rounded-2xl p-5 border border-blue-900/60 shadow-xl">

            <div className="flex items-center gap-2 mb-4">
                <div className="p-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20">
                    <TrendingUp className="w-4 h-4 text-purple-400" />
                </div>
                <h3 className="text-base font-bold text-white tracking-wide">
                    {title}
                </h3>
            </div>

            <div className="h-[220px]">

                <ResponsiveContainer
                    width="100%"
                    height="100%"
                >

                    <AreaChart
                        data={data}
                        margin={{ top: 5, right: 10, left: 0, bottom: 0 }}
                    >
                        <defs>
                            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#d946ef" stopOpacity={0.55} />
                                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.04} />
                            </linearGradient>
                        </defs>

                        <CartesianGrid stroke="#1e3a8a" opacity={0.5} />

                        <XAxis
                            dataKey={periodKey}
                            tick={{ fill: "#94a3b8", fontSize: isDailyTrend || isMonthlyTrend ? 9 : 10 }}
                            axisLine={false}
                            tickLine={false}
                            tickMargin={isDailyTrend || isMonthlyTrend ? 4 : 10}
                            interval={isDailyTrend || isMonthlyTrend ? 0 : "preserveEnd"}
                            minTickGap={isDailyTrend || isMonthlyTrend ? 0 : 20}
                            angle={isDailyTrend ? -45 : 0}
                            textAnchor={isDailyTrend ? "end" : "middle"}
                            height={isDailyTrend ? 48 : 30}
                            tickFormatter={(value) => formatPeriod(value, title)}
                        />

                        <YAxis
                            tick={{ fill: "#94a3b8", fontSize: 10 }}
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={(value) => value === 0 ? "0" : `${(value / 1000).toFixed(0)}K`}
                            width={46}
                            tickMargin={6}
                        />

                        <Tooltip
                            contentStyle={{
                                backgroundColor: "#122042",
                                border: "1px solid #1e3a8a",
                                borderRadius: "10px",
                                fontSize: "12px",
                                color: "#fff",
                            }}
                            labelFormatter={(value) => formatPeriod(value, title)}
                            formatter={(value) => [`₹${Number(value).toLocaleString("en-IN")}`, "Sales"]}
                        />

                        <Area
                            type="monotone"
                            dataKey="sales"
                            stroke="#d946ef"
                            strokeWidth={2.5}
                            fill={`url(#${gradientId})`}
                            dot={false}
                            activeDot={{ r: 5, fill: "#fff", stroke: "#d946ef", strokeWidth: 2 }}
                        />

                    </AreaChart>

                </ResponsiveContainer>

            </div>

        </div>
    );
}