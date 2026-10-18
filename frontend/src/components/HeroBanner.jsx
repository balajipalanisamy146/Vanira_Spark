import { motion } from "framer-motion";

export default function HeroBanner() {

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        borderRadius: "16px",
        marginBottom: "24px",
        /* Clean hero background image uploaded by user */
        background: "url('/hero-illustration.jpg') center / cover no-repeat",
        minHeight: "200px",
        padding: "26px 32px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.25)",
      }}
    >
      {/* ─── TOP LEFT: GREETING, TITLE, SUBTITLE ─── */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        style={{ maxWidth: "500px", zIndex: 2 }}
      >
        {/* Greeting */}
        <p
          style={{
            fontSize: "14px",
            color: "rgba(255, 255, 255, 0.9)",
            marginBottom: "4px",
            fontWeight: 500,
            letterSpacing: "0.01em",
          }}
        >
          {greeting()} 👋
        </p>

        {/* Title */}
        <h1
          style={{
            fontSize: "27px",
            fontWeight: 800,
            color: "#ffffff",
            lineHeight: 1.2,
            marginBottom: "8px",
            letterSpacing: "-0.02em",
          }}
        >
          Welcome to{" "}
          <span
            style={{
              background: "linear-gradient(90deg, #e879f9 0%, #a855f7 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Vanira Spark
          </span>
        </h1>

        {/* Subtitle */}
        <p
          style={{
            fontSize: "13px",
            color: "rgba(255, 255, 255, 0.75)",
            lineHeight: 1.5,
            fontWeight: 400,
            margin: 0,
          }}
        >
          Your smart e-commerce &amp; sales analytics platform for
          <br />
          better decisions and sustainable growth.
        </p>
      </motion.div>

      {/* ─── BOTTOM ROW: 3 GLASSMORPHISM ACTION BUTTONS ─── */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        style={{
          display: "flex",
          gap: "12px",
          alignItems: "center",
          zIndex: 2,
          marginTop: "20px",
        }}
      >
        {/* Button 1 – Live Sales Dashboard */}
        <motion.button
          whileHover={{ scale: 1.04, background: "rgba(255, 255, 255, 0.2)" }}
          whileTap={{ scale: 0.96 }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "9px 16px",
            borderRadius: "10px",
            background: "rgba(255, 255, 255, 0.11)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(255, 255, 255, 0.22)",
            color: "#ffffff",
            fontSize: "12.5px",
            fontWeight: 600,
            cursor: "pointer",
            whiteSpace: "nowrap",
            boxShadow: "0 4px 16px rgba(0, 0, 0, 0.15)",
          }}
        >
          <span
            style={{
              width: "22px",
              height: "22px",
              borderRadius: "6px",
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "12px",
              flexShrink: 0,
            }}
          >
            📊
          </span>
          Live Sales Dashboard
        </motion.button>

        {/* Button 2 – AI Recommendations */}
        <motion.button
          whileHover={{ scale: 1.04, background: "rgba(255, 255, 255, 0.2)" }}
          whileTap={{ scale: 0.96 }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "9px 16px",
            borderRadius: "10px",
            background: "rgba(255, 255, 255, 0.11)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(255, 255, 255, 0.22)",
            color: "#ffffff",
            fontSize: "12.5px",
            fontWeight: 600,
            cursor: "pointer",
            whiteSpace: "nowrap",
            boxShadow: "0 4px 16px rgba(0, 0, 0, 0.15)",
          }}
        >
          <span
            style={{
              width: "22px",
              height: "22px",
              borderRadius: "6px",
              background: "linear-gradient(135deg, #06b6d4, #3b82f6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "12px",
              flexShrink: 0,
            }}
          >
            🤖
          </span>
          AI Recommendations
        </motion.button>

        {/* Button 3 – Forecasting & Insights */}
        <motion.button
          whileHover={{ scale: 1.04, background: "rgba(255, 255, 255, 0.2)" }}
          whileTap={{ scale: 0.96 }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "9px 16px",
            borderRadius: "10px",
            background: "rgba(255, 255, 255, 0.11)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(255, 255, 255, 0.22)",
            color: "#ffffff",
            fontSize: "12.5px",
            fontWeight: 600,
            cursor: "pointer",
            whiteSpace: "nowrap",
            boxShadow: "0 4px 16px rgba(0, 0, 0, 0.15)",
          }}
        >
          <span
            style={{
              width: "22px",
              height: "22px",
              borderRadius: "6px",
              background: "linear-gradient(135deg, #10b981, #06b6d4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "12px",
              flexShrink: 0,
            }}
          >
            📈
          </span>
          Forecasting &amp; Insights
        </motion.button>
      </motion.div>

      {/* ─── TOP RIGHT: FLOATING BADGE (LIGHTBULB ICON + TEXT) ─── */}
      <motion.div
        animate={{ y: [0, -4, 0] }}
        transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut" }}
        style={{
          position: "absolute",
          top: "18px",
          right: "24px",
          zIndex: 3,
          background: "rgba(20, 10, 50, 0.55)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(139, 92, 246, 0.4)",
          borderRadius: "12px",
          padding: "7px 14px",
          display: "flex",
          alignItems: "center",
          gap: "9px",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
        }}
      >
        <div
          style={{
            width: "26px",
            height: "26px",
            borderRadius: "8px",
            background: "linear-gradient(135deg, #f59e0b, #f97316)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "14px",
            flexShrink: 0,
            boxShadow: "0 2px 8px rgba(245, 158, 11, 0.45)",
          }}
        >
          💡
        </div>
        <div>
          <div
            style={{
              fontSize: "11px",
              fontWeight: 700,
              color: "#ffffff",
              lineHeight: 1.25,
            }}
          >
            Smarter Commerce
          </div>
          <div
            style={{
              fontSize: "11px",
              fontWeight: 700,
              color: "#ffffff",
              lineHeight: 1.25,
            }}
          >
            Bigger Growth
          </div>
        </div>
      </motion.div>
    </div>
  );
}