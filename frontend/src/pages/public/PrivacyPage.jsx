import React, { useEffect } from "react";
import PublicNavbar from "../../components/layout/PublicNavbar";
import { Link } from "react-router-dom";
import "./PublicPages.css";

const PrivacyPage = () => {
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    }, []);

    return (
        <div className="public-page-wrapper">
            <PublicNavbar />
            <main className="legal-content-container">
                <div className="legal-header card">
                    <h1>Privacy Policy</h1>
                    <p>Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                </div>

                <div className="legal-body card">
                    <section className="legal-section">
                        <h2>1. Introduction</h2>
                        <p>
                            Welcome to Student SaaS. We respect your privacy and are committed to protecting your personal data. This privacy policy will inform you as to how we look after your personal data when you visit our website or use our application ("Service") and tell you about your privacy rights and how the law protects you.
                        </p>
                    </section>

                    <section className="legal-section">
                        <h2>2. Data We Collect About You</h2>
                        <p>
                            Personal data, or personal information, means any information about an individual from which that person can be identified.
                        </p>
                        <ul>
                            <li><strong>Identity Data:</strong> includes first name, last name, username or similar identifier.</li>
                            <li><strong>Contact Data:</strong> includes email address and telephone numbers.</li>
                            <li><strong>Technical Data:</strong> includes internet protocol (IP) address, your login data, browser type and version, time zone setting and location, browser plug-in types and versions, operating system and platform, and other technology on the devices you use to access this website.</li>
                            <li><strong>Profile Data:</strong> includes your username and password, purchases or orders made by you, your interests, preferences, feedback, and survey responses.</li>
                            <li><strong>Usage Data:</strong> includes information about how you use our website, products, and services.</li>
                        </ul>
                    </section>

                    <section className="legal-section">
                        <h2>3. How We Use Your Personal Data</h2>
                        <p>
                            We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:
                        </p>
                        <ul>
                            <li>Where we need to perform the contract we are about to enter into or have entered into with you.</li>
                            <li>Where it is necessary for our legitimate interests (or those of a third party) and your interests and fundamental rights do not override those interests.</li>
                            <li>Where we need to comply with a legal obligation.</li>
                        </ul>
                    </section>

                    <section className="legal-section">
                        <h2>4. Data Security</h2>
                        <p>
                            We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used, or accessed in an unauthorized way, altered, or disclosed. In addition, we limit access to your personal data to those employees, agents, contractors, and other third parties who have a business need to know.
                        </p>
                        <p>
                            They will only process your personal data on our instructions and they are subject to a duty of confidentiality.
                        </p>
                    </section>

                    <section className="legal-section">
                        <h2>5. Student Privacy Rights</h2>
                        <p>
                            As an educational platform, we maintain strict privacy considerations specifically to protect students. Educational records, attendance statistics, grades, and related analytics are only exposed to strictly authorized faculty and the parents or guardians associated with the given individual student profile in adherence with FERPA and standard localized academic privacy guidelines.
                        </p>
                    </section>

                    <section className="legal-section">
                        <h2>6. Third-Party Links</h2>
                        <p>
                            This website may include links to third-party websites, plug-ins, and applications. Clicking on those links or enabling those connections may allow third parties to collect or share data about you. We do not control these third-party websites and are not responsible for their privacy statements.
                        </p>
                    </section>

                    <section className="legal-section">
                        <h2>7. Your Legal Rights</h2>
                        <p>
                            Under certain circumstances, you have rights under data protection laws in relation to your personal data, including the right to:
                        </p>
                        <ul>
                            <li>Request access to your personal data.</li>
                            <li>Request correction of your personal data.</li>
                            <li>Request erasure of your personal data.</li>
                            <li>Object to processing of your personal data.</li>
                            <li>Request restriction of processing your personal data.</li>
                            <li>Request transfer of your personal data.</li>
                            <li>Right to withdraw consent.</li>
                        </ul>
                    </section>

                    <div className="legal-footer">
                        <Link to="/contact" className="btn btn-primary">Contact Us For Requests</Link>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default PrivacyPage;
