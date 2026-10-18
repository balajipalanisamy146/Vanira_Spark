import { Upload, ChartNoAxesColumn, MessageCircle, Bot, Zap } from "lucide-react";

export default function QuickActions({ className = "", onNavigate }) {
  const actions = [
    { icon: Upload, name: "Upload Sales", page: "Sales Upload" },
    { icon: ChartNoAxesColumn, name: "Generate Report", page: "Sales Analytics" },
    { icon: MessageCircle, name: "WhatsApp Campaign", target: "dashboard-ai-agents" },
    { icon: Bot, name: "AI Advisor", target: "dashboard-ai-advisor" },
  ];

  const handleAction = (action) => {
    if (action.page) {
      onNavigate?.(action.page);
      return;
    }

    document.getElementById(action.target)?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  };

  return (
    <div
      className={`glass-card rounded-2xl p-3 border border-[#1e3a8a] bg-[#020617] flex flex-col ${className}`}
    >
      <div className="flex items-center gap-2 mb-2">
        <Zap size={17} className="text-yellow-400 fill-yellow-400" />
        <h2 className="text-sm font-bold text-white">Quick Actions</h2>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.name}
              type="button"
              onClick={() => handleAction(action)}
              className="flex flex-col items-center justify-center p-2 rounded-xl bg-[#0B1730] hover:bg-[#12234b] border border-blue-900/60 hover:border-blue-700 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-300"
            >
              <Icon size={16} className="text-slate-200 mb-1" />
              <span className="text-[10px] text-slate-300 font-medium text-center">
                {action.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}