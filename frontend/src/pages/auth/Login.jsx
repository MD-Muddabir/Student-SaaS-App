/**
 * Login Page — Premium Design
 * Phase 5: ThemeSelector with loginMode (light/dark only, always pro theme)
 */

import { useState, useEffect, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { ThemeContext } from "../../context/ThemeContext";
import ThemeSelector from "../../components/ThemeSelector";
import "./Auth.css";

function Login() {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  const { setTheme, isDark } = useContext(ThemeContext);

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPass, setShowPass] = useState(false);

  // Force pro theme for auth pages
  useEffect(() => {
    setTheme(isDark, "pro");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Redirect if already logged in
  useEffect(() => {
    const userObj = JSON.parse(localStorage.getItem("user"));
    if (userObj) {
      switch (userObj.role) {
        case "super_admin": navigate("/superadmin/dashboard"); break;
        case "admin": navigate("/admin/dashboard"); break;
        case "faculty": navigate("/faculty/dashboard"); break;
        case "student": navigate("/student/dashboard"); break;
        case "manager": navigate("/admin/dashboard"); break;
        case "parent": navigate("/parent/dashboard"); break;
        default: navigate("/");
      }
    }
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await login(formData);
      const user = JSON.parse(localStorage.getItem("user"));
      switch (user.role) {
        case "super_admin": navigate("/superadmin/dashboard"); break;
        case "admin": navigate("/admin/dashboard"); break;
        case "faculty": navigate("/faculty/dashboard"); break;
        case "student": navigate("/student/dashboard"); break;
        case "manager": navigate("/admin/dashboard"); break;
        case "parent": navigate("/parent/dashboard"); break;
        default: navigate("/");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Animated background orbs */}
      <div className="auth-orb auth-orb--1" />
      <div className="auth-orb auth-orb--2" />
      <div className="auth-orb auth-orb--3" />

      {/* Top-right theme controls — loginMode: only light/dark */}
      <div className="auth-theme-controls">
        <ThemeSelector loginMode />
      </div>

      <div className="auth-container">
        <div className="auth-card">
          {/* Logo / Brand */}
          <div className="auth-header">
            <div className="auth-logo">🎓</div>
            <h1 className="auth-title">Student SaaS</h1>
            <p className="auth-subtitle">Sign in to your account</p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="auth-alert">
              <span className="auth-alert__icon">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-field">
              <label htmlFor="email" className="auth-label">
                <span className="auth-label__icon">✉️</span>
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                className="auth-input"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                required
                autoFocus
              />
            </div>

            <div className="auth-field">
              <label htmlFor="password" className="auth-label">
                <span className="auth-label__icon">🔒</span>
                Password
              </label>
              <div className="auth-input-wrap">
                <input
                  type={showPass ? "text" : "password"}
                  id="password"
                  name="password"
                  className="auth-input"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  className="auth-eye-btn"
                  onClick={() => setShowPass(p => !p)}
                  tabIndex={-1}
                >
                  {showPass ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            <div className="auth-row">
              <label className="auth-checkbox">
                <input type="checkbox" />
                <span>Remember me</span>
              </label>
              <Link to="/forgot-password" className="auth-forgot">Forgot password?</Link>
            </div>

            <button
              type="submit"
              className={`auth-submit${loading ? " auth-submit--loading" : ""}`}
              disabled={loading}
            >
              {loading ? (
                <><span className="auth-spinner" /> Signing in...</>
              ) : (
                <><span>🚀</span> Sign In</>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="auth-footer">
            <div className="auth-divider"><span>OR</span></div>
            <p className="auth-footer__text">
              Don't have an account?{" "}
              <Link to="/register" className="auth-link">Register your institute</Link>
            </p>
            <Link to="/" className="auth-back-home">← Back to Home</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
