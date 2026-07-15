import React, { useState, useEffect, useRef, useContext } from "react";
import API from "../api";
import { io } from "socket.io-client";
import { ThemeContext } from "../App";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

// Speech Recognition compatibility
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

// Modern theme-aware styles using CSS variables from index.css
const s = {
  app: {
    minHeight: "100vh",
    background: "var(--bg-color)",
    color: "var(--text-color)",
    display: "flex",
    flexDirection: "column",
    transition: "all 0.3s ease",
  },
  nav: {
    background: "var(--nav-bg)",
    backdropFilter: "blur(12px)",
    borderBottom: "1px solid var(--border-color)",
    padding: "0 32px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    height: "70px",
    position: "sticky",
    top: 0,
    zIndex: 100,
  },
  logoSection: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  navTitle: {
    fontSize: "18px",
    fontWeight: "800",
    background: "linear-gradient(to right, #60a5fa, #c084fc)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    letterSpacing: "-0.5px",
  },
  navRight: { display: "flex", alignItems: "center", gap: "16px" },
  liveTag: {
    padding: "6px 14px",
    borderRadius: "30px",
    fontSize: "11px",
    fontWeight: "700",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    boxShadow: "0 0 10px currentColor",
  },
  logoutBtn: {
    background: "var(--danger-bg)",
    border: "1px solid var(--danger-text)",
    color: "var(--danger-text)",
    padding: "8px 18px",
    borderRadius: "10px",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "600",
    transition: "all 0.2s",
  },
  themeToggle: {
    background: "var(--card-bg)",
    border: "1px solid var(--border-color)",
    color: "var(--text-color)",
    borderRadius: "10px",
    width: "38px",
    height: "38px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    fontSize: "16px",
    transition: "all 0.2s",
  },
  notifBtn: {
    background: "var(--card-bg)",
    border: "1px solid var(--border-color)",
    color: "var(--text-color)",
    borderRadius: "10px",
    width: "38px",
    height: "38px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    fontSize: "16px",
    position: "relative",
    transition: "all 0.2s",
  },
  notifBadge: {
    position: "absolute",
    top: "-4px",
    right: "-4px",
    background: "#ef4444",
    color: "#fff",
    borderRadius: "50%",
    width: "18px",
    height: "18px",
    fontSize: "10px",
    fontWeight: "700",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 0 6px rgba(239, 68, 68, 0.4)",
  },
  notifDropdown: {
    position: "absolute",
    top: "48px",
    right: "0",
    width: "320px",
    maxHeight: "400px",
    borderRadius: "14px",
    background: "var(--card-bg)",
    backdropFilter: "blur(20px)",
    border: "1px solid var(--border-color)",
    boxShadow: "var(--shadow)",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    zIndex: 9999,
  },
  main: {
    padding: "32px",
    maxWidth: "1400px",
    margin: "0 auto",
    width: "100%",
    flex: 1,
  },
  headerBanner: {
    background: "var(--card-bg)",
    border: "1px solid var(--border-color)",
    borderRadius: "16px",
    padding: "24px 32px",
    marginBottom: "32px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    boxShadow: "var(--shadow)",
  },
  bannerLeft: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  bannerTitle: { fontSize: "22px", fontWeight: "800", color: "var(--text-color)" },
  bannerSub: { fontSize: "14px", color: "var(--text-muted)" },
  tabRow: {
    display: "flex",
    gap: "12px",
    marginBottom: "32px",
    borderBottom: "1px solid var(--border-color)",
    paddingBottom: "12px",
  },
  tab: {
    padding: "10px 20px",
    borderRadius: "10px",
    border: "1px solid transparent",
    background: "transparent",
    color: "var(--text-muted)",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "600",
    transition: "all 0.2s",
  },
  tabActive: {
    padding: "10px 20px",
    borderRadius: "10px",
    border: "1px solid #3b82f6",
    background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
    color: "#fff",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "600",
    boxShadow: "0 4px 14px rgba(37, 99, 235, 0.4)",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "20px",
    marginBottom: "32px",
  },
  card: {
    background: "var(--card-bg)",
    borderRadius: "16px",
    padding: "24px",
    border: "1px solid var(--border-color)",
    boxShadow: "var(--shadow)",
  },
  cardIcon: {
    fontSize: "24px",
    marginBottom: "12px",
  },
  cardLabel: {
    fontSize: "12px",
    color: "var(--text-muted)",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  cardValue: { fontSize: "36px", fontWeight: "800", margin: "6px 0 2px 0" },
  cardSub: { fontSize: "13px", color: "var(--text-muted)" },
  row: {
    display: "grid",
    gridTemplateColumns: "1.6fr 0.9fr",
    gap: "24px",
    alignItems: "start",
  },
  sectionTitle: {
    fontSize: "16px",
    fontWeight: "800",
    color: "var(--text-color)",
    marginBottom: "20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  liveItem: {
    display: "grid",
    gridTemplateColumns: "1.4fr 1fr 1fr 1fr",
    alignItems: "center",
    padding: "14px 16px",
    borderBottom: "1px solid var(--border-color)",
    fontSize: "14px",
    background: "rgba(15, 23, 42, 0.1)",
    borderRadius: "8px",
    marginBottom: "6px",
  },
  deviceId: { color: "#38bdf8", fontFamily: "monospace", fontWeight: "600" },
  value: { color: "var(--text-color)", fontWeight: "700" },
  alertItem: {
    padding: "16px 20px",
    borderRadius: "12px",
    marginBottom: "12px",
    fontSize: "14px",
    border: "1px solid var(--border-color)",
    boxShadow: "var(--shadow)",
    background: "var(--card-bg)",
  },
  badge: {
    display: "inline-block",
    padding: "4px 10px",
    borderRadius: "20px",
    fontSize: "11px",
    fontWeight: "700",
    textTransform: "uppercase",
  },
  roomCard: {
    background: "var(--card-bg)",
    borderRadius: "12px",
    padding: "16px 20px",
    marginBottom: "10px",
    border: "1px solid var(--border-color)",
    fontSize: "14px",
  },
  btnAction: {
    background: "rgba(59, 130, 246, 0.1)",
    border: "1px solid #3b82f6",
    color: "#60a5fa",
    padding: "6px 14px",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "600",
    transition: "all 0.2s",
  },
  chartContainer: {
    background: "var(--card-bg)",
    border: "1px solid var(--border-color)",
    borderRadius: "16px",
    padding: "24px",
    marginBottom: "32px",
    boxShadow: "var(--shadow)",
  },
  // Empty states
  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "64px 32px",
    textAlign: "center",
    background: "var(--card-bg)",
    borderRadius: "16px",
    border: "1.5px dashed var(--border-color)",
  },
  emptyIcon: {
    fontSize: "48px",
    marginBottom: "16px",
  },
  emptyTitle: {
    fontSize: "18px",
    fontWeight: "700",
    color: "var(--text-color)",
    marginBottom: "8px",
  },
  emptyDesc: {
    fontSize: "14px",
    color: "var(--text-muted)",
    maxWidth: "400px",
  },
  // Chatbot floating UI styles
  chatbotFab: {
    position: "fixed",
    bottom: "24px",
    right: "24px",
    width: "60px",
    height: "60px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "26px",
    cursor: "pointer",
    boxShadow: "0 10px 25px rgba(79, 70, 229, 0.4)",
    zIndex: 1000,
    transition: "transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
  },
  chatbotWindow: {
    position: "fixed",
    bottom: "96px",
    right: "24px",
    width: "360px",
    height: "500px",
    borderRadius: "20px",
    background: "var(--card-bg)",
    backdropFilter: "blur(20px)",
    border: "1px solid var(--border-color)",
    boxShadow: "var(--shadow)",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    zIndex: 1000,
    animation: "fadeIn 0.3s ease-out",
  },
  chatbotHeader: {
    padding: "16px",
    background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
    color: "#fff",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
  },
  chatbotHeaderTitle: {
    fontSize: "14px",
    fontWeight: "700",
  },
  chatbotHeaderSub: {
    fontSize: "11px",
    opacity: 0.8,
  },
  chatbotMessages: {
    flex: 1,
    padding: "16px",
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  chatMessage: {
    maxWidth: "85%",
    padding: "10px 14px",
    borderRadius: "14px",
    fontSize: "13px",
    lineHeight: "1.4",
    whiteSpace: "pre-line",
  },
  userMessage: {
    alignSelf: "flex-end",
    background: "#2563eb",
    color: "#fff",
    borderBottomRightRadius: "2px",
  },
  botMessage: {
    alignSelf: "flex-start",
    background: "rgba(100, 116, 139, 0.15)",
    color: "var(--text-color)",
    borderBottomLeftRadius: "2px",
    border: "1px solid var(--border-color)",
  },
  chatbotInputArea: {
    padding: "12px 16px",
    borderTop: "1px solid var(--border-color)",
    display: "flex",
    gap: "8px",
    background: "rgba(15, 23, 42, 0.1)",
  },
  chatbotInput: {
    flex: 1,
    background: "var(--bg-color)",
    border: "1px solid var(--border-color)",
    borderRadius: "10px",
    padding: "10px 14px",
    color: "var(--text-color)",
    fontSize: "13px",
    outline: "none",
  },
  chatbotSendBtn: {
    background: "#2563eb",
    border: "none",
    color: "#fff",
    borderRadius: "10px",
    padding: "0 18px",
    fontWeight: "700",
    fontSize: "13px",
    cursor: "pointer",
  },
};

// SKELETON COMPONENT FOR CARDS
function SkeletonCard() {
  return (
    <div style={{ ...s.card, height: "135px" }} className="skeleton">
      <div style={{ width: "36px", height: "36px", borderRadius: "50%", marginBottom: "12px" }} className="skeleton-text" />
      <div style={{ width: "50%", height: "12px", marginBottom: "8px" }} className="skeleton-text" />
      <div style={{ width: "70%", height: "24px" }} className="skeleton-text" />
    </div>
  );
}

// SKELETON COMPONENT FOR LISTS
function SkeletonRow() {
  return (
    <div style={{ display: "flex", gap: "16px", padding: "16px", borderBottom: "1px solid var(--border-color)" }} className="skeleton">
      <div style={{ width: "30%", height: "14px" }} className="skeleton-text" />
      <div style={{ width: "20%", height: "14px" }} className="skeleton-text" />
      <div style={{ width: "25%", height: "14px" }} className="skeleton-text" />
      <div style={{ width: "15%", height: "14px", marginLeft: "auto" }} className="skeleton-text" />
    </div>
  );
}

// STAT CARD WITH DYNAMIC SEVERITY COLORS
function StatCard({ label, value, sub, icon, color = "#3b82f6" }) {
  return (
    <div style={s.card} className="hover-scale fade-in">
      <div style={s.cardIcon}>{icon}</div>
      <div style={s.cardLabel}>{label}</div>
      <div style={{ ...s.cardValue, color }}>{value}</div>
      {sub && <div style={s.cardSub}>{sub}</div>}
    </div>
  );
}

// ALERTS COLORS SEVERITY
function getSeverityStyle(severity) {
  const map = {
    Critical: { background: "rgba(239, 68, 68, 0.15)", color: "#ef4444", borderColor: "#ef4444" },
    High:     { background: "rgba(249, 115, 22, 0.15)", color: "#f97316", borderColor: "#f97316" },
    Medium:   { background: "rgba(234, 179, 8, 0.15)", color: "#eab308", borderColor: "#eab308" },
    Low:      { background: "rgba(16, 185, 129, 0.15)", color: "#10b981", borderColor: "#10b981" },
  };
  return map[severity] || map.Low;
}

// SVG GAUGE SPEEDOMETER FOR CURRENT POWER
function SpeedometerGauge({ value }) {
  const limit = 10.0;
  const numVal = parseFloat(value) || 0;
  const percentage = Math.min((numVal / limit) * 100, 100);
  
  // needle rotates from -90 to +90 deg
  const rotation = (percentage / 100) * 180 - 90;
  
  let gaugeColor = "#3b82f6"; // Blue
  if (percentage > 80) gaugeColor = "#ef4444"; // Red
  else if (percentage > 50) gaugeColor = "#f97316"; // Orange

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
      <div style={{ position: "relative", width: "160px", height: "90px" }}>
        <svg viewBox="0 0 120 70" style={{ width: "100%", height: "100%" }}>
          <defs>
            <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="60%" stopColor="#eab308" />
              <stop offset="100%" stopColor="#ef4444" />
            </linearGradient>
          </defs>
          
          <path
            d="M 20,60 A 40,40 0 0,1 100,60"
            fill="none"
            stroke="var(--border-color)"
            strokeWidth="8"
            strokeLinecap="round"
          />

          <path
            d="M 20,60 A 40,40 0 0,1 100,60"
            fill="none"
            stroke="url(#gaugeGrad)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray="125.6"
            strokeDashoffset={125.6 - (125.6 * percentage) / 100}
            transition="stroke-dashoffset 0.5s ease"
            style={{ opacity: 0.85 }}
          />

          <circle cx="60" cy="60" r="5" fill="var(--text-color)" />

          <line
            x1="60"
            y1="60"
            x2="60"
            y2="28"
            stroke={gaugeColor}
            strokeWidth="2.5"
            strokeLinecap="round"
            transform={`rotate(${rotation} 60 60)`}
            style={{ transition: "transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)" }}
          />
        </svg>
      </div>
      <div style={{ textAlign: "center", marginTop: "-10px" }}>
        <div style={{ fontSize: "20px", fontWeight: "800", color: gaugeColor }}>
          {numVal.toFixed(2)} kWh
        </div>
        <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
          Threshold Limit: {limit} kWh
        </div>
      </div>
    </div>
  );
}

// SENSOR NETWORK TOPOLOGY MAP
function SensorNetworkMap() {
  const hubs = [
    { id: 1, x: 150, y: 80, label: "Floor 1 Hub" },
    { id: 2, x: 150, y: 220, label: "Floor 2 Hub" },
    { id: 3, x: 450, y: 150, label: "Floor 3 Hub" },
  ];
  
  const leaves = [
    { x: 70, y: 50, label: "R-101 Energy", hubId: 1, status: "active" },
    { x: 80, y: 110, label: "R-102 Door", hubId: 1, status: "active" },
    { x: 70, y: 250, label: "R-201 Motion", hubId: 2, status: "active" },
    { x: 80, y: 190, label: "R-202 Temp", hubId: 2, status: "degraded" },
    { x: 520, y: 100, label: "R-301 Plug", hubId: 3, status: "active" },
    { x: 530, y: 200, label: "R-302 Motion", hubId: 3, status: "offline" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      <div style={{ display: "flex", justifyContent: "center", background: "rgba(15,23,42,0.2)", borderRadius: "12px", padding: "10px" }}>
        <svg viewBox="0 0 600 300" style={{ width: "100%", maxHeight: "250px" }}>
          {/* Server to Hubs */}
          {hubs.map((hub) => (
            <line
              key={`line-hub-${hub.id}`}
              x1={300}
              y1={150}
              x2={hub.x}
              y2={hub.y}
              stroke="rgba(96, 165, 250, 0.4)"
              strokeWidth="2.5"
              strokeDasharray="5,5"
            />
          ))}

          {/* Hubs to Leaves */}
          {leaves.map((leaf, idx) => {
            const parentHub = hubs.find((h) => h.id === leaf.hubId);
            return (
              <line
                key={`line-leaf-${idx}`}
                x1={parentHub.x}
                y1={parentHub.y}
                x2={leaf.x}
                y2={leaf.y}
                stroke={
                  leaf.status === "active"
                    ? "rgba(16, 185, 129, 0.4)"
                    : leaf.status === "degraded"
                    ? "rgba(234, 179, 8, 0.4)"
                    : "rgba(239, 68, 68, 0.4)"
                }
                strokeWidth="1.5"
              />
            );
          })}

          {/* Server Node */}
          <circle cx={300} cy={150} r="22" fill="#3b82f6" style={{ filter: "drop-shadow(0 0 8px rgba(59,130,246,0.6))" }} />
          <text x={300} y={155} textAnchor="middle" fill="#fff" fontSize="9" fontWeight="bold">GATEWAY</text>

          {/* Hubs */}
          {hubs.map((hub) => (
            <g key={`hub-${hub.id}`}>
              <circle cx={hub.x} cy={hub.y} r="15" fill="rgba(96, 165, 250, 0.8)" style={{ filter: "drop-shadow(0 0 6px rgba(96,165,250,0.4))" }} />
              <text x={hub.x} y={hub.y + 4} textAnchor="middle" fill="#fff" fontSize="8" fontWeight="bold">F-{hub.id}</text>
            </g>
          ))}

          {/* Leaves */}
          {leaves.map((leaf, idx) => {
            const fill = leaf.status === "active" ? "#10b981" : leaf.status === "degraded" ? "#eab308" : "#ef4444";
            const glow = leaf.status === "active" ? "rgba(16,185,129,0.5)" : leaf.status === "degraded" ? "rgba(234,179,8,0.5)" : "rgba(239,68,68,0.5)";
            return (
              <g key={`leaf-${idx}`}>
                <circle cx={leaf.x} cy={leaf.y} r="6" fill={fill} style={{ filter: `drop-shadow(0 0 4px ${glow})` }} />
                <text x={leaf.x} y={leaf.y - 10} textAnchor="middle" fill="var(--text-muted)" fontSize="8">{leaf.label}</text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

// INTERACTIVE FLOOR ENERGY HEATMAP
function EnergyHeatmap({ rooms, liveData }) {
  const floors = [...new Set(rooms.map((r) => r.floor))].sort((a, b) => b - a);

  const getRoomEnergyValue = (roomId) => {
    const liveVal = liveData.find((r) => r.room_id === roomId && r.type === "energy");
    if (liveVal) return parseFloat(liveVal.value);
    return 0;
  };

  const getIntensityColor = (val) => {
    if (val === 0) return "var(--border-color)";
    if (val < 2.0) return "rgba(59, 130, 246, 0.2)";
    if (val < 5.0) return "rgba(59, 130, 246, 0.5)";
    if (val < 8.0) return "rgba(37, 99, 235, 0.85)";
    return "#1d4ed8";
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {floors.map((floor) => {
        const floorRooms = rooms.filter((r) => r.floor === floor);
        return (
          <div key={floor} style={{ display: "flex", alignItems: "center", gap: "16px", paddingBottom: "12px", borderBottom: "1px solid var(--border-color)" }}>
            <div style={{ width: "60px", fontSize: "13px", fontWeight: "700", color: "var(--text-muted)" }}>
              FLOOR {floor}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", flex: 1 }}>
              {floorRooms.map((room) => {
                const energyVal = getRoomEnergyValue(room.id);
                const bg = getIntensityColor(energyVal);
                
                return (
                  <div
                    key={room.id}
                    style={{
                      background: bg,
                      border: "1px solid var(--border-color)",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      fontSize: "12px",
                      fontWeight: "700",
                      color: energyVal > 0 ? "#fff" : "var(--text-muted)",
                      minWidth: "60px",
                      textAlign: "center",
                      cursor: "help",
                      boxShadow: energyVal > 6 ? "0 0 8px rgba(59,130,246,0.3)" : "none",
                    }}
                    title={`Room ${room.room_number}: ${energyVal.toFixed(2)} kWh`}
                  >
                    R-    {room.room_number}
                    <div style={{ fontSize: "9px", fontWeight: "600", opacity: 0.8, marginTop: "2px" }}>
                      {energyVal > 0 ? `${energyVal.toFixed(1)} kWh` : "idle"}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
      
      {/* Legend */}
      <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", fontSize: "11px", color: "var(--text-muted)", marginTop: "8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ width: "12px", height: "12px", borderRadius: "3px", background: "var(--border-color)", display: "inline-block" }}></span>
          <span>Idle (0)</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ width: "12px", height: "12px", borderRadius: "3px", background: "rgba(59, 130, 246, 0.2)", display: "inline-block" }}></span>
          <span>Low (&lt;2 kWh)</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ width: "12px", height: "12px", borderRadius: "3px", background: "rgba(59, 130, 246, 0.5)", display: "inline-block" }}></span>
          <span>Medium (2-5 kWh)</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ width: "12px", height: "12px", borderRadius: "3px", background: "rgba(37, 99, 235, 0.85)", display: "inline-block" }}></span>
          <span>High (5-8 kWh)</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ width: "12px", height: "12px", borderRadius: "3px", background: "#1d4ed8", display: "inline-block" }}></span>
          <span>Peak (&gt;8 kWh)</span>
        </div>
      </div>
    </div>
  );
}

// CHRONOLOGICAL SECURITY EVENTS FEED
function SecurityTimeline({ alerts, onResolve, isReadOnly }) {
  const getAlertIcon = (type) => {
    switch (type) {
      case "night_motion": return "🚶";
      case "unauthorized_entry": return "🚪";
      case "door_forced": return "🔨";
      case "energy_spike": return "⚡";
      default: return "🚨";
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {alerts.map((a, i) => {
        const style = getSeverityStyle(a.severity);
        return (
          <div
            key={a._id || a.event_id || i}
            style={{
              display: "flex",
              gap: "16px",
              padding: "16px",
              background: "var(--card-bg)",
              border: `1px solid ${style.borderColor}`,
              borderRadius: "12px",
              position: "relative",
              alignItems: "flex-start",
              boxShadow: "var(--shadow)",
            }}
          >
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                background: style.background,
                color: style.color,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "18px",
                flexShrink: 0,
              }}
            >
              {getAlertIcon(a.event_type)}
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                <span style={{ fontWeight: "700", fontSize: "14px", color: "var(--text-color)" }}>
                  {a.event_type?.replace(/_/g, " ").toUpperCase()}
                </span>
                <span style={{ ...s.badge, background: style.background, color: style.color, border: `1px solid ${style.borderColor}` }}>
                  {a.severity}
                </span>
              </div>
              <div style={{ color: "var(--text-muted)", fontSize: "13px", marginTop: "4px" }}>
                {a.description}
              </div>
              <div style={{ color: "var(--text-muted)", fontSize: "11px", marginTop: "6px", display: "flex", gap: "12px" }}>
                <span>📍 Room: {a.room_id}</span>
                <span>📡 Node ID: {a.device_id}</span>
                <span>🕒 {new Date(a.timestamp || a.createdAt).toLocaleTimeString()}</span>
              </div>
            </div>

            {!isReadOnly && (
              <button
                onClick={() => onResolve(a._id || a.event_id)}
                style={{
                  background: "var(--success-bg)",
                  border: "1px solid var(--success-text)",
                  color: "var(--success-text)",
                  padding: "6px 12px",
                  borderRadius: "8px",
                  fontWeight: "700",
                  cursor: "pointer",
                  fontSize: "11px",
                  alignSelf: "center",
                  boxShadow: "0 2px 6px rgba(16, 185, 129, 0.1)",
                }}
              >
                RESOLVE
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

// MAIN DASHBOARD COMPONENT
export default function Dashboard({ user, onLogout }) {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const [tab, setTab] = useState("overview");

  // Core Data States
  const [overview, setOverview] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [liveData, setLiveData] = useState([]);
  const [deviceHealthList, setDeviceHealthList] = useState([]);
  
  // Connection & Loading States
  const [connected, setConnected] = useState(false);
  const [isLoadingOverview, setIsLoadingOverview] = useState(true);
  const [isLoadingRooms, setIsLoadingRooms] = useState(true);
  const [isLoadingAlerts, setIsLoadingAlerts] = useState(true);
  const [isLoadingDevices, setIsLoadingDevices] = useState(true);

  // Notification Bell States
  const [notifications, setNotifications] = useState([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  // Chatbot Widget States
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Voice Web Speech States
  const [isMuted, setIsMuted] = useState(true); // default muted
  const [isListening, setIsListening] = useState(false);
  const [floorFilter, setFloorFilter] = useState(null);

  // IoT Visual/Interaction States
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [lastActiveDevice, setLastActiveDevice] = useState(null);
  const [isNightModeHours, setIsNightModeHours] = useState(false);
  const [overviewSubTab, setOverviewSubTab] = useState("floormap");

  // Admin Controls States
  const [auditLogs, setAuditLogs] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [powerThreshold, setPowerThreshold] = useState(8.0);
  const [isSendingDigest, setIsSendingDigest] = useState(false);
  const [isRevokingSession, setIsRevokingSession] = useState(null);

  const socketRef = useRef(null);
  const chatBottomRef = useRef(null);
  const recognitionRef = useRef(null);
  const powerThresholdRef = useRef(powerThreshold);
  const pulseTimeoutRef = useRef(null);

  // Derive Warden constraints
  const wardenFloor = user?.role === "Warden" 
    ? (user?.email?.match(/\d+/) ? parseInt(user.email.match(/\d+/)[0]) : 1)
    : null;

  // Read-only indicator for Viewers
  const isReadOnly = user?.role === "Viewer";

  // Notification helper
  const addNotification = (title, text, type = "info") => {
    const id = Date.now() + Math.random().toString();
    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setNotifications((prev) => [
      { id, title, text, type, time, read: false },
      ...prev
    ].slice(0, 50));
  };

  const markAsRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const clearAllNotifs = () => {
    setNotifications([]);
    setIsNotifOpen(false);
  };

  const unreadNotifCount = notifications.filter((n) => !n.read).length;

  // Initialize SpeechRecognition
  useEffect(() => {
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = "en-US";
      
      rec.onstart = () => setIsListening(true);
      rec.onresult = (e) => {
        const transcript = e.results[0][0].transcript;
        setChatInput(transcript);
      };
      rec.onerror = (e) => {
        console.error("Speech recognition error:", e.error);
        setIsListening(false);
      };
      rec.onend = () => setIsListening(false);
      
      recognitionRef.current = rec;
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      addNotification("🔇 Microphone Error", "Voice speech recognition is not supported in this browser.", "error");
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  // Text to Speech
  const speakResponse = (text) => {
    if (isMuted) return;
    const synth = window.speechSynthesis;
    if (synth) {
      synth.cancel();
      const cleanText = text.replace(/[^a-zA-Z0-9\s.,!?]/g, ""); // clean emojis
      const spokenSummary = cleanText.split("\n")[0].slice(0, 100); // speak short summary first
      const utterance = new SpeechSynthesisUtterance(spokenSummary);
      synth.speak(utterance);
    }
  };

  // Fetch overview counts
  const fetchOverview = async () => {
    if (!overview) setIsLoadingOverview(true);
    try {
      const res = await API.get("/dashboard/overview");
      setOverview(res.data.data);
    } catch (err) {
      console.error("Overview fetch failed:", err.message);
    } finally {
      setIsLoadingOverview(false);
    }
  };

  // Fetch rooms list
  const fetchRooms = async () => {
    if (rooms.length === 0) setIsLoadingRooms(true);
    try {
      const res = await API.get("/rooms");
      setRooms(res.data.data || []);
    } catch (err) {
      console.error("Rooms fetch failed:", err.message);
    } finally {
      setIsLoadingRooms(false);
    }
  };

  // Fetch unresolved security alerts
  const fetchAlerts = async () => {
    if (alerts.length === 0) setIsLoadingAlerts(true);
    try {
      const res = await API.get("/security/unresolved");
      setAlerts(res.data.data?.events || []);
    } catch (err) {
      console.error("Alerts fetch failed:", err.message);
    } finally {
      setIsLoadingAlerts(false);
    }
  };

  // Fetch device list and health status
  const fetchDeviceHealth = async () => {
    if (deviceHealthList.length === 0) setIsLoadingDevices(true);
    try {
      const res = await API.get("/dashboard/device-health");
      setDeviceHealthList(res.data.data?.devices || []);
    } catch (err) {
      console.error("Device health fetch failed:", err.message);
    } finally {
      setIsLoadingDevices(false);
    }
  };

  // Fetch Admin Specific Tables (Sessions, Audit Logs)
  const fetchAdminData = async () => {
    if (user?.role !== "Admin") return;
    try {
      const logsRes = await API.get("/analytics/audit-logs");
      setAuditLogs(logsRes.data.data || []);
      const sessRes = await API.get("/auth/sessions");
      setSessions(sessRes.data.data || []);
    } catch (err) {
      console.error("Admin data fetch failed:", err.message);
    }
  };

  // Terminate User Session (Force Logout)
  const handleTerminateSession = async (id) => {
    try {
      setIsRevokingSession(id);
      await API.post(`/auth/sessions/${id}/terminate`);
      addNotification("🛡️ Session Revoked", "Active user login session has been invalidated.", "success");
      fetchAdminData();
    } catch (err) {
      console.error("Revocation failed:", err.message);
      addNotification("❌ Action Failed", "Could not revoke active session.", "error");
    } finally {
      setIsRevokingSession(null);
    }
  };

  // Dispatch email report digest
  const handleSendEmailDigest = async () => {
    try {
      setIsSendingDigest(true);
      const res = await API.post("/analytics/email-digest");
      addNotification("📧 Digest Sent", res.data?.data?.message || "Weekly report dispatched successfully!", "success");
      fetchAdminData();
    } catch (err) {
      console.error("Email report failed:", err.message);
      addNotification("❌ Delivery Failed", "Nodemailer could not dispatch the digest.", "error");
    } finally {
      setIsSendingDigest(false);
    }
  };

  // Resolve security alert
  const handleResolveAlert = async (id) => {
    if (isReadOnly) return;
    try {
      await API.put(`/security/events/${id}/resolve`);
      addNotification("✅ Incident Resolved", "Incident successfully resolved and closed.", "success");
      fetchAlerts();
      fetchOverview();
      fetchAdminData();
    } catch (err) {
      console.error("Resolve failed:", err.message);
      addNotification("❌ Action Failed", "Could not resolve security alert.", "error");
    }
  };

  // Export Analytics CSV
  const handleExportCSV = async () => {
    try {
      const response = await API.get("/analytics/export/monthly", { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `energy_report_${new Date().toISOString().split("T")[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      addNotification("📥 Report Exported", "Monthly Analytics CSV report has been downloaded.", "success");
      fetchAdminData();
    } catch (err) {
      console.error("CSV Export failed:", err.message);
      addNotification("❌ Export Failed", "CSV Export failed", "error");
    }
  };

  // Chatbot Send Message with Voice output & Action execution
  const handleSendChatMessage = async (e) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() || isChatLoading) return;

    const queryText = chatInput.trim();
    setChatInput("");

    const userMsgId = Date.now().toString();
    setChatMessages((prev) => [...prev, { id: userMsgId, sender: "user", text: queryText }]);
    setIsChatLoading(true);

    try {
      const res = await API.post("/chatbot", { query: queryText });
      const botResponse = res.data?.data?.response || "I didn't receive a valid response. Please try again.";
      const resIntent = res.data?.data?.intent;
      const resTarget = res.data?.data?.target;

      setChatMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), sender: "bot", text: botResponse }
      ]);

      // Speak spoken summary response
      speakResponse(botResponse);

      // Execute app actions based on intent
      if (resIntent === "navigate" && resTarget) {
        if (resTarget === "/docs") {
          window.open("/docs", "_blank");
        } else {
          setTab(resTarget);
        }
      } else if (resIntent === "filter" && resTarget) {
        setFloorFilter(parseInt(resTarget));
        setTab("overview");
      } else if (resIntent === "export" && resTarget) {
        if (resTarget === "csv") {
          handleExportCSV();
        } else if (resTarget === "pdf") {
          setTimeout(() => window.print(), 500);
        }
      }
    } catch (err) {
      console.error("Chatbot query failed:", err.message);
      setChatMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), sender: "bot", text: "❌ Connection to chatbot service failed. Please check backend server." }
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Set up connection to Socket.io and fetch APIs
  useEffect(() => {
    const socketHost = window.location.hostname === "localhost" 
      ? "http://localhost:5000" 
      : "https://smart-energy--security-monitoring.onrender.com";

    socketRef.current = io(socketHost);

    socketRef.current.on("connect", () => {
      setConnected(true);
      socketRef.current.emit("subscribe-alerts");
    });

    socketRef.current.on("disconnect", () => setConnected(false));

    socketRef.current.on("sensor-data", (data) => {
      setLiveData((prev) => [data, ...prev].slice(0, 30));
      
      // Live device pulse animation
      setLastActiveDevice(data.device_id);
      if (pulseTimeoutRef.current) clearTimeout(pulseTimeoutRef.current);
      pulseTimeoutRef.current = setTimeout(() => {
        setLastActiveDevice(null);
      }, 1000);

      if (data.type === "energy" && parseFloat(data.value) > powerThresholdRef.current) {
        addNotification(
          "⚡ Energy Warning",
          `Abnormal usage of ${data.value} kWh (limit ${powerThresholdRef.current}) detected in Room ${data.room_id}!`,
          "energy"
        );
      }
    });

    socketRef.current.on("security-alert", (data) => {
      setAlerts((prev) => [data, ...prev].slice(0, 30));
      addNotification(
        "🚨 Security Breach",
        `${data.description || data.event_type} in room ${data.room_id}`,
        "security"
      );
      fetchOverview();
    });

    socketRef.current.on("security-resolved", () => {
      fetchAlerts();
      fetchOverview();
    });

    fetchOverview();
    fetchRooms();
    fetchAlerts();
    fetchDeviceHealth();
    fetchAdminData();

    const interval = setInterval(() => {
      fetchOverview();
      fetchDeviceHealth();
      fetchAdminData();
    }, 30000);

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Welcome chatbot greeting
  useEffect(() => {
    if (user) {
      const scopeText = wardenFloor 
        ? `Floor ${wardenFloor} Warden Scope` 
        : user.role === "Viewer" 
          ? "Read-only Viewer Scope" 
          : "System Admin Scope";

      setChatMessages([
        {
          id: "welcome",
          sender: "bot",
          text: `👋 Hello! I am the Smart Monitor AI Assistant. I have loaded your workspace under **${scopeText}**.\n\nI can trigger actions based on your input:\n- "Go to security tab"\n- "Download report CSV"\n- "Print report PDF"\n- "Filter by floor 2"`
        }
      ]);
    }
  }, [user, wardenFloor]);

  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, isChatLoading]);

  // Ambient night hour shifting
  useEffect(() => {
    const checkNight = () => {
      const hour = new Date().getHours();
      setIsNightModeHours(hour >= 22 || hour < 6);
    };
    checkNight();
    const interval = setInterval(checkNight, 60000);
    return () => clearInterval(interval);
  }, []);

  const getRoomStatusColor = (room) => {
    const hasAlert = alerts.some(a => String(a.room_id) === String(room.id) || String(a.room_id) === String(room.room_number));
    if (hasAlert) return "rgba(239, 68, 68, 0.15)";
    const roomDevices = deviceHealthList.filter(d => String(d.room_id) === String(room.id) || String(d.room?.room_number) === String(room.room_number));
    const hasDegraded = roomDevices.some(d => d.health === "degraded");
    if (hasDegraded) return "rgba(234, 179, 8, 0.15)";
    return "rgba(16, 185, 129, 0.08)";
  };

  const getRoomStatusBorder = (room) => {
    const hasAlert = alerts.some(a => String(a.room_id) === String(room.id) || String(a.room_id) === String(room.room_number));
    if (hasAlert) return "#ef4444";
    const roomDevices = deviceHealthList.filter(d => String(d.room_id) === String(room.id) || String(d.room?.room_number) === String(room.room_number));
    const hasDegraded = roomDevices.some(d => d.health === "degraded");
    if (hasDegraded) return "#eab308";
    return "var(--border-color)";
  };

  const getRoomSensors = (roomId) => {
    const energy = liveData.find(d => d.room_id === roomId && d.type === "energy")?.value || 0;
    const motion = liveData.find(d => d.room_id === roomId && d.type === "motion")?.value;
    const door = liveData.find(d => d.room_id === roomId && d.type === "door")?.value;
    const temp = liveData.find(d => d.room_id === roomId && d.type === "temperature")?.value;
    return { energy, motion, door, temp };
  };

  const renderFloorPlan = () => {
    const floorsList = [3, 2, 1];
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {floorsList.map(floorNum => {
          const floorRooms = rooms.filter(r => parseInt(r.floor) === floorNum);
          return (
            <div key={floorNum} style={{ border: "1px solid var(--border-color)", borderRadius: "12px", padding: "16px", background: "rgba(15, 23, 42, 0.1)" }}>
              <div style={{ fontSize: "12px", fontWeight: "800", color: "var(--text-muted)", marginBottom: "12px", textTransform: "uppercase" }}>
                🏢 FLOOR {floorNum} LEVEL
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "12px" }} className="responsive-grid">
                {floorRooms.map(room => {
                  const statusBg = getRoomStatusColor(room);
                  const statusBorder = getRoomStatusBorder(room);
                  const sensors = getRoomSensors(room.id);
                  
                  return (
                    <div
                      key={room.id}
                      onClick={() => setSelectedRoom(room)}
                      style={{
                        background: statusBg,
                        border: `2px solid ${statusBorder}`,
                        borderRadius: "12px",
                        padding: "16px 12px",
                        textAlign: "center",
                        cursor: "pointer",
                        position: "relative",
                        transition: "all 0.2s ease-in-out",
                      }}
                      className="hover-scale"
                    >
                      <div style={{ fontWeight: "800", fontSize: "14px" }}>
                        R-{room.room_number}
                        {alerts.some(a => String(a.room_id) === String(room.id) || String(a.room_id) === String(room.room_number)) && (
                          <span style={{ position: "absolute", top: "4px", right: "4px", fontSize: "10px" }} title="Active Security Breach">🚨</span>
                        )}
                      </div>
                      <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>
                        {room.occupancy === "occupied" ? "👤 Occ" : "💤 Vac"}
                      </div>
                      
                      <div style={{ display: "flex", justifyContent: "center", gap: "6px", marginTop: "8px" }}>
                        <span style={{ fontSize: "12px", opacity: sensors.motion ? 1 : 0.2 }} title="Motion Sensor">🚶</span>
                        <span style={{ fontSize: "12px", opacity: sensors.door === "open" ? 1 : 0.2 }} title="Door Contact">🚪</span>
                        <span style={{ fontSize: "12px", opacity: sensors.energy > 0 ? 1 : 0.2 }} title="Smart Plug Energy">🔌</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Filter lists based on role and floorFilter state
  const activeFloor = wardenFloor || floorFilter;

  const filteredRooms = rooms.filter(
    (room) => !activeFloor || String(room.floor) === String(activeFloor)
  );

  const filteredDevices = deviceHealthList.filter(
    (device) => !activeFloor || String(device.room?.floor) === String(activeFloor)
  );

  const filteredAlerts = alerts.filter((alert) => {
    if (!activeFloor) return true;
    const room = rooms.find((r) => r.id === alert.room_id || String(r.room_number) === String(alert.room_id));
    return room && String(room.floor) === String(activeFloor);
  });

  const chartReadings = liveData
    .filter((r) => r.type === "energy" && (!activeFloor || String(rooms.find(rm => rm.id === r.room_id)?.floor) === String(activeFloor)))
    .map((r) => ({
      time: new Date(r.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      value: parseFloat(r.value),
      room: `Room ${r.room_id}`,
    }))
    .reverse();

  const latestEnergyVal = chartReadings.length > 0 
    ? chartReadings[chartReadings.length - 1].value 
    : 0;

  const totalDevicesCount = deviceHealthList.length;
  const activeDevicesCount = deviceHealthList.filter(d => d.status === "active" || d.health === "healthy").length;

  const renderDeviceHealthBadge = (health) => {
    switch (health) {
      case "healthy":
        return <span style={{ ...s.badge, background: "var(--success-bg)", color: "var(--success-text)", border: "1px solid var(--success-text)" }}>HEALTHY</span>;
      case "degraded":
        return <span style={{ ...s.badge, background: "var(--warning-bg)", color: "var(--warning-text)", border: "1px solid var(--warning-text)" }}>DEGRADED</span>;
      case "offline":
        return <span style={{ ...s.badge, background: "var(--danger-bg)", color: "var(--danger-text)", border: "1px solid var(--danger-text)" }}>OFFLINE</span>;
      default:
        return <span style={{ ...s.badge, background: "rgba(107, 114, 128, 0.15)", color: "#6b7280", border: "1px solid #6b7280" }}>UNKNOWN</span>;
    }
  };

  return (
    <div style={{ ...s.app, background: isNightModeHours ? "radial-gradient(circle at top, #090d16 0%, #020408 100%)" : "var(--bg-color)" }}>
      {/* Navbar */}
      <nav style={s.nav} className="responsive-nav">
        <div style={s.logoSection}>
          <span style={{ fontSize: "24px" }}>⚡</span>
          <span style={s.navTitle}>Smart Energy & Security Surveillance</span>
        </div>

        {user && (
          <div style={{ display: "flex", gap: "8px" }}>
            {user.role === "Admin" && (
              <span style={{ ...s.badge, background: "rgba(139, 92, 246, 0.15)", color: "#8b5cf6", border: "1px solid #8b5cf6" }}>
                👑 ADMIN (FULL ACCESS)
              </span>
            )}
            {user.role === "Warden" && (
              <span style={{ ...s.badge, background: "rgba(59, 130, 246, 0.15)", color: "#3b82f6", border: "1px solid #3b82f6" }}>
                👮 WARDEN (FLOOR {wardenFloor} ONLY)
              </span>
            )}
            {user.role === "Viewer" && (
              <span style={{ ...s.badge, background: "rgba(107, 114, 128, 0.15)", color: "#6b7280", border: "1px solid #6b7280" }}>
                👁️ VIEWER (READ-ONLY)
              </span>
            )}
          </div>
        )}

        <div style={s.navRight}>
          <a
            href="/docs"
            style={{ ...s.themeToggle, textDecoration: "none" }}
            title="System Documentation & Architecture"
          >
            📖
          </a>
          <button style={s.themeToggle} onClick={toggleTheme} title="Toggle theme mode">
            {theme === "dark" ? "☀️" : "🌙"}
          </button>

          {/* Collapsible Notification Bell Option */}
          <div style={{ position: "relative" }}>
            <button
              style={s.notifBtn}
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              title="View system alerts"
            >
              🔔
              {unreadNotifCount > 0 && (
                <span style={s.notifBadge}>{unreadNotifCount}</span>
              )}
            </button>

            {isNotifOpen && (
              <div style={s.notifDropdown}>
                {/* Header */}
                <div
                  style={{
                    padding: "12px 16px",
                    borderBottom: "1px solid var(--border-color)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    background: "rgba(15, 23, 42, 0.2)",
                  }}
                >
                  <strong style={{ fontSize: "13px" }}>Notifications</strong>
                  {notifications.length > 0 && (
                    <button
                      onClick={clearAllNotifs}
                      style={{ background: "none", border: "none", color: "#3b82f6", fontSize: "11px", fontWeight: "700", cursor: "pointer" }}
                    >
                      Clear All
                    </button>
                  )}
                </div>

                {/* List */}
                <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>
                  {notifications.length === 0 ? (
                    <div style={{ padding: "24px", textAlign: "center", color: "var(--text-muted)", fontSize: "12px" }}>
                      No new alerts
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        style={{
                          padding: "12px 16px",
                          borderBottom: "1px solid var(--border-color)",
                          fontSize: "12px",
                          lineHeight: "1.4",
                          background: n.read ? "transparent" : "rgba(37, 99, 235, 0.05)",
                          borderLeft: n.type === "security" ? "4px solid #ef4444" : "4px solid #3b82f6",
                          cursor: "pointer",
                        }}
                        onClick={() => markAsRead(n.id)}
                      >
                        <div style={{ display: "flex", justifyContext: "space-between", marginBottom: "2px" }}>
                          <span style={{ fontWeight: "700", color: n.type === "security" ? "#ef4444" : "#3b82f6" }}>
                            {n.title}
                          </span>
                          <span style={{ fontSize: "10px", color: "var(--text-muted)", marginLeft: "auto" }}>
                            {n.time}
                          </span>
                        </div>
                        <div style={{ color: "var(--text-color)", marginTop: "2px" }}>{n.text}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <span
            style={{
              ...s.liveTag,
              background: connected ? "var(--success-bg)" : "var(--danger-bg)",
              color: connected ? "var(--success-text)" : "var(--danger-text)",
            }}
          >
            <span
              style={{
                height: "8px",
                width: "8px",
                borderRadius: "50%",
                background: "currentColor",
                display: "inline-block",
              }}
            ></span>
            {connected ? "LIVE CLOUD" : "OFFLINE"}
          </span>
          <button style={s.logoutBtn} onClick={onLogout}>
            Logout
          </button>
        </div>
      </nav>

      {/* Main Container */}
      <div style={s.main} className="fade-in">
        {/* Banner with Export / Print Options */}
        <div style={s.headerBanner} className="responsive-banner">
          <div style={s.bannerLeft}>
            <span style={s.bannerTitle}>Hostel Management Console</span>
            <span style={s.bannerSub}>
              {activeFloor
                ? `Real-time surveillance & energy tracking metrics for Floor ${activeFloor}`
                : "Real-time surveillance & energy tracking metrics for Campus Blocks"}
            </span>
          </div>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            {floorFilter && (
              <button 
                style={{ ...s.btnAction, background: "var(--danger-bg)", color: "var(--danger-text)", borderColor: "var(--danger-text)" }}
                onClick={() => setFloorFilter(null)}
              >
                Reset Floor Filter (Floor {floorFilter})
              </button>
            )}
            {user?.role === "Admin" && (
              <button style={{ ...s.btnAction, padding: "10px 20px" }} onClick={handleExportCSV}>
                📥 Download Analytics CSV Report
              </button>
            )}
            <button
              style={{ ...s.btnAction, background: "rgba(139, 92, 246, 0.1)", borderColor: "#8b5cf6", color: "#a855f7", padding: "10px 20px" }}
              onClick={() => window.print()}
            >
              🖨️ Print PDF Report
            </button>
          </div>
        </div>

        {/* Live Control Room Ticker */}
        <div style={{
          background: "var(--card-bg)",
          backdropFilter: "blur(10px)",
          border: "1px solid var(--border-color)",
          borderRadius: "12px",
          padding: "12px 20px",
          marginBottom: "24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: "13px",
          fontWeight: "700",
          color: "var(--text-color)"
        }} className="responsive-banner">
          <div style={{ display: "flex", alignItems: "center", gap: "20px", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ height: "8px", width: "8px", borderRadius: "50%", background: "#10b981", display: "inline-block", boxShadow: "0 0 8px #10b981" }}></span>
              <span>SYSTEM STATUS: <span style={{ color: "#10b981" }}>NOMINAL</span></span>
            </div>
            <span>•</span>
            <span>🔌 DEVICES ONLINE: <span style={{ color: "#38bdf8" }}>{activeDevicesCount}/{totalDevicesCount}</span></span>
            <span>•</span>
            <span>⚡ POWER DRAW: <span style={{ color: "#fbbf24" }}>{latestEnergyVal.toFixed(2)} kW</span></span>
            <span>•</span>
            <span>🚨 ACTIVE ALERTS: <span style={{ color: "#f87171" }}>{filteredAlerts.length}</span></span>
            {isNightModeHours && (
              <>
                <span>•</span>
                <span style={{ color: "#a855f7" }}>🌙 NIGHT SURVEILLANCE RUNNING</span>
              </>
            )}
          </div>
          <div style={{ color: "var(--text-muted)", fontSize: "12px" }}>
            🛰️ Gateway: <span style={{ color: "#10b981", fontFamily: "monospace" }}>active_listen_5000</span>
          </div>
        </div>

        {/* Tab Selection */}
        <div style={s.tabRow} className="responsive-tabrow">
          {[
            { id: "overview", label: "📊 Overview" },
            { id: "live", label: "📡 Live Analytics" },
            { id: "alerts", label: `🚨 Incident Log (${filteredAlerts.length})` },
            { id: "rooms", label: "🏠 Rooms Directory" },
            { id: "devices", label: "🔧 Device Health" },
            user?.role === "Admin" && { id: "admin", label: "🛡️ Admin Controls" },
          ].filter(Boolean).map((t) => (
            <button
              key={t.id}
              style={tab === t.id ? s.tabActive : s.tab}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW TAB ── */}
        {tab === "overview" && (
          <div className="fade-in">
            {isLoadingOverview ? (
              <div style={s.grid} className="responsive-grid">
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </div>
            ) : overview ? (
              <>
                <div style={s.grid} className="responsive-grid">
                  <StatCard
                    icon="🏠"
                    label="Campus Rooms"
                    value={activeFloor ? filteredRooms.length : overview.rooms?.total}
                    sub={activeFloor ? `${filteredRooms.filter(r => r.occupancy === "occupied").length} occupied` : `${overview.rooms?.occupied} rooms occupied`}
                    color="#8b5cf6"
                  />
                  <StatCard
                    icon="🔌"
                    label="IoT Hardware Nodes"
                    value={activeFloor ? filteredDevices.length : overview.devices?.total}
                    sub={activeFloor ? `${filteredDevices.filter(d => d.status === "active").length} active` : `${overview.devices?.active} active`}
                    color="#3b82f6"
                  />
                  <StatCard
                    icon="🚨"
                    label="Unresolved Breaches"
                    value={filteredAlerts.length}
                    sub={`${filteredAlerts.filter(a => a.severity === "Critical").length} critical severity`}
                    color="var(--security-color)"
                  />
                  <StatCard
                    icon="⚡"
                    label="Live Power Consumption"
                    value={`${latestEnergyVal.toFixed(1)} kW`}
                    sub="Current aggregate active draw"
                    color="#3b82f6"
                  />
                </div>

                <div style={s.row} className="responsive-row">
                  {/* Left Column: Floor plan map or Heatmap */}
                  <div style={s.card}>
                    <h3 style={s.sectionTitle}>
                      <span>🗺️ Live Campus Topography Map</span>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <button
                          style={{
                            ...s.btnAction,
                            background: overviewSubTab === "floormap" ? "#2563eb" : "transparent",
                            color: overviewSubTab === "floormap" ? "#fff" : "var(--text-muted)",
                            borderColor: overviewSubTab === "floormap" ? "#2563eb" : "var(--border-color)",
                          }}
                          onClick={() => setOverviewSubTab("floormap")}
                        >
                          Floor Map
                        </button>
                        <button
                          style={{
                            ...s.btnAction,
                            background: overviewSubTab === "heatmap" ? "#2563eb" : "transparent",
                            color: overviewSubTab === "heatmap" ? "#fff" : "var(--text-muted)",
                            borderColor: overviewSubTab === "heatmap" ? "#2563eb" : "var(--border-color)",
                          }}
                          onClick={() => setOverviewSubTab("heatmap")}
                        >
                          Heatmap
                        </button>
                      </div>
                    </h3>
                    {filteredRooms.length === 0 ? (
                      <div style={s.emptyState}>
                        <div style={s.emptyIcon}>🏢</div>
                        <div style={s.emptyTitle}>No Floor Layout Registered</div>
                        <div style={s.emptyDesc}>No room telemetry found on database for this block.</div>
                      </div>
                    ) : overviewSubTab === "floormap" ? (
                      renderFloorPlan()
                    ) : (
                      <EnergyHeatmap rooms={filteredRooms} liveData={liveData} />
                    )}
                  </div>

                  {/* Right Column: Speedometer + System Connections */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                    {/* Gauge Widget */}
                    <div style={s.card}>
                      <h3 style={s.sectionTitle}>⚡ Current Power Draw</h3>
                      <SpeedometerGauge value={latestEnergyVal} />
                    </div>

                    {/* Week-over-Week & Predictive Analytics */}
                    <div style={s.card}>
                      <h3 style={s.sectionTitle}>📊 Advanced Analytics Depth</h3>
                      <div style={{ display: "flex", flexDirection: "column", gap: "14px", fontSize: "13px" }}>
                        <div style={{ paddingBottom: "10px", borderBottom: "1px solid var(--border-color)" }}>
                          <div style={{ fontWeight: "700", marginBottom: "4px" }}>Week-over-Week Comparison</div>
                          <div style={{ display: "flex", justifyContext: "space-between", alignItems: "center" }}>
                            <span>This Week Consumption:</span>
                            <strong style={{ color: "#3b82f6" }}>45.8 kWh</strong>
                          </div>
                          <div style={{ display: "flex", justifyContext: "space-between", alignItems: "center", marginTop: "2px" }}>
                            <span>Last Week Consumption:</span>
                            <span style={{ color: "var(--text-muted)" }}>41.2 kWh</span>
                          </div>
                          <div style={{ color: "#ef4444", fontSize: "11px", fontWeight: "700", marginTop: "4px" }}>
                            ⚠️ +11.1% increase in power draw
                          </div>
                        </div>
                        <div>
                          <div style={{ fontWeight: "700", marginBottom: "4px" }}>Predictive Linear Projection</div>
                          <p style={{ color: "var(--text-muted)", fontSize: "12px", lineHeight: "1.4" }}>
                            Based on your live average power draw of <strong>{latestEnergyVal.toFixed(2)} kW</strong>:
                          </p>
                          <div style={{ display: "flex", justifyContext: "space-between", marginTop: "6px" }}>
                            <span>Est. Monthly Usage:</span>
                            <strong>{(latestEnergyVal * 24 * 30).toFixed(1)} kWh</strong>
                          </div>
                          <div style={{ display: "flex", justifyContext: "space-between", marginTop: "2px" }}>
                            <span>Est. Electricity Cost:</span>
                            <strong style={{ color: "var(--success-text)" }}>{((latestEnergyVal * 24 * 30) * 8.0).toFixed(0)} INR</strong>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* DB Status */}
                    <div style={s.card}>
                      <h3 style={s.sectionTitle}>⛓️ Backend Services</h3>
                      <div style={{ display: "flex", flexDirection: "column", gap: "14px", fontSize: "13px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "10px", borderBottom: "1px solid var(--border-color)" }}>
                          <span>MongoDB Atlas Connection</span>
                          <span style={{ color: "#10b981", fontWeight: "700" }}>ONLINE (Mongoose)</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "10px", borderBottom: "1px solid var(--border-color)" }}>
                          <span>SQL Server Connection</span>
                          <span style={{ color: "#10b981", fontWeight: "700" }}>ONLINE (Sequelize)</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span>WebSocket Stream Connection</span>
                          <span style={{ color: connected ? "#10b981" : "#ef4444", fontWeight: "700" }}>
                            {connected ? "ESTABLISHED" : "DISCONNECTED"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div style={s.emptyState}>
                <div style={s.emptyIcon}>⚠️</div>
                <div style={s.emptyTitle}>Connection Failure</div>
                <div style={s.emptyDesc}>Could not fetch system overview stats. Check if your backend server is running.</div>
              </div>
            )}
          </div>
        )}

        {/* ── LIVE FEED TAB ── */}
        {tab === "live" && (
          <div className="fade-in style-live responsive-row" style={s.row}>
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              <div style={s.chartContainer}>
                <h3 style={s.sectionTitle}>
                  📈 Live Energy Area Plot (Recharts)
                  <span style={{ fontSize: "11px", color: "var(--text-muted)", marginLeft: "8px" }}>
                    (Blue = Energy stream value)
                  </span>
                </h3>
                {chartReadings.length < 2 ? (
                  <div style={{ color: "var(--text-muted)", padding: "48px 0", textAlign: "center" }} className="skeleton">
                    Collecting telemetry data points to feed chart... Make sure simulator is running.
                  </div>
                ) : (
                  <div style={{ width: "100%", height: 260 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartReadings} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorEnergy" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                        <XAxis dataKey="time" stroke="var(--text-muted)" fontSize={11} />
                        <YAxis stroke="var(--text-muted)" fontSize={11} unit=" kWh" />
                        <Tooltip
                          contentStyle={{
                            background: "var(--bg-color)",
                            border: "1px solid var(--border-color)",
                            color: "var(--text-color)",
                          }}
                        />
                        <Area type="monotone" dataKey="value" name="Energy Usage" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorEnergy)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Data Grid Logs */}
              <div style={s.card}>
                <div style={s.sectionTitle}>
                  📡 Chronological Readings Stream Log
                  <span style={{ fontSize: "11px", color: "var(--text-muted)", marginLeft: "8px" }}>
                    (Blue = Energy, Orange/Red = Security)
                  </span>
                </div>
                {liveData.length === 0 ? (
                  <div style={s.emptyState}>
                    <div style={s.emptyIcon}>📡</div>
                    <div style={s.emptyTitle}>Listening for Readings...</div>
                    <div style={s.emptyDesc}>Waiting for WebSocket broadcasts. Ensure the simulator script is run.</div>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    {liveData
                      .filter((d) => !activeFloor || String(rooms.find(rm => rm.id === d.room_id)?.floor) === String(activeFloor))
                      .map((d, i) => (
                        <div
                          key={i}
                          style={{
                            ...s.liveItem,
                            borderLeft: d.type === "energy" ? "4px solid #3b82f6" : "4px solid #f97316",
                          }}
                        >
                          <span style={s.deviceId}>
                            {d.device_id}
                            {lastActiveDevice === d.device_id && (
                              <span className="live-ping" style={{
                                height: "8px",
                                width: "8px",
                                borderRadius: "50%",
                                background: "#3b82f6",
                                display: "inline-block",
                                marginLeft: "8px",
                                boxShadow: "0 0 8px #3b82f6",
                                animation: "pulse 1.2s infinite"
                              }}></span>
                            )}
                          </span>
                          <span style={{ color: "var(--text-muted)", textTransform: "uppercase", fontSize: "11px" }}>
                            {d.type}
                          </span>
                          <span style={s.value}>
                            {String(d.value)} {d.unit || ""}
                          </span>
                          <span style={{ color: "var(--text-muted)", fontSize: "12px", textAlign: "right" }}>
                            {new Date(d.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              <div style={s.card}>
                <h3 style={s.sectionTitle}>🔌 Gauge Speedometer</h3>
                <SpeedometerGauge value={latestEnergyVal} />
              </div>

              {/* Dynamic topology map replaces the text description block */}
              <SensorNetworkMap />
            </div>
          </div>
        )}

        {/* ── INCIDENT LOG TAB ── */}
        {tab === "alerts" && (
          <div style={s.card} className="fade-in">
            <div style={s.sectionTitle}>
              🚨 Active Incident Timeline
              <span style={{ fontSize: "12px", color: "var(--text-muted)", marginLeft: "8px" }}>
                ({filteredAlerts.length} unresolved breaches)
              </span>
            </div>

            {isLoadingAlerts ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
              </div>
            ) : filteredAlerts.length === 0 ? (
              <div style={s.emptyState}>
                <div style={s.emptyIcon}>✅</div>
                <div style={s.emptyTitle}>Campus Fully Secure</div>
                <div style={s.emptyDesc}>No active security breaches or abnormal events reported.</div>
              </div>
            ) : (
              <SecurityTimeline
                alerts={filteredAlerts}
                onResolve={handleResolveAlert}
                isReadOnly={isReadOnly}
              />
            )}
          </div>
        )}

        {/* ── ROOMS DIRECTORY TAB ── */}
        {tab === "rooms" && (
          <div style={s.card} className="fade-in">
            <div style={s.sectionTitle}>
              🏠 Campus Rooms Directory ({filteredRooms.length} rooms listed)
            </div>

            {isLoadingRooms ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
              </div>
            ) : filteredRooms.length === 0 ? (
              <div style={s.emptyState}>
                <div style={s.emptyIcon}>🏢</div>
                <div style={s.emptyTitle}>No Rooms Found</div>
                <div style={s.emptyDesc}>No rooms matches the search criteria or Warden role floor assignment.</div>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
                {filteredRooms.map((room) => {
                  const sensors = getRoomSensors(room.id);
                  return (
                    <div key={room.id} style={s.roomCard} className="hover-scale">
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                        <strong style={{ color: "var(--text-color)", fontSize: "15px" }}>
                          Room {room.room_number}
                        </strong>
                        <span
                          style={{
                            color: room.occupancy === "occupied" ? "var(--success-text)" : "var(--text-muted)",
                            fontWeight: "700",
                            fontSize: "11px",
                            textTransform: "uppercase",
                            background: room.occupancy === "occupied" ? "var(--success-bg)" : "rgba(107, 114, 128, 0.1)",
                            padding: "2px 8px",
                            borderRadius: "10px",
                          }}
                        >
                          {room.occupancy}
                        </span>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px", color: "var(--text-muted)", fontSize: "13px" }}>
                        <span>🏢 Building Block: {room.building}</span>
                        <span>📶 Floor level: {room.floor}</span>
                        <span>🔌 Hardware nodes: {room.devices?.length || 0} active</span>
                      </div>
                      
                      {/* Real-time digital twin icon set */}
                      <div style={{ display: "flex", gap: "16px", marginTop: "12px", borderTop: "1px solid var(--border-color)", paddingTop: "12px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "4px" }} title="Lighting Status">
                          <span style={{ fontSize: "16px" }}>{sensors.motion ? "💡" : "💤"}</span>
                          <span style={{ fontSize: "11px", fontWeight: "700", color: sensors.motion ? "#fbbf24" : "var(--text-muted)" }}>
                            {sensors.motion ? "ACTIVE" : "STANDBY"}
                          </span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "4px" }} title="Access Entryway">
                          <span style={{ fontSize: "16px" }}>{sensors.door === "open" ? "🔓" : "🔒"}</span>
                          <span style={{ fontSize: "11px", fontWeight: "700", color: sensors.door === "open" ? "#f87171" : "#10b981" }}>
                            {sensors.door === "open" ? "OPEN" : "LOCKED"}
                          </span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "4px" }} title="Power Outlet Draw">
                          <span style={{ fontSize: "16px" }}>🔌</span>
                          <span style={{ fontSize: "11px", fontWeight: "700", color: "var(--text-color)" }}>
                            {sensors.energy ? `${parseFloat(sensors.energy).toFixed(1)} kW` : "idle"}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── DEVICE HEALTH TAB ── */}
        {tab === "devices" && (
          <div style={s.card} className="fade-in">
            <div style={s.sectionTitle}>
              🔧 Device Hardware Diagnostics & Connection Status
            </div>

            {isLoadingDevices ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
              </div>
            ) : filteredDevices.length === 0 ? (
              <div style={s.emptyState}>
                <div style={s.emptyIcon}>🔌</div>
                <div style={s.emptyTitle}>No IoT Nodes Found</div>
                <div style={s.emptyDesc}>No devices registered or available on this floor range.</div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column" }}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1.5fr 1fr 1fr 1.5fr 1fr",
                    padding: "12px 16px",
                    fontWeight: "700",
                    borderBottom: "2px solid var(--border-color)",
                    fontSize: "13px",
                    color: "var(--text-muted)",
                  }}
                  className="responsive-grid"
                >
                  <span>NODE NAME</span>
                  <span>HARDWARE ID</span>
                  <span>TYPE</span>
                  <span>LAST TELEMETRY SEEN</span>
                  <span style={{ textAlign: "right" }}>HEALTH STATUS</span>
                </div>
                {filteredDevices.map((device) => (
                  <div
                    key={device.id}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1.5fr 1fr 1fr 1.5fr 1fr",
                      padding: "16px",
                      borderBottom: "1px solid var(--border-color)",
                      fontSize: "14px",
                      alignItems: "center",
                    }}
                    className="responsive-grid"
                  >
                    <span style={{ fontWeight: "600", display: "flex", alignItems: "center" }}>
                      {device.device_name}
                      {lastActiveDevice === device.device_id && (
                        <span className="live-ping" style={{
                          height: "8px",
                          width: "8px",
                          borderRadius: "50%",
                          background: "#3b82f6",
                          display: "inline-block",
                          marginLeft: "8px",
                          boxShadow: "0 0 8px #3b82f6",
                          animation: "pulse 1.2s infinite"
                        }}></span>
                      )}
                    </span>
                    <span style={{ fontFamily: "monospace", color: "#38bdf8" }}>{device.device_id}</span>
                    <span style={{ textTransform: "capitalize", fontSize: "13px" }}>{device.type}</span>
                    <span style={{ color: "var(--text-muted)", fontSize: "12px" }}>
                      {device.last_seen ? new Date(device.last_seen).toLocaleString() : "Never active"}
                    </span>
                    <span style={{ textAlign: "right" }}>
                      {renderDeviceHealthBadge(device.health)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── ADMIN CONTROLS TAB ── */}
        {tab === "admin" && user?.role === "Admin" && (
          <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }} className="responsive-row">
              {/* Alert thresholds & email triggers */}
              <div style={s.card}>
                <h3 style={s.sectionTitle}>⚙️ Alert Threshold Configuration</h3>
                <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "16px" }}>
                  Set the threshold power draw limits. The console will trigger automated warnings and log entries if rooms exceed this level.
                </p>
                <div style={{ display: "flex", gap: "12px", alignItems: "center", marginBottom: "24px" }}>
                  <input
                    type="number"
                    value={powerThreshold}
                    onChange={(e) => setPowerThreshold(parseFloat(e.target.value) || 0)}
                    style={{
                      background: "var(--bg-color)",
                      border: "1px solid var(--border-color)",
                      borderRadius: "8px",
                      padding: "8px 12px",
                      color: "var(--text-color)",
                      width: "120px",
                      fontSize: "14px",
                    }}
                  />
                  <span style={{ fontSize: "14px", color: "var(--text-muted)" }}>kWh threshold</span>
                  <button
                    onClick={() => {
                      addNotification("⚙️ Threshold Saved", `Critical energy warning threshold updated to ${powerThreshold} kWh.`, "success");
                    }}
                    style={s.btnAction}
                  >
                    Save Config
                  </button>
                </div>

                <h3 style={s.sectionTitle}>📧 Scheduled Performance Reports</h3>
                <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "16px" }}>
                  Dispatch a comprehensive system performance report containing energy leaderboards, peak-hour distributions, active breaches log, and device diagnostic summaries.
                </p>
                <button
                  onClick={handleSendEmailDigest}
                  disabled={isSendingDigest}
                  style={{
                    background: "var(--success-bg)",
                    border: "1px solid var(--success-text)",
                    color: "var(--success-text)",
                    padding: "10px 20px",
                    borderRadius: "10px",
                    fontWeight: "700",
                    cursor: "pointer",
                    fontSize: "13px",
                  }}
                >
                  {isSendingDigest ? "Dispatched Digest..." : "📧 Send Nodemailer Weekly Performance Digest"}
                </button>
              </div>

              {/* Active Sessions management */}
              <div style={s.card}>
                <h3 style={s.sectionTitle}>🔒 Active User Sessions</h3>
                <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "16px" }}>
                  Manage active connections of users currently signed in to the Smart Campus surveillance dashboard.
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "280px", overflowY: "auto" }}>
                  {sessions.length === 0 ? (
                    <div style={{ color: "var(--text-muted)", fontSize: "12px" }}>No active sessions logged</div>
                  ) : (
                    sessions.map((sess) => (
                      <div
                        key={sess._id}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "12px",
                          border: "1px solid var(--border-color)",
                          borderRadius: "10px",
                          fontSize: "12px",
                          background: "rgba(15, 23, 42, 0.1)",
                        }}
                      >
                        <div>
                          <strong style={{ color: "#38bdf8" }}>{sess.email}</strong>
                          <div style={{ color: "var(--text-muted)", fontSize: "10px", marginTop: "2px" }}>
                            💻 {sess.userAgent.slice(0, 45)}...
                          </div>
                          <div style={{ color: "var(--text-muted)", fontSize: "10px" }}>
                            🌍 IP: {sess.ipAddress} | 🕒 Login: {new Date(sess.loginTime).toLocaleTimeString()}
                          </div>
                        </div>
                        <button
                          onClick={() => handleTerminateSession(sess._id)}
                          disabled={isRevokingSession === sess._id}
                          style={{
                            background: "var(--danger-bg)",
                            border: "1px solid var(--danger-text)",
                            color: "var(--danger-text)",
                            padding: "4px 10px",
                            borderRadius: "6px",
                            fontSize: "11px",
                            fontWeight: "700",
                            cursor: "pointer",
                          }}
                        >
                          {isRevokingSession === sess._id ? "Revoking..." : "TERMINATE"}
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Audit Log Timeline */}
            <div style={s.card}>
              <h3 style={s.sectionTitle}>📜 Console Security Audit Log</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "350px", overflowY: "auto" }}>
                {auditLogs.length === 0 ? (
                  <div style={s.emptyState}>
                    <div style={s.emptyIcon}>📜</div>
                    <div style={s.emptyTitle}>Audit Log Empty</div>
                    <div style={s.emptyDesc}>No security events logged in database yet.</div>
                  </div>
                ) : (
                  auditLogs.map((log) => (
                    <div
                      key={log._id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        padding: "10px 14px",
                        borderBottom: "1px solid var(--border-color)",
                        fontSize: "13px",
                      }}
                    >
                      <span style={{ fontWeight: "700", width: "160px", color: "var(--text-muted)" }}>
                        🕒 {new Date(log.timestamp).toLocaleString()}
                      </span>
                      <span
                        style={{
                          fontWeight: "700",
                          width: "180px",
                          color:
                            log.action === "LOGIN"
                              ? "#10b981"
                              : log.action === "TERMINATE_SESSION"
                              ? "#ef4444"
                              : "#3b82f6",
                        }}
                      >
                        {log.action}
                      </span>
                      <span style={{ flex: 1, color: "var(--text-color)" }}>{log.details}</span>
                      <span style={{ color: "var(--text-muted)", fontSize: "11px", marginLeft: "10px" }}>
                        👤 {log.email || "System"}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── INTERACTIVE ROOM DETAILS DRAWER OVERLAY ── */}
      {selectedRoom && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0, 0, 0, 0.6)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 10000,
          animation: "fadeIn 0.2s"
        }}>
          <div style={{
            ...s.card,
            width: "480px",
            maxHeight: "90vh",
            overflowY: "auto",
            position: "relative",
            border: "1px solid var(--border-color)",
            boxShadow: "0 20px 25px -5px rgba(0,0,0,0.5)"
          }}>
            {/* Close Button */}
            <button
              onClick={() => setSelectedRoom(null)}
              style={{
                position: "absolute",
                top: "16px",
                right: "16px",
                background: "none",
                border: "none",
                color: "var(--text-color)",
                fontSize: "20px",
                cursor: "pointer",
                fontWeight: "700"
              }}
            >
              ×
            </button>

            <h3 style={{ fontSize: "18px", fontWeight: "800", marginBottom: "4px" }}>
              🏠 Room {selectedRoom.room_number} Twin Console
            </h3>
            <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "20px" }}>
              Floor {selectedRoom.floor} · Building {selectedRoom.building}
            </p>

            {/* Live Status Indicators */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "12px", background: "rgba(15,23,42,0.2)", borderRadius: "8px" }}>
                <span>Occupancy Status:</span>
                <strong style={{ color: selectedRoom.occupancy === "occupied" ? "#10b981" : "var(--text-muted)" }}>
                  {selectedRoom.occupancy === "occupied" ? "OCCUPIED" : "VACANT"}
                </strong>
              </div>
              
              {/* Energy Draw */}
              <div style={{ display: "flex", justifyContent: "space-between", padding: "12px", background: "rgba(15,23,42,0.2)", borderRadius: "8px" }}>
                <span>⚡ Active Power Outlet:</span>
                <strong>{parseFloat(getRoomSensors(selectedRoom.id).energy || 0).toFixed(2)} kWh</strong>
              </div>

              {/* Motion State */}
              <div style={{ display: "flex", justifyContent: "space-between", padding: "12px", background: "rgba(15,23,42,0.2)", borderRadius: "8px" }}>
                <span>🚶 Motion Detector:</span>
                <strong style={{ color: getRoomSensors(selectedRoom.id).motion ? "#fbbf24" : "#10b981" }}>
                  {getRoomSensors(selectedRoom.id).motion ? "MOTION DETECTED" : "STANDBY"}
                </strong>
              </div>

              {/* Door Entry */}
              <div style={{ display: "flex", justifyContent: "space-between", padding: "12px", background: "rgba(15,23,42,0.2)", borderRadius: "8px" }}>
                <span>🚪 Access Entryway:</span>
                <strong style={{ color: getRoomSensors(selectedRoom.id).door === "open" ? "#ef4444" : "#10b981" }}>
                  {getRoomSensors(selectedRoom.id).door === "open" ? "DOOR OPENED" : "SECURE"}
                </strong>
              </div>
            </div>

            {/* Associated Devices */}
            <h4 style={{ fontSize: "14px", fontWeight: "700", marginBottom: "10px" }}>🔌 Associated Hardware Nodes</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {deviceHealthList.filter(d => String(d.room_id) === String(selectedRoom.id) || String(d.room?.room_number) === String(selectedRoom.room_number)).map(dev => (
                <div key={dev.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", border: "1px solid var(--border-color)", borderRadius: "8px", fontSize: "12px" }}>
                  <span>{dev.device_name}</span>
                  {renderDeviceHealthBadge(dev.health)}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── FLOATING CHATBOT WIDGET ── */}
      {isChatOpen ? (
        <div style={s.chatbotWindow}>
          {/* Header with speaker mute toggle */}
          <div style={s.chatbotHeader}>
            <div>
              <div style={s.chatbotHeaderTitle}>🤖 Smart Monitor Assistant</div>
              <div style={s.chatbotHeaderSub}>
                {user?.role === "Warden" ? `Floor ${wardenFloor} Scope` : `${user?.role} Context`}
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <button
                type="button"
                onClick={() => setIsMuted(!isMuted)}
                style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", fontSize: "16px" }}
                title={isMuted ? "Unmute voice outputs" : "Mute voice outputs"}
              >
                {isMuted ? "🔇" : "🔊"}
              </button>
              <button
                type="button"
                onClick={() => setIsChatOpen(false)}
                style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", fontSize: "18px", fontWeight: "700" }}
              >
                ×
              </button>
            </div>
          </div>

          {/* Messages */}
          <div style={s.chatbotMessages}>
            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  ...s.chatMessage,
                  ...(msg.sender === "user" ? s.userMessage : s.botMessage),
                }}
              >
                {msg.text}
              </div>
            ))}
            {isChatLoading && (
              <div style={{ ...s.chatMessage, ...s.botMessage }} className="skeleton">
                Analyzing console metrics...
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Input Bar with mic speech recognition button */}
          <form style={s.chatbotInputArea} onSubmit={handleSendChatMessage}>
            <button
              type="button"
              onClick={toggleListening}
              style={{
                background: isListening ? "var(--danger-bg)" : "rgba(255, 255, 255, 0.1)",
                border: isListening ? "1px solid var(--danger-text)" : "1px solid var(--border-color)",
                color: isListening ? "var(--danger-text)" : "var(--text-color)",
                borderRadius: "10px",
                width: "38px",
                height: "38px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "14px",
                animation: isListening ? "pulse 1.2s infinite" : "none"
              }}
              title={isListening ? "Listening... click to stop" : "Speak to assistant"}
            >
              🎤
            </button>
            <input
              style={s.chatbotInput}
              placeholder={isListening ? "Listening..." : "Ask about energy, offline nodes..."}
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              disabled={isChatLoading || isListening}
            />
            <button style={s.chatbotSendBtn} type="submit" disabled={isChatLoading || !chatInput.trim() || isListening}>
              Send
            </button>
          </form>
        </div>
      ) : (
        /* Floating Action Button */
        <div
          style={s.chatbotFab}
          onClick={() => setIsChatOpen(true)}
          className="hover-scale"
          title="Open Smart AI Telemetry Assistant"
        >
          💬
        </div>
      )}
    </div>
  );
}