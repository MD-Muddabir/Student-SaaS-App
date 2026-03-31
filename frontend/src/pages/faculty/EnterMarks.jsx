import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import "../admin/Dashboard.css";

function EnterMarks() {
    const [exams, setExams] = useState([]);
    const [selectedExam, setSelectedExam] = useState("");
    const [students, setStudents] = useState([]);
    const [marksData, setMarksData] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        fetchExams();
    }, []);

    useEffect(() => {
        if (selectedExam) {
            const examObj = exams.find(e => e.id === parseInt(selectedExam));
            if (examObj) {
                fetchStudents(examObj.class_id);
            }
        } else {
            setStudents([]);
            setMarksData({});
        }
    }, [selectedExam]);

    const fetchExams = async () => {
        try {
            const response = await api.get("/exams");
            setExams(response.data.data.exams || []);
        } catch (err) {
            console.error("Error fetching exams:", err);
            setError("Failed to load exams.");
        }
    };

    const fetchStudents = async (class_id) => {
        setLoading(true);
        try {
            const response = await api.get(`/students?class_id=${class_id}`);
            const fetchedStudents = response.data.data || [];

            const examObj = exams.find(e => e.id === parseInt(selectedExam));
            const formattedDate = new Date(examObj.exam_date).toISOString().split('T')[0];

            let existingMarks = [];
            try {
                const marksRes = await api.get(`/exams/${examObj.id}/marks`);
                existingMarks = marksRes.data.data || [];
            } catch (err) {
                console.error("Error fetching existing marks:", err);
            }

            let attendanceMap = {};
            try {
                const attendRes = await api.get(`/attendance/class/${class_id}/subject/${examObj.subject_id}/date/${formattedDate}`);
                const attendRecords = attendRes.data.data || [];
                attendRecords.forEach(r => {
                    attendanceMap[r.student_id] = r.attendance?.status;
                });
            } catch (err) {
                console.error("Error fetching attendance or feature locked:", err);
            }

            const initialData = {};
            const finalStudents = fetchedStudents.map(st => {
                const existingMark = existingMarks.find(m => m.student_id === st.id);
                const isAbsent = attendanceMap[st.id] === 'absent';

                initialData[st.id] = {
                    marks_obtained: existingMark ? existingMark.marks_obtained : "",
                    isSaved: !!existingMark,
                    isEditing: false,
                    isAbsent: isAbsent
                };

                return { ...st, isAbsent };
            });

            setStudents(finalStudents);
            setMarksData(initialData);
        } catch (err) {
            console.error("Error fetching students:", err);
            setError("Failed to load students for this class.");
        } finally {
            setLoading(false);
        }
    };

    const handleMarksChange = (studentId, val) => {
        setMarksData(prev => ({
            ...prev,
            [studentId]: { marks_obtained: val }
        }));
    };

    const handleSaveStudentMark = async (studentId) => {
        const marks = marksData[studentId]?.marks_obtained;
        if (marks === "" || marks === undefined) {
            alert("Please enter a valid mark.");
            return;
        }

        try {
            await api.post("/exams/marks", {
                exam_id: parseInt(selectedExam),
                student_id: studentId,
                marks_obtained: parseFloat(marks)
            });
            setMarksData(prev => ({
                ...prev,
                [studentId]: { ...prev[studentId], isSaved: true, isEditing: false }
            }));
            alert("Marks saved successfully!");
        } catch (err) {
            alert(err.response?.data?.message || "Error saving marks.");
        }
    };

    const handleEditMarks = (studentId) => {
        setMarksData(prev => ({
            ...prev,
            [studentId]: { ...prev[studentId], isEditing: true }
        }));
    };

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <div>
                    <h1>📝 Enter Marks</h1>
                    <p>Enter exam results for your students</p>
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                    <Link to="/faculty/dashboard" className="btn btn-secondary">
                        ← Back
                    </Link>
                </div>
            </div>

            {error && <div style={{ color: "red", padding: "10px", marginBottom: "1rem", backgroundColor: "#ffebeb", borderRadius: "5px" }}>{error}</div>}

            <div className="card" style={{ marginBottom: "2rem" }}>
                <div style={{ padding: "1.5rem" }}>
                    <div className="form-group" style={{ maxWidth: "400px" }}>
                        <label className="form-label">Select Exam *</label>
                        <select
                            className="form-select"
                            value={selectedExam}
                            onChange={(e) => setSelectedExam(e.target.value)}
                        >
                            <option value="">Choose an exam to grade</option>
                            {exams.map((ex) => (
                                <option key={ex.id} value={ex.id}>
                                    {ex.name} (Date: {new Date(ex.exam_date).toLocaleDateString()})
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {selectedExam && (
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">Student List ({students.length})</h3>
                    </div>

                    {loading ? (
                        <div style={{ padding: "2rem", textAlign: "center" }}>Loading students...</div>
                    ) : (
                        <div className="table-container">
                            <table className="table mobile-keep">
                                <thead>
                                    <tr>
                                        <th>Roll No</th>
                                        <th>Student Name</th>
                                        <th>Marks Obtained</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {students.length === 0 ? (
                                        <tr>
                                            <td colSpan="4" style={{ textAlign: "center", padding: "2rem" }}>
                                                No students found in this class
                                            </td>
                                        </tr>
                                    ) : (
                                        students.map((student) => {
                                            const examObj = exams.find(e => e.id === parseInt(selectedExam));
                                            const stData = marksData[student.id] || {};
                                            const isAbsent = stData.isAbsent;
                                            const isSaved = stData.isSaved;
                                            const isEditing = stData.isEditing;

                                            return (
                                                <tr key={student.id}>
                                                    <td>
                                                        <span className="badge badge-secondary">{student.roll_number}</span>
                                                    </td>
                                                    <td>
                                                        <strong>{student.User?.name}</strong>
                                                        <br />
                                                        <small style={{ color: "#6b7280" }}>{student.User?.email}</small>
                                                    </td>
                                                    <td>
                                                        {isAbsent ? (
                                                            <span style={{ color: "red", fontWeight: "bold" }}>Absent</span>
                                                        ) : (
                                                            <input
                                                                type="number"
                                                                className="form-input"
                                                                max={examObj?.total_marks}
                                                                min="0"
                                                                step="0.5"
                                                                value={stData.marks_obtained}
                                                                onChange={(e) => handleMarksChange(student.id, e.target.value)}
                                                                placeholder={`Out of ${examObj?.total_marks}`}
                                                                disabled={isSaved && !isEditing}
                                                                style={{ maxWidth: "150px" }}
                                                            />
                                                        )}
                                                    </td>
                                                    <td>
                                                        {isAbsent ? (
                                                            <span className="badge badge-warning">N/A</span>
                                                        ) : (
                                                            isSaved && !isEditing ? (
                                                                <button
                                                                    className="btn btn-sm btn-secondary"
                                                                    onClick={() => handleEditMarks(student.id)}
                                                                >
                                                                    Edit
                                                                </button>
                                                            ) : (
                                                                <button
                                                                    className="btn btn-sm btn-primary"
                                                                    onClick={() => handleSaveStudentMark(student.id)}
                                                                >
                                                                    Save
                                                                </button>
                                                            )
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default EnterMarks;
