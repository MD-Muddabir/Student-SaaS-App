/**
 * Admin / Manager Dashboard
 * Main dashboard for institute administrators
 */

import { useState, useEffect, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../services/api";
import { AuthContext } from "../../context/AuthContext";
import ThemeSelector from "../../components/ThemeSelector";
import BlockedScreen from "./BlockedScreen";
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
        totalAdmins: 0,
        totalDiscount: 0,
        totalDue: 0,
    });

    const [planDetails, setPlanDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [blockedFeature, setBlockedFeature] = useState("");
    const [managerStats, setManagerStats] = useState(null);

    // Manager count and list for the admin "Manager System" banner
    const [managers, setManagers] = useState([]);

    const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

    useEffect(() => {
        if (user?.role === 'manager' && user?.status === 'blocked') return;

        if (user?.role === 'manager') {
            fetchManagerStats();
        } else {
            fetchStats();
            fetchManagers();
        }
        fetchUsage();
    }, [user]);

    const fetchStats = async () => {
        try {
            const response = await api.get("/admin/stats");
            setStats(response.data.data);
        } catch (error) {
            console.error("Error fetching stats:", error);
        }
    };

    const fetchManagers = async () => {
        try {
            const res = await api.get("/admin/admins");
            if (res.data.success) {
                setManagers(res.data.data.filter(u => u.role === 'manager'));
            }
        } catch (e) {
            // silent — manager list is optional UI enhancement
        }
    };

    const fetchManagerStats = async () => {
        try {
            const response = await api.get("/manager/stats");
            if (response.data.success) setManagerStats(response.data.data);
            const adminRes = await api.get("/admin/stats");
            setStats(adminRes.data.data);
        } catch (error) {
            console.error("Error fetching manager stats:", error);
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

    // Phase 2: Blocked managers see the blocked screen immediately
    if (user?.role === 'manager' && user?.status === 'blocked') {
        return <BlockedScreen />;
    }

    const handleNavigation = (path, featureKey) => {
        if (!planDetails) { navigate(path); return; }

        const features = planDetails.features;
        let hasAccess = true;
        let featureName = "";

        switch (featureKey) {
            case 'attendance':
                if (features.attendance === 'none') { hasAccess = false; featureName = "Attendance Management"; }
                break;
            case 'reports':
                if (features.reports === 'none') { hasAccess = false; featureName = "Reports & Analytics"; }
                break;
            case 'fees':
                if (!features.fees) { hasAccess = false; featureName = "Fee Management"; }
                break;
            case 'announcements':
                if (!features.announcements) { hasAccess = false; featureName = "Announcements"; }
                break;
            case 'auto_attendance':
                if (!features.auto_attendance) { hasAccess = false; featureName = "Smart Attendance (QR)"; }
                break;
            case 'timetable':
                if (!features.timetable) { hasAccess = false; featureName = "Master Timetable"; }
                break;
            default:
                hasAccess = true;
        }

        if (hasAccess) { navigate(path); }
        else { setBlockedFeature(featureName); setShowUpgradeModal(true); }
    };

    const hasPermission = (featureKey) => {
        if (isAdmin) return true;
        if (user?.role === 'manager') {
            return user.permissions && user.permissions.some(p => p === featureKey || p.startsWith(featureKey + '.'));
        }
        return false;
    };

    const ActionCard = ({ icon, title, path, featureKey, highlight }) => (
        <div
            onClick={() => handleNavigation(path, featureKey)}
            className="action-card"
            style={{ cursor: 'pointer', position: 'relative', ...(highlight ? { borderColor: '#6366f1', boxShadow: '0 0 0 2px rgba(99,102,241,0.3)' } : {}) }}
        >
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

    // ─── Permission labels for display ───
    const PERM_LABELS = {
        students: '👨‍🎓 Students',
        faculty: '👩‍🏫 Faculty',
        classes: '📚 Classes',
        subjects: '📖 Subjects',
        attendance: '📋 Attendance',
        reports: '📊 Reports',
        fees: '💰 Fees',
        announcements: '📢 Announcements',
        exams: '📝 Exams',
        expenses: '💸 Expenses',
        transport: '🚌 Transport',
    };

    return (
        <div className="dashboard-container">

            {/* ── Header ── */}
            <div className="dashboard-header">
                <div>
                    <h1>{user?.role === 'manager' ? '👨‍💼 Manager Dashboard' : '🏫 Admin Dashboard'}</h1>
                    <p>Welcome back, <strong>{user?.name}</strong>! {planDetails ? `Plan: ${planDetails.plan.name}` : "Here's what's happening today."}</p>
                </div>
                <div className="dashboard-header-right">
                    <ThemeSelector />
                    <button onClick={logout} className="btn btn-danger">Logout</button>
                </div>
            </div>

            {/* ══════════════ STATS ══════════════ */}
            {user?.role === 'manager' && managerStats ? (
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-icon">💰</div>
                        <div className="stat-content">
                            <h3>₹{parseFloat(managerStats.todayCollection || 0).toLocaleString()}</h3>
                            <p>Today's Collection</p>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon">🔥</div>
                        <div className="stat-content">
                            <h3>₹{parseFloat(managerStats.totalExpenses || 0).toLocaleString()}</h3>
                            <p>Monthly Expenses</p>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon">👨‍🎓</div>
                        <div className="stat-content">
                            <h3>{stats.totalStudents || 0}</h3>
                            <p>Total Students</p>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon">✅</div>
                        <div className="stat-content">
                            <h3>{managerStats.attendanceRate || 0}%</h3>
                            <p>Today's Attendance</p>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon">🏫</div>
                        <div className="stat-content">
                            <h3>{managerStats.presentToday || 0} / {managerStats.attendanceToday || 0}</h3>
                            <p>Present / Marked</p>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
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
                    <div className="stat-card">
                        <div className="stat-icon">🔔</div>
                        <div className="stat-content">
                            <h3>₹{(stats.totalDue || 0).toLocaleString()}</h3>
                            <p>Total Due Fees</p>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon">🎉</div>
                        <div className="stat-content">
                            <h3>₹{(stats.totalDiscount || 0).toLocaleString()}</h3>
                            <p>Total Discount Given</p>
                        </div>
                    </div>
                </div>
            )}

            {/* ══════════════ MANAGER SYSTEM BANNER (Admin only) ══════════════ */}
            {isAdmin && (
                <div style={{
                    marginTop: '2rem',
                    borderRadius: '16px',
                    background: 'linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(168,85,247,0.15) 100%)',
                    border: '1px solid rgba(99,102,241,0.35)',
                    padding: '1.5rem 2rem',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    {/* Decorative glow */}
                    <div style={{
                        position: 'absolute', top: '-40px', right: '-40px',
                        width: '140px', height: '140px', borderRadius: '50%',
                        background: 'rgba(99,102,241,0.2)', filter: 'blur(40px)'
                    }} />

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                                <span style={{ fontSize: '1.75rem' }}>👨‍💼</span>
                                <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                                    Manager System
                                </h2>
                                <span style={{
                                    background: 'linear-gradient(90deg, #6366f1, #a855f7)',
                                    color: '#fff', fontSize: '0.72rem', fontWeight: '700',
                                    padding: '2px 10px', borderRadius: '20px', letterSpacing: '0.05em'
                                }}>
                                    PHASE 2 – 11
                                </span>
                            </div>
                            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '560px' }}>
                                Create operational-level managers with granular permission control. Managers can collect fees, record expenses, manage transport, and view attendance — without accessing sensitive financial analytics.
                            </p>
                        </div>
                        <button
                            className="btn btn-primary"
                            onClick={() => navigate('/admin/admins')}
                            style={{
                                background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                                border: 'none', padding: '0.65rem 1.4rem', borderRadius: '10px',
                                fontWeight: '600', whiteSpace: 'nowrap', fontSize: '0.9rem'
                            }}
                        >
                            👨‍💼 Manage Managers →
                        </button>
                    </div>

                    {/* Manager count + existing manager chips */}
                    <div style={{ marginTop: '1.25rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <div style={{
                            background: 'rgba(99,102,241,0.15)', borderRadius: '10px',
                            padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem'
                        }}>
                            <span style={{ fontSize: '1.2rem' }}>👨‍💼</span>
                            <span style={{ fontWeight: '700', fontSize: '1.1rem' }}>{managers.length}</span>
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Active Manager{managers.length !== 1 ? 's' : ''}</span>
                        </div>

                        {managers.length === 0 ? (
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontStyle: 'italic' }}>
                                No managers created yet. Click "Manage Managers" to add one.
                            </span>
                        ) : (
                            managers.map(mgr => (
                                <div key={mgr.id} style={{
                                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                                    background: 'rgba(255,255,255,0.08)', borderRadius: '8px',
                                    padding: '0.4rem 0.85rem', border: '1px solid rgba(99,102,241,0.25)'
                                }}>
                                    <div style={{
                                        width: '28px', height: '28px', borderRadius: '50%',
                                        background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        color: '#fff', fontWeight: '700', fontSize: '0.8rem'
                                    }}>
                                        {(mgr.name || 'M')[0].toUpperCase()}
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.85rem', fontWeight: '600' }}>{mgr.name}</div>
                                        <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                                            {Array.isArray(mgr.permissions) && mgr.permissions.length > 0
                                                ? mgr.permissions.slice(0, 3).map(p => PERM_LABELS[p] || p).join(', ') + (mgr.permissions.length > 3 ? ` +${mgr.permissions.length - 3}` : '')
                                                : 'No permissions assigned'}
                                        </div>
                                    </div>
                                    <span style={{
                                        marginLeft: '4px', fontSize: '0.7rem', padding: '1px 7px',
                                        borderRadius: '20px', fontWeight: '600',
                                        background: mgr.status === 'active' ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)',
                                        color: mgr.status === 'active' ? '#10b981' : '#ef4444'
                                    }}>
                                        {mgr.status}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Permission key legend */}
                    <div style={{ marginTop: '1rem', borderTop: '1px solid rgba(99,102,241,0.2)', paddingTop: '1rem' }}>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: '600', letterSpacing: '0.05em' }}>
                            AVAILABLE MANAGER PERMISSIONS:
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                            {Object.entries(PERM_LABELS).map(([key, label]) => (
                                <span key={key} style={{
                                    fontSize: '0.75rem', padding: '2px 10px', borderRadius: '20px',
                                    background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(99,102,241,0.2)',
                                    color: 'var(--text-primary)'
                                }}>
                                    {label}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ══════════════ QUICK ACTIONS ══════════════ */}
            <div className="quick-actions" style={{ marginTop: '2rem' }}>
                <h2>Quick Actions</h2>
                <div className="action-grid">
                    {/* Admin-only: Manage Admins/Managers */}
                    {isAdmin && (
                        <ActionCard path={`${basePath}/admins`} icon="👨‍💼" title="Manage Managers" featureKey="admins" highlight />
                    )}

                    {hasPermission('students') && <ActionCard path={`${basePath}/students`} icon="👨‍🎓" title="Manage Students" featureKey="students" />}
                    {hasPermission('attendance') && <ActionCard path={`${basePath}/attendance`} icon="📋" title="Student Attendance" featureKey="attendance" />}
                    {hasPermission('attendance') && <ActionCard path={`${basePath}/view-attendance`} icon="📊" title="View Attendance" featureKey="attendance" />}
                    {hasPermission('attendance') && <ActionCard path={`${basePath}/smart-attendance`} icon="📸" title="Scan Student QR" featureKey="auto_attendance" />}

                    {hasPermission('classes') && <ActionCard path={`${basePath}/classes`} icon="📚" title="Manage Classes" featureKey="classes" />}

                    {hasPermission('students') && <ActionCard path={`${basePath}/parents`} icon="👨‍👩‍👧" title="Manage Parents" featureKey="students" />}

                    {hasPermission('faculty') && <ActionCard path={`${basePath}/faculty`} icon="👩‍🏫" title="Manage Faculty" featureKey="faculty" />}
                    {hasPermission('attendance') && <ActionCard path={`${basePath}/faculty-attendance`} icon="📋" title="Faculty Attendance" featureKey="attendance" />}
                    {hasPermission('attendance') && <ActionCard path={`${basePath}/view-faculty-attendance`} icon="📊" title="Faculty Tracker" featureKey="attendance" />}
                    {hasPermission('attendance') && <ActionCard path={`${basePath}/scan-faculty-qr`} icon="📸" title="Scan Faculty QR" featureKey="attendance" />}

                    {hasPermission('subjects') && <ActionCard path={`${basePath}/subjects`} icon="📖" title="Manage Subjects" featureKey="subjects" />}

                    {hasPermission('fees') && <ActionCard path={`${basePath}/fees`} icon="💰" title="Collect Fees" featureKey="fees" />}
                    {hasPermission('expenses') && <ActionCard path={`${basePath}/expenses`} icon="💸" title="Finances & Expenses" featureKey="expenses" />}
                    {(isAdmin || hasPermission('transport')) && <ActionCard path={`${basePath}/expenses`} icon="🚌" title="Transport Fees" featureKey="expenses" />}

                    {hasPermission('reports') && <ActionCard path={`${basePath}/reports`} icon="📊" title="Reports & Analytics" featureKey="reports" />}
                    {hasPermission('exams') && <ActionCard path={`${basePath}/exams`} icon="📝" title="Manage Exams" featureKey="exams" />}
                    {hasPermission('classes') && <ActionCard path={`${basePath}/timetable`} icon="📅" title="Master Timetable" featureKey="timetable" />}
                    {hasPermission('announcements') && <ActionCard path={`${basePath}/announcements`} icon="📢" title="Announcements" featureKey="announcements" />}

                    {/* New Notes & Chat Features */}
                    <ActionCard path={`${basePath}/notes`} icon="📓" title="All Notes" />
                    <ActionCard path={`${basePath}/chat-monitor`} icon="💬" title="Chat Monitor" />

                    {isAdmin && (
                        <div onClick={() => navigate(`${basePath}/settings`)} className="action-card" style={{ cursor: 'pointer' }}>
                            <span className="action-icon">⚙️</span>
                            <span className="action-title">Settings</span>
                        </div>
                    )}
                </div>
            </div>

            {/* ══════════════ MANAGER: RECENT PAYMENTS ══════════════ */}
            {user?.role === 'manager' && managerStats?.recentPayments?.length > 0 && (
                <div className="card" style={{ marginTop: '2rem', padding: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 style={{ margin: 0 }}>💳 Recent Payments Collected</h3>
                        {hasPermission('fees') && (
                            <button className="btn btn-secondary" style={{ fontSize: '0.85rem' }}
                                onClick={() => navigate(`${basePath}/fees`)}>
                                View All →
                            </button>
                        )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {managerStats.recentPayments.map((p, i) => (
                            <div key={p.id || i} style={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                padding: '0.75rem 1rem', borderRadius: '8px',
                                background: 'var(--card-bg, rgba(0,0,0,0.03))',
                                border: '1px solid var(--border-color)'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <div style={{
                                        width: '40px', height: '40px', borderRadius: '50%',
                                        background: 'linear-gradient(135deg, #10b981, #059669)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        color: '#fff', fontWeight: '700', fontSize: '0.9rem'
                                    }}>
                                        {(p.Student?.User?.name || 'S')[0].toUpperCase()}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>{p.Student?.User?.name || 'Student'}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                            {p.payment_method} · {new Date(p.payment_date).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>
                                <div style={{ fontWeight: '700', color: '#10b981', fontSize: '1.05rem' }}>
                                    +₹{parseFloat(p.amount_paid || 0).toLocaleString()}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Upgrade Modal ── */}
            {showUpgradeModal && (
                <div className="modal-overlay" style={{ backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000 }}>
                    <div className="modal-content" style={{
                        maxWidth: '400px', width: '90%', textAlign: 'center',
                        backgroundColor: 'white', padding: '2rem', borderRadius: '12px',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
                    }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⭐</div>
                        <h2 style={{ color: '#1f2937', marginBottom: '0.5rem' }}>Upgrade Required</h2>
                        <p style={{ margin: '1rem 0', color: '#4b5563', lineHeight: '1.5' }}>
                            The <strong>{blockedFeature}</strong> feature is not available in your current plan ({planDetails?.plan?.name}).
                        </p>
                        <p style={{ color: '#6b7280', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                            Please upgrade your subscription to access this feature.
                        </p>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                            <button className="btn btn-secondary" onClick={() => setShowUpgradeModal(false)}>Close</button>
                            <button className="btn btn-primary" onClick={() => navigate("/pricing")}>Upgrade Now</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AdminDashboard;
