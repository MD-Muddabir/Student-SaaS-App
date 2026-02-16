/**
 * Students Management Page
 * Complete CRUD for student management with class assignment and statistics
 */

import { useState, useEffect, useContext } from "react";
import api from "../../services/api";
import { AuthContext } from "../../context/AuthContext";
import "./Dashboard.css";

function Students() {
    const { user } = useContext(AuthContext);
    const [students, setStudents] = useState([]);
    const [totalCount, setTotalCount] = useState(0);
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [search, setSearch] = useState("");
    const [classFilter, setClassFilter] = useState("all");

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        password: "",
        roll_number: "",
        class_id: "",
        date_of_birth: "",
        gender: "male",
        address: "",
        admission_date: "",
    });

    useEffect(() => {
        fetchStudents();
        fetchClasses();
    }, []);

    const fetchStudents = async () => {
        try {
            const response = await api.get("/students");
            setStudents(response.data.data || []);
            setTotalCount(response.data.count || 0);
        } catch (error) {
            console.error("Error fetching students:", error);
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editMode) {
                await api.put(`/students/${formData.id}`, formData);
                alert("Student updated successfully");
            } else {
                await api.post("/students", {
                    ...formData,
                    institute_id: user.institute_id,
                });
                alert("Student added successfully");
            }
            setShowModal(false);
            resetForm();
            fetchStudents();
        } catch (error) {
            alert("Error: " + error.response?.data?.message);
        }
    };

    const handleEdit = (student) => {
        setFormData({
            id: student.id,
            name: student.User?.name || "",
            email: student.User?.email || "",
            phone: student.User?.phone || "",
            password: "",
            roll_number: student.roll_number || "",
            class_id: student.class_id || "",
            date_of_birth: student.date_of_birth || "",
            gender: student.gender || "male",
            address: student.address || "",
            admission_date: student.admission_date || "",
        });
        setEditMode(true);
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this student?")) return;

        try {
            await api.delete(`/students/${id}`);
            alert("Student deleted successfully");
            fetchStudents();
        } catch (error) {
            alert("Error deleting student: " + error.response?.data?.message);
        }
    };

    const resetForm = () => {
        setFormData({
            name: "",
            email: "",
            phone: "",
            password: "",
            roll_number: "",
            class_id: "",
            date_of_birth: "",
            gender: "male",
            address: "",
            admission_date: "",
        });
        setEditMode(false);
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    // Filter students
    const filteredStudents = students.filter((s) => {
        const matchesSearch =
            s.User?.name.toLowerCase().includes(search.toLowerCase()) ||
            s.User?.email.toLowerCase().includes(search.toLowerCase()) ||
            s.roll_number.toLowerCase().includes(search.toLowerCase());

        const matchesClass =
            classFilter === "all" || s.class_id === parseInt(classFilter);

        return matchesSearch && matchesClass;
    });

    if (loading) {
        return <div className="dashboard-container">Loading...</div>;
    }

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <div>
                    <h1>🎓 Student Management</h1>
                    <p>Manage students and enrollments</p>
                </div>
                <button
                    onClick={() => {
                        resetForm();
                        setShowModal(true);
                    }}
                    className="btn btn-primary"
                >
                    + Add Student
                </button>
            </div>

            {/* Filters */}
            <div className="card" style={{ marginBottom: "2rem" }}>
                <div style={{ padding: "1.5rem", display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                    <input
                        type="text"
                        className="form-input"
                        placeholder="Search by name, email, or roll number..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ flex: "1", minWidth: "250px" }}
                    />
                    <select
                        className="form-select"
                        value={classFilter}
                        onChange={(e) => setClassFilter(e.target.value)}
                        style={{ minWidth: "200px" }}
                    >
                        <option value="all">All Classes</option>
                        {classes.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.name} {c.section && `- ${c.section}`}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Statistics */}
            <div className="stats-grid" style={{ marginBottom: "2rem" }}>
                <div className="stat-card">
                    <div className="stat-icon">🎓</div>
                    <div className="stat-content">
                        <h3>{totalCount}</h3>
                        <p>Total Students</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">✅</div>
                    <div className="stat-content">
                        <h3>{students.filter((s) => s.User?.status === "active").length}</h3>
                        <p>Active</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">🏫</div>
                    <div className="stat-content">
                        <h3>{classes.length}</h3>
                        <p>Active Classes</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">📝</div>
                    <div className="stat-content">
                        <h3>
                            {students.length > 0
                                ? Math.round(
                                    (students.filter((s) => s.class_id).length / students.length) * 100
                                )
                                : 0}
                            %
                        </h3>
                        <p>Enrolled</p>
                    </div>
                </div>
            </div>

            {/* Students Table */}
            <div className="card">
                <div className="card-header">
                    <h3 className="card-title">All Students ({filteredStudents.length})</h3>
                </div>
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Roll No</th>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Class</th>
                                <th>Gender</th>
                                <th>Join Date</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredStudents.length === 0 ? (
                                <tr>
                                    <td colSpan="8" style={{ textAlign: "center", padding: "2rem" }}>
                                        No students found
                                    </td>
                                </tr>
                            ) : (
                                filteredStudents.map((student) => (
                                    <tr key={student.id}>
                                        <td>
                                            <span className="badge badge-secondary">{student.roll_number}</span>
                                        </td>
                                        <td>
                                            <strong>{student.User?.name}</strong>
                                            <br />
                                            <small style={{ color: "#6b7280" }}>{student.User?.phone}</small>
                                        </td>
                                        <td>{student.User?.email}</td>
                                        <td>
                                            {student.Class ? (
                                                <>
                                                    {student.Class.name}
                                                    {student.Class.section && ` - ${student.Class.section}`}
                                                </>
                                            ) : (
                                                <span style={{ color: "#9ca3af" }}>Unassigned</span>
                                            )}
                                        </td>
                                        <td style={{ textTransform: "capitalize" }}>{student.gender}</td>
                                        <td>{new Date(student.created_at).toLocaleDateString()}</td>
                                        <td>
                                            <span
                                                className={`badge badge-${student.User?.status === "active" ? "success" : "danger"
                                                    }`}
                                            >
                                                {student.User?.status}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ display: "flex", gap: "0.5rem" }}>
                                                <button
                                                    className="btn btn-sm btn-primary"
                                                    onClick={() => handleEdit(student)}
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    className="btn btn-sm btn-danger"
                                                    onClick={() => handleDelete(student.id)}
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add/Edit Student Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "700px" }}>
                        <div className="modal-header">
                            <h3>{editMode ? "Edit Student" : "Add New Student"}</h3>
                            <button onClick={() => setShowModal(false)} className="btn btn-sm">
                                ×
                            </button>
                        </div>
                        <div className="modal-body">
                            <form onSubmit={handleSubmit}>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                                    <div className="form-group">
                                        <label className="form-label">Full Name *</label>
                                        <input
                                            type="text"
                                            name="name"
                                            className="form-input"
                                            value={formData.name}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Email *</label>
                                        <input
                                            type="email"
                                            name="email"
                                            className="form-input"
                                            value={formData.email}
                                            onChange={handleChange}
                                            required
                                            disabled={editMode}
                                        />
                                    </div>
                                </div>

                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                                    <div className="form-group">
                                        <label className="form-label">Phone</label>
                                        <input
                                            type="tel"
                                            name="phone"
                                            className="form-input"
                                            value={formData.phone}
                                            onChange={handleChange}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Roll Number *</label>
                                        <input
                                            type="text"
                                            name="roll_number"
                                            className="form-input"
                                            value={formData.roll_number}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                </div>

                                {!editMode && (
                                    <div className="form-group">
                                        <label className="form-label">
                                            Password * <small>(Min 6 chars)</small>
                                        </label>
                                        <input
                                            type="password"
                                            name="password"
                                            className="form-input"
                                            value={formData.password}
                                            onChange={handleChange}
                                            required={!editMode}
                                            minLength={6}
                                        />
                                    </div>
                                )}

                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                                    <div className="form-group">
                                        <label className="form-label">Class</label>
                                        <select
                                            name="class_id"
                                            className="form-select"
                                            value={formData.class_id}
                                            onChange={handleChange}
                                        >
                                            <option value="">Select Class</option>
                                            {classes.map((c) => (
                                                <option key={c.id} value={c.id}>
                                                    {c.name} {c.section && `- ${c.section}`}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Gender</label>
                                        <select
                                            name="gender"
                                            className="form-select"
                                            value={formData.gender}
                                            onChange={handleChange}
                                        >
                                            <option value="male">Male</option>
                                            <option value="female">Female</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>
                                </div>

                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                                    <div className="form-group">
                                        <label className="form-label">Date of Birth</label>
                                        <input
                                            type="date"
                                            name="date_of_birth"
                                            className="form-input"
                                            value={formData.date_of_birth}
                                            onChange={handleChange}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Admission Date</label>
                                        <input
                                            type="date"
                                            name="admission_date"
                                            className="form-input"
                                            value={formData.admission_date}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Address</label>
                                    <textarea
                                        name="address"
                                        className="form-input"
                                        rows="2"
                                        value={formData.address}
                                        onChange={handleChange}
                                    ></textarea>
                                </div>

                                <div className="modal-footer">
                                    <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn btn-primary">
                                        {editMode ? "Update Student" : "Add Student"}
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

export default Students;
