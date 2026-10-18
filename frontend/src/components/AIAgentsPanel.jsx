import { Bot, CalendarDays, Tag, Megaphone, ArrowRight } from "lucide-react";

export default function AIAgentsPanel({ className = "" }) {
  const agents = [
    {
      name: "Festival Agent",
      desc: "Plan festive offers & promotions",
      icon: CalendarDays,
      bg: "bg-pink-500",
      textColor: "text-white",
    },
    {
      name: "Offer Agent",
      desc: "Find best offers for your customers",
      icon: Tag,
      bg: "bg-teal-400",
      textColor: "text-white",
    },
    {
      name: "Marketing Agent",
      desc: "Create marketing campaigns",
      icon: Megaphone,
      bg: "bg-purple-500",
      textColor: "text-white",
    },
  ];

  return (
    <div
      className={`glass-card rounded-2xl p-3 border border-[#1e3a8a] bg-[#020617] flex flex-col ${className}`}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <div className="bg-gradient-to-br from-indigo-400 to-fuchsia-400 p-1 rounded-lg flex-shrink-0">
          <Bot size={17} className="text-white" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-white">AI Agents</h2>
          <p className="text-[10px] text-blue-200">
            Let AI handle the complex tasks
          </p>
        </div>
      </div>

      {/* Agents List */}
      <div className="space-y-1.5">
        {agents.map((agent, i) => {
          const Icon = agent.icon;
          return (
            <div
              key={i}
              className="flex items-center p-2 rounded-xl bg-[#0B1730] border border-blue-900/40 hover:border-blue-700/80 transition-colors group cursor-pointer"
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${agent.bg}`}
              >
                <Icon size={16} className={agent.textColor} />
              </div>

              <div className="ml-2 flex-1 min-w-0">
                <h3 className="text-xs font-bold text-white">
                  {agent.name}
                </h3>
                <p className="text-[9px] text-blue-200 leading-tight">
                  {agent.desc}
                </p>
              </div>

              <div className="text-slate-500 group-hover:text-white transition-colors ml-2">
                <ArrowRight size={12} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}