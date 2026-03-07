const sequelize = require("../config/database");

// Relationships: The connections between tables (like "One User belongs to One Institute")

const Plan = require("./plan");
const Institute = require("./institute");
const User = require("./user");
const Class = require("./class");
const Student = require("./student");
const Faculty = require("./faculty");
const Subject = require("./subject");
const Attendance = require("./attendance");
const FacultyAttendance = require("./facultyAttendance");
const FeesStructure = require("./feesStructure");
const Payment = require("./payment");
const Announcement = require("./announcement");
const Exam = require("./exam");
const Mark = require("./mark");
const Subscription = require("./subscription");
const StudentSubject = require("./studentSubject");
const StudentClass = require("./studentClass");
const ClassSession = require("./classSession");
const Expense = require("./expense");
const TimetableSlot = require("./timetableSlot");
const Timetable = require("./timetable");
const TransportFee = require("./transportFee");
const StudentFee = require("./studentFee");
const FeeDiscountLog = require("./feeDiscountLog");
const Note = require("./note");
const NoteDownload = require("./noteDownload");
const ChatRoom = require("./chatRoom");
const ChatMessage = require("./chatMessage");
const ChatParticipant = require("./chatParticipant");

// Associations

Plan.hasMany(Subscription, { foreignKey: "plan_id" });
Subscription.belongsTo(Plan, { foreignKey: "plan_id" });

Plan.hasMany(Institute, { foreignKey: "plan_id" });
Institute.belongsTo(Plan, { foreignKey: "plan_id" });

Institute.hasMany(User, { foreignKey: "institute_id" });
User.belongsTo(Institute, { foreignKey: "institute_id" });

Institute.hasMany(Class, { foreignKey: "institute_id" });
Class.belongsTo(Institute, { foreignKey: "institute_id" });

Institute.hasMany(Student, { foreignKey: "institute_id" });
Student.belongsTo(Institute, { foreignKey: "institute_id" });

Institute.hasMany(Faculty, { foreignKey: "institute_id" });
Faculty.belongsTo(Institute, { foreignKey: "institute_id" });

Student.belongsToMany(Class, { through: StudentClass, foreignKey: "student_id" });
Class.belongsToMany(Student, { through: StudentClass, foreignKey: "class_id" });

Faculty.hasMany(Subject, { foreignKey: "faculty_id" });
Subject.belongsTo(Faculty, { foreignKey: "faculty_id" });

Class.hasMany(Subject, { foreignKey: "class_id" });
Subject.belongsTo(Class, { foreignKey: "class_id" });

Student.belongsToMany(Subject, { through: StudentSubject, foreignKey: "student_id" });
Subject.belongsToMany(Student, { through: StudentSubject, foreignKey: "subject_id" });

Exam.hasMany(Mark, { foreignKey: "exam_id" });
Mark.belongsTo(Exam, { foreignKey: "exam_id" });

Institute.hasMany(Exam, { foreignKey: "institute_id" });
Exam.belongsTo(Institute, { foreignKey: "institute_id" });

Class.hasMany(Exam, { foreignKey: "class_id" });
Exam.belongsTo(Class, { foreignKey: "class_id" });

Subject.hasMany(Exam, { foreignKey: "subject_id" });
Exam.belongsTo(Subject, { foreignKey: "subject_id" });

Student.hasMany(Mark, { foreignKey: "student_id" });
Mark.belongsTo(Student, { foreignKey: "student_id" });

Institute.hasMany(Mark, { foreignKey: "institute_id" });
Mark.belongsTo(Institute, { foreignKey: "institute_id" });

Subject.hasMany(Mark, { foreignKey: "subject_id" });
Mark.belongsTo(Subject, { foreignKey: "subject_id" });

// User <-> Faculty Association
User.hasOne(Faculty, { foreignKey: "user_id" });
Faculty.belongsTo(User, { foreignKey: "user_id" });

// User <-> Student Association
User.hasOne(Student, { foreignKey: "user_id" });
Student.belongsTo(User, { foreignKey: "user_id" });

// Fees Structure Associations
FeesStructure.belongsTo(Class, { foreignKey: "class_id" });
Class.hasMany(FeesStructure, { foreignKey: "class_id" });

FeesStructure.belongsTo(Institute, { foreignKey: "institute_id" });
Institute.hasMany(FeesStructure, { foreignKey: "institute_id" });

FeesStructure.belongsTo(Subject, { foreignKey: "subject_id" });
Subject.hasMany(FeesStructure, { foreignKey: "subject_id" });

// Payment Associations
Payment.belongsTo(Student, { foreignKey: "student_id" });
Student.hasMany(Payment, { foreignKey: "student_id" });

Payment.belongsTo(Institute, { foreignKey: "institute_id" });
Institute.hasMany(Payment, { foreignKey: "institute_id" });

Payment.belongsTo(FeesStructure, { foreignKey: "fee_structure_id" });
FeesStructure.hasMany(Payment, { foreignKey: "fee_structure_id" });

Payment.belongsTo(User, { as: "collector", foreignKey: "collected_by" });
User.hasMany(Payment, { foreignKey: "collected_by" });

// StudentFee Associations
StudentFee.belongsTo(Student, { foreignKey: "student_id" });
Student.hasMany(StudentFee, { foreignKey: "student_id" });

StudentFee.belongsTo(Class, { foreignKey: "class_id" });
Class.hasMany(StudentFee, { foreignKey: "class_id" });

StudentFee.belongsTo(FeesStructure, { foreignKey: "fee_structure_id" });
FeesStructure.hasMany(StudentFee, { foreignKey: "fee_structure_id" });

StudentFee.belongsTo(Institute, { foreignKey: "institute_id" });
Institute.hasMany(StudentFee, { foreignKey: "institute_id" });

// FeeDiscountLog Associations
FeeDiscountLog.belongsTo(StudentFee, { foreignKey: "student_fee_id" });
StudentFee.hasMany(FeeDiscountLog, { foreignKey: "student_fee_id" });

FeeDiscountLog.belongsTo(User, { as: "approver", foreignKey: "approved_by" });
User.hasMany(FeeDiscountLog, { foreignKey: "approved_by" });

FeeDiscountLog.belongsTo(Institute, { foreignKey: "institute_id" });
Institute.hasMany(FeeDiscountLog, { foreignKey: "institute_id" });

// Announcement Associations
Announcement.belongsTo(User, { as: "creator", foreignKey: "created_by" });
User.hasMany(Announcement, { foreignKey: "created_by" });

Announcement.belongsTo(Institute, { foreignKey: "institute_id" });
Institute.hasMany(Announcement, { foreignKey: "institute_id" });

Announcement.belongsTo(Subject, { foreignKey: "subject_id" });
Subject.hasMany(Announcement, { foreignKey: "subject_id" });

// Attendance Associations
Attendance.belongsTo(Student, { foreignKey: "student_id" });
Student.hasMany(Attendance, { foreignKey: "student_id" });

Attendance.belongsTo(Class, { foreignKey: "class_id" });
Class.hasMany(Attendance, { foreignKey: "class_id" });

Attendance.belongsTo(Subject, { foreignKey: "subject_id" });
Subject.hasMany(Attendance, { foreignKey: "subject_id" });

Attendance.belongsTo(Institute, { foreignKey: "institute_id" });
Institute.hasMany(Attendance, { foreignKey: "institute_id" });

Attendance.belongsTo(User, { as: "marker", foreignKey: "marked_by" });
User.hasMany(Attendance, { foreignKey: "marked_by" });

// Faculty Attendance Associations
FacultyAttendance.belongsTo(Faculty, { foreignKey: "faculty_id" });
Faculty.hasMany(FacultyAttendance, { foreignKey: "faculty_id" });

FacultyAttendance.belongsTo(Institute, { foreignKey: "institute_id" });
Institute.hasMany(FacultyAttendance, { foreignKey: "institute_id" });

FacultyAttendance.belongsTo(User, { as: "marker", foreignKey: "marked_by" });
User.hasMany(FacultyAttendance, { foreignKey: "marked_by" });

// Subscription Associations
Institute.hasMany(Subscription, { foreignKey: "institute_id" });
Subscription.belongsTo(Institute, { foreignKey: "institute_id" });

// ClassSession Associations
ClassSession.belongsTo(Institute, { foreignKey: "institute_id" });
Institute.hasMany(ClassSession, { foreignKey: "institute_id" });

ClassSession.belongsTo(Class, { foreignKey: "class_id" });
Class.hasMany(ClassSession, { foreignKey: "class_id" });

// Expense Associations
Institute.hasMany(Expense, { foreignKey: "institute_id" });
Expense.belongsTo(Institute, { foreignKey: "institute_id" });

Expense.belongsTo(User, { as: "creator", foreignKey: "created_by" });
User.hasMany(Expense, { foreignKey: "created_by" });

// TransportFee Associations
TransportFee.belongsTo(Institute, { foreignKey: "institute_id" });
Institute.hasMany(TransportFee, { foreignKey: "institute_id" });

TransportFee.belongsTo(User, { as: "creator", foreignKey: "created_by" });
User.hasMany(TransportFee, { foreignKey: "created_by" });

ClassSession.belongsTo(Subject, { foreignKey: "subject_id" });
Subject.hasMany(ClassSession, { foreignKey: "subject_id" });

ClassSession.belongsTo(User, { as: "faculty", foreignKey: "faculty_id" });
User.hasMany(ClassSession, { foreignKey: "faculty_id" });

// Timetable Associations
TimetableSlot.belongsTo(Institute, { foreignKey: "institute_id" });
Institute.hasMany(TimetableSlot, { foreignKey: "institute_id" });

Timetable.belongsTo(Institute, { foreignKey: "institute_id" });
Institute.hasMany(Timetable, { foreignKey: "institute_id" });

Timetable.belongsTo(Class, { foreignKey: "class_id" });
Class.hasMany(Timetable, { foreignKey: "class_id" });

Timetable.belongsTo(Subject, { foreignKey: "subject_id" });
Subject.hasMany(Timetable, { foreignKey: "subject_id" });

Timetable.belongsTo(Faculty, { foreignKey: "faculty_id" });
Faculty.hasMany(Timetable, { foreignKey: "faculty_id" });

Timetable.belongsTo(TimetableSlot, { foreignKey: "slot_id" });
TimetableSlot.hasMany(Timetable, { foreignKey: "slot_id" });

Timetable.belongsTo(User, { as: "creator", foreignKey: "created_by" });
User.hasMany(Timetable, { foreignKey: "created_by" });

// Note Associations
Note.belongsTo(Institute, { foreignKey: "institute_id" });
Institute.hasMany(Note, { foreignKey: "institute_id" });

Note.belongsTo(Faculty, { foreignKey: "faculty_id" });
Faculty.hasMany(Note, { foreignKey: "faculty_id" });

Note.belongsTo(Class, { foreignKey: "class_id" });
Class.hasMany(Note, { foreignKey: "class_id" });

Note.belongsTo(Subject, { foreignKey: "subject_id" });
Subject.hasMany(Note, { foreignKey: "subject_id" });

NoteDownload.belongsTo(Note, { foreignKey: "note_id" });
Note.hasMany(NoteDownload, { foreignKey: "note_id" });

NoteDownload.belongsTo(Student, { foreignKey: "student_id" });
Student.hasMany(NoteDownload, { foreignKey: "student_id" });

// Chat Associations
ChatRoom.belongsTo(Institute, { foreignKey: "institute_id" });
Institute.hasMany(ChatRoom, { foreignKey: "institute_id" });

ChatRoom.belongsTo(Class, { foreignKey: "class_id" });
Class.hasMany(ChatRoom, { foreignKey: "class_id" });

ChatRoom.belongsTo(Subject, { foreignKey: "subject_id" });
Subject.hasMany(ChatRoom, { foreignKey: "subject_id" });

ChatRoom.belongsTo(Faculty, { foreignKey: "faculty_id" });
Faculty.hasMany(ChatRoom, { foreignKey: "faculty_id" });

ChatMessage.belongsTo(ChatRoom, { foreignKey: "room_id" });
ChatRoom.hasMany(ChatMessage, { foreignKey: "room_id" });

ChatMessage.belongsTo(User, { as: "sender", foreignKey: "sender_id" });
User.hasMany(ChatMessage, { foreignKey: "sender_id" });

ChatParticipant.belongsTo(ChatRoom, { foreignKey: "room_id" });
ChatRoom.hasMany(ChatParticipant, { foreignKey: "room_id" });

ChatParticipant.belongsTo(User, { foreignKey: "user_id" });
User.hasMany(ChatParticipant, { foreignKey: "user_id" });

module.exports = {
    sequelize,
    Plan,
    Institute,
    User,
    Class,
    Student,
    Faculty,
    Subject,
    Attendance,
    FeesStructure,
    Payment,
    Announcement,
    Exam,
    Mark,
    Subscription,
    StudentSubject,
    StudentClass,
    ClassSession,
    Expense,
    TimetableSlot,
    Timetable,
    FacultyAttendance,
    TransportFee,
    StudentFee,
    FeeDiscountLog,
    Note,
    NoteDownload,
    ChatRoom,
    ChatMessage,
    ChatParticipant
};
