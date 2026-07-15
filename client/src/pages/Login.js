import React, { useState } from "react";
import API from "../api";

const s = {
  container: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #090d16 0%, #1e1b4b 100%)",
    padding: "24px",
    color: "#f8fafc",
  },
  wrapper: {
    display: "grid",
    gridTemplateColumns: "1.1fr 0.9fr",
    maxWidth: "1000px",
    width: "100%",
    background: "rgba(30, 41, 59, 0.4)",
    backdropFilter: "blur(20px)",
    borderRadius: "24px",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
    overflow: "hidden",
  },
  leftSide: {
    padding: "48px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    background: "rgba(15, 23, 42, 0.3)",
    borderRight: "1px solid rgba(255, 255, 255, 0.05)",
  },
  rightSide: {
    padding: "48px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    background: "rgba(15, 23, 42, 0.6)",
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
    width: "fit-content",
    marginBottom: "16px",
    textTransform: "uppercase",
  },
  mainTitle: {
    fontSize: "36px",
    fontWeight: "800",
    lineHeight: "1.2",
    marginBottom: "16px",
    background: "linear-gradient(to right, #60a5fa, #a855f7)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  descText: {
    fontSize: "15px",
    color: "#94a3b8",
    lineHeight: "1.6",
    marginBottom: "32px",
  },
  featureList: {
    display: "flex",
    flexDirection: "column",
    gap: "18px",
  },
  featureItem: {
    display: "flex",
    gap: "12px",
    alignItems: "flex-start",
  },
  featureIcon: {
    fontSize: "18px",
    background: "rgba(255, 255, 255, 0.05)",
    borderRadius: "8px",
    padding: "6px",
    lineHeight: "1",
  },
  featureTitle: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#f1f5f9",
    marginBottom: "2px",
  },
  featureDesc: {
    fontSize: "12px",
    color: "#64748b",
  },
  formTitle: {
    fontSize: "24px",
    fontWeight: "700",
    color: "#f8fafc",
    marginBottom: "6px",
  },
  formSub: {
    fontSize: "14px",
    color: "#94a3b8",
    marginBottom: "28px",
  },
  label: {
    display: "block",
    fontSize: "13px",
    fontWeight: "600",
    color: "#94a3b8",
    marginBottom: "8px",
    marginTop: "16px",
  },
  input: {
    width: "100%",
    padding: "14px 18px",
    background: "#090d16",
    border: "1px solid #334155",
    borderRadius: "12px",
    color: "#f8fafc",
    fontSize: "14px",
    outline: "none",
    transition: "border-color 0.2s",
  },
  button: {
    width: "100%",
    padding: "14px",
    background: "linear-gradient(135deg, #3b82f6 0%, #6366f1 50%, #a855f7 100%)",
    border: "none",
    borderRadius: "12px",
    color: "#fff",
    fontSize: "15px",
    fontWeight: "700",
    cursor: "pointer",
    marginTop: "32px",
    boxShadow: "0 8px 20px rgba(99, 102, 241, 0.3)",
    transition: "transform 0.2s, box-shadow 0.2s",
  },
  error: {
    background: "rgba(239, 68, 68, 0.1)",
    border: "1px solid rgba(239, 68, 68, 0.2)",
    borderRadius: "10px",
    padding: "12px 16px",
    fontSize: "13px",
    color: "#fca5a5",
    marginTop: "20px",
  },
  demoCard: {
    marginTop: "24px",
    padding: "16px",
    borderRadius: "12px",
    background: "rgba(255, 255, 255, 0.02)",
    border: "1px solid rgba(255, 255, 255, 0.05)",
    fontSize: "12px",
  },
  demoTitle: {
    fontWeight: "700",
    color: "#f1f5f9",
    marginBottom: "8px",
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
};

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await API.post("/auth/login", { email, password });
      if (res.data.token) {
        onLogin(res.data.token);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = (demoEmail) => {
    setEmail(demoEmail);
    setPassword("123456");
  };

  return (
    <div style={s.container}>
      <div style={s.wrapper} className="responsive-row">
        {/* Left Side: Product Intro */}
        <div style={s.leftSide}>
          <div style={s.badge}>
            <span>⚡ Next-Gen IoT Portal</span>
          </div>
          <h1 style={s.mainTitle}>Smart Energy & Security Surveillance</h1>
          <p style={s.descText}>
            Integrate IoT edge telemetry, real-time security incident resolution, and room availability maps in a single, high-fidelity console.
          </p>

          <div style={s.featureList}>
            <div style={s.featureItem}>
              <span style={s.featureIcon}>📈</span>
              <div>
                <h4 style={s.featureTitle}>Real-time Power Analytics</h4>
                <p style={s.featureDesc}>Live-updating charts fed directly by Socket.io sensor streams.</p>
              </div>
            </div>
            <div style={s.featureItem}>
              <span style={s.featureIcon}>🛡️</span>
              <div>
                <h4 style={s.featureTitle}>Surveillance Timeline & Alerts</h4>
                <p style={s.featureDesc}>Instant alerts for unauthorized intrusions, door force, and usage spikes.</p>
              </div>
            </div>
            <div style={s.featureItem}>
              <span style={s.featureIcon}>🔑</span>
              <div>
                <h4 style={s.featureTitle}>Granular Access Control (RBAC)</h4>
                <p style={s.featureDesc}>Dynamic dashboards tailored for Admin, Warden, and Viewer roles.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div style={s.rightSide}>
          <h2 style={s.formTitle}>Welcome back</h2>
          <p style={s.formSub}>Sign in to enter the surveillance dashboard</p>

          <form onSubmit={handleSubmit}>
            <label style={s.label}>Email Address</label>
            <input
              style={s.input}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              required
            />
            
            <label style={s.label}>Password</label>
            <input
              style={s.input}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />

            {error && <div style={s.error}>{error}</div>}

            <button style={s.button} type="submit" disabled={loading}>
              {loading ? "Authorizing Security..." : "Sign In to Console"}
            </button>
          </form>

          {/* Quick-fill section for development/evaluation */}
          <div style={s.demoCard}>
            <div style={s.demoTitle}>
              <span>💡</span> Quick Demo Access Accounts:
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: "#94a3b8" }}>Admin: khushipathak.080@gmail.com</span>
                <button 
                  onClick={() => handleFillDemo("khushipathak.080@gmail.com")} 
                  style={{ background: "rgba(59, 130, 246, 0.15)", border: "none", color: "#60a5fa", padding: "2px 8px", borderRadius: "4px", fontSize: "11px", cursor: "pointer" }}
                >
                  Fill
                </button>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11px", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "6px", marginTop: "4px" }}>
                <span style={{ color: "#64748b" }}>* Password is 123456 for all seeded accounts.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}