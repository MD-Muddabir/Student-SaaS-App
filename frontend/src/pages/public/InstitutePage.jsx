/**
 * Institute Public Page — Public-facing component
 * Route: /i/:slug
 * Fetches data from /api/public/:slug and renders the full page
 */
import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./InstitutePage.css";

const API_BASE = import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:5000/api`;
const resolveImg = (url) => {
  if (!url) return '';
  if (url.startsWith('http') || url.startsWith('blob:') || url.startsWith('data:')) return url;
  return API_BASE.replace('/api', '') + url;
};
const CLASS_OPTIONS = ["8th", "9th", "10th", "11th", "12th", "Dropper", "Other"];

// ── Loading Skeleton ──────────────────────────────────────────────
function Skeleton() {
  return (
    <div style={{ minHeight: "100vh", background: "#f8faff" }}>
      <div style={{ height: 60, background: "#0f2340" }} />
      <div style={{ height: 520, background: "linear-gradient(135deg,#0f2340,#1e3a5f)" }} />
      <div style={{ maxWidth: 1100, margin: "3rem auto", padding: "0 2rem", display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "1.5rem" }}>
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="ipage-skeleton" style={{ height: 120, borderRadius: 14 }} />
        ))}
      </div>
    </div>
  );
}

// ── Star Rating ───────────────────────────────────────────────────
function Stars({ rating }) {
  return (
    <span className="stars">
      {"★".repeat(rating)}{"☆".repeat(5 - rating)}
    </span>
  );
}

// ── Main Component ────────────────────────────────────────────────
export default function InstitutePage() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Enquiry form state
  const [form, setForm] = useState({ first_name: "", last_name: "", mobile: "", email: "", course_interest: "", current_class: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState("");

  // Hero slider
  const [heroImg, setHeroImg] = useState(0);
  const enqRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${API_BASE}/public/${slug}`);
        const json = await res.json();
        if (!res.ok || json.error === "NOT_FOUND" || !json.data?.is_published) {
          navigate("/404", { replace: true });
          return;
        }
        setData(json.data);
        // Update document head for SEO
        document.title = json.data.seo_title || `${json.data.name} — Institute`;
        const metaDesc = document.querySelector("meta[name='description']");
        if (metaDesc) metaDesc.setAttribute("content", json.data.seo_description || json.data.description || "");
      } catch (e) {
        setError("Failed to load page");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [slug, navigate]);

  // Hero slider auto-advance
  useEffect(() => {
    if (!data?.gallery?.length) return;
    const t = setInterval(() => setHeroImg(h => (h + 1) % data.gallery.length), 4000);
    return () => clearInterval(t);
  }, [data]);

  const scrollToEnq = () => enqRef.current?.scrollIntoView({ behavior: "smooth" });

  const handleEnqSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    if (!form.first_name.trim()) return setFormError("Name is required");
    if (!/^[6-9]\d{9}$/.test(form.mobile)) return setFormError("Enter valid 10-digit mobile number");

    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/public/${slug}/enquiry`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (json.success) {
        setSubmitted(true);
      } else {
        setFormError(json.message || "Submission failed");
      }
    } catch (e) {
      setFormError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Skeleton />;
  if (error) return <div style={{ textAlign: "center", padding: "4rem", color: "#ef4444" }}>{error}</div>;
  if (!data) return null;

  const themeColor = `#${data.theme_color || "0f2340"}`;
  const heroStyle = {
    background: data.cover_photo_url
      ? `linear-gradient(to right, ${themeColor}ee 40%, ${themeColor}99 100%), url('${resolveImg(data.cover_photo_url)}')`
      : `linear-gradient(135deg, ${themeColor} 0%, #1e3a5f 100%)`,
    backgroundSize: 'cover',
    backgroundPosition: 'center'
  };

  const logoInitial = (data.name || "I")[0].toUpperCase();

  return (
    <div className="ipage-root">

      {/* ── Navbar ── */}
      <nav className="ipage-nav" style={{ backgroundColor: `${themeColor}ec` }}>
        <div className="ipage-nav-brand">
          <div className="ipage-nav-logo">
            {data.logo_url ? <img src={resolveImg(data.logo_url)} alt="logo" /> : logoInitial}
          </div>
          <span className="ipage-nav-name">{data.name}</span>
        </div>
        <div className="ipage-nav-actions">
          <a href="#courses" className="ipage-btn-outline" style={{ fontSize: ".8rem" }}>Courses</a>
          <a href="#faculty" className="ipage-btn-outline" style={{ fontSize: ".8rem" }}>Faculty</a>
          <button className="ipage-btn-primary" onClick={scrollToEnq}>Enquire Now</button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="ipage-hero" id="home">
        {data.cover_photo_url && (
          <img className="ipage-hero-bg" src={resolveImg(data.cover_photo_url)} alt="cover" />
        )}
        <div className="ipage-hero-overlay" />
        <div className="ipage-hero-content">
          {data.affiliation && <div className="ipage-badge">{data.affiliation} Affiliated</div>}
          <h1>{data.name}</h1>
          {data.tagline && <p className="tagline">"{data.tagline}"</p>}
          {data.description && <p className="desc">{data.description}</p>}
          {data.admission_status && (
            <div style={{ display: "inline-block", marginBottom: "1rem", background: "rgba(16,185,129,.25)", border: "1px solid rgba(16,185,129,.4)", color: "#6ee7b7", padding: "4px 14px", borderRadius: "20px", fontSize: ".85rem", fontWeight: 700 }}>
              🎓 {data.admission_status}
            </div>
          )}
          <div className="ipage-hero-cta">
            <button className="ipage-btn-primary" style={{ padding: ".65rem 1.5rem", fontSize: "1rem" }} onClick={scrollToEnq}>
              📋 Enquire Now
            </button>
            {data.contact?.whatsapp && (
              <a href={`https://wa.me/91${data.contact.whatsapp}`} target="_blank" rel="noopener noreferrer"
                className="ipage-btn-outline" style={{ padding: ".65rem 1.5rem", fontSize: "1rem" }}>
                💬 WhatsApp Us
              </a>
            )}
          </div>
        </div>
      </section>

      {/* ── Stats strip ── */}
      {(data.stats?.students || data.stats?.pass_rate || data.stats?.selections || data.stats?.years) && (
        <div className="ipage-stats-strip">
          {data.stats.students && <div className="ipage-stat-item"><div className="stat-num">{data.stats.students}</div><div className="stat-lbl">Students Enrolled</div></div>}
          {data.stats.pass_rate && <div className="ipage-stat-item"><div className="stat-num">{data.stats.pass_rate}</div><div className="stat-lbl">Board Pass Rate</div></div>}
          {data.stats.selections && <div className="ipage-stat-item"><div className="stat-num">{data.stats.selections}</div><div className="stat-lbl">Competitive Selections</div></div>}
          {data.stats.years && <div className="ipage-stat-item"><div className="stat-num">{data.stats.years}</div><div className="stat-lbl">Years of Excellence</div></div>}
        </div>
      )}

      {/* ── Courses ── */}
      {data.courses?.length > 0 && (
        <section className="ipage-section" id="courses">
          <div className="ipage-section-inner">
            <div className="ipage-section-title">
              <h2>📚 Our Courses</h2>
              <div className="ipage-divider" />
              <p>Expert-led courses designed for excellence</p>
            </div>
            <div className="ipage-courses-grid">
              {data.courses.map((c, i) => (
                <div className="ipage-course-card" key={c.id || i}>
                  <div className="course-icon">📖</div>
                  <h3>{c.name}</h3>
                  {c.class_name && <div className="course-class">Class: {c.class_name}</div>}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── USP Points ── */}
      {data.usp_points?.filter(Boolean).length > 0 && (
        <section className="ipage-section ipage-section-alt">
          <div className="ipage-section-inner">
            <div className="ipage-section-title">
              <h2>⭐ Why Choose Us</h2>
              <div className="ipage-divider" />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "1rem" }}>
              {data.usp_points.filter(Boolean).map((p, i) => (
                <div key={i} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "1.25rem", display: "flex", gap: ".75rem", alignItems: "flex-start" }}>
                  <span style={{ fontSize: "1.4rem", flexShrink: 0 }}>✨</span>
                  <span style={{ fontWeight: 600 }}>{p}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Faculty ── */}
      {data.faculty?.length > 0 && (
        <section className="ipage-section" id="faculty">
          <div className="ipage-section-inner">
            <div className="ipage-section-title">
              <h2>👩‍🏫 Our Expert Faculty</h2>
              <div className="ipage-divider" />
              <p>Learn from the best educators</p>
            </div>
            <div className="ipage-faculty-grid">
              {data.faculty.map((f, i) => (
                <div className="ipage-faculty-card" key={f.id || i}>
                  <div className="ipage-faculty-avatar">
                    {(f.name || "F")[0].toUpperCase()}
                  </div>
                  <h3>{f.name}</h3>
                  {f.subject && <div className="fac-subject">{f.subject}</div>}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Gallery ── */}
      {data.gallery?.length > 0 && (
        <section className="ipage-section ipage-section-alt">
          <div className="ipage-section-inner">
            <div className="ipage-section-title">
              <h2>🖼 Campus Gallery</h2>
              <div className="ipage-divider" />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "1rem" }}>
              {data.gallery.map((g, i) => (
                <div key={g.id || i} style={{ borderRadius: "12px", overflow: "hidden", aspectRatio: "4/3", background: "#e5e7eb" }}>
                  <img src={resolveImg(g.photo_url)} alt={g.label || "campus"} loading="lazy"
                    style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform .3s" }}
                    onMouseOver={e => e.target.style.transform = "scale(1.05)"}
                    onMouseOut={e => e.target.style.transform = "scale(1)"} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Reviews ── */}
      {data.reviews?.length > 0 && (
        <section className="ipage-section">
          <div className="ipage-section-inner">
            <div className="ipage-section-title">
              <h2>💬 Student Testimonials</h2>
              <div className="ipage-divider" />
              <p>What our students say about us</p>
            </div>
            <div className="ipage-reviews-grid">
              {data.reviews.map((r, i) => (
                <div className="ipage-review-card" key={r.id || i}>
                  <Stars rating={r.rating} />
                  <p className="review-text">"{r.review_text}"</p>
                  <div className="reviewer">— {r.student_name}</div>
                  {r.achievement && <div className="achievement">{r.achievement}</div>}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Enroll CTA + Form ── */}
      <section className="ipage-section ipage-enroll-section" ref={enqRef} id="enquiry">
        <div className="ipage-section-inner">
          <div className="ipage-enroll-inner">
            <div className="ipage-enroll-left">
              <h2>Ready to Join?<br />Enquire Today!</h2>
              {data.enrollment_benefits?.filter(Boolean).length > 0 && (
                <ul className="ipage-benefits-list">
                  {data.enrollment_benefits.filter(Boolean).map((b, i) => <li key={i}>{b}</li>)}
                </ul>
              )}
              {data.contact?.whatsapp && (
                <a href={`https://wa.me/91${data.contact.whatsapp}`} target="_blank" rel="noopener noreferrer"
                  style={{ display: "inline-flex", alignItems: "center", gap: ".5rem", marginTop: "1.5rem", background: "#25D366", color: "#fff", padding: ".65rem 1.5rem", borderRadius: "10px", textDecoration: "none", fontWeight: 700 }}>
                  💬 Direct WhatsApp
                </a>
              )}
            </div>
            <div>
              <div className="ipage-enroll-form">
                <h3>📋 Send Enquiry</h3>
                {submitted ? (
                  <div style={{ textAlign: "center", padding: "2rem 0" }}>
                    <div style={{ fontSize: "3rem" }}>🎉</div>
                    <h4 style={{ color: "#059669", marginBottom: ".5rem" }}>Enquiry Submitted!</h4>
                    <p style={{ color: "#374151", fontSize: ".9rem" }}>We'll contact you soon. Check your WhatsApp!</p>
                    <button style={{ marginTop: "1rem", background: "#6366f1", color: "#fff", border: "none", padding: ".5rem 1.5rem", borderRadius: "8px", cursor: "pointer", fontWeight: 600 }}
                      onClick={() => setSubmitted(false)}>Submit Another</button>
                  </div>
                ) : (
                  <form onSubmit={handleEnqSubmit}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: ".75rem" }}>
                      <div className="ipage-field">
                        <label>First Name *</label>
                        <input value={form.first_name} onChange={e => setForm(p => ({ ...p, first_name: e.target.value }))} placeholder="Rahul" required />
                      </div>
                      <div className="ipage-field">
                        <label>Last Name</label>
                        <input value={form.last_name} onChange={e => setForm(p => ({ ...p, last_name: e.target.value }))} placeholder="Sharma" />
                      </div>
                    </div>
                    <div className="ipage-field">
                      <label>Mobile Number *</label>
                      <input value={form.mobile} onChange={e => setForm(p => ({ ...p, mobile: e.target.value }))} placeholder="9876543210" maxLength={10} required />
                    </div>
                    <div className="ipage-field">
                      <label>Email</label>
                      <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="rahul@email.com" />
                    </div>
                    {data.courses?.length > 0 && (
                      <div className="ipage-field">
                        <label>Course Interest</label>
                        <select value={form.course_interest} onChange={e => setForm(p => ({ ...p, course_interest: e.target.value }))}>
                          <option value="">Select a course...</option>
                          {data.courses.map((c, i) => <option key={i} value={c.name}>{c.name}</option>)}
                        </select>
                      </div>
                    )}
                    <div className="ipage-field">
                      <label>Current Class</label>
                      <select value={form.current_class} onChange={e => setForm(p => ({ ...p, current_class: e.target.value }))}>
                        <option value="">Select...</option>
                        {CLASS_OPTIONS.map(c => <option key={c}>{c}</option>)}
                      </select>
                    </div>
                    {formError && <div style={{ color: "#ef4444", fontSize: ".85rem", marginBottom: ".75rem", fontWeight: 600 }}>⚠️ {formError}</div>}
                    <button type="submit" className="ipage-submit-btn" disabled={submitting}>
                      {submitting ? "Sending..." : "🚀 Submit Enquiry"}
                    </button>
                    <p style={{ fontSize: ".75rem", color: "#6b7280", textAlign: "center", marginTop: ".75rem" }}>
                      We'll contact you within 24 hours. No spam.
                    </p>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Contact ── */}
      <section className="ipage-section" id="contact">
        <div className="ipage-section-inner">
          <div className="ipage-section-title">
            <h2>📍 Find Us</h2>
            <div className="ipage-divider" />
          </div>
          <div className="ipage-contact-grid">
            <div className="ipage-contact-info">
              <h3>Contact Information</h3>
              {data.contact?.address && (
                <div className="contact-detail"><span className="ci">📍</span><span>{data.contact.address}</span></div>
              )}
              {data.contact?.phone && (
                <div className="contact-detail">
                  <span className="ci">📞</span>
                  <a href={`tel:${data.contact.phone}`} style={{ color: "inherit" }}>{data.contact.phone}</a>
                </div>
              )}
              {data.contact?.email && (
                <div className="contact-detail">
                  <span className="ci">✉️</span>
                  <a href={`mailto:${data.contact.email}`} style={{ color: "inherit" }}>{data.contact.email}</a>
                </div>
              )}
              {data.contact?.working_hours && (
                <div className="contact-detail"><span className="ci">🕐</span><span>{data.contact.working_hours}</span></div>
              )}
              {/* Social links */}
              {(data.social?.facebook || data.social?.instagram || data.social?.youtube) && (
                <div className="ipage-social-links">
                  {data.social.facebook && <a href={data.social.facebook} target="_blank" rel="noopener noreferrer" className="ipage-social-link">f</a>}
                  {data.social.instagram && <a href={data.social.instagram} target="_blank" rel="noopener noreferrer" className="ipage-social-link">📸</a>}
                  {data.social.youtube && <a href={data.social.youtube} target="_blank" rel="noopener noreferrer" className="ipage-social-link">▶</a>}
                </div>
              )}
            </div>
            <div>
              {data.contact?.map_embed_url ? (
                <div className="ipage-map">
                  <iframe src={data.contact.map_embed_url} title="Map" allowFullScreen loading="lazy" />
                </div>
              ) : (
                <div className="ipage-map" style={{ display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af", flexDirection: "column", gap: "1rem" }}>
                  <span style={{ fontSize: "3rem" }}>🗺️</span>
                  <p style={{ margin: 0 }}>{data.contact?.address || "Location not set"}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="ipage-footer">
        <div className="ipage-footer-grid">
          <div className="ipage-footer-brand">
            <div className="brand-name">🏫 {data.name}</div>
            <p>{data.footer_description || data.description || "Empowering students to achieve their dreams."}</p>
          </div>
          {data.courses?.length > 0 && (
            <div>
              <h4>Our Courses</h4>
              <ul>{data.courses.slice(0, 6).map((c, i) => <li key={i}>{c.name}</li>)}</ul>
            </div>
          )}
          <div>
            <h4>Quick Links</h4>
            <ul>
              <li><a href="#home" style={{ color: "inherit" }}>Home</a></li>
              <li><a href="#courses" style={{ color: "inherit" }}>Courses</a></li>
              <li><a href="#faculty" style={{ color: "inherit" }}>Faculty</a></li>
              <li><a href="#enquiry" style={{ color: "inherit" }}>Enquiry</a></li>
              <li><a href="#contact" style={{ color: "inherit" }}>Contact</a></li>
            </ul>
          </div>
        </div>
        <div className="ipage-footer-bottom">
          <span>© {new Date().getFullYear()} {data.name}. All rights reserved.</span>
          <span style={{ opacity: .5 }}>Powered by EduManage SaaS</span>
        </div>
      </footer>

      {/* ── WhatsApp Float Button ── */}
      {data.contact?.whatsapp && (
        <a href={`https://wa.me/91${data.contact.whatsapp}?text=Hi! I found your institute on the web and I am interested in your courses.`}
          target="_blank" rel="noopener noreferrer" className="ipage-whatsapp-btn" title="Chat on WhatsApp">
          💬
        </a>
      )}
    </div>
  );
}
