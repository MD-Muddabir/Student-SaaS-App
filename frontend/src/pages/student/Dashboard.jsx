import { useContext, useState, useEffect } from "react";
import ThemeSelector from "../../components/ThemeSelector";
import { Link, useNavigate } from "react-router-dom";
// import ThemeSelector from "../../components/ThemeSelector";
import { AuthContext } from "../../context/AuthContext";
// import ThemeSelector from "../../components/ThemeSelector";
import api from "../../services/api";
import "../admin/Dashboard.css";

function StudentDashboard() {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const [unreadCount, setUnreadCount] = useState(0);
    const [chatUnreadCount, setChatUnreadCount] = useState(0);

    useEffect(() => {
        if (user?.features?.announcements) {
            api.get('/announcements/unread-count').then(res => {
                if (res.data.success) {
                    setUnreadCount(res.data.count);
                }
            }).catch(err => console.log(err));
        }

        // Fetch chat unread count
        api.get('/chat/unread-count').then(res => {
            if (res.data.success) {
                setChatUnreadCount(res.data.count);
            }
        }).catch(err => console.log(err));

    }, [user]);

    const ActionCard = ({ icon, title, path, badge }) => (
        <div onClick={() => navigate(path)} className="action-card" style={{ cursor: 'pointer', position: 'relative' }}>
            <span className="action-icon">{icon}</span>
            <span className="action-title">{title}</span>
            {badge > 0 && (
                <span style={{
                    position: 'absolute', top: 10, right: 10, background: 'red', color: 'white',
                    borderRadius: '50%', padding: '2px 8px', fontSize: '12px', fontWeight: 'bold'
                }}>
                    {badge}
                </span>
            )}
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
                        <ActionCard path="/student/scan-attendance" icon="🤳" title="My QR Code" />
                    )}
                    <ActionCard path="/student/exams" icon="📝" title="View Marks" />
                    {user?.features?.fees && (
                        <ActionCard path="/student/fees" icon="💳" title="Pay Fees" />
                    )}
                    <ActionCard path="/student/timetable" icon="📅" title="My Timetable" />
                    {user?.features?.announcements && (
                        <ActionCard path="/student/announcements" icon="📢" title="Announcements" badge={unreadCount} />
                    )}

                    <ActionCard path="/student/notes" icon="📚" title="My Notes" />
                    <ActionCard path="/student/chat" icon="💬" title="Subject Chat" badge={chatUnreadCount} />

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
