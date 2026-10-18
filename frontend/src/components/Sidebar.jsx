import {
    LayoutDashboard,
    BarChart3,
    Package,
    Users,
    Brain,
    Receipt,
    Settings,
    Bot,
    Upload,
    TrendingUp,
    ArrowRight,
} from "lucide-react";

const menus = [
    { name: "Dashboard", icon: LayoutDashboard },
    { name: "Sales Upload", icon: Upload },
    { name: "Sales Analytics", icon: BarChart3 },
    { name: "Customers Analytics", icon: Users },
    { name: "Product Analytics", icon: Package, },
    { name: "Inventory", icon: Package },
    { name: "Forecasting", icon: BarChart3 },
    { name: "AI Insights", icon: Brain },
    { name: "AI Chatbot", icon: Bot },
    { name: "Settings", icon: Settings }
];

export default function Sidebar({ activePage, setActivePage }) {

    return (
        <div
            className="
            w-64
            h-screen
            sticky
            top-0
            flex
            flex-col
            overflow-y-auto
            bg-[#081124]
            border-r
            border-blue-900
            text-white"
        >

            {/* Logo */}
            <div className="px-6 py-4 flex items-center gap-3">

                <img
                    src="/logo-transparent.png"
                    alt="Vanira Spark Logo"
                    className="w-9 h-9 object-contain drop-shadow"
                />

                <h1 className="text-2xl font-bold tracking-tight flex items-center">

                    Vanira

                    <span className="text-purple-400 ml-1">
                        Spark
                    </span>

                </h1>

            </div>

            {/* Menu */}
            <div className="px-4 py-1 space-y-0.5">

                {menus.map((item) => {

                    const Icon = item.icon;

                    const isActive = activePage === item.name;

                    return (
                        <button
                            key={item.name}
                            onClick={() => setActivePage(item.name)}
                            className={`
                                w-full
                                flex
                                items-center
                                gap-3
                                px-3
                                py-2
                                rounded-xl
                                transition
                                text-left
                                ${
                                    isActive
                                        ? "bg-purple-600 text-white"
                                        : "hover:bg-purple-600 text-slate-300"
                                }
                            `}
                        >

                            <Icon size={18} />

                            {item.name}

                        </button>
                    );
                })}

            </div>

            {/* Promo Card */}
            <div className="px-4 my-auto py-4">
                <div className="bg-[#0B1730] border border-[#1E3A8A] rounded-xl p-3">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mb-1.5 drop-shadow-md">
                        <path d="M3 20V13H7V20H3Z" fill="#3b82f6" fillOpacity="0.3"/>
                        <path d="M10 20V9H14V20H10Z" fill="#3b82f6" fillOpacity="0.5"/>
                        <path d="M17 20V4H21V20H17Z" fill="#3b82f6" fillOpacity="0.8"/>
                        <path d="M2 15L8 9L12 13L21 3" stroke="#60a5fa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M15 3H21V9" stroke="#60a5fa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <h3 className="text-sm font-bold text-white mb-1 leading-tight">
                        Grow Your Business<br/>with AI Insights
                    </h3>
                    <p className="text-xs text-slate-400 mb-2.5 leading-relaxed">
                        Smarter decisions.<br />
                        Higher sales. A sustainable<br />
                        future.
                    </p>
                    <button className="w-full bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-semibold py-1.5 rounded-lg transition flex items-center justify-center gap-1.5">
                        Explore AI Agent
                        <ArrowRight size={14} />
                    </button>
                </div>
            </div>

            {/* Footer */}
            <div className="px-5 pb-3">
                <p className="text-sm font-semibold text-slate-200">
                    Vanira Spark
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                    © 2026. All rights reserved.
                </p>
            </div>

        </div>
    );
}