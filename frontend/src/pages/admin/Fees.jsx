/**
 * Fees Management Page
 * Handles Fee Structures and Student Payments
 */

import { useState, useEffect } from "react";
import api from "../../services/api";
import "./Dashboard.css";

function Fees() {
    const [activeTab, setActiveTab] = useState("structure"); // 'structure' or 'payments'

    // Data States
    const [feeStructures, setFeeStructures] = useState([]);
    const [payments, setPayments] = useState([]);
    const [classes, setClasses] = useState([]);
    const [students, setStudents] = useState([]);

    // UI States
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    // Forms
    const [structureForm, setStructureForm] = useState({
        class_id: "",
        fee_type: "Tuition Fee",
        amount: "",
        due_date: "",
        description: ""
    });

    const [paymentForm, setPaymentForm] = useState({
        student_id: "",
        amount: "",
        payment_method: "cash",
        transaction_id: "",
        payment_date: new Date().toISOString().split('T')[0],
        remarks: ""
    });

    useEffect(() => {
        fetchInitialData();
    }, []);

    useEffect(() => {
        if (activeTab === "structure") fetchFeeStructures();
        else fetchPayments();
    }, [activeTab]);

    const fetchInitialData = async () => {
        try {
            const [classRes, studentRes] = await Promise.all([
                api.get("/classes"),
                api.get("/students")
            ]);
            setClasses(classRes.data.data || []);
            setStudents(studentRes.data.data || []);
        } catch (error) {
            console.error("Error fetching initial data", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchFeeStructures = async () => {
        try {
            const res = await api.get("/fees/structure");
            setFeeStructures(res.data.data || []);
        } catch (error) {
            console.error("Error fetching fee structures", error);
        }
    };

    const fetchPayments = async () => {
        try {
            const res = await api.get("/fees/payments");
            setPayments(res.data.data || []);
        } catch (error) {
            console.error("Error fetching payments", error);
        }
    };

    const handleStructureSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post("/fees/structure", structureForm);
            alert("Fee structure created successfully");
            setShowModal(false);
            fetchFeeStructures();
            setStructureForm({
                class_id: "",
                fee_type: "Tuition Fee",
                amount: "",
                due_date: "",
                description: ""
            });
        } catch (error) {
            alert(error.response?.data?.message || "Error creating fee structure");
        }
    };

    const handlePaymentSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post("/fees/pay", paymentForm);
            alert("Payment recorded successfully");
            setShowModal(false);
            fetchPayments();
            setPaymentForm({
                student_id: "",
                amount: "",
                payment_method: "cash",
                transaction_id: "",
                payment_date: new Date().toISOString().split('T')[0],
                remarks: ""
            });
        } catch (error) {
            alert(error.response?.data?.message || "Error recording payment");
        }
    };

    const getStudentName = (id) => {
        const s = students.find(std => std.id === id);
        return s ? s.User?.name : "Unknown Student";
    };

    const getClassName = (id) => {
        const c = classes.find(cls => cls.id === id);
        return c ? `${c.name} ${c.section || ''}` : "All Classes";
    };

    if (loading) return <div className="dashboard-container">Loading...</div>;

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <div>
                    <h1>💰 Fee Management</h1>
                    <p>Manage fee structures and record payments</p>
                </div>
                <button
                    className="btn btn-primary"
                    onClick={() => setShowModal(true)}
                >
                    {activeTab === "structure" ? "+ Add Fee Structure" : "+ Record Payment"}
                </button>
            </div>

            {/* Tabs */}
            <div className="tabs" style={{ marginBottom: "20px", borderBottom: "1px solid #ddd" }}>
                <button
                    className={`tab-btn ${activeTab === "structure" ? "active" : ""}`}
                    onClick={() => setActiveTab("structure")}
                    style={{
                        padding: "10px 20px",
                        border: "none",
                        background: "none",
                        borderBottom: activeTab === "structure" ? "2px solid #6366f1" : "none",
                        fontWeight: activeTab === "structure" ? "bold" : "normal",
                        cursor: "pointer"
                    }}
                >
                    Fee Structures
                </button>
                <button
                    className={`tab-btn ${activeTab === "payments" ? "active" : ""}`}
                    onClick={() => setActiveTab("payments")}
                    style={{
                        padding: "10px 20px",
                        border: "none",
                        background: "none",
                        borderBottom: activeTab === "payments" ? "2px solid #6366f1" : "none",
                        fontWeight: activeTab === "payments" ? "bold" : "normal",
                        cursor: "pointer"
                    }}
                >
                    Payment History
                </button>
            </div>

            {/* Content */}
            <div className="card">
                <div className="table-container">
                    <table className="table">
                        {activeTab === "structure" ? (
                            <>
                                <thead>
                                    <tr>
                                        <th>Class</th>
                                        <th>Fee Type</th>
                                        <th>Amount</th>
                                        <th>Due Date</th>
                                        <th>Description</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {feeStructures.length === 0 ? (
                                        <tr><td colSpan="5" className="text-center">No fee structures defined</td></tr>
                                    ) : (
                                        feeStructures.map(fs => (
                                            <tr key={fs.id}>
                                                <td>{fs.Class?.name} {fs.Class?.section}</td>
                                                <td><span className="badge badge-info">{fs.fee_type}</span></td>
                                                <td>₹{parseFloat(fs.amount).toFixed(2)}</td>
                                                <td>{new Date(fs.due_date).toLocaleDateString()}</td>
                                                <td>{fs.description || "-"}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </>
                        ) : (
                            <>
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Student</th>
                                        <th>Amount</th>
                                        <th>Method</th>
                                        <th>Transaction ID</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {payments.length === 0 ? (
                                        <tr><td colSpan="6" className="text-center">No payments recorded</td></tr>
                                    ) : (
                                        payments.map(p => (
                                            <tr key={p.id}>
                                                <td>{new Date(p.payment_date).toLocaleDateString()}</td>
                                                <td>
                                                    <strong>{p.Student?.User?.name}</strong><br />
                                                    <small>{p.Student?.roll_number}</small>
                                                </td>
                                                <td style={{ color: "green", fontWeight: "bold" }}>
                                                    +₹{parseFloat(p.amount_paid).toFixed(2)}
                                                </td>
                                                <td style={{ textTransform: "capitalize" }}>{p.payment_method}</td>
                                                <td>{p.transaction_id || "-"}</td>
                                                <td>
                                                    <span className={`badge badge-${p.status === 'success' ? 'success' : 'warning'}`}>
                                                        {p.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </>
                        )}
                    </table>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: "500px" }}>
                        <div className="modal-header">
                            <h3>{activeTab === "structure" ? "Add Fee Structure" : "Record Payment"}</h3>
                            <button onClick={() => setShowModal(false)} className="btn btn-sm">×</button>
                        </div>
                        <div className="modal-body">
                            {activeTab === "structure" ? (
                                <form onSubmit={handleStructureSubmit}>
                                    <div className="form-group">
                                        <label className="form-label">Class</label>
                                        <select
                                            className="form-select"
                                            value={structureForm.class_id}
                                            onChange={e => setStructureForm({ ...structureForm, class_id: e.target.value })}
                                            required
                                        >
                                            <option value="">Select Class</option>
                                            {classes.map(c => (
                                                <option key={c.id} value={c.id}>{c.name} {c.section}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Fee Type</label>
                                        <select
                                            className="form-select"
                                            value={structureForm.fee_type}
                                            onChange={e => setStructureForm({ ...structureForm, fee_type: e.target.value })}
                                        >
                                            <option>Tuition Fee</option>
                                            <option>Exam Fee</option>
                                            <option>Transport Fee</option>
                                            <option>Library Fee</option>
                                            <option>Other</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Amount</label>
                                        <input
                                            type="number"
                                            className="form-input"
                                            value={structureForm.amount}
                                            onChange={e => setStructureForm({ ...structureForm, amount: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Due Date</label>
                                        <input
                                            type="date"
                                            className="form-input"
                                            value={structureForm.due_date}
                                            onChange={e => setStructureForm({ ...structureForm, due_date: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Description (Optional)</label>
                                        <textarea
                                            className="form-input"
                                            rows="2"
                                            value={structureForm.description}
                                            onChange={e => setStructureForm({ ...structureForm, description: e.target.value })}
                                        ></textarea>
                                    </div>
                                    <div className="modal-footer">
                                        <button type="submit" className="btn btn-primary">Create Structure</button>
                                    </div>
                                </form>
                            ) : (
                                <form onSubmit={handlePaymentSubmit}>
                                    <div className="form-group">
                                        <label className="form-label">Student</label>
                                        <select
                                            className="form-select"
                                            value={paymentForm.student_id}
                                            onChange={e => setPaymentForm({ ...paymentForm, student_id: e.target.value })}
                                            required
                                        >
                                            <option value="">Select Student</option>
                                            {students.map(s => (
                                                <option key={s.id} value={s.id}>
                                                    {s.User?.name} ({s.roll_number})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Amount Paid</label>
                                        <input
                                            type="number"
                                            className="form-input"
                                            value={paymentForm.amount}
                                            onChange={e => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Payment Date</label>
                                        <input
                                            type="date"
                                            className="form-input"
                                            value={paymentForm.payment_date}
                                            onChange={e => setPaymentForm({ ...paymentForm, payment_date: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Payment Method</label>
                                        <select
                                            className="form-select"
                                            value={paymentForm.payment_method}
                                            onChange={e => setPaymentForm({ ...paymentForm, payment_method: e.target.value })}
                                        >
                                            <option value="cash">Cash</option>
                                            <option value="online">Online (UPI/Bank)</option>
                                            <option value="cheque">Cheque</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Transaction ID (Optional)</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={paymentForm.transaction_id}
                                            onChange={e => setPaymentForm({ ...paymentForm, transaction_id: e.target.value })}
                                            placeholder="e.g. UPI Ref No."
                                        />
                                    </div>
                                    <div className="modal-footer">
                                        <button type="submit" className="btn btn-primary">Record Payment</button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Fees;
