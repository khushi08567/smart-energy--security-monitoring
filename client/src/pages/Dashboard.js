import React, { useState, useEffect, useRef } from "react";
import API from "../api";
import { io } from "socket.io-client";

// Enhanced modern styles with Outfit variables, dark mode, and neon glow accents
const s = {
  app: { 
    minHeight: "100vh", 
    background: "#080c14", 
    color: "#f8fafc", 
    display: "flex", 
    flexDirection: "column" 
  },
  nav: {
    background: "rgba(15, 23, 42, 0.8)",
    backdropFilter: "blur(12px)",
    borderBottom: "1px solid #1e293b",
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
    fontSize: "20px", 
    fontWeight: "800", 
    background: "linear-gradient(to right, #60a5fa, #c084fc)", 
    WebkitBackgroundClip: "text", 
    WebkitTextFillColor: "transparent",
    letterSpacing: "-0.5px"
  },
  navRight: { display: "flex", alignItems: "center", gap: "16px" },
  liveTag: {
    padding: "6px 14px",
    borderRadius: "30px",
    fontSize: "12px",
    fontWeight: "700",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    boxShadow: "0 0 15px currentColor"
  },
  logoutBtn: {
    background: "#ef4444",
    border: "none",
    color: "#fff",
    padding: "8px 18px",
    borderRadius: "10px",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "600",
    boxShadow: "0 4px 12px rgba(239, 68, 68, 0.2)",
    transition: "all 0.2s"
  },
  main: { 
    padding: "32px", 
    maxWidth: "1400px", 
    margin: "0 auto", 
    width: "100%",
    flex: 1
  },
  headerBanner: {
    background: "linear-gradient(135deg, rgba(30, 41, 59, 0.5) 0%, rgba(15, 23, 42, 0.8) 100%)",
    border: "1px solid #1e293b",
    borderRadius: "16px",
    padding: "24px 32px",
    marginBottom: "32px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },
  bannerLeft: {
    display: "flex",
    flexDirection: "column",
    gap: "6px"
  },
  bannerTitle: { fontSize: "22px", fontWeight: "800", color: "#f8fafc" },
  bannerSub: { fontSize: "14px", color: "#94a3b8" },
  tabRow: { 
    display: "flex", 
    gap: "12px", 
    marginBottom: "32px",
    borderBottom: "1px solid #1e293b",
    paddingBottom: "12px"
  },
  tab: {
    padding: "10px 20px",
    borderRadius: "10px",
    border: "1px solid transparent",
    background: "transparent",
    color: "#94a3b8",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "600",
    transition: "all 0.2s",
  },
  tabActive: {
    padding: "10px 20px",
    borderRadius: "10px",
    border: "1px solid #8b5cf6",
    background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
    color: "#fff",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "600",
    boxShadow: "0 4px 14px rgba(139, 92, 246, 0.4)",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "20px",
    marginBottom: "32px",
  },
  card: {
    background: "rgba(30, 41, 59, 0.3)",
    borderRadius: "16px",
    padding: "24px",
    border: "1px solid #1e293b",
    boxShadow: "0 10px 30px -10px rgba(0,0,0,0.3)"
  },
  cardIcon: {
    fontSize: "24px",
    marginBottom: "12px"
  },
  cardLabel: { fontSize: "13px", color: "#94a3b8", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" },
  cardValue: { fontSize: "36px", fontWeight: "800", margin: "6px 0 2px 0" },
  cardSub: { fontSize: "13px", color: "#64748b" },
  row: { 
    display: "grid", 
    gridTemplateColumns: "1.5fr 1fr", 
    gap: "24px",
    alignItems: "start"
  },
  sectionTitle: {
    fontSize: "18px",
    fontWeight: "800",
    color: "#f8fafc",
    marginBottom: "20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between"
  },
  liveItem: {
    display: "grid",
    gridTemplateColumns: "1.5fr 1fr 1fr 1fr",
    alignItems: "center",
    padding: "14px 16px",
    borderBottom: "1px solid #1e293b",
    fontSize: "14px",
    background: "rgba(15, 23, 42, 0.2)",
    borderRadius: "8px",
    marginBottom: "6px"
  },
  deviceId: { color: "#38bdf8", fontFamily: "monospace", fontWeight: "600" },
  value: { color: "#34d399", fontWeight: "700" },
  alertItem: {
    padding: "16px 20px",
    borderRadius: "12px",
    marginBottom: "12px",
    fontSize: "14px",
    border: "1px solid transparent",
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
  },
  badge: {
    display: "inline-block",
    padding: "4px 10px",
    borderRadius: "20px",
    fontSize: "11px",
    fontWeight: "700",
    marginLeft: "8px",
    textTransform: "uppercase"
  },
  roomCard: {
    background: "rgba(15, 23, 42, 0.4)",
    borderRadius: "12px",
    padding: "16px 20px",
    marginBottom: "10px",
    border: "1px solid #1e293b",
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
    transition: "all 0.2s"
  },
  chartContainer: {
    background: "rgba(15, 23, 42, 0.4)",
    border: "1px solid #1e293b",
    borderRadius: "16px",
    padding: "24px",
    marginBottom: "32px"
  }
};

function StatCard({ label, value, sub, icon, color = "#10b981" }) {
  return (
    <div style={s.card} className="hover-scale fade-in">
      <div style={s.cardIcon}>{icon}</div>
      <div style={s.cardLabel}>{label}</div>
      <div style={{ ...s.cardValue, color }}>{value}</div>
      {sub && <div style={s.cardSub}>{sub}</div>}
    </div>
  );
}

function getSeverityStyle(severity) {
  const map = {
    Critical: { background: "rgba(127, 29, 29, 0.3)", color: "#fca5a5", borderColor: "#ef4444" },
    High:     { background: "rgba(124, 45, 18, 0.3)", color: "#fdba74", borderColor: "#f97316" },
    Medium:   { background: "rgba(120, 53, 4, 0.3)", color: "#fcd34d", borderColor: "#eab308" },
    Low:      { background: "rgba(6, 78, 59, 0.3)", color: "#86efac", borderColor: "#10b981" },
  };
  return map[severity] || map.Low;
}

// Custom SVG Sparkline for live energy visualization
function LiveSparkline({ readings }) {
  const energyVals = readings
    .filter((r) => r.type === "energy")
    .map((r) => parseFloat(r.value))
    .reverse(); // oldest first

  if (energyVals.length < 2) {
    return <div style={{ color: "#64748b", padding: "20px 0" }}>Collecting data points to plot chart...</div>;
  }

  const height = 140;
  const width = 600;
  const max = Math.max(...energyVals);
  const min = Math.min(...energyVals);
  const range = max - min || 1;

  const points = energyVals.map((val, idx) => {
    const x = (width / (energyVals.length - 1)) * idx;
    const y = height - ((val - min) / range) * (height - 30) - 15;
    return `${x},${y}`;
  });

  const pathD = `M ${points.join(" L ")}`;
  const fillD = `${pathD} L ${width},${height} L 0,${height} Z`;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#94a3b8" }}>
        <span>Peak Usage: {max.toFixed(2)} kWh</span>
        <span>Min Usage: {min.toFixed(2)} kWh</span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", height: height, background: "rgba(15, 23, 42, 0.6)", borderRadius: "12px", border: "1px solid #1e293b" }}>
        <defs>
          <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.0" />
          </linearGradient>
        </defs>
        {/* Filled polygon under the line */}
        <path d={fillD} fill="url(#chartGrad)" />
        {/* Sparkline Path */}
        <path d={pathD} fill="none" stroke="#a855f7" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        {/* Draw dots on data points */}
        {points.map((p, i) => {
          const [x, y] = p.split(",");
          return (
            <circle key={i} cx={x} cy={y} r={4} fill="#c084fc" stroke="#080c14" strokeWidth="1.5" />
          );
        })}
      </svg>
    </div>
  );
}

export default function Dashboard({ onLogout }) {
  const [tab, setTab] = useState("overview");
  const [overview, setOverview] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [liveData, setLiveData] = useState([]);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);

  // Fetch overview data
  const fetchOverview = async () => {
    try {
      const res = await API.get("/dashboard/overview");
      setOverview(res.data.data);
    } catch (err) {
      console.error("Overview fetch failed:", err.message);
    }
  };

  // Fetch rooms
  const fetchRooms = async () => {
    try {
      const res = await API.get("/rooms");
      setRooms(res.data.data || []);
    } catch (err) {
      console.error("Rooms fetch failed:", err.message);
    }
  };

  // Fetch recent alerts
  const fetchAlerts = async () => {
    try {
      const res = await API.get("/security/unresolved");
      setAlerts(res.data.data?.events || []);
    } catch (err) {
      console.error("Alerts fetch failed:", err.message);
    }
  };

  // Resolve security alert
  const handleResolveAlert = async (id) => {
    try {
      await API.put(`/security/events/${id}/resolve`);
      fetchAlerts();
      fetchOverview();
    } catch (err) {
      console.error("Resolve failed:", err.message);
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
    } catch (err) {
      console.error("CSV Export failed:", err.message);
    }
  };

  // Connect Socket.io
  useEffect(() => {
    // Determine connection host
    const socketHost = window.location.hostname === "localhost" 
      ? "http://localhost:5000" 
      : "https://smart-energy--security-monitoring.onrender.com";

    socketRef.current = io(socketHost);

    socketRef.current.on("connect", () => {
      setConnected(true);
      socketRef.current.emit("subscribe-alerts");
    });

    socketRef.current.on("disconnect", () => setConnected(false));

    // Live sensor data listener
    socketRef.current.on("sensor-data", (data) => {
      setLiveData((prev) => {
        const updated = [data, ...prev];
        return updated.slice(0, 20); // Keep last 20
      });
    });

    // Security alerts listener
    socketRef.current.on("security-alert", (data) => {
      setAlerts((prev) => [data, ...prev].slice(0, 20));
      fetchOverview();
    });

    // Security resolved listener
    socketRef.current.on("security-resolved", () => {
      fetchAlerts();
      fetchOverview();
    });

    fetchOverview();
    fetchRooms();
    fetchAlerts();

    const interval = setInterval(fetchOverview, 30000);

    return () => {
      socketRef.current.disconnect();
      clearInterval(interval);
    };
  }, []);

  return (
    <div style={s.app}>
      {/* Navbar */}
      <nav style={s.nav}>
        <div style={s.logoSection}>
          <span style={{ fontSize: "24px" }}>⚡</span>
          <span style={s.navTitle}>Smart IoT Energy & Security Monitor</span>
        </div>
        <div style={s.navRight}>
          <span 
            style={{ 
              ...s.liveTag, 
              background: connected ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)",
              color: connected ? "#10b981" : "#ef4444"
            }}
          >
            <span style={{ height: "8px", width: "8px", borderRadius: "50%", background: "currentColor", display: "inline-block" }}></span>
            {connected ? "LIVE CLOUD" : "OFFLINE"}
          </span>
          <button style={s.logoutBtn} onClick={onLogout}>Logout</button>
        </div>
      </nav>

      <div style={s.main} className="fade-in">
        {/* Banner */}
        <div style={s.headerBanner}>
          <div style={s.bannerLeft}>
            <span style={s.bannerTitle}>Hostel Management Console</span>
            <span style={s.bannerSub}>Real-time surveillance & energy tracking metrics for Block A</span>
          </div>
          <button style={{ ...s.btnAction, padding: "10px 20px" }} onClick={handleExportCSV}>
            📥 Export Monthly Analytics CSV
          </button>
        </div>

        {/* Tabs */}
        <div style={s.tabRow}>
          {["overview", "live", "alerts", "rooms"].map((t) => (
            <button
              key={t}
              style={tab === t ? s.tabActive : s.tab}
              onClick={() => setTab(t)}
            >
              {t === "live" ? "📡 Live Feed" : t === "alerts" ? "🚨 Incident Log" : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {tab === "overview" && (
          <div className="fade-in">
            {overview ? (
              <>
                <div style={s.grid}>
                  <StatCard
                    icon="🏠"
                    label="Campus Rooms"
                    value={overview.rooms?.total}
                    sub={`${overview.rooms?.occupied} rooms occupied`}
                    color="#8b5cf6"
                  />
                  <StatCard
                    icon="🔌"
                    label="IoT Hardware Nodes"
                    value={overview.devices?.total}
                    sub={`${overview.devices?.active} devices active`}
                    color="#60a5fa"
                  />
                  <StatCard
                    icon="🚨"
                    label="Unresolved Breaches"
                    value={overview.security?.unresolved_alerts}
                    sub={`${overview.security?.critical_alerts} critical severity`}
                    color="#ef4444"
                  />
                  <StatCard
                    icon="📈"
                    label="Incidents (Today)"
                    value={overview.security?.events_today}
                    sub="Security incidents logged"
                    color="#eab308"
                  />
                  <StatCard
                    icon="⚠️"
                    label="Hardware offline"
                    value={overview.devices?.offline || 0}
                    sub="Needs immediate check"
                    color="#f97316"
                  />
                  <StatCard
                    icon="✉️"
                    label="In-App Warnings"
                    value={overview.notifications?.unread || 0}
                    sub="Unread alerts count"
                    color="#ec4899"
                  />
                </div>

                <div style={s.row}>
                  {/* Left Column: Live Health and Database Status */}
                  <div style={s.card}>
                    <h3 style={s.sectionTitle}>
                      🔧 System Status Indicators
                    </h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "10px", borderBottom: "1px solid #1e293b" }}>
                        <span>MongoDB Atlas Stream Connection</span>
                        <span style={{ color: "#10b981", fontWeight: "700" }}>CONNECTED (Mongoose)</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "10px", borderBottom: "1px solid #1e293b" }}>
                        <span>SQL Server Connection</span>
                        <span style={{ color: "#10b981", fontWeight: "700" }}>CONNECTED (Sequelize)</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "10px", borderBottom: "1px solid #1e293b" }}>
                        <span>WebSocket Handshake status</span>
                        <span style={{ color: connected ? "#10b981" : "#ef4444", fontWeight: "700" }}>
                          {connected ? "ESTABLISHED" : "DISCONNECTED"}
                        </span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span>Interactive documentation</span>
                        <a href="/api/docs" target="_blank" rel="noreferrer" style={{ color: "#a855f7", fontWeight: "600", textDecoration: "none" }}>
                          Open API Docs Sandbox ↗
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Energy Rate Estimator */}
                  <div style={s.card}>
                    <h3 style={s.sectionTitle}>⚡ Energy Pricing Calculator</h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "14px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: "#94a3b8" }}>Electricity Rate:</span>
                        <strong>8.00 INR / kWh</strong>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: "#94a3b8" }}>Projected Daily Block cost:</span>
                        <strong>184.20 INR</strong>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "10px", paddingTop: "10px", borderTop: "1px solid #1e293b" }}>
                        <span style={{ color: "#94a3b8" }}>Billing cycle:</span>
                        <span>June 2026 (Monthly)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div style={{ padding: "40px 0", color: "#94a3b8" }}>Fetching overview data... Make sure your backend server is running.</div>
            )}
          </div>
        )}

        {/* Live Feed Tab */}
        {tab === "live" && (
          <div className="fade-in" style={s.row}>
            {/* Left Column: Live Sparkline and Data Log */}
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              <div style={s.chartContainer}>
                <h3 style={s.sectionTitle}>📈 Live Energy Consumption Chart</h3>
                <LiveSparkline readings={liveData} />
              </div>

              <div style={s.card}>
                <div style={s.sectionTitle}>
                  📡 Live Incoming Readings Feed
                  <span style={{ fontSize: "12px", color: "#64748b", marginLeft: "8px" }}>
                    (showing latest 20 values)
                  </span>
                </div>
                {liveData.length === 0 ? (
                  <p style={{ color: "#64748b", fontSize: "14px" }}>
                    Waiting for data... Make sure your simulator is running.
                  </p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    {liveData.map((d, i) => (
                      <div key={i} style={s.liveItem}>
                        <span style={s.deviceId}>{d.device_id}</span>
                        <span style={{ color: "#94a3b8", textTransform: "uppercase", fontSize: "12px" }}>
                          {d.type}
                        </span>
                        <span style={s.value}>
                          {String(d.value)} {d.unit || ""}
                        </span>
                        <span style={{ color: "#475569", fontSize: "12px", textAlign: "right" }}>
                          {new Date(d.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Explanation */}
            <div style={s.card}>
              <h3 style={s.sectionTitle}>💡 Real-Time Data Flow</h3>
              <p style={{ color: "#94a3b8", fontSize: "14px", lineHeight: "1.6" }}>
                This console is connected to the Node.js backend using **Socket.io**.
              </p>
              <p style={{ color: "#94a3b8", fontSize: "14px", lineHeight: "1.6", marginTop: "10px" }}>
                As your simulator pushes data to the server via webhooks, the server stores it in MongoDB Atlas and immediately emits it to this client without requiring any page refreshes.
              </p>
              <h4 style={{ ...s.sectionTitle, marginTop: "24px", fontSize: "14px" }}>Active Channels:</h4>
              <ul style={{ color: "#94a3b8", fontSize: "14px", paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "8px" }}>
                <li><code>sensor-data</code> (Global broadcasts)</li>
                <li><code>room-data</code> (Targeted room channels)</li>
                <li><code>security-alert</code> (Incident indicators)</li>
              </ul>
            </div>
          </div>
        )}

        {/* Incident Log Tab */}
        {tab === "alerts" && (
          <div style={s.card} className="fade-in">
            <div style={s.sectionTitle}>
              🚨 Active Incidents Surveillance Logs
              <span style={{ fontSize: "12px", color: "#94a3b8", marginLeft: "8px" }}>
                ({alerts.length} unresolved breaches)
              </span>
            </div>
            {alerts.length === 0 ? (
              <div style={{ color: "#64748b", padding: "40px 0", textAlign: "center" }}>
                <span style={{ fontSize: "32px", display: "block", marginBottom: "12px" }}>✅</span>
                <strong>No active alerts detected. The campus is currently secure.</strong>
              </div>
            ) : (
              alerts.map((a, i) => (
                <div
                  key={i}
                  style={{ ...s.alertItem, ...getSeverityStyle(a.severity), display: "flex", justifyContent: "space-between", alignItems: "center" }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <strong style={{ fontSize: "16px" }}>{a.event_type?.replace(/_/g, " ").toUpperCase()}</strong>
                      <span style={{
                        ...s.badge,
                        ...getSeverityStyle(a.severity),
                        border: "1px solid currentColor",
                      }}>
                        {a.severity}
                      </span>
                    </div>
                    <div style={{ marginTop: "6px", opacity: 0.9, fontSize: "14px" }}>
                      {a.description}
                    </div>
                    <div style={{ marginTop: "6px", fontSize: "12px", opacity: 0.6 }}>
                      Room: {a.room_id} • Device ID: {a.device_id} • logged: {new Date(a.timestamp || a.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <button 
                    style={{
                      background: "#10b981", 
                      border: "none", 
                      color: "#fff", 
                      padding: "8px 16px", 
                      borderRadius: "8px", 
                      fontWeight: "700",
                      cursor: "pointer",
                      boxShadow: "0 4px 10px rgba(16, 185, 129, 0.2)"
                    }}
                    onClick={() => handleResolveAlert(a._id || a.event_id)}
                  >
                    RESOLVE
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* Rooms Tab */}
        {tab === "rooms" && (
          <div style={s.card} className="fade-in">
            <div style={s.sectionTitle}>
              🏠 Campus Rooms Directory ({rooms.length} registered)
            </div>
            {rooms.length === 0 ? (
              <div style={{ color: "#94a3b8", padding: "20px 0" }}>No rooms found in the SQL database. Add rooms using POST /api/rooms.</div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
                {rooms.map((room) => (
                  <div key={room.id} style={s.roomCard} className="hover-scale">
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                      <strong style={{ color: "#f8fafc", fontSize: "16px" }}>
                        Room {room.room_number}
                      </strong>
                      <span style={{
                        color: room.occupancy === "occupied" ? "#34d399" : "#94a3b8",
                        fontWeight: "700",
                        fontSize: "12px",
                        textTransform: "uppercase"
                      }}>
                        {room.occupancy}
                      </span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px", color: "#64748b", fontSize: "13px" }}>
                      <span>Floor level: {room.floor}</span>
                      <span>Building location: {room.building}</span>
                      <span style={{ color: "#475569" }}>Devices registered: {room.devices?.length || 0} nodes</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}