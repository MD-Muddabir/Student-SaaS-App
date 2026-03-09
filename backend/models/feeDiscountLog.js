const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const FeeDiscountLog = sequelize.define("FeeDiscountLog", {
    institute_id: { type: DataTypes.INTEGER, allowNull: false },
    student_fee_id: { type: DataTypes.INTEGER, allowNull: false },
    discount_amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    reason: { type: DataTypes.STRING, allowNull: false },
    approved_by: { type: DataTypes.INTEGER, allowNull: false },
    approved_role: { type: DataTypes.STRING, allowNull: false }
}, {
    tableName: "fee_discount_logs",
    timestamps: true,
    updatedAt: false // usually logs only need createdAt
});

module.exports = FeeDiscountLog;
