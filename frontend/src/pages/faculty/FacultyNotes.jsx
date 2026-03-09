import { useState, useEffect } from "react";
import api from "../../services/api";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { toast } from "react-hot-toast";

function FacultyNotes() {
    const [notes, setNotes] = useState([]);
    const [classes, setClasses] = useState([]);
    const [subjects, setSubjects] = useState([]);       // all subjects taught by this faculty
    const [filteredSubjects, setFilteredSubjects] = useState([]); // subjects for selected class
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        class_id: "",
        subject_id: "",
        file: null
    });

    useEffect(() => {
        loadAll();
    }, []);

    const loadAll = async () => {
        try {
            setLoading(true);
            // GET /api/subjects - backend auto-filters by faculty_id when role=faculty
            const subRes = await api.get("/subjects");
            const mySubjects = subRes.data.success ? subRes.data.data : [];
            setSubjects(mySubjects);

            // Derive unique classes from those subjects
            const classMap = new Map();
            mySubjects.forEach(s => {
                if (s.Class) classMap.set(s.Class.id, s.Class);
            });
            setClasses(Array.from(classMap.values()));

            // Load notes for each of my subjects
            let allNotes = [];
            for (const sub of mySubjects) {
                try {
                    const nRes = await api.get(`/notes/subject/${sub.id}`);
                    if (nRes.data.success && nRes.data.data) {
                        allNotes = [...allNotes, ...nRes.data.data.map(n => ({
                            ...n,
                            subjectName: sub.name,
                            className: sub.Class?.name
                        }))];
                    }
                } catch (_) { }
            }
            const unique = Array.from(new Map(allNotes.map(n => [n.id, n])).values());
            setNotes(unique);
        } catch (err) {
            console.error("loadAll error:", err);
            toast.error("Failed to load data");
        } finally {
            setLoading(false);
        }
    };

    // When class changes in form, filter the subject dropdown
    const handleChange = (e) => {
        const { name, value, files } = e.target;
        if (name === "file") {
            setFormData(f => ({ ...f, file: files[0] }));
        } else if (name === "class_id") {
            const subForClass = subjects.filter(s => String(s.class_id) === String(value) || String(s.Class?.id) === String(value));
            setFilteredSubjects(subForClass);
            setFormData(f => ({ ...f, class_id: value, subject_id: "" }));
        } else {
            setFormData(f => ({ ...f, [name]: value }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.file) { toast.error("Please select a file"); return; }
        setUploading(true);

        const data = new FormData();
        data.append("title", formData.title);
        data.append("description", formData.description);
        data.append("class_id", formData.class_id);
        data.append("subject_id", formData.subject_id);
        data.append("file", formData.file);

        try {
            const res = await api.post("/notes/upload", data, {
                headers: { "Content-Type": "multipart/form-data" }
            });
            if (res.data.success) {
                toast.success("Note uploaded successfully!");
                setShowModal(false);
                setFormData({ title: "", description: "", class_id: "", subject_id: "", file: null });
                loadAll();
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to upload note");
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this note?")) return;
        try {
            const res = await api.delete(`/notes/${id}`);
            if (res.data.success) {
                toast.success("Note deleted");
                setNotes(n => n.filter(x => x.id !== id));
            }
        } catch {
            toast.error("Failed to delete note");
        }
    };

    if (loading) return <div style={{ padding: 40 }}><LoadingSpinner /></div>;

    return (
        <div className="dashboard-container">
            {/* Header */}
            <div className="dashboard-header">
                <div>
                    <h1>📚 Class Notes</h1>
                    <p>Upload and manage study materials for your students.</p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn-secondary" onClick={() => window.history.back()}>
                        ⬅ Back
                    </button>
                    <button className="btn btn-primary" onClick={() => {
                        setFilteredSubjects([]);
                        setFormData({ title: "", description: "", class_id: "", subject_id: "", file: null });
                        setShowModal(true);
                    }}>
                        + Upload Note
                    </button>
                </div>
            </div>

            {/* Notes Table */}
            <div className="card">
                {notes.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📄</div>
                        <p>No notes uploaded yet. Click <strong>+ Upload Note</strong> to add study materials.</p>
                    </div>
                ) : (
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Title</th>
                                    <th>Class</th>
                                    <th>Subject</th>
                                    <th>File</th>
                                    <th>Date</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {notes.map(note => (
                                    <tr key={note.id}>
                                        <td>
                                            <div style={{ fontWeight: 600 }}>{note.title}</div>
                                            {note.description && <small style={{ color: 'var(--text-secondary)' }}>{note.description}</small>}
                                        </td>
                                        <td>{note.className || note.Class?.name || "—"}</td>
                                        <td>{note.subjectName || note.Subject?.name || note.subject_id}</td>
                                        <td>
                                            <a
                                                href={`${api.defaults.baseURL.replace('/api', '')}${note.file_url}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="btn btn-secondary"
                                                style={{ padding: '4px 12px', fontSize: '0.8rem' }}
                                            >
                                                View
                                            </a>
                                        </td>
                                        <td>{new Date(note.created_at).toLocaleDateString()}</td>
                                        <td>
                                            <button className="btn btn-danger" style={{ padding: '4px 12px', fontSize: '0.8rem' }} onClick={() => handleDelete(note.id)}>
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Upload Modal */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: 520, width: '95%' }}>
                        <h2>📤 Upload Study Material</h2>

                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label">Title *</label>
                                <input
                                    type="text"
                                    name="title"
                                    className="form-input"
                                    placeholder="e.g. Chapter 3 - Photosynthesis"
                                    value={formData.title}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Description (Optional)</label>
                                <textarea
                                    name="description"
                                    className="form-input"
                                    placeholder="Brief description of this material..."
                                    value={formData.description}
                                    onChange={handleChange}
                                    rows={2}
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                <div className="form-group">
                                    <label className="form-label">Class *</label>
                                    <select
                                        name="class_id"
                                        className="form-input"
                                        value={formData.class_id}
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="">Select Class</option>
                                        {classes.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Subject *</label>
                                    <select
                                        name="subject_id"
                                        className="form-input"
                                        value={formData.subject_id}
                                        onChange={handleChange}
                                        required
                                        disabled={!formData.class_id}
                                    >
                                        <option value="">
                                            {formData.class_id ? "Select Subject" : "Select class first"}
                                        </option>
                                        {filteredSubjects.map(s => (
                                            <option key={s.id} value={s.id}>{s.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">File (PDF, DOCX, PPT, Image) *</label>
                                <input
                                    type="file"
                                    name="file"
                                    className="form-input"
                                    onChange={handleChange}
                                    accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png,.zip"
                                    required
                                />
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)} disabled={uploading}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={uploading}>
                                    {uploading ? "Uploading..." : "Upload"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default FacultyNotes;
