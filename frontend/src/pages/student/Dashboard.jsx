import { useContext } from "react";
import ThemeSelector from "../../components/ThemeSelector";
import { Link, useNavigate } from "react-router-dom";
// import ThemeSelector from "../../components/ThemeSelector";
import { AuthContext } from "../../context/AuthContext";
// import ThemeSelector from "../../components/ThemeSelector";
import "../admin/Dashboard.css";

function StudentDashboard() {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();

    const ActionCard = ({ icon, title, path }) => (
        <div onClick={() => navigate(path)} className="action-card" style={{ cursor: 'pointer' }}>
            <span className="action-icon">{icon}</span>
            <span className="action-title">{title}</span>
        </div>
    );

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <div>
                    <h1>Student Dashboard</h1>
                    <p>Welcome back, {user?.name || "Student"}! Stay productive.</p>
                </div>
                <div className="dashboard-header-right">
                    <ThemeSelector />
                    <button onClick={logout} className="btn btn-danger">
                        Logout
                    </button>
                </div>
            </div>

            <div className="quick-actions">
                <h2>Quick Actions</h2>
                <div className="action-grid">
                    {user?.features?.attendance !== 'none' && (
                        <ActionCard path="/student/attendance" icon="📋" title="View Attendance" />
                    )}
                    {user?.features?.auto_attendance && (
                        <ActionCard path="/student/scan-attendance" icon="📸" title="Scan Attendance" />
                    )}
                    <ActionCard path="/student/marks" icon="📝" title="View Marks" />
                    {user?.features?.fees && (
                        <ActionCard path="/student/pay-fees" icon="💳" title="Pay Fees" />
                    )}
                    {user?.features?.announcements && (
                        <ActionCard path="/student/announcements" icon="📢" title="Announcements" />
                    )}
                    <ActionCard path="/student/profile" icon="👤" title="My Profile" />
                </div>
            </div>

            {user?.features?.announcements && (
                <div className="card" style={{ marginTop: '20px' }}>
                    <div className="card-header">
                        <h3>Recent Announcements</h3>
                    </div>
                    <div style={{ padding: '20px' }}>
                        <p>Keep track of important updates from your institute.</p>
                    </div>
                </div>
            )}
        </div>
    );
}

export default StudentDashboard;
