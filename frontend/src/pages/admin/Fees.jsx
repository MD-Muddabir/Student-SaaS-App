/**
 * Fees Management Page — Phase 3
 * Manager view: shows Pending / Paid students, search, and cash collection modal
 * Admin view: additionally shows Fee Structures tab
 */

import { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import { AuthContext } from "../../context/AuthContext";
import "./Dashboard.css";

const TODAY = new Date().toISOString().split('T')[0];

function Fees() {
    const { user } = useContext(AuthContext);
    const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

    // Helper to check granular permissions
    const hasPerm = (module, action) => {
        if (isAdmin) return true;
        if (user?.role === 'manager') {
            return user.permissions?.includes(`${module}.${action}`) || user.permissions?.includes(module);
        }
        return false;
    };

    // tabs: 'collect' | 'history' | 'structure'
    const [tab, setTab] = useState('collect');

    // Data
    const [studentFees, setStudentFees] = useState([]);
    const [payments, setPayments] = useState([]);
    const [discountLogs, setDiscountLogs] = useState([]);
    const [feeStructures, setFeeStructures] = useState([]);
    const [classes, setClasses] = useState([]);
    const [subjects, setSubjects] = useState([]);

    // UI
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterClass, setFilterClass] = useState('');
    const [filterStatus, setFilterStatus] = useState('all'); // 'pending' | 'paid' | 'all'
    const [success, setSuccess] = useState('');

    // Collect fee modal
    const [collectingStudent, setCollectingStudent] = useState(null);
    const [collecting, setCollecting] = useState(false);
    const [payForm, setPayForm] = useState({
        amount: '',
        payment_method: 'cash',
        transaction_id: '',
        payment_date: TODAY,
        remarks: '',
        reminder_date: ''
    });
    const [payError, setPayError] = useState('');

    // Add fee structure modal (admin)
    const [showStructureModal, setShowStructureModal] = useState(false);
    const [editingStructureId, setEditingStructureId] = useState(null);
    const [availableSubjects, setAvailableSubjects] = useState([]);
    const [structureForm, setStructureForm] = useState({
        class_id: '', subject_id: '', fee_type: 'Tuition Fee', amount: '', due_date: '', description: '',
        student_target: 'all', individual_student_id: ''
    });
    const [allStudentsForClass, setAllStudentsForClass] = useState([]);

    // Discount modal
    const [discountingFee, setDiscountingFee] = useState(null);
    const [discountForm, setDiscountForm] = useState({ percentage: '', amount: '', reason: '' });

    // Reminder edit
    const [editingReminderFee, setEditingReminderFee] = useState(null);
    const [reminderDateInput, setReminderDateInput] = useState('');
    const [updatingRem, setUpdatingRem] = useState(false);

    useEffect(() => { init(); }, []);

    const init = async () => {
        try {
            setLoading(true);
            const [sfRes, cRes, pRes, dRes] = await Promise.all([
                api.get('/fees/student-fees'),
                api.get('/classes'),
                api.get('/fees/payments'),
                api.get('/fees/discount-logs')
            ]);
            setStudentFees(sfRes.data.data || []);
            setClasses(cRes.data.data || []);
            setPayments(pRes.data.data || []);
            setDiscountLogs(dRes.data.data || []);
            if (isAdmin || hasPerm('fees', 'read')) {
                const fRes = await api.get('/fees/structure');
                setFeeStructures(fRes.data.data || []);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const refreshPayments = async () => {
        const [sfRes, pRes] = await Promise.all([
            api.get('/fees/student-fees'),
            api.get('/fees/payments'),
        ]);
        setStudentFees(sfRes.data.data || []);
        setPayments(pRes.data.data || []);
    };

    const filteredFees = studentFees.filter(sf => {
        const name = sf.Student?.User?.name?.toLowerCase() || '';
        const roll = sf.Student?.roll_number?.toLowerCase() || '';
        const matchSearch = !search || name.includes(search.toLowerCase()) || roll.includes(search.toLowerCase());
        const matchClass = !filterClass || String(sf.class_id) === String(filterClass);
        const matchStatus = filterStatus === 'all' ? true : sf.status === filterStatus;
        return matchSearch && matchClass && matchStatus;
    });

    // Open collect modal pre-filled
    const openCollect = (stuFee) => {
        setCollectingStudent(stuFee);
        setPayForm({
            amount: stuFee.due_amount,
            payment_method: 'cash',
            transaction_id: '',
            payment_date: TODAY,
            remarks: '',
            reminder_date: stuFee.reminder_date || ''
        });
        setPayError('');
    };

    const openDiscount = (stuFee) => {
        if (String(stuFee.id).startsWith('dummy_')) {
            alert("No configured class fee exists for this student.");
            return;
        }
        setDiscountingFee(stuFee);
        setDiscountForm({ percentage: '', amount: '', reason: '' });
        setPayError('');
    };

    const handleCollect = async (e) => {
        e.preventDefault();
        if (!payForm.amount || parseFloat(payForm.amount) <= 0) {
            setPayError('Please enter a valid amount.');
            return;
        }
        try {
            setCollecting(true);
            await api.post('/fees/pay', {
                student_id: collectingStudent.student_id,
                fee_structure_id: collectingStudent.fee_structure_id,
                amount: payForm.amount,
                payment_method: payForm.payment_method,
                transaction_id: payForm.transaction_id,
                payment_date: payForm.payment_date,
                remarks: payForm.remarks,
                reminder_date: payForm.reminder_date
            });
            setCollectingStudent(null);
            setSuccess(`✅ Payment of ₹${parseFloat(payForm.amount).toLocaleString()} collected successfully`);
            setTimeout(() => setSuccess(''), 5000);
            await refreshPayments();
        } catch (err) {
            setPayError(err.response?.data?.message || 'Failed to record payment.');
        } finally {
            setCollecting(false);
        }
    };

    const handleDiscount = async (e) => {
        e.preventDefault();
        const conf = window.confirm(`Are you sure you want to give a discount of ₹${discountForm.amount}?`);
        if (!conf) return;
        try {
            await api.post('/fees/discount', {
                student_fee_id: discountingFee.id,
                discount_amount: discountForm.amount,
                reason: discountForm.reason
            });
            setDiscountingFee(null);
            setSuccess(`🎉 Discount applied successfully`);
            setTimeout(() => setSuccess(''), 5000);
            const [sfRes, dRes] = await Promise.all([api.get('/fees/student-fees'), api.get('/fees/discount-logs')]);
            setStudentFees(sfRes.data.data || []);
            setDiscountLogs(dRes.data.data || []);
        } catch (err) {
            alert(err.response?.data?.message || 'Error applying discount');
        }
    };

    const handleUpdateReminder = async (e) => {
        e.preventDefault();
        try {
            setUpdatingRem(true);
            await api.patch(`/fees/student-fee/${editingReminderFee.id}/reminder`, {
                reminder_date: reminderDateInput
            });
            setEditingReminderFee(null);
            setSuccess(`📅 Reminder date updated successfully`);
            setTimeout(() => setSuccess(''), 5000);
            const sfRes = await api.get('/fees/student-fees');
            setStudentFees(sfRes.data.data || []);
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to update reminder date');
        } finally {
            setUpdatingRem(false);
        }
    };

    const fetchSubjectsForClass = async (classId) => {
        if (!classId) { setAvailableSubjects([]); setAllStudentsForClass([]); return; }
        try {
            const r = await api.get(`/subjects?class_id=${classId}`);
            setAvailableSubjects(r.data.data || []);
        } catch (err) {
            console.error('Failed to load subjects:', err);
            setAvailableSubjects([]);
        }
        try {
            // Fetch all students in this class for individual student selection
            const sRes = await api.get(`/students?class_id=${classId}&limit=500`);
            setAllStudentsForClass(sRes.data.data || []);
        } catch (err) {
            console.error('Failed to load students for class:', err);
            setAllStudentsForClass([]);
        }
    };

    const handleStructureSubmit = async (e) => {
        e.preventDefault();
        // Validate individual student is selected when target is individual
        if (structureForm.student_target === 'individual' && !structureForm.individual_student_id) {
            alert('Please select a student for Individual Student fee structure.');
            return;
        }
        const payload = {
            ...structureForm,
            // Only send individual_student_id if individual target
            individual_student_id: structureForm.student_target === 'individual' ? structureForm.individual_student_id : null
        };
        try {
            if (editingStructureId) {
                await api.put(`/fees/structure/${editingStructureId}`, payload);
                setSuccess("✅ Fee structure updated successfully.");
            } else {
                await api.post('/fees/structure', payload);
                setSuccess("✅ Fee structure created successfully.");
            }
            setTimeout(() => setSuccess(''), 5000);
            setShowStructureModal(false);
            const r = await api.get('/fees/structure');
            setFeeStructures(r.data.data || []);
            setStructureForm({ class_id: '', subject_id: '', fee_type: 'Tuition Fee', amount: '', due_date: '', description: '', student_target: 'all', individual_student_id: '' });
            setEditingStructureId(null);
        } catch (err) {
            alert(err.response?.data?.message || 'Error saving fee structure');
        }
    };

    const handleEditStructure = (fs) => {
        setEditingStructureId(fs.id);
        setStructureForm({
            class_id: fs.class_id,
            subject_id: fs.subject_id || '',
            fee_type: fs.fee_type,
            amount: fs.amount,
            due_date: fs.due_date,
            description: fs.description || '',
            student_target: fs.individual_student_id ? 'individual' : 'all',
            individual_student_id: fs.individual_student_id || ''
        });
        fetchSubjectsForClass(fs.class_id);
        setShowStructureModal(true);
    };

    const handleDeleteStructure = async (id) => {
        if (!window.confirm("Are you sure you want to delete this fee structure?")) return;
        try {
            await api.delete(`/fees/structure/${id}`);
            setSuccess("✅ Fee structure deleted successfully.");
            setTimeout(() => setSuccess(''), 5000);
            const r = await api.get('/fees/structure');
            setFeeStructures(r.data.data || []);
        } catch (err) {
            alert(err.response?.data?.message || 'Error deleting fee structure');
        }
    };

    if (loading) return <div className="dashboard-container"><div className="dashboard-loading">Loading fees...</div></div>;

    const tabs = [
        ...(isAdmin || user.permissions?.includes('collect_fees') ? [{ id: 'collect', label: '💰 Collect Fees', icon: '💰' }] : []),
        ...(isAdmin || user.permissions?.includes('payment_history') ? [{ id: 'history', label: '📋 Payment History', icon: '📋' }] : []),
        ...(isAdmin || hasPerm('fees', 'read') ? [{ id: 'structure', label: '📐 Fee Structures', icon: '📐' }] : []),
    ];
    // Default to first available tab
    const validTab = tabs.find(t => t.id === tab) ? tab : (tabs[0]?.id || 'collect');
    if (validTab !== tab) setTimeout(() => setTab(validTab), 0);

    const pendingCount = studentFees.filter(sf => sf.status === 'pending').length;
    const partialCount = studentFees.filter(sf => sf.status === 'partial').length;
    const paidCount = studentFees.filter(sf => sf.status === 'paid').length;
    const totalCollected = studentFees.reduce((sum, sf) => sum + parseFloat(sf.paid_amount || 0), 0);
    const totalDue = studentFees.reduce((sum, sf) => sum + parseFloat(sf.due_amount || 0), 0);
    const totalDiscount = studentFees.reduce((sum, sf) => sum + parseFloat(sf.discount_amount || 0), 0);

    // Phase 9: Detect overdue fees (due date has passed and still pending/partial)
    const todayDate = new Date().toISOString().split('T')[0];
    const isOverdue = (sf) => {
        if (sf.status === 'paid') return false;
        const dueDate = sf.FeesStructure?.due_date;
        return dueDate && dueDate < todayDate;
    };
    const overdueCount = studentFees.filter(isOverdue).length;

    // Helper to check if a fee is within the reminder window (1 day before or more)
    const isReminderActive = (sf) => {
        if (!sf.reminder_date || sf.status === 'paid') return false;
        const remDate = new Date(sf.reminder_date);
        const today = new Date(todayDate);
        // Start showing 1 day before (diff <= 1 day)
        const diffDays = (remDate - today) / (1000 * 60 * 60 * 24);
        return diffDays <= 1;
    };

    return (
        <div className="dashboard-container">
            {/* Header */}
            <div className="dashboard-header">
                <div>
                    <h1>💰 Fee Management</h1>
                    <p>Collect fees, view payment history{isAdmin ? ', and manage fee structures' : ''}.</p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <Link to="/admin/dashboard" className="btn btn-secondary">← Back</Link>
                    {tab === 'structure' && hasPerm('fees', 'create') && (
                        <button className="btn btn-primary" onClick={() => {
                            setEditingStructureId(null);
                            setStructureForm({ class_id: '', subject_id: '', fee_type: 'Tuition Fee', amount: '', due_date: '', description: '' });
                            setShowStructureModal(true);
                        }}
                            style={{ background: 'linear-gradient(135deg,#6366f1,#a855f7)', border: 'none' }}>
                            + Add Fee Structure
                        </button>
                    )}
                </div>
            </div>

            {/* Success toast */}
            {success && (
                <div style={{
                    background: 'linear-gradient(135deg,rgba(16,185,129,0.15),rgba(16,185,129,0.05))',
                    border: '1px solid rgba(16,185,129,0.4)', borderRadius: '10px',
                    padding: '0.85rem 1.25rem', marginBottom: '1.25rem',
                    color: '#10b981', fontWeight: '600', fontSize: '0.95rem',
                    display: 'flex', alignItems: 'center', gap: '0.5rem'
                }}>
                    {success}
                </div>
            )}

            {/* Phase 9: Overdue fees alert banner */}
            {overdueCount > 0 && (
                <div style={{
                    background: 'linear-gradient(135deg,rgba(239,68,68,0.12),rgba(239,68,68,0.05))',
                    border: '1.5px solid rgba(239,68,68,0.5)', borderRadius: '12px',
                    padding: '1rem 1.25rem', marginBottom: '1rem',
                    display: 'flex', alignItems: 'center', gap: '1rem'
                }}>
                    <span style={{ fontSize: '1.75rem' }}>🔔</span>
                    <div>
                        <div style={{ fontWeight: '800', color: '#ef4444', fontSize: '1rem' }}>
                            {overdueCount} Overdue Fee{overdueCount !== 1 ? 's' : ''} Need Attention!
                        </div>
                        <div style={{ color: '#dc2626', fontSize: '0.85rem', marginTop: '0.2rem' }}>
                            These students have outstanding dues past the due date.
                        </div>
                    </div>
                </div>
            )}

            {/* Phase: Reminder Alerts (New Feature) */}
            {(() => {
                const reminders = studentFees.filter(isReminderActive);
                if (reminders.length === 0) return null;
                return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
                        {reminders.map(rem => (
                            <div key={`rem-${rem.id}`} style={{
                                background: 'linear-gradient(135deg,rgba(245,158,11,0.12),rgba(245,158,11,0.05))',
                                border: '1.5px solid rgba(245,158,11,0.5)', borderRadius: '12px',
                                padding: '0.85rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem'
                            }}>
                                <span style={{ fontSize: '1.25rem' }}>⚠️</span>
                                <div style={{ color: '#d97706', fontWeight: '600', fontSize: '0.95rem' }}>
                                    {rem.Student?.User?.name} and This student Fees Pending. (Reminder Date: {new Date(rem.reminder_date).toLocaleDateString()})
                                </div>
                            </div>
                        ))}
                    </div>
                );
            })()}

            {/* Summary stats */}
            <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px,1fr))', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                <div className="stat-card">
                    <div className="stat-icon">⏳</div>
                    <div className="stat-content">
                        <h3 style={{ color: '#ef4444' }}>{pendingCount}</h3>
                        <p>Pending</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">⚠️</div>
                    <div className="stat-content">
                        <h3 style={{ color: '#f59e0b' }}>{partialCount}</h3>
                        <p>Partial</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">✅</div>
                    <div className="stat-content">
                        <h3 style={{ color: '#10b981' }}>{paidCount}</h3>
                        <p>Fully Paid</p>
                    </div>
                </div>
                {(isAdmin || user.permissions?.includes('payment_history')) && (
                    <>
                        <div className="stat-card">
                            <div className="stat-icon">💵</div>
                            <div className="stat-content">
                                <h3 style={{ color: '#6366f1' }}>₹{totalCollected.toLocaleString()}</h3>
                                <p>Total Collected</p>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon">🔔</div>
                            <div className="stat-content">
                                <h3 style={{ color: '#ef4444' }}>₹{totalDue.toLocaleString()}</h3>
                                <p>Total Dues</p>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon">🎉</div>
                            <div className="stat-content">
                                <h3 style={{ color: '#a855f7' }}>₹{totalDiscount.toLocaleString()}</h3>
                                <p>Total Discount Given</p>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Tabs */}
            {tabs.length > 1 && (
                <div style={{ display: 'flex', gap: '0.25rem', borderBottom: '2px solid var(--border-color)', marginBottom: '1.5rem' }}>
                    {tabs.map(t => (
                        <button key={t.id} onClick={() => setTab(t.id)} style={{
                            padding: '0.65rem 1.25rem', border: 'none', background: 'none', cursor: 'pointer',
                            fontWeight: validTab === t.id ? '700' : '500', fontSize: '0.9rem',
                            color: validTab === t.id ? '#6366f1' : 'var(--text-secondary)',
                            borderBottom: validTab === t.id ? '3px solid #6366f1' : '3px solid transparent',
                            marginBottom: '-2px', transition: 'all 0.15s'
                        }}>
                            {t.label}
                        </button>
                    ))}
                </div>
            )}

            {/* ═══ COLLECT FEES TAB ═══ */}
            {validTab === 'collect' && (isAdmin || user.permissions?.includes('collect_fees')) && (
                <>
                    {/* Filters */}
                    <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                        <input
                            type="text" className="form-input" placeholder="🔍 Search student name or roll no."
                            value={search} onChange={e => setSearch(e.target.value)}
                            style={{ flex: '1', minWidth: '200px', maxWidth: '360px' }}
                        />
                        <select className="form-select" value={filterClass} onChange={e => setFilterClass(e.target.value)}
                            style={{ minWidth: '160px' }}>
                            <option value="">All Classes</option>
                            {classes.map(c => <option key={c.id} value={c.id}>{c.name} {c.section}</option>)}
                        </select>
                        <div style={{ display: 'flex', gap: '4px' }}>
                            {[['pending', '⏳ Pending', '#ef4444'], ['partial', '⚠️ Partial', '#f59e0b'], ['paid', '✅ Paid', '#10b981'], ['all', '👥 All', '#6366f1']].map(([val, lbl, col]) => (
                                <button
                                    key={val}
                                    onClick={() => setFilterStatus(val)}
                                    style={{
                                        padding: '8px 16px',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        fontWeight: filterStatus === val ? '700' : '500',
                                        fontSize: '0.85rem',
                                        background: filterStatus === val ? `${col}22` : 'var(--card-bg)',
                                        color: filterStatus === val ? col : 'var(--text-secondary)',
                                        border: `1.5px solid ${filterStatus === val ? col : 'var(--border-color)'}`
                                    }}
                                >
                                    {lbl}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                        Showing <strong>{filteredFees.length}</strong> fee record{filteredFees.length !== 1 ? 's' : ''}
                    </div>

                    {/* Student fee rows */}
                    {filteredFees.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>
                                {filterStatus === 'pending' ? '🎉' : '📭'}
                            </div>
                            <div style={{ fontWeight: '600' }}>
                                {filterStatus === 'pending' ? 'All fees paid!' : 'No records match.'}
                            </div>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {filteredFees.map(sf => {
                                const stColor = sf.status === 'paid' ? '#10b981' : sf.status === 'partial' ? '#f59e0b' : '#ef4444';
                                const stBg = sf.status === 'paid' ? 'rgba(16,185,129,0.08)' : sf.status === 'partial' ? 'rgba(245,158,11,0.06)' : 'rgba(239,68,68,0.06)';

                                return (
                                    <div key={sf.id} style={{
                                        display: 'flex', alignItems: 'center', gap: '1rem',
                                        padding: '0.85rem 1.1rem', borderRadius: '12px',
                                        border: `1px solid ${sf.status === 'paid' ? 'rgba(16,185,129,0.3)' : sf.status === 'partial' ? 'rgba(245,158,11,0.3)' : 'rgba(239,68,68,0.3)'}`,
                                        background: stBg, transition: 'box-shadow 0.2s',
                                        flexWrap: 'wrap'
                                    }}>
                                        {/* Avatar */}
                                        <div style={{
                                            width: '44px', height: '44px', borderRadius: '50%', flexShrink: 0,
                                            background: sf.status === 'paid' ? 'linear-gradient(135deg,#10b981,#059669)' : sf.status === 'partial' ? 'linear-gradient(135deg,#f59e0b,#d97706)' : 'linear-gradient(135deg,#ef4444,#b91c1c)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            color: '#fff', fontWeight: '700', fontSize: '1rem'
                                        }}>
                                            {(sf.Student?.User?.name || 'S')[0].toUpperCase()}
                                        </div>

                                        {/* Info */}
                                        <div style={{ flex: 1, minWidth: '160px' }}>
                                            <div style={{ fontWeight: '700', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                {sf.Student?.User?.name} ({sf.Student?.roll_number})
                                                {/* Phase 9: Overdue badge */}
                                                {isOverdue(sf) && (
                                                    <span style={{
                                                        padding: '2px 8px', borderRadius: '20px',
                                                        background: 'rgba(239,68,68,0.15)', color: '#ef4444',
                                                        fontSize: '0.7rem', fontWeight: '800'
                                                    }}>🔔 OVERDUE</span>
                                                )}
                                            </div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '0.25rem' }}>
                                                <span className="badge badge-secondary">{sf.Class?.name} {sf.Class?.section}</span>
                                                <span className="badge badge-info">
                                                    {sf.FeesStructure?.fee_type || 'Fee'}
                                                    {sf.FeesStructure?.Subject ? ` • ${sf.FeesStructure.Subject.name}` : ''}
                                                </span>
                                                {sf.FeesStructure?.due_date && (
                                                    <span style={{ color: isOverdue(sf) ? '#ef4444' : 'var(--text-muted)', fontWeight: isOverdue(sf) ? 700 : 400 }}>
                                                        Due: {new Date(sf.FeesStructure.due_date).toLocaleDateString()}
                                                    </span>
                                                )}
                                                {sf.reminder_date && sf.status !== 'paid' && (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <span style={{ color: isReminderActive(sf) && sf.reminder_date <= todayDate ? '#ef4444' : '#f59e0b', fontWeight: 700 }}>
                                                            🔔 Reminder: {new Date(sf.reminder_date).toLocaleDateString()}
                                                        </span>
                                                        <button
                                                            onClick={() => {
                                                                setEditingReminderFee(sf);
                                                                setReminderDateInput(sf.reminder_date || '');
                                                            }}
                                                            style={{
                                                                padding: '2px 8px', borderRadius: '4px', border: '1px solid #f59e0b',
                                                                background: 'rgba(245,158,11,0.1)', color: '#f59e0b', fontSize: '0.7rem',
                                                                cursor: 'pointer', fontWeight: 'bold'
                                                            }}
                                                        >
                                                            📝 Edit
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Financials details breakdown */}
                                        <div style={{ minWidth: '220px', display: 'flex', gap: '15px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                                            <div>
                                                <div>Original: ₹{parseFloat(sf.original_amount).toLocaleString()}</div>
                                                <div style={{ color: '#a855f7' }}>Disc: ₹{parseFloat(sf.discount_amount).toLocaleString()}</div>
                                                <div style={{ fontWeight: '700', color: 'var(--text-primary)' }}>Final: ₹{parseFloat(sf.final_amount).toLocaleString()}</div>
                                            </div>
                                            <div>
                                                <div style={{ color: '#10b981' }}>Paid: ₹{parseFloat(sf.paid_amount).toLocaleString()}</div>
                                                <div style={{ color: '#ef4444', fontWeight: '700' }}>Due: ₹{parseFloat(sf.due_amount).toLocaleString()}</div>
                                            </div>
                                        </div>

                                        {/* Action buttons */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                                            <span style={{
                                                fontSize: '0.74rem', padding: '3px 10px', borderRadius: '20px', fontWeight: '700',
                                                background: sf.status === 'paid' ? 'rgba(16,185,129,0.15)' : sf.status === 'partial' ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)',
                                                color: stColor
                                            }}>
                                                {sf.status.toUpperCase()}
                                            </span>

                                            {sf.status !== 'paid' && hasPerm('fees', 'create') && (
                                                <>
                                                    <button
                                                        onClick={() => openDiscount(sf)}
                                                        style={{
                                                            padding: '6px 14px', borderRadius: '8px', border: '1px solid rgba(168, 85, 247, 0.4)',
                                                            background: 'rgba(168, 85, 247, 0.05)', color: '#a855f7', fontWeight: '600', fontSize: '0.8rem', cursor: 'pointer'
                                                        }}
                                                    >
                                                        🎉 Discount
                                                    </button>
                                                    <button
                                                        onClick={() => openCollect(sf)}
                                                        style={{
                                                            padding: '6px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                                                            background: 'linear-gradient(135deg,#10b981,#059669)',
                                                            color: '#fff', fontWeight: '700', fontSize: '0.82rem',
                                                            boxShadow: '0 2px 8px rgba(16,185,129,0.3)',
                                                        }}
                                                    >
                                                        💵 Collect
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </>
            )}

            {/* ═══ PAYMENT HISTORY TAB ═══ */}
            {validTab === 'history' && (isAdmin || user.permissions?.includes('payment_history')) && (
                <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))' }}>
                    <div className="card">
                        <h3 style={{ marginBottom: '1rem' }}>💵 Payment Logs</h3>
                        <div className="table-container" style={{ maxHeight: '500px', overflowY: 'auto' }}>
                            <table className="table mobile-keep">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Student</th>
                                        <th>Amount</th>
                                        <th>Method</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {payments.length === 0 ? (
                                        <tr><td colSpan="5" className="text-center">No payment records found</td></tr>
                                    ) : payments.map(p => (
                                        <tr key={p.id}>
                                            <td>{new Date(p.payment_date).toLocaleDateString()}</td>
                                            <td>{p.Student?.User?.name} <small>({p.Student?.roll_number})</small></td>
                                            <td style={{ color: '#10b981', fontWeight: '700' }}>+₹{parseFloat(p.amount_paid).toLocaleString()}</td>
                                            <td style={{ textTransform: 'capitalize' }}>{p.payment_method}</td>
                                            <td><span className={`badge badge-${p.status === 'success' ? 'success' : 'warning'}`}>{p.status}</span></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="card">
                        <h3 style={{ marginBottom: '1rem' }}>🎉 Discount Logs</h3>
                        <div className="table-container" style={{ maxHeight: '500px', overflowY: 'auto' }}>
                            <table className="table mobile-keep">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Student</th>
                                        <th>Discount</th>
                                        <th>Reason/Approver</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {discountLogs.length === 0 ? (
                                        <tr><td colSpan="4" className="text-center">No discounts issued</td></tr>
                                    ) : discountLogs.map(dl => (
                                        <tr key={dl.id}>
                                            <td>{new Date(dl.createdAt).toLocaleDateString()}</td>
                                            <td>{dl.StudentFee?.Student?.User?.name}</td>
                                            <td style={{ color: '#a855f7', fontWeight: '700' }}>-₹{parseFloat(dl.discount_amount).toLocaleString()}</td>
                                            <td>
                                                <small><b>{dl.reason}</b><br />by {dl.approver?.name}</small>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══ FEE STRUCTURES TAB ═══ */}
            {validTab === 'structure' && hasPerm('fees', 'read') && (
                <div className="card">
                    <div className="table-container">
                        <table className="table mobile-keep">
                            <thead>
                                <tr>
                                    <th>Class & Subject</th>
                                    <th>Fee Type</th>
                                    <th>Amount</th>
                                    <th>Due Date</th>
                                    <th>Description</th>
                                    {(hasPerm('fees', 'update') || hasPerm('fees', 'delete')) && <th style={{ textAlign: 'right' }}>Actions</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {feeStructures.length === 0 ? (
                                    <tr><td colSpan={(hasPerm('fees', 'update') || hasPerm('fees', 'delete')) ? 6 : 5} className="text-center">No fee structures defined</td></tr>
                                ) : feeStructures.map(fs => (
                                    <tr key={fs.id}>
                                        <td>
                                            {fs.Class?.name} {fs.Class?.section}<br />
                                            <small style={{ color: '#6b7280' }}>
                                                {fs.Subject ? fs.Subject.name : 'All Subjects (Full Class)'}
                                            </small>
                                        </td>
                                        <td><span className="badge badge-info">{fs.fee_type}</span></td>
                                        <td>₹{parseFloat(fs.amount).toLocaleString()}</td>
                                        <td>{new Date(fs.due_date).toLocaleDateString()}</td>
                                        <td>{fs.description || '—'}</td>
                                        {(hasPerm('fees', 'update') || hasPerm('fees', 'delete')) && (
                                            <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                                                {hasPerm('fees', 'update') && (
                                                    <button onClick={() => handleEditStructure(fs)} className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '0.8rem', marginRight: '6px' }}>
                                                        ✏️ Edit
                                                    </button>
                                                )}
                                                {hasPerm('fees', 'delete') && (
                                                    <button onClick={() => handleDeleteStructure(fs.id)} className="btn btn-danger" style={{ padding: '4px 10px', fontSize: '0.8rem' }}>
                                                        🗑️ Delete
                                                    </button>
                                                )}
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ═══ COLLECT MODAL ═══ */}
            {collectingStudent && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '460px', width: '95%' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
                            <div style={{
                                width: '52px', height: '52px', borderRadius: '50%',
                                background: 'linear-gradient(135deg,#10b981,#059669)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: '#fff', fontWeight: '800', fontSize: '1.2rem', flexShrink: 0
                            }}>
                                {(collectingStudent.Student?.User?.name || 'S')[0].toUpperCase()}
                            </div>
                            <div>
                                <h2 style={{ margin: 0 }}>Collect Fee</h2>
                                <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                    {collectingStudent.Student?.User?.name} · Roll {collectingStudent.Student?.roll_number}
                                </div>
                            </div>
                        </div>

                        <form onSubmit={handleCollect}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                                <div className="form-group" style={{ margin: 0 }}>
                                    <label className="form-label">Amount (₹) *</label>
                                    <input
                                        type="number" className="form-input" placeholder="e.g. 5000"
                                        value={payForm.amount} min="1" step="0.01" required
                                        onChange={e => setPayForm({ ...payForm, amount: e.target.value })}
                                        autoFocus
                                        style={{ fontWeight: '700', fontSize: '1.1rem' }}
                                    />
                                </div>
                                <div className="form-group" style={{ margin: 0 }}>
                                    <label className="form-label">Payment Date *</label>
                                    <input
                                        type="date" className="form-input" value={payForm.payment_date} required
                                        onChange={e => setPayForm({ ...payForm, payment_date: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Payment Method</label>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    {[['cash', '💵 Cash'], ['online', '📱 Online (UPI)'], ['cheque', '🏦 Cheque']].map(([val, lbl]) => (
                                        <button key={val} type="button"
                                            onClick={() => setPayForm({ ...payForm, payment_method: val })}
                                            style={{
                                                flex: 1, padding: '8px 4px', borderRadius: '8px', cursor: 'pointer',
                                                fontSize: '0.8rem', fontWeight: '600',
                                                border: `1.5px solid ${payForm.payment_method === val ? '#6366f1' : 'var(--border-color)'}`,
                                                background: payForm.payment_method === val ? 'rgba(99,102,241,0.1)' : 'transparent',
                                                color: payForm.payment_method === val ? '#6366f1' : 'var(--text-secondary)'
                                            }}>
                                            {lbl}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {payForm.payment_method !== 'cash' && (
                                <div className="form-group">
                                    <label className="form-label">Transaction / Reference ID</label>
                                    <input type="text" className="form-input"
                                        value={payForm.transaction_id} placeholder="UTR / Cheque No."
                                        onChange={e => setPayForm({ ...payForm, transaction_id: e.target.value })} />
                                </div>
                            )}

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                                <div className="form-group" style={{ margin: 0 }}>
                                    <label className="form-label">Remarks (Optional)</label>
                                    <input type="text" className="form-input"
                                        value={payForm.remarks} placeholder="e.g. Q1 tuition fee"
                                        onChange={e => setPayForm({ ...payForm, remarks: e.target.value })} />
                                </div>
                                <div className="form-group" style={{ margin: 0 }}>
                                    <label className="form-label" style={{ color: '#f59e0b' }}>🔔 Reminder Date</label>
                                    <input type="date" className="form-input"
                                        value={payForm.reminder_date}
                                        onChange={e => setPayForm({ ...payForm, reminder_date: e.target.value })}
                                        style={{ border: '1.5px solid rgba(245,158,11,0.3)' }} />
                                </div>
                            </div>

                            {payError && (
                                <div style={{ color: '#ef4444', background: 'rgba(239,68,68,0.08)', padding: '0.6rem', borderRadius: '8px', marginBottom: '0.75rem', fontSize: '0.85rem' }}>
                                    ⚠️ {payError}
                                </div>
                            )}

                            {/* Amount preview */}
                            <div style={{
                                background: 'linear-gradient(135deg,rgba(16,185,129,0.1),rgba(16,185,129,0.05))',
                                border: '1px solid rgba(16,185,129,0.3)', borderRadius: '10px',
                                padding: '0.75rem 1rem', marginBottom: '1rem',
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                            }}>
                                <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Paying {collectingStudent.Student?.User?.name} Due:</span>
                                <span style={{ fontWeight: '800', color: '#10b981', fontSize: '1.3rem' }}>
                                    ₹{parseFloat(collectingStudent.due_amount).toLocaleString()}
                                </span>
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary"
                                    onClick={() => setCollectingStudent(null)} disabled={collecting}>
                                    Cancel
                                </button>
                                <button type="submit" disabled={collecting} style={{
                                    padding: '0.65rem 1.5rem', borderRadius: '10px', border: 'none',
                                    background: 'linear-gradient(135deg,#10b981,#059669)',
                                    color: '#fff', fontWeight: '700', fontSize: '0.95rem', cursor: 'pointer'
                                }}>
                                    {collecting ? 'Processing…' : '✅ Confirm Collection'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ═══ DISCOUNT MODAL ═══ */}
            {discountingFee && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '460px', width: '95%' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
                            <div style={{
                                width: '52px', height: '52px', borderRadius: '50%',
                                background: 'linear-gradient(135deg,#a855f7,#7c3aed)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: '#fff', fontWeight: '800', fontSize: '1.2rem', flexShrink: 0
                            }}>
                                🎉
                            </div>
                            <div>
                                <h2 style={{ margin: 0 }}>Give Discount</h2>
                                <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                    {discountingFee.Student?.User?.name} · Fee: ₹{parseFloat(discountingFee.original_amount).toLocaleString()}
                                </div>
                            </div>
                        </div>

                        <form onSubmit={handleDiscount}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                                <div className="form-group" style={{ margin: 0 }}>
                                    <label className="form-label">Discount (%)</label>
                                    <div style={{ position: 'relative' }}>
                                        <input type="number" className="form-input" min="0" max="100" step="0.01"
                                            value={discountForm.percentage} placeholder="e.g. 10"
                                            style={{ paddingRight: '2rem', fontWeight: '700', fontSize: '1.1rem' }}
                                            onChange={e => {
                                                const pct = e.target.value;
                                                const orig = parseFloat(discountingFee.original_amount) || 0;
                                                const amt = pct ? ((orig * parseFloat(pct)) / 100).toFixed(2) : '';
                                                setDiscountForm({ ...discountForm, percentage: pct, amount: amt });
                                            }} autoFocus />
                                        <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', fontWeight: '600' }}>%</span>
                                    </div>
                                </div>
                                <div className="form-group" style={{ margin: 0 }}>
                                    <label className="form-label">Amount (₹) *</label>
                                    <input type="number" className="form-input" required min="1" max={discountingFee.due_amount} step="0.01"
                                        value={discountForm.amount} placeholder="e.g. 500"
                                        style={{ fontWeight: '700', fontSize: '1.1rem' }}
                                        onChange={e => {
                                            const amt = e.target.value;
                                            const orig = parseFloat(discountingFee.original_amount) || 0;
                                            const pct = (orig > 0 && amt) ? ((parseFloat(amt) / orig) * 100).toFixed(2) : '';
                                            setDiscountForm({ ...discountForm, amount: amt, percentage: pct });
                                        }} />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Reason for Discount *</label>
                                <select className="form-select" required value={discountForm.reason} onChange={e => setDiscountForm({ ...discountForm, reason: e.target.value })}>
                                    <option value="">Select Reason...</option>
                                    <option>Scholarship</option>
                                    <option>Special Case</option>
                                    <option>Manual Adjustment</option>
                                    <option>Sibling Discount</option>
                                </select>
                            </div>

                            {/* Amount preview */}
                            <div style={{
                                background: 'linear-gradient(135deg,rgba(168,85,247,0.1),rgba(168,85,247,0.05))',
                                border: '1px solid rgba(168,85,247,0.3)', borderRadius: '10px',
                                padding: '0.75rem 1rem', marginBottom: '1rem',
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                            }}>
                                <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>New Final Fee:</span>
                                <span style={{ fontWeight: '800', color: '#a855f7', fontSize: '1.3rem' }}>
                                    ₹{Math.max(0, parseFloat(discountingFee.original_amount) - (parseFloat(discountForm.amount) || 0)).toLocaleString()}
                                </span>
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => setDiscountingFee(null)}>
                                    Cancel
                                </button>
                                <button type="submit" style={{
                                    padding: '0.65rem 1.5rem', borderRadius: '10px', border: 'none',
                                    background: 'linear-gradient(135deg,#a855f7,#7c3aed)',
                                    color: '#fff', fontWeight: '700', fontSize: '0.95rem', cursor: 'pointer'
                                }}>
                                    🎉 Apply Discount
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ═══ STRUCTURE MODAL ═══ */}
            {showStructureModal && (hasPerm('fees', 'create') || hasPerm('fees', 'update')) && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '520px', width: '95%', maxHeight: '92vh', overflowY: 'auto' }}>
                        <h2 style={{ marginBottom: '1.25rem' }}>{editingStructureId ? '✏️ Edit Fee Structure' : '📐 Add Fee Structure'}</h2>
                        <form onSubmit={handleStructureSubmit}>
                            {/* Class */}
                            <div className="form-group">
                                <label className="form-label">Class *</label>
                                <select className="form-select" value={structureForm.class_id} required
                                    onChange={e => {
                                        setStructureForm({ ...structureForm, class_id: e.target.value, subject_id: '', individual_student_id: '' });
                                        fetchSubjectsForClass(e.target.value);
                                    }}>
                                    <option value="">Select Class</option>
                                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}{c.section ? ` - ${c.section}` : ''}</option>)}
                                </select>
                            </div>

                            {/* Subject (only shown after class is selected) */}
                            <div className="form-group">
                                <label className="form-label">Subject (Optional)</label>
                                <select
                                    className="form-select"
                                    value={structureForm.subject_id}
                                    disabled={!structureForm.class_id}
                                    onChange={e => setStructureForm({ ...structureForm, subject_id: e.target.value })}>
                                    <option value="">All Subjects (Full Class)</option>
                                    {availableSubjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                                {structureForm.class_id && availableSubjects.length === 0 && (
                                    <small style={{ color: '#f59e0b', marginTop: '4px', display: 'block' }}>No subjects found for this class.</small>
                                )}
                            </div>

                            {/* Student Target */}
                            <div className="form-group">
                                <label className="form-label">Apply To</label>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    {[['all', '👥 All Students'], ['individual', '👤 Individual Student']].map(([val, lbl]) => (
                                        <button
                                            key={val}
                                            type="button"
                                            onClick={() => setStructureForm({ ...structureForm, student_target: val, individual_student_id: '' })}
                                            style={{
                                                flex: 1, padding: '8px 6px', borderRadius: '8px', cursor: 'pointer',
                                                fontSize: '0.82rem', fontWeight: '600',
                                                border: `1.5px solid ${structureForm.student_target === val ? '#6366f1' : 'var(--border-color)'}`,
                                                background: structureForm.student_target === val ? 'rgba(99,102,241,0.1)' : 'transparent',
                                                color: structureForm.student_target === val ? '#6366f1' : 'var(--text-secondary)'
                                            }}
                                        >{lbl}</button>
                                    ))}
                                </div>
                            </div>

                            {/* Individual Student dropdown (conditional) */}
                            {structureForm.student_target === 'individual' && (
                                <div className="form-group">
                                    <label className="form-label">Select Student *</label>
                                    <select
                                        className="form-select"
                                        value={structureForm.individual_student_id}
                                        required
                                        onChange={e => setStructureForm({ ...structureForm, individual_student_id: e.target.value })}>
                                        <option value="">-- Select Student --</option>
                                        {allStudentsForClass.map(s => (
                                            <option key={s.id} value={s.id}>
                                                {s.User?.name || s.name} {s.roll_number ? `(${s.roll_number})` : ''}
                                            </option>
                                        ))}
                                    </select>
                                    {structureForm.class_id && allStudentsForClass.length === 0 && (
                                        <small style={{ color: '#f59e0b', marginTop: '4px', display: 'block' }}>No students found in this class.</small>
                                    )}
                                </div>
                            )}

                            {/* Fee Type */}
                            <div className="form-group">
                                <label className="form-label">Fee Type</label>
                                <select className="form-select" value={structureForm.fee_type}
                                    onChange={e => setStructureForm({ ...structureForm, fee_type: e.target.value })}>
                                    {['Tuition Fee', 'Exam Fee', 'Transport Fee', 'Library Fee', 'Other'].map(t => <option key={t}>{t}</option>)}
                                </select>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                <div className="form-group">
                                    <label className="form-label">Amount (₹) *</label>
                                    <input type="number" className="form-input" required min="1" value={structureForm.amount}
                                        onChange={e => setStructureForm({ ...structureForm, amount: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Due Date *</label>
                                    <input type="date" className="form-input" required value={structureForm.due_date}
                                        onChange={e => setStructureForm({ ...structureForm, due_date: e.target.value })} />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Description</label>
                                <textarea className="form-input" rows="2" value={structureForm.description}
                                    onChange={e => setStructureForm({ ...structureForm, description: e.target.value })} />
                            </div>

                            {/* Info hint */}
                            <div style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '8px', padding: '0.65rem 1rem', marginBottom: '1rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                                {structureForm.student_target === 'all'
                                    ? '👥 This fee structure will be automatically assigned to all students in the selected class.'
                                    : '👤 This fee structure will be assigned only to the selected student.'}
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => { setShowStructureModal(false); setStructureForm({ class_id: '', subject_id: '', fee_type: 'Tuition Fee', amount: '', due_date: '', description: '', student_target: 'all', individual_student_id: '' }); setEditingStructureId(null); }}>Cancel</button>
                                <button type="submit" className="btn btn-primary" style={{ background: 'linear-gradient(135deg,#6366f1,#a855f7)', border: 'none' }}>
                                    {editingStructureId ? 'Save Changes' : 'Create Structure'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* ═══ EDIT REMINDER MODAL ═══ */}
            {editingReminderFee && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '400px', width: '95%' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
                            <div style={{
                                width: '48px', height: '48px', borderRadius: '50%',
                                background: 'linear-gradient(135deg,#f59e0b,#d97706)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: '#fff', fontSize: '1.2rem', flexShrink: 0
                            }}>
                                🔔
                            </div>
                            <div>
                                <h3 style={{ margin: 0 }}>Update Reminder Date</h3>
                                <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                                    {editingReminderFee.Student?.User?.name}
                                </div>
                            </div>
                        </div>

                        <form onSubmit={handleUpdateReminder}>
                            <div className="form-group">
                                <label className="form-label">New Reminder Date</label>
                                <input
                                    type="date" className="form-input" required
                                    value={reminderDateInput}
                                    onChange={e => setReminderDateInput(e.target.value)}
                                />
                                <small style={{ color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                                    This date will be used to alert the parent and admin.
                                </small>
                            </div>

                            <div className="modal-actions" style={{ marginTop: '1.5rem' }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setEditingReminderFee(null)}>
                                    Cancel
                                </button>
                                <button type="submit" disabled={updatingRem} className="btn btn-primary" style={{ background: '#f59e0b', border: 'none' }}>
                                    {updatingRem ? 'Updating...' : '💾 Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Fees;
