/**
 * Admin Dashboard
 * Main dashboard for institute administrators
 */

import { useState, useEffect, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../services/api";
import { AuthContext } from "../../context/AuthContext";
import ThemeSelector from "../../components/ThemeSelector";
import "./Dashboard.css";

function AdminDashboard() {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();

    const basePath = '/admin';

    const [stats, setStats] = useState({
        totalStudents: 0,
        totalFaculty: 0,
        totalClasses: 0,
        activeStudents: 0,
    });

    // Usage limits & features
    const [planDetails, setPlanDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [blockedFeature, setBlockedFeature] = useState("");

    useEffect(() => {
        fetchStats();
        fetchUsage();
    }, []);

    const fetchStats = async () => {
        try {
            const response = await api.get("/admin/stats");
            setStats(response.data.data);
        } catch (error) {
            console.error("Error fetching stats:", error);
        }
    };

    const fetchUsage = async () => {
        try {
            const response = await api.get("/admin/usage");
            setPlanDetails(response.data.data);
        } catch (error) {
            console.error("Error fetching usage stats:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleNavigation = (path, featureKey, requiredLevel = true) => {
        if (!planDetails) {
            navigate(path); // Fallback
            return;
        }

        const features = planDetails.features;
        let hasAccess = true;
        let featureName = "";

        switch (featureKey) {
            case 'students':
                hasAccess = true; // Core feature
                break;
            case 'faculty':
                hasAccess = true; // Core feature
                break;
            case 'classes':
                hasAccess = true; // Core feature
                break;
            case 'subjects':
                hasAccess = true; // Core feature
                break;
            case 'attendance':
                // Block if 'none'. If 'basic', allowed.
                if (features.attendance === 'none') {
                    hasAccess = false;
                    featureName = "Attendance Management";
                }
                break;
            case 'reports':
                // Block if 'none'
                if (features.reports === 'none') {
                    hasAccess = false;
                    featureName = "Reports & Analytics";
                }
                break;
            case 'fees':
                if (!features.fees) {
                    hasAccess = false;
                    featureName = "Fee Management";
                }
                break;
            case 'announcements':
                if (!features.announcements) {
                    hasAccess = false;
                    featureName = "Announcements";
                }
                break;
            case 'auto_attendance':
                if (!features.auto_attendance) {
                    hasAccess = false;
                    featureName = "Smart Attendance (QR)";
                }
                break;
            case 'timetable':
                if (!features.timetable) {
                    hasAccess = false;
                    featureName = "Master Timetable";
                }
                break;
            default:
                hasAccess = true;
        }

        if (hasAccess) {
            navigate(path);
        } else {
            setBlockedFeature(featureName);
            setShowUpgradeModal(true);
        }
    };

    const hasPermission = (featureKey) => {
        if (user?.role === 'admin' || user?.role === 'superadmin' || user?.role === 'super_admin') return true;
        if (user?.role === 'manager') {
            return user.permissions && user.permissions.includes(featureKey);
        }
        return false;
    };

    // Action Card Component
    const ActionCard = ({ icon, title, path, featureKey }) => (
        <div onClick={() => handleNavigation(path, featureKey)} className="action-card" style={{ cursor: 'pointer' }}>
            <span className="action-icon">{icon}</span>
            <span className="action-title">{title}</span>
            {planDetails && featureKey && (
                (featureKey === 'fees' && !planDetails.features.fees) ||
                (featureKey === 'announcements' && !planDetails.features.announcements) ||
                (featureKey === 'attendance' && planDetails.features.attendance === 'none') ||
                (featureKey === 'reports' && planDetails.features.reports === 'none') ||
                (featureKey === 'auto_attendance' && !planDetails.features.auto_attendance) ||
                (featureKey === 'timetable' && !planDetails.features.timetable)
            ) && (
                    <span style={{ position: 'absolute', top: 5, right: 5, fontSize: '10px', background: '#e5e7eb', padding: '2px 5px', borderRadius: '4px' }}>🔒</span>
                )}
        </div>
    );

    if (loading) {
        return (
            <div className="dashboard-container">
                <div className="dashboard-loading">Loading...</div>
            </div>
        );
    }

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <div>
                    <h1>{user?.role === 'manager' ? 'Manager Dashboard' : 'Admin Dashboard'}</h1>
                    <p>Welcome back! {planDetails ? `Current Plan: ${planDetails.plan.name}` : "Here's what's happening today."}</p>
                </div>
                <div className="dashboard-header-right">
                    <ThemeSelector />
                    <button onClick={logout} className="btn btn-danger">
                        Logout
                    </button>
                </div>
            </div>

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon">👥</div>
                    <div className="stat-content">
                        <h3>{stats.totalAdmins || 0} / {planDetails?.plan?.max_admin_users || 1}</h3>
                        <p>Total Admins</p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon">👨‍🎓</div>
                    <div className="stat-content">
                        <h3>{stats.totalStudents} / {planDetails?.usage?.students?.limit || '∞'}</h3>
                        <p>Total Students</p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon">👩‍🏫</div>
                    <div className="stat-content">
                        <h3>{stats.totalFaculty} / {planDetails?.usage?.faculty?.limit || '∞'}</h3>
                        <p>Total Faculty</p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon">📚</div>
                    <div className="stat-content">
                        <h3>{stats.totalClasses} / {planDetails?.usage?.classes?.limit || '∞'}</h3>
                        <p>Total Classes</p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon">✅</div>
                    <div className="stat-content">
                        <h3>{stats.activeStudents}</h3>
                        <p>Active Students</p>
                    </div>
                </div>
            </div>

            <div className="quick-actions">
                <h2>Quick Actions</h2>
                <div className="action-grid">
                    {user?.role === 'admin' && (
                        <ActionCard path={`${basePath}/admins`} icon="👥" title="Manage Admins" featureKey="admins" />
                    )}
                    {hasPermission('students') && <ActionCard path={`${basePath}/students`} icon="👨‍🎓" title="Manage Students" featureKey="students" />}
                    {hasPermission('attendance') && <ActionCard path={`${basePath}/attendance`} icon="📋" title="Student Attendance" featureKey="attendance" />}
                    {hasPermission('attendance') && <ActionCard path={`${basePath}/view-attendance`} icon="📊" title="View Attendance" featureKey="attendance" />}
                    {hasPermission('attendance') && <ActionCard path={`${basePath}/smart-attendance`} icon="📸" title="Scan Student QR" featureKey="auto_attendance" />}

                    {hasPermission('classes') && <ActionCard path={`${basePath}/classes`} icon="📚" title="Manage Classes" featureKey="classes" />}

                    {hasPermission('faculty') && <ActionCard path={`${basePath}/faculty`} icon="👩‍🏫" title="Manage Faculty" featureKey="faculty" />}
                    {hasPermission('attendance') && <ActionCard path={`${basePath}/faculty-attendance`} icon="📋" title="Faculty Attendance" featureKey="attendance" />}
                    {hasPermission('attendance') && <ActionCard path={`${basePath}/view-faculty-attendance`} icon="📊" title="Faculty Tracker" featureKey="attendance" />}
                    {hasPermission('attendance') && <ActionCard path={`${basePath}/scan-faculty-qr`} icon="📸" title="Scan Faculty QR" featureKey="attendance" />}

                    {hasPermission('subjects') && <ActionCard path={`${basePath}/subjects`} icon="📖" title="Manage Subjects" featureKey="subjects" />}


                    {hasPermission('reports') && <ActionCard path={`${basePath}/reports`} icon="📊" title="Reports & Analytics" featureKey="reports" />}
                    {hasPermission('expenses') && <ActionCard path={`${basePath}/expenses`} icon="💸" title="Finances & Transport" featureKey="expenses" />}
                    {hasPermission('fees') && <ActionCard path={`${basePath}/fees`} icon="💰" title="Fee Management" featureKey="fees" />}
                    {hasPermission('exams') && <ActionCard path={`${basePath}/exams`} icon="📝" title="Manage Exams" featureKey="exams" />}
                    {hasPermission('classes') && <ActionCard path={`${basePath}/timetable`} icon="📅" title="Master Timetable" featureKey="timetable" />}
                    {hasPermission('announcements') && <ActionCard path={`${basePath}/announcements`} icon="📢" title="Announcements" featureKey="announcements" />}

                    {user?.role === 'admin' && (
                        <div onClick={() => navigate(`${basePath}/settings`)} className="action-card" style={{ cursor: 'pointer' }}>
                            <span className="action-icon">⚙️</span>
                            <span className="action-title">Settings</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Upgrade Modal */}
            {showUpgradeModal && (
                <div className="modal-overlay" style={{ backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000 }}>
                    <div className="modal-content" style={{
                        maxWidth: '400px',
                        width: '90%',
                        textAlign: 'center',
                        backgroundColor: 'white',
                        padding: '2rem',
                        borderRadius: '12px',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
                    }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⭐</div>
                        <h2 style={{ color: '#1f2937', marginBottom: '0.5rem' }}>Upgrade Required</h2>
                        <p style={{ margin: '1rem 0', color: '#4b5563', lineHeight: '1.5' }}>
                            The <strong>{blockedFeature}</strong> feature is not available in your current plan ({planDetails?.plan?.name}).
                        </p>
                        <p style={{ color: '#6b7280', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                            Please upgrade your subscription to access this feature and unlock more limits.
                        </p>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                            <button className="btn btn-secondary" onClick={() => setShowUpgradeModal(false)}>
                                Close
                            </button>
                            <button className="btn btn-primary" onClick={() => navigate("/pricing")}>
                                Upgrade Now
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AdminDashboard;
