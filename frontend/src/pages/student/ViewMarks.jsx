import { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import api from "../../services/api";
import "../admin/Dashboard.css";

function ViewMarks() {
    const { user } = useContext(AuthContext);
    const [marks, setMarks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        fetchStudentIdAndMarks();
    }, []);

    const fetchStudentIdAndMarks = async () => {
        try {
            // Fetch Student Record directly using /me endpoint
            const studentRes = await api.get(`/students/me`);
            const studentId = studentRes.data.data.id;

            // Fetch Marks
            const marksRes = await api.get(`/exams/results/${studentId}`);
            setMarks(marksRes.data.data || []);
            setLoading(false);
        } catch (err) {
            console.error("Error fetching marks:", err);
            setError("Failed to load marks.");
            setLoading(false);
        }
    };

    if (loading) return <div className="dashboard-container">Loading your marks...</div>;
    if (error) return <div className="dashboard-container" style={{ color: "red" }}>{error}</div>;

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <div>
                    <h1>📝 My Exam Marks</h1>
                    <p>View your performance across all exams</p>
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                    <Link to="/student/dashboard" className="btn btn-secondary">
                        ← Back
                    </Link>
                </div>
            </div>

            <div className="card">
                <div className="card-header">
                    <h3 className="card-title">Exam Results</h3>
                </div>
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Exam Name</th>
                                <th>Subject</th>
                                <th>Date</th>
                                <th>Marks Obtained</th>
                                <th>Total Marks</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {marks.length === 0 ? (
                                <tr>
                                    <td colSpan="6" style={{ textAlign: "center", padding: "2rem" }}>
                                        No marks available yet.
                                    </td>
                                </tr>
                            ) : (
                                marks.map((mark) => {
                                    const passed = parseFloat(mark.marks_obtained) >= parseFloat(mark.Exam.passing_marks);
                                    return (
                                        <tr key={mark.id}>
                                            <td><strong>{mark.Exam?.name}</strong></td>
                                            <td>{mark.Exam?.Subject?.name || "N/A"}</td>
                                            <td>{new Date(mark.Exam?.exam_date).toLocaleDateString()}</td>
                                            <td>
                                                <strong>{mark.marks_obtained}</strong>
                                                <span style={{ color: "#6b7280", fontSize: "0.9em" }}> / {mark.Exam?.total_marks}</span>
                                            </td>
                                            <td>{mark.Exam?.passing_marks}</td>
                                            <td>
                                                <span className={`badge badge-${passed ? "success" : "danger"}`}>
                                                    {passed ? "Pass" : "Fail"}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default ViewMarks;
