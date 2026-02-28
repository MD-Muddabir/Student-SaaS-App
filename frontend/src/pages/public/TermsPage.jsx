import React, { useEffect } from "react";
import PublicNavbar from "../../components/layout/PublicNavbar";
import { Link } from "react-router-dom";
import "./PublicPages.css";

const TermsPage = () => {
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    }, []);

    return (
        <div className="public-page-wrapper">
            <PublicNavbar />
            <main className="legal-content-container">
                <div className="legal-header card">
                    <h1>Terms of Service</h1>
                    <p>Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                </div>

                <div className="legal-body card">
                    <section className="legal-section">
                        <h2>1. Acceptance of Terms</h2>
                        <p>
                            By accessing or using the Student SaaS platform ("Service"), you agree to be bound by these Terms of Service. If you disagree with any part of the terms, then you do not have permission to access the Service.
                        </p>
                    </section>

                    <section className="legal-section">
                        <h2>2. Communications</h2>
                        <p>
                            By creating an Account on our Service, you agree to subscribe to newsletters, marketing or promotional materials and other information we may send. However, you may opt out of receiving any, or all, of these communications from us by following the unsubscribe link or instructions provided in any email we send.
                        </p>
                    </section>

                    <section className="legal-section">
                        <h2>3. User Accounts</h2>
                        <p>
                            When you create an account with us, you must provide us information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our Service.
                        </p>
                        <p>
                            You are responsible for safeguarding the password that you use to access the Service and for any activities or actions under your password, whether your password is with our Service or a third-party service.
                        </p>
                        <p>
                            You agree not to disclose your password to any third party. You must notify us immediately upon becoming aware of any breach of security or unauthorized use of your account.
                        </p>
                    </section>

                    <section className="legal-section">
                        <h2>4. Institute and Admin Responsibilities</h2>
                        <p>
                            Institutes subscribing to our Service are strictly liable for defining roles for administrators, faculty, and students. Ensuring lawful data processing per local regulations stands as the responsibility of the administrative organization handling student records through our platform.
                        </p>
                    </section>

                    <section className="legal-section">
                        <h2>5. Intellectual Property</h2>
                        <p>
                            The Service and its original content (excluding Content provided by users), features, and functionality are and will remain the exclusive property of Student SaaS and its licensors. The Service is protected by copyright, trademark, and other laws. Our trademarks and trade dress may not be used in connection with any product or service without the prior written consent of Student SaaS.
                        </p>
                    </section>

                    <section className="legal-section">
                        <h2>6. Termination</h2>
                        <p>
                            We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
                        </p>
                        <p>
                            Upon termination, your right to use the Service will immediately cease. If you wish to terminate your account, you may simply discontinue using the Service or utilize the account settings provided if you possess administrative privileges.
                        </p>
                    </section>

                    <section className="legal-section">
                        <h2>7. Limitation Of Liability</h2>
                        <p>
                            In no event shall Student SaaS, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from (i) your access to or use of or inability to access or use the Service; (ii) any conduct or content of any third party on the Service; (iii) any content obtained from the Service; and (iv) unauthorized access, use or alteration of your transmissions or content, whether based on warranty, contract, tort (including negligence) or any other legal theory.
                        </p>
                    </section>

                    <section className="legal-section">
                        <h2>8. Changes</h2>
                        <p>
                            We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material we will try to provide at least 30 days notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.
                        </p>
                        <p>
                            By continuing to access or use our Service after those revisions become effective, you agree to be bound by the revised terms. If you do not agree to the new terms, please stop using the Service.
                        </p>
                    </section>

                    <div className="legal-footer">
                        <Link to="/contact" className="btn btn-primary">Contact Us For Questions</Link>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default TermsPage;
