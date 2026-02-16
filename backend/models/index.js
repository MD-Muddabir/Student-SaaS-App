const sequelize = require("../config/database");

const Plan = require("./plan");
const Institute = require("./institute");
const User = require("./user");
const Class = require("./class");
const Student = require("./student");
const Faculty = require("./faculty");
const Subject = require("./subject");
const Attendance = require("./attendance");
const FeesStructure = require("./feesStructure");
const Payment = require("./payment");
const Announcement = require("./announcement");
const Exam = require("./exam");
const Mark = require("./mark");
const Subscription = require("./subscription");

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

Class.hasMany(Student, { foreignKey: "class_id" });
Student.belongsTo(Class, { foreignKey: "class_id" });

Faculty.hasMany(Subject, { foreignKey: "faculty_id" });
Subject.belongsTo(Faculty, { foreignKey: "faculty_id" });

Class.hasMany(Subject, { foreignKey: "class_id" });
Subject.belongsTo(Class, { foreignKey: "class_id" });

Exam.hasMany(Mark, { foreignKey: "exam_id" });
Mark.belongsTo(Exam, { foreignKey: "exam_id" });

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

// Payment Associations
Payment.belongsTo(Student, { foreignKey: "student_id" });
Student.hasMany(Payment, { foreignKey: "student_id" });

Payment.belongsTo(Institute, { foreignKey: "institute_id" });
Institute.hasMany(Payment, { foreignKey: "institute_id" });

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
};
