/**
 * Pricing Page - Dynamic Plan Loading
 * Loads plans from database and displays them professionally
 */

import { useState, useEffect, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import api from "../../services/api";
import PublicNavbar from "../../components/layout/PublicNavbar";
import "./PublicPages.css";

function PricingPage() {
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [billingCycle, setBillingCycle] = useState("monthly");

    useEffect(() => {
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        try {
            const response = await api.get("/plans");
            // Filter only active plans
            const activePlans = response.data.data.filter(plan => plan.status === "active");
            setPlans(activePlans);
        } catch (error) {
            console.error("Error fetching plans:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleChoosePlan = (planId) => {
        if (user && user.role === 'admin') {
            navigate(`/checkout?plan_id=${planId}`);
        } else {
            // Store selected plan in localStorage
            localStorage.setItem("selectedPlan", planId);
            // Redirect to registration
            navigate("/register");
        }
    };

    const getPlanFeatures = (plan) => {
        const features = [];

        if (plan.feature_students) features.push(`Up to ${plan.max_students} students`);
        if (plan.feature_faculty) features.push("Faculty management");
        if (plan.feature_attendance) features.push("Attendance tracking");
        if (plan.feature_fees) features.push("Fee management");
        if (plan.feature_exams) features.push("Examination management");
        if (plan.feature_reports) features.push("Reports & analytics");
        if (plan.feature_sms) features.push("SMS notifications");
        if (plan.feature_email) features.push("Email notifications");
        if (plan.feature_parent_portal) features.push("Parent portal");
        if (plan.feature_mobile_app) features.push("Mobile app access");
        if (plan.feature_api_access) features.push("API access");

        return features;
    };

    const isEnterprisePlan = (plan) => {
        return plan.name.toLowerCase().includes("enterprise") || plan.max_students >= 1000;
    };

    if (loading) {
        return (
            <div className="pricing-page">
                <div className="container">
                    <div className="loading-state">Loading plans...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="pricing-page">
            {/* Navigation */}
            <PublicNavbar />

            {/* Pricing Header */}
            <section className="pricing-header">
                <div className="container">
                    <h1 className="page-title">Simple, Transparent Pricing</h1>
                    <p className="page-subtitle">Choose the perfect plan for your coaching center</p>

                    {/* Billing Toggle */}
                    <div className="billing-toggle">
                        <button
                            className={billingCycle === "monthly" ? "active" : ""}
                            onClick={() => setBillingCycle("monthly")}
                        >
                            Monthly
                        </button>
                        <button
                            className={billingCycle === "yearly" ? "active" : ""}
                            onClick={() => setBillingCycle("yearly")}
                        >
                            Yearly <span className="discount-badge">Save 20%</span>
                        </button>
                    </div>
                </div>
            </section>

            {/* Plans Grid */}
            <section className="plans-section">
                <div className="container">
                    {plans.length === 0 ? (
                        <div className="no-plans">
                            <p>No plans available at the moment. Please contact us for custom pricing.</p>
                            <Link to="/contact" className="btn-primary">Contact Sales</Link>
                        </div>
                    ) : (
                        <div className="plans-grid">
                            {plans.map((plan) => (
                                <div
                                    key={plan.id}
                                    className={`plan-card ${plan.is_popular ? 'popular' : ''}`}
                                >
                                    {plan.is_popular && <div className="popular-badge">Most Popular</div>}

                                    <div className="plan-header">
                                        <h3 className="plan-name">{plan.name}</h3>
                                        <div className="plan-price">
                                            <span className="currency">₹</span>
                                            <span className="amount">
                                                {billingCycle === "yearly"
                                                    ? Math.floor(plan.price * 12 * 0.8)
                                                    : plan.price}
                                            </span>
                                            <span className="period">
                                                /{billingCycle === "yearly" ? "year" : "month"}
                                            </span>
                                        </div>
                                        <p className="plan-description">{plan.description}</p>
                                    </div>

                                    <div className="plan-features">
                                        <ul>
                                            {getPlanFeatures(plan).map((feature, index) => (
                                                <li key={index}>
                                                    <span className="check-icon">✓</span>
                                                    {feature}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    <div className="plan-cta">
                                        {isEnterprisePlan(plan) ? (
                                            <Link to="/contact" className="btn-outline">
                                                Contact Sales
                                            </Link>
                                        ) : (
                                            <button
                                                className={`btn-plan ${plan.is_popular ? 'btn-primary' : 'btn-outline'}`}
                                                onClick={() => handleChoosePlan(plan.id)}
                                            >
                                                Choose {plan.name}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* FAQ Section */}
            <section className="faq-section">
                <div className="container">
                    <h2 className="section-title">Frequently Asked Questions</h2>
                    <div className="faq-grid">
                        <div className="faq-item">
                            <h3>Can I change my plan later?</h3>
                            <p>Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.</p>
                        </div>
                        <div className="faq-item">
                            <h3>Is there a free trial?</h3>
                            <p>Yes, all plans come with a 14-day free trial. No credit card required.</p>
                        </div>
                        <div className="faq-item">
                            <h3>What payment methods do you accept?</h3>
                            <p>We accept all major credit/debit cards, UPI, net banking, and digital wallets.</p>
                        </div>
                        <div className="faq-item">
                            <h3>Is my data secure?</h3>
                            <p>Absolutely! We use bank-level encryption and automated backups to keep your data safe.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="pricing-cta-section">
                <div className="container">
                    <h2>Still have questions?</h2>
                    <p>Our team is here to help you choose the right plan</p>
                    <Link to="/contact" className="btn-primary-large">Contact Us</Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="public-footer">
                <div className="container">
                    <div className="footer-grid">
                        <div className="footer-col">
                            <h4>EduManage</h4>
                            <p>Professional coaching center management software</p>
                        </div>
                        <div className="footer-col">
                            <h4>Product</h4>
                            <Link to="/features">Features</Link>
                            <Link to="/pricing">Pricing</Link>
                            <Link to="/about">About Us</Link>
                        </div>
                        <div className="footer-col">
                            <h4>Support</h4>
                            <Link to="/contact">Contact</Link>
                            <Link to="/terms">Terms of Service</Link>
                            <Link to="/privacy">Privacy Policy</Link>
                        </div>
                        <div className="footer-col">
                            <h4>Connect</h4>
                            <a href="mailto:support@edumanage.com">support@edumanage.com</a>
                            <a href="tel:+911234567890">+91 123 456 7890</a>
                        </div>
                    </div>
                    <div className="footer-bottom">
                        <p>&copy; 2026 EduManage. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}

export default PricingPage;
