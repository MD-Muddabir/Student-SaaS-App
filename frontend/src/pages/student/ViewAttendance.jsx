import { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import api from "../../services/api";
import "../admin/Dashboard.css";

function ViewAttendance() {
    const { user } = useContext(AuthContext);
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [studentData, setStudentData] = useState(null);
    const [selectedSubject, setSelectedSubject] = useState(""); // Phase 2: subject filter
    const [subjects, setSubjects] = useState([]);
    const [filterLoading, setFilterLoading] = useState(false);

    useEffect(() => {
        fetchStudentIdAndAttendance();
    }, []);

    const fetchStudentIdAndAttendance = async () => {
        try {
            const studentRes = await api.get(`/students/me`);
            const stu = studentRes.data.data;
            setStudentData(stu);

            // Phase 2: Load subjects for full-course students
            if (stu.is_full_course && stu.Classes && stu.Classes.length > 0) {
                const classId = stu.Classes[0]?.id;
                if (classId) {
                    const subRes = await api.get(`/subjects?class_id=${classId}`);
                    setSubjects(subRes.data.data || []);
                }
            } else if (stu.Subjects && stu.Subjects.length > 0) {
                setSubjects(stu.Subjects);
            }

            const attRes = await api.get(`/attendance/student/${stu.id}/report`);
            setReport(attRes.data.data);
            setLoading(false);
        } catch (err) {
            console.error("Error fetching attendance:", err);
            setError(err.response?.data?.message || "Failed to load attendance report.");
            setLoading(false);
        }
    };

    // Phase 2: Filter attendance by selected subject
    const handleSubjectFilter = async (subjectId) => {
        setSelectedSubject(subjectId);
        if (!studentData) return;
        setFilterLoading(true);
        try {
            let url = `/attendance/student/${studentData.id}/report`;
            if (subjectId) url += `?subject_id=${subjectId}`;
            const attRes = await api.get(url);
            setReport(attRes.data.data);
        } catch (err) {
            console.error("Error filtering attendance:", err);
        } finally {
            setFilterLoading(false);
        }
    };

    if (loading) return <div className="dashboard-container">Loading your attendance...</div>;
    if (error) return <div className="dashboard-container" style={{ color: "red" }}>{error}</div>;

    // Phase 1: Use working_days (excludes holidays) for the percentage display
    const workingDays = report?.summary?.working_days || 0;
    const presentDays = report?.summary?.present_days || 0;
    const holidayDays = report?.summary?.holiday_days || 0;
    const absentDays = report?.summary?.absent_days || 0;
    const attendancePct = report?.summary?.attendance_percentage || 0;

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <div>
                    <h1>📋 My Attendance</h1>
                    <p>Track your daily attendance — working days exclude holidays</p>
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                    <Link to="/student/dashboard" className="btn btn-secondary">
                        ← Back
                    </Link>
                </div>
            </div>

            {/* Phase 2: Subject Filter for Full-Course / Enrolled Students */}
            {subjects.length > 0 && (
                <div className="card" style={{ marginBottom: "1.5rem", padding: "1rem 1.5rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
                        <span style={{ fontWeight: 600, color: "var(--text-muted)" }}>🔍 Filter by Subject:</span>
                        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                            <button
                                onClick={() => handleSubjectFilter("")}
                                className={`btn btn-sm ${selectedSubject === "" ? "btn-primary" : "btn-secondary"}`}
                            >
                                All Subjects
                            </button>
                            {subjects.map(sub => (
                                <button
                                    key={sub.id}
                                    onClick={() => handleSubjectFilter(sub.id)}
                                    className={`btn btn-sm ${selectedSubject === sub.id ? "btn-primary" : "btn-secondary"}`}
                                >
                                    {sub.name}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {report && (
                <div className="stats-grid" style={{ marginBottom: "2rem" }}>
                    {/* Phase 1: "Working Days" excludes holidays */}
                    <div className="stat-card">
                        <div className="stat-icon">🏢</div>
                        <div className="stat-content">
                            <h3>{workingDays}</h3>
                            <p>Working Days</p>
                            <small style={{ color: "var(--text-muted)" }}>excl. {holidayDays} holiday{holidayDays !== 1 ? 's' : ''}</small>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon">✅</div>
                        <div className="stat-content">
                            <h3>{presentDays}</h3>
                            <p>Days Present</p>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon">❌</div>
                        <div className="stat-content">
                            <h3>{absentDays}</h3>
                            <p>Days Absent</p>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon">🏖️</div>
                        <div className="stat-content">
                            <h3>{holidayDays}</h3>
                            <p>Holidays</p>
                        </div>
                    </div>
                    <div className="stat-card" style={{ borderLeft: `4px solid ${attendancePct >= 75 ? '#10b981' : '#ef4444'}` }}>
                        <div className="stat-icon">📊</div>
                        <div className="stat-content">
                            <h3 style={{ color: attendancePct >= 75 ? '#10b981' : '#ef4444' }}>{attendancePct}%</h3>
                            <p>Attendance %</p>
                            <small style={{ color: attendancePct >= 75 ? '#10b981' : '#ef4444', fontWeight: 600 }}>
                                {attendancePct >= 75 ? '✓ Good standing' : '⚠ Below 75%'}
                            </small>
                        </div>
                    </div>
                </div>
            )}

            <div className="card">
                <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h3 className="card-title">
                        Attendance Records
                        {selectedSubject && subjects.find(s => s.id === selectedSubject) && (
                            <span style={{ marginLeft: "0.75rem", fontSize: "0.85rem", fontWeight: 400, color: "var(--text-muted)" }}>
                                — {subjects.find(s => s.id === selectedSubject)?.name}
                            </span>
                        )}
                    </h3>
                    {filterLoading && <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Loading...</span>}
                </div>
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Subject / Class</th>
                                <th>Status</th>
                                <th>Remarks</th>
                            </tr>
                        </thead>
                        <tbody>
                            {!report || report.records.length === 0 ? (
                                <tr>
                                    <td colSpan="4" style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>
                                        {selectedSubject ? "No attendance records for this subject." : "No attendance records available."}
                                    </td>
                                </tr>
                            ) : (
                                report.records.map((record) => (
                                    <tr key={record.id}>
                                        <td>{new Date(record.date).toLocaleDateString()}</td>
                                        <td>{record.Subject?.name || record.Class?.name || "All Subjects"}</td>
                                        <td>
                                            <span style={{ textTransform: "capitalize" }} className={`badge badge-${record.status === "present" ? "success" : record.status === "absent" ? "error" : record.status === "holiday" ? "info" : "warning"}`}>
                                                {record.status}
                                            </span>
                                        </td>
                                        <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{record.remarks || "—"}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default ViewAttendance;
