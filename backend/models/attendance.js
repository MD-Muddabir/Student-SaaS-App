const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Attendance = sequelize.define("Attendance", {
    institute_id: DataTypes.INTEGER,
    student_id: DataTypes.INTEGER,
    class_id: DataTypes.INTEGER,
    subject_id: DataTypes.INTEGER,
    date: DataTypes.DATEONLY,
    status: DataTypes.ENUM("present", "absent", "late", "holiday"),
    marked_by: DataTypes.INTEGER,
    remarks: DataTypes.TEXT,
}, {
    tableName: "attendances",
    timestamps: true,
    underscored: true,
    indexes: [
        {
            // Named index — Sequelize tracks by name, preventing duplicates on restart
            name: "attendance_unique_daily",
            unique: true,
            fields: ["institute_id", "student_id", "class_id", "date", "subject_id"]
        }
    ]
});

module.exports = Attendance;
