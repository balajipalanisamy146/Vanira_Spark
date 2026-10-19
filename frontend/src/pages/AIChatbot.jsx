import { useState, useEffect, useRef } from "react";
import {
    Bot,
    Sparkles,
    Send,
    RefreshCw,
    Trash2,
    Database,
    ShieldCheck,
    Coins,
    Package,
    Users,
    AlertTriangle,
    BarChart3,
    ArrowUp,
    ArrowDown,
    Copy,
    Check,
    Info,
    ChevronDown,
    ChevronUp,
    CornerDownLeft,
    CheckCircle2,
    AlertCircle
} from "lucide-react";
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid
} from "recharts";
import api from "../services/api";

const STORAGE_KEY = "vanira_spark_chat_session_v1";

const DEFAULT_SUGGESTION_CATEGORIES = [
    {
        category: "Sales & Revenue",
        icon: Coins,
        color: "from-blue-500/20 to-indigo-500/10 border-blue-500/30 text-blue-400",
        prompts: [
            "What are my total sales and profit?",
            "How much revenue did I generate this month?",
            "Compare this month with the previous month",
            "Which month had the highest sales?",
            "Are sales increasing or decreasing?"
        ]
    },
    {
        category: "Products & Performance",
        icon: Package,
        color: "from-cyan-500/20 to-teal-500/10 border-cyan-500/30 text-cyan-400",
        prompts: [
            "Show my top 10 products by sales",
            "Which product generates the highest profit?",
            "Which category contributes the most revenue?",
            "Which products have declining sales?",
            "Which products have low sales?"
        ]
    },
    {
        category: "Customer Trends",
        icon: Users,
        color: "from-purple-500/20 to-pink-500/10 border-purple-500/30 text-purple-400",
        prompts: [
            "How many customers do I have?",
            "How many repeat customers do I have?",
            "Which customer segments generate the most revenue?",
            "How has customer purchasing behavior changed?"
        ]
    },
    {
        category: "Inventory & Stock Risks",
        icon: AlertTriangle,
        color: "from-amber-500/20 to-rose-500/10 border-amber-500/30 text-amber-400",
        prompts: [
            "Which products have low stock?",
            "Which products might run out of stock?",
            "What inventory risks should I investigate?",
            "Which products have slow-moving inventory?"
        ]
    }
];

export default function AIChatbot() {
    const [messages, setMessages] = useState(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });

    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [dbStatus, setDbStatus] = useState({
        checking: true,
        connected: false,
        records: 0,
        dateRange: "",
        error: ""
    });
    const [copiedIndex, setCopiedIndex] = useState(null);
    const [expandedFormulas, setExpandedFormulas] = useState({});

    const messagesEndRef = useRef(null);
    const textareaRef = useRef(null);

    // Save conversation to session storage
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
        } catch (e) {
            console.error("Failed to persist chat session:", e);
        }
    }, [messages]);

    // Check live database connection status
    const verifyDatabaseStatus = async () => {
        setDbStatus((prev) => ({ ...prev, checking: true, error: "" }));
        try {
            const res = await api.get("/chat/status");
            if (res.data && res.data.connected) {
                setDbStatus({
                    checking: false,
                    connected: true,
                    records: res.data.sales_records || 0,
                    dateRange: res.data.date_range || "",
                    error: ""
                });
            } else {
                setDbStatus({
                    checking: false,
                    connected: false,
                    records: 0,
                    dateRange: "",
                    error: res.data.error || "Database unavailable"
                });
            }
        } catch (err) {
            setDbStatus({
                checking: false,
                connected: false,
                records: 0,
                dateRange: "",
                error: err.message || "Failed to reach backend API"
            });
        }
    };

    useEffect(() => {
        verifyDatabaseStatus();
    }, []);

    // Scroll chat to bottom smoothly
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, loading]);

    // Handle form submission
    const handleSend = async (textToSend) => {
        const queryText = (textToSend || input).trim();
        if (!queryText || loading) return;

        setInput("");
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
        }

        const userMsg = {
            id: Date.now(),
            sender: "user",
            text: queryText,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        };

        setMessages((prev) => [...prev, userMsg]);
        setLoading(true);

        try {
            const res = await api.post("/chat/query", {
                message: queryText,
                session_id: "vanira-session-active"
            });

            const data = res.data;
            const assistantMsg = {
                id: Date.now() + 1,
                sender: "assistant",
                text: data.answer || "No response received.",
                intent: data.intent,
                title: data.title,
                dataBacked: data.data_backed !== false,
                kpis: data.kpis || [],
                table: data.table || null,
                chart: data.chart || null,
                metricDefinitions: data.metric_definitions || [],
                limitations: data.limitations || null,
                source: data.source || "PostgreSQL Database",
                dateRange: data.date_range || "",
                suggestedFollowups: data.suggested_followups || [],
                timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            };

            setMessages((prev) => [...prev, assistantMsg]);
        } catch (_err) {
            const errorMsg = {
                id: Date.now() + 1,
                sender: "assistant",
                isError: true,
                text: "Unable to query business data. Please check that the backend service is running and the PostgreSQL database is reachable.",
                failedQuery: queryText,
                timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            };
            setMessages((prev) => [...prev, errorMsg]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleTextareaInput = (e) => {
        setInput(e.target.value);
        e.target.style.height = "auto";
        e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
    };

    const handleClearChat = () => {
        if (window.confirm("Start a new chat session? Previous conversation messages will be cleared.")) {
            setMessages([]);
            localStorage.removeItem(STORAGE_KEY);
        }
    };

    const handleCopy = (text, index) => {
        navigator.clipboard.writeText(text);
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
    };

    const toggleFormula = (id) => {
        setExpandedFormulas((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    // Render formatted markdown-like text
    const renderFormattedText = (rawText) => {
        if (!rawText) return null;
        const paragraphs = rawText.split("\n\n");

        return paragraphs.map((para, pIdx) => {
            // Check for list items
            if (para.includes("\n- ") || para.startsWith("- ")) {
                const items = para.split("\n").filter((l) => l.trim().length > 0);
                return (
                    <ul key={pIdx} className="space-y-1.5 my-2 list-disc list-inside text-slate-200">
                        {items.map((item, iIdx) => {
                            const cleaned = item.replace(/^-\s*/, "");
                            return (
                                <li key={iIdx} className="leading-relaxed">
                                    {renderInlineMarkdown(cleaned)}
                                </li>
                            );
                        })}
                    </ul>
                );
            }

            return (
                <p key={pIdx} className="leading-relaxed my-1.5 text-slate-200">
                    {renderInlineMarkdown(para)}
                </p>
            );
        });
    };

    const renderInlineMarkdown = (textStr) => {
        const parts = textStr.split(/(\*\*.*?\*\*|\*.*?\*)/g);
        return parts.map((part, idx) => {
            if (part.startsWith("**") && part.endsWith("**")) {
                return (
                    <strong key={idx} className="font-bold text-white tracking-wide">
                        {part.slice(2, -2)}
                    </strong>
                );
            }
            if (part.startsWith("*") && part.endsWith("*")) {
                return (
                    <em key={idx} className="italic text-cyan-200">
                        {part.slice(1, -1)}
                    </em>
                );
            }
            return part;
        });
    };

    return (
        <div className="flex-1 flex flex-col h-screen overflow-hidden bg-[#070B1F] text-white">
            {/* Top Navigation & Status Bar */}
            <header className="shrink-0 bg-[#081124] border-b border-blue-900/60 px-6 py-4 flex flex-wrap items-center justify-between gap-4 shadow-lg z-10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white shadow-md shadow-purple-900/40">
                        <Bot size={22} className="text-white" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-lg font-bold text-white tracking-tight flex items-center gap-1.5">
                                Vanira Spark
                                <span className="text-purple-400">AI Assistant</span>
                            </h1>
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                Phase 2 Production
                            </span>
                        </div>
                        <p className="text-xs text-slate-400">
                            Real-time data engine grounded in verified PostgreSQL business records
                        </p>
                    </div>
                </div>

                {/* Connection Status Pill & Actions */}
                <div className="flex items-center gap-3">
                    <div
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs transition-colors ${
                            dbStatus.checking
                                ? "bg-slate-800/60 border-slate-700 text-slate-300"
                                : dbStatus.connected
                                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                                : "bg-rose-500/10 border-rose-500/30 text-rose-300"
                        }`}
                        title={
                            dbStatus.connected
                                ? `Connected to PostgreSQL • ${dbStatus.records.toLocaleString()} records • ${dbStatus.dateRange}`
                                : dbStatus.error || "Disconnected"
                        }
                    >
                        <span
                            className={`w-2 h-2 rounded-full ${
                                dbStatus.checking
                                    ? "bg-slate-400 animate-pulse"
                                    : dbStatus.connected
                                    ? "bg-emerald-400 shadow-[0_0_8px_#34d399]"
                                    : "bg-rose-400"
                            }`}
                        />
                        <span className="font-medium text-[11.5px]">
                            {dbStatus.checking
                                ? "Verifying DB..."
                                : dbStatus.connected
                                ? `PostgreSQL Connected (${(dbStatus.records / 1000).toFixed(1)}k rows)`
                                : "DB Disconnected"}
                        </span>
                        <button
                            onClick={verifyDatabaseStatus}
                            className="text-slate-400 hover:text-white transition ml-1"
                            title="Refresh database connection status"
                        >
                            <RefreshCw size={12} className={dbStatus.checking ? "animate-spin" : ""} />
                        </button>
                    </div>

                    {messages.length > 0 && (
                        <button
                            onClick={handleClearChat}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0B1730] border border-blue-900/60 hover:border-rose-500/50 hover:bg-rose-500/10 text-slate-300 hover:text-rose-300 text-xs font-semibold transition"
                            title="Start fresh conversation"
                        >
                            <Trash2 size={13} />
                            New Chat
                        </button>
                    )}
                </div>
            </header>

            {/* Conversation Area */}
            <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
                {messages.length === 0 ? (
                    /* Welcome Screen */
                    <div className="max-w-4xl mx-auto py-6 space-y-8 animate-fadeIn">
                        {/* Welcome Card */}
                        <div className="relative overflow-hidden rounded-2xl border border-blue-900/60 bg-gradient-to-br from-[#0B1730] via-[#081124] to-[#040816] p-6 md:p-8 shadow-2xl">
                            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                                <Bot size={180} />
                            </div>

                            <div className="flex items-center gap-2 mb-2 text-purple-400">
                                <Sparkles size={18} />
                                <span className="text-xs font-bold uppercase tracking-widest">
                                    Intelligent Business Copilot
                                </span>
                            </div>

                            <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                                How can I help you grow Vanira Spark today?
                            </h2>
                            <p className="mt-2 text-sm text-slate-300 max-w-2xl leading-relaxed">
                                Ask any question about your actual business data in natural language. I calculate
                                deterministic answers directly from your PostgreSQL database without fabricating metrics.
                            </p>

                            <div className="mt-6 flex flex-wrap items-center gap-4 text-xs text-slate-400">
                                <span className="flex items-center gap-1.5 bg-[#0B1730] px-3 py-1.5 rounded-lg border border-blue-900/40">
                                    <Database size={13} className="text-cyan-400" />
                                    67,681 Verified Sales Transactions
                                </span>
                                <span className="flex items-center gap-1.5 bg-[#0B1730] px-3 py-1.5 rounded-lg border border-blue-900/40">
                                    <ShieldCheck size={13} className="text-emerald-400" />
                                    Strict Read-Only Parameterized SQL
                                </span>
                                <span className="flex items-center gap-1.5 bg-[#0B1730] px-3 py-1.5 rounded-lg border border-blue-900/40">
                                    <CheckCircle2 size={13} className="text-purple-400" />
                                    Customer Privacy Protected
                                </span>
                            </div>
                        </div>

                        {/* Suggested Prompt Categories Grid */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                Suggested Questions by Business Domain
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {DEFAULT_SUGGESTION_CATEGORIES.map((cat, idx) => {
                                    const Icon = cat.icon;
                                    return (
                                        <div
                                            key={idx}
                                            className="bg-[#0B1730] rounded-2xl border border-blue-900/60 p-5 flex flex-col justify-between shadow-xl transition-all duration-300 hover:border-blue-700/80"
                                        >
                                            <div className="flex items-center gap-2.5 mb-3">
                                                <div className={`p-2 rounded-xl border bg-gradient-to-br ${cat.color}`}>
                                                    <Icon size={16} />
                                                </div>
                                                <h4 className="text-sm font-bold text-white">{cat.category}</h4>
                                            </div>

                                            <div className="space-y-2">
                                                {cat.prompts.map((p, pIdx) => (
                                                    <button
                                                        key={pIdx}
                                                        onClick={() => handleSend(p)}
                                                        className="w-full text-left text-xs text-slate-300 hover:text-white bg-[#081124] hover:bg-purple-600/20 border border-blue-900/40 hover:border-purple-500/50 p-2.5 rounded-xl transition flex items-center justify-between group"
                                                    >
                                                        <span>{p}</span>
                                                        <CornerDownLeft
                                                            size={12}
                                                            className="text-slate-500 group-hover:text-purple-400 transition"
                                                        />
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                ) : (
                    /* Messages Feed */
                    <div className="max-w-4xl mx-auto space-y-6">
                        {messages.map((msg, index) => (
                            <div key={msg.id || index} className="space-y-2">
                                {msg.sender === "user" ? (
                                    /* User Message Bubble */
                                    <div className="flex justify-end items-start gap-3 pl-12">
                                        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl rounded-tr-sm px-5 py-3 shadow-lg max-w-xl">
                                            <p className="text-sm font-medium leading-relaxed">{msg.text}</p>
                                            <span className="block text-[10px] text-purple-200 mt-1 text-right">
                                                {msg.timestamp}
                                            </span>
                                        </div>
                                    </div>
                                ) : msg.isError ? (
                                    /* Error Message Bubble */
                                    <div className="flex items-start gap-3 pr-12">
                                        <div className="w-8 h-8 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0">
                                            <AlertCircle size={16} />
                                        </div>
                                        <div className="bg-[#0B1730] border border-rose-500/40 rounded-2xl p-4 max-w-2xl text-xs space-y-3">
                                            <p className="text-rose-200">{msg.text}</p>
                                            {msg.failedQuery && (
                                                <button
                                                    onClick={() => handleSend(msg.failedQuery)}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 font-semibold transition"
                                                >
                                                    <RefreshCw size={12} />
                                                    Retry Question
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    /* Assistant Message Card */
                                    <div className="flex items-start gap-3.5 pr-4 md:pr-12">
                                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-purple-900/30">
                                            <Bot size={18} />
                                        </div>

                                        <div className="flex-1 bg-[#0B1730] border border-blue-900/60 rounded-2xl rounded-tl-sm p-5 shadow-xl space-y-4">
                                            {/* Header with Title and Copy */}
                                            <div className="flex items-center justify-between border-b border-blue-900/40 pb-3">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/10 text-cyan-300 border border-blue-500/20">
                                                        {msg.intent ? msg.intent.replace(/_/g, " ") : "Business Insight"}
                                                    </span>
                                                    {msg.title && (
                                                        <h3 className="text-sm font-bold text-white">
                                                            {msg.title}
                                                        </h3>
                                                    )}
                                                </div>

                                                <button
                                                    onClick={() => handleCopy(msg.text, index)}
                                                    className="text-slate-400 hover:text-white transition p-1 rounded-lg hover:bg-slate-800"
                                                    title="Copy response text"
                                                >
                                                    {copiedIndex === index ? (
                                                        <Check size={14} className="text-emerald-400" />
                                                    ) : (
                                                        <Copy size={14} />
                                                    )}
                                                </button>
                                            </div>

                                            {/* Core Text Content */}
                                            <div className="text-sm">
                                                {renderFormattedText(msg.text)}
                                            </div>

                                            {/* KPI Cards Grid */}
                                            {msg.kpis && msg.kpis.length > 0 && (
                                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                                                    {msg.kpis.map((kpi, kIdx) => (
                                                        <div
                                                            key={kIdx}
                                                            className="bg-[#081124] border border-blue-900/50 rounded-xl p-3 shadow-inner"
                                                        >
                                                            <div className="text-[11px] font-semibold text-slate-400 truncate">
                                                                {kpi.label}
                                                            </div>
                                                            <div className="text-lg font-extrabold text-white mt-0.5 truncate">
                                                                {kpi.value}
                                                            </div>
                                                            {(kpi.change || kpi.subtext) && (
                                                                <div className="flex items-center gap-1 text-[10.5px] mt-1">
                                                                    {kpi.change && (
                                                                        <span
                                                                            className={`flex items-center font-bold ${
                                                                                kpi.is_positive
                                                                                    ? "text-emerald-400"
                                                                                    : "text-rose-400"
                                                                            }`}
                                                                        >
                                                                            {kpi.is_positive ? (
                                                                                <ArrowUp size={11} className="mr-0.5" />
                                                                            ) : (
                                                                                <ArrowDown size={11} className="mr-0.5" />
                                                                            )}
                                                                            {kpi.change}
                                                                        </span>
                                                                    )}
                                                                    {kpi.subtext && (
                                                                        <span className="text-slate-400 truncate">
                                                                            {kpi.subtext}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Recharts Chart */}
                                            {msg.chart && (
                                                <div className="bg-[#081124] border border-blue-900/50 rounded-xl p-4">
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <BarChart3 size={15} className="text-cyan-400" />
                                                        <h4 className="text-xs font-bold text-slate-200">
                                                            {msg.chart.title}
                                                        </h4>
                                                    </div>

                                                    <div className="h-56 w-full">
                                                        <ResponsiveContainer width="100%" height="100%">
                                                            {msg.chart.type === "pie" ? (
                                                                <PieChart>
                                                                    <Pie
                                                                        data={msg.chart.data}
                                                                        dataKey={msg.chart.dataKey || "value"}
                                                                        nameKey={msg.chart.nameKey || "name"}
                                                                        cx="50%"
                                                                        cy="50%"
                                                                        innerRadius={50}
                                                                        outerRadius={75}
                                                                        paddingAngle={2}
                                                                    >
                                                                        {msg.chart.data.map((entry, eIdx) => (
                                                                            <Cell
                                                                                key={`cell-${eIdx}`}
                                                                                fill={
                                                                                    entry.color ||
                                                                                    ["#3B82F6", "#06B6D4", "#10B981", "#EC4899", "#8B5CF6"][eIdx % 5]
                                                                                }
                                                                            />
                                                                        ))}
                                                                    </Pie>
                                                                    <Tooltip
                                                                        content={({ active, payload }) => {
                                                                            if (active && payload && payload.length) {
                                                                                const d = payload[0].payload;
                                                                                return (
                                                                                    <div className="bg-[#122042] border border-blue-800 p-2 rounded-lg text-xs shadow-lg">
                                                                                        <div className="font-bold text-white">
                                                                                            {d.name}
                                                                                        </div>
                                                                                        <div className="text-cyan-300">
                                                                                            Share: {d.percentage || `${d.value}%`}
                                                                                        </div>
                                                                                    </div>
                                                                                );
                                                                            }
                                                                            return null;
                                                                        }}
                                                                    />
                                                                </PieChart>
                                                            ) : msg.chart.type === "line" ? (
                                                                <LineChart data={msg.chart.data}>
                                                                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                                                    <XAxis
                                                                        dataKey={msg.chart.xKey || "month"}
                                                                        stroke="#64748b"
                                                                        fontSize={11}
                                                                    />
                                                                    <YAxis stroke="#64748b" fontSize={11} />
                                                                    <Tooltip
                                                                        contentStyle={{
                                                                            backgroundColor: "#122042",
                                                                            borderColor: "#1e3a8a",
                                                                            borderRadius: "8px",
                                                                            fontSize: "12px"
                                                                        }}
                                                                    />
                                                                    {msg.chart.lines?.map((line, lIdx) => (
                                                                        <Line
                                                                            key={lIdx}
                                                                            type="monotone"
                                                                            dataKey={line.key}
                                                                            stroke={line.color}
                                                                            name={line.name}
                                                                            strokeWidth={2}
                                                                            dot={{ r: 3 }}
                                                                        />
                                                                    ))}
                                                                </LineChart>
                                                            ) : (
                                                                <BarChart data={msg.chart.data}>
                                                                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                                                    <XAxis
                                                                        dataKey={msg.chart.xKey || "name"}
                                                                        stroke="#64748b"
                                                                        fontSize={11}
                                                                    />
                                                                    <YAxis stroke="#64748b" fontSize={11} />
                                                                    <Tooltip
                                                                        contentStyle={{
                                                                            backgroundColor: "#122042",
                                                                            borderColor: "#1e3a8a",
                                                                            borderRadius: "8px",
                                                                            fontSize: "12px"
                                                                        }}
                                                                    />
                                                                    {msg.chart.bars?.map((bar, bIdx) => (
                                                                        <Bar
                                                                            key={bIdx}
                                                                            dataKey={bar.key}
                                                                            name={bar.name}
                                                                            fill={bar.color}
                                                                            radius={[4, 4, 0, 0]}
                                                                        />
                                                                    ))}
                                                                </BarChart>
                                                            )}
                                                        </ResponsiveContainer>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Data Table */}
                                            {msg.table && msg.table.rows && msg.table.rows.length > 0 && (
                                                <div className="bg-[#081124] border border-blue-900/50 rounded-xl overflow-hidden shadow-inner">
                                                    <div className="overflow-x-auto max-h-64 no-scrollbar">
                                                        <table className="w-full text-left text-xs">
                                                            <thead className="bg-[#040816] text-slate-300 border-b border-blue-900/60 sticky top-0">
                                                                <tr>
                                                                    {msg.table.columns.map((col, cIdx) => (
                                                                        <th
                                                                            key={cIdx}
                                                                            className="px-3 py-2 font-semibold tracking-wider text-[11px]"
                                                                        >
                                                                            {col}
                                                                        </th>
                                                                    ))}
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-blue-900/30 text-slate-300">
                                                                {msg.table.rows.map((row, rIdx) => (
                                                                    <tr
                                                                        key={rIdx}
                                                                        className="hover:bg-blue-950/30 transition-colors"
                                                                    >
                                                                        {msg.table.columns.map((col, cIdx) => {
                                                                            const val = row[col];
                                                                            const isStatus = col.toLowerCase().includes("status");
                                                                            const isCritical =
                                                                                String(val).toLowerCase().includes("out of stock") ||
                                                                                String(val).toLowerCase().includes("critical");

                                                                            return (
                                                                                <td
                                                                                    key={cIdx}
                                                                                    className="px-3 py-2 whitespace-nowrap"
                                                                                >
                                                                                    {isStatus ? (
                                                                                        <span
                                                                                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                                                                isCritical
                                                                                                    ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                                                                                                    : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                                                                            }`}
                                                                                        >
                                                                                            {val}
                                                                                        </span>
                                                                                    ) : (
                                                                                        val
                                                                                    )}
                                                                                </td>
                                                                            );
                                                                        })}
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Limitations Notice */}
                                            {msg.limitations && (
                                                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 flex items-start gap-2 text-xs text-amber-200">
                                                    <Info size={15} className="shrink-0 mt-0.5 text-amber-400" />
                                                    <span>{msg.limitations}</span>
                                                </div>
                                            )}

                                            {/* Footer with Source & Calculation Dropdown */}
                                            <div className="pt-2 border-t border-blue-900/40 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
                                                <div className="flex items-center gap-1.5">
                                                    <Database size={12} className="text-cyan-400" />
                                                    <span>{msg.source}</span>
                                                    {msg.dateRange && (
                                                        <span className="text-slate-500">• {msg.dateRange}</span>
                                                    )}
                                                </div>

                                                {msg.metricDefinitions && msg.metricDefinitions.length > 0 && (
                                                    <button
                                                        onClick={() => toggleFormula(msg.id || index)}
                                                        className="text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1 transition"
                                                    >
                                                        <span>Calculation Logic</span>
                                                        {expandedFormulas[msg.id || index] ? (
                                                            <ChevronUp size={12} />
                                                        ) : (
                                                            <ChevronDown size={12} />
                                                        )}
                                                    </button>
                                                )}
                                            </div>

                                            {/* Expandable Calculation Logic */}
                                            {expandedFormulas[msg.id || index] && (
                                                <div className="bg-[#040816] rounded-xl p-3 border border-blue-900/50 space-y-1 text-[11px] text-slate-300 animate-fadeIn">
                                                    <p className="font-bold text-white mb-1">
                                                        Mathematical Formulas & Criteria:
                                                    </p>
                                                    {msg.metricDefinitions.map((f, fIdx) => (
                                                        <div key={fIdx} className="font-mono text-cyan-200">
                                                            • {f}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Suggested Follow-ups */}
                                            {msg.suggestedFollowups && msg.suggestedFollowups.length > 0 && (
                                                <div className="pt-2">
                                                    <p className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                                                        Suggested Follow-ups
                                                    </p>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {msg.suggestedFollowups.map((sug, sIdx) => (
                                                            <button
                                                                key={sIdx}
                                                                onClick={() => handleSend(sug)}
                                                                className="text-xs bg-[#081124] hover:bg-purple-600/20 text-slate-300 hover:text-white border border-blue-900/50 hover:border-purple-500/50 px-3 py-1.5 rounded-full transition"
                                                            >
                                                                {sug}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}

                        {/* Animated Loading Indicator */}
                        {loading && (
                            <div className="flex items-start gap-3.5 pr-12 animate-pulse">
                                <div className="w-9 h-9 rounded-xl bg-purple-600/50 flex items-center justify-center text-white shrink-0">
                                    <Bot size={18} className="animate-spin" />
                                </div>
                                <div className="bg-[#0B1730] border border-blue-900/60 rounded-2xl rounded-tl-sm px-5 py-4 max-w-md shadow-xl flex items-center gap-3">
                                    <div className="flex space-x-1.5">
                                        <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                                        <div className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                                        <div className="w-2 h-2 rounded-full bg-pink-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                                    </div>
                                    <span className="text-xs font-medium text-slate-300">
                                        Querying database & calculating real metrics...
                                    </span>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>
                )}
            </main>

            {/* Bottom Input Console */}
            <footer className="shrink-0 bg-[#081124] border-t border-blue-900/60 p-4">
                <div className="max-w-4xl mx-auto">
                    <div className="relative bg-[#0B1730] border border-blue-900/80 rounded-2xl p-2 shadow-2xl focus-within:border-purple-500/80 transition-colors">
                        <textarea
                            ref={textareaRef}
                            value={input}
                            onChange={handleTextareaInput}
                            onKeyDown={handleKeyDown}
                            placeholder="Ask any question about sales, products, customers, or inventory (e.g. 'What are my total sales and profit?')..."
                            rows={1}
                            maxLength={500}
                            disabled={loading}
                            className="w-full bg-transparent text-sm text-white placeholder-slate-400 resize-none px-3 py-1.5 focus:outline-none max-h-32 leading-relaxed"
                        />

                        <div className="flex items-center justify-between px-2 pt-1 border-t border-blue-900/30 text-xs">
                            <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                                <span>Press <kbd className="px-1.5 py-0.5 bg-[#040816] rounded border border-slate-700 font-mono text-[10px]">Enter</kbd> to send</span>
                                <span><kbd className="px-1.5 py-0.5 bg-[#040816] rounded border border-slate-700 font-mono text-[10px]">Shift+Enter</kbd> for new line</span>
                            </div>

                            <div className="flex items-center gap-3">
                                <span className="text-[10px] text-slate-400">
                                    {input.length}/500
                                </span>
                                <button
                                    onClick={() => handleSend()}
                                    disabled={!input.trim() || loading}
                                    className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold transition shadow-lg ${
                                        !input.trim() || loading
                                            ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                                            : "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-900/40"
                                    }`}
                                >
                                    <span>Send</span>
                                    <Send size={13} />
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="text-center mt-2">
                        <p className="text-[10px] text-slate-400">
                            Vanira Spark Chatbot queries your PostgreSQL database deterministically • Sensitive customer PII is never exposed
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
