import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import ThemeSelector from "../../components/ThemeSelector";
import { useNavigate } from "react-router-dom";
import * as parentService from "../../services/parent.service";
import "./Dashboard.css";

function ParentDashboard() {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedStudent, setSelectedStudent] = useState(null);

    // Detailed states
    const [attendance, setAttendance] = useState(null);
    const [results, setResults] = useState([]);
    const [fees, setFees] = useState([]);
    const [activeTab, setActiveTab] = useState("overview");
    const [detailLoading, setDetailLoading] = useState(false);

    useEffect(() => {
        fetchDashboard();
    }, []);

    const fetchDashboard = async () => {
        try {
            const data = await parentService.getParentDashboard();
            const loadedStudents = data.data.students || [];
            setStudents(loadedStudents);
            if (loadedStudents.length > 0) {
                await selectStudent(loadedStudents[0]);
            }
        } catch (error) {
            console.error("Error fetching parent dashboard:", error);
        } finally {
            setLoading(false);
        }
    };

    const selectStudent = async (student) => {
        setSelectedStudent(student);
        setActiveTab("overview");
        setDetailLoading(true);
        try {
            const [attData, resData, feeData] = await Promise.all([
                parentService.getLinkedStudentAttendance(student.id),
                parentService.getLinkedStudentResults(student.id),
                parentService.getLinkedStudentFees(student.id)
            ]);
            setAttendance(attData.data);
            setResults(resData.data || []);
            setFees(feeData.data || []);
        } catch (error) {
            console.error("Error fetching details for student", error);
        } finally {
            setDetailLoading(false);
        }
    };

    // Phase 6: Compute fee breakdown
    const pendingFees = fees.filter(f => f.status === 'pending' || f.status === 'partial');
    const paidFees = fees.filter(f => f.status === 'paid');
    const totalPendingAmount = pendingFees.reduce((acc, f) => acc + parseFloat(f.due_amount || 0), 0);
    const totalPaidAmount = fees.reduce((acc, f) => acc + parseFloat(f.paid_amount || 0), 0);
    const totalFees = fees.reduce((acc, f) => acc + parseFloat(f.final_amount || 0), 0);

    // Attendance percentage
    const attPct = attendance?.summary?.attendance_percentage || 0;

    const TODAY_STR = new Date().toISOString().split('T')[0];
    const reminders = fees.filter(f => {
        if (!f.reminder_date || f.status === 'paid') return false;
        const remDate = new Date(f.reminder_date);
        const today = new Date(TODAY_STR);
        // Start showing 1 day before (diff <= 1 day)
        const diffDays = (remDate - today) / (1000 * 60 * 60 * 24);
        return diffDays <= 1;
    });

    if (loading) {
        return (
            <div className="parent-dashboard-container" style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
                <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>👨‍👩‍👧</div>
                    <p>Loading your dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="parent-dashboard-container">
            {/* Header */}
            <header className="dashboard-header">
                <div>
                    <h1>👨‍👩‍👧 Parent Dashboard</h1>
                    <p>Welcome back, <strong>{user?.name}</strong>! Monitoring your child's progress.</p>
                </div>
                <div className="dashboard-header-right">
                    <ThemeSelector />
                    <button onClick={logout} className="btn-logout">Logout</button>
                </div>
            </header>

            {/* Student Selector */}
            <div className="student-selector">
                {students.length === 0 ? (
                    <div style={{ color: "var(--text-secondary)", padding: "1rem" }}>No students linked to your account.</div>
                ) : students.map(student => (
                    <div
                        key={student.id}
                        className="student-card-btn"
                        onClick={() => selectStudent(student)}
                        style={{
                            background: selectedStudent?.id === student.id
                                ? "linear-gradient(135deg,#4f46e5,#7c3aed)"
                                : undefined,
                            color: selectedStudent?.id === student.id ? "#fff" : undefined,
                            borderColor: selectedStudent?.id === student.id ? "#4f46e5" : undefined,
                            boxShadow: selectedStudent?.id === student.id ? "0 8px 24px rgba(79,70,229,0.35)" : undefined
                        }}
                    >
                        <span className="icon">🎓</span>
                        <div className="details">
                            <h3>{student.User?.name}</h3>
                            <small>Roll: {student.roll_number} | {student.Classes?.[0]?.name || "—"}</small>
                        </div>
                    </div>
                ))}
            </div>

            {selectedStudent ? (
                <div>
                    {/* Tabs */}
                    <div className="tabs-container">
                        {[
                            { id: 'overview', label: '🏠 Overview' },
                            { id: 'attendance', label: '📋 Attendance' },
                            { id: 'marks', label: '📈 Marks' },
                            { id: 'fees', label: '💳 Fees' },
                            { id: 'timetable', label: '📅 Timetable' },
                            { id: 'chat', label: '💬 Chat' }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {detailLoading ? (
                        <div className="dashboard-card" style={{ textAlign: "center", padding: "3rem", color: "var(--text-secondary)" }}>
                            Loading data...
                        </div>
                    ) : (
                        <>
                            {/* ═══ OVERVIEW TAB ═══ */}
                            {activeTab === 'overview' && (
                                <>
                                    {/* Reminder Alerts */}
                                    {reminders.length > 0 && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
                                            {reminders.map(rem => (
                                                <div key={`rem-${rem.id}`} style={{
                                                    background: 'linear-gradient(135deg,rgba(245,158,11,0.12),rgba(245,158,11,0.05))',
                                                    border: '1.5px solid rgba(245,158,11,0.5)', borderRadius: '12px',
                                                    padding: '0.85rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem'
                                                }}>
                                                    <span style={{ fontSize: '1.25rem' }}>⚠️</span>
                                                    <div style={{ color: '#d97706', fontWeight: '600', fontSize: '0.95rem' }}>
                                                        {selectedStudent?.User?.name} and This student Fees Pending. (Reminder Date: {new Date(rem.reminder_date).toLocaleDateString()})
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    <div className="stats-grid">
                                        {/* Attendance */}
                                        <div className="stat-card" style={{ borderLeft: `4px solid ${attPct >= 75 ? '#10b981' : '#ef4444'}` }}>
                                            <div className="stat-icon" style={{ background: attPct >= 75 ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)' }}>📋</div>
                                            <div className="info">
                                                <h3 style={{ color: attPct >= 75 ? '#10b981' : '#ef4444' }}>{attPct}%</h3>
                                                <p>Attendance</p>
                                                <small>{attendance?.summary?.present_days || 0} / {attendance?.summary?.working_days || 0} working days</small>
                                            </div>
                                        </div>

                                        {/* Classes Enrolled */}
                                        <div className="stat-card" style={{ borderLeft: '4px solid #6366f1' }}>
                                            <div className="stat-icon" style={{ background: 'rgba(99,102,241,0.1)' }}>📚</div>
                                            <div className="info">
                                                <h3>{selectedStudent?.Classes?.length || 0}</h3>
                                                <p>Classes Enrolled</p>
                                                <small>{selectedStudent?.is_full_course ? 'Full Course Student' : 'Individual Subjects'}</small>
                                            </div>
                                        </div>

                                        {/* Phase 6: Pending Fees */}
                                        <div className="stat-card" style={{ borderLeft: '4px solid #ef4444' }}>
                                            <div className="stat-icon" style={{ background: 'rgba(239,68,68,0.1)' }}>⏳</div>
                                            <div className="info">
                                                <h3 style={{ color: '#ef4444' }}>₹{totalPendingAmount.toLocaleString()}</h3>
                                                <p>Pending Fees</p>
                                                <small>{pendingFees.length} fee{pendingFees.length !== 1 ? 's' : ''} pending</small>
                                            </div>
                                        </div>

                                        {/* Phase 6: Paid Fees */}
                                        <div className="stat-card" style={{ borderLeft: '4px solid #10b981' }}>
                                            <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.1)' }}>✅</div>
                                            <div className="info">
                                                <h3 style={{ color: '#10b981' }}>₹{totalPaidAmount.toLocaleString()}</h3>
                                                <p>Paid Fees</p>
                                                <small>of ₹{totalFees.toLocaleString()} total</small>
                                            </div>
                                        </div>

                                        {/* Total Marks */}
                                        <div className="stat-card" style={{ borderLeft: '4px solid #a855f7' }}>
                                            <div className="stat-icon" style={{ background: 'rgba(168,85,247,0.1)' }}>🎯</div>
                                            <div className="info">
                                                <h3 style={{ color: '#a855f7' }}>{results.length}</h3>
                                                <p>Exam Results</p>
                                                <small>{results.filter(r => r.remarks === 'Pass').length} passed</small>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Quick Actions */}
                                    <div className="dashboard-card">
                                        <h3>⚡ Quick Actions</h3>
                                        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                                            {[
                                                { label: "📅 View Timetable", tab: "timetable", color: "#6366f1" },
                                                { label: "📋 View Attendance", tab: "attendance", color: "#10b981" },
                                                { label: "💬 Chat with Faculty", action: () => navigate('/parent/chat'), color: "#f59e0b" },
                                                { label: "💳 View Fees", tab: "fees", color: "#ef4444" }
                                            ].map((a, i) => (
                                                <button
                                                    key={i}
                                                    onClick={a.action || (() => setActiveTab(a.tab))}
                                                    style={{
                                                        padding: "0.65rem 1.25rem", borderRadius: "10px", border: `2px solid ${a.color}`,
                                                        background: `${a.color}15`, color: a.color, fontWeight: "700",
                                                        cursor: "pointer", fontSize: "0.9rem", transition: "all 0.2s"
                                                    }}
                                                    onMouseEnter={e => { e.target.style.background = a.color; e.target.style.color = "#fff"; }}
                                                    onMouseLeave={e => { e.target.style.background = `${a.color}15`; e.target.style.color = a.color; }}
                                                >
                                                    {a.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* ═══ ATTENDANCE TAB ═══ */}
                            {activeTab === 'attendance' && (
                                <div className="dashboard-card">
                                    <h3>📋 Attendance Records — {selectedStudent?.User?.name}</h3>

                                    {/* Summary */}
                                    {attendance?.summary && (
                                        <div className="stats-grid" style={{ marginBottom: "1.5rem" }}>
                                            <div className="stat-card">
                                                <div className="stat-icon">🏢</div>
                                                <div className="info">
                                                    <h3>{attendance.summary.working_days || 0}</h3>
                                                    <p>Working Days</p>
                                                    <small>excl. {attendance.summary.holiday_days || 0} holidays</small>
                                                </div>
                                            </div>
                                            <div className="stat-card">
                                                <div className="stat-icon">✅</div>
                                                <div className="info">
                                                    <h3 style={{ color: '#10b981' }}>{attendance.summary.present_days || 0}</h3>
                                                    <p>Present</p>
                                                </div>
                                            </div>
                                            <div className="stat-card">
                                                <div className="stat-icon">❌</div>
                                                <div className="info">
                                                    <h3 style={{ color: '#ef4444' }}>{attendance.summary.absent_days || 0}</h3>
                                                    <p>Absent</p>
                                                </div>
                                            </div>
                                            <div className="stat-card">
                                                <div className="stat-icon">📊</div>
                                                <div className="info">
                                                    <h3 style={{ color: attPct >= 75 ? '#10b981' : '#ef4444' }}>{attPct}%</h3>
                                                    <p>Attendance %</p>
                                                    <small style={{ color: attPct >= 75 ? '#10b981' : '#ef4444', fontWeight: 700 }}>
                                                        {attPct >= 75 ? '✓ Good' : '⚠ Below 75%'}
                                                    </small>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Phase 7: Attendance table with In/Out timing (using created_at as proxy) */}
                                    {attendance?.records?.length > 0 ? (
                                        <table className="data-table">
                                            <thead>
                                                <tr>
                                                    <th>Date</th>
                                                    <th>Subject / Class</th>
                                                    <th>In Time</th>
                                                    <th>Status</th>
                                                    <th>Marked By</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {attendance.records.map(record => (
                                                    <tr key={record.id}>
                                                        <td style={{ fontWeight: 600 }}>{new Date(record.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                                                        <td>{record.Subject?.name || record.Class?.name || 'All Subjects'}</td>
                                                        <td style={{ color: '#10b981', fontWeight: 600 }}>
                                                            {record.time_in ? record.time_in.substring(0, 5) : '—'}
                                                            {record.is_late && <span style={{ marginLeft: '0.4rem', color: '#f59e0b', fontSize: '0.75rem' }}>+{record.late_by_minutes}m late</span>}
                                                        </td>
                                                        <td>
                                                            <span className={`status-badge status-${record.status}`}>
                                                                {record.status?.replace('_', ' ')}
                                                            </span>
                                                        </td>
                                                        <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                                            {record.marked_by_type === 'biometric' ? '🔐 Biometric' :
                                                                record.marked_by_type === 'mobile_otp' ? '📱 OTP' :
                                                                    record.marked_by_type === 'qr_code' ? '📸 QR Scan' : '📝 Manual'}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    ) : (
                                        <p>No attendance records found for {selectedStudent?.User?.name}.</p>
                                    )}
                                </div>
                            )}

                            {/* ═══ MARKS TAB ═══ */}
                            {activeTab === 'marks' && (
                                <div className="dashboard-card">
                                    <h3>📈 Exam Results — {selectedStudent?.User?.name}</h3>
                                    {results?.length > 0 ? (
                                        <div style={{ marginTop: "1rem" }}>
                                            {results.map(mark => (
                                                <div key={mark.id} className="result-card">
                                                    <div className="result-card-left">
                                                        <strong>{mark.Exam?.name}</strong>
                                                        <p>{mark.Subject?.name}</p>
                                                        {mark.Exam?.exam_date && (
                                                            <small style={{ color: 'var(--text-muted)' }}>
                                                                {new Date(mark.Exam.exam_date).toLocaleDateString()}
                                                            </small>
                                                        )}
                                                    </div>
                                                    <div className="result-card-right">
                                                        <h2>{mark.marks_obtained} / {mark.total_marks}</h2>
                                                        <p className={mark.remarks === "Pass" ? "pass" : "fail"}>
                                                            {mark.remarks}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p>No exam results found for {selectedStudent?.User?.name}.</p>
                                    )}
                                </div>
                            )}

                            {/* ═══ FEES TAB ═══ */}
                            {activeTab === 'fees' && (
                                <div className="dashboard-card">
                                    <h3>💳 Fee Records — {selectedStudent?.User?.name}</h3>

                                    {/* Phase 6: Fee summary badges */}
                                    <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
                                        <div style={{
                                            padding: "0.85rem 1.5rem", borderRadius: "12px",
                                            background: "rgba(239,68,68,0.1)", border: "1.5px solid rgba(239,68,68,0.4)",
                                            color: "#ef4444"
                                        }}>
                                            <div style={{ fontWeight: 800, fontSize: "1.4rem" }}>₹{totalPendingAmount.toLocaleString()}</div>
                                            <div style={{ fontSize: "0.8rem", fontWeight: 600 }}>⏳ Total Pending</div>
                                        </div>
                                        <div style={{
                                            padding: "0.85rem 1.5rem", borderRadius: "12px",
                                            background: "rgba(16,185,129,0.1)", border: "1.5px solid rgba(16,185,129,0.4)",
                                            color: "#10b981"
                                        }}>
                                            <div style={{ fontWeight: 800, fontSize: "1.4rem" }}>₹{totalPaidAmount.toLocaleString()}</div>
                                            <div style={{ fontSize: "0.8rem", fontWeight: 600 }}>✅ Total Paid</div>
                                        </div>
                                        <div style={{
                                            padding: "0.85rem 1.5rem", borderRadius: "12px",
                                            background: "rgba(99,102,241,0.1)", border: "1.5px solid rgba(99,102,241,0.4)",
                                            color: "#6366f1"
                                        }}>
                                            <div style={{ fontWeight: 800, fontSize: "1.4rem" }}>₹{totalFees.toLocaleString()}</div>
                                            <div style={{ fontSize: "0.8rem", fontWeight: 600 }}>💰 Total Fees</div>
                                        </div>
                                    </div>

                                    {fees?.length > 0 ? (
                                        <table className="data-table">
                                            <thead>
                                                <tr>
                                                    <th>Fee Type</th>
                                                    <th>Original</th>
                                                    <th>Discount</th>
                                                    <th>Final</th>
                                                    <th>Paid</th>
                                                    <th>Due</th>
                                                    <th>Due Date</th>
                                                    <th>Reminder</th>
                                                    <th>Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {fees.map(fee => (
                                                    <tr key={fee.id}>
                                                        <td><strong>{fee.FeesStructure?.fee_type || 'Fee'}</strong></td>
                                                        <td>₹{parseFloat(fee.original_amount || 0).toLocaleString()}</td>
                                                        <td style={{ color: '#a855f7' }}>-₹{parseFloat(fee.discount_amount || 0).toLocaleString()}</td>
                                                        <td><strong>₹{parseFloat(fee.final_amount || 0).toLocaleString()}</strong></td>
                                                        <td style={{ color: '#10b981' }}>₹{parseFloat(fee.paid_amount || 0).toLocaleString()}</td>
                                                        <td style={{ color: '#ef4444', fontWeight: 700 }}>₹{parseFloat(fee.due_amount || 0).toLocaleString()}</td>
                                                        <td>{fee.FeesStructure?.due_date ? new Date(fee.FeesStructure.due_date).toLocaleDateString() : '—'}</td>
                                                        <td>
                                                            {fee.reminder_date ? (
                                                                <span style={{
                                                                    color: fee.reminder_date <= TODAY_STR ? '#ef4444' : '#f59e0b',
                                                                    fontWeight: 700
                                                                }}>
                                                                    {new Date(fee.reminder_date).toLocaleDateString()}
                                                                </span>
                                                            ) : '—'}
                                                        </td>
                                                        <td>
                                                            <span className={`status-badge status-${fee.status === 'paid' ? 'paid' : fee.status === 'partial' ? 'partial' : 'pending'}`}>
                                                                {fee.status}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    ) : (
                                        <p>No fee records found for {selectedStudent?.User?.name}.</p>
                                    )}
                                </div>
                            )}

                            {/* ═══ TIMETABLE TAB ═══ */}
                            {activeTab === 'timetable' && (
                                <div className="dashboard-card" style={{ textAlign: "center", padding: "3rem" }}>
                                    <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>📅</div>
                                    <h3 style={{ justifyContent: "center" }}>Class Timetable</h3>
                                    <p>View the weekly schedule and subjects for {selectedStudent?.User?.name}.</p>
                                    <button
                                        onClick={() => navigate('/parent/timetable')}
                                        style={{
                                            marginTop: "1.5rem", padding: "0.85rem 2rem", borderRadius: "10px",
                                            background: "linear-gradient(135deg,#4f46e5,#7c3aed)", color: "#fff",
                                            border: "none", fontWeight: "700", fontSize: "1rem", cursor: "pointer",
                                            boxShadow: "0 4px 16px rgba(79,70,229,0.35)"
                                        }}
                                    >
                                        📅 Open Full Timetable →
                                    </button>
                                </div>
                            )}

                            {/* ═══ CHAT TAB — Phase 8 ═══ */}
                            {activeTab === 'chat' && (
                                <div className="dashboard-card" style={{ textAlign: "center", padding: "3rem" }}>
                                    <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>💬</div>
                                    <h3 style={{ justifyContent: "center" }}>Direct Faculty Communication</h3>
                                    <p>
                                        Send messages directly to your child's faculty members.<br />
                                        <small style={{ color: "var(--text-muted)" }}>Faculty will see your name as "<strong>{user?.name} (Parent of {selectedStudent?.User?.name})</strong>"</small>
                                    </p>
                                    <button
                                        onClick={() => navigate('/parent/chat')}
                                        style={{
                                            marginTop: "1.5rem", padding: "0.85rem 2rem", borderRadius: "10px",
                                            background: "linear-gradient(135deg,#f59e0b,#d97706)", color: "#fff",
                                            border: "none", fontWeight: "700", fontSize: "1rem", cursor: "pointer",
                                            boxShadow: "0 4px 16px rgba(245,158,11,0.35)"
                                        }}
                                    >
                                        💬 Open Chat →
                                    </button>
                                </div>
                            )}
                        </>
                    )
                    }
                </div >
            ) : (
                <div className="dashboard-card" style={{ textAlign: "center", color: "var(--text-secondary)", padding: "3rem" }}>
                    <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>👨‍👩‍👧</div>
                    <p>No students linked to your account. Please contact administration.</p>
                </div>
            )}
        </div >
    );
}

export default ParentDashboard;
