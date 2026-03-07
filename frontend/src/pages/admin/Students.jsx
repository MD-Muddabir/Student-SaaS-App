/**
 * Students Management Page
 * Complete CRUD for student management with class assignment and statistics
 */

import { useState, useEffect, useContext } from "react";
import ThemeSelector from "../../components/ThemeSelector";
import { Link } from "react-router-dom";
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
    const [availableSubjects, setAvailableSubjects] = useState([]); // Add specific subjects based on class

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        password: "",
        roll_number: "",
        class_ids: [],
        date_of_birth: "",
        gender: "male",
        address: "",
        admission_date: "",
        subject_ids: [],
    });

    useEffect(() => {
        fetchStudents();
        fetchClasses();
    }, []);

    const hasPerm = (op) => {
        if (user?.role === 'admin' || user?.role === 'super_admin') return true;
        if (user?.role === 'manager' && user?.permissions) {
            return user.permissions.includes('students') || user.permissions.includes(`students.${op}`);
        }
        return false;
    };
    const canCreate = hasPerm('create');
    const canUpdate = hasPerm('update');
    const canDelete = hasPerm('delete');

    const fetchStudents = async () => {
        try {
            const response = await api.get("/students?limit=10000");
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

    const fetchSubjects = async (classIds) => {
        if (!classIds || classIds.length === 0) {
            setAvailableSubjects([]);
            return;
        }
        try {
            // Fetch subjects for each class and combine them
            // Depending on the backend route implementation it might not accept multiple, so we do it iteratively
            let allSubjects = [];
            for (let id of classIds) {
                const response = await api.get(`/subjects?class_id=${id}`);
                allSubjects = [...allSubjects, ...(response.data.data || [])];
            }

            // Remove duplicates
            const uniqueSubjects = [];
            const seen = new Set();
            for (let subject of allSubjects) {
                if (!seen.has(subject.id)) {
                    seen.add(subject.id);
                    uniqueSubjects.push(subject);
                }
            }

            // Add Full Course option at the beginning
            uniqueSubjects.unshift({ id: "full_course", name: "All Subjects (Full Course)" });

            setAvailableSubjects(uniqueSubjects);
        } catch (error) {
            console.error("Error fetching subjects:", error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Frontend validation for mandatory date fields
        if (!formData.date_of_birth) {
            alert("Date of Birth is required. Please enter the student's date of birth.");
            return;
        }
        if (!formData.admission_date) {
            alert("Admission Date is required. Please enter the student's admission date.");
            return;
        }

        try {
            if (editMode) {
                await api.put(`/students/${formData.id}`, formData);
                alert("Student updated successfully");
            } else {
                await api.post("/students", formData);
                alert("Student added successfully");
            }
            setShowModal(false);
            resetForm();
            fetchStudents();
        } catch (error) {
            // Display backend error message for all error types
            const errorMessage = error.response?.data?.message || "Something went wrong";
            alert(errorMessage);
            console.error("Error details:", error.response?.data);
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
            class_ids: student.Classes ? student.Classes.map(c => c.id.toString()) : [],
            admission_date: student.admission_date || "",
            date_of_birth: student.date_of_birth || "",
            gender: student.gender || "male",
            address: student.address || "",
            subject_ids: [
                ...(student.is_full_course ? ["full_course"] : []),
                ...(student.Subjects ? student.Subjects.map(sub => sub.id.toString()) : [])
            ]
        });

        const c_ids = student.Classes ? student.Classes.map(c => c.id.toString()) : [];
        if (c_ids.length > 0) {
            fetchSubjects(c_ids);
        } else {
            setAvailableSubjects([]);
        }
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
            class_ids: [],
            date_of_birth: "",
            gender: "male",
            address: "",
            admission_date: "",
            subject_ids: [],
        });
        setAvailableSubjects([]);
        setEditMode(false);
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleClassChange = (e) => {
        const options = e.target.options;
        const selectedClasses = [];
        for (let i = 0; i < options.length; i++) {
            if (options[i].selected) {
                selectedClasses.push(options[i].value);
            }
        }

        fetchSubjects(selectedClasses);

        setFormData({
            ...formData,
            class_ids: selectedClasses,
            subject_ids: [],
        });
    };

    const handleSubjectChange = (e) => {
        const options = e.target.options;
        const selectedSubjects = [];
        for (let i = 0; i < options.length; i++) {
            if (options[i].selected) {
                selectedSubjects.push(options[i].value);
            }
        }
        setFormData({
            ...formData,
            subject_ids: selectedSubjects,
        });
    };

    // Filter students
    const filteredStudents = students.filter((s) => {
        const matchesSearch =
            s.User?.name.toLowerCase().includes(search.toLowerCase()) ||
            s.User?.email.toLowerCase().includes(search.toLowerCase()) ||
            s.roll_number.toLowerCase().includes(search.toLowerCase());

        const matchesClass =
            classFilter === "all" || (s.Classes && s.Classes.some(c => c.id === parseInt(classFilter)));

        return matchesSearch && matchesClass;
    });

    if (loading) {
        return <div className="dashboard-container">Loading...</div>;
    }

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <div>
                    <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '2rem', lineHeight: 1 }}>🎓</span>
                        Student Management
                    </h1>
                    <p>Manage students and enrollments</p>
                </div>
                <div className="dashboard-header-right">
                    <ThemeSelector />
                    <Link to="/admin/dashboard" className="btn btn-secondary">
                        ← Back
                    </Link>
                    {canCreate && (
                        <button
                            onClick={() => { resetForm(); setShowModal(true); }}
                            className="btn btn-primary"
                        >
                            + Add Student
                        </button>
                    )}
                </div>
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
                                    (students.filter((s) => s.Classes && s.Classes.length > 0).length / students.length) * 100
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
                                <th>Admission Date</th>
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
                                            {student.Classes && student.Classes.length > 0 ? (
                                                <>
                                                    {student.Classes.map(c => `${c.name}${c.section ? ` - ${c.section}` : ""}`).join(", ")}
                                                </>
                                            ) : (
                                                <span style={{ color: "#9ca3af" }}>Unassigned</span>
                                            )}
                                            {student.is_full_course && (
                                                <div style={{ fontSize: "0.80rem", color: "#6b7280", marginTop: "4px" }}>
                                                    All Subjects (Full Course)
                                                </div>
                                            )}
                                            {student.Subjects && student.Subjects.length > 0 && (
                                                <div style={{ fontSize: "0.80rem", color: "#6b7280", marginTop: "4px" }}>
                                                    {student.Subjects.map(sub => sub.name).join(", ")}
                                                </div>
                                            )}
                                        </td>
                                        <td style={{ textTransform: "capitalize" }}>{student.gender}</td>
                                        <td>
                                            {student.admission_date ? (
                                                <span style={{ color: '#374151', fontWeight: 500 }}>
                                                    {new Date(student.admission_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                </span>
                                            ) : (
                                                <span style={{ color: '#9ca3af' }}>N/A</span>
                                            )}
                                        </td>
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
                                                {canUpdate && (
                                                    <button
                                                        className="btn btn-sm btn-primary"
                                                        onClick={() => handleEdit(student)}
                                                    >
                                                        Edit
                                                    </button>
                                                )}
                                                {canDelete && (
                                                    <button
                                                        className="btn btn-sm btn-danger"
                                                        onClick={() => handleDelete(student.id)}
                                                    >
                                                        Delete
                                                    </button>
                                                )}
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
                                    <div className="form-group" style={{ gridColumn: "1 / -1", marginTop: "1rem" }}>
                                        <label className="form-label">Classes (Multiple selection allowed)</label>
                                        <select
                                            name="class_ids"
                                            className="form-select"
                                            multiple
                                            value={formData.class_ids}
                                            onChange={handleClassChange}
                                            style={{ height: "100px" }}
                                        >
                                            {classes.map((c) => (
                                                <option key={c.id} value={c.id}>
                                                    {c.name} {c.section && `- ${c.section}`}
                                                </option>
                                            ))}
                                        </select>
                                        <small style={{ color: "#6b7280" }}>Hold Ctrl (Windows) or Cmd (Mac) to select multiple classes</small>
                                    </div>
                                </div>

                                {formData.class_ids && formData.class_ids.length > 0 && (
                                    <div className="form-group" style={{ marginTop: "1rem" }}>
                                        <label className="form-label">Subjects (Multiple selection allowed)</label>
                                        <select
                                            name="subject_ids"
                                            className="form-select"
                                            multiple
                                            value={formData.subject_ids}
                                            onChange={handleSubjectChange}
                                            style={{ height: "100px" }}
                                        >
                                            {availableSubjects.map((sub) => (
                                                <option key={sub.id} value={sub.id}>
                                                    {sub.name}
                                                </option>
                                            ))}
                                        </select>
                                        <small style={{ color: "#6b7280" }}>Hold Ctrl (Windows) or Cmd (Mac) to select multiple subjects</small>
                                    </div>
                                )}

                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginTop: "1rem" }}>
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

                                    <div className="form-group">
                                        <label className="form-label">Date of Birth <span style={{ color: 'red' }}>*</span></label>
                                        <input
                                            type="date"
                                            name="date_of_birth"
                                            className="form-input"
                                            value={formData.date_of_birth}
                                            onChange={handleChange}
                                            required
                                            max={new Date().toISOString().split('T')[0]}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Admission Date <span style={{ color: 'red' }}>*</span></label>
                                        <input
                                            type="date"
                                            name="admission_date"
                                            className="form-input"
                                            value={formData.admission_date}
                                            onChange={handleChange}
                                            required
                                            max={new Date().toISOString().split('T')[0]}
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
