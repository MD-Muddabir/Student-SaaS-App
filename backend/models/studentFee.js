const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const StudentFee = sequelize.define("StudentFee", {
    institute_id: { type: DataTypes.INTEGER, allowNull: false },
    student_id: { type: DataTypes.INTEGER, allowNull: false },
    class_id: { type: DataTypes.INTEGER, allowNull: true },
    fee_structure_id: { type: DataTypes.INTEGER, allowNull: false },
    original_amount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    discount_amount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    final_amount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    paid_amount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    due_amount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    status: { type: DataTypes.ENUM("pending", "partial", "paid"), defaultValue: "pending" },
    created_by: { type: DataTypes.INTEGER, allowNull: true },
    reminder_date: { type: DataTypes.DATEONLY, allowNull: true }
}, {
    tableName: "student_fees",
    timestamps: true
});

module.exports = StudentFee;
