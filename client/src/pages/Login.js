import React, { useState } from "react";
import API from "../api";

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
  },
  card: {
    background: "#1e293b",
    borderRadius: "16px",
    padding: "40px",
    width: "100%",
    maxWidth: "400px",
    border: "1px solid #334155",
  },
  logo: {
    textAlign: "center",
    marginBottom: "32px",
  },
  logoIcon: {
    fontSize: "48px",
    display: "block",
    marginBottom: "8px",
  },
  title: {
    fontSize: "24px",
    fontWeight: "700",
    color: "#f1f5f9",
    marginBottom: "4px",
  },
  subtitle: {
    fontSize: "14px",
    color: "#94a3b8",
  },
  label: {
    display: "block",
    fontSize: "13px",
    color: "#94a3b8",
    marginBottom: "6px",
    marginTop: "16px",
  },
  input: {
    width: "100%",
    padding: "12px 16px",
    background: "#0f172a",
    border: "1px solid #334155",
    borderRadius: "8px",
    color: "#f1f5f9",
    fontSize: "14px",
    outline: "none",
  },
  button: {
    width: "100%",
    padding: "12px",
    background: "linear-gradient(135deg, #3b82f6, #6366f1)",
    border: "none",
    borderRadius: "8px",
    color: "#fff",
    fontSize: "15px",
    fontWeight: "600",
    cursor: "pointer",
    marginTop: "24px",
  },
  error: {
    background: "#450a0a",
    border: "1px solid #7f1d1d",
    borderRadius: "8px",
    padding: "10px 14px",
    fontSize: "13px",
    color: "#fca5a5",
    marginTop: "16px",
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

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.logo}>
          <span style={styles.logoIcon}>⚡</span>
          <h1 style={styles.title}>Smart Energy Monitor</h1>
          <p style={styles.subtitle}>Sign in to your dashboard</p>
        </div>
        <form onSubmit={handleSubmit}>
          <label style={styles.label}>Email</label>
          <input
            style={styles.input}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@example.com"
            required
          />
          <label style={styles.label}>Password</label>
          <input
            style={styles.input}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />
          {error && <div style={styles.error}>{error}</div>}
          <button style={styles.button} type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}