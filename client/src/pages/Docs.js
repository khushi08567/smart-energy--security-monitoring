import React, { useContext } from "react";
import { Link } from "react-router-dom";
import { ThemeContext } from "../App";

const s = {
  container: {
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
  },
  backLink: {
    padding: "8px 18px",
    borderRadius: "10px",
    background: "var(--card-bg)",
    border: "1px solid var(--border-color)",
    color: "var(--text-color)",
    textDecoration: "none",
    fontWeight: "600",
    fontSize: "13px",
  },
  content: {
    maxWidth: "900px",
    margin: "0 auto",
    padding: "48px 24px",
    width: "100%",
  },
  title: {
    fontSize: "32px",
    fontWeight: "800",
    marginBottom: "8px",
    background: "linear-gradient(to right, #60a5fa, #a855f7)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  subtitle: {
    fontSize: "15px",
    color: "var(--text-muted)",
    marginBottom: "32px",
    lineHeight: "1.6",
  },
  section: {
    background: "var(--card-bg)",
    border: "1px solid var(--border-color)",
    borderRadius: "20px",
    padding: "32px",
    marginBottom: "32px",
    boxShadow: "var(--shadow)",
  },
  secTitle: {
    fontSize: "18px",
    fontWeight: "800",
    marginBottom: "16px",
    color: "#3b82f6",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  bodyText: {
    fontSize: "14px",
    lineHeight: "1.6",
    color: "var(--text-color)",
    marginBottom: "16px",
  },
  diagramBlock: {
    background: "rgba(15, 23, 42, 0.2)",
    border: "1px solid var(--border-color)",
    borderRadius: "12px",
    padding: "24px",
    fontFamily: "monospace",
    fontSize: "12px",
    lineHeight: "1.5",
    color: "#60a5fa",
    overflowX: "auto",
    marginBottom: "20px",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "13px",
    marginTop: "16px",
  },
  th: {
    borderBottom: "2px solid var(--border-color)",
    padding: "10px",
    textAlign: "left",
    fontWeight: "700",
    color: "var(--text-muted)",
  },
  td: {
    borderBottom: "1px solid var(--border-color)",
    padding: "10px",
    color: "var(--text-color)",
  },
};

export default function Docs() {
  const { theme, toggleTheme } = useContext(ThemeContext);

  return (
    <div style={s.container}>
      {/* Navbar */}
      <nav style={s.nav}>
        <div style={s.logoSection}>
          <span style={{ fontSize: "24px" }}>⚡</span>
          <span style={s.navTitle}>Architecture & API Docs</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <button style={s.themeToggle} onClick={toggleTheme}>
            {theme === "dark" ? "☀️" : "🌙"}
          </button>
          <Link to="/" style={s.backLink}>
            ← Back
          </Link>
        </div>
      </nav>

      {/* Docs Body */}
      <div style={s.content} className="fade-in">
        <h1 style={s.title}>System Architecture & Performance Model</h1>
        <p style={s.subtitle}>
          Detailed architectural summary, data-flow models, security configurations, and role-based permissions metrics.
        </p>

        {/* 1. ARCHITECTURE SUMMARY */}
        <div style={s.section}>
          <h2 style={s.secTitle}>🏢 System Overview</h2>
          <p style={s.bodyText}>
            The Smart Energy & Security Monitor is a high-fidelity full-stack platform built to aggregate IoT sensor broadcasts, enforce role-based access gates, and display real-time surveillance widgets.
          </p>
          <div style={s.diagramBlock}>
{`[ IoT Simulator / Hardware Edge ]
       │  (HTTP POST Telemetry / Token Authenticated Events)
       ▼
[ Node.js API Gateway (Express Server) ] ◄──► [ WebSockets (Socket.io) ] ──► [ React Client ]
       │                                                                         (Live Area Plots)
       ├──► [ SQLite Database ] (Sequelize ORM)  ──► Rooms, Users, Device Tables
       └──► [ MongoDB Database ] (Mongoose ODM) ──► Sensor Readings, Active Breaches`}
          </div>
        </div>

        {/* 2. SECURITY HARDENING */}
        <div style={s.section}>
          <h2 style={s.secTitle}>🛡️ Security Hardening Systems</h2>
          <p style={s.bodyText}>
            To protect telemetry gateways and query endpoints, multiple security layers are integrated:
          </p>
          <ul style={{ paddingLeft: "20px", fontSize: "14px", lineHeight: "1.6", color: "var(--text-muted)" }}>
            <li><strong>Rate Limiting</strong>: Limits brute-force attempts globally on all <code>/api</code> routes (max 500 requests per 15 minutes per IP).</li>
            <li><strong>Helmet Headers</strong>: Hardens Express server header securities.</li>
            <li><strong>Audit Logging</strong>: Automatic logging of sensitive console tasks (e.g. login, terminatings, digests) in the database.</li>
            <li><strong>Active Session Tracker</strong>: Tracks device logins with remote termination capability.</li>
          </ul>
        </div>

        {/* 3. ROLE-BASED ACCESS CONTROL (RBAC) */}
        <div style={s.section}>
          <h2 style={s.secTitle}>🔑 RBAC Permission Matrix</h2>
          <p style={s.bodyText}>
            Operations are strictly partitioned across three roles in both the database API level and React views:
          </p>
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>ROLE</th>
                <th style={s.th}>SCOPE SUMMARY</th>
                <th style={s.th}>RESTRICTIONS</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={s.td}><strong>Admin</strong></td>
                <td style={s.td}>Full read/write across all blocks & floors. Access to CSV/PDF exports.</td>
                <td style={s.td}>None.</td>
              </tr>
              <tr>
                <td style={s.td}><strong>Warden</strong></td>
                <td style={s.td}>Write permissions for rooms/devices on their assigned floor only.</td>
                <td style={s.td}>Filtered to their specific floor (e.g. Floor 2). Cannot query other floor layouts.</td>
              </tr>
              <tr>
                <td style={s.td}><strong>Viewer</strong></td>
                <td style={s.td}>Read-only access to rooms, devices, and live energy chart.</td>
                <td style={s.td}>Cannot resolve alerts, download reports, or query security timeline chat helper.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
