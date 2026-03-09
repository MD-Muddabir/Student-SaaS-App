import { useState, useEffect, useContext, useRef } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import { AuthContext } from "../../context/AuthContext";
import { Html5Qrcode } from "html5-qrcode";
import "./Dashboard.css";
import ThemeSelector from "../../components/ThemeSelector";

function SmartAttendance() {
    const { user } = useContext(AuthContext);
    const dashboardPath = user?.role === "admin" || user?.role === "superadmin" || user?.role === "super_admin" || user?.role === "manager"
        ? "/admin/dashboard"
        : "/faculty/dashboard";
    const [classes, setClasses] = useState([]);
    const [selectedClass, setSelectedClass] = useState("");
    const [subjects, setSubjects] = useState([]);
    const [selectedSubject, setSelectedSubject] = useState("");

    // Scanner State
    const [isScanning, setIsScanning] = useState(false);
    const [message, setMessage] = useState(null);
    const [cameraError, setCameraError] = useState(null);
    const isProcessed = useRef(false);
    const qrCodeRef = useRef(null);
    const isScannerRunning = useRef(false);

    // Use Refs for state variables used inside scanner callback
    const selectedClassRef = useRef(selectedClass);
    const selectedSubjectRef = useRef(selectedSubject);

    useEffect(() => {
        selectedClassRef.current = selectedClass;
        selectedSubjectRef.current = selectedSubject;
    }, [selectedClass, selectedSubject]);

    useEffect(() => {
        fetchClasses();
        return () => {
            stopScanner();
        };
    }, []);

    useEffect(() => {
        if (selectedClass) {
            fetchSubjects();
        } else {
            setSubjects([]);
            setSelectedSubject("");
        }
    }, [selectedClass]);

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
            const response = await api.get(`/subjects?class_id=${selectedClass}`);
            setSubjects(response.data.data || []);
            setSelectedSubject("");
        } catch (error) {
            console.error("Error fetching subjects:", error);
        }
    };

    const startScanningProcess = async () => {
        if (!selectedClass) return alert("Please select a class");
        if (!selectedSubject) return alert("Please select a subject");

        setIsScanning(true);
        setMessage(null);
        setCameraError(null);
        isProcessed.current = false;

        // Let UI render the scanner div
        setTimeout(() => {
            startScanner();
        }, 300);
    };

    const stopScanningProcess = async () => {
        setIsScanning(false);
        setMessage(null);
        await stopScanner();
    };

    const startScanner = async () => {
        try {
            if (qrCodeRef.current && isScannerRunning.current) {
                await stopScanner();
            }

            const html5QrCode = new Html5Qrcode("faculty-qr-reader");
            qrCodeRef.current = html5QrCode;

            const cameras = await Html5Qrcode.getCameras();
            if (!cameras || cameras.length === 0) {
                setCameraError("No camera found on this device.");
                return;
            }

            const cameraId = cameras.find(c => c.label.toLowerCase().includes("back"))?.id || cameras[0].id;

            await html5QrCode.start(
                cameraId,
                { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 },
                (decodedText) => {
                    if (isProcessed.current) return;
                    isProcessed.current = true;
                    stopScanner();
                    markStudentAttendance(decodedText);
                },
                () => { /* ignore frame errors */ }
            );
            isScannerRunning.current = true;
        } catch (err) {
            console.error("Camera Error:", err);
            setCameraError("Could not access camera. Please allow camera permissions and try again.");
        }
    };

    const stopScanner = async () => {
        try {
            if (qrCodeRef.current && isScannerRunning.current) {
                await qrCodeRef.current.stop();
                isScannerRunning.current = false;
            }
        } catch (e) {
            // ignore
        }
    };

    const getLocalDate = () => {
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const markStudentAttendance = async (decodedQR) => {
        try {
            setMessage({ type: "loading", text: "Marking attendance..." });

            const response = await api.post("/attendance/mark-student-qr", {
                qr_code: decodedQR,
                class_id: selectedClassRef.current,
                subject_id: selectedSubjectRef.current,
                date: getLocalDate()
            });

            if (response.data.success) {
                setMessage({ type: "success", text: response.data.message });
            }
        } catch (error) {
            const errorMsg = error.response?.data?.message || "Failed to mark attendance";
            let type = "error";
            if (error.response?.status === 400 && errorMsg.includes("already marked")) {
                type = "warning";
            }
            setMessage({ type: type, text: errorMsg });
        }
    };

    const handleScanAnother = async () => {
        setMessage(null);
        isProcessed.current = false;
        await startScanner();
    };

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <div>
                    <h1>⚡ Scan Student QR</h1>
                    <p>Select class and subject to scan student QR codes.</p>
                </div>
                <div className="dashboard-header-right">
                    <ThemeSelector />
                    <Link to={dashboardPath} className="btn btn-secondary">
                        ← Back
                    </Link>
                </div>
            </div>

            <div className="card" style={{ padding: "2rem", maxWidth: "600px", margin: "0 auto", textAlign: "center" }}>
                {!isScanning ? (
                    <div>
                        <h2 style={{ marginBottom: "1rem" }}>Start Scanning</h2>
                        <div className="form-group" style={{ textAlign: "left" }}>
                            <label className="form-label">Select Class</label>
                            <select
                                className="form-input"
                                value={selectedClass}
                                onChange={(e) => setSelectedClass(e.target.value)}
                            >
                                <option value="">-- Choose Class --</option>
                                {classes.map((cls) => (
                                    <option key={cls.id} value={cls.id}>
                                        {cls.name} {cls.section ? `(${cls.section})` : ""}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group" style={{ textAlign: "left", marginTop: "1rem" }}>
                            <label className="form-label">Select Subject</label>
                            <select
                                className="form-input"
                                value={selectedSubject}
                                onChange={(e) => setSelectedSubject(e.target.value)}
                                disabled={!selectedClass}
                            >
                                <option value="">-- Choose Subject --</option>
                                {subjects.map((sub) => (
                                    <option key={sub.id} value={sub.id}>
                                        {sub.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <button
                            className="btn btn-primary btn-animated"
                            style={{ width: "100%", padding: "1rem", fontSize: "1.1rem", marginTop: "1rem", display: "flex", justifyContent: "center", gap: "10px" }}
                            onClick={startScanningProcess}
                            disabled={!selectedClass || !selectedSubject}
                        >
                            📸 Open Camera
                        </button>
                    </div>
                ) : (
                    <div>
                        <div style={{ padding: "1rem", backgroundColor: "#ecfdf5", color: "#065f46", borderRadius: "8px", marginBottom: "1rem", border: "1px solid #10b981" }}>
                            <h2 style={{ margin: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}>
                                🟢 Scanning Active
                            </h2>
                        </div>

                        {cameraError ? (
                            <div style={{ padding: "2rem", background: "#fef2f2", color: "#991b1b", border: "1px solid #ef4444", borderRadius: "12px", marginBottom: "2rem" }}>
                                <p style={{ fontSize: "1.1rem", fontWeight: "bold" }}>📵 {cameraError}</p>
                            </div>
                        ) : !message ? (
                            <div>
                                <h3 style={{ marginBottom: "1rem", color: "#374151" }}>Point camera at Student's QR</h3>
                                <div
                                    id="faculty-qr-reader"
                                    style={{
                                        width: "100%",
                                        maxWidth: "400px",
                                        margin: "0 auto",
                                        borderRadius: "12px",
                                        overflow: "hidden",
                                        border: "3px solid #6366f1",
                                        aspectRatio: "1 / 1",
                                        background: "#000"
                                    }}
                                />
                                <p style={{ marginTop: "1rem", color: "#6b7280" }}>Hold the student's QR code in the frame to mark attendance.</p>
                            </div>
                        ) : (
                            <div style={{ padding: "2.5rem", backgroundColor: message.type === "success" ? "#ecfdf5" : message.type === 'warning' ? '#fffbeb' : '#fef2f2', borderRadius: "12px", border: `2px solid ${message.type === "success" ? "#10b981" : message.type === 'warning' ? "#f59e0b" : "#ef4444"}` }}>
                                <h2 style={{ color: message.type === "success" ? "#065f46" : message.type === 'warning' ? "#b45309" : "#991b1b", margin: 0 }}>
                                    {message.text}
                                </h2>
                                {message.type !== "loading" && (
                                    <button
                                        className="btn btn-primary"
                                        style={{ padding: "0.75rem 2rem", fontSize: "1rem", marginTop: "2rem" }}
                                        onClick={handleScanAnother}
                                    >
                                        🔄 Scan Next Student
                                    </button>
                                )}
                            </div>
                        )}

                        <button
                            className="btn btn-danger"
                            style={{ width: "100%", padding: "1rem", fontSize: "1.1rem", marginTop: "2rem" }}
                            onClick={stopScanningProcess}
                        >
                            🛑 Stop Scanning
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default SmartAttendance;
