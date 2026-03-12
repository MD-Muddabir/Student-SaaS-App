/**
 * Public Site Controller
 * Handles public-facing routes (no authentication required)
 */

const {
    InstitutePublicProfile,
    InstituteGalleryPhoto,
    InstituteReview,
    PublicEnquiry,
    Institute,
    Faculty,
    User,
    Subject,
    Class
} = require("../models");

// Simple in-memory rate limiter (per IP per institute per hour)
const enquiryRateLimit = new Map();

function checkRateLimit(ip, instituteId) {
    const key = `${ip}_${instituteId}`;
    const now = Date.now();
    const windowMs = 60 * 60 * 1000; // 1 hour
    const maxRequests = 3;

    if (!enquiryRateLimit.has(key)) {
        enquiryRateLimit.set(key, []);
    }

    const requests = enquiryRateLimit.get(key).filter(t => now - t < windowMs);
    enquiryRateLimit.set(key, requests);

    if (requests.length >= maxRequests) return false;

    requests.push(now);
    enquiryRateLimit.set(key, requests);
    return true;
}

// ─────────────────────────────────────────────────────────────────
// GET /api/public/:slug  — Get complete public page data
// ─────────────────────────────────────────────────────────────────
exports.getPublicPageData = async (req, res) => {
    try {
        const { slug } = req.params;

        const profile = await InstitutePublicProfile.findOne({
            where: { slug, is_published: true },
            include: [{ model: Institute, attributes: ['id', 'name', 'email', 'phone', 'address', 'logo'] }]
        });

        if (!profile) {
            return res.status(404).json({ success: false, error: 'NOT_FOUND', message: "Institute page not found or not published" });
        }

        const instituteId = profile.institute_id;

        // Increment view count (non-blocking)
        profile.increment('page_views').catch(() => {});

        // Fetch all related data in parallel
        const [gallery, reviews, facultyList, subjectList] = await Promise.all([
            InstituteGalleryPhoto.findAll({
                where: { institute_id: instituteId },
                order: [['sort_order', 'ASC'], ['created_at', 'ASC']]
            }),
            InstituteReview.findAll({
                where: { institute_id: instituteId, is_approved: true },
                order: [['sort_order', 'ASC'], ['created_at', 'DESC']]
            }),
            Faculty.findAll({
                where: { institute_id: instituteId },
                include: [{ model: User, attributes: ['name', 'email'] }],
                attributes: ['id', 'user_id']
            }),
            Subject.findAll({
                where: { institute_id: instituteId },
                include: [{ model: Class, attributes: ['name'] }],
                attributes: ['id', 'name', 'class_id']
            })
        ]);

        const parseJson = (val, defaultVal) => {
            if (!val) return defaultVal;
            try { return typeof val === 'string' ? JSON.parse(val) : val; } catch (e) { return val; }
        };

        // Filter faculty/subjects to selected ones only
        const selectedFacultyIds = parseJson(profile.selected_faculty_ids, []);
        const selectedSubjectIds = parseJson(profile.selected_subject_ids, []);

        const visibleFaculty = selectedFacultyIds.length > 0
            ? facultyList.filter(f => selectedFacultyIds.includes(f.id))
            : facultyList;

        const visibleSubjects = selectedSubjectIds.length > 0
            ? subjectList.filter(s => selectedSubjectIds.includes(s.id))
            : subjectList;

        const responseData = {
            institute_id: instituteId,
            name: profile.Institute?.name || '',
            slug: profile.slug,
            is_published: profile.is_published,
            tagline: profile.tagline,
            description: profile.description,
            about_text: profile.about_text,
            logo_url: profile.logo_url || profile.Institute?.logo,
            cover_photo_url: profile.cover_photo_url,
            affiliation: profile.affiliation,
            admission_status: profile.admission_status,
            stats: {
                students: profile.total_students_display,
                pass_rate: profile.pass_rate,
                selections: profile.competitive_selections,
                years: profile.years_of_excellence
            },
            usp_points: parseJson(profile.usp_points, []),
            enrollment_benefits: parseJson(profile.enrollment_benefits, []),
            theme_color: profile.theme_color,
            seo_title: profile.seo_title,
            seo_description: profile.seo_description,
            contact: {
                address: profile.contact_address || profile.Institute?.address,
                phone: profile.contact_phone || profile.Institute?.phone,
                email: profile.contact_email || profile.Institute?.email,
                whatsapp: profile.whatsapp_number,
                working_hours: profile.working_hours,
                map_embed_url: profile.map_embed_url
            },
            social: {
                facebook: profile.social_facebook,
                instagram: profile.social_instagram,
                youtube: profile.social_youtube
            },
            footer_description: profile.footer_description,
            gallery: gallery.map(g => ({ id: g.id, photo_url: g.photo_url, label: g.label })),
            reviews: reviews.map(r => ({
                id: r.id,
                student_name: r.student_name,
                review_text: r.review_text,
                rating: r.rating,
                achievement: r.achievement
            })),
            faculty: visibleFaculty.map(f => ({
                id: f.id,
                name: f.User?.name || 'Faculty',
                email: f.User?.email,
                subject: subjectList.filter(s => s.faculty_id === f.user_id).map(s => s.name).join(', ')
            })),
            courses: visibleSubjects.map(s => ({
                id: s.id,
                name: s.name,
                class_name: s.Class?.name
            })),
            page_views: profile.page_views
        };

        return res.json({ success: true, data: responseData });
    } catch (error) {
        console.error("getPublicPageData error:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// ─────────────────────────────────────────────────────────────────
// POST /api/public/:slug/enquiry  — Submit enquiry form
// ─────────────────────────────────────────────────────────────────
exports.submitEnquiry = async (req, res) => {
    try {
        const { slug } = req.params;
        const ip = req.ip || req.connection.remoteAddress;

        const profile = await InstitutePublicProfile.findOne({
            where: { slug, is_published: true }
        });

        if (!profile) {
            return res.status(404).json({ success: false, error: 'NOT_FOUND', message: "Institute page not found" });
        }

        // Rate limiting check
        if (!checkRateLimit(ip, profile.institute_id)) {
            return res.status(429).json({
                success: false,
                message: "Too many enquiries submitted. Please try again after an hour."
            });
        }

        const { first_name, last_name, mobile, email, course_interest, current_class, message } = req.body;

        // Basic validation
        if (!first_name || !mobile) {
            return res.status(400).json({ success: false, message: "Name and mobile are required" });
        }

        if (!/^[6-9]\d{9}$/.test(mobile)) {
            return res.status(400).json({ success: false, message: "Please enter a valid 10-digit Indian mobile number" });
        }

        const enquiry = await PublicEnquiry.create({
            institute_id: profile.institute_id,
            first_name: first_name.trim(),
            last_name: last_name?.trim() || null,
            mobile,
            email: email?.trim() || null,
            course_interest: course_interest?.trim() || null,
            current_class: current_class?.trim() || null,
            message: message?.trim() || null,
            status: 'new',
            ip_address: ip
        });

        return res.json({
            success: true,
            message: "Enquiry submitted successfully! The institute will contact you soon.",
            enquiry_id: enquiry.id
        });
    } catch (error) {
        console.error("submitEnquiry error:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};
