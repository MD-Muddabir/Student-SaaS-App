import { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import { AuthContext } from "../../context/AuthContext";
import "../admin/Dashboard.css";

const getLocalDate = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

function MarkAttendance() {
    const { user } = useContext(AuthContext);
    const [classes, setClasses] = useState([]);
    const [selectedClass, setSelectedClass] = useState("");
    const [subjects, setSubjects] = useState([]);
    const [selectedSubject, setSelectedSubject] = useState("");
    const [selectedDate, setSelectedDate] = useState(getLocalDate());
    const [pendingRestoreSubject, setPendingRestoreSubject] = useState(null);
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

            // Check if we need to restore subject from pending click
            setPendingRestoreSubject((prevPending) => {
                if (prevPending) {
                    setSelectedSubject(prevPending);
                    return null;
                }
                setSelectedSubject("");
                return null;
            });
        } catch (error) {
            console.error("Error fetching subjects:", error);
        }
    };

    const fetchDashboardStats = async () => {
        try {
            const response = await api.get("/attendance/dashboard?date=" + getLocalDate());
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

            const initialData = {};
            response.data.data.forEach(student => {
                if (student.attendance) {
                    initialData[student.student_id] = {
                        status: student.attendance.status,
                        remarks: student.attendance.remarks || "",
                        isExisting: true
                    };
                } else {
                    initialData[student.student_id] = {
                        status: "pending",
                        remarks: "",
                        isExisting: false
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
            const pendingStudents = Object.keys(attendanceData).filter(studentId => !attendanceData[studentId].isExisting);

            if (pendingStudents.length === 0) {
                alert("Attendance already submitted. No pending students to mark.");
                return;
            }

            const attendance_data = pendingStudents.map(studentId => ({
                student_id: parseInt(studentId),
                status: attendanceData[studentId].status,
                remarks: attendanceData[studentId].remarks
            }));

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
        const newData = {};
        students.forEach(student => {
            newData[student.student_id] = {
                status: "present",
                remarks: attendanceData[student.student_id]?.remarks || "",
                isExisting: attendanceData[student.student_id]?.isExisting || false
            };
        });
        setAttendanceData(newData);
    };

    const markAllAbsent = () => {
        const newData = {};
        students.forEach(student => {
            newData[student.student_id] = {
                status: "absent",
                remarks: attendanceData[student.student_id]?.remarks || "",
                isExisting: attendanceData[student.student_id]?.isExisting || false
            };
        });
        setAttendanceData(newData);
    };

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <div>
                    <h1>📋 Mark Attendance</h1>
                    <p>Mark and track student attendance</p>
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                    <Link to="/faculty/dashboard" className="btn btn-secondary">
                        ← Back
                    </Link>
                    {selectedClass && (
                        <button onClick={handleViewReport} className="btn btn-primary">
                            📊 View Report
                        </button>
                    )}
                </div>
            </div>

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

            {dashboardStats?.pending_classes && dashboardStats.pending_classes.length > 0 && (
                <div className="card" style={{ marginBottom: "2rem" }}>
                    <div className="card-header">
                        <h3 className="card-title" style={{ color: "#f59e0b" }}>⏳ Pending Attendance for Today</h3>
                    </div>
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Class</th>
                                    <th>Subject</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {dashboardStats.pending_classes.map((pc) => (
                                    <tr key={`${pc.class_id}-${pc.subject_id}`}>
                                        <td>{pc.class_name}</td>
                                        <td>{pc.subject_name}</td>
                                        <td>
                                            <button
                                                className="btn btn-sm btn-primary"
                                                onClick={() => {
                                                    setPendingRestoreSubject(pc.subject_id.toString());
                                                    setSelectedClass(pc.class_id.toString());
                                                    setSelectedDate(getLocalDate());
                                                    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                                                }}
                                            >
                                                Mark Manually
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

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
                                max={getLocalDate()}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {selectedClass && selectedSubject && selectedDate && (
                <>
                    {/* Pending Students Table */}
                    <div className="card" style={{ marginBottom: "2rem" }}>
                        <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <h3 className="card-title">⏳ Pending Students ({students.filter(s => !attendanceData[s.student_id]?.isExisting).length} students)</h3>
                            <div style={{ display: "flex", gap: "10px" }}>
                                <button onClick={markAllPresent} className="btn btn-sm btn-success" type="button">
                                    ✓ All Present
                                </button>
                                <button onClick={markAllAbsent} className="btn btn-sm btn-danger" type="button">
                                    × All Absent
                                </button>
                            </div>
                        </div>

                        {loading ? (
                            <div style={{ padding: "2rem", textAlign: "center" }}>Loading...</div>
                        ) : (
                            <form onSubmit={handleSubmit}>
                                <div className="table-container">
                                    <table className="table">
                                        <thead>
                                            <tr>
                                                <th>Roll No</th>
                                                <th>Student Name</th>
                                                <th>Status</th>
                                                <th>Remarks</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {students.filter(s => !attendanceData[s.student_id]?.isExisting).length === 0 ? (
                                                <tr>
                                                    <td colSpan="4" style={{ textAlign: "center", padding: "2rem", color: "#10b981", fontWeight: "bold" }}>
                                                        Attendance already submitted for all students today. ✅
                                                    </td>
                                                </tr>
                                            ) : (
                                                students.filter(s => !attendanceData[s.student_id]?.isExisting).map((student) => (
                                                    <tr key={student.student_id}>
                                                        <td>
                                                            <span className="badge badge-secondary">
                                                                {student.roll_number}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <strong>{student.name}</strong>
                                                            <br />
                                                            <small style={{ color: "#6b7280" }}>{student.email}</small>
                                                        </td>
                                                        <td>
                                                            <div style={{ display: "flex", gap: "10px" }}>
                                                                <label style={{ display: "flex", alignItems: "center", gap: "5px", cursor: "pointer" }}>
                                                                    <input
                                                                        type="radio"
                                                                        name={`status-${student.student_id}`}
                                                                        value="pending"
                                                                        checked={attendanceData[student.student_id]?.status === "pending"}
                                                                        onChange={() => handleStatusChange(student.student_id, "pending")}
                                                                    />
                                                                    <span style={{ color: "#f59e0b" }}>Pending</span>
                                                                </label>
                                                                <label style={{ display: "flex", alignItems: "center", gap: "5px", cursor: "pointer" }}>
                                                                    <input
                                                                        type="radio"
                                                                        name={`status-${student.student_id}`}
                                                                        value="present"
                                                                        checked={attendanceData[student.student_id]?.status === "present"}
                                                                        onChange={() => handleStatusChange(student.student_id, "present")}
                                                                    />
                                                                    <span style={{ color: "#10b981" }}>Present</span>
                                                                </label>
                                                                <label style={{ display: "flex", alignItems: "center", gap: "5px", cursor: "pointer" }}>
                                                                    <input
                                                                        type="radio"
                                                                        name={`status-${student.student_id}`}
                                                                        value="absent"
                                                                        checked={attendanceData[student.student_id]?.status === "absent"}
                                                                        onChange={() => handleStatusChange(student.student_id, "absent")}
                                                                    />
                                                                    <span style={{ color: "#ef4444" }}>Absent</span>
                                                                </label>
                                                                <label style={{ display: "flex", alignItems: "center", gap: "5px", cursor: "pointer" }}>
                                                                    <input
                                                                        type="radio"
                                                                        name={`status-${student.student_id}`}
                                                                        value="late"
                                                                        checked={attendanceData[student.student_id]?.status === "late"}
                                                                        onChange={() => handleStatusChange(student.student_id, "late")}
                                                                    />
                                                                    <span style={{ color: "#6366f1" }}>Late</span>
                                                                </label>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <input
                                                                type="text"
                                                                className="form-input"
                                                                placeholder="Optional remarks"
                                                                value={attendanceData[student.student_id]?.remarks || ""}
                                                                onChange={(e) => handleRemarksChange(student.student_id, e.target.value)}
                                                                style={{ minWidth: "200px" }}
                                                            />
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                {students.filter(s => !attendanceData[s.student_id]?.isExisting).length > 0 && (
                                    <div style={{ padding: "1.5rem", borderTop: "1px solid #e5e7eb", textAlign: "right" }}>
                                        <button type="submit" className="btn btn-primary" style={{ minWidth: "200px" }}>
                                            ✓ Submit Attendance
                                        </button>
                                    </div>
                                )}
                            </form>
                        )}
                    </div>

                    {/* Marked Attendance Table */}
                    {students.filter(s => attendanceData[s.student_id]?.isExisting).length > 0 && (
                        <div className="card" style={{ marginBottom: "2rem" }}>
                            <div className="card-header">
                                <h3 className="card-title">✅ Marked Attendance ({students.filter(s => attendanceData[s.student_id]?.isExisting).length} students)</h3>
                            </div>
                            <div className="table-container">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Roll No</th>
                                            <th>Student Name</th>
                                            <th>Marked Status</th>
                                            <th>Remarks</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {students.filter(s => attendanceData[s.student_id]?.isExisting).map((student) => (
                                            <tr key={student.student_id}>
                                                <td>
                                                    <span className="badge badge-secondary">{student.roll_number}</span>
                                                </td>
                                                <td>
                                                    <strong>{student.name}</strong>
                                                    <br />
                                                    <small style={{ color: "#6b7280" }}>{student.email}</small>
                                                    <br />
                                                    <span className="badge badge-success" style={{ fontSize: "0.7rem", marginTop: "4px" }}>✓ Saved in DB</span>
                                                </td>
                                                <td>
                                                    <span className={`badge badge-${attendanceData[student.student_id]?.status === 'present' ? 'success' : attendanceData[student.student_id]?.status === 'absent' ? 'danger' : attendanceData[student.student_id]?.status === 'late' ? 'warning' : 'secondary'}`} style={{ textTransform: "capitalize" }}>
                                                        {attendanceData[student.student_id]?.status}
                                                    </span>
                                                </td>
                                                <td>
                                                    {attendanceData[student.student_id]?.remarks || "-"}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </>
            )}

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
                                            <th>Present</th>
                                            <th>Absent</th>
                                            <th>Late</th>
                                            <th>Percentage</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reportData.data.map((student) => (
                                            <tr key={student.student_id}>
                                                <td>{student.roll_number}</td>
                                                <td>{student.name}</td>
                                                <td>{student.total_days}</td>
                                                <td><span style={{ color: "#10b981" }}>{student.present_days}</span></td>
                                                <td><span style={{ color: "#ef4444" }}>{student.absent_days}</span></td>
                                                <td><span style={{ color: "#f59e0b" }}>{student.late_days}</span></td>
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

export default MarkAttendance;
