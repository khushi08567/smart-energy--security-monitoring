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
  loginBtn: {
    padding: "8px 18px",
    borderRadius: "10px",
    background: "linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)",
    color: "#fff",
    textDecoration: "none",
    fontWeight: "600",
    fontSize: "14px",
    boxShadow: "0 4px 12px rgba(99, 102, 241, 0.2)",
    transition: "transform 0.2s",
  },
  hero: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    padding: "80px 24px",
    background: "radial-gradient(circle at top, rgba(99, 102, 241, 0.08) 0%, transparent 60%)",
  },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "6px 12px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "700",
    background: "rgba(59, 130, 246, 0.15)",
    color: "#60a5fa",
    textTransform: "uppercase",
    marginBottom: "24px",
  },
  title: {
    fontSize: "54px",
    fontWeight: "800",
    lineHeight: "1.1",
    maxWidth: "800px",
    marginBottom: "20px",
    background: "linear-gradient(to right, #60a5fa, #c084fc)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  subtitle: {
    fontSize: "18px",
    color: "var(--text-muted)",
    maxWidth: "600px",
    lineHeight: "1.6",
    marginBottom: "40px",
  },
  ctaRow: {
    display: "flex",
    gap: "16px",
    alignItems: "center",
  },
  ctaPrimary: {
    padding: "14px 32px",
    borderRadius: "12px",
    background: "linear-gradient(135deg, #3b82f6 0%, #6366f1 50%, #a855f7 100%)",
    color: "#fff",
    textDecoration: "none",
    fontWeight: "700",
    fontSize: "16px",
    boxShadow: "0 10px 20px rgba(99, 102, 241, 0.3)",
    transition: "transform 0.2s",
  },
  ctaSecondary: {
    padding: "14px 32px",
    borderRadius: "12px",
    background: "var(--card-bg)",
    border: "1px solid var(--border-color)",
    color: "var(--text-color)",
    textDecoration: "none",
    fontWeight: "700",
    fontSize: "16px",
    transition: "background 0.2s",
  },
  section: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "80px 24px",
    width: "100%",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "24px",
    marginTop: "40px",
  },
  featureCard: {
    background: "var(--card-bg)",
    border: "1px solid var(--border-color)",
    borderRadius: "20px",
    padding: "32px",
    boxShadow: "var(--shadow)",
  },
  featureIcon: {
    fontSize: "32px",
    marginBottom: "20px",
  },
  featureTitle: {
    fontSize: "18px",
    fontWeight: "700",
    marginBottom: "12px",
  },
  featureDesc: {
    fontSize: "14px",
    color: "var(--text-muted)",
    lineHeight: "1.6",
  },
  footer: {
    padding: "40px 24px",
    borderTop: "1px solid var(--border-color)",
    textAlign: "center",
    fontSize: "13px",
    color: "var(--text-muted)",
  },
};

export default function Home() {
  const { theme, toggleTheme } = useContext(ThemeContext);

  return (
    <div style={s.container}>
      {/* Navbar */}
      <nav style={s.nav} className="responsive-nav">
        <div style={s.logoSection}>
          <span style={{ fontSize: "24px" }}>⚡</span>
          <span style={s.navTitle}>Smart Monitor Portal</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <button style={s.themeToggle} onClick={toggleTheme}>
            {theme === "dark" ? "☀️" : "🌙"}
          </button>
          <Link to="/docs" style={{ ...s.loginBtn, background: "transparent", border: "1px solid var(--border-color)", color: "var(--text-color)", marginRight: "8px" }}>
            Architecture Docs
          </Link>
          <Link to="/login" style={s.loginBtn}>
            Console Login
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <div style={s.hero} className="fade-in">
        <div style={s.badge}>
          <span>⚡ Next-Generation IoT Portal</span>
        </div>
        <h1 style={s.title}>Smart Energy & Security Surveillance Dashboard</h1>
        <p style={s.subtitle}>
          Secure your facility with real-time hardware health checking, smart anomaly indicators, and Live Socket.io telemetry graphs in one unified console.
        </p>

        <div style={s.ctaRow}>
          <Link to="/login" style={s.ctaPrimary} className="hover-scale">
            Launch Monitoring Console
          </Link>
          <a href="#features" style={s.ctaSecondary} className="hover-scale">
            Explore Features
          </a>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" style={s.section}>
        <div style={{ textAlign: "center" }}>
          <h2 style={{ fontSize: "28px", fontWeight: "800" }}>System Core Modules</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "15px", marginTop: "8px" }}>
            High-fidelity integrations for hostel and campus management
          </p>
        </div>

        <div style={s.grid} className="responsive-grid">
          <div style={s.featureCard} className="hover-scale">
            <div style={s.featureIcon}>📈</div>
            <h3 style={s.featureTitle}>Real-time Power Analytics</h3>
            <p style={s.featureDesc}>
              Visualize instant energy consumption trends with live Recharts area plots connected directly to our Socket.io edge-broadcasting servers.
            </p>
          </div>

          <div style={s.featureCard} className="hover-scale">
            <div style={s.featureIcon}>🛡️</div>
            <h3 style={s.featureTitle}>Surveillance Incident Log</h3>
            <p style={s.featureDesc}>
              Never miss a security event. Tracks doors and motion sensors around the clock with instant role-restricted warning popups.
            </p>
          </div>

          <div style={s.featureCard} className="hover-scale">
            <div style={s.featureIcon}>🔑</div>
            <h3 style={s.featureTitle}>Role-Based Gated Access</h3>
            <p style={s.featureDesc}>
              Tailored workspaces for Admins, Wardens, and Viewers. Access is secure, database-locked, and UI-aware.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer style={s.footer}>
        <p>© 2026 Smart Energy & Security Monitor. Built for hostel management automation.</p>
      </footer>
    </div>
  );
}
