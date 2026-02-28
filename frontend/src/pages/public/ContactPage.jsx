/**
 * Contact Page - Professional Contact Form
 */

import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import PublicNavbar from "../../components/layout/PublicNavbar";
import "./PublicPages.css";

function ContactPage() {
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        message: ""
    });
    const [errors, setErrors] = useState({});

    const validate = () => {
        const newErrors = {};

        if (!formData.name.trim()) newErrors.name = "Name is required";
        if (!formData.email.trim()) {
            newErrors.email = "Email is required";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = "Invalid email format";
        }
        if (!formData.message.trim()) newErrors.message = "Message is required";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validate()) return;

        setLoading(true);

        try {
            await api.post("/contact", formData);
            setSubmitted(true);
            setFormData({ name: "", email: "", phone: "", message: "" });
        } catch (error) {
            alert("Failed to send message. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="contact-page">
            <PublicNavbar />

            <section className="contact-section">
                <div className="container-small">
                    <h1 className="page-title">Get in Touch</h1>
                    <p className="page-subtitle">Have questions? We'd love to hear from you.</p>

                    {submitted ? (
                        <div className="success-message">
                            <h2>✅ Message Sent!</h2>
                            <p>Thank you for contacting us. We'll get back to you within 24 hours.</p>
                            <button onClick={() => setSubmitted(false)} className="btn-primary">
                                Send Another Message
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="contact-form">
                            <div className="form-group">
                                <label>Name *</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className={errors.name ? 'error' : ''}
                                />
                                {errors.name && <span className="error-message">{errors.name}</span>}
                            </div>

                            <div className="form-group">
                                <label>Email *</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className={errors.email ? 'error' : ''}
                                />
                                {errors.email && <span className="error-message">{errors.email}</span>}
                            </div>

                            <div className="form-group">
                                <label>Phone</label>
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </div>

                            <div className="form-group">
                                <label>Message *</label>
                                <textarea
                                    rows="5"
                                    value={formData.message}
                                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                    className={errors.message ? 'error' : ''}
                                />
                                {errors.message && <span className="error-message">{errors.message}</span>}
                            </div>

                            <button type="submit" className="btn-primary-large btn-block" disabled={loading}>
                                {loading ? "Sending..." : "Send Message"}
                            </button>
                        </form>
                    )}

                    <div className="contact-info">
                        <div className="info-item">
                            <strong>📧 Email:</strong> support@edumanage.com
                        </div>
                        <div className="info-item">
                            <strong>📞 Phone:</strong> +91 123 456 7890
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}

export default ContactPage;
