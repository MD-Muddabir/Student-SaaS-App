import { useState, useEffect, useContext } from "react";
import ThemeSelector from "../../components/ThemeSelector";
import { Link } from "react-router-dom";
import api from "../../services/api";
import { AuthContext } from "../../context/AuthContext";
import "./Dashboard.css";
import * as parentService from "../../services/parent.service";

function Parents() {
    const { user } = useContext(AuthContext);
    const [parents, setParents] = useState([]);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [search, setSearch] = useState("");

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        password: "",
        student_ids: [],
        relationships: []
    });

    useEffect(() => {
        fetchParents();
        fetchStudents();
    }, []);

    const fetchParents = async () => {
        try {
            const data = await parentService.getAllParents(search);
            setParents(data.data || []);
        } catch (error) {
            console.error("Error fetching parents:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStudents = async () => {
        try {
            const response = await api.get("/students?limit=1000");
            setStudents(response.data.data || []);
        } catch (error) {
            console.error("Error fetching students:", error);
        }
    };

    useEffect(() => {
        if (!loading) {
            fetchParents();
        }
    }, [search]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Extract student_ids and default relationships to 'guardian' if empty
        const s_ids = formData.student_ids;
        const rels = s_ids.map(() => 'guardian');

        try {
            await parentService.createParent({
                ...formData,
                relationships: rels
            });
            alert("Parent added successfully");
            setShowModal(false);
            resetForm();
            fetchParents();
        } catch (error) {
            const errorMessage = error.response?.data?.message || "Something went wrong";
            alert(errorMessage);
        }
    };

    const resetForm = () => {
        setFormData({
            name: "",
            email: "",
            phone: "",
            password: "",
            student_ids: [],
            relationships: []
        });
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleStudentChange = (e) => {
        const options = e.target.options;
        const selected = [];
        for (let i = 0; i < options.length; i++) {
            if (options[i].selected) {
                selected.push(options[i].value);
            }
        }
        setFormData({
            ...formData,
            student_ids: selected,
        });
    };

    if (loading) {
        return <div className="dashboard-container">Loading...</div>;
    }

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <div>
                    <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '2rem', lineHeight: 1 }}>👨‍👩‍👧</span>
                        Parent Management
                    </h1>
                    <p>Manage parents and link them to students</p>
                </div>
                <div className="dashboard-header-right">
                    <ThemeSelector />
                    <Link to="/admin/dashboard" className="btn btn-secondary">
                        ← Back
                    </Link>
                    <button
                        onClick={() => { resetForm(); setShowModal(true); }}
                        className="btn btn-primary"
                    >
                        + Add Parent
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="card" style={{ marginBottom: "2rem" }}>
                <div style={{ padding: "1.5rem", display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                    <input
                        type="text"
                        className="form-input"
                        placeholder="Search by name, email, or phone..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ flex: "1", minWidth: "250px" }}
                    />
                </div>
            </div>

            {/* Parents Table */}
            <div className="card">
                <div className="card-header">
                    <h3 className="card-title">All Parents ({parents.length})</h3>
                </div>
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Phone</th>
                                <th>Linked Students</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {parents.length === 0 ? (
                                <tr>
                                    <td colSpan="5" style={{ textAlign: "center", padding: "2rem" }}>
                                        No parents found
                                    </td>
                                </tr>
                            ) : (
                                parents.map((parent) => (
                                    <tr key={parent.id}>
                                        <td>
                                            <strong>{parent.name}</strong>
                                        </td>
                                        <td>{parent.email}</td>
                                        <td>{parent.phone}</td>
                                        <td>
                                            {parent.LinkedStudents && parent.LinkedStudents.length > 0 ? (
                                                <ul style={{ margin: 0, paddingLeft: "20px" }}>
                                                    {parent.LinkedStudents.map(s => (
                                                        <li key={s.id}>{s.User?.name} ({s.roll_number})</li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <span className="badge badge-secondary">None</span>
                                            )}
                                        </td>
                                        <td>
                                            <span
                                                className={`badge badge-${parent.status === "active" ? "success" : "danger"
                                                    }`}
                                            >
                                                {parent.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Parent Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "700px" }}>
                        <div className="modal-header">
                            <h3>Add New Parent</h3>
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
                                        />
                                    </div>
                                </div>

                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                                    <div className="form-group">
                                        <label className="form-label">Phone *</label>
                                        <input
                                            type="tel"
                                            name="phone"
                                            className="form-input"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
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
                                            required
                                            minLength={6}
                                        />
                                    </div>
                                </div>

                                <div className="form-group" style={{ marginTop: "1rem" }}>
                                    <label className="form-label">Link Students (Multiple selection allowed)</label>
                                    <select
                                        name="student_ids"
                                        className="form-select"
                                        multiple
                                        value={formData.student_ids}
                                        onChange={handleStudentChange}
                                        style={{ height: "150px" }}
                                    >
                                        {students.map((s) => (
                                            <option key={s.id} value={s.id}>
                                                {s.User?.name} (Roll: {s.roll_number})
                                            </option>
                                        ))}
                                    </select>
                                    <small style={{ color: "#6b7280" }}>Hold Ctrl (Windows) or Cmd (Mac) to select multiple</small>
                                </div>

                                <div className="modal-footer">
                                    <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn btn-primary">
                                        Add Parent
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

export default Parents;
