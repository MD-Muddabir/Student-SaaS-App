import { useState, useEffect, useRef, forwardRef, useImperativeHandle, useContext } from "react";
import { Link } from "react-router-dom";
import ThemeSelector from "../../components/ThemeSelector";
import api from "../../services/api";
import { AuthContext } from "../../context/AuthContext";
import "./Dashboard.css";
import "../../components/common/Buttons.css";
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS, CategoryScale, LinearScale, PointElement,
    LineElement, Title, Tooltip, Legend, Filler
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

const AdminExpenses = forwardRef((props, ref) => {
    const { user } = useContext(AuthContext);

    // Tab state — "expenses" or "transport"
    const [activeTab, setActiveTab] = useState("expenses");

    // ── Expenses state ──
    const [loading, setLoading] = useState(true);
    const [expenses, setExpenses] = useState([]);
    const [stats, setStats] = useState({
        totalExpense: 0,
        totalIncome: 0,
        profitLoss: 0,
        burnRate: 0
    });
    const [chartDataState, setChartDataState] = useState(null);
    const [filterPeriod, setFilterPeriod] = useState("current_month");
    const [filterDateValue, setFilterDateValue] = useState("");
    const chartRef = useRef(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [formData, setFormData] = useState({
        title: "",
        category: "Rent",
        amount: "",
        date: new Date().toISOString().split('T')[0],
        description: ""
    });

    // ── Transport Fees state ──
    const [transportFees, setTransportFees] = useState([]);
    const [transportLoading, setTransportLoading] = useState(false);
    const [showTransportModal, setShowTransportModal] = useState(false);
    const [editingTransport, setEditingTransport] = useState(null);
    const [transportForm, setTransportForm] = useState({ route_name: "", fee_amount: "" });
    const [transportError, setTransportError] = useState("");

    // ── Check permissions ──
    const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
    const hasExpensePerm = isAdmin || (user?.permissions && user.permissions.includes('expenses'));
    const hasTransportPerm = isAdmin || (user?.permissions && user.permissions.includes('transport'));

    useEffect(() => {
        if (activeTab === "expenses") {
            const timer = setTimeout(() => fetchExpensesData(), 300);
            return () => clearTimeout(timer);
        } else {
            fetchTransportFees();
        }
    }, [activeTab, filterPeriod, filterDateValue]);

    // ─────────────────── EXPENSES ───────────────────

    const fetchExpensesData = async () => {
        try {
            setLoading(true);
            let query = `?period=${filterPeriod}`;
            if (filterDateValue) query += `&dateValue=${filterDateValue}`;

            const [statsRes, expensesRes] = await Promise.all([
                api.get(`/expenses/stats${query}`),
                api.get(`/expenses${query}`)
            ]);

            if (statsRes.data.success) {
                setStats(statsRes.data.stats);
                if (statsRes.data.chartData) {
                    const sortedData = statsRes.data.chartData;
                    setChartDataState({
                        labels: sortedData.map(d => d.month),
                        datasets: [
                            {
                                label: 'Income (₹)',
                                data: sortedData.map(d => d.income),
                                borderColor: '#10b981',
                                backgroundColor: 'rgba(16,185,129,0.1)',
                                fill: true,
                                tension: 0.4
                            },
                            {
                                label: 'Expenses (₹)',
                                data: sortedData.map(d => d.expense),
                                borderColor: '#ef4444',
                                backgroundColor: 'rgba(239,68,68,0.1)',
                                fill: true,
                                tension: 0.4
                            }
                        ]
                    });
                }
            }
            if (expensesRes.data.success) setExpenses(expensesRes.data.expenses);
        } catch (error) {
            console.error("Error fetching expenses data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleAddExpense = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post("/expenses", formData);
            if (res.data.success) {
                setShowAddModal(false);
                setFormData({ title: "", category: "Rent", amount: "", date: new Date().toISOString().split('T')[0], description: "" });
                fetchExpensesData();
            }
        } catch (error) {
            alert(error.response?.data?.message || "Failed to add expense.");
        }
    };

    const handleDeleteExpense = async (id) => {
        if (!window.confirm("Are you sure you want to delete this expense?")) return;
        try {
            await api.delete(`/expenses/${id}`);
            fetchExpensesData();
        } catch (error) {
            alert("Failed to delete expense.");
        }
    };

    // ─────────────────── TRANSPORT FEES ───────────────────

    const fetchTransportFees = async () => {
        try {
            setTransportLoading(true);
            const res = await api.get("/transport-fees");
            if (res.data.success) setTransportFees(res.data.data);
        } catch (err) {
            console.error("Error fetching transport fees:", err);
        } finally {
            setTransportLoading(false);
        }
    };

    const handleTransportFormChange = (e) =>
        setTransportForm({ ...transportForm, [e.target.name]: e.target.value });

    const handleSaveTransport = async (e) => {
        e.preventDefault();
        setTransportError("");
        if (!transportForm.route_name.trim() || !transportForm.fee_amount) {
            setTransportError("Route name and fee amount are required.");
            return;
        }
        try {
            if (editingTransport) {
                await api.put(`/transport-fees/${editingTransport.id}`, transportForm);
            } else {
                await api.post("/transport-fees", transportForm);
            }
            setShowTransportModal(false);
            setEditingTransport(null);
            setTransportForm({ route_name: "", fee_amount: "" });
            fetchTransportFees();
        } catch (err) {
            setTransportError(err.response?.data?.message || "Failed to save transport fee.");
        }
    };

    const handleDeleteTransport = async (id) => {
        if (!window.confirm("Delete this transport route?")) return;
        try {
            await api.delete(`/transport-fees/${id}`);
            fetchTransportFees();
        } catch (err) {
            alert("Failed to delete transport fee.");
        }
    };

    const openEditTransport = (fee) => {
        setEditingTransport(fee);
        setTransportForm({ route_name: fee.route_name, fee_amount: fee.fee_amount });
        setTransportError("");
        setShowTransportModal(true);
    };

    // ─────────────────── EXPORT ───────────────────

    const handleExportPDF = () => {
        const doc = new jsPDF('landscape');
        doc.text("Institute Finances Report", 14, 15);
        let startY = 25;

        if (chartRef.current) {
            try {
                const chartImg = chartRef.current.toBase64Image();
                if (chartImg) { doc.addImage(chartImg, 'PNG', 14, startY, 260, 100); startY += 110; }
            } catch (_) { }
        }

        if (expenses.length > 0) {
            doc.text("Expenses", 14, startY);
            startY += 8;
            autoTable(doc, {
                head: [["Date", "Title", "Category", "Amount (₹)", "Description"]],
                body: expenses.map(e => [
                    new Date(e.date).toLocaleDateString(), e.title, e.category,
                    parseFloat(e.amount).toLocaleString(), e.description || "-"
                ]),
                startY
            });
        }
        doc.save("institute_finances.pdf");
    };

    const handleExportExcel = () => {
        if (!expenses.length) { alert("No data to export."); return; }
        const ws = XLSX.utils.aoa_to_sheet([
            ["Date", "Title", "Category", "Amount (₹)", "Description"],
            ...expenses.map(e => [new Date(e.date).toLocaleDateString(), e.title, e.category, parseFloat(e.amount), e.description || ""])
        ]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Expenses");
        XLSX.writeFile(wb, "institute_finances.xlsx");
    };

    useImperativeHandle(ref, () => ({ handleExportPDF, handleExportExcel }));

    // ─────────────────── TAB STYLES ───────────────────

    const tabStyle = (active) => ({
        padding: "0.65rem 1.5rem",
        borderRadius: "8px 8px 0 0",
        border: "none",
        cursor: "pointer",
        fontWeight: active ? "700" : "500",
        fontSize: "0.95rem",
        background: active ? "var(--primary-color, #6366f1)" : "transparent",
        color: active ? "#fff" : "var(--text-secondary, #9ca3af)",
        transition: "all 0.2s",
        borderBottom: active ? "3px solid transparent" : "3px solid transparent",
    });

    // ─────────────────── RENDER ───────────────────

    return (
        <div className={props.isReportMode ? "" : "dashboard-container"}>
            {/* ── Header ── */}
            {!props.isReportMode && (
                <div className="dashboard-header">
                    <div>
                        <h1>💸 Finances & Transport</h1>
                        <p>Manage expenses, track income, and configure transport routes</p>
                    </div>
                    <div className="dashboard-header-right" style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                        {activeTab === "expenses" && (
                            <>
                                <button onClick={handleExportPDF} className="btn btn-primary"
                                    style={{ backgroundColor: "#ef4444", borderColor: "#ef4444", padding: '0.5rem 1rem' }}>
                                    📄 PDF
                                </button>
                                <button onClick={handleExportExcel} className="btn btn-primary"
                                    style={{ backgroundColor: "#10b981", borderColor: "#10b981", padding: '0.5rem 1rem' }}>
                                    📊 Excel
                                </button>
                                {hasExpensePerm && (
                                    <button className="animated-btn primary" onClick={() => setShowAddModal(true)}>
                                        <span className="icon">➕</span> Add Expense
                                    </button>
                                )}
                            </>
                        )}
                        {activeTab === "transport" && hasTransportPerm && (
                            <button className="animated-btn primary"
                                onClick={() => { setEditingTransport(null); setTransportForm({ route_name: "", fee_amount: "" }); setTransportError(""); setShowTransportModal(true); }}>
                                <span className="icon">➕</span> Add Route
                            </button>
                        )}
                        <ThemeSelector />
                        <Link to="/admin/dashboard" className="btn btn-secondary">← Back</Link>
                    </div>
                </div>
            )}

            {/* ── Tabs ── */}
            <div style={{ display: 'flex', gap: '4px', marginBottom: '0', borderBottom: '2px solid var(--border-color, #e5e7eb)', paddingBottom: 0 }}>
                {hasExpensePerm && (
                    <button style={tabStyle(activeTab === "expenses")} onClick={() => setActiveTab("expenses")}>
                        💸 Expenses
                    </button>
                )}
                {(hasTransportPerm || isAdmin) && (
                    <button style={tabStyle(activeTab === "transport")} onClick={() => setActiveTab("transport")}>
                        🚌 Transport Fees
                    </button>
                )}
            </div>

            {/* ══════════════ EXPENSES TAB ══════════════ */}
            {activeTab === "expenses" && (
                <div style={{ paddingTop: '1.5rem' }}>
                    {/* Filter */}
                    <div style={{
                        display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.5rem',
                        padding: '1rem', borderRadius: '12px',
                        backgroundColor: 'var(--card-bg, rgba(255,255,255,0.05))',
                        border: '1px solid var(--border-color, rgba(255,255,255,0.1))'
                    }}>
                        <span style={{ fontSize: '1.2rem' }}>📅</span>
                        <strong style={{ color: 'var(--text-primary)' }}>Period:</strong>
                        <select className="form-select"
                            style={{ padding: '0.6rem 1rem', minWidth: '180px', margin: 0, borderRadius: '8px', border: '1px solid var(--border-color)' }}
                            value={filterPeriod}
                            onChange={(e) => { setFilterPeriod(e.target.value); setFilterDateValue(""); }}>
                            <option value="current_month">Current Month</option>
                            <option value="month">Specific Month</option>
                            <option value="year">Specific Year</option>
                            <option value="all">All Time</option>
                        </select>
                        {filterPeriod === 'month' && (
                            <input type="month" className="form-input"
                                style={{ padding: '0.6rem 1rem', margin: 0, borderRadius: '8px', border: '1px solid var(--border-color)' }}
                                value={filterDateValue} onChange={(e) => setFilterDateValue(e.target.value)} />
                        )}
                        {filterPeriod === 'year' && (
                            <input type="number" className="form-input" placeholder="e.g. 2026"
                                style={{ padding: '0.6rem 1rem', width: '150px', margin: 0, borderRadius: '8px', border: '1px solid var(--border-color)' }}
                                value={filterDateValue} onChange={(e) => setFilterDateValue(e.target.value)} />
                        )}
                    </div>

                    {/* Stats — admin sees all 4, manager sees only expenses count + amount */}
                    <div className="stats-grid" style={{ gridTemplateColumns: isAdmin ? "repeat(4, 1fr)" : "repeat(2, 1fr)" }}>
                        {isAdmin && (
                            <div className="stat-card">
                                <div className="stat-icon" style={{ backgroundColor: "rgba(16,185,129,0.1)", color: "#10b981" }}>💵</div>
                                <div className="stat-content">
                                    <h3>₹{stats.totalIncome?.toLocaleString() || 0}</h3>
                                    <p>Monthly Income</p>
                                </div>
                            </div>
                        )}
                        <div className="stat-card">
                            <div className="stat-icon" style={{ backgroundColor: "rgba(239,68,68,0.1)", color: "#ef4444" }}>🔥</div>
                            <div className="stat-content">
                                <h3>₹{stats.totalExpense?.toLocaleString() || 0}</h3>
                                <p>Total Expenses</p>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon" style={{ backgroundColor: "rgba(245,158,11,0.1)", color: "#f59e0b" }}>📝</div>
                            <div className="stat-content">
                                <h3>{expenses.length}</h3>
                                <p>Entries</p>
                            </div>
                        </div>
                        {isAdmin && (
                            <div className="stat-card">
                                <div className="stat-icon"
                                    style={{ backgroundColor: stats.profitLoss >= 0 ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)", color: stats.profitLoss >= 0 ? "#10b981" : "#ef4444" }}>
                                    📈
                                </div>
                                <div className="stat-content">
                                    <h3>₹{stats.profitLoss?.toLocaleString() || 0}</h3>
                                    <p>Profit / Loss</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Chart — only admins see income vs expenses */}
                    {isAdmin && chartDataState && (
                        <div className="card" style={{ marginTop: "2rem", padding: "1.5rem" }}>
                            <h3 style={{ marginBottom: "1rem" }}>Financial Overview</h3>
                            <div style={{ height: "300px", width: "100%" }}>
                                <Line ref={chartRef} data={chartDataState}
                                    options={{
                                        responsive: true, maintainAspectRatio: false,
                                        plugins: { legend: { position: 'top' } },
                                        scales: { y: { beginAtZero: true } }
                                    }} />
                            </div>
                        </div>
                    )}

                    {/* Expenses List */}
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '3rem' }}>Loading expenses...</div>
                    ) : (
                        <div className="card" style={{ marginTop: "2rem" }}>
                            <div className="card-header">
                                <h3 className="card-title">Expenses List</h3>
                            </div>
                            <div className="table-container">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Title</th>
                                            <th>Category</th>
                                            <th>Amount</th>
                                            {!props.isReportMode && isAdmin && <th>Actions</th>}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {expenses.length === 0 ? (
                                            <tr><td colSpan="5" style={{ textAlign: "center", padding: "2rem" }}>No expenses recorded yet.</td></tr>
                                        ) : (
                                            expenses.map(exp => (
                                                <tr key={exp.id}>
                                                    <td>{new Date(exp.date).toLocaleDateString()}</td>
                                                    <td>
                                                        <strong>{exp.title}</strong>
                                                        {exp.description && <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>{exp.description}</div>}
                                                    </td>
                                                    <td><span className="badge badge-primary">{exp.category}</span></td>
                                                    <td style={{ color: "#ef4444", fontWeight: "bold" }}>-₹{parseFloat(exp.amount).toLocaleString()}</td>
                                                    {!props.isReportMode && isAdmin && (
                                                        <td>
                                                            <button className="btn btn-sm btn-danger" onClick={() => handleDeleteExpense(exp.id)}>Delete</button>
                                                        </td>
                                                    )}
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ══════════════ TRANSPORT FEES TAB ══════════════ */}
            {activeTab === "transport" && (
                <div style={{ paddingTop: '1.5rem' }}>
                    <div style={{
                        background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(168,85,247,0.1))',
                        border: '1px solid var(--border-color)',
                        borderRadius: '12px',
                        padding: '1.25rem',
                        marginBottom: '1.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem'
                    }}>
                        <span style={{ fontSize: '2rem' }}>🚌</span>
                        <div>
                            <h3 style={{ margin: 0 }}>Transport Route Fee Plans</h3>
                            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                Manage bus routes and their monthly fee amounts. Students can be assigned to routes.
                            </p>
                        </div>
                    </div>

                    {transportLoading ? (
                        <div style={{ textAlign: 'center', padding: '3rem' }}>Loading transport fees...</div>
                    ) : (
                        <>
                            {/* Summary Cards */}
                            <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '1.5rem' }}>
                                <div className="stat-card">
                                    <div className="stat-icon" style={{ backgroundColor: 'rgba(99,102,241,0.1)', color: '#6366f1' }}>🚌</div>
                                    <div className="stat-content">
                                        <h3>{transportFees.length}</h3>
                                        <p>Active Routes</p>
                                    </div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-icon" style={{ backgroundColor: 'rgba(16,185,129,0.1)', color: '#10b981' }}>💰</div>
                                    <div className="stat-content">
                                        <h3>₹{transportFees.length > 0 ? Math.min(...transportFees.map(f => parseFloat(f.fee_amount))).toLocaleString() : 0}</h3>
                                        <p>Lowest Route Fee</p>
                                    </div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-icon" style={{ backgroundColor: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}>📍</div>
                                    <div className="stat-content">
                                        <h3>₹{transportFees.length > 0 ? Math.max(...transportFees.map(f => parseFloat(f.fee_amount))).toLocaleString() : 0}</h3>
                                        <p>Highest Route Fee</p>
                                    </div>
                                </div>
                            </div>

                            {transportFees.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '4rem 2rem', borderRadius: '12px', border: '2px dashed var(--border-color)' }}>
                                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🚌</div>
                                    <h3>No transport routes configured yet</h3>
                                    <p style={{ color: 'var(--text-secondary)' }}>Add your first route to get started.</p>
                                    {hasTransportPerm && (
                                        <button className="btn btn-primary" style={{ marginTop: '1rem' }}
                                            onClick={() => { setEditingTransport(null); setTransportForm({ route_name: "", fee_amount: "" }); setTransportError(""); setShowTransportModal(true); }}>
                                            ➕ Add First Route
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                                    gap: '1rem'
                                }}>
                                    {transportFees.map(fee => (
                                        <div key={fee.id} className="card" style={{
                                            padding: '1.5rem',
                                            borderRadius: '12px',
                                            border: '1px solid var(--border-color)',
                                            transition: 'transform 0.2s, box-shadow 0.2s',
                                            position: 'relative',
                                            overflow: 'hidden'
                                        }}
                                            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
                                            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                                        >
                                            <div style={{
                                                position: 'absolute', top: 0, left: 0, right: 0, height: '4px',
                                                background: 'linear-gradient(90deg, #6366f1, #a855f7)'
                                            }} />
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                                                <div style={{
                                                    width: '48px', height: '48px', borderRadius: '12px',
                                                    background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    fontSize: '1.5rem'
                                                }}>🚌</div>
                                                <div>
                                                    <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{fee.route_name}</h3>
                                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                                        Added by {fee.creator?.name || 'Admin'}
                                                    </span>
                                                </div>
                                            </div>
                                            <div style={{
                                                background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(168,85,247,0.1))',
                                                borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1rem'
                                            }}>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '2px' }}>Monthly Fee</div>
                                                <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#6366f1' }}>
                                                    ₹{parseFloat(fee.fee_amount).toLocaleString()}
                                                </div>
                                            </div>
                                            {hasTransportPerm && (
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    <button className="btn btn-secondary" style={{ flex: 1, fontSize: '0.85rem' }}
                                                        onClick={() => openEditTransport(fee)}>
                                                        ✏️ Edit
                                                    </button>
                                                    <button className="btn btn-danger" style={{ flex: 1, fontSize: '0.85rem' }}
                                                        onClick={() => handleDeleteTransport(fee.id)}>
                                                        🗑️ Delete
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}

            {/* ══════════════ ADD EXPENSE MODAL ══════════════ */}
            {showAddModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2 style={{ marginBottom: "1.5rem", borderBottom: "1px solid var(--border-color)", paddingBottom: "1rem" }}>
                            ➕ Add New Expense
                        </h2>
                        <form onSubmit={handleAddExpense} className="form-grid">
                            <div className="form-group">
                                <label className="form-label">Title *</label>
                                <input type="text" className="form-input" name="title" value={formData.title}
                                    onChange={handleInputChange} required placeholder="e.g. November Rent" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Category *</label>
                                <select className="form-select" name="category" value={formData.category} onChange={handleInputChange}>
                                    <option>Rent</option>
                                    <option>Electricity</option>
                                    <option>Internet</option>
                                    <option>Xerox</option>
                                    <option value="Faculty Salary">Faculty Salary</option>
                                    <option value="Office Supplies">Office Supplies</option>
                                    <option>Maintenance</option>
                                    <option value="Transport Fuel">Transport Fuel</option>
                                    <option>Other</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Amount (₹) *</label>
                                <input type="number" className="form-input" name="amount" value={formData.amount}
                                    onChange={handleInputChange} required placeholder="e.g. 5000" min="1" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Date *</label>
                                <input type="date" className="form-input" name="date" value={formData.date}
                                    onChange={handleInputChange} required />
                            </div>
                            <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                                <label className="form-label">Description (Optional)</label>
                                <textarea className="form-input" name="description" value={formData.description}
                                    onChange={handleInputChange} rows="3" placeholder="Additional details..." />
                            </div>
                            <div className="form-actions" style={{ gridColumn: "1 / -1", marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid var(--border-color)" }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">💾 Save Expense</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ══════════════ ADD/EDIT TRANSPORT MODAL ══════════════ */}
            {showTransportModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '440px' }}>
                        <h2 style={{ marginBottom: "1.5rem", borderBottom: "1px solid var(--border-color)", paddingBottom: "1rem" }}>
                            {editingTransport ? '✏️ Edit Transport Route' : '➕ Add Transport Route'}
                        </h2>
                        <form onSubmit={handleSaveTransport}>
                            <div className="form-group" style={{ marginBottom: '1rem' }}>
                                <label className="form-label">Route Name *</label>
                                <input type="text" className="form-input" name="route_name"
                                    value={transportForm.route_name} onChange={handleTransportFormChange}
                                    placeholder="e.g. Route A - City Center" required />
                            </div>
                            <div className="form-group" style={{ marginBottom: '1rem' }}>
                                <label className="form-label">Monthly Fee (₹) *</label>
                                <input type="number" className="form-input" name="fee_amount"
                                    value={transportForm.fee_amount} onChange={handleTransportFormChange}
                                    placeholder="e.g. 500" min="1" required />
                            </div>
                            {transportError && (
                                <div style={{ color: '#ef4444', marginBottom: '1rem', fontSize: '0.9rem' }}>
                                    ⚠️ {transportError}
                                </div>
                            )}
                            <div className="form-actions" style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid var(--border-color)" }}>
                                <button type="button" className="btn btn-secondary"
                                    onClick={() => { setShowTransportModal(false); setEditingTransport(null); }}>Cancel</button>
                                <button type="submit" className="btn btn-primary">
                                    {editingTransport ? '✅ Update Route' : '💾 Add Route'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
});

export default AdminExpenses;
