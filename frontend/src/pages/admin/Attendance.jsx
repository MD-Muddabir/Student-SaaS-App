/**
 * Attendance Management Page
 * Professional implementation with bulk marking and reports
 */

import { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import { AuthContext } from "../../context/AuthContext";
import "./Dashboard.css";

function Attendance() {
    const { user } = useContext(AuthContext);
    const [classes, setClasses] = useState([]);
    const [selectedClass, setSelectedClass] = useState("");
    const [subjects, setSubjects] = useState([]);
    const [selectedSubject, setSelectedSubject] = useState("");
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [students, setStudents] = useState([]);
    const [attendanceData, setAttendanceData] = useState({});
    const [loading, setLoading] = useState(false);
    const [dashboardStats, setDashboardStats] = useState(null);
    const [showReport, setShowReport] = useState(false);
    const [reportData, setReportData] = useState(null);

    useEffect(() => {
        fetchClasses();
        fetchDashboardStats();
    }, []);

    useEffect(() => {
        if (selectedClass) {
            fetchSubjects();
        } else {
            setSubjects([]);
            setSelectedSubject("");
        }
    }, [selectedClass]);

    useEffect(() => {
        if (selectedClass && selectedSubject && selectedDate) {
            fetchClassAttendance();
        } else {
            setStudents([]);
        }
    }, [selectedClass, selectedSubject, selectedDate]);

    const fetchClasses = async () => {
        try {
            const response = await api.get("/classes");
            setClasses(response.data.data || []);
        } catch (error) {
            console.error("Error fetching classes:", error);
        }
    };

    const fetchSubjects = async () => {
        try {
            const response = await api.get(`/subjects?class_id=${selectedClass}`);
            setSubjects(response.data.data || []);
            setSelectedSubject("");
        } catch (error) {
            console.error("Error fetching subjects:", error);
        }
    };

    const fetchDashboardStats = async () => {
        try {
            const response = await api.get("/attendance/dashboard");
            setDashboardStats(response.data.data);
        } catch (error) {
            console.error("Error fetching dashboard stats:", error);
        }
    };

    const fetchClassAttendance = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/attendance/class/${selectedClass}/subject/${selectedSubject}/date/${selectedDate}`);
            setStudents(response.data.data || []);

            // Initialize attendance data
            const initialData = {};
            response.data.data.forEach(student => {
                if (student.attendance) {
                    initialData[student.student_id] = {
                        status: student.attendance.status,
                        remarks: student.attendance.remarks || ""
                    };
                } else {
                    initialData[student.student_id] = {
                        status: "present",
                        remarks: ""
                    };
                }
            });
            setAttendanceData(initialData);
        } catch (error) {
            console.error("Error fetching attendance:", error);
            alert("Error loading attendance data");
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = (studentId, status) => {
        setAttendanceData(prev => ({
            ...prev,
            [studentId]: {
                ...prev[studentId],
                status
            }
        }));
    };

    const handleRemarksChange = (studentId, remarks) => {
        setAttendanceData(prev => ({
            ...prev,
            [studentId]: {
                ...prev[studentId],
                remarks
            }
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!selectedClass || !selectedSubject || !selectedDate) {
            alert("Please select class, subject and date");
            return;
        }

        try {
            const pendingStudents = students.filter(s => !s.attendance);

            const attendance_data = pendingStudents.map(student => ({
                student_id: student.student_id,
                status: attendanceData[student.student_id].status,
                remarks: attendanceData[student.student_id].remarks
            }));

            if (attendance_data.length === 0) {
                alert("No pending students to submit.");
                return;
            }

            await api.post("/attendance/bulk", {
                class_id: parseInt(selectedClass),
                subject_id: parseInt(selectedSubject),
                date: selectedDate,
                attendance_data
            });

            alert("Attendance marked successfully!");
            fetchDashboardStats();
            fetchClassAttendance();
        } catch (error) {
            const errorMessage = error.response?.data?.message || "Error marking attendance";
            alert(errorMessage);
        }
    };

    const handleViewReport = async () => {
        if (!selectedClass) {
            alert("Please select a class");
            return;
        }

        try {
            const response = await api.get(`/attendance/class/${selectedClass}/summary`);
            setReportData(response.data);
            setShowReport(true);
        } catch (error) {
            alert("Error loading report");
        }
    };

    const markAllPresent = () => {
        const newData = { ...attendanceData };
        students.filter(s => !s.attendance).forEach(student => {
            newData[student.student_id] = {
                status: "present",
                remarks: attendanceData[student.student_id]?.remarks || ""
            };
        });
        setAttendanceData(newData);
    };

    const markAllAbsent = () => {
        const newData = { ...attendanceData };
        students.filter(s => !s.attendance).forEach(student => {
            newData[student.student_id] = {
                status: "absent",
                remarks: attendanceData[student.student_id]?.remarks || ""
            };
        });
        setAttendanceData(newData);
    };

    const markAllHoliday = () => {
        const newData = { ...attendanceData };
        students.filter(s => !s.attendance).forEach(student => {
            newData[student.student_id] = {
                status: "holiday",
                remarks: attendanceData[student.student_id]?.remarks || ""
            };
        });
        setAttendanceData(newData);
    };

    const pendingStudents = students.filter(s => !s.attendance);
    const markedStudents = students.filter(s => s.attendance);

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <div>
                    <h1>📋 Attendance Management</h1>
                    <p>Mark and track student attendance</p>
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                    <Link to="/admin/dashboard" className="btn btn-secondary">
                        ← Back
                    </Link>
                    {selectedClass && (
                        <button onClick={handleViewReport} className="btn btn-primary">
                            📊 View Report
                        </button>
                    )}
                </div>
            </div>

            {/* Dashboard Stats */}
            {dashboardStats && (
                <div className="stats-grid" style={{ marginBottom: "2rem" }}>
                    <div className="stat-card">
                        <div className="stat-icon">📅</div>
                        <div className="stat-content">
                            <h3>{dashboardStats.today.percentage}%</h3>
                            <p>Today's Attendance</p>
                            <small>{dashboardStats.today.present}/{dashboardStats.today.total} present</small>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon">📊</div>
                        <div className="stat-content">
                            <h3>{dashboardStats.this_month.percentage}%</h3>
                            <p>This Month Average</p>
                            <small>{dashboardStats.this_month.present}/{dashboardStats.this_month.total} present</small>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon">⚠️</div>
                        <div className="stat-content">
                            <h3>{dashboardStats.low_attendance_count}</h3>
                            <p>Below 75%</p>
                            <small>Students at risk</small>
                        </div>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="card" style={{ marginBottom: "2rem" }}>
                <div style={{ padding: "1.5rem" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
                        <div className="form-group">
                            <label className="form-label">Select Class *</label>
                            <select
                                className="form-select"
                                value={selectedClass}
                                onChange={(e) => setSelectedClass(e.target.value)}
                            >
                                <option value="">Choose a class</option>
                                {classes.map((cls) => (
                                    <option key={cls.id} value={cls.id}>
                                        {cls.name} {cls.section && `- ${cls.section}`}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Select Subject *</label>
                            <select
                                className="form-select"
                                value={selectedSubject}
                                onChange={(e) => setSelectedSubject(e.target.value)}
                                disabled={!selectedClass}
                            >
                                <option value="">Choose a subject</option>
                                {subjects.map((sub) => (
                                    <option key={sub.id} value={sub.id}>
                                        {sub.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Select Date *</label>
                            <input
                                type="date"
                                className="form-input"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                max={new Date().toISOString().split('T')[0]}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Attendance Marking - Pending */}
            {selectedClass && selectedSubject && selectedDate && (
                <div className="card" style={{ marginBottom: "2rem" }}>
                    <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <h3 className="card-title" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            ⏳ Pending Students ({pendingStudents.length} students)
                        </h3>
                        {pendingStudents.length > 0 && (
                            <div style={{ display: "flex", gap: "10px" }}>
                                <button onClick={markAllPresent} type="button" className="btn btn-sm btn-success">
                                    ✓ All Present
                                </button>
                                <button onClick={markAllAbsent} type="button" className="btn btn-sm btn-danger">
                                    × All Absent
                                </button>
                                <button onClick={markAllHoliday} type="button" className="btn btn-sm" style={{ backgroundColor: "#3b82f6", color: "white" }}>
                                    🏖️ Holiday
                                </button>
                            </div>
                        )}
                    </div>

                    {loading ? (
                        <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>Loading...</div>
                    ) : (
                        <form onSubmit={handleSubmit}>
                            <div className="table-container" style={{ padding: "0" }}>
                                <table className="table" style={{ width: "100%", borderCollapse: "collapse" }}>
                                    <thead style={{ backgroundColor: "var(--bg-secondary)", borderBottom: "1px solid var(--border-color)" }}>
                                        <tr>
                                            <th style={{ padding: "15px", textAlign: "left" }}>ROLL NO</th>
                                            <th style={{ padding: "15px", textAlign: "left" }}>STUDENT NAME</th>
                                            <th style={{ padding: "15px", textAlign: "left" }}>STATUS</th>
                                            <th style={{ padding: "15px", textAlign: "left" }}>REMARKS</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pendingStudents.length === 0 ? (
                                            <tr>
                                                <td colSpan="4" style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)", fontWeight: "bold" }}>
                                                    Attendance already submitted for all students today. ✅
                                                </td>
                                            </tr>
                                        ) : (
                                            pendingStudents.map((student) => (
                                                <tr key={student.student_id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                                                    <td style={{ padding: "15px" }}>
                                                        <span style={{ fontWeight: "bold", fontSize: "0.9rem", color: "var(--text-color)" }}>
                                                            {student.roll_number}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: "15px" }}>
                                                        <strong style={{ color: "var(--text-color)" }}>{student.name}</strong>
                                                        <br />
                                                        <small style={{ color: "var(--text-muted)" }}>{student.email}</small>
                                                    </td>
                                                    <td style={{ padding: "15px" }}>
                                                        <div style={{ display: "flex", gap: "15px" }}>
                                                            <label style={{ display: "flex", alignItems: "center", gap: "5px", cursor: "pointer" }}>
                                                                <input
                                                                    type="radio"
                                                                    name={`status-${student.student_id}`}
                                                                    value="present"
                                                                    checked={attendanceData[student.student_id]?.status === "present"}
                                                                    onChange={() => handleStatusChange(student.student_id, "present")}
                                                                />
                                                                <span style={{ color: "#10b981", fontWeight: "bold" }}>Present</span>
                                                            </label>
                                                            <label style={{ display: "flex", alignItems: "center", gap: "5px", cursor: "pointer" }}>
                                                                <input
                                                                    type="radio"
                                                                    name={`status-${student.student_id}`}
                                                                    value="absent"
                                                                    checked={attendanceData[student.student_id]?.status === "absent"}
                                                                    onChange={() => handleStatusChange(student.student_id, "absent")}
                                                                />
                                                                <span style={{ color: "#ef4444", fontWeight: "bold" }}>Absent</span>
                                                            </label>
                                                            <label style={{ display: "flex", alignItems: "center", gap: "5px", cursor: "pointer" }}>
                                                                <input
                                                                    type="radio"
                                                                    name={`status-${student.student_id}`}
                                                                    value="late"
                                                                    checked={attendanceData[student.student_id]?.status === "late"}
                                                                    onChange={() => handleStatusChange(student.student_id, "late")}
                                                                />
                                                                <span style={{ color: "#f59e0b", fontWeight: "bold" }}>Late</span>
                                                            </label>
                                                            <label style={{ display: "flex", alignItems: "center", gap: "5px", cursor: "pointer" }}>
                                                                <input
                                                                    type="radio"
                                                                    name={`status-${student.student_id}`}
                                                                    value="holiday"
                                                                    checked={attendanceData[student.student_id]?.status === "holiday"}
                                                                    onChange={() => handleStatusChange(student.student_id, "holiday")}
                                                                />
                                                                <span style={{ color: "#3b82f6", fontWeight: "bold" }}>Holiday</span>
                                                            </label>
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: "15px" }}>
                                                        <input
                                                            type="text"
                                                            className="form-input"
                                                            placeholder="Optional remarks"
                                                            value={attendanceData[student.student_id]?.remarks || ""}
                                                            onChange={(e) => handleRemarksChange(student.student_id, e.target.value)}
                                                            style={{ minWidth: "200px", backgroundColor: "var(--bg-secondary)" }}
                                                        />
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {pendingStudents.length > 0 && (
                                <div style={{ padding: "1.5rem", borderTop: "1px solid var(--border-color)", textAlign: "right", backgroundColor: "var(--bg-secondary)" }}>
                                    <button type="submit" className="btn btn-primary" style={{ minWidth: "200px", padding: "0.8rem", fontSize: "1rem", backgroundColor: "#4f46e5", border: "none" }}>
                                        ✓ Submit Attendance
                                    </button>
                                </div>
                            )}
                        </form>
                    )}
                </div>
            )}

            {/* Attendance Marking - Marked */}
            {selectedClass && selectedSubject && selectedDate && markedStudents.length > 0 && (
                <div className="card">
                    <div className="card-header" style={{ padding: "1.5rem", borderBottom: "1px solid var(--border-color)" }}>
                        <h3 className="card-title" style={{ display: "flex", alignItems: "center", gap: "10px", color: "#10b981" }}>
                            ✅ Marked Attendance ({markedStudents.length} students)
                        </h3>
                    </div>

                    <div className="table-container" style={{ padding: "0" }}>
                        <table className="table" style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead style={{ backgroundColor: "var(--bg-secondary)", borderBottom: "1px solid var(--border-color)" }}>
                                <tr>
                                    <th style={{ padding: "15px", textAlign: "left", fontSize: "0.85rem", textTransform: "uppercase", color: "var(--text-muted)" }}>ROLL NO</th>
                                    <th style={{ padding: "15px", textAlign: "left", fontSize: "0.85rem", textTransform: "uppercase", color: "var(--text-muted)" }}>STUDENT NAME</th>
                                    <th style={{ padding: "15px", textAlign: "left", fontSize: "0.85rem", textTransform: "uppercase", color: "var(--text-muted)" }}>MARKED STATUS</th>
                                    <th style={{ padding: "15px", textAlign: "left", fontSize: "0.85rem", textTransform: "uppercase", color: "var(--text-muted)" }}>REMARKS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {markedStudents.map((student) => (
                                    <tr key={student.student_id} style={{ borderBottom: "1px solid var(--border-color)", backgroundColor: "rgba(16, 185, 129, 0.02)" }}>
                                        <td style={{ padding: "15px" }}>
                                            <span style={{ fontWeight: "bold", fontSize: "0.9rem", color: "var(--text-color)" }}>
                                                {student.roll_number}
                                            </span>
                                        </td>
                                        <td style={{ padding: "15px" }}>
                                            <strong style={{ color: "var(--text-color)" }}>{student.name}</strong>
                                            <br />
                                            <small style={{ color: "var(--text-muted)", display: "block", marginBottom: "5px" }}>{student.email}</small>
                                            <span style={{ fontSize: "0.75rem", background: "rgba(16, 185, 129, 0.1)", color: "#10b981", padding: "2px 8px", borderRadius: "10px", border: "1px solid rgba(16, 185, 129, 0.2)" }}>✓ Saved in DB</span>
                                        </td>
                                        <td style={{ padding: "15px", fontWeight: "bold", color: student.attendance.status === 'present' ? '#10b981' : student.attendance.status === 'absent' ? '#ef4444' : student.attendance.status === 'holiday' ? '#3b82f6' : '#f59e0b' }}>
                                            {student.attendance.status.charAt(0).toUpperCase() + student.attendance.status.slice(1)}
                                        </td>
                                        <td style={{ padding: "15px", color: "var(--text-muted)" }}>
                                            {student.attendance.remarks || "-"}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Report Modal */}
            {showReport && reportData && (
                <div className="modal-overlay" onClick={() => setShowReport(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "900px" }}>
                        <div className="modal-header">
                            <h3>📊 Attendance Report</h3>
                            <button onClick={() => setShowReport(false)} className="btn btn-sm">×</button>
                        </div>
                        <div className="modal-body">
                            {reportData.at_risk_students && reportData.at_risk_students.length > 0 && (
                                <div style={{ marginBottom: "1.5rem", padding: "1rem", backgroundColor: "#fef2f2", borderRadius: "8px", border: "1px solid #fecaca" }}>
                                    <h4 style={{ color: "#dc2626", marginBottom: "0.5rem" }}>⚠️ Students Below 75%</h4>
                                    <p style={{ fontSize: "0.875rem", color: "#991b1b" }}>
                                        {reportData.at_risk_students.length} student(s) need attention
                                    </p>
                                </div>
                            )}

                            <div className="table-container">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Roll No</th>
                                            <th>Name</th>
                                            <th>Total Days</th>
                                            <th>Working Days</th>
                                            <th>Present</th>
                                            <th>Absent</th>
                                            <th>Late</th>
                                            <th>Holidays</th>
                                            <th>Percentage</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reportData.data.map((student) => (
                                            <tr key={student.student_id}>
                                                <td>{student.roll_number}</td>
                                                <td>{student.name}</td>
                                                <td>{student.total_days}</td>
                                                <td>{student.working_days}</td>
                                                <td><span style={{ color: "#10b981" }}>{student.present_days}</span></td>
                                                <td><span style={{ color: "#ef4444" }}>{student.absent_days}</span></td>
                                                <td><span style={{ color: "#f59e0b" }}>{student.late_days}</span></td>
                                                <td><span style={{ color: "#3b82f6" }}>{student.holiday_days}</span></td>
                                                <td>
                                                    <span className={`badge ${student.percentage >= 75 ? 'badge-success' : 'badge-danger'}`}>
                                                        {student.percentage}%
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Attendance;
