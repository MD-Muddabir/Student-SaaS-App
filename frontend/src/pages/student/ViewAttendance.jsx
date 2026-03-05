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

    useEffect(() => {
        fetchStudentIdAndAttendance();
    }, []);

    const fetchStudentIdAndAttendance = async () => {
        try {
            // Fetch Student Record directly using /me endpoint
            const studentRes = await api.get(`/students/me`);
            const studentId = studentRes.data.data.id;

            // Fetch Attendance
            const attRes = await api.get(`/attendance/student/${studentId}/report`);
            setReport(attRes.data.data);
            setLoading(false);
        } catch (err) {
            console.error("Error fetching attendance:", err);
            setError(err.response?.data?.message || "Failed to load attendance report.");
            setLoading(false);
        }
    };

    if (loading) return <div className="dashboard-container">Loading your attendance...</div>;
    if (error) return <div className="dashboard-container" style={{ color: "red" }}>{error}</div>;

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <div>
                    <h1>📋 My Attendance</h1>
                    <p>Track your daily attendance</p>
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                    <Link to="/student/dashboard" className="btn btn-secondary">
                        ← Back
                    </Link>
                </div>
            </div>

            {report && (
                <div className="stats-grid" style={{ marginBottom: "2rem" }}>
                    <div className="stat-card">
                        <div className="stat-icon">📅</div>
                        <div className="stat-content">
                            <h3>{report.summary.total_days}</h3>
                            <p>Total Working Days</p>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon">✅</div>
                        <div className="stat-content">
                            <h3>{report.summary.present_days}</h3>
                            <p>Days Present</p>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon">🏖️</div>
                        <div className="stat-content">
                            <h3>{report.summary.holiday_days}</h3>
                            <p>Holidays</p>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon">❌</div>
                        <div className="stat-content">
                            <h3>{report.summary.absent_days}</h3>
                            <p>Days Absent</p>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon">📊</div>
                        <div className="stat-content">
                            <h3>{report.summary.attendance_percentage}%</h3>
                            <p>Attendance Percentage</p>
                        </div>
                    </div>
                </div>
            )}

            <div className="card">
                <div className="card-header">
                    <h3 className="card-title">Recent Records</h3>
                </div>
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Subject</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {!report || report.records.length === 0 ? (
                                <tr>
                                    <td colSpan="3" style={{ textAlign: "center", padding: "2rem" }}>
                                        No attendance records available.
                                    </td>
                                </tr>
                            ) : (
                                report.records.map((record) => (
                                    <tr key={record.id}>
                                        <td>{new Date(record.date).toLocaleDateString()}</td>
                                        <td>{record.Subject?.name || "All Subjects"}</td>
                                        <td>
                                            <span style={{ textTransform: "capitalize" }} className={`badge badge-${record.status === "present" ? "success" : record.status === "absent" ? "danger" : record.status === "holiday" ? "primary" : "warning"}`}>
                                                {record.status}
                                            </span>
                                        </td>
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
