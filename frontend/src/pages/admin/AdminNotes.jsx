import { useState, useEffect, useMemo } from "react";
import api from "../../services/api";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { toast } from "react-hot-toast";

// Build the base server URL from the api config (strips /api suffix)
const SERVER_URL = api.defaults.baseURL.replace("/api", "");

// Helper: human-readable file size
function formatSize(bytes) {
    if (!bytes) return "—";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

// Helper: file icon based on mime-type
function fileIcon(mime) {
    if (!mime) return "📄";
    if (mime.includes("pdf")) return "📕";
    if (mime.includes("word") || mime.includes("docx") || mime.includes("doc")) return "📘";
    if (mime.includes("presentation") || mime.includes("ppt")) return "📙";
    if (mime.includes("image")) return "🖼️";
    if (mime.includes("zip") || mime.includes("compressed")) return "🗜️";
    return "📄";
}

function AdminNotes() {
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState(null);

    // Filters
    const [searchQuery, setSearchQuery] = useState("");
    const [filterClass, setFilterClass] = useState("all");
    const [filterSubject, setFilterSubject] = useState("all");
    const [filterFaculty, setFilterFaculty] = useState("all");

    useEffect(() => {
        fetchNotes();
    }, []);

    const fetchNotes = async () => {
        setLoading(true);
        try {
            const res = await api.get("/notes");
            if (res.data.success) {
                setNotes(res.data.data || []);
            } else {
                toast.error("Failed to load notes");
            }
        } catch (error) {
            console.error("Error fetching notes:", error);
            toast.error("Error loading study materials");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("⚠️ Are you sure you want to permanently delete this study material? This action cannot be undone.")) return;
        setDeletingId(id);
        try {
            const res = await api.delete(`/notes/${id}`);
            if (res.data.success) {
                toast.success("Study material deleted successfully");
                setNotes(prev => prev.filter(n => n.id !== id));
            } else {
                toast.error(res.data.message || "Failed to delete");
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to delete note");
        } finally {
            setDeletingId(null);
        }
    };

    // Derived filter options from notes data
    const classes = useMemo(() => {
        const map = new Map();
        notes.forEach(n => {
            if (n.Class) map.set(n.Class.id, n.Class.name);
        });
        return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
    }, [notes]);

    const subjects = useMemo(() => {
        const map = new Map();
        notes.forEach(n => {
            if (n.Subject) map.set(n.Subject.id, n.Subject.name);
        });
        return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
    }, [notes]);

    const faculties = useMemo(() => {
        const map = new Map();
        notes.forEach(n => {
            const name = n.Faculty?.User?.name || n.Faculty?.User?.email || `Faculty #${n.faculty_id}`;
            const key = n.faculty_id;
            if (!map.has(key)) map.set(key, name);
        });
        return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
    }, [notes]);

    // Apply filters
    const filteredNotes = useMemo(() => {
        return notes.filter(note => {
            const q = searchQuery.toLowerCase();
            const matchSearch = !q
                || note.title?.toLowerCase().includes(q)
                || note.description?.toLowerCase().includes(q)
                || (note.Faculty?.User?.name || "").toLowerCase().includes(q)
                || (note.Class?.name || "").toLowerCase().includes(q)
                || (note.Subject?.name || "").toLowerCase().includes(q);

            const matchClass = filterClass === "all" || String(note.class_id) === String(filterClass);
            const matchSubject = filterSubject === "all" || String(note.subject_id) === String(filterSubject);
            const matchFaculty = filterFaculty === "all" || String(note.faculty_id) === String(filterFaculty);

            return matchSearch && matchClass && matchSubject && matchFaculty;
        });
    }, [notes, searchQuery, filterClass, filterSubject, filterFaculty]);

    const stats = useMemo(() => ({
        total: notes.length,
        faculties: faculties.length,
        classes: classes.length,
        subjects: subjects.length,
    }), [notes, faculties, classes, subjects]);

    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><LoadingSpinner /></div>;

    return (
        <div className="dashboard-container">
            {/* ── Page Header ── */}
            <div className="dashboard-header">
                <div>
                    <h1>📚 Manage Study Materials</h1>
                    <p>Monitor and manage all study materials uploaded by faculty members across your institute.</p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn-secondary" onClick={() => window.history.back()}>
                        ⬅ Back
                    </button>
                    <button className="btn btn-secondary" onClick={fetchNotes}>
                        🔄 Refresh
                    </button>
                </div>
            </div>

            {/* ── Stats Row ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                {[
                    { label: "Total Materials", value: stats.total, icon: "📄" },
                    { label: "Faculty Members", value: stats.faculties, icon: "👨‍🏫" },
                    { label: "Classes", value: stats.classes, icon: "🏫" },
                    { label: "Subjects", value: stats.subjects, icon: "📖" },
                ].map(stat => (
                    <div key={stat.label} className="card" style={{ padding: '1rem 1.25rem', textAlign: 'center' }}>
                        <div style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>{stat.icon}</div>
                        <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--primary)' }}>{stat.value}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{stat.label}</div>
                    </div>
                ))}
            </div>

            {/* ── Filters ── */}
            <div className="card" style={{ padding: '1rem 1.25rem', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
                    <div style={{ flex: '2 1 220px' }}>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="🔍 Search by title, description, faculty, class, subject…"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div style={{ flex: '1 1 150px' }}>
                        <select
                            className="form-input"
                            value={filterClass}
                            onChange={e => setFilterClass(e.target.value)}
                        >
                            <option value="all">All Classes</option>
                            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div style={{ flex: '1 1 150px' }}>
                        <select
                            className="form-input"
                            value={filterSubject}
                            onChange={e => setFilterSubject(e.target.value)}
                        >
                            <option value="all">All Subjects</option>
                            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                    <div style={{ flex: '1 1 150px' }}>
                        <select
                            className="form-input"
                            value={filterFaculty}
                            onChange={e => setFilterFaculty(e.target.value)}
                        >
                            <option value="all">All Faculty</option>
                            {faculties.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                        </select>
                    </div>
                    {(searchQuery || filterClass !== "all" || filterSubject !== "all" || filterFaculty !== "all") && (
                        <button
                            className="btn btn-secondary"
                            onClick={() => { setSearchQuery(""); setFilterClass("all"); setFilterSubject("all"); setFilterFaculty("all"); }}
                        >
                            ✕ Clear
                        </button>
                    )}
                </div>
                {filteredNotes.length !== notes.length && (
                    <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        Showing <strong>{filteredNotes.length}</strong> of <strong>{notes.length}</strong> materials
                    </div>
                )}
            </div>

            {/* ── Table ── */}
            <div className="card">
                {filteredNotes.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-secondary)' }}>
                        <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>{notes.length === 0 ? "📭" : "🔍"}</div>
                        <h3 style={{ margin: '0 0 0.5rem', color: 'var(--text-primary)' }}>
                            {notes.length === 0 ? "No Study Materials Yet" : "No Results Found"}
                        </h3>
                        <p style={{ margin: 0 }}>
                            {notes.length === 0
                                ? "Faculty members haven't uploaded any study materials yet."
                                : "Try adjusting your search or filter criteria."}
                        </p>
                    </div>
                ) : (
                    <div className="table-container">
                        <table className="table mobile-keep">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Material</th>
                                    <th>Class / Subject</th>
                                    <th>Uploaded By</th>
                                    <th>File Info</th>
                                    <th>Date</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredNotes.map((note, idx) => {
                                    const facultyName = note.Faculty?.User?.name
                                        || note.Faculty?.User?.email
                                        || `Faculty #${note.faculty_id}`;

                                    const fileUrl = note.file_url
                                        ? `${SERVER_URL}${note.file_url}`
                                        : null;

                                    return (
                                        <tr key={note.id}>
                                            <td style={{ color: 'var(--text-secondary)', minWidth: 36 }}>{idx + 1}</td>

                                            {/* Material info */}
                                            <td style={{ minWidth: 200 }}>
                                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                                                    <span style={{ fontSize: '1.4rem' }}>{fileIcon(note.file_type)}</span>
                                                    <div>
                                                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{note.title}</div>
                                                        {note.description && (
                                                            <small style={{ color: 'var(--text-secondary)', display: 'block', maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                {note.description}
                                                            </small>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Class / Subject */}
                                            <td style={{ minWidth: 160 }}>
                                                <div style={{ fontWeight: 500 }}>
                                                    {note.Class?.name || <span style={{ color: 'var(--text-secondary)' }}>Class #{note.class_id}</span>}
                                                </div>
                                                <small style={{ color: 'var(--text-secondary)' }}>
                                                    {note.Subject?.name || `Subject #${note.subject_id}`}
                                                </small>
                                            </td>

                                            {/* Faculty Name */}
                                            <td style={{ minWidth: 150 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                    <span style={{
                                                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                                        width: 30, height: 30, borderRadius: '50%',
                                                        background: 'var(--primary)', color: '#fff',
                                                        fontSize: '0.75rem', fontWeight: 700, flexShrink: 0
                                                    }}>
                                                        {facultyName.charAt(0).toUpperCase()}
                                                    </span>
                                                    <div>
                                                        <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{facultyName}</div>
                                                        {note.Faculty?.User?.email && note.Faculty?.User?.name && (
                                                            <small style={{ color: 'var(--text-secondary)' }}>{note.Faculty.User.email}</small>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>

                                            {/* File info */}
                                            <td style={{ minWidth: 100 }}>
                                                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                                    {note.file_type && (
                                                        <span style={{
                                                            display: 'inline-block', padding: '2px 8px',
                                                            borderRadius: 4, background: 'var(--background)',
                                                            border: '1px solid var(--border)', fontSize: '0.75rem',
                                                            marginBottom: 3
                                                        }}>
                                                            {note.file_type.split('/').pop().toUpperCase()}
                                                        </span>
                                                    )}
                                                    <div>{formatSize(note.file_size)}</div>
                                                </div>
                                            </td>

                                            {/* Date */}
                                            <td style={{ minWidth: 100, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                                                {new Date(note.created_at).toLocaleDateString("en-IN", {
                                                    day: "2-digit", month: "short", year: "numeric"
                                                })}
                                            </td>

                                            {/* Actions */}
                                            <td style={{ minWidth: 140 }}>
                                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                                    {fileUrl ? (
                                                        <a
                                                            href={fileUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="btn btn-secondary"
                                                            style={{ padding: '4px 12px', fontSize: '0.8rem', textDecoration: 'none' }}
                                                            title="Open file in new tab"
                                                        >
                                                            👁️ View
                                                        </a>
                                                    ) : (
                                                        <button className="btn btn-secondary" disabled style={{ padding: '4px 12px', fontSize: '0.8rem' }}>
                                                            No File
                                                        </button>
                                                    )}
                                                    <button
                                                        className="btn btn-danger"
                                                        style={{ padding: '4px 12px', fontSize: '0.8rem' }}
                                                        onClick={() => handleDelete(note.id)}
                                                        disabled={deletingId === note.id}
                                                        title="Permanently delete this material"
                                                    >
                                                        {deletingId === note.id ? "…" : "🗑️ Delete"}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

export default AdminNotes;
