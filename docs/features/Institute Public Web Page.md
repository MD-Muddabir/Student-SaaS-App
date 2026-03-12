
🎓 EduManage SaaS
Institute Public Web Page
Complete Implementation Guide — Basic to Advanced

All Phases — Backend · Frontend · Admin Dashboard · Validation · Multi-Tenant
 
Section 1 — Project Overview & What We Are Building

1.1  What is the Institute Public Web Page?
Every institute that buys your SaaS plan gets their own unique public website. The website URL looks like:

https://yourdomain.com/i/bright-future-academy
  OR
https://brightfuture.edumanage.in  (custom subdomain, advanced)

This page shows: Institute name, logo, courses, faculty, stats, testimonials, contact info, and an enquiry form. All data comes from the institute's admin dashboard. Different institute = different data = different looking website. But the page layout/design stays the same for all institutes.

1.2  How It Works — Simple Flow
Step	What Happens
1	Institute owner registers on your SaaS platform
2	Institute owner buys a plan (Basic, Pro, Enterprise)
3	Admin Dashboard shows option — 'Create Your Public Web Page'
4	Admin fills a multi-step form — logo, photos, courses, contact info, etc.
5	Admin clicks Publish — page goes live at /i/institute-slug
6	Public can visit the page and submit enquiries
7	Enquiries appear in Institute Admin Dashboard instantly
8	Admin can edit/update the page anytime from dashboard

1.3  Key Concepts You Must Understand
•	Multi-tenant: One codebase, many institutes. Each institute has its own data.
•	Slug: A URL-friendly name. 'Bright Future Academy' becomes 'bright-future-academy'
•	institute_id: Every institute has a unique ID in your database. All public page data links to this ID.
•	Plan Gate: Only institutes with active paid plan can create/show a public page.
•	Dynamic Rendering: The HTML template is fixed. Only the DATA changes per institute.

 
Section 2 — Database Design (All Tables You Need)

2.1  New Table — institute_public_profiles
This is the main table. One row per institute. Stores all public page content.

CREATE TABLE institute_public_profiles (
  id                    INT PRIMARY KEY AUTO_INCREMENT,
  institute_id          INT UNIQUE NOT NULL,  -- FK to your institutes table
  slug                  VARCHAR(120) UNIQUE NOT NULL,  -- URL identifier
  is_published          BOOLEAN DEFAULT FALSE,
  tagline               VARCHAR(200),
  description           TEXT,
  about_text            TEXT,
  logo_url              VARCHAR(500),
  cover_photo_url       VARCHAR(500),
  established_year      YEAR,
  affiliation           VARCHAR(100),  -- CBSE, State Board, etc.
  pass_rate             VARCHAR(20),   -- e.g. '98%' (manual entry)
  competitive_selections VARCHAR(50),  -- e.g. '450+ JEE/NEET'
  years_of_excellence   VARCHAR(20),   -- MANUAL, not auto-calc
  total_students_display VARCHAR(20),  -- e.g. '2400+' (manual)
  whatsapp_number       VARCHAR(20),
  map_embed_url         TEXT,
  working_hours         VARCHAR(200),
  admission_status      VARCHAR(100),  -- 'Admissions Open 2025-26'
  enrollment_benefits   JSON,          -- array of benefit strings
  usp_points            JSON,          -- unique selling points
  social_facebook       VARCHAR(300),
  social_instagram      VARCHAR(300),
  social_youtube        VARCHAR(300),
  theme_color           VARCHAR(10) DEFAULT '0F2340',
  seo_title             VARCHAR(200),
  seo_description       TEXT,
  footer_description    TEXT,
  created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

2.2  New Table — institute_gallery_photos
CREATE TABLE institute_gallery_photos (
  id             INT PRIMARY KEY AUTO_INCREMENT,
  institute_id   INT NOT NULL,
  photo_url      VARCHAR(500) NOT NULL,
  label          VARCHAR(100),  -- 'Our Library', 'Smart Classes'
  sort_order     INT DEFAULT 0,
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

2.3  New Table — institute_reviews
CREATE TABLE institute_reviews (
  id              INT PRIMARY KEY AUTO_INCREMENT,
  institute_id    INT NOT NULL,
  student_name    VARCHAR(100) NOT NULL,
  review_text     TEXT NOT NULL,
  rating          TINYINT DEFAULT 5,  -- 1 to 5
  achievement     VARCHAR(200),  -- 'JEE Mains 2024 - AIR 1240'
  is_approved     BOOLEAN DEFAULT TRUE,
  sort_order      INT DEFAULT 0,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

2.4  New Table — public_enquiries
CREATE TABLE public_enquiries (
  id              INT PRIMARY KEY AUTO_INCREMENT,
  institute_id    INT NOT NULL,
  first_name      VARCHAR(80) NOT NULL,
  last_name       VARCHAR(80),
  mobile          VARCHAR(15) NOT NULL,
  email           VARCHAR(150),
  course_interest VARCHAR(200),
  current_class   VARCHAR(50),
  message         TEXT,
  status          ENUM('new','contacted','enrolled','closed') DEFAULT 'new',
  ip_address      VARCHAR(45),
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

2.5  Indexes (Important for Performance)
CREATE INDEX idx_profile_slug ON institute_public_profiles(slug);
CREATE INDEX idx_gallery_inst ON institute_gallery_photos(institute_id);
CREATE INDEX idx_reviews_inst ON institute_reviews(institute_id);
CREATE INDEX idx_enquiry_inst ON public_enquiries(institute_id, status, created_at);

 
Section 3 — Backend API Routes (Node.js / Express)

3.1  File Structure
src/
  routes/
    publicPage.routes.js      ← Admin routes (protected, requires JWT)
    publicSite.routes.js      ← Public routes (no auth needed)
  controllers/
    publicPage.controller.js  ← Business logic for admin
    publicSite.controller.js  ← Business logic for public
  middleware/
    planGate.middleware.js     ← Check if institute has active plan
    upload.middleware.js       ← Multer/Cloudinary file upload
  validations/
    publicPage.validation.js  ← All input validations

3.2  Admin API Routes (JWT Protected)
Method + URL	What It Does
GET    /api/admin/public-page	Get current public page data for this institute
POST   /api/admin/public-page	Create public page for first time
PUT    /api/admin/public-page	Update public page info
POST   /api/admin/public-page/publish	Set is_published = true
POST   /api/admin/public-page/unpublish	Set is_published = false
POST   /api/admin/public-page/gallery	Upload gallery photos
DELETE /api/admin/public-page/gallery/:id	Delete one gallery photo
POST   /api/admin/public-page/reviews	Add student review
PUT    /api/admin/public-page/reviews/:id	Edit review
DELETE /api/admin/public-page/reviews/:id	Delete review
GET    /api/admin/enquiries	Get all enquiries for this institute
PUT    /api/admin/enquiries/:id/status	Update enquiry status

3.3  Public API Routes (No Auth)
Method + URL	What It Does
GET  /i/:slug	Serve public page HTML (SSR or SPA route)
GET  /api/public/:slug	Get all public page data as JSON
POST /api/public/:slug/enquiry	Submit enquiry form

3.4  Plan Gate Middleware
Before any admin creates a public page, check if they have an active paid plan:

// middleware/planGate.middleware.js
const planGate = async (req, res, next) => {
  const inst = await Institute.findById(req.user.institute_id);
  if (!inst.plan || inst.plan === 'free' || inst.plan_expires < new Date()) {
    return res.status(403).json({
      error: 'PLAN_REQUIRED',
      message: 'Please buy a plan to create your public page'
    });
  }
  next();
};

3.5  File Upload Setup (Cloudinary)
For logo, cover photo, gallery photos — use Cloudinary (free tier available):

npm install multer multer-storage-cloudinary cloudinary

// middleware/upload.middleware.js
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const storage = new CloudinaryStorage({
  cloudinary,
  params: { folder: 'edumanage/institutes', allowed_formats: ['jpg','png','webp'] }
});

const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB max

 
Section 4 — All Validations (express-validator)

Install: npm install express-validator

4.1  Public Page Form Validations
Field	Validation Rules
institute_name	Required. Min 3, Max 100 chars. No special chars except spaces, dot, dash
tagline	Optional. Max 200 chars. Strip HTML tags.
slug	Auto-generated from institute_name. Only lowercase letters, numbers, hyphens. Unique check in DB.
description	Optional. Max 1000 chars.
established_year	Optional. Number. Min 1900, Max current year.
pass_rate	Optional. Max 20 chars. Pattern: digits + % sign only. e.g. 98%
years_of_excellence	Optional. Max 20 chars. Manual entry.
whatsapp_number	Optional. Must be valid Indian mobile (10 digits, starts 6-9).
working_hours	Optional. Max 200 chars.
logo_url / cover_photo	File upload. Max 5MB. Types: jpg, png, webp only.
enrollment_benefits	JSON Array. Max 10 items. Each item max 150 chars.
theme_color	Hex color code. Pattern: ^[0-9A-Fa-f]{6}$

4.2  Gallery Photo Validations
•	Max 10 photos per institute
•	Each file max 5MB
•	Allowed formats: jpg, jpeg, png, webp
•	Label: Optional. Max 80 chars.

4.3  Review Validations
•	student_name: Required. Min 2, Max 80 chars. Only letters and spaces.
•	review_text: Required. Min 20, Max 500 chars.
•	rating: Required. Integer 1 to 5.
•	achievement: Optional. Max 150 chars.
•	Max 10 reviews per institute

4.4  Enquiry Form Validations (Public)
Field	Validation
first_name	Required. 2-50 chars. Letters and spaces only.
last_name	Optional. 1-50 chars.
mobile	Required. 10 digits. Starts with 6,7,8,9. Indian number.
email	Optional. Valid email format.
course_interest	Optional. Must match one of the institute's existing course names.
current_class	Optional. From allowed list only.
Rate Limiting	Max 3 enquiries per IP per institute per hour. Prevents spam.

4.5  Slug Generation Logic
function generateSlug(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')  // remove special chars
    .replace(/\s+/g, '-')           // spaces to hyphens
    .replace(/-+/g, '-')            // multiple hyphens to one
    .substring(0, 80);              // max 80 chars
}
// 'Bright Future Academy' → 'bright-future-academy'

 
Section 5 — Admin Dashboard Integration

5.1  Where to Add the Public Page Feature in Dashboard
In your existing Institute Admin Dashboard sidebar, add a new menu item:

📋 Dashboard Overview
👥 Students
🧑‍🏫 Faculty
📊 Attendance
💰 Fees
📝 Exams & Marks
📢 Announcements
🌐 Public Web Page   ← ADD THIS NEW MENU ITEM
⚙️ Settings

5.2  Dashboard Card — Before Page is Created
When admin has a paid plan but has NOT created a public page yet, show this card:

  💡 NEW FEATURE    You can now create your Institute's Public Web Page!

•	Show a big attractive card with icon and description
•	Text: 'Create your public website to attract more students. Share your courses, faculty, and achievements.'
•	Button: 'Create Public Page' → opens the multi-step setup wizard
•	Show 'Plan Required' if institute is on free plan → redirect to pricing page

5.3  Dashboard Card — After Page is Published
After page is live, show a management card with these options:

Button/Info	What It Does
🔗 View Live Page	Opens /i/institute-slug in new tab
📋 Copy Page URL	Copies public URL to clipboard
✏️ Edit Page	Opens the edit form with existing data pre-filled
📊 Enquiries (count badge)	Shows number of new/unread enquiries
🔴 Unpublish Page	Hides page from public (page still exists, just hidden)
📈 Page Views (optional)	Show basic view count if analytics added

5.4  Enquiry Inbox in Admin Dashboard
A new section under 'Public Web Page' shows all form submissions:

•	Table with columns: Name, Mobile, Email, Course Interest, Class, Date, Status
•	Status dropdown: New → Contacted → Enrolled → Closed
•	Filter by status, date range, course
•	Click any row to see full details
•	WhatsApp Quick Reply button: opens wa.me/919XXXXXX with pre-filled message
•	Export to Excel button (useful for institute owners)

 
Section 6 — Multi-Step Setup Wizard (6 Steps)

When admin clicks 'Create Public Page', a 6-step form wizard opens. Each step has save + next functionality. Admin can go back and edit any step. Progress bar shows at top.

Step 1 — Basic Institute Info
Field	Type & Notes
Institute Name	Pre-filled from your institutes table. Read-only.
Page URL Slug	Auto-generated. Show preview: yourdomain.com/i/bright-future-academy
Tagline / Motto	Text input. E.g. 'Excellence Since 2012'
Short Description	Textarea. Shown in hero section.
About Text	Textarea. Shown in About section.
Established Year	Number input. Used in 'Years of Excellence'.
Years of Excellence	Text input. Manual. E.g. '12+'. NOT auto-calculated.
Board / Affiliation	Dropdown: CBSE / State Board / ICSE / IB / Other
Admission Status	Text. E.g. 'Admissions Open 2025-26'

Step 2 — Upload Photos & Logo
Upload Field	Rules & Notes
Institute Logo	Recommended: 200x200px square. PNG with transparent bg preferred. Max 2MB.
Cover / Hero Photo	Recommended: 1920x600px. Background image for hero section. Max 5MB.
About Section Photos	Upload up to 3 photos. E.g. Library, Smart Classes, Lab. Max 2MB each.
Gallery Photos	Upload up to 8 photos. For gallery section. Max 3MB each.
Photo Labels	Optional text labels for About photos and Gallery photos.
  📸 TIP    Show a preview of each uploaded photo immediately after upload. Allow delete/replace.

Step 3 — Stats & Achievements
Field	Notes
Total Students Display	Manual text. E.g. '2,400+'. Shown in hero and stats strip.
Board Pass Rate	Manual text. E.g. '98%'. MANUAL - admin enters this themselves.
Competitive Selections	Manual text. E.g. '450+ JEE/NEET'. MANUAL entry.
Years of Excellence	Manual. E.g. '12+'. Same as Step 1. Pre-filled.
USP Points	Up to 5 selling points. E.g. 'Result-Focused Teaching', 'Expert IIT Faculty'
Enrollment Benefits	Up to 8 benefits. E.g. 'Free demo class', 'Scholarship available'

Step 4 — Courses (Auto-Loaded from Your Existing Courses Table)
Courses are already in your database. Don't make admin re-enter them. Instead:

•	Fetch all courses for this institute from your existing courses table
•	Show a checkbox list — admin selects which courses to show on public page
•	Admin can add extra details per course: badge label (Popular/New/JEE), icon/emoji, color theme
•	If no courses exist yet, show a notice: 'Please add courses first from Courses section'

Step 5 — Faculty (Auto-Loaded from Your Existing Faculty Table)
Faculty is already in your system. Same approach as courses:

•	Fetch all faculty for this institute from your users table (role = faculty)
•	Admin selects which faculty members to show on public page (checkbox list)
•	Admin can add public-facing info per faculty: public bio, qualification, experience text
•	Photo: if faculty has a profile photo in system, use it. Else show initials avatar.

Step 6 — Contact Info & Social Links
Field	Notes
Full Address	Textarea. Shown in contact section and footer.
Phone Number	Text. Shown publicly.
Email Address	Text. Validated as email format.
WhatsApp Number	10-digit Indian mobile. Used for WhatsApp float button.
Working Hours	Text. E.g. 'Mon–Sat 7AM–9PM, Sun 9AM–1PM'
Google Maps Embed URL	Paste embed URL from Google Maps. Optional.
Facebook Page URL	Optional.
Instagram Profile URL	Optional.
YouTube Channel URL	Optional.
Footer Description	Short text shown in footer. E.g. 'Empowering students since 2012'

Final Step — Review & Publish
•	Show a full preview of what the public page will look like
•	If any required field is missing, show a checklist of what's incomplete
•	'Save as Draft' button — saves but does not publish
•	'Publish Now' button — makes page live at /i/slug
•	After publish: show success screen with page URL and share buttons

 
Section 7 — Frontend Implementation

7.1  Public Page URL Routing
In your React app or server, you need to handle the public page URL:

// Option A: React Router (SPA approach)
<Route path='/i/:slug' element={<InstitutePublicPage />} />

// Option B: Express server-side render
app.get('/i/:slug', publicSiteController.renderPage);

  ✅ RECOMMENDED    Use Option A (React SPA) since you already have React frontend. The page fetches data from /api/public/:slug and renders dynamically.

7.2  How the Public Page Loads Data
// components/InstitutePublicPage.jsx

const { slug } = useParams();

useEffect(() => {
  fetch(`/api/public/${slug}`)
    .then(res => res.json())
    .then(data => {
      if (data.error === 'NOT_FOUND') { navigate('/404'); return; }
      if (!data.is_published) { navigate('/404'); return; }
      setInstitute(data);
    });
}, [slug]);

7.3  What the /api/public/:slug API Returns
{
  institute_id: 42,
  name: 'Bright Future Academy',
  slug: 'bright-future-academy',
  is_published: true,
  logo_url: 'https://cloudinary.com/...',
  tagline: 'Excellence Since 2012',
  description: '...',
  stats: { students: '2400+', pass_rate: '98%', selections: '450+', years: '12+' },
  courses: [ { name: '...', fee: 18000, duration: '1 Year', badge: 'Popular', ... } ],
  faculty: [ { name: '...', subject: '...', experience: '...', photo_url: null } ],
  gallery: [ { photo_url: '...', label: 'Library' }, ... ],
  reviews: [ { student_name: '...', review_text: '...', rating: 5, achievement: '...' } ],
  contact: { address: '...', phone: '...', email: '...', whatsapp: '...' },
  enrollment_benefits: ['Free counselling', 'Scholarship...'],
  social: { facebook: '...', instagram: '...', youtube: '...' }
}

7.4  Public Page Sections Checklist
Section	Data Source
Navbar — Logo + Name + Buttons	logo_url, name
Hero — Title, Stats, Slider	name, tagline, description, stats, cover_photo_url
Courses Grid	courses[] from DB, filtered to selected ones
Stats Strip	stats.students, pass_rate, selections, years
Faculty Grid	faculty[] from DB, filtered to selected ones
Student Reviews	reviews[] from institute_reviews table
Enroll CTA + Form	enrollment_benefits[], courses[] for dropdown
Contact Section	contact.address, phone, email, hours, map_embed_url
Footer	name, logo, footer_description, courses, social links
WhatsApp Float Button	contact.whatsapp

 
Section 8 — All Implementation Phases (Step by Step)

Phase 1	Database Setup
Create all 4 new tables. Add indexes. Takes 30 minutes.

•	Run the CREATE TABLE SQL statements from Section 2
•	Add indexes for performance
•	Test by inserting one dummy row and fetching it

Phase 2	File Upload Setup (Cloudinary)
Enable photo uploads for logo, cover photo, gallery.

•	Create free Cloudinary account at cloudinary.com
•	Add CLOUDINARY_CLOUD_NAME, API_KEY, API_SECRET to your .env file
•	Install: npm install multer multer-storage-cloudinary cloudinary
•	Create upload middleware (see Section 3.5)
•	Test by uploading one image and checking Cloudinary dashboard

Phase 3	Backend API — Admin Routes
Build all protected admin routes with validation.

•	Create publicPage.routes.js with all routes from Section 3.2
•	Add planGate middleware to all routes
•	Add input validations (Section 4)
•	Test all routes using Postman

Phase 4	Backend API — Public Routes
Build public read-only routes with rate limiting.

•	Create publicSite.routes.js with routes from Section 3.3
•	Install rate limiting: npm install express-rate-limit
•	Add rate limit to enquiry submission (3 per IP per hour)
•	Test fetching page data and submitting an enquiry

Phase 5	Admin Dashboard — Sidebar + Page Status Card
Add new menu item and show/hide logic based on plan.

•	Add 'Public Web Page' to sidebar navigation
•	Create PublicPageDashboard.jsx component
•	Show 'Create Page' card if page not created yet
•	Show management card with stats if page exists
•	Show 'Upgrade Plan' message if on free plan

Phase 6	Admin Dashboard — 6-Step Setup Wizard
Multi-step form to collect all public page info.

•	Step 1: Basic Info form with validation
•	Step 2: Photo uploads with drag-and-drop and preview
•	Step 3: Stats and achievements form
•	Step 4: Course selection from existing courses
•	Step 5: Faculty selection from existing faculty
•	Step 6: Contact info and social links
•	Final: Preview screen and Publish button
•	Save progress at each step (don't lose data if admin leaves)

Phase 7	Public Page Frontend
Build the actual public-facing HTML page.

•	Create InstitutePublicPage.jsx component
•	Add React Router route /i/:slug
•	Fetch data from /api/public/:slug on mount
•	Show 404 if slug not found or page not published
•	Render all 10 sections using fetched data
•	Show loading skeleton while data loads
•	Handle empty data gracefully (e.g. no reviews = hide reviews section)

Phase 8	Enquiry Form + Admin Inbox
Connect public form to admin dashboard.

•	Enquiry form submits to POST /api/public/:slug/enquiry
•	Validate form inputs (Section 4.4)
•	Save to public_enquiries table
•	Optional: Send WhatsApp notification to institute via Twilio/WA Business API
•	In Admin Dashboard: add Enquiries tab showing all submissions
•	Status management: New → Contacted → Enrolled → Closed

Phase 9	Advanced — SEO & Performance
Make the page search-engine friendly and fast.

•	Add meta title and meta description using institute SEO fields
•	Add Open Graph tags for social media sharing previews
•	Lazy load gallery images (use loading='lazy' attribute)
•	Compress images on upload using Cloudinary's transformation params
•	Cache public page API responses (5 min cache for public data)

Phase 10	Advanced — Custom Subdomain (Optional)
Give each institute their own subdomain.

•	Install wildcard SSL certificate on your server
•	Configure Nginx to capture *.yourdomain.com requests
•	Extract subdomain from request host header
•	Map subdomain to institute slug in the database
•	This is complex — implement only after all other phases are done

 
Section 9 — How Different Institutes Get Different Pages

9.1  The Core Concept
Every request to /i/:slug does these steps:

1.	Extract slug from URL — e.g. 'bright-future-academy'
2.	Query DB: SELECT * FROM institute_public_profiles WHERE slug = ? AND is_published = 1
3.	If not found → show 404 page
4.	Get institute_id from the result
5.	Fetch related data: courses, faculty, gallery, reviews using institute_id
6.	Return all data as JSON
7.	React frontend renders the page using this data

9.2  What Changes Per Institute
Thing That Changes	Stays the Same
Institute name, logo, tagline	Page layout / HTML structure
Cover photo, gallery photos	CSS styles and design
Courses list and fees	Section order and components
Faculty names and subjects	Fonts and color scheme (unless theme_color set)
Stats (students, pass rate)	Enquiry form functionality
Student reviews	WhatsApp button behavior
Contact info and address	Navbar button behavior
Social media links	Footer structure

9.3  Handling Missing Data Gracefully
Not all institutes will fill every field. Handle empty sections like this:

•	No gallery photos → hide gallery section entirely
•	No reviews → hide testimonials section
•	No cover photo → use solid navy color background in hero
•	No logo → show institute name initials as logo (like your current design)
•	No WhatsApp number → hide WhatsApp float button
•	No map embed URL → show placeholder with address text
•	No social links → hide social icons in footer

 
Section 10 — Complete Implementation Checklist

Database
•	✅ Create institute_public_profiles table
•	✅ Create institute_gallery_photos table
•	✅ Create institute_reviews table
•	✅ Create public_enquiries table
•	✅ Add all indexes

Backend
•	✅ Setup Cloudinary and upload middleware
•	✅ Create planGate middleware
•	✅ Create admin routes (GET, POST, PUT for public page)
•	✅ Create public routes (/api/public/:slug)
•	✅ Add validations for all inputs
•	✅ Add rate limiting to enquiry endpoint
•	✅ Slug generation and uniqueness check
•	✅ Enquiry save to DB

Admin Dashboard
•	✅ Add 'Public Web Page' to sidebar
•	✅ Plan gate check — show upgrade prompt on free plan
•	✅ Show 'Create Page' card when page not created
•	✅ 6-Step Setup Wizard with form validation
•	✅ Photo upload with preview in wizard
•	✅ Auto-load courses from existing courses
•	✅ Auto-load faculty from existing users
•	✅ Save progress per step
•	✅ Preview before publish
•	✅ Publish / Unpublish toggle
•	✅ Show live page URL with copy button
•	✅ Enquiry inbox with status management
•	✅ WhatsApp quick reply on enquiry rows

Public Page Frontend
•	✅ React route /i/:slug
•	✅ Loading skeleton while fetching
•	✅ 404 for unknown slug or unpublished page
•	✅ All 10 sections rendering correctly
•	✅ Hide empty sections gracefully
•	✅ Enquiry form with validation
•	✅ Auto-slider with 3 images
•	✅ WhatsApp float button
•	✅ Mobile responsive design
•	✅ SEO meta tags

Testing
•	✅ Create 2 test institutes with different data
•	✅ Confirm both show different pages at /i/slug-1 and /i/slug-2
•	✅ Test enquiry form submission
•	✅ Test 404 for wrong slug
•	✅ Test plan gate — free plan cannot access wizard
•	✅ Test file upload size limits



EduManage SaaS — Built for institutes across India 🇮🇳
Powered by EduManage SaaS Platform
