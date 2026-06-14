import React, { useState, useEffect, useRef } from "react";
import API from "../api";
import { io } from "socket.io-client";

const s = {
  app: { minHeight: "100vh", background: "#0f172a" },
  nav: {
    background: "#1e293b",
    borderBottom: "1px solid #334155",
    padding: "0 24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    height: "60px",
  },
  navTitle: { fontSize: "18px", fontWeight: "700", color: "#f1f5f9" },
  navRight: { display: "flex", alignItems: "center", gap: "16px" },
  liveTag: {
    background: "#064e3b",
    color: "#6ee7b7",
    padding: "4px 10px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "500",
  },
  logoutBtn: {
    background: "transparent",
    border: "1px solid #475569",
    color: "#94a3b8",
    padding: "6px 14px",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "13px",
  },
  main: { padding: "24px" },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "16px",
    marginBottom: "24px",
  },
  card: {
    background: "#1e293b",
    borderRadius: "12px",
    padding: "20px",
    border: "1px solid #334155",
  },
  cardLabel: { fontSize: "12px", color: "#94a3b8", marginBottom: "8px" },
  cardValue: { fontSize: "32px", fontWeight: "700", color: "#f1f5f9" },
  cardSub: { fontSize: "12px", color: "#64748b", marginTop: "4px" },
  row: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" },
  sectionTitle: {
    fontSize: "15px",
    fontWeight: "600",
    color: "#f1f5f9",
    marginBottom: "14px",
  },
  liveItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 0",
    borderBottom: "1px solid #1e293b",
    fontSize: "13px",
  },
  deviceId: { color: "#94a3b8", fontFamily: "monospace" },
  value: { color: "#6ee7b7", fontWeight: "600" },
  alertItem: {
    padding: "10px 12px",
    borderRadius: "8px",
    marginBottom: "8px",
    fontSize: "13px",
  },
  badge: {
    display: "inline-block",
    padding: "2px 8px",
    borderRadius: "20px",
    fontSize: "11px",
    fontWeight: "600",
    marginLeft: "8px",
  },
  tabRow: { display: "flex", gap: "8px", marginBottom: "16px" },
  tab: {
    padding: "6px 14px",
    borderRadius: "8px",
    border: "1px solid #334155",
    background: "transparent",
    color: "#94a3b8",
    cursor: "pointer",
    fontSize: "13px",
  },
  tabActive: {
    padding: "6px 14px",
    borderRadius: "8px",
    border: "1px solid #3b82f6",
    background: "#1d4ed8",
    color: "#fff",
    cursor: "pointer",
    fontSize: "13px",
  },
  roomCard: {
    background: "#0f172a",
    borderRadius: "8px",
    padding: "12px",
    marginBottom: "8px",
    border: "1px solid #334155",
    fontSize: "13px",
  },
};

function StatCard({ label, value, sub, color = "#6ee7b7" }) {
  return (
    <div style={s.card}>
      <div style={s.cardLabel}>{label}</div>
      <div style={{ ...s.cardValue, color }}>{value}</div>
      {sub && <div style={s.cardSub}>{sub}</div>}
    </div>
  );
}

function getSeverityStyle(severity) {
  const map = {
    Critical: { background: "#450a0a", color: "#fca5a5" },
    High:     { background: "#431407", color: "#fdba74" },
    Medium:   { background: "#422006", color: "#fcd34d" },
    Low:      { background: "#052e16", color: "#86efac" },
  };
  return map[severity] || map.Low;
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

  // Connect Socket.io
  useEffect(() => {
    socketRef.current = io("http://localhost:5000");

    socketRef.current.on("connect", () => {
      setConnected(true);
      socketRef.current.emit("subscribe-alerts");
    });

    socketRef.current.on("disconnect", () => setConnected(false));

    // Live sensor data
    socketRef.current.on("sensor-data", (data) => {
      setLiveData((prev) => {
        const updated = [data, ...prev];
        return updated.slice(0, 20); // keep last 20
      });
    });

    // Security alerts
    socketRef.current.on("security-alert", (data) => {
      setAlerts((prev) => [data, ...prev].slice(0, 20));
    });

    fetchOverview();
    fetchRooms();
    fetchAlerts();

    // Refresh overview every 30 seconds
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
        <span style={s.navTitle}>⚡ Smart Energy & Security Monitor</span>
        <div style={s.navRight}>
          <span style={s.liveTag}>
            {connected ? "🟢 Live" : "🔴 Offline"}
          </span>
          <button style={s.logoutBtn} onClick={onLogout}>Logout</button>
        </div>
      </nav>

      <div style={s.main}>
        {/* Tabs */}
        <div style={s.tabRow}>
          {["overview", "live", "alerts", "rooms"].map((t) => (
            <button
              key={t}
              style={tab === t ? s.tabActive : s.tab}
              onClick={() => setTab(t)}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {tab === "overview" && overview && (
          <>
            <div style={s.grid}>
              <StatCard
                label="Total Rooms"
                value={overview.rooms?.total}
                sub={`${overview.rooms?.occupied} occupied`}
              />
              <StatCard
                label="Total Devices"
                value={overview.devices?.total}
                sub={`${overview.devices?.active} active`}
                color="#60a5fa"
              />
              <StatCard
                label="Unresolved Alerts"
                value={overview.security?.unresolved_alerts}
                sub={`${overview.security?.critical_alerts} critical`}
                color="#f87171"
              />
              <StatCard
                label="Events Today"
                value={overview.security?.events_today}
                sub="security events"
                color="#fbbf24"
              />
              <StatCard
                label="Offline Devices"
                value={overview.devices?.offline}
                sub="need attention"
                color="#f87171"
              />
              <StatCard
                label="Unread Notifications"
                value={overview.notifications?.unread}
                sub="in-app alerts"
                color="#a78bfa"
              />
            </div>
          </>
        )}

        {/* Live Data Tab */}
        {tab === "live" && (
          <div style={s.card}>
            <div style={s.sectionTitle}>
              📡 Live Sensor Data
              <span style={{ fontSize: "12px", color: "#64748b", marginLeft: "8px" }}>
                (last 20 readings)
              </span>
            </div>
            {liveData.length === 0 ? (
              <p style={{ color: "#64748b", fontSize: "13px" }}>
                Waiting for data... Make sure simulator is running.
              </p>
            ) : (
              liveData.map((d, i) => (
                <div key={i} style={s.liveItem}>
                  <span style={s.deviceId}>{d.device_id}</span>
                  <span style={{ color: "#94a3b8", fontSize: "12px" }}>
                    {d.type}
                  </span>
                  <span style={s.value}>
                    {String(d.value)} {d.unit || ""}
                  </span>
                  <span style={{ color: "#475569", fontSize: "11px" }}>
                    {new Date(d.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))
            )}
          </div>
        )}

        {/* Alerts Tab */}
        {tab === "alerts" && (
          <div style={s.card}>
            <div style={s.sectionTitle}>
              🚨 Security Alerts
              <span style={{ fontSize: "12px", color: "#64748b", marginLeft: "8px" }}>
                ({alerts.length} unresolved)
              </span>
            </div>
            {alerts.length === 0 ? (
              <p style={{ color: "#64748b", fontSize: "13px" }}>
                No active alerts. System is secure. ✅
              </p>
            ) : (
              alerts.map((a, i) => (
                <div
                  key={i}
                  style={{ ...s.alertItem, ...getSeverityStyle(a.severity) }}
                >
                  <strong>{a.event_type?.replace(/_/g, " ").toUpperCase()}</strong>
                  <span style={{
                    ...s.badge,
                    ...getSeverityStyle(a.severity),
                    border: "1px solid currentColor",
                  }}>
                    {a.severity}
                  </span>
                  <div style={{ marginTop: "4px", opacity: 0.8 }}>
                    {a.description}
                  </div>
                  <div style={{ marginTop: "4px", fontSize: "11px", opacity: 0.6 }}>
                    Room {a.room_id} •{" "}
                    {new Date(a.timestamp).toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Rooms Tab */}
        {tab === "rooms" && (
          <div style={s.card}>
            <div style={s.sectionTitle}>
              🏠 All Rooms ({rooms.length})
            </div>
            {rooms.map((room) => (
              <div key={room.id} style={s.roomCard}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <strong style={{ color: "#f1f5f9" }}>
                    Room {room.room_number}
                  </strong>
                  <span style={{
                    color: room.occupancy === "occupied" ? "#6ee7b7" : "#64748b",
                    fontSize: "12px",
                  }}>
                    {room.occupancy}
                  </span>
                </div>
                <div style={{ color: "#64748b", marginTop: "4px" }}>
                  Floor {room.floor} • {room.building} •{" "}
                  {room.devices?.length || 0} devices
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}