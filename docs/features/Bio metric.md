🔐
BIOMETRIC ATTENDANCE
Complete Feature Design & Implementation Guide
Student SaaS — Multi-Tenant Coaching ERP Platform
Module	Biometric Attendance System
Project	Student SaaS (MD-Muddabir/Student-SaaS)
Scope	Hardware + Backend + Frontend + Database
Phases Covered	12 Implementation Phases
Device Types	Fingerprint, Face, RFID, Mobile OTP
Integration	REST API + WebSocket + Cron Jobs
Document Type	Architecture + Implementation Guide
 
1. What is Biometric Attendance?
Biometric Attendance is an automated attendance tracking system that identifies individuals using unique physical or behavioral characteristics instead of manual roll call or card swipes. In the context of Student SaaS, it replaces the manual attendance process with hardware devices that auto-mark attendance in real time, syncing directly with the backend database.

The system works by enrolling (registering) a student's or faculty member's biometric data once, then verifying that data every time they enter or exit the premises. The verification result is sent to the SaaS backend via API, which records the attendance and triggers notifications.

Why Biometric Attendance?
✅  Eliminates proxy attendance (students marking for absent friends)
✅  Removes manual roll-call time from classes
✅  Provides real-time attendance data to admin, faculty, and parents
✅  Creates tamper-proof audit trail
✅  Integrates with fees, exams, and parent notifications automatically

2. Biometric Device Types — Which to Use
There are four major biometric methods suitable for a coaching/school ERP. Each has different costs, accuracy, and implementation complexity.

Type	Device Example	Cost	Accuracy	Speed	Best For
Fingerprint Scanner	ZKTeco K40 / U160	₹3,000–₹8,000	99.5%	< 1 sec	Entry gate / classroom
Face Recognition	ZKTeco SpeedFace / Anviz FaceDeep	₹8,000–₹25,000	99.7%	0.3 sec	Large institutes, no touch
RFID Card	Realtime T304 / eSSL i9C	₹2,000–₹5,000	100% (card)	0.5 sec	Entry gate, hostels
Iris Scanner	IrisGuard / Crossmatch	₹30,000+	99.9%	2–3 sec	High security campuses
Mobile OTP / QR	Software only (no hardware)	₹0	~95%	2–5 sec	Remote/online institutes


2.1 Recommended Device for Student SaaS
For a coaching institute SaaS, the ideal choice is a combination strategy:

Use Case	Recommended Device	Why
Primary (offline institutes)	ZKTeco K40 (Fingerprint)	Market leader, HTTP push API, works without internet, ₹4,500
Modern institutes	ZKTeco SpeedFace V5L (Face)	Touchless post-COVID, accurate, built-in HTTP API
Budget option	RFID Card system	Lowest cost, simple setup, good for small institutes
Online/Hybrid	Mobile OTP + QR Code	No hardware needed — pure software solution


Most Popular Choice in Indian Coaching Institutes
ZKTeco K40 Fingerprint Device is the #1 recommended device for this project.

Price: ₹3,500 – ₹5,000 per device
Capacity: 3,000 fingerprints + 1,00,000 records
Communication: HTTP Push (sends attendance to your server automatically)
SDK: ZKTeco ADMS (Attendance Data Management System) — free
Connectivity: LAN / WiFi
Works with: Node.js backend via HTTP endpoint

3. How the Biometric System Works — End to End
3.1 Complete Data Flow
The biometric system works in a 5-stage pipeline:

Full System Pipeline
STAGE 1 — ENROLLMENT
   Student/Faculty registers their biometric at the device → stored locally in device memory
   Biometric ID (device user ID) mapped to student_id in database

STAGE 2 — VERIFICATION
   Person places finger / face in front of device
   Device verifies against stored template in < 1 second
   Device generates a punch record: { user_id, timestamp, device_id }

STAGE 3 — TRANSMISSION
   Device sends punch record to your backend via HTTP Push (real-time)
   OR: Backend pulls records from device via ZKTeco SDK (scheduled polling)

STAGE 4 — PROCESSING
   Backend receives punch record
   Looks up biometric_enrollments table → finds student_id
   Creates attendance record: { student_id, date, time_in, status: present }
   Applies business rules: late threshold, half-day logic, duplicate check

STAGE 5 — NOTIFICATION & DISPLAY
   Parent receives SMS/email: 'Your child marked present at 09:02 AM'
   Admin dashboard updates in real time via WebSocket
   Student dashboard shows attendance marked


3.2 Visual Architecture
[Biometric Device — ZKTeco K40]
       |  HTTP Push (port 80)
       ↓
[POST /api/biometric/punch]  ← Public device endpoint
       |  Device secret key verification
       ↓
[BiometricController]
       |  → BiometricService
       |     → lookup biometric_enrollments (device_user_id → student_id)
       |     → check duplicate punch (same day)
       |     → apply late/half-day rules
       |     → INSERT into attendance table
       |     → emit WebSocket event
       |     → queue notification (email/SMS)
       ↓
[MySQL Database]
       ↓
[Admin Dashboard] ← real-time update via Socket.io
[Parent notification] ← Nodemailer / SMS

4. Database Design
4.1 New Tables Required

Table 1: biometric_devices
Registers every physical device installed in an institute.
Column	Type	Description
id	INT PK AI	Primary key
institute_id	INT FK	Which institute owns this device
device_name	VARCHAR(100)	e.g. 'Gate-1 Fingerprint'
device_serial	VARCHAR(100) UNIQUE	Device serial number from manufacturer
device_type	ENUM('fingerprint','face','rfid','mobile')	Type of biometric
location	VARCHAR(100)	e.g. 'Main Gate', 'Classroom Block A'
ip_address	VARCHAR(45)	Device LAN/WiFi IP for polling
secret_key	VARCHAR(255)	Auth token device uses to push data
status	ENUM('active','inactive','offline')	Device health
last_sync	DATETIME	Last successful data pull/push
created_at / updated_at	DATETIME	Timestamps


Table 2: biometric_enrollments
Maps a device's user ID to a student or faculty member.
Column	Type	Description
id	INT PK AI	Primary key
institute_id	INT FK	Institute scope
device_id	INT FK → biometric_devices	Which device holds this template
device_user_id	VARCHAR(50)	ID assigned ON the device (1, 2, 3...)
user_id	INT FK → users	SaaS platform user
user_role	ENUM('student','faculty')	Role of enrolled person
enrolled_at	DATETIME	When enrollment was done
enrolled_by	INT FK → users	Admin who performed enrollment
status	ENUM('active','inactive')	Can be deactivated without deleting


Table 3: biometric_punches (Raw Log)
Stores every raw punch received from devices — this is the source of truth.
Column	Type	Description
id	BIGINT PK AI	Primary key (BIGINT for high volume)
institute_id	INT FK	Institute scope
device_id	INT FK → biometric_devices	Which device sent this
device_user_id	VARCHAR(50)	Raw ID from device payload
punch_time	DATETIME	Exact timestamp from device
punch_type	ENUM('in','out','break')	Entry or exit
raw_payload	JSON	Full raw packet from device (for debugging)
processed	BOOLEAN DEFAULT false	Whether attendance was created from this
created_at	DATETIME	When server received it


Table 4: attendance (Updated — existing table)
Add these new columns to your existing attendance table:
New Column	Type	Description
marked_by_type	ENUM('manual','biometric','mobile_otp')	How attendance was recorded
biometric_punch_id	BIGINT FK → biometric_punches	Links to raw punch record
time_in	TIME	Actual check-in time
time_out	TIME	Actual check-out time (optional)
is_late	BOOLEAN DEFAULT false	Arrived after late threshold
late_by_minutes	INT	Minutes late (0 if on time)
is_half_day	BOOLEAN DEFAULT false	If time_in after half-day cutoff


Table 5: biometric_settings (Per Institute)
Column	Type	Description
institute_id	INT PK FK	Institute config
late_threshold_minutes	INT DEFAULT 15	Minutes after class start = late
half_day_threshold_minutes	INT DEFAULT 120	Minutes late = half day
working_days	JSON	e.g. ["Mon","Tue","Wed","Thu","Fri","Sat"]
class_start_time	TIME DEFAULT '09:00'	Morning class start
notify_parent_on_absent	BOOLEAN DEFAULT true	Auto notify parents
notify_parent_on_late	BOOLEAN DEFAULT false	Notify for late arrivals too
duplicate_punch_window_secs	INT DEFAULT 300	Ignore punches within N seconds

5. How Devices Communicate With Your Backend
5.1 Method 1 — HTTP Push (Recommended)
Most ZKTeco devices support ADMS (Attendance Data Management Service). The device is configured with your server URL, and it automatically pushes every punch in real time.

Device Configuration (one-time setup on the device)
Server Address:  https://yourapp.com
Server Port:     443 (HTTPS) or 80 (HTTP)
Device Number:   001  (matches device_serial in DB)
Push Interval:   Real-time (immediate)

Data pushed by ZKTeco device (sample payload):
{
  "sn": "CDK9191960001",      // device serial number
  "table": "ATTLOG",
  "Stamp": "9999",
  "OpStamp": "1699999999",
  "AttLog": {
    "pin": "42",               // device_user_id
    "time": "2025-03-09 09:05:12",
    "status": "0",             // 0=in, 1=out
    "verify": "1",             // 1=fingerprint, 4=password, 15=face
  }
}

Your backend endpoint receives this:
POST /api/biometric/punch
Headers: X-Device-Serial: CDK9191960001
         X-Device-Key: <secret_key>


5.2 Method 2 — Backend Polls Device (Alternative)
If the device does not support HTTP push (older models), your backend can poll the device using the ZKTeco Node.js SDK.

npm install zklib

// services/biometric.poller.js
const ZKLib = require('zklib');

const zk = new ZKLib('192.168.1.100', 4370, 10000);
await zk.createSocket();
const logs = await zk.getAttendances();
// logs = [{ deviceUserId, recordTime, type }]
await zk.disconnect();

A node-cron job runs this every 5–10 minutes and processes new punches.


5.3 Method 3 — Mobile OTP / QR Attendance (No Hardware)
For institutes that cannot afford hardware, this is the software-only alternative. Faculty generates a time-limited OTP or QR code. Students scan or enter it to mark attendance. Works via the existing frontend.

6. Implementation Phases
Phase 1 — Database Setup
Create all five new tables. Run migrations in this order:
1.	Create biometric_devices table
2.	Create biometric_enrollments table
3.	Create biometric_punches table (BIGINT PK for high volume)
4.	ALTER attendance table — add new columns
5.	Create biometric_settings table with defaults per institute
6.	Add indexes: CREATE INDEX idx_bp_device_time ON biometric_punches(device_id, punch_time)
7.	Add UNIQUE: (device_id, device_user_id) on biometric_enrollments


Phase 2 — Device Management API
Build CRUD for managing devices inside the admin dashboard.

Method	Endpoint	Auth	Description
GET	/api/biometric/devices	owner/manager	List all institute devices
POST	/api/biometric/devices	owner	Register new device
PUT	/api/biometric/devices/:id	owner	Update device info / IP
DELETE	/api/biometric/devices/:id	owner	Remove device
GET	/api/biometric/devices/:id/status	owner/manager	Check device online/offline
POST	/api/biometric/devices/:id/sync	owner/manager	Manually trigger data pull


Phase 3 — Enrollment API
Enrollment links a physical device user ID to a SaaS student or faculty record.

Method	Endpoint	Auth	Description
POST	/api/biometric/enroll	owner/manager	Enroll student/faculty on device
GET	/api/biometric/enrollments	owner/manager	List all enrollments
DELETE	/api/biometric/enrollments/:id	owner	Remove enrollment (deactivate)
GET	/api/biometric/enrollments/check/:userId	owner/manager	Check if user is enrolled

Enrollment flow:
8.	Admin opens Enrollment page — selects student from dropdown
9.	Admin physically goes to the device, registers fingerprint, notes the device user ID shown
10.	Admin enters that device_user_id in the SaaS form and submits
11.	Backend saves: { device_id, device_user_id: '42', user_id: 187 }
12.	From now on, when device sends punch for user '42', backend maps it to student 187


Phase 4 — Punch Receiver Endpoint
This is the most critical endpoint — it receives real-time data from devices.

POST /api/biometric/punch
// This endpoint must be:
// 1. Fast (< 100ms response so device doesn't timeout)
// 2. Always return 200 OK (device will retry if it gets error)
// 3. Validate device secret key before processing
// 4. Store raw punch in biometric_punches FIRST
// 5. Then process asynchronously (do not block response)

Security on this endpoint:
●	Verify X-Device-Serial matches a registered device in biometric_devices
●	Verify X-Device-Key matches the stored secret_key (bcrypt comparison)
●	Rate limit: max 10 punches/second per device
●	Always respond 200 quickly — process in background queue


Phase 5 — Punch Processing Service
This is the business logic layer that converts a raw punch into an attendance record.

// services/biometric.service.js  — processPunch()

async function processPunch(punch) {
  // 1. Find enrollment
  const enrollment = await BiometricEnrollment.findOne({
    where: { device_id: punch.device_id, device_user_id: punch.device_user_id }
  });
  if (!enrollment) return;  // Unknown user, skip

  // 2. Prevent duplicate punch
  const settings = await BiometricSettings.findOne({ where: { institute_id } });
  const recent = await BiometricPunch.findOne({
    where: { device_user_id, punch_time: { [Op.gte]: subSeconds(now, settings.duplicate_window) }}
  });
  if (recent) return;  // Duplicate, skip

  // 3. Calculate late / half-day
  const classStart = settings.class_start_time;
  const minsLate = diffMinutes(punch.punch_time, classStart);
  const isLate = minsLate > settings.late_threshold_minutes;
  const isHalfDay = minsLate > settings.half_day_threshold_minutes;

  // 4. Create attendance record
  await Attendance.create({
    student_id: enrollment.user_id,
    date: today(),
    status: isHalfDay ? 'half_day' : 'present',
    marked_by_type: 'biometric',
    biometric_punch_id: punch.id,
    time_in: punch.punch_time,
    is_late: isLate,
    late_by_minutes: Math.max(0, minsLate),
  });

  // 5. Emit WebSocket event
  io.to(`institute_${institute_id}`).emit('attendance:marked', {...});

  // 6. Queue parent notification if needed
  if (settings.notify_parent_on_late && isLate) {
    notificationQueue.add({ type: 'late_arrival', student_id });
  }
}


Phase 6 — Absent Detection (Cron Job)
A cron job runs at end of day to mark absent students who never punched in.

// Runs every day at 11:00 PM
cron.schedule('0 23 * * *', async () => {
  // 1. Get all enrolled students for active institutes
  // 2. Get students who have attendance today
  // 3. Subtract → students with no record = ABSENT
  // 4. INSERT absent records
  // 5. Send parent notifications for absent students
  // 6. Update analytics cache
});

This cron job ensures 100% attendance records for every enrolled student every school day.


Phase 7 — Real-Time Dashboard (WebSocket)
Use Socket.io to push attendance updates to the admin dashboard without page refresh.

Events emitted by backend:

Event Name	Payload	Who Receives
attendance:marked	{ student_name, time_in, class, is_late }	Admin + faculty of that class
attendance:absent_alert	{ student_id, student_name, class }	Admin
device:offline	{ device_id, device_name, last_seen }	Admin
device:punch_received	{ device_name, count_today }	Admin


Phase 8 — Attendance Analytics APIs

Method	Endpoint	Description
GET	/api/attendance/biometric/live	Today's live attendance count by class
GET	/api/attendance/biometric/class/:id	Class attendance % for date range
GET	/api/attendance/biometric/student/:id	Individual student attendance report
GET	/api/attendance/biometric/late-report	All late arrivals for a date range
GET	/api/attendance/biometric/absent-report	All absent students for a date range
GET	/api/biometric/devices/health	All device statuses (online/offline)


Phase 9 — Frontend Pages

Admin Pages
●	BiometricDevices.jsx — Register, manage, view device status
●	BiometricEnrollment.jsx — Enroll students and faculty on devices
●	LiveAttendance.jsx — Real-time today's attendance dashboard (WebSocket)
●	BiometricReports.jsx — Late/absent/present charts by class/date range
●	BiometricSettings.jsx — Configure late threshold, half-day, notification rules

Faculty Pages
●	ClassAttendanceView.jsx — Shows biometric attendance for their class (read-only)
●	ManualOverride.jsx — Faculty can correct a wrong biometric record with reason

Student Pages
●	MyAttendance.jsx — Calendar view with present/absent/late per day
●	AttendanceSummary.jsx — % present, % late, % absent cards

Parent Pages
●	ChildAttendance.jsx — Same as student view, read-only for parent
●	AttendanceAlerts.jsx — History of SMS/email alerts received


Phase 10 — Mobile OTP / QR Attendance (No-Hardware Option)
This runs as an alternative or supplement to hardware biometric. Useful for online students or institutes without devices yet.

Faculty Flow:
13.	Faculty opens MarkAttendance page
14.	Clicks 'Generate OTP' — backend creates 6-digit OTP valid for 5 minutes
15.	Faculty shows OTP on projector screen in classroom
16.	Students enter OTP in their Student Dashboard
17.	Backend validates OTP (not expired, not used twice), marks present

QR Code Flow:
18.	Backend generates time-limited signed QR code (JWT inside)
19.	Faculty displays QR on screen
20.	Student scans with mobile camera → opens app link → auto-marks attendance
21.	JWT in QR contains: class_id, expires_at, faculty_id — backend verifies all

Security for Mobile OTP / QR
OTP expires in 5 minutes — prevents sharing to absent students
One OTP use per student per class per day
QR token is signed with JWT_SECRET — cannot be forged
IP logging optional — detect if students sharing from same location
GPS verification optional — student must be within institute geofence


Phase 11 — Parent Notification System
Automatically notifies parents based on attendance events.

Event	Trigger Time	Channel	Message
Child marked PRESENT	Within 2 min of punch	Email + SMS (optional)	Your child [Name] has arrived at 09:02 AM
Child marked LATE	Within 2 min of punch	Email	Your child [Name] arrived late by 12 minutes today
Child marked ABSENT	11:00 PM cron	Email + SMS	Your child [Name] was absent today
Child ABSENT 3 days consecutive	Cron — rolling 3 days	Email	Alert: [Name] has been absent for 3 consecutive days
Attendance < 75%	Weekly — every Monday	Email	Monthly attendance report — current: 68%


Phase 12 — Reports & Exports
All attendance data should be exportable in multiple formats.

●	Excel export — monthly attendance sheet per class (admin)
●	PDF report — individual student attendance certificate
●	CSV — raw punch logs for auditing
●	In-app chart — monthly attendance % bar chart per class
●	Heatmap calendar — student attendance heatmap (like GitHub contribution graph)

7. Complete Validation Rules

Validation	Rule	Error Message
Duplicate punch	Ignore punches from same user within 5 minutes	Duplicate punch ignored
Unknown device	Reject punch if device_serial not in biometric_devices	Unregistered device
Invalid device key	Reject if X-Device-Key doesn't match stored secret	Unauthorized device
Unknown enrollment	If device_user_id not in biometric_enrollments, skip	User not enrolled
Already present today	If attendance already exists as 'present' today, skip	Already marked present
Non-working day	If punch on Sunday/holiday, log but don't create attendance	Non-working day punch
Enrollment duplicate	UNIQUE constraint on (device_id, device_user_id)	User already enrolled on this device
Enrollment user type	Only role='student' or 'faculty' can be enrolled	Invalid user role for enrollment
OTP expired	OTP valid for 5 minutes only	OTP has expired
OTP reuse	One OTP use per student per class per day	Attendance already marked
QR token tampering	Verify JWT signature on QR scan	Invalid or tampered QR code
Institute isolation	device_id must belong to req.user.institute_id	Device not found
Device offline	Alert admin if no punch received in 30+ minutes during school hours	Device offline warning

8. Role Permission Matrix — Biometric Module

Feature	Super Admin	Owner	Manager	Faculty	Student	Parent
Register biometric device	❌	✅	❌	❌	❌	❌
View device list	✅	✅	✅	❌	❌	❌
Enroll students	❌	✅	✅	❌	❌	❌
View enrollments	❌	✅	✅	❌	❌	❌
View live attendance	❌	✅	✅	Own class	❌	❌
Manual attendance override	❌	✅	✅	Own class	❌	❌
Configure late threshold	❌	✅	❌	❌	❌	❌
View own attendance	❌	❌	❌	❌	✅	Child
Receive absent notifications	❌	✅	✅	❌	❌	✅
Export attendance reports	❌	✅	✅	Own class	❌	❌
View late reports	❌	✅	✅	Own class	❌	❌
Generate OTP / QR	❌	❌	❌	✅	❌	❌

9. Security Considerations

Risk	Attack Scenario	Defense
Fake device punch	Someone sends crafted HTTP request pretending to be a device	Validate device secret_key on every request
Replay attack	Attacker replays an old punch packet	Store raw_payload hash, reject duplicates; check punch_time is within 60 sec of server time
Enrollment tampering	Admin enrolls wrong student on device	Audit log all enrollment actions with enrolled_by and timestamp
OTP sharing	Student shares OTP with absent friend	OTP expires in 5 min; one-time use; optional IP/GPS check
Mass absent injection	Bug or malicious cron marks everyone absent	Absent cron is idempotent; only inserts if record doesn't already exist
Device theft	Physical device stolen	Deactivate device via admin panel; all enrollments on that device stop working
biometric_punches bloat	High-volume device fills table	Partition biometric_punches by month; archive logs older than 12 months

10. Required Packages & Tools

Package	Purpose	Install Command
zklib	Communicate with ZKTeco devices via SDK	npm install zklib
socket.io	Real-time WebSocket for live dashboard	npm install socket.io
socket.io-client	Frontend WebSocket client	npm install socket.io-client
node-cron	Absent detection cron job (already installed)	Already in backend package.json
multer	Handle any file uploads (QR images etc.)	npm install multer
qrcode	Generate QR codes for QR attendance	npm install qrcode
date-fns	Date math (late minutes, half-day calc)	npm install date-fns
bull	Background job queue for notifications	npm install bull
redis	Bull queue backend + caching analytics	npm install ioredis
exceljs	Export attendance to Excel	npm install exceljs

11. Summary — Phase Execution Order

#	Phase	What You Build	Outcome
1	Database Setup	5 new tables + alter attendance	Schema ready
2	Device Management API	CRUD for biometric_devices	Devices registered
3	Enrollment API	Link device user IDs to students	Users mapped
4	Punch Receiver Endpoint	POST /api/biometric/punch — fast endpoint	Device can push data
5	Punch Processing Service	Late/half-day logic, attendance creation	Attendance auto-created
6	Absent Detection Cron	Nightly job marks unrecorded students absent	100% records every day
7	Real-Time Dashboard	Socket.io events to admin frontend	Live attendance view
8	Analytics APIs	Reports, late list, absent list	Data for dashboards
9	Frontend Pages	Devices, Enrollment, LiveAttendance, Reports pages	Full UI complete
10	Mobile OTP / QR	No-hardware attendance option	Works for online classes
11	Parent Notifications	Email/SMS on absent/late events	Parent engagement
12	Reports & Exports	Excel/PDF export, heatmap charts	Commercial-grade reports


Final Result — After All 12 Phases
✅  Automatic, tamper-proof biometric attendance via ZKTeco hardware
✅  Mobile OTP / QR option for institutes without hardware
✅  Real-time live dashboard with WebSocket updates
✅  Late arrival detection with configurable threshold
✅  Automatic absent marking via nightly cron job
✅  Parent SMS/email notifications within 2 minutes of punch
✅  Excel/PDF report exports for compliance
✅  Full role-based access control (Owner → Manager → Faculty → Student → Parent)
✅  Multi-tenant isolated — each institute's data fully separated

Product Level After This Feature:  Enterprise School/Coaching ERP SaaS

