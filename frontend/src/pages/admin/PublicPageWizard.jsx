/**
 * Admin Public Page — 6-Step Wizard
 * Handles create / edit / publish of institute public web page
 */
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import "./PublicPage.css";

const API_BASE = import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:5000/api`;
const resolveImg = (url) => {
  if (!url) return '';
  if (url.startsWith('http') || url.startsWith('blob:') || url.startsWith('data:')) return url;
  return API_BASE.replace('/api', '') + url;
};

const STEPS = [
  { label: "Basic Info" },
  { label: "Photos" },
  { label: "Stats" },
  { label: "Courses" },
  { label: "Faculty" },
  { label: "Contact" },
  { label: "Publish" },
];

const AFFILIATION_OPTIONS = ["CBSE", "State Board", "ICSE", "IB", "University", "Other"];
const CLASS_OPTIONS = ["8th", "9th", "10th", "11th", "12th", "Dropper", "Other"];

export default function PublicPageWizard({ onDone, existingData }) {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  // Form state — all steps merged
  const [form, setForm] = useState({
    tagline: "", description: "", about_text: "", established_year: "",
    years_of_excellence: "", affiliation: "", admission_status: "",
    logo_url: "", cover_photo_url: "",
    pass_rate: "", competitive_selections: "", total_students_display: "",
    usp_points: [""], enrollment_benefits: [""],
    selected_subject_ids: [], selected_faculty_ids: [],
    contact_address: "", contact_phone: "", contact_email: "",
    whatsapp_number: "", working_hours: "", map_embed_url: "",
    social_facebook: "", social_instagram: "", social_youtube: "",
    footer_description: "", seo_title: "", seo_description: "",
    theme_color: "0F2340",
  });

  const [logoFile, setLogoFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [gallery, setGallery] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [newReview, setNewReview] = useState({ student_name: "", review_text: "", rating: 5, achievement: "" });
  const [subjects, setSubjects] = useState([]);
  const [faculty, setFaculty] = useState([]);

  // Pre-fill from existing data
  useEffect(() => {
    if (existingData) {
      setForm(prev => ({
        ...prev,
        tagline: existingData.tagline || "",
        description: existingData.description || "",
        about_text: existingData.about_text || "",
        established_year: existingData.established_year || "",
        years_of_excellence: existingData.years_of_excellence || "",
        affiliation: existingData.affiliation || "",
        admission_status: existingData.admission_status || "",
        pass_rate: existingData.pass_rate || "",
        competitive_selections: existingData.competitive_selections || "",
        total_students_display: existingData.total_students_display || "",
        usp_points: existingData.usp_points?.length ? existingData.usp_points : [""],
        enrollment_benefits: existingData.enrollment_benefits?.length ? existingData.enrollment_benefits : [""],
        selected_subject_ids: existingData.selected_subject_ids || [],
        selected_faculty_ids: existingData.selected_faculty_ids || [],
        contact_address: existingData.contact_address || "",
        contact_phone: existingData.contact_phone || "",
        contact_email: existingData.contact_email || "",
        whatsapp_number: existingData.whatsapp_number || "",
        working_hours: existingData.working_hours || "",
        map_embed_url: existingData.map_embed_url || "",
        social_facebook: existingData.social_facebook || "",
        social_instagram: existingData.social_instagram || "",
        social_youtube: existingData.social_youtube || "",
        footer_description: existingData.footer_description || "",
        seo_title: existingData.seo_title || "",
        seo_description: existingData.seo_description || "",
        theme_color: existingData.theme_color || "0F2340",
        logo_url: existingData.logo_url || "",
        cover_photo_url: existingData.cover_photo_url || "",
      }));
      if (existingData.logo_url) setLogoPreview(existingData.logo_url);
      if (existingData.cover_photo_url) setCoverPreview(existingData.cover_photo_url);
      if (existingData.gallery) setGallery(existingData.gallery);
      if (existingData.reviews) setReviews(existingData.reviews);
    }
  }, [existingData]);

  useEffect(() => {
    api.get("/admin/public-page/subjects").then(r => setSubjects(r.data.data || [])).catch(() => {});
    api.get("/admin/public-page/faculty").then(r => setFaculty(r.data.data || [])).catch(() => {});
  }, []);

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));
  const setList = (key, idx, val) => setForm(prev => {
    const arr = [...prev[key]]; arr[idx] = val; return { ...prev, [key]: arr };
  });
  const addListItem = (key) => setForm(prev => ({ ...prev, [key]: [...prev[key], ""] }));
  const removeListItem = (key, idx) => setForm(prev => ({
    ...prev, [key]: prev[key].filter((_, i) => i !== idx)
  }));

  const toggleId = (key, id) => setForm(prev => {
    const arr = prev[key];
    return { ...prev, [key]: arr.includes(id) ? arr.filter(x => x !== id) : [...arr, id] };
  });

  // Save current step data to backend
  const saveStep = useCallback(async (publish = false) => {
    setSaving(true);
    setMsg("");
    try {
      const fd = new FormData();
      const jsonFields = ["usp_points", "enrollment_benefits", "selected_subject_ids", "selected_faculty_ids"];
      Object.entries(form).forEach(([k, v]) => {
        if (k === "logo_url" || k === "cover_photo_url") return;
        if (jsonFields.includes(k)) fd.append(k, JSON.stringify(v));
        else if (v !== "") fd.append(k, v);
      });
      if (logoFile) fd.append("logo", logoFile);
      if (coverFile) fd.append("cover_photo", coverFile);

      await api.post("/admin/public-page", fd, { headers: { "Content-Type": "multipart/form-data" } });

      if (publish) {
        await api.post("/admin/public-page/publish");
        setMsg("🎉 Your page is now LIVE!");
        if (onDone) onDone();
        return;
      }
    } catch (e) {
      setMsg("⚠️ " + (e.response?.data?.message || "Save failed"));
    } finally {
      setSaving(false);
    }
  }, [form, logoFile, coverFile, onDone]);

  const handleNext = async () => {
    await saveStep();
    if (step < STEPS.length - 1) setStep(s => s + 1);
  };

  const handleGalleryUpload = async (file) => {
    if (!file) return;
    const fd = new FormData();
    fd.append("photo", file);
    try {
      const r = await api.post("/admin/public-page/gallery", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setGallery(prev => [...prev, r.data.data]);
    } catch (e) { alert("Upload failed: " + (e.response?.data?.message || e.message)); }
  };

  const handleDeleteGallery = async (id) => {
    try {
      await api.delete(`/admin/public-page/gallery/${id}`);
      setGallery(prev => prev.filter(g => g.id !== id));
    } catch (e) { alert("Delete failed"); }
  };

  const handleAddReview = async () => {
    if (!newReview.student_name || !newReview.review_text) return alert("Name and review are required");
    try {
      const r = await api.post("/admin/public-page/reviews", newReview);
      setReviews(prev => [...prev, r.data.data]);
      setNewReview({ student_name: "", review_text: "", rating: 5, achievement: "" });
    } catch (e) { alert(e.response?.data?.message || "Failed to add review"); }
  };

  const handleDeleteReview = async (id) => {
    if (!window.confirm("Delete this review?")) return;
    try {
      await api.delete(`/admin/public-page/reviews/${id}`);
      setReviews(prev => prev.filter(r => r.id !== id));
    } catch (e) { alert("Delete failed"); }
  };

  const renderFileInput = (label, file, preview, setFile, setPreview, accept = ".jpg,.jpeg,.png,.webp") => (
    <div className="form-row">
      <label>{label}</label>
      <label className="upload-area" style={{ display: "block", cursor: "pointer" }}>
        {preview
          ? <img src={resolveImg(preview)} alt="preview" style={{ width: "100%", maxHeight: "200px", objectFit: "contain", borderRadius: "10px" }} />
          : <div><div style={{ fontSize: "2rem" }}>📸</div><div>Click to upload</div><div className="form-hint">JPG, PNG or WebP · Max 5MB</div></div>
        }
        <input type="file" accept={accept} style={{ display: "none" }} onChange={e => {
          const f = e.target.files[0]; if (!f) return;
          setFile(f); setPreview(URL.createObjectURL(f));
        }} />
      </label>
    </div>
  );

  // ──────────── STEP RENDERS ────────────

  const renderStep0 = () => (
    <div>
      <h3 style={{ marginTop: 0 }}>📋 Basic Institute Info</h3>
      <div className="form-grid-2">
        <div className="form-row">
          <label>Tagline / Motto</label>
          <input placeholder="Excellence Since 2012" value={form.tagline} onChange={e => set("tagline", e.target.value)} />
        </div>
        <div className="form-row">
          <label>Admission Status</label>
          <input placeholder="Admissions Open 2025–26" value={form.admission_status} onChange={e => set("admission_status", e.target.value)} />
        </div>
      </div>
      <div className="form-row">
        <label>Short Description (Hero Section)</label>
        <textarea placeholder="A brief description shown on the hero banner..." value={form.description} onChange={e => set("description", e.target.value)} />
      </div>
      <div className="form-row">
        <label>About Text (About Section)</label>
        <textarea rows={4} placeholder="Your detailed institute story..." value={form.about_text} onChange={e => set("about_text", e.target.value)} />
      </div>
      <div className="form-grid-2">
        <div className="form-row">
          <label>Established Year</label>
          <input type="number" min="1900" max="2025" placeholder="2012" value={form.established_year} onChange={e => set("established_year", e.target.value)} />
        </div>
        <div className="form-row">
          <label>Years of Excellence</label>
          <input placeholder="12+" value={form.years_of_excellence} onChange={e => set("years_of_excellence", e.target.value)} />
        </div>
      </div>
      <div className="form-grid-2">
        <div className="form-row">
          <label>Board / Affiliation</label>
          <select value={form.affiliation} onChange={e => set("affiliation", e.target.value)}>
            <option value="">Select...</option>
            {AFFILIATION_OPTIONS.map(o => <option key={o}>{o}</option>)}
          </select>
        </div>
        <div className="form-row">
          <label>Theme Color (hex)</label>
          <div style={{ display: "flex", gap: ".5rem", alignItems: "center" }}>
            <input type="color" value={`#${form.theme_color}`} style={{ width: 48, height: 38, padding: 2, borderRadius: 8, border: "1px solid var(--border-color)" }}
              onChange={e => set("theme_color", e.target.value.replace("#", ""))} />
            <input value={form.theme_color} onChange={e => set("theme_color", e.target.value.replace("#", ""))} placeholder="0F2340" style={{ flex: 1 }} />
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div>
      <h3 style={{ marginTop: 0 }}>📸 Upload Photos</h3>
      <div className="form-grid-2">
        {renderFileInput("Institute Logo (200×200 recommended)", logoFile, logoPreview, setLogoFile, setLogoPreview)}
        {renderFileInput("Cover / Hero Photo (1920×600 recommended)", coverFile, coverPreview, setCoverFile, setCoverPreview)}
      </div>
      <div className="form-row" style={{ marginTop: "1rem" }}>
        <label>Gallery Photos (max 10)</label>
        <div className="gallery-grid">
          {gallery.map(g => (
            <div className="gallery-item" key={g.id}>
              <img src={resolveImg(g.photo_url)} alt={g.label || "gallery"} />
              <button className="remove-btn" onClick={() => handleDeleteGallery(g.id)}>✕</button>
            </div>
          ))}
          {gallery.length < 10 && (
            <label className="upload-area" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", aspectRatio: "1", borderRadius: "10px", cursor: "pointer" }}>
              <span style={{ fontSize: "2rem" }}>+</span>
              <span style={{ fontSize: ".75rem" }}>Add Photo</span>
              <input type="file" accept=".jpg,.jpeg,.png,.webp" style={{ display: "none" }} onChange={e => handleGalleryUpload(e.target.files[0])} />
            </label>
          )}
        </div>
        <div className="form-hint">{gallery.length}/10 photos uploaded</div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div>
      <h3 style={{ marginTop: 0 }}>📊 Stats & Achievements</h3>
      <div className="form-grid-2">
        <div className="form-row">
          <label>Total Students Display</label>
          <input placeholder="2,400+" value={form.total_students_display} onChange={e => set("total_students_display", e.target.value)} />
        </div>
        <div className="form-row">
          <label>Board Pass Rate</label>
          <input placeholder="98%" value={form.pass_rate} onChange={e => set("pass_rate", e.target.value)} />
        </div>
        <div className="form-row">
          <label>Competitive Selections</label>
          <input placeholder="450+ JEE/NEET" value={form.competitive_selections} onChange={e => set("competitive_selections", e.target.value)} />
        </div>
      </div>
      <div className="form-row">
        <label>USP Points (Up to 5)</label>
        {form.usp_points.map((v, i) => (
          <div className="dynamic-list-item" key={i}>
            <input value={v} onChange={e => setList("usp_points", i, e.target.value)} placeholder={`USP #${i + 1}`} />
            {form.usp_points.length > 1 && <button className="btn-icon-remove" onClick={() => removeListItem("usp_points", i)}>✕</button>}
          </div>
        ))}
        {form.usp_points.length < 5 && <button className="btn btn-sm btn-secondary" onClick={() => addListItem("usp_points")}>+ Add USP</button>}
      </div>
      <div className="form-row">
        <label>Enrollment Benefits (Up to 8)</label>
        {form.enrollment_benefits.map((v, i) => (
          <div className="dynamic-list-item" key={i}>
            <input value={v} onChange={e => setList("enrollment_benefits", i, e.target.value)} placeholder={`Benefit #${i + 1}`} />
            {form.enrollment_benefits.length > 1 && <button className="btn-icon-remove" onClick={() => removeListItem("enrollment_benefits", i)}>✕</button>}
          </div>
        ))}
        {form.enrollment_benefits.length < 8 && <button className="btn btn-sm btn-secondary" onClick={() => addListItem("enrollment_benefits")}>+ Add Benefit</button>}
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div>
      <h3 style={{ marginTop: 0 }}>📚 Select Courses to Show</h3>
      {subjects.length === 0
        ? <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-secondary)", background: "var(--border-color)", borderRadius: "12px" }}>
            ⚠️ No courses/subjects found. Please add subjects from the <strong>Subjects</strong> section first.
          </div>
        : <div className="check-list">
            {subjects.map(s => (
              <label className={`check-item ${form.selected_subject_ids.includes(s.id) ? "selected" : ""}`} key={s.id}>
                <input type="checkbox" checked={form.selected_subject_ids.includes(s.id)} onChange={() => toggleId("selected_subject_ids", s.id)} />
                <div className="item-info">
                  <div className="item-name">{s.name}</div>
                  <div className="item-sub">Class: {s.Class?.name || "—"}</div>
                </div>
              </label>
            ))}
          </div>
      }
      <p className="form-hint" style={{ marginTop: "1rem" }}>Selected: {form.selected_subject_ids.length} of {subjects.length}. Leave all unchecked to show all.</p>
    </div>
  );

  const renderStep4 = () => (
    <div>
      <h3 style={{ marginTop: 0 }}>👩‍🏫 Select Faculty to Show</h3>
      {faculty.length === 0
        ? <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-secondary)", background: "var(--border-color)", borderRadius: "12px" }}>
            ⚠️ No faculty found. Please add faculty from the <strong>Faculty</strong> section first.
          </div>
        : <div className="check-list">
            {faculty.map(f => (
              <label className={`check-item ${form.selected_faculty_ids.includes(f.id) ? "selected" : ""}`} key={f.id}>
                <input type="checkbox" checked={form.selected_faculty_ids.includes(f.id)} onChange={() => toggleId("selected_faculty_ids", f.id)} />
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, flexShrink: 0 }}>
                  {(f.name || "F")[0].toUpperCase()}
                </div>
                <div className="item-info">
                  <div className="item-name">{f.name}</div>
                  <div className="item-sub">{f.email}</div>
                </div>
              </label>
            ))}
          </div>
      }
      <p className="form-hint" style={{ marginTop: "1rem" }}>Selected: {form.selected_faculty_ids.length} of {faculty.length}. Leave all unchecked to show all.</p>

      <div className="form-row" style={{ marginTop: "1.5rem" }}>
        <label>Student Reviews / Testimonials</label>
        {reviews.map(r => (
          <div className="review-card" key={r.id}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700 }}>{r.student_name}</div>
              <div className="stars">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</div>
              <div style={{ fontSize: ".85rem", marginTop: ".25rem" }}>{r.review_text}</div>
              {r.achievement && <div className="form-hint">{r.achievement}</div>}
            </div>
            <div className="review-actions">
              <button className="btn btn-sm btn-danger" onClick={() => handleDeleteReview(r.id)}>✕</button>
            </div>
          </div>
        ))}
        {reviews.length < 10 && (
          <div style={{ border: "1px solid var(--border-color)", borderRadius: "12px", padding: "1rem", marginTop: ".75rem" }}>
            <div className="form-grid-2">
              <div className="form-row">
                <label>Student Name</label>
                <input value={newReview.student_name} onChange={e => setNewReview(p => ({ ...p, student_name: e.target.value }))} />
              </div>
              <div className="form-row">
                <label>Achievement</label>
                <input placeholder="JEE 2024 - AIR 240" value={newReview.achievement} onChange={e => setNewReview(p => ({ ...p, achievement: e.target.value }))} />
              </div>
            </div>
            <div className="form-row">
              <label>Review Text</label>
              <textarea rows={2} value={newReview.review_text} onChange={e => setNewReview(p => ({ ...p, review_text: e.target.value }))} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <label>Rating: </label>
              {[1, 2, 3, 4, 5].map(n => (
                <span key={n} style={{ cursor: "pointer", fontSize: "1.3rem", color: n <= newReview.rating ? "#f59e0b" : "#d1d5db" }}
                  onClick={() => setNewReview(p => ({ ...p, rating: n }))}>★</span>
              ))}
              <button className="btn btn-sm btn-primary" style={{ marginLeft: "auto" }} onClick={handleAddReview}>+ Add Review</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div>
      <h3 style={{ marginTop: 0 }}>📞 Contact & Social Links</h3>
      <div className="form-row">
        <label>Full Address</label>
        <textarea placeholder="123 Main St, City, State - 400001" value={form.contact_address} onChange={e => set("contact_address", e.target.value)} />
      </div>
      <div className="form-grid-2">
        <div className="form-row">
          <label>Phone Number</label>
          <input placeholder="+91 98765 43210" value={form.contact_phone} onChange={e => set("contact_phone", e.target.value)} />
        </div>
        <div className="form-row">
          <label>Email Address</label>
          <input type="email" placeholder="info@institute.com" value={form.contact_email} onChange={e => set("contact_email", e.target.value)} />
        </div>
        <div className="form-row">
          <label>WhatsApp Number (10 digits)</label>
          <input placeholder="9876543210" value={form.whatsapp_number} onChange={e => set("whatsapp_number", e.target.value)} />
          <div className="form-hint">Used for WhatsApp floating button on your public page</div>
        </div>
        <div className="form-row">
          <label>Working Hours</label>
          <input placeholder="Mon–Sat 7AM–9PM" value={form.working_hours} onChange={e => set("working_hours", e.target.value)} />
        </div>
      </div>
      <div className="form-row">
        <label>Google Maps Embed URL</label>
        <input placeholder="Paste embed URL from Google Maps" value={form.map_embed_url} onChange={e => set("map_embed_url", e.target.value)} />
      </div>
      <div className="form-grid-2">
        <div className="form-row">
          <label>Facebook URL</label>
          <input placeholder="https://facebook.com/..." value={form.social_facebook} onChange={e => set("social_facebook", e.target.value)} />
        </div>
        <div className="form-row">
          <label>Instagram URL</label>
          <input placeholder="https://instagram.com/..." value={form.social_instagram} onChange={e => set("social_instagram", e.target.value)} />
        </div>
        <div className="form-row">
          <label>YouTube URL</label>
          <input placeholder="https://youtube.com/..." value={form.social_youtube} onChange={e => set("social_youtube", e.target.value)} />
        </div>
        <div className="form-row">
          <label>Footer Description</label>
          <input placeholder="Empowering students since 2012" value={form.footer_description} onChange={e => set("footer_description", e.target.value)} />
        </div>
      </div>
      <div className="form-grid-2">
        <div className="form-row">
          <label>SEO Title</label>
          <input placeholder="Bright Future Academy | Best Coaching in City" value={form.seo_title} onChange={e => set("seo_title", e.target.value)} />
        </div>
        <div className="form-row">
          <label>SEO Description</label>
          <input placeholder="Top-ranked coaching with 98% pass rate..." value={form.seo_description} onChange={e => set("seo_description", e.target.value)} />
        </div>
      </div>
    </div>
  );

  const renderStep6 = () => {
    const checks = [
      { label: "Tagline added", done: !!form.tagline },
      { label: "Description added", done: !!form.description },
      { label: "Logo uploaded", done: !!(logoPreview || form.logo_url) },
      { label: "Contact phone added", done: !!form.contact_phone },
      { label: "Address added", done: !!form.contact_address },
      { label: "At least 1 course selected", done: form.selected_subject_ids.length > 0 || subjects.length === 0 },
    ];
    const allGood = checks.every(c => c.done);
    return (
      <div>
        <h3 style={{ marginTop: 0 }}>🚀 Review & Publish</h3>
        <div className="publish-preview">
          <div className="preview-hero" style={{ background: `linear-gradient(135deg, #${form.theme_color}, #1e3a5f)` }}>
            <div className="logo-circle">
              {logoPreview ? <img src={resolveImg(logoPreview)} alt="logo" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} /> : "🏫"}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: "1.1rem" }}>{existingData?.name || "Your Institute"}</div>
              <div style={{ opacity: .8, fontSize: ".85rem" }}>{form.tagline || "Your tagline here"}</div>
              <div style={{ fontSize: ".75rem", opacity: .6, marginTop: ".25rem" }}>
                yourdomain.com/i/{existingData?.slug || "your-institute"}
              </div>
            </div>
          </div>
          <div className="publish-checklist">
            <div style={{ fontWeight: 700, marginBottom: ".75rem" }}>Page Readiness Checklist</div>
            {checks.map((c, i) => (
              <div className="checklist-item" key={i}>
                <span className="ci-icon">{c.done ? "✅" : "⚠️"}</span>
                <span style={{ color: c.done ? "var(--text-primary)" : "#f59e0b" }}>{c.label}</span>
              </div>
            ))}
          </div>
        </div>
        {msg && <div style={{ padding: ".75rem 1rem", borderRadius: "10px", background: "rgba(99,102,241,.1)", marginBottom: "1rem", fontWeight: 600 }}>{msg}</div>}
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          <button className="btn btn-secondary" onClick={() => saveStep(false)} disabled={saving}>
            {saving ? "Saving..." : "💾 Save as Draft"}
          </button>
          <button className="btn btn-success" onClick={() => saveStep(true)} disabled={saving || !allGood}>
            {saving ? "Publishing..." : "🚀 Publish Now"}
          </button>
          {!allGood && <span style={{ fontSize: ".8rem", color: "var(--text-secondary)", alignSelf: "center" }}>Complete all checklist items to publish</span>}
        </div>
      </div>
    );
  };

  const stepRenders = [renderStep0, renderStep1, renderStep2, renderStep3, renderStep4, renderStep5, renderStep6];

  return (
    <div className="wizard-wrapper">
      {/* Progress bar */}
      <div className="wizard-progress">
        <div className="wizard-steps-bar">
          {STEPS.map((s, i) => (
            <div className={`wizard-step-item ${i < step ? "done" : ""} ${i === step ? "active" : ""}`} key={i} onClick={() => setStep(i)} style={{ cursor: "pointer" }}>
              <span style={{ fontSize: ".7rem", marginTop: ".2rem" }}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Step body */}
      <div className="wizard-body">
        {stepRenders[step]()}
      </div>

      {/* Footer nav */}
      <div className="wizard-footer">
        <button className="btn btn-secondary" onClick={() => setStep(s => s - 1)} disabled={step === 0}>← Back</button>
        <span style={{ fontSize: ".8rem", color: "var(--text-secondary)" }}>Step {step + 1} of {STEPS.length}</span>
        {step < STEPS.length - 1
          ? <button className="btn btn-primary" onClick={handleNext} disabled={saving}>{saving ? "Saving..." : "Save & Next →"}</button>
          : null
        }
      </div>
    </div>
  );
}
