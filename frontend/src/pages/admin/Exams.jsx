/**
 * Exams Management Page
 * Handles creation and listing of exams
 */

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import "./Dashboard.css";

function Exams() {
    const [exams, setExams] = useState([]);
    const [classes, setClasses] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        subject_id: "",
        class_id: "",
        exam_date: "",
        total_marks: "",
        passing_marks: "",
    });

    useEffect(() => {
        fetchExams();
        fetchClasses();
        fetchSubjects();
    }, []);

    const fetchExams = async () => {
        try {
            const response = await api.get("/exams");
            setExams(response.data.data.exams || []);
        } catch (error) {
            console.error("Error fetching exams:", error);
        } finally {
            setLoading(false);
        }
    };

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
            const response = await api.get("/subjects");
            setSubjects(response.data.data || []);
        } catch (error) {
            console.error("Error fetching subjects:", error);
        }
    };

    // Filter available subjects based on selected class
    const availableSubjects = formData.class_id
        ? subjects.filter((s) => s.class_id === parseInt(formData.class_id))
        : subjects;

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post("/exams", formData);
            alert("Exam created successfully");
            setShowModal(false);
            setFormData({
                name: "",
                subject_id: "",
                class_id: "",
                exam_date: "",
                total_marks: "",
                passing_marks: "",
            });
            fetchExams();
        } catch (error) {
            alert(error.response?.data?.message || "Something went wrong");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this exam?")) return;
        try {
            await api.delete(`/exams/${id}`);
            alert("Exam deleted successfully");
            fetchExams();
        } catch (error) {
            alert(error.response?.data?.message || "Failed to delete exam");
        }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    if (loading) {
        return <div className="dashboard-container">Loading...</div>;
    }

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <div>
                    <h1>📝 Manage Exams</h1>
                    <p>Schedule and manage exams for your institute</p>
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                    <Link to="/admin/dashboard" className="btn" style={{ backgroundColor: "#6b7280", color: "white" }}>
                        ← Back
                    </Link>
                    <button
                        onClick={() => setShowModal(true)}
                        className="btn btn-primary"
                    >
                        + Add Exam
                    </button>
                </div>
            </div>

            <div className="card">
                <div className="card-header">
                    <h3 className="card-title">All Exams ({exams.length})</h3>
                </div>
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Exam Name</th>
                                <th>Subject</th>
                                <th>Class</th>
                                <th>Date</th>
                                <th>Total Marks</th>
                                <th>Passing Marks</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {exams.length === 0 ? (
                                <tr>
                                    <td colSpan="6" style={{ textAlign: "center", padding: "2rem" }}>
                                        No exams found
                                    </td>
                                </tr>
                            ) : (
                                exams.map((exam) => {
                                    const classInfo = classes.find((c) => c.id === exam.class_id);
                                    return (
                                        <tr key={exam.id}>
                                            <td>
                                                <strong>{exam.name}</strong>
                                            </td>
                                            <td>{exam.Subject?.name || "N/A"}</td>
                                            <td>
                                                {classInfo
                                                    ? `${classInfo.name} ${classInfo.section || ""}`
                                                    : "N/A"}
                                            </td>
                                            <td>{new Date(exam.exam_date).toLocaleDateString()}</td>
                                            <td>{exam.total_marks}</td>
                                            <td>{exam.passing_marks}</td>
                                            <td>
                                                <button
                                                    onClick={() => handleDelete(exam.id)}
                                                    className="btn btn-sm btn-danger"
                                                    style={{ padding: "0.2rem 0.5rem" }}
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Exam Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "500px" }}>
                        <div className="modal-header">
                            <h3>Create Exam</h3>
                            <button onClick={() => setShowModal(false)} className="btn btn-sm">
                                ×
                            </button>
                        </div>
                        <div className="modal-body">
                            <form onSubmit={handleSubmit}>
                                <div className="form-group">
                                    <label className="form-label">Exam Name *</label>
                                    <input
                                        type="text"
                                        name="name"
                                        className="form-input"
                                        placeholder="e.g., Mid-Term Mathematics"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Class *</label>
                                    <select
                                        name="class_id"
                                        className="form-select"
                                        value={formData.class_id}
                                        onChange={(e) => {
                                            setFormData({
                                                ...formData,
                                                class_id: e.target.value,
                                                subject_id: "", // Reset subject when class changes
                                            });
                                        }}
                                        required
                                    >
                                        <option value="">Select a class</option>
                                        {classes.map((c) => (
                                            <option key={c.id} value={c.id}>
                                                {c.name} {c.section && `- ${c.section}`}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Subject *</label>
                                    <select
                                        name="subject_id"
                                        className="form-select"
                                        value={formData.subject_id}
                                        onChange={handleChange}
                                        required
                                        disabled={!formData.class_id}
                                    >
                                        <option value="">Select a subject</option>
                                        {availableSubjects.map((s) => (
                                            <option key={s.id} value={s.id}>
                                                {s.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Exam Date *</label>
                                    <input
                                        type="date"
                                        name="exam_date"
                                        className="form-input"
                                        value={formData.exam_date}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                                    <div className="form-group">
                                        <label className="form-label">Total Marks *</label>
                                        <input
                                            type="number"
                                            name="total_marks"
                                            className="form-input"
                                            min="1"
                                            value={formData.total_marks}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Passing Marks *</label>
                                        <input
                                            type="number"
                                            name="passing_marks"
                                            className="form-input"
                                            min="0"
                                            max={formData.total_marks || 100}
                                            value={formData.passing_marks}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="modal-footer">
                                    <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn btn-primary">
                                        Create Exam
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Exams;
