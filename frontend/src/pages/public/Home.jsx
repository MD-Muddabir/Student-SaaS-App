/**
 * Public Landing Page
 * Hero section and key features
 */
import { Link } from "react-router-dom";
import PublicNavbar from "../../components/layout/PublicNavbar";
import "./Public.css";
import "./PublicPages.css";

const Home = () => {
    return (
        <div className="public-container">
            <PublicNavbar />

            {/* Hero */}
            <header className="hero-section">
                <div className="hero-content">
                    <h1 className="hero-title">Manage Your Coaching Institute<br />Like a Pro</h1>
                    <p className="hero-subtitle">
                        The all-in-one platform for student management, attendance, fees, and online exams.
                        Streamline your operations today.
                    </p>
                    <div className="hero-actions">
                        <Link to="/register" className="btn-primary-large">Start Free Trial</Link>
                        <Link to="/pricing" className="btn-secondary-large">View Plans</Link>
                    </div>
                </div>
            </header>

            {/* Features */}
            <section className="features-section">
                <h2 className="section-title">Why Choose Student SaaS?</h2>
                <div className="features-grid">
                    <div className="feature-card">
                        <span className="feature-icon" style={{ fontSize: "3rem" }}>📊</span>
                        <h3>Advanced Analytics</h3>
                        <p>Track student performance, attendance trends, and institute growth with detailed, real-time reports.</p>
                    </div>
                    <div className="feature-card">
                        <span className="feature-icon" style={{ fontSize: "3rem" }}>✅</span>
                        <h3>Smart Attendance</h3>
                        <p>Automated attendance tracking for students and faculty with instant notifications.</p>
                    </div>
                    <div className="feature-card">
                        <span className="feature-icon" style={{ fontSize: "3rem" }}>💳</span>
                        <h3>Fee Management</h3>
                        <p>Hassle-free fee collection, receipt generation, and automated reminders for due payments.</p>
                    </div>
                    <div className="feature-card">
                        <span className="feature-icon" style={{ fontSize: "3rem" }}>📱</span>
                        <h3>Parent Portal</h3>
                        <p>Keep parents informed about their child's progress with a dedicated portal and real-time updates.</p>
                    </div>
                </div>
            </section>

            <footer className="public-footer">
                <p style={{ textAlign: "center", width: "100%" }}>© 2026 EduManage. All rights reserved.</p>
            </footer>
        </div>
    );
};

export default Home;
