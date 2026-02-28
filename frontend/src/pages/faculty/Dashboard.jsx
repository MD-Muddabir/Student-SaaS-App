import { useContext } from "react";
import ThemeSelector from "../../components/ThemeSelector";
import { Link, useNavigate } from "react-router-dom";
// import ThemeSelector from "../../components/ThemeSelector";
import { AuthContext } from "../../context/AuthContext";
// import ThemeSelector from "../../components/ThemeSelector";
import "../admin/Dashboard.css";

function FacultyDashboard() {
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
                    <h1>Faculty Dashboard</h1>
                    <p>Welcome back, {user?.name || "Professor"}! Have a great day.</p>
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
                    <ActionCard path="/faculty/students" icon="👨‍🎓" title="View Students" />
                    {user?.features?.attendance !== 'none' && (
                        <ActionCard path="/faculty/attendance" icon="📋" title="Mark Attendance" />
                    )}
                    {user?.features?.auto_attendance && (
                        <ActionCard path="/faculty/smart-attendance" icon="⚡" title="Smart Attendance" />
                    )}
                    <ActionCard path="/faculty/marks" icon="📝" title="Enter Marks" />
                    {user?.features?.announcements && (
                        <ActionCard path="/faculty/announcements" icon="📢" title="My Announcements" />
                    )}
                    <ActionCard path="/faculty/profile" icon="👤" title="My Profile" />
                </div>
            </div>

            {user?.features?.announcements && (
                <div className="card" style={{ marginTop: '20px' }}>
                    <div className="card-header">
                        <h3>Recent Announcements</h3>
                    </div>
                    <div style={{ padding: '20px' }}>
                        <p>Check the global announcements from your Institute Admin.</p>
                    </div>
                </div>
            )}
        </div>
    );
}

export default FacultyDashboard;
